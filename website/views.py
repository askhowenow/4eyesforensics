from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.views.generic import TemplateView


class ForensicsPageView(TemplateView):
    """Serve the maintained Django homepage."""

    template_name = "website/home.html"


class ResponsibleDisclosureView(TemplateView):
    template_name = "website/responsible_disclosure.html"


def health(request):
    """Minimal liveness endpoint with no system or deployment details."""

    return JsonResponse({"status": "ok"})


def security_txt(request):
    path = settings.BASE_DIR / "website" / "static" / "website" / "assets" / ".well-known" / "security.txt"
    return HttpResponse(path.read_text(), content_type="text/plain; charset=utf-8")


def pgp_key(request):
    path = settings.BASE_DIR / "website" / "static" / "website" / "assets" / "pgp-key.asc"
    return HttpResponse(path.read_text(), content_type="application/pgp-keys; charset=utf-8")
