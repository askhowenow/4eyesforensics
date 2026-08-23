# 4Eyes Forensics

This project wraps the supplied `4eyes-forensics.html` artifact in a minimal Django application. The artifact remains the source of truth for the page's visual design, content, and client-side interactions.

## Run locally

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py runserver
```

Open <http://127.0.0.1:8000/>.

The Django view intentionally renders the artifact directly so its bundled runtime, inline styles, SVGs, and JavaScript remain unchanged.

## Project structure

- `config/` — Django settings, URLs, and WSGI entrypoint
- `website/` — page and health endpoint views/tests
- `reference/` — preserved original HTML prototype
- `infra/terraform/` — isolated AWS production origin
- `.github/workflows/deploy.yml` — test, package, and SSM deployment pipeline

## Environment variables

Copy `.env.example` for local configuration. Production settings use `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, and `DJANGO_CSRF_TRUSTED_ORIGINS`; production secrets are generated on the EC2 host and are not stored in Git.

## Tests and deployment

```bash
python3 manage.py check
python3 manage.py test
python3 manage.py collectstatic --noinput
```

The production architecture is a dedicated Ubuntu EC2 instance behind Nginx and Gunicorn. Releases are immutable tarballs in a private, encrypted, versioned S3 bucket. GitHub Actions authenticates to AWS with GitHub OIDC, then uses SSM Session Manager to deploy; the instance has no SSH ingress. The initial application uses SQLite only because it has no persistent application data yet; a managed database should be introduced before adding stateful features.

After Terraform apply, configure these production repository variables for the workflow:

- `AWS_DEPLOY_ROLE_ARN` — Terraform `github_deploy_role_arn` output
- `ARTIFACT_BUCKET` — Terraform `artifact_bucket` output
- `EC2_INSTANCE_ID` — Terraform `instance_id` output

The liveness endpoint is `/api/health/` and returns `{"status":"ok"}` without system details. Cloudflare is intentionally not configured by this project; use the EC2 public IP as the origin until DNS is added manually.
