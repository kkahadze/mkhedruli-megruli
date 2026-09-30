import importlib.util
from io import BytesIO
import json
from pathlib import Path
import unittest
from unittest.mock import patch
from urllib.error import HTTPError


spec = importlib.util.spec_from_file_location("verify_live_translation", Path(__file__).resolve().parents[1] / "scripts/verify_live_translation.py")
smoke = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)


def event(value):
    return "data: " + json.dumps(value) + "\n\n"


def rejection(detail, status=400):
    return HTTPError(smoke.API + "/chat", status, "request failed", {}, BytesIO(json.dumps({"detail": detail}).encode()))


class LiveTranslationTests(unittest.TestCase):
    def test_only_fetches_own_static_scripts_and_requires_both_markers(self):
        html = '<script src="https://third.test/_next/static/app/page-no.js"></script><script src="/_next/static/chunks/app/page-yes.js"></script>'
        expected = [smoke.SITE.rstrip("/") + "/_next/static/chunks/app/page-yes.js"]
        self.assertEqual(smoke.page_scripts(html), expected)
        self.assertEqual(smoke.MARKER, "mingrelian_model_migration_gpt_6_1_sol_reasoning_low_v1")
        self.assertFalse(smoke.website_model_installed(html, lambda _: "gpt-6.1-sol"))
        self.assertFalse(smoke.website_model_installed(html, lambda _: "gpt-6-sol " + smoke.MARKER))
        self.assertFalse(smoke.website_model_installed(html, lambda _: "gpt-6.1-sol mingrelian_model_migration_gpt_6_sol_reasoning_none_v1"))
        self.assertTrue(smoke.website_model_installed(html, lambda _: "gpt-6.1-sol " + smoke.MARKER))

    def test_smoke_sends_new_public_model_with_supported_reasoning(self):
        html = '<script src="/_next/static/chunks/app/page-yes.js"></script>'
        response = event({"result": {"target_text": "\u10db\u10d0", "full_response": "Translation: synthetic"}})
        with patch.object(smoke, "get", side_effect=[html, f"{smoke.MODEL} {smoke.MARKER}", json.dumps({"paths": {"/chat": {}}})]), \
                patch.object(smoke, "read", side_effect=[rejection("Reasoning 'none' is not supported for gpt-6.1-sol. Use 'low' or omit it."), response]) as read:
            smoke.smoke()

        self.assertEqual(read.call_count, 2)
        readiness, translation = [call.args[0] for call in read.call_args_list]
        for request in (readiness, translation):
            self.assertEqual(request.full_url, smoke.API + "/chat")
            self.assertEqual(request.get_method(), "POST")
        probe = {
            "prompt": "The violet telescope arrived just before sunrise, but nobody opened the wooden box.",
            "source_language": "english", "target_language": "mingrelian",
            "provider": "openai",
        }
        self.assertEqual(json.loads(readiness.data), {
            "prompt": "Configuration readiness check.", "source_language": "english",
            "target_language": "english", "provider": "openai", "reasoning_effort": "none",
        })
        self.assertEqual(json.loads(translation.data), {**probe, "model": "gpt-6.1-sol", "reasoning_effort": "low"})

    def test_wrong_default_stops_before_explicit_translation_without_retrying_or_printing_server_detail(self):
        html = '<script src="/_next/static/chunks/app/page-yes.js"></script>'
        valid_result = event({"result": {"target_text": "\u10db\u10d0", "full_response": "Translation: synthetic"}})
        invalid_json = HTTPError(smoke.API + "/chat", 400, "request failed", {}, BytesIO(b"private upstream text"))
        for reply in (
            valid_result,
            rejection("Source and target languages must be different"),
            rejection("private upstream text: gpt-6-sol; use low"),
            rejection("private upstream text: gpt-6.1-sol; use none"),
            rejection("private upstream text: gpt-6.1-sol-preview; use low"),
            rejection({"model": "gpt-6.1-sol", "suggestion": "use low", "secret": "private upstream text"}),
            invalid_json,
        ):
            with self.subTest(reply=reply), \
                    patch.object(smoke, "get", side_effect=[html, f"{smoke.MODEL} {smoke.MARKER}", json.dumps({"paths": {"/chat": {}}})]), \
                    patch.object(smoke, "read", side_effect=[reply]) as read, \
                    patch.object(smoke.time, "sleep") as sleep, \
                    patch("builtins.print") as output:
                self.assertEqual(smoke.main(), 1)
                self.assertEqual(read.call_count, 1)
                sleep.assert_not_called()
                self.assertNotIn("private upstream text", str(output.call_args_list))

    def test_unexpected_http_status_never_qualifies_and_can_retry_without_exposing_detail(self):
        with patch.object(smoke, "read", side_effect=rejection("private upstream text: gpt-6.1-sol; use low", 503)):
            with self.assertRaisesRegex(ValueError, "unexpected HTTP 503") as error:
                smoke.verify_backend_default()
        self.assertNotIsInstance(error.exception, smoke.BackendDefaultMismatch)
        self.assertNotIn("private upstream text", str(error.exception))

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
