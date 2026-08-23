from django.test import TestCase


class WebsiteTests(TestCase):
    def test_home_serves_the_reference_artifact(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "4Eyes Forensics")

    def test_health_endpoint(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})
