from django.urls import path

from website.views import ForensicsPageView, ResponsibleDisclosureView, health, pgp_key, security_txt


urlpatterns = [
    path("", ForensicsPageView.as_view(), name="home"),
    path("responsible-disclosure/", ResponsibleDisclosureView.as_view(), name="responsible-disclosure"),
    path("api/health/", health, name="health"),
    path(".well-known/security.txt", security_txt, name="security-txt"),
    path("pgp-key.asc", pgp_key, name="pgp-key"),
]
