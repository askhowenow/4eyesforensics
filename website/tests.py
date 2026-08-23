from django.test import TestCase


class WebsiteTests(TestCase):
    def test_home_serves_the_v2_django_page(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "4Eyes Forensics")
        self.assertContains(response, "/static/website/css/site.css")
        self.assertContains(response, "/static/website/js/main.js")
        self.assertContains(response, "Rejuvonix")
        self.assertContains(response, "Premojin")
        self.assertContains(response, "Quantyfied")
        self.assertContains(response, "1 (876) 454-6883")
        self.assertContains(response, "tel:+18764546883")
        self.assertContains(response, 'id="scope"')
        self.assertContains(response, "data-quote")
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

    def test_public_security_files(self):
        self.assertEqual(self.client.get("/.well-known/security.txt").status_code, 200)
        self.assertEqual(self.client.get("/pgp-key.asc").status_code, 200)
