"""Import the authored site_update build into Django source directories.

The incoming files are treated as a reference build. This script extracts the
HTML, CSS, and real UI script, removes review/bundler-only runtime code, and
copies only referenced public assets.
"""

from __future__ import annotations

import re
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "site_update"
TEMPLATES = ROOT / "website" / "templates" / "website"
STATIC = ROOT / "website" / "static" / "website"
ASSETS = STATIC / "assets"


def extract(pattern: str, text: str, label: str) -> str:
    match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
    if not match:
        raise RuntimeError(f"could not find {label}")
    return match.group(1)


def static_refs(text: str) -> set[str]:
    return set(re.findall(r'(?:src|href)=["\'](assets/[^"\'#?]+)', text))


def clean_css(css: str) -> str:
    css = re.sub(r"^\.mockctl[^\n]*\n", "", css, flags=re.MULTILINE)
    css = re.sub(r"^@media print\{\.mockctl\{display:none\}\}\n", "", css, flags=re.MULTILINE)
    css = css.replace("image-slot", ".slot-image")
    return css.strip() + "\n"


def clean_script(script: str) -> str:
    script = re.sub(
        r"\n\s*/\* backdrop controls \(review chrome.*?\n\s*/\* brand mark:",
        "\n\n  /* brand mark:",
        script,
        flags=re.DOTALL,
    )
    script = re.sub(
        r"\n\s*var paperSel =.*?\n\s*/\* service breakouts \*/",
        "\n\n  /* service breakouts */",
        script,
        flags=re.DOTALL,
    )
    script = script.replace('"assets/4eyes-animation-loop.gif"', '"/static/website/assets/4eyes-animation-loop.gif"')
    return script.strip() + "\n"


def clean_body(body: str) -> str:
    body = re.sub(r"\s*<div class=\"mockctl\".*?</div>\s*", "\n", body, flags=re.DOTALL)
    body = re.sub(r"\s*<script[^>]*image-slot\.js[^>]*></script>\s*", "\n", body, flags=re.DOTALL)
    body = re.sub(r"\s*<script[^>]*>.*?</script>\s*", "\n", body, flags=re.DOTALL)
    body = re.sub(r"<span class=\"dropnote\">.*?</span>", "", body, flags=re.DOTALL)
    body = re.sub(
        r'<image-slot\s+([^>]*?)\s+src="([^"]+)"[^>]*></image-slot>',
        lambda m: f'<img class="slot-image" src="{m.group(2)}" alt="">',
        body,
        flags=re.DOTALL,
    )
    body = body.replace('href="index.html"', 'href="{% url \'home\' %}"')
    body = body.replace('href="responsible-disclosure.html"', 'href="{% url \'responsible-disclosure\' %}"')
    body = body.replace('href=".well-known/security.txt"', 'href="{% url \'security-txt\' %}"')
    body = re.sub(r'(?P<attr>\b(?:src|href)=")assets/([^"?]+)', r"\g<attr>{% static 'website/assets/\2' %}", body)
    return body.strip() + "\n"


def import_page(filename: str, css_name: str, js_name: str | None = None) -> tuple[str, set[str]]:
    source = (SOURCE / filename).read_text()
    style = extract(r"<style[^>]*>(.*?)</style>", source, f"style in {filename}")
    body = extract(r"<body[^>]*>(.*?)</body>", source, f"body in {filename}")
    if js_name:
        script = extract(r"<script>(.*?)</script>", source, f"script in {filename}")
        (STATIC / "js").mkdir(parents=True, exist_ok=True)
        (STATIC / "js" / js_name).write_text(clean_script(script))
    (STATIC / "css").mkdir(parents=True, exist_ok=True)
    (STATIC / "css" / css_name).write_text(clean_css(style))
    return clean_body(body), static_refs(source)


def main() -> None:
    TEMPLATES.mkdir(parents=True, exist_ok=True)
    ASSETS.mkdir(parents=True, exist_ok=True)

    home_body, home_refs = import_page("index.html", "site.css", "main.js")
    disclosure_body, disclosure_refs = import_page("responsible-disclosure.html", "disclosure.css")

    (TEMPLATES / "home.html").write_text(
        "{% extends 'website/base.html' %}\n{% load static %}\n\n"
        "{% block content %}\n" + home_body + "{% endblock %}\n"
    )
    (TEMPLATES / "responsible_disclosure.html").write_text(
        "{% extends 'website/base.html' %}\n{% load static %}\n\n"
        "{% block extra_css %}<link rel=\"stylesheet\" href=\"{% static 'website/css/disclosure.css' %}\">{% endblock %}\n"
        "{% block content %}\n" + disclosure_body + "{% endblock %}\n"
    )

    refs = home_refs | disclosure_refs | {"assets/.well-known/security.txt"}
    copied = []
    for ref in sorted(refs):
        relative = Path(ref.removeprefix("assets/"))
        source = SOURCE / ref
        if not source.exists():
            if ref == "assets/.well-known/security.txt":
                source = SOURCE / ".well-known" / "security.txt"
            else:
                raise RuntimeError(f"referenced asset is missing: {ref}")
        destination = ASSETS / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
        copied.append(str(relative))

    print(f"wrote homepage template and disclosure template")
    print(f"copied {len(copied)} public assets")
    print(f"assets: {', '.join(copied)}")


if __name__ == "__main__":
    main()
