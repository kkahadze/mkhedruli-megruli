"""Check the SEO signals that crawlers can read from the static Pages build."""
from html.parser import HTMLParser
from pathlib import Path
import unittest
from urllib.parse import urljoin
from xml.etree import ElementTree


OUT = Path(__file__).resolve().parents[1] / "out"
SITE = "https://www.mkhedruli.com/"


def canonical_url(href):
    return SITE if href == SITE.rstrip("/") else href


class Page(HTMLParser):
    def __init__(self, filename):
        super().__init__()
        self.tags = []
        self.h1 = []
        self.in_h1 = False
        self.feed((OUT / filename).read_text(encoding="utf-8"))

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))
        if tag == "h1":
            self.in_h1 = True

    def handle_endtag(self, tag):
        if tag == "h1":
            self.in_h1 = False

    def handle_data(self, data):
        if self.in_h1:
            self.h1.append(data)

    def attrs(self, tag, **match):
        return [attrs for name, attrs in self.tags
                if name == tag and all(attrs.get(k) == v for k, v in match.items())]


class ExportedLocales(unittest.TestCase):
    def test_each_translator_has_its_own_language_heading_and_search_links(self):
        alternates = {"en": SITE, "ka": SITE + "ka", "x-default": SITE}
        for locale, filename, heading, other in (
            ("ka", "ka.html", "მეგრული მთარგმნელი", "en"),
            ("en", "index.html", "Mingrelian Translator", "ka"),
        ):
            with self.subTest(locale=locale):
                page = Page(filename)
                self.assertEqual(page.attrs("html")[0]["lang"], locale)
                self.assertEqual(page.h1, [heading])
                canonical, = page.attrs("link", rel="canonical")
                self.assertEqual(canonical_url(canonical["href"]), alternates[locale])
                self.assertEqual({a["hreflang"]: canonical_url(a["href"])
                                  for a in page.attrs("link", rel="alternate")}, alternates)
                switch, = page.attrs("a", hreflang=other)
                self.assertEqual(urljoin(SITE, switch["href"]), alternates[other])

    def test_sitemap_contains_both_translators_and_updates(self):
        urls = ElementTree.parse(OUT / "sitemap.xml").findall(".//{*}loc")
        self.assertTrue({SITE, SITE + "ka", SITE + "updates"} <= {url.text for url in urls})
