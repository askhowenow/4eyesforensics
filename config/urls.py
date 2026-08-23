from django.urls import path

from website.views import ForensicsPageView, health


urlpatterns = [
    path("", ForensicsPageView.as_view(), name="home"),
    path("api/health/", health, name="health"),
]
