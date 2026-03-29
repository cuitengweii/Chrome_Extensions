const LAST_POOL_KEY = 'follow_builders_last_pool';
const AUTO_CLIPBOARD_KEY = 'follow_builders_auto_clipboard';
const POOL_CACHE_KEY = 'follow_builders_pool_cache_v1';
const LAST_WRITE_RESULT_KEY = 'follow_builders_last_write_result_v1';

const poolEl = document.getElementById('pool');
const poolHintEl = document.getElementById('poolHint');
const autoClipboardEl = document.getElementById('autoClipboard');
const statusEl = document.getElementById('status');
const writeResultEl = document.getElementById('writeResult');
const fromClipboardBtn = document.getElementById('fromClipboard');
const openManagerBtn = document.getElementById('openManager');

let pools = [];
let watcherTimer = null;
let lastClipboardSignature = '';

function setStatus(text) {
  statusEl.textContent = text || '';
}

function formatResultTime(value) {
  if (value == null) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('zh-CN', { hour12: false });
}

function buildStatusFromWriteResult(result) {
  if (!result) return '';
  const pool = String(result.poolLabel || result.pool || 'pool');
  if (result.ok) {
    return `Added ${Number(result.added || 0)} to ${pool}, deduped ${Number(result.duplicates || 0)}.`;
  }
  return `Add failed in ${pool}: ${String(result.error || 'Unknown error')}`;
}

function renderWriteResult(result) {
  if (!writeResultEl) return;
  if (!result) {
    writeResultEl.textContent = 'Last DB write: none.';
    writeResultEl.classList.remove('error');
    return;
  }

  const pool = String(result.poolLabel || result.pool || 'pool');
  const timeText = formatResultTime(result.at || result.ts);
  if (result.ok) {
    writeResultEl.textContent =
      `Last DB write: OK${timeText ? ` @ ${timeText}` : ''} · ${pool} · +${Number(result.added || 0)}, dedup ${Number(result.duplicates || 0)}.`;
    writeResultEl.classList.remove('error');
  } else {
    writeResultEl.textContent =
      `Last DB write: FAILED${timeText ? ` @ ${timeText}` : ''} · ${pool} · ${String(result.error || 'Unknown error')}`;
    writeResultEl.classList.add('error');
  }
}

async function loadLastWriteResult() {
  const current = await chrome.storage.local.get(LAST_WRITE_RESULT_KEY);
  renderWriteResult(current?.[LAST_WRITE_RESULT_KEY] || null);
}

function setPoolHint(text, loading = false) {
  poolHintEl.textContent = text || '';
  poolHintEl.classList.toggle('loading', Boolean(loading));
}

function setPopupLoadingState(loading) {
  poolEl.disabled = loading;
  fromClipboardBtn.disabled = loading;
  openManagerBtn.disabled = false;
  setPoolHint(
    loading ? 'Loading collections from database...' : `${pools.length || 0} collections ready.`,
    loading
  );
}

function normalizePool(pool) {
  const v = String(pool || '').trim().toLowerCase();
  return v || 'ai_builders';
}

function extractUrls(text) {
  const matches = String(text || '').match(/https?:\/\/[^\s]+/gi) || [];
  return [...new Set(matches.map((u) => u.replace(/[)\]>,.;]+$/g, '').trim()).filter(Boolean))];
}

async function sendRuntimeMessage(payload) {
  const resp = await chrome.runtime.sendMessage(payload);
  if (!resp?.ok) {
    throw new Error(resp?.error || 'Extension message failed');
  }
  return resp;
}

async function loadPoolsFromDb() {
  const resp = await sendRuntimeMessage({ type: 'list-pools' });
  pools = Array.isArray(resp.pools) ? resp.pools : [];
  await chrome.storage.local.set({
    [POOL_CACHE_KEY]: {
      pools,
      updatedAt: Date.now()
    }
  });
}

async function loadPoolsFromCache() {
  const current = await chrome.storage.local.get(POOL_CACHE_KEY);
  const cachedPools = current?.[POOL_CACHE_KEY]?.pools;
  if (Array.isArray(cachedPools) && cachedPools.length > 0) {
    pools = cachedPools;
    return true;
  }
  return false;
}

async function rememberPool(pool) {
  await chrome.storage.local.set({ [LAST_POOL_KEY]: normalizePool(pool) });
}

async function getRememberedPool() {
  const current = await chrome.storage.local.get(LAST_POOL_KEY);
  return normalizePool(current[LAST_POOL_KEY]);
}

function renderLoadingOption() {
  poolEl.innerHTML = '<option value="">Loading collections...</option>';
}

function renderPoolOptions(selectedPool) {
  poolEl.innerHTML = '';
  pools.forEach((pool) => {
    const opt = document.createElement('option');
    opt.value = normalizePool(pool.key);
    opt.textContent = String(pool.label || pool.key);
    poolEl.appendChild(opt);
  });
  const selected = normalizePool(selectedPool);
  if ([...poolEl.options].some((option) => option.value === selected)) {
    poolEl.value = selected;
  } else if (poolEl.options.length > 0) {
    poolEl.value = poolEl.options[0].value;
  }
}

async function addUrlsToSelectedPool(urls, source = 'popup') {
  const pool = normalizePool(poolEl.value);
  return sendRuntimeMessage({
    type: 'add-urls-to-pool',
    pool,
    urls,
    source
  });
}

async function importFromClipboard(silent = false) {
  const text = await navigator.clipboard.readText();
  const urls = extractUrls(text);
  if (urls.length === 0) {
    if (!silent) setStatus('No supported links found in clipboard.');
    return;
  }

  const signature = urls.join('|');
  if (silent && signature === lastClipboardSignature) return;
  lastClipboardSignature = signature;

  const filtered = await sendRuntimeMessage({ type: 'filter-uncaptured-urls', urls });
  const pendingUrls = Array.isArray(filtered.pendingUrls) ? filtered.pendingUrls : urls;
  const skipped = Number(filtered.skipped || 0);
  if (pendingUrls.length === 0) {
    if (!silent) setStatus(`These links were already auto-captured. Skipped ${skipped}.`);
    return;
  }

  const result = await addUrlsToSelectedPool(pendingUrls, silent ? 'popup_auto_clipboard' : 'popup_clipboard_button');
  const skippedText = skipped > 0 ? ` Auto-skipped ${skipped}.` : '';
  setStatus(`${buildStatusFromWriteResult({ ok: true, ...result })}${skippedText}`);
}

function stopClipboardWatcher() {
  if (watcherTimer) {
    clearInterval(watcherTimer);
    watcherTimer = null;
  }
}

function startClipboardWatcher() {
  stopClipboardWatcher();
  watcherTimer = setInterval(() => {
    importFromClipboard(true).catch(() => {});
  }, 1200);
}

fromClipboardBtn.addEventListener('click', async () => {
  try {
    await importFromClipboard(false);
  } catch (err) {
    setStatus(`Import failed: ${err.message}`);
  }
});

openManagerBtn.addEventListener('click', async () => {
  await chrome.runtime.openOptionsPage();
});

poolEl.addEventListener('change', async () => {
  await rememberPool(poolEl.value);
});

autoClipboardEl.addEventListener('change', async () => {
  const enabled = Boolean(autoClipboardEl.checked);
  await chrome.storage.local.set({ [AUTO_CLIPBOARD_KEY]: enabled });
  if (enabled) {
    startClipboardWatcher();
    setStatus('Clipboard auto-listening enabled.');
  } else {
    stopClipboardWatcher();
    setStatus('Clipboard auto-listening disabled.');
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;
  const nextResult = changes?.[LAST_WRITE_RESULT_KEY]?.newValue;
  if (!nextResult) return;
  renderWriteResult(nextResult);
  setStatus(buildStatusFromWriteResult(nextResult));
});

async function initPopup() {
  renderLoadingOption();
  setPopupLoadingState(true);

  const remembered = await getRememberedPool();
  const current = await chrome.storage.local.get(AUTO_CLIPBOARD_KEY);
  autoClipboardEl.checked = Boolean(current[AUTO_CLIPBOARD_KEY]);
  await loadLastWriteResult();

  const hasCache = await loadPoolsFromCache();
  if (hasCache) {
    renderPoolOptions(remembered);
    await rememberPool(poolEl.value);
    setPopupLoadingState(false);
    setStatus(autoClipboardEl.checked ? 'Using cached collections. Syncing in background...' : 'Using cached collections.');
  } else {
    setStatus('Opening collections...');
  }

  try {
    await loadPoolsFromDb();
    renderPoolOptions(remembered);
    await rememberPool(poolEl.value);
    setPopupLoadingState(false);
    if (autoClipboardEl.checked) {
      startClipboardWatcher();
      setStatus('Collections synced. Clipboard auto-listening is on.');
    } else {
      setStatus('Collections synced.');
    }
  } catch (err) {
    setPopupLoadingState(false);
    if (hasCache) {
      if (autoClipboardEl.checked) startClipboardWatcher();
      setStatus(`Using cached collections. Sync failed: ${err.message}`);
    } else {
      setStatus(`Init failed: ${err.message}`);
      setPoolHint('Collections failed to load.', false);
    }
    return;
  }

  if (autoClipboardEl.checked) {
    startClipboardWatcher();
  }
}

initPopup().catch((err) => {
  setPopupLoadingState(false);
  setStatus(`Init failed: ${err.message}`);
});

window.addEventListener('beforeunload', () => {
  stopClipboardWatcher();
});
