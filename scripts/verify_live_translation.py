"""Manually dispatched production check; uses one public synthetic sentence."""

from html.parser import HTMLParser
import json
import re
import sys
import time
from urllib.parse import urlencode, urljoin, urlsplit
from urllib.request import Request, urlopen


SITE = "https://www.mkhedruli.com/"
API = "https://argo-translator.onrender.com"
MARKER = "mingrelian_model_migration_gpt_6_sol_reasoning_none_v1"


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
        if MARKER in script and "gpt-6-sol" in script:
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


def smoke():
    html = get(SITE + "?" + urlencode({"production_smoke": int(time.time())}))
    if not website_model_installed(html, get):
        raise ValueError("public website is not serving the GPT-6 Sol default bundle")
    openapi = json.loads(get(API + "/openapi.json"))
    if "/chat" not in openapi.get("paths", {}):
        raise ValueError("production translation route is missing")
    payload = json.dumps({
        "prompt": "The violet telescope arrived just before sunrise, but nobody opened the wooden box.",
        "source_language": "english", "target_language": "mingrelian",
        "provider": "openai", "model": "gpt-6-sol", "reasoning_effort": "none",
    }).encode()
    request = Request(API + "/chat", data=payload, method="POST", headers={
        "Content-Type": "application/json", "Accept": "text/event-stream",
        "User-Agent": "Mkhedruli-production-smoke/1.0",
    })
    verify_sse(read(request))


def main():
    for attempt in range(1, 13):
        try:
            smoke()
        except Exception as error:
            print(f"Attempt {attempt}/12 not ready: {type(error).__name__}: {error}", flush=True)
            if attempt == 12:
                return 1
            time.sleep(20)
        else:
            print("Live website defaults to GPT-6 Sol; public server-key translation returned target-script text.", flush=True)
            return 0
    return 1


if __name__ == "__main__":
    sys.exit(main())
