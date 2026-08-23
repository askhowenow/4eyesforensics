from django.http import JsonResponse
from django.views.generic import TemplateView


class ForensicsPageView(TemplateView):
    """Serve the supplied artifact as the canonical product surface."""

    template_name = "website/home.html"


def health(request):
    """Minimal liveness endpoint with no system or deployment details."""

    return JsonResponse({"status": "ok"})
