(function initXCopyCapture() {
  const STATUS_RE = /^https:\/\/x\.com\/[^/?#]+\/status\/\d+/i;
  const recentSent = new Map();
  const articleNameByStatusUrl = new Map();
  const TOAST_ROOT_ID = 'fb-capture-toast-root';
  let lastClipboardStatusUrl = '';
  let reading = false;

  function normalizeStatusUrl(url) {
    try {
      const u = new URL(String(url || '').trim());
      if (u.hostname === 'www.x.com') u.hostname = 'x.com';
      u.hash = '';
      return `${u.origin}${u.pathname}`;
    } catch {
      return String(url || '').trim();
    }
  }

  function isRecent(url) {
    const now = Date.now();
    const prev = recentSent.get(url) || 0;
    recentSent.set(url, now);
    for (const [k, ts] of recentSent.entries()) {
      if (now - ts > 15000) recentSent.delete(k);
    }
    return now - prev < 1000;
  }

  function rememberArticleName(statusUrl, displayName) {
    const normalized = normalizeStatusUrl(statusUrl);
    const cleanedName = String(displayName || '').trim();
    if (!normalized) return;
    if (cleanedName) {
      articleNameByStatusUrl.set(normalized, { name: cleanedName, ts: Date.now() });
    }
    const now = Date.now();
    for (const [key, value] of articleNameByStatusUrl.entries()) {
      if (!value || now - Number(value.ts || 0) > 10 * 60 * 1000) {
        articleNameByStatusUrl.delete(key);
      }
    }
  }

  function getRememberedArticleName(statusUrl) {
    const normalized = normalizeStatusUrl(statusUrl);
    return String(articleNameByStatusUrl.get(normalized)?.name || '').trim();
  }

  async function safeSendRuntimeMessage(payload) {
    try {
      if (!chrome?.runtime?.id) return false;
      await chrome.runtime.sendMessage(payload);
      return true;
    } catch (error) {
      if (ignoreStaleContextError(error)) return false;
      return false;
    }
  }

  function ignoreStaleContextError(error) {
    const msg = String(error?.message || error || '');
    return msg.includes('Extension context invalidated') || msg.includes('Receiving end does not exist');
  }

  function runSafely(fn) {
    try {
      fn();
    } catch (error) {
      if (!ignoreStaleContextError(error)) {
        // Keep other unexpected issues visible for debugging.
        console.error(error);
      }
    }
  }

  function ensureToastRoot() {
    let root = document.getElementById(TOAST_ROOT_ID);
    if (root) return root;
    root = document.createElement('div');
    root.id = TOAST_ROOT_ID;
    root.style.position = 'fixed';
    root.style.right = '18px';
    root.style.bottom = '18px';
    root.style.zIndex = '2147483647';
    root.style.display = 'grid';
    root.style.gap = '8px';
    root.style.pointerEvents = 'none';
    document.documentElement.appendChild(root);
    return root;
  }

  function showToast(text, level = 'success') {
    runSafely(() => {
      const root = ensureToastRoot();
      const toast = document.createElement('div');
      toast.textContent = String(text || '').trim();
      toast.style.maxWidth = '320px';
      toast.style.padding = '10px 12px';
      toast.style.borderRadius = '12px';
      toast.style.fontSize = '13px';
      toast.style.lineHeight = '1.45';
      toast.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.22)';
      toast.style.border = '1px solid rgba(255,255,255,0.08)';
      toast.style.background = level === 'error' ? 'rgba(95, 22, 22, 0.96)' : 'rgba(14, 20, 32, 0.96)';
      toast.style.color = '#f5f7ff';
      toast.style.transform = 'translateY(8px)';
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 160ms ease, transform 160ms ease';

      root.appendChild(toast);
      requestAnimationFrame(() =>
        runSafely(() => {
          if (!toast.isConnected) return;
          toast.style.opacity = '1';
          toast.style.transform = 'translateY(0)';
        })
      );

      window.setTimeout(() =>
        runSafely(() => {
          if (!toast.isConnected) return;
          toast.style.opacity = '0';
          toast.style.transform = 'translateY(6px)';
          window.setTimeout(() =>
            runSafely(() => {
              toast.remove();
            }),
          180);
        }),
      1800);
    });
  }

  function rememberArticleContext(article) {
    const statusUrl = findStatusUrlFromArticle(article);
    const displayName = findDisplayNameFromArticle(article);
    if (!statusUrl) return '';
    rememberArticleName(statusUrl, displayName);
    safeSendRuntimeMessage({
      type: 'set-context-target',
      url: statusUrl,
      name: displayName || ''
    });
    return statusUrl;
  }

  function findStatusUrlFromArticle(article) {
    if (!article) return '';
    const links = [...article.querySelectorAll('a[href*="/status/"]')];
    for (const a of links) {
      const href = a.getAttribute('href') || '';
      if (!href) continue;
      const abs = href.startsWith('http') ? href : `https://x.com${href.startsWith('/') ? '' : '/'}${href}`;
      const normalized = normalizeStatusUrl(abs);
      if (STATUS_RE.test(normalized)) return normalized;
    }
    return '';
  }

  function findDisplayNameFromArticle(article) {
    if (!article) return '';
    const userNameBlock = article.querySelector('[data-testid="User-Name"]');
    if (!userNameBlock) return '';
    const spans = [...userNameBlock.querySelectorAll('span')]
      .map((el) => (el.textContent || '').trim())
      .filter(Boolean);
    const name = spans.find((text) => {
      if (text.startsWith('@')) return false;
      if (/^[·•]$/.test(text)) return false;
      if (/^\d+[smhdw]$/i.test(text)) return false;
      return true;
    });
    return String(name || '').trim();
  }

  async function readClipboardStatusUrl() {
    if (!navigator.clipboard?.readText) return '';
    const delays = [60, 180, 360];
    for (const d of delays) {
      await new Promise((r) => setTimeout(r, d));
      try {
        const txt = (await navigator.clipboard.readText()).trim();
        const normalized = normalizeStatusUrl(txt);
        if (STATUS_RE.test(normalized)) return normalized;
      } catch {
        // ignore and continue
      }
    }
    return '';
  }

  async function tryCaptureFromClipboard() {
    if (reading) return;
    reading = true;
    try {
      const fromClipboard = await readClipboardStatusUrl();
      const statusUrl = fromClipboard;
      if (!statusUrl || !STATUS_RE.test(statusUrl)) return;
      if (statusUrl === lastClipboardStatusUrl) return;
      if (isRecent(statusUrl)) return;
      lastClipboardStatusUrl = statusUrl;

      safeSendRuntimeMessage({
        type: 'capture-copied-link',
        url: statusUrl,
        name: getRememberedArticleName(statusUrl)
      });
    } finally {
      reading = false;
    }
  }

  document.addEventListener(
    'click',
    (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const article = target.closest('article');
      if (article) {
        rememberArticleContext(article);
      }
      tryCaptureFromClipboard().catch(() => {});
    },
    true
  );

  document.addEventListener(
    'contextmenu',
    (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const article = target.closest('article');
      if (!article) return;
      rememberArticleContext(article);
    },
    true
  );

  try {
    chrome.runtime.onMessage.addListener((message) => {
      if (message?.type === 'show-capture-toast') {
        runSafely(() => showToast(message.text, message.level));
      }
    });
  } catch {
    // Ignore stale content-script registration after extension reload.
  }
})();
