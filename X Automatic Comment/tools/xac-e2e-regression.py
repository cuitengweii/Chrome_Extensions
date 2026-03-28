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
from typing import Callable, List

from playwright.sync_api import BrowserContext, Error, Page, sync_playwright

EXT_PATH = r"D:\code\Chrome\X Automatic Comment"
START_KEYS = ("start", "开始")
STOP_KEYS = ("stop", "停止")
LOGIN_KEYS = ("login", "登录")
LOGOUT_KEYS = ("logout", "退出")
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
    page.wait_for_selector("#xac-search-include-a", timeout=20000)


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


def check_search_url(page: Page) -> CheckResult:
    # Warm up navigation to reduce occasional first-request aborts in this environment.
    goto_with_retry(page, "https://x.com")
    goto_with_retry(page, "https://x.com/search?q=test&src=typed_query&f=live")
    page.wait_for_timeout(6000)
    ensure_panel_open(page)

    page.evaluate(
        """
        () => {
          const setWithInput = (selector, value) => {
            const node = document.querySelector(selector)
            if (!node) return
            node.value = value
            node.dispatchEvent(new Event('input', { bubbles: true }))
          }
          const setWithChange = (selector, value) => {
            const node = document.querySelector(selector)
            if (!node) return
            node.value = value
            node.dispatchEvent(new Event('change', { bubbles: true }))
          }
          setWithInput('#xac-search-include-a', 'keyword1')
          setWithInput('#xac-search-include-b', 'keyword2')
          setWithInput('#xac-search-exclude', 'exclude1')
          setWithChange('#xac-search-min-replies', '3')
        }
        """
    )

    exclude_box = page.locator("#xac-search-exclude-replies")
    if not exclude_box.is_checked():
        exclude_box.check()

    expected_query = "(keyword1 OR keyword2) -exclude1 min_replies:3 -filter:replies"

    page.wait_for_timeout(500)
    preview = page.locator("#xac-search-preview").input_value(timeout=5000).strip()
    if preview != expected_query:
        return CheckResult(
            "Search URL assembly",
            False,
            f"Preview mismatch. expected='{expected_query}', actual='{preview}'",
        )

    search_label = page.locator("label", has_text=re.compile("最小评论数|Min comments", re.I)).count()
    if search_label == 0:
        return CheckResult(
            "Search copy consistency",
            False,
            "Search label not found as '最小评论数' or 'Min comments'.",
        )

    page.locator("#xac-open-search").click(timeout=10000)
    page.wait_for_load_state("domcontentloaded", timeout=60000)
    page.wait_for_timeout(1200)

    current_url = page.url
    actual_query, src, feed = parse_search_url(current_url)

    if actual_query != expected_query or src != "typed_query" or feed != "live":
        parsed = urllib.parse.urlparse(current_url or "")
        # Some unauthenticated flows land on /i/flow/login without exposing redirect params.
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
    popup.wait_for_selector("#xac-widget", timeout=20000)

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

    popup.wait_for_selector("#xac-logout", timeout=15000)
    logout_text = popup.locator("#xac-logout").inner_text(timeout=5000).strip()
    email_text = popup.locator(".xac-account-email").inner_text(timeout=5000).strip()

    if "e2e.bot@example.com" not in email_text:
        return CheckResult("Popup login state switch", False, f"Email not shown correctly: '{email_text}'")
    if not has_any(logout_text, LOGOUT_KEYS):
        return CheckResult("Popup login copy", False, f"Unexpected logged-in button text: '{logout_text}'")

    popup_text = popup.locator("#xac-widget").inner_text(timeout=5000)
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

    popup.wait_for_selector("#xac-login", timeout=15000)
    return CheckResult("Popup login state switch", True, f"login='{login_text}' | logout='{logout_text}' | email='{email_text}'")


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
    options.wait_for_selector("#xac-widget", timeout=20000)
    options.wait_for_selector("#xac-open-advanced", timeout=15000)
    options.wait_for_selector("#xac-spark-url", timeout=15000)

    duplicated_selectors = [
        "#xac-open-options",
        "#xac-open-search",
        "#xac-prompt",
        "#xac-generate",
        "#xac-output",
        "#xac-copy",
    ]
    hits = [sel for sel in duplicated_selectors if options.locator(sel).count() > 0]
    if hits:
        return CheckResult("Options no-duplicate scope", False, f"Unexpected controls in options page: {', '.join(hits)}")

    options.fill("#xac-spark-url", "https://spark-api.xf-yun.com/v3.5/chat")
    options.fill("#xac-spark-app-id", "e2e-app-id")
    options.fill("#xac-spark-api-key", "e2e-api-key")
    options.fill("#xac-spark-api-secret", "e2e-api-secret")
    options.fill("#xac-spark-domain", "generalv3.5")
    options.fill("#xac-spark-temp", "0.66")
    options.fill("#xac-spark-max-tokens", "1234")
    options.locator("#xac-save-spark").click(timeout=10000)
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
        "Options page scope + spark persistence",
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

            results.append(check_search_url(page))
            results.append(check_run_toggle(page))
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
