#!/usr/bin/env python3
"""End-to-end regression checks for X Automatic Comment.

Checks covered:
1) Search query assembly and final X search URL.
2) Single run-toggle start/stop/start behavior.
3) Popup login area state switching (logged out -> logged in -> logged out).
4) Key copy consistency for search and account areas.
"""

from __future__ import annotations

import json
import re
import shutil
import tempfile
import urllib.parse
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, List

from playwright.sync_api import BrowserContext, Error, Page, sync_playwright

EXT_PATH = str(Path(__file__).resolve().parents[1])
START_KEYS = ("start", "开始")
STOP_KEYS = ("stop", "停止")
LOGIN_KEYS = ("login", "登录", "sign in", "signin")
LOGOUT_KEYS = ("logout", "退出", "登出")
EXPECTED_SEARCH_COPY = ("最小评论数", "Min comments")


@dataclass
class CheckResult:
    name: str
    ok: bool
    detail: str


def has_any(text: str, keys: tuple[str, ...]) -> bool:
    lowered = (text or "").strip().lower()
    return any(key in lowered for key in keys)


def wait_for_text(page: Page, selector: str, predicate: Callable[[str], bool], timeout_ms: int = 15000) -> str:
    page.wait_for_function(
        "([sel]) => { const el = document.querySelector(sel); return !!el && el.textContent && el.textContent.trim().length > 0; }",
        arg=[selector],
        timeout=timeout_ms,
    )

    page.wait_for_function(
        "([sel]) => { const el = document.querySelector(sel); return !!el && !!el.textContent; }",
        arg=[selector],
        timeout=timeout_ms,
    )

    def current() -> str:
        return (page.locator(selector).inner_text(timeout=timeout_ms) or "").strip()

    first = current()
    if predicate(first):
        return first

    page.wait_for_function(
        "([sel, mode]) => { const el = document.querySelector(sel); if (!el) return false; const t = (el.textContent || '').toLowerCase(); return mode === 'start' ? (t.includes('start') || t.includes('开始')) : (t.includes('stop') || t.includes('停止')); }",
        arg=[selector, "start" if predicate("start") else "stop"],
        timeout=timeout_ms,
    )
    return current()


def ensure_panel_open(page: Page) -> None:
    page.wait_for_selector("#xac-root", timeout=30000)
    root = page.locator("#xac-root")
    cls = root.get_attribute("class") or ""
    if "collapsed" in cls:
        page.locator("#xac-t").click(timeout=10000)
    page.wait_for_selector("#xac-run-toggle", timeout=20000)


def get_extension_id(context: BrowserContext) -> str:
    if context.service_workers:
        return context.service_workers[0].url.split("/")[2]
    sw = context.wait_for_event("serviceworker", timeout=30000)
    return sw.url.split("/")[2]


def goto_with_retry(page: Page, url: str, attempts: int = 3) -> None:
    last_error: Exception | None = None
    for _ in range(attempts):
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=60000)
            return
        except Error as err:
            last_error = err
            if "ERR_ABORTED" not in str(err):
                raise
            page.wait_for_timeout(1200)
    if last_error:
        raise last_error


def parse_search_url(url_text: str) -> tuple[str, str, str]:
    parsed = urllib.parse.urlparse(url_text or "")
    params = urllib.parse.parse_qs(parsed.query or "")

    q = urllib.parse.unquote(params.get("q", [""])[0])
    src = params.get("src", [""])[0]
    feed = params.get("f", [""])[0]
    if q and src and feed:
        return q, src, feed

    redirect_target = urllib.parse.unquote(params.get("redirect_after_login", [""])[0] or "")
    if redirect_target:
        if redirect_target.startswith("/"):
            redirect_target = f"https://x.com{redirect_target}"
        nested = urllib.parse.urlparse(redirect_target)
        nested_params = urllib.parse.parse_qs(nested.query or "")
        q = urllib.parse.unquote(nested_params.get("q", [""])[0])
        src = nested_params.get("src", [""])[0]
        feed = nested_params.get("f", [""])[0]

    return q, src, feed


def check_search_url(context: BrowserContext, ext_id: str) -> CheckResult:
    popup = context.new_page()
    popup.goto(f"chrome-extension://{ext_id}/popup.html", wait_until="domcontentloaded", timeout=30000)
    popup.wait_for_selector("#xac-search-include-a", timeout=20000)

    popup.fill("#xac-search-include-a", "keyword1")
    popup.fill("#xac-search-include-b", "keyword2")
    popup.fill("#xac-search-exclude", "exclude1")
    popup.fill("#xac-search-min-replies", "3")
    popup.locator("#xac-search-min-replies").press("Tab")

    exclude_box = popup.locator("#xac-search-exclude-replies")
    if not exclude_box.is_checked():
        exclude_box.check()

    expected_query = "(keyword1 OR keyword2) -exclude1 min_replies:3 -filter:replies"
    popup.wait_for_timeout(500)
    preview = popup.locator("#xac-search-preview").input_value(timeout=5000).strip()
    if preview != expected_query:
        return CheckResult(
            "Search URL assembly",
            False,
            f"Preview mismatch. expected='{expected_query}', actual='{preview}'",
        )

    popup.locator("#xac-open-search").click(timeout=10000)

    current_url = ""
    actual_query = ""
    src = ""
    feed = ""
    for _ in range(120):
      for page in context.pages:
        if page == popup:
            continue
        if not str(page.url or "").startswith("https://x.com/"):
            continue
        current_url = page.url
        actual_query, src, feed = parse_search_url(current_url)
        if current_url:
            break
      if current_url:
          break
      popup.wait_for_timeout(250)

    if not current_url:
        return CheckResult("Search URL assembly", False, "No X page was opened from popup search action.")

    if actual_query != expected_query or src != "typed_query" or feed != "live":
        parsed = urllib.parse.urlparse(current_url or "")
        if parsed.path.startswith("/i/flow/login"):
            return CheckResult(
                "Search URL assembly",
                True,
                f"redirected-to-login-without-query: '{current_url}' (preview verified='{preview}')",
            )
        return CheckResult(
            "Search URL assembly",
            False,
            f"URL mismatch. page='{current_url}', q='{actual_query}', src='{src}', f='{feed}'",
        )

    if "gm" in actual_query.lower() or "gn" in actual_query.lower():
        return CheckResult(
            "Search URL assembly",
            False,
            f"Unexpected gm/gn found in query: '{actual_query}'",
        )

    return CheckResult("Search URL assembly", True, actual_query)


def _toggle_text(page: Page) -> str:
    return page.locator("#xac-run-toggle").inner_text(timeout=8000).strip()


def check_run_toggle(page: Page) -> CheckResult:
    ensure_panel_open(page)

    compact_missing = [
        "#xac-search-include-a",
        "#xac-p",
        "#xac-spark-url",
    ]
    compact_present = [
        "#xac-open-options",
        "#xac-open-search",
        "#xac-run-toggle",
    ]
    missing_hits = [sel for sel in compact_missing if page.locator(sel).count() > 0]
    present_misses = [sel for sel in compact_present if page.locator(sel).count() == 0]
    if missing_hits or present_misses:
        return CheckResult(
            "Compact sidebar scope",
            False,
            f"unexpected={missing_hits} missing={present_misses}",
        )

    initial = _toggle_text(page)
    if has_any(initial, STOP_KEYS):
        page.locator("#xac-run-toggle").click(timeout=10000)
        page.wait_for_function(
            "() => { const el = document.querySelector('#xac-run-toggle'); if(!el) return false; const t=(el.textContent||'').toLowerCase(); return t.includes('start') || t.includes('开始'); }",
            timeout=15000,
        )

    steps: List[str] = []

    page.locator("#xac-run-toggle").click(timeout=10000)
    page.wait_for_function(
        "() => { const el = document.querySelector('#xac-run-toggle'); if(!el) return false; const t=(el.textContent||'').toLowerCase(); return t.includes('stop') || t.includes('停止'); }",
        timeout=15000,
    )
    steps.append(f"start-1 -> {_toggle_text(page)}")

    page.locator("#xac-run-toggle").click(timeout=10000)
    page.wait_for_function(
        "() => { const el = document.querySelector('#xac-run-toggle'); if(!el) return false; const t=(el.textContent||'').toLowerCase(); return t.includes('start') || t.includes('开始'); }",
        timeout=15000,
    )
    steps.append(f"stop-1 -> {_toggle_text(page)}")

    page.locator("#xac-run-toggle").click(timeout=10000)
    page.wait_for_function(
        "() => { const el = document.querySelector('#xac-run-toggle'); if(!el) return false; const t=(el.textContent||'').toLowerCase(); return t.includes('stop') || t.includes('停止'); }",
        timeout=15000,
    )
    steps.append(f"start-2 -> {_toggle_text(page)}")

    page.locator("#xac-run-toggle").click(timeout=10000)
    page.wait_for_function(
        "() => { const el = document.querySelector('#xac-run-toggle'); if(!el) return false; const t=(el.textContent||'').toLowerCase(); return t.includes('start') || t.includes('开始'); }",
        timeout=15000,
    )
    steps.append(f"stop-2 -> {_toggle_text(page)}")

    return CheckResult("Run toggle single-button flow", True, " | ".join(steps))


def check_popup_login(context: BrowserContext, ext_id: str) -> CheckResult:
    popup = context.new_page()
    popup.goto(f"chrome-extension://{ext_id}/popup.html", wait_until="domcontentloaded", timeout=30000)
    popup.wait_for_selector("#xac-root", timeout=20000)

    popup.wait_for_selector("#xac-login", timeout=15000)
    login_text = popup.locator("#xac-login").inner_text(timeout=5000).strip()
    if not has_any(login_text, LOGIN_KEYS):
        return CheckResult("Popup login copy", False, f"Unexpected logged-out button text: '{login_text}'")

    popup.evaluate(
        """
        async () => {
          await new Promise((resolve, reject) => {
            chrome.storage.local.set({
              'xac.googleSession': {
                accessToken: 'e2e-fake-token',
                refreshToken: '',
                tokenType: 'bearer',
                expiresIn: 3600,
                expiresAt: Date.now() + 3600 * 1000,
                user: { email: 'e2e.bot@example.com' },
                signedInAt: new Date().toISOString()
              }
            }, () => {
              if (chrome.runtime && chrome.runtime.lastError) reject(chrome.runtime.lastError.message)
              else resolve(true)
            })
          })
        }
        """
    )

    popup.wait_for_function(
        "() => { const el = document.querySelector('.xac-account-email'); return !!el && (el.textContent || '').includes('e2e.bot@example.com'); }",
        timeout=15000,
    )
    popup.wait_for_selector(".xac-account-email", timeout=15000)
    logout_text = popup.locator("#xac-login").inner_text(timeout=5000).strip()
    email_text = popup.locator(".xac-account-email").inner_text(timeout=5000).strip()

    if "e2e.bot@example.com" not in email_text:
        return CheckResult("Popup login state switch", False, f"Email not shown correctly: '{email_text}'")
    if not has_any(logout_text, LOGOUT_KEYS):
        return CheckResult("Popup login copy", False, f"Unexpected logged-in button text: '{logout_text}'")

    popup_text = popup.locator("#xac-root").inner_text(timeout=5000)
    if "Supabase" in popup_text:
        return CheckResult("Popup login copy", False, "Popup still shows 'Supabase' copy in account area.")

    popup.evaluate(
        """
        async () => {
          await new Promise((resolve, reject) => {
            chrome.storage.local.remove(['xac.googleSession'], () => {
              if (chrome.runtime && chrome.runtime.lastError) reject(chrome.runtime.lastError.message)
              else resolve(true)
            })
          })
        }
        """
    )

    popup.wait_for_function(
        "() => { const el = document.querySelector('.xac-account-email'); return !!el && ((el.textContent || '').trim() === '-' || !(el.textContent || '').includes('e2e.bot@example.com')); }",
        timeout=15000,
    )
    return CheckResult("Popup login state switch", True, f"login='{login_text}' | logout='{logout_text}' | email='{email_text}'")


def check_popup_full_config(context: BrowserContext, ext_id: str) -> CheckResult:
    popup = context.new_page()
    popup.goto(f"chrome-extension://{ext_id}/popup.html", wait_until="domcontentloaded", timeout=30000)
    popup.wait_for_selector("#xac-root", timeout=20000)

    required = [
        "#xac-p",
        "#xac-ci",
        "#xac-search-include-a",
        "#xac-search-preview",
        "#xac-debug-prompt",
        "#xac-spark-url",
        "#xac-run-toggle",
    ]
    missing = [sel for sel in required if popup.locator(sel).count() == 0]
    if missing:
        return CheckResult("Popup full config surface", False, f"Missing popup controls: {', '.join(missing)}")

    return CheckResult("Popup full config surface", True, ", ".join(required))


def check_popup_to_options(context: BrowserContext, ext_id: str) -> CheckResult:
    popup = context.new_page()
    popup.goto(f"chrome-extension://{ext_id}/popup.html", wait_until="domcontentloaded", timeout=30000)
    popup.wait_for_selector("#xac-open-options", timeout=15000)
    popup.locator("#xac-open-options").click(timeout=10000)

    target_prefix = f"chrome-extension://{ext_id}/options.html"
    for _ in range(24):
        urls = [p.url for p in context.pages]
        if any(url.startswith(target_prefix) for url in urls):
            return CheckResult("Popup opens options page", True, target_prefix)
        popup.wait_for_timeout(250)

    urls = [p.url for p in context.pages]
    return CheckResult("Popup opens options page", False, f"options page not detected. pages={urls}")


def check_options_page_scope_and_save(context: BrowserContext, ext_id: str) -> CheckResult:
    options = context.new_page()
    options.goto(f"chrome-extension://{ext_id}/options.html", wait_until="domcontentloaded", timeout=30000)
    options.wait_for_selector("#xac-root", timeout=20000)
    options.wait_for_selector("#xac-open-advanced-panel", timeout=15000)
    options.wait_for_selector("#xac-spark-url", timeout=15000)

    required_selectors = [
        "#xac-p",
        "#xac-ci",
        "#xac-search-include-a",
        "#xac-debug-prompt",
        "#xac-spark-url",
        "#xac-run-toggle",
    ]
    missing = [sel for sel in required_selectors if options.locator(sel).count() == 0]
    if missing:
        return CheckResult("Options full config surface", False, f"Missing controls in options page: {', '.join(missing)}")

    options.fill("#xac-spark-url", "https://spark-api.xf-yun.com/v3.5/chat")
    options.fill("#xac-spark-app-id", "e2e-app-id")
    options.fill("#xac-spark-api-key", "e2e-api-key")
    options.fill("#xac-spark-api-secret", "e2e-api-secret")
    options.fill("#xac-spark-domain", "generalv3.5")
    options.fill("#xac-spark-temp", "0.66")
    options.fill("#xac-spark-max-tokens", "1234")
    options.wait_for_function(
        "() => { const el = document.querySelector('#xac-save-spark'); return !!el && !el.disabled; }",
        timeout=20000,
    )
    last_click_error: Exception | None = None
    for _ in range(5):
        try:
            options.locator("#xac-save-spark").click(timeout=4000)
            last_click_error = None
            break
        except Error as err:
            last_click_error = err
            options.wait_for_timeout(300)
    if last_click_error:
        return CheckResult("Options spark save wiring", False, f"Click save failed: {last_click_error}")
    options.wait_for_timeout(1200)

    saved = options.evaluate(
        """
        async () => {
          return await new Promise((resolve, reject) => {
            chrome.storage.local.get(['xac.sparkSettings'], (items) => {
              if (chrome.runtime && chrome.runtime.lastError) {
                reject(chrome.runtime.lastError.message)
                return
              }
              resolve(items['xac.sparkSettings'] || null)
            })
          })
        }
        """
    )

    if not isinstance(saved, dict):
        return CheckResult("Options spark save wiring", False, "No xac.sparkSettings in storage after save.")
    if str(saved.get("url", "")).strip() != "https://spark-api.xf-yun.com/v3.5/chat":
        return CheckResult("Options spark save wiring", False, f"Saved url mismatch: {saved}")
    if int(saved.get("max_tokens", 0) or 0) != 1234:
        return CheckResult("Options spark save wiring", False, f"Saved max_tokens mismatch: {saved}")

    return CheckResult(
        "Options full config + spark persistence",
        True,
        f"url='{saved.get('url')}', domain='{saved.get('domain')}', temp={saved.get('temperature')}, max_tokens={saved.get('max_tokens')}",
    )


def run() -> int:
    results: List[CheckResult] = []
    user_data_dir = tempfile.mkdtemp(prefix="xac-e2e-")

    try:
        with sync_playwright() as p:
            context = p.chromium.launch_persistent_context(
                user_data_dir,
                headless=False,
                args=[
                    f"--disable-extensions-except={EXT_PATH}",
                    f"--load-extension={EXT_PATH}",
                    "--no-sandbox",
                ],
            )
            ext_id = get_extension_id(context)
            page = context.pages[0] if context.pages else context.new_page()

            results.append(check_search_url(context, ext_id))
            x_pages = [item for item in context.pages if str(item.url or "").startswith("https://x.com/")]
            if x_pages:
                page = x_pages[-1]
            results.append(check_run_toggle(page))
            results.append(check_popup_full_config(context, ext_id))
            results.append(check_popup_login(context, ext_id))
            results.append(check_popup_to_options(context, ext_id))
            results.append(check_options_page_scope_and_save(context, ext_id))

            context.close()
    except Error as err:
        results.append(CheckResult("Playwright execution", False, str(err)))
    finally:
        shutil.rmtree(user_data_dir, ignore_errors=True)

    payload = {
        "ok": all(item.ok for item in results),
        "results": [item.__dict__ for item in results],
    }
    print(json.dumps(payload, ensure_ascii=False, indent=2))

    return 0 if payload["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(run())
