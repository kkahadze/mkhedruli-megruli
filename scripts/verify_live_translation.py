"""Manually dispatched production check; uses one public synthetic sentence."""

import argparse
from html.parser import HTMLParser
import json
import re
import sys
import time
from urllib.error import HTTPError
from urllib.parse import urlencode, urljoin, urlsplit
from urllib.request import Request, urlopen


SITE = "https://www.mkhedruli.com/"
API = "https://argo-translator.onrender.com"
MODEL = "gpt-6-astra"
REASONING_EFFORT = "low"
MARKER = "mingrelian_model_migration_gpt_6_astra_ultrafast_reasoning_low_v1"
PROBE = {
    "prompt": "The violet telescope arrived just before sunrise, but nobody opened the wooden box.",
    "source_language": "english", "target_language": "mingrelian", "provider": "openai",
}


class BackendDefaultMismatch(ValueError):
    pass


class Scripts(HTMLParser):
    def __init__(self):
        super().__init__()
        self.sources = []

    def handle_starttag(self, tag, attrs):
        if tag == "script":
            source = dict(attrs).get("src")
            if source:
                self.sources.append(source)


def page_scripts(html):
    parser = Scripts()
    parser.feed(html)
    urls = set()
    for source in parser.sources:
        url = urljoin(SITE, source)
        parts = urlsplit(url)
        if parts.netloc == urlsplit(SITE).netloc and "/_next/static/" in parts.path and parts.path.endswith(".js"):
            urls.add(url)
    return sorted(urls, key=lambda url: ("/app/page-" not in url, url))


def website_model_installed(html, fetch):
    for url in page_scripts(html):
        script = fetch(url)
        if MARKER in script and MODEL in script:
            return True
    return False


def verify_sse(raw):
    events = []
    for line in raw.splitlines():
        if line.startswith("data:"):
            events.append(json.loads(line.split(":", 1)[1]))
    if not events or any("error" in event for event in events):
        raise ValueError("translation emitted an error or no SSE event")
    result = events[-1].get("result", {})
    target = result.get("target_text", "")
    if not isinstance(target, str) or not re.search(r"[\u10a0-\u10ff\u1c90-\u1cbf]", target):
        raise ValueError("translation lacked Georgian-script target text")
    diagnostic = str(result.get("full_response", "")).casefold()
    if not diagnostic or any(marker in diagnostic for marker in (
        "exact lexicon match:", "exact dictionary match", "translation override", "direct google translate",
    )):
        raise ValueError("synthetic probe unexpectedly used an unverified shortcut")


def read(request):
    with urlopen(request, timeout=55) as response:
        return response.read(8_000_000).decode("utf-8")


def get(url):
    return read(Request(url, headers={"User-Agent": "Mkhedruli-production-smoke/1.0", "Cache-Control": "no-cache"}))


def translation_request(payload):
    return Request(API + "/chat", data=json.dumps(payload).encode(), method="POST", headers={
        "Content-Type": "application/json", "Accept": "text/event-stream",
        "User-Agent": "Mkhedruli-production-smoke/1.0",
    })


def matches_model_rejection(detail):
    return isinstance(detail, str) and bool(
        re.search(rf"(?<![\w.-]){re.escape(MODEL)}(?![\w-]|\.[\w])", detail, re.IGNORECASE)
        and re.search(r"\buse\s+[^a-z0-9]{0,3}low\b", detail, re.IGNORECASE)
    )


def backend_mismatch_diagnosis(readiness):
    try:
        read(translation_request({**readiness, "model": MODEL}))
    except HTTPError as error:
        with error:
            if error.code != 400:
                return "explicit-model readiness returned a different HTTP status"
            try:
                body = json.loads(error.read(65_536))
            except (UnicodeDecodeError, json.JSONDecodeError):
                return "explicit-model readiness returned invalid JSON"
        detail = body.get("detail") if isinstance(body, dict) else None
        if matches_model_rejection(detail):
            return "new backend validation is live, but the configured omitted-model default is still different"
        if detail == "Source and target languages must be different":
            return "the public backend has not yet exposed the new model validation"
    except (OSError, ValueError):
        return "explicit-model readiness could not be reached or decoded"
    return "explicit-model readiness did not identify the running backend revision"


def verify_backend_default():
    # The prior backend rejects same-language requests without calling its provider.
    # The new backend checks its model's unsupported reasoning before that guard.
    readiness = {"prompt": "Configuration readiness check.", "source_language": "english",
                 "target_language": "english", "provider": "openai", "reasoning_effort": "none"}
    try:
        read(translation_request(readiness))
    except HTTPError as error:
        with error:
            if error.code != 400:
                raise ValueError(f"backend default check returned unexpected HTTP {error.code}") from None
            try:
                body = json.loads(error.read(65_536))
            except (UnicodeDecodeError, json.JSONDecodeError):
                raise BackendDefaultMismatch("backend default rejection was not valid JSON") from None
        detail = body.get("detail") if isinstance(body, dict) else None
        if not matches_model_rejection(detail):
            diagnosis = backend_mismatch_diagnosis(readiness)
            raise BackendDefaultMismatch(f"backend default rejection did not confirm GPT-6 Astra and low: {diagnosis}")
    else:
        raise BackendDefaultMismatch("backend accepted unsupported reasoning for its default; explicit translation was not sent")


def verify_backend():
    openapi = json.loads(get(API + "/openapi.json"))
    if "/chat" not in openapi.get("paths", {}):
        raise ValueError("production translation route is missing")
    verify_backend_default()


def smoke(backend_only=False):
    if backend_only:
        verify_backend()
        return
    html = get(SITE + "?" + urlencode({"production_smoke": int(time.time())}))
    if not website_model_installed(html, get):
        raise ValueError("public website is not serving the GPT-6 Astra default bundle")
    verify_backend()
    verify_sse(read(translation_request({**PROBE, "model": MODEL, "reasoning_effort": REASONING_EFFORT})))


def main(argv=()):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--backend-only", action="store_true", help="verify the deployed backend default without a provider translation")
    args = parser.parse_args(argv)
    for attempt in range(1, 13):
        try:
            smoke(backend_only=args.backend_only)
        except BackendDefaultMismatch as error:
            print(f"Backend default mismatch: {error}", flush=True)
            return 1
        except Exception as error:
            print(f"Attempt {attempt}/12 not ready: {type(error).__name__}: {error}", flush=True)
            if attempt == 12:
                return 1
            time.sleep(20)
        else:
            if args.backend_only:
                print("Live backend default is GPT-6 Astra with low as its minimum; no provider translation was requested.", flush=True)
            else:
                print("Live website and backend default to GPT-6 Astra; explicit public server-key translation returned target-script text.", flush=True)
            return 0
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
