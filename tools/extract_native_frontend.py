"""Extract the authored page from the bundled reference artifact.

This is a one-time, deterministic migration helper. The original artifact is
never modified; it remains the visual recovery reference in reference/.
"""

import base64
import gzip
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "4eyes-forensics.html"
TEMPLATE_DIR = ROOT / "website" / "templates" / "website"
STATIC_DIR = ROOT / "website" / "static" / "website"
IMAGE_DIR = STATIC_DIR / "images"


def script_payload(source: str, script_type: str) -> str:
    match = re.search(
        rf'<script type="{re.escape(script_type)}">\s*(.*?)\s*</script>',
        source,
        re.DOTALL,
    )
    if not match:
        raise RuntimeError(f"missing bundled payload: {script_type}")
    return match.group(1)


def asset_filename(uuid: str, mime: str) -> str:
    suffix = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/webp": ".webp",
        "image/avif": ".avif",
    }.get(mime, ".bin")
    return f"asset-{uuid}{suffix}"


def main() -> None:
    raw = SOURCE.read_text()
    manifest = json.loads(script_payload(raw, "__bundler/manifest"))
    page = json.loads(script_payload(raw, "__bundler/template"))

    TEMPLATE_DIR.mkdir(parents=True, exist_ok=True)
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)

    asset_paths = {}
    for uuid, entry in manifest.items():
        if not entry["mime"].startswith("image/"):
            continue
        data = base64.b64decode(entry["data"])
        if entry.get("compressed"):
            data = gzip.decompress(data)
        filename = asset_filename(uuid, entry["mime"])
        (IMAGE_DIR / filename).write_bytes(data)
        asset_paths[uuid] = f"/static/website/images/{filename}"

    style_blocks = re.findall(r"<style>(.*?)</style>", page, re.DOTALL)
    css = "\n\n".join(style_blocks)
    css = re.sub(r"\bimage-slot\b", ".slot-image", css)
    (STATIC_DIR / "css").mkdir(parents=True, exist_ok=True)
    (STATIC_DIR / "css" / "site.css").write_text(css.strip() + "\n")

    scripts = re.findall(r"<script(?:[^>]*)>(.*?)</script>", page, re.DOTALL)
    page_script = next((s for s in scripts if "smooth jumps" in s), "")
    # The page script's slotState poll only served the prototype image-slot
    # editor. Static images do not need it.
    page_script = re.sub(
        r"\n\s*/\* empty photo slots.*?\n\s*/\* service breakouts \*/",
        "\n\n  /* service breakouts */",
        page_script,
        flags=re.DOTALL,
    )
    page_script = re.sub(
        r'\n\s*\$\("#vidfile"\)\.addEventListener\("change", function \(e\) \{.*?\n\s*\}\);',
        "",
        page_script,
        flags=re.DOTALL,
    )
    (STATIC_DIR / "js").mkdir(parents=True, exist_ok=True)
    (STATIC_DIR / "js" / "main.js").write_text(page_script.strip() + "\n")

    body = re.search(r"<body[^>]*>(.*?)</body>", page, re.DOTALL).group(1)
    body = re.sub(r"\s*<script[^>]*>.*?</script>\s*", "\n", body, flags=re.DOTALL)
    body = re.sub(r'\s*<label class="file">Load video…<input type="file" id="vidfile" accept="video/\*"></label>', "", body)
    for uuid, path in asset_paths.items():
        body = body.replace(uuid, path)

    body = re.sub(
        r'<image-slot\s+([^>]*?)\s+src="([^"]+)"([^>]*)></image-slot>',
        lambda m: (
            f'<img class="slot-image" src="{asset_paths.get(m.group(2), m.group(2))}" '
            f'alt=""{m.group(3)}>'
        ),
        body,
    )
    body = re.sub(
        r"/static/website/images/([^\"']+)",
        r"{% static 'website/images/\1' %}",
        body,
    )

    # Keep the authored body structure and content intact. The Django base
    # template owns document metadata, stylesheet/script loading, and html.
    (TEMPLATE_DIR / "home.html").write_text(
        "{% extends 'website/base.html' %}\n{% load static %}\n\n"
        "{% block content %}\n"
        f"{body.strip()}\n"
        "{% endblock %}\n"
    )

    print(f"extracted {len(asset_paths)} images")
    print(f"css bytes: {len(css.encode())}")
    print(f"js bytes: {len(page_script.encode())}")
    print(f"template bytes: {len(body.encode())}")


if __name__ == "__main__":
    main()
