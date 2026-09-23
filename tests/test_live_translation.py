import importlib.util
import json
from pathlib import Path
import unittest


spec = importlib.util.spec_from_file_location("verify_live_translation", Path(__file__).resolve().parents[1] / "scripts/verify_live_translation.py")
smoke = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)


def event(value):
    return "data: " + json.dumps(value) + "\n\n"


class LiveTranslationTests(unittest.TestCase):
    def test_only_fetches_own_static_scripts_and_requires_both_markers(self):
        html = '<script src="https://third.test/_next/static/app/page-no.js"></script><script src="/_next/static/chunks/app/page-yes.js"></script>'
        expected = [smoke.SITE.rstrip("/") + "/_next/static/chunks/app/page-yes.js"]
        self.assertEqual(smoke.page_scripts(html), expected)
        self.assertFalse(smoke.website_model_installed(html, lambda _: "gpt-6-sol"))
        self.assertTrue(smoke.website_model_installed(html, lambda _: "gpt-6-sol " + smoke.MARKER))

    def test_accepts_target_script_and_refuses_old_server_errors_shortcuts_and_empty(self):
        payload = {"target_text": "\u10db\u10d0", "full_response": "Translation: synthetic"}
        smoke.verify_sse(event({"status": "working"}) + event({"result": payload}))
        for data in ("", event({"error": "requires a user-provided API key"}),
                     event({"result": {"target_text": "ASCII", "full_response": "Translation: synthetic"}}),
                     event({"result": {**payload, "full_response": "Exact lexicon match: result"}}),
                     event({"result": {**payload, "full_response": ""}})):
            with self.subTest(data=data), self.assertRaises(ValueError):
                smoke.verify_sse(data)


if __name__ == "__main__":
    unittest.main()
