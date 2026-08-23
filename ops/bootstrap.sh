#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y python3-venv python3-pip nginx curl snapd openssl
systemctl enable --now snapd.socket
snap wait system seed.loaded || true
snap install aws-cli --classic || true

id -u 4eyes >/dev/null 2>&1 || useradd --system --home /opt/4eyes --create-home --shell /usr/sbin/nologin 4eyes
install -d -o 4eyes -g 4eyes /opt/4eyes/releases
install -d -o root -g root -m 0750 /etc/4eyes

if [ ! -f /etc/4eyes/4eyes.env ]; then
  umask 077
  secret=$(openssl rand -base64 48 | tr -d '\n')
  cat > /etc/4eyes/4eyes.env <<EOF
DJANGO_SECRET_KEY=$secret
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=4eyesforensics.com,www.4eyesforensics.com,localhost,127.0.0.1
DJANGO_CSRF_TRUSTED_ORIGINS=https://4eyesforensics.com,https://www.4eyesforensics.com
DJANGO_SECURE_SSL_REDIRECT=False
EOF
  chown root:4eyes /etc/4eyes/4eyes.env
  chmod 0640 /etc/4eyes/4eyes.env
fi

cat > /usr/local/bin/4eyes-deploy <<'SCRIPT'
#!/usr/bin/env bash
set -euo pipefail
bucket="${1:?artifact bucket required}"
sha="${2:?release sha required}"
release="/opt/4eyes/releases/${sha}"
mkdir -p "${release}"
chown -R 4eyes:4eyes "${release}"
aws_bin=$(command -v aws || echo /snap/bin/aws)
"${aws_bin}" s3 cp "s3://${bucket}/releases/${sha}.tgz" "/tmp/4eyes-${sha}.tgz"
tar -xzf "/tmp/4eyes-${sha}.tgz" -C "${release}"
python3 -m venv "${release}/.venv"
"${release}/.venv/bin/pip" install --no-cache-dir -r "${release}/requirements.txt"
mkdir -p "${release}/staticfiles"
cd "${release}"
"${release}/.venv/bin/python" manage.py migrate --noinput
"${release}/.venv/bin/python" manage.py collectstatic --noinput
sed -i 's/^DJANGO_ALLOWED_HOSTS=.*/DJANGO_ALLOWED_HOSTS=4eyesforensics.com,www.4eyesforensics.com,localhost,127.0.0.1/' /etc/4eyes/4eyes.env
sed -i 's|^DJANGO_CSRF_TRUSTED_ORIGINS=.*|DJANGO_CSRF_TRUSTED_ORIGINS=https://4eyesforensics.com,https://www.4eyesforensics.com|' /etc/4eyes/4eyes.env
if ! grep -q '^DJANGO_SECURE_SSL_REDIRECT=' /etc/4eyes/4eyes.env; then
  echo 'DJANGO_SECURE_SSL_REDIRECT=False' >> /etc/4eyes/4eyes.env
fi
ln -sfn "${release}" /opt/4eyes/current
chown -R 4eyes:4eyes "${release}"
systemctl daemon-reload
systemctl enable 4eyes-gunicorn
systemctl restart 4eyes-gunicorn
rm -f "/tmp/4eyes-${sha}.tgz"
SCRIPT
chmod 0755 /usr/local/bin/4eyes-deploy

cat > /etc/systemd/system/4eyes-gunicorn.service <<'EOF'
[Unit]
Description=4Eyes Forensics Gunicorn
After=network.target

[Service]
User=4eyes
Group=4eyes
WorkingDirectory=/opt/4eyes/current
EnvironmentFile=/etc/4eyes/4eyes.env
ExecStart=/opt/4eyes/current/.venv/bin/gunicorn config.wsgi:application --bind 127.0.0.1:8000 --workers 2 --access-logfile -
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/nginx/sites-available/4eyes <<'EOF'
server {
    listen 80 default_server;
    server_name 4eyesforensics.com www.4eyesforensics.com;
    server_tokens off;

    location /static/ {
        alias /opt/4eyes/current/staticfiles/;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass http://127.0.0.1:8000;
    }
}
EOF
rm -f /etc/nginx/sites-enabled/default
ln -sfn /etc/nginx/sites-available/4eyes /etc/nginx/sites-enabled/4eyes
nginx -t
systemctl enable nginx
systemctl restart nginx
