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
