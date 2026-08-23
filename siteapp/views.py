from django.views.generic import TemplateView


class ForensicsPageView(TemplateView):
    """Serve the supplied artifact as the canonical product surface."""

    template_name = "4eyes-forensics.html"
