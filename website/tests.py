from pathlib import Path

from django.conf import settings
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
        self.assertContains(response, "Telehealth Company · CEO")
        self.assertContains(response, "Supplement &amp; Wellness Platform · COO")
        self.assertContains(response, "Solutions Development Company · Managing Director")
        self.assertContains(response, "ISO/IEC")
        self.assertContains(response, "NIST")
        self.assertContains(response, "id=\"quoteback\"")
        self.assertContains(response, "id=\"bits\"")
        self.assertContains(response, "1 (876) 454-6883")
        self.assertContains(response, "tel:+18764546883")
        self.assertContains(response, 'id="scope"')
        self.assertContains(response, "data-quote")
        self.assertNotContains(response, "<blockquote class=\"quotetext\">")
        self.assertNotContains(response, "__bundler")
        self.assertNotContains(response, "DecompressionStream")
        self.assertNotContains(response, "URL.createObjectURL")
        for placeholder in ("Kesterline", "Northbay", "northbay-clinics", "Portway", "Halden &amp; Roe", "Grebe Marine", "Ashcroft"):
            self.assertNotContains(response, placeholder)

    def test_interactive_script_matches_rendered_controls(self):
        response = self.client.get("/")
        self.assertNotContains(response, 'id="motifmode"')
        self.assertContains(response, 'src="/static/website/js/main.js?v=v3"')
        script = Path(settings.BASE_DIR, "website", "static", "website", "js", "main.js").read_text()
        self.assertNotIn("#motifmode", script)

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
