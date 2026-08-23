from django.test import TestCase


class WebsiteTests(TestCase):
    def test_home_serves_the_reference_artifact(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "4Eyes Forensics")
        self.assertContains(response, "/static/website/css/site.css")
        self.assertContains(response, "/static/website/js/main.js")
        self.assertNotContains(response, "__bundler")
        self.assertNotContains(response, "DecompressionStream")
        self.assertNotContains(response, "URL.createObjectURL")

    def test_responsible_disclosure_page(self):
        response = self.client.get("/responsible-disclosure/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Responsible disclosure")

    def test_health_endpoint(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})
