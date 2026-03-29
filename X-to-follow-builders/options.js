const LAST_POOL_KEY = 'follow_builders_last_pool';
const POOL_CHANGE_KEY = 'follow_builders_pool_change_v1';
const LAST_WRITE_RESULT_KEY = 'follow_builders_last_write_result_v1';

const BASE_POOLS = [
  { key: 'ai_builders', label: 'AI 构建者' },
  { key: 'ai_agents', label: 'AI Agent' },
  { key: 'ai_research', label: 'AI 研究' }
];
const BASE_POOL_KEY_SET = new Set(BASE_POOLS.map((p) => p.key));
const META_POOL_KEY = '__meta__';

const SUPABASE_URL = 'https://fmlneautjackwrcoaevo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_UbhDHFfR_lc60cToC1WK2w_5Pfv-5PO';
const SUPABASE_OWNER_ID = 'allen_local';
const SUPABASE_TABLE = 'fb_candidate_pool_snapshots';

const els = {
  status: document.getElementById('status'),
  writeResult: document.getElementById('writeResult'),
  busyMask: document.getElementById('busyMask'),
  busyText: document.getElementById('busyText'),

  addPoolInlineBtn: document.getElementById('addPoolInlineBtn'),
  poolList: document.getElementById('poolList'),
  currentPoolTitle: document.getElementById('currentPoolTitle'),
  searchInput: document.getElementById('searchInput'),
  refreshBtn: document.getElementById('refreshBtn'),
  importClipboardBtn: document.getElementById('importClipboardBtn'),
  selectAllToggle: document.getElementById('selectAllToggle'),
  selectedCount: document.getElementById('selectedCount'),
  bulkMoveTarget: document.getElementById('bulkMoveTarget'),
  bulkMoveBtn: document.getElementById('bulkMoveBtn'),
  clearSelectionBtn: document.getElementById('clearSelectionBtn'),
  accountList: document.getElementById('accountList'),

  modalMask: document.getElementById('modalMask'),
  modalTitle: document.getElementById('modalTitle'),
  modalDesc: document.getElementById('modalDesc'),
  modalFields: document.getElementById('modalFields'),
  modalCancelBtn: document.getElementById('modalCancelBtn'),
  modalConfirmBtn: document.getElementById('modalConfirmBtn')
};

const state = {
  activePool: 'ai_builders',
  search: '',
  poolRows: new Map(),
  pools: [],
  customPools: [],
  selectedKeys: new Set(),
  enrichingPool: '',
  silentReloadTimer: null,
  silentReloadInFlight: false,
  modalResolver: null,
  modalValueGetter: null
};

function setStatus(text) {
  els.status.textContent = text || '';
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
  if (!els.writeResult) return;
  if (!result) {
    els.writeResult.textContent = 'No write records yet.';
    els.writeResult.classList.remove('error');
    return;
  }

  const pool = String(result.poolLabel || result.pool || 'pool');
  const timeText = formatResultTime(result.at || result.ts);
  if (result.ok) {
    els.writeResult.textContent =
      `OK${timeText ? ` @ ${timeText}` : ''} · ${pool} · +${Number(result.added || 0)}, dedup ${Number(result.duplicates || 0)}, total ${Number(result.total || 0)}.`;
    els.writeResult.classList.remove('error');
  } else {
    els.writeResult.textContent =
      `FAILED${timeText ? ` @ ${timeText}` : ''} · ${pool} · ${String(result.error || 'Unknown error')}`;
    els.writeResult.classList.add('error');
  }
}

function buildWriteResultPayload(payload = {}) {
  return {
    ok: Boolean(payload.ok),
    source: String(payload.source || 'options'),
    pool: normalizePool(payload.pool),
    poolLabel: String(payload.poolLabel || payload.pool || ''),
    added: Number(payload.added || 0),
    duplicates: Number(payload.duplicates || 0),
    upgraded: Number(payload.upgraded || 0),
    total: Number(payload.total || 0),
    attempted: Number(payload.attempted || 0),
    error: String(payload.error || ''),
    at: new Date().toISOString(),
    ts: Date.now()
  };
}

async function publishLocalWriteResult(payload = {}) {
  try {
    await chrome.storage.local.set({
      [LAST_WRITE_RESULT_KEY]: buildWriteResultPayload(payload)
    });
  } catch {
    // Ignore local diagnostics sync failures.
  }
}

async function loadLastWriteResult() {
  const current = await chrome.storage.local.get(LAST_WRITE_RESULT_KEY);
  renderWriteResult(current?.[LAST_WRITE_RESULT_KEY] || null);
}

function setBusy(loading, text = '连接数据库中...') {
  els.busyMask.classList.toggle('show', Boolean(loading));
  els.busyText.textContent = text;
}

function scheduleSilentReload(changeMeta = null) {
  if (state.silentReloadTimer) {
    clearTimeout(state.silentReloadTimer);
  }
  state.silentReloadTimer = window.setTimeout(async () => {
    if (state.silentReloadInFlight) return;
    state.silentReloadInFlight = true;
    try {
      await reloadData({ skipEnrich: true });
      const changedPool = String(changeMeta?.pool || '').trim();
      setStatus('检测到更新，正在加载...');
    } catch {
      // Keep current UI if silent refresh fails.
    } finally {
      state.silentReloadInFlight = false;
    }
  }, 250);
}

function normalizePool(pool) {
  const v = String(pool || '').trim().toLowerCase();
  return v || 'ai_builders';
}

function slugifyPoolName(name) {
  const ascii = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return ascii ? `custom_${ascii}` : `custom_${Date.now()}`;
}

function normalizeUrl(url) {
  try {
    const u = new URL(String(url || '').trim());
    if (u.hostname === 'www.x.com') u.hostname = 'x.com';
    u.hash = '';
    if (u.hostname === 'x.com') u.search = '';
    return u.toString();
  } catch {
    return String(url || '').trim();
  }
}

function extractUrls(text) {
  const matches = String(text || '').match(/https?:\/\/[^\s]+/gi) || [];
  return [...new Set(matches.map((u) => u.replace(/[)\]>,.;]+$/g, '').trim()).filter(Boolean))];
}

function inferSourceType(url) {
  if (/^https:\/\/x\.com\/[^/]+$/i.test(url)) return 'x_account';
  if (/^https:\/\/x\.com\/[^/]+\/status\/\d+/i.test(url)) return 'x_status';
  if (/youtube\.com\/playlist\?list=/i.test(url)) return 'youtube_playlist';
  if (/youtube\.com\/@[^/]+/i.test(url)) return 'youtube_channel';
  if (/youtube\.com\/channel\//i.test(url)) return 'youtube_channel';
  return 'unknown';
}

function toAccountCandidateUrl(url, sourceType) {
  if (sourceType === 'x_status') {
    const m = url.match(/^https:\/\/x\.com\/([^/?#]+)\/status\/\d+/i);
    if (m) return `https://x.com/${m[1]}`;
  }
  return url;
}

function mapToStoredSourceType(sourceType) {
  return sourceType === 'x_status' ? 'x_account' : sourceType;
}

function extractHandleOrId(url, sourceType) {
  if (sourceType === 'x_account') {
    const m = url.match(/^https:\/\/x\.com\/([^/?#]+)/i);
    return m ? m[1] : '';
  }
  if (sourceType === 'youtube_channel') {
    const at = url.match(/youtube\.com\/@([^/?#]+)/i);
    if (at) return at[1];
    const ch = url.match(/youtube\.com\/channel\/([^/?#]+)/i);
    return ch ? ch[1] : '';
  }
  if (sourceType === 'youtube_playlist') {
    try {
      const u = new URL(url);
      return u.searchParams.get('list') || '';
    } catch {
      return '';
    }
  }
  return '';
}

function buildCandidateFromUrl(rawUrl, explicitName = '') {
  const original = normalizeUrl(rawUrl);
  const sourceTypeRaw = inferSourceType(original);
  const normalizedUrl = toAccountCandidateUrl(original, sourceTypeRaw);
  const sourceType = mapToStoredSourceType(sourceTypeRaw);
  const handleOrId = extractHandleOrId(normalizedUrl, sourceType);
  if (!normalizedUrl || sourceType === 'unknown') return null;
  return {
    id: crypto.randomUUID(),
    source_type: sourceType,
    name: String(explicitName || handleOrId || '').trim(),
    handle_or_id: handleOrId,
    url: normalizedUrl,
    discovered_at: new Date().toISOString(),
    discovered_from: original,
    confidence: 0.8,
    status: 'pending',
    reason: ''
  };
}

function candidateKey(candidate) {
  return `${String(candidate?.source_type || '').toLowerCase()}|${normalizeUrl(candidate?.url || '')}`;
}

function dedupeCandidates(list) {
  const out = [];
  const seen = new Set();
  for (const c of list || []) {
    const key = candidateKey(c);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...extra
  };
}

async function supabaseRequest(pathWithQuery, options = {}) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${pathWithQuery}`, {
    method: options.method || 'GET',
    headers: supabaseHeaders(options.headers || {}),
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(text || `HTTP ${resp.status}`);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function fetchPoolRows() {
  const query = [
    `${SUPABASE_TABLE}?owner_id=eq.${encodeURIComponent(SUPABASE_OWNER_ID)}`,
    'select=owner_id,pool_key,pool_label,candidates,custom_pools,updated_at',
    'order=pool_key.asc'
  ].join('&');
  const rows = await supabaseRequest(query, { method: 'GET' });
  return Array.isArray(rows) ? rows : [];
}

function getCustomPoolsFromRows(rows) {
  const meta = rows.find((r) => normalizePool(r.pool_key) === META_POOL_KEY);
  const source = Array.isArray(meta?.custom_pools)
    ? meta.custom_pools
    : (rows.find((r) => Array.isArray(r.custom_pools) && r.custom_pools.length > 0)?.custom_pools || []);

  const seen = new Set();
  const custom = [];
  source.forEach((p) => {
    const key = normalizePool(p?.key);
    const label = String(p?.label || '').trim();
    if (!key || !label) return;
    if (BASE_POOL_KEY_SET.has(key) || key === META_POOL_KEY) return;
    if (seen.has(key)) return;
    seen.add(key);
    custom.push({ key, label });
  });
  return custom;
}

function buildPools(rows, customPools) {
  const poolMap = new Map(BASE_POOLS.map((p) => [normalizePool(p.key), { key: normalizePool(p.key), label: p.label }]));
  customPools.forEach((p) => {
    poolMap.set(normalizePool(p.key), { key: normalizePool(p.key), label: p.label });
  });
  rows.forEach((r) => {
    const key = normalizePool(r.pool_key);
    if (key === META_POOL_KEY) return;
    if (!poolMap.has(key)) {
      poolMap.set(key, { key, label: String(r.pool_label || key) });
    }
  });
  const rowByKey = new Map(
    rows
      .filter((row) => normalizePool(row.pool_key) !== META_POOL_KEY)
      .map((row) => [normalizePool(row.pool_key), row])
  );
  const baseIndex = new Map(BASE_POOLS.map((pool, index) => [normalizePool(pool.key), index]));

  return [...poolMap.values()].sort((left, right) => {
    const leftKey = normalizePool(left.key);
    const rightKey = normalizePool(right.key);
    const leftTs = Date.parse(String(rowByKey.get(leftKey)?.updated_at || '')) || 0;
    const rightTs = Date.parse(String(rowByKey.get(rightKey)?.updated_at || '')) || 0;
    if (leftTs !== rightTs) return rightTs - leftTs;

    const leftBase = baseIndex.has(leftKey);
    const rightBase = baseIndex.has(rightKey);
    if (leftBase !== rightBase) return leftBase ? 1 : -1;
    if (leftBase && rightBase) return (baseIndex.get(leftKey) || 0) - (baseIndex.get(rightKey) || 0);
    return String(left.label || left.key).localeCompare(String(right.label || right.key), 'zh-CN');
  });
}

function poolLabel(poolKey) {
  const key = normalizePool(poolKey);
  return state.pools.find((p) => p.key === key)?.label || key;
}

function getPoolRow(poolKey) {
  const key = normalizePool(poolKey);
  return state.poolRows.get(key) || {
    owner_id: SUPABASE_OWNER_ID,
    pool_key: key,
    pool_label: poolLabel(key),
    candidates: [],
    custom_pools: state.customPools
  };
}

async function upsertRows(rows) {
  if (!rows || rows.length === 0) return;
  await supabaseRequest(`${SUPABASE_TABLE}?on_conflict=owner_id,pool_key`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: rows
  });
}

async function upsertPoolRow(poolKey, poolLabelText, candidates) {
  await upsertRows([
    {
      owner_id: SUPABASE_OWNER_ID,
      pool_key: normalizePool(poolKey),
      pool_label: String(poolLabelText || poolKey),
      candidates: dedupeCandidates(candidates || []),
      custom_pools: state.customPools,
      updated_at: new Date().toISOString()
    }
  ]);
}

async function upsertMetaRow() {
  await upsertRows([
    {
      owner_id: SUPABASE_OWNER_ID,
      pool_key: META_POOL_KEY,
      pool_label: '__meta__',
      candidates: [],
      custom_pools: state.customPools,
      updated_at: new Date().toISOString()
    }
  ]);
}

async function deletePoolRow(poolKey) {
  await supabaseRequest(
    `${SUPABASE_TABLE}?owner_id=eq.${encodeURIComponent(SUPABASE_OWNER_ID)}&pool_key=eq.${encodeURIComponent(normalizePool(poolKey))}`,
    { method: 'DELETE', headers: { Prefer: 'return=minimal' } }
  );
}

async function rememberActivePool() {
  await chrome.storage.local.set({ [LAST_POOL_KEY]: normalizePool(state.activePool) });
}

async function loadRememberedPool() {
  const current = await chrome.storage.local.get(LAST_POOL_KEY);
  return normalizePool(current[LAST_POOL_KEY] || 'ai_builders');
}

function avatarUrl(candidate) {
  const type = String(candidate?.source_type || '');
  const handle = String(candidate?.handle_or_id || '').trim();
  if (type === 'x_account' && handle) {
    return `https://unavatar.io/x/${encodeURIComponent(handle)}?fallback=false`;
  }
  if (type === 'youtube_channel' && handle) {
    return `https://unavatar.io/youtube/${encodeURIComponent(handle)}?fallback=false`;
  }
  try {
    const u = new URL(candidate?.url || '');
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(u.hostname)}&sz=128`;
  } catch {
    return '';
  }
}

function getCandidatesForActivePool() {
  const row = getPoolRow(state.activePool);
  const all = Array.isArray(row.candidates) ? row.candidates : [];
  const q = String(state.search || '').trim().toLowerCase();
  const filtered = q
    ? all.filter((c) => `${c.name || ''} ${c.handle_or_id || ''} ${c.url || ''}`.toLowerCase().includes(q))
    : all;
  return [...filtered].sort((left, right) => {
    const leftTs = Date.parse(String(left?.discovered_at || '')) || 0;
    const rightTs = Date.parse(String(right?.discovered_at || '')) || 0;
    if (leftTs !== rightTs) return rightTs - leftTs;
    return String(right?.id || '').localeCompare(String(left?.id || ''));
  });
}

function getActivePoolCandidateKeys() {
  const row = getPoolRow(state.activePool);
  const all = Array.isArray(row.candidates) ? row.candidates : [];
  return new Set(all.map(candidateKey));
}

function getVisibleCandidateKeys() {
  return getCandidatesForActivePool().map(candidateKey);
}

function pruneSelectedKeys() {
  const activeKeys = getActivePoolCandidateKeys();
  const next = new Set();
  for (const key of state.selectedKeys) {
    if (activeKeys.has(key)) next.add(key);
  }
  state.selectedKeys = next;
}

function renderBulkControls() {
  const visibleKeys = getVisibleCandidateKeys();
  const selectedVisible = visibleKeys.filter((k) => state.selectedKeys.has(k));
  const selectedCount = state.selectedKeys.size;

  const countStrong = els.selectedCount?.querySelector('strong');
  if (countStrong) {
    countStrong.textContent = String(selectedCount);
  } else if (els.selectedCount) {
    els.selectedCount.textContent = `已选 ${selectedCount}`;
  }

  if (els.selectAllToggle) {
    els.selectAllToggle.checked = visibleKeys.length > 0 && selectedVisible.length === visibleKeys.length;
    els.selectAllToggle.indeterminate = selectedVisible.length > 0 && selectedVisible.length < visibleKeys.length;
  }

  if (els.bulkMoveTarget) {
    const current = String(els.bulkMoveTarget.value || '');
    const options = state.pools
      .filter((p) => normalizePool(p.key) !== normalizePool(state.activePool))
      .map((p) => `<option value="${p.key}">${p.label}</option>`)
      .join('');
    els.bulkMoveTarget.innerHTML = options || '<option value="">无可移动目标</option>';
    if (current && [...els.bulkMoveTarget.options].some((opt) => opt.value === current)) {
      els.bulkMoveTarget.value = current;
    }
  }

  const canBulkMove = selectedCount > 0 && state.pools.length > 1 && Boolean(els.bulkMoveTarget?.value);
  if (els.bulkMoveBtn) els.bulkMoveBtn.disabled = !canBulkMove;
  if (els.clearSelectionBtn) els.clearSelectionBtn.disabled = selectedCount === 0;
}

function getCardTitle(candidate) {
  const sourceType = String(candidate?.source_type || '');
  const handle = String(candidate?.handle_or_id || '').trim();
  const name = String(candidate?.name || '').trim();
  if (sourceType === 'x_account') {
    if (name && handle && name.toLowerCase() !== handle.toLowerCase()) return name;
    if (name && !handle) return name;
    if (handle) return `@${handle}`;
  }
  return String(candidate?.name || handle || '未命名账号');
}

function getCardSubtitle(candidate) {
  const sourceType = String(candidate?.source_type || 'unknown');
  const handle = String(candidate?.handle_or_id || '').trim();
  if (sourceType === 'x_account') {
    return handle ? `x_account · @${handle}` : 'x_account';
  }
  return handle ? `${sourceType} · ${handle}` : sourceType;
}

function needsXDisplayName(candidate) {
  if (String(candidate?.source_type || '') !== 'x_account') return false;
  const handle = String(candidate?.handle_or_id || '').trim();
  const name = String(candidate?.name || '').trim();
  if (!handle) return false;
  if (!name) return true;
  return name.toLowerCase() === handle.toLowerCase() || name === `@${handle}`;
}

async function fetchXDisplayNames(handles) {
  const unique = [...new Set((handles || []).map((h) => String(h || '').trim()).filter(Boolean))];
  const result = new Map();
  const chunkSize = 20;

  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const url = `https://cdn.syndication.twimg.com/widgets/followbutton/info.json?screen_names=${encodeURIComponent(chunk.join(','))}`;
    let resp;
    try {
      resp = await fetch(url);
    } catch {
      continue;
    }
    if (!resp.ok) continue;
    const text = await resp.text();
    if (!text) continue;
    let rows = null;
    try {
      rows = JSON.parse(text);
    } catch {
      continue;
    }
    if (!Array.isArray(rows)) continue;
    rows.forEach((row) => {
      const handle = String(row?.screen_name || '').trim().toLowerCase();
      const name = String(row?.name || '').trim();
      if (handle && name) result.set(handle, name);
    });
  }
  return result;
}

async function fetchXDisplayNameFromProfilePage(handle) {
  const h = String(handle || '').trim();
  if (!h) return '';
  const tryParseTitle = (html) => {
    const m = String(html || '').match(/<title>([^<]+)<\/title>/i) || String(html || '').match(/^Title:\s*(.+)$/im);
    if (!m) return '';
    const cleaned = String(m[1] || '')
      .replace(/\s*\(@[^)]*\)\s*\/\s*X$/i, '')
      .replace(/\s*\/\s*X$/i, '')
      .trim();
    if (/^(x|home|login|sign up|explore)$/i.test(cleaned)) return '';
    if (!cleaned || cleaned.toLowerCase() === h.toLowerCase()) return '';
    return cleaned;
  };

  try {
    const resp = await fetch(`https://x.com/${encodeURIComponent(h)}`);
    if (resp.ok) {
      const html = await resp.text();
      const directName = tryParseTitle(html);
      if (directName) return directName;
    }
  } catch {
    // Fall through to jina mirror.
  }

  try {
    const resp = await fetch(`https://r.jina.ai/http://x.com/${encodeURIComponent(h)}`);
    if (!resp.ok) return '';
    const text = await resp.text();
    return tryParseTitle(text);
  } catch {
    return '';
  }
}

async function enrichXNamesForPool(poolKey) {
  const key = normalizePool(poolKey);
  if (state.enrichingPool === key) return 0;
  const row = getPoolRow(key);
  const list = Array.isArray(row.candidates) ? row.candidates : [];
  const missingHandles = list
    .filter((c) => needsXDisplayName(c))
    .map((c) => String(c.handle_or_id || '').trim().toLowerCase())
    .filter(Boolean);
  if (missingHandles.length === 0) return 0;

  state.enrichingPool = key;
  try {
    const nameMap = await fetchXDisplayNames(missingHandles);
    if (nameMap.size < missingHandles.length) {
      const unresolved = missingHandles.filter((h) => !nameMap.has(h));
      for (const handle of unresolved.slice(0, 20)) {
        const name = await fetchXDisplayNameFromProfilePage(handle);
        if (name) nameMap.set(handle, name);
      }
    }
    if (nameMap.size === 0) return 0;

    let updatedCount = 0;
    const next = list.map((c) => {
      if (String(c?.source_type || '') !== 'x_account') return c;
      const handle = String(c?.handle_or_id || '').trim().toLowerCase();
      const nextName = nameMap.get(handle);
      if (!nextName) return c;
      const prevName = String(c?.name || '').trim();
      if (prevName === nextName) return c;
      updatedCount += 1;
      return { ...c, name: nextName };
    });

    if (updatedCount > 0) {
      await upsertPoolRow(key, poolLabel(key), next);
    }
    return updatedCount;
  } finally {
    state.enrichingPool = '';
  }
}

async function enrichXNamesForAllPools() {
  const poolKeys = state.pools.map((pool) => normalizePool(pool.key));
  let updatedTotal = 0;
  let updatedPools = 0;

  for (const poolKey of poolKeys) {
    if (els.busyMask?.classList.contains('show')) {
      els.busyText.textContent = '正在加载...';
    }
    const updated = await enrichXNamesForPool(poolKey);
    if (updated > 0) {
      updatedTotal += updated;
      updatedPools += 1;
    }
  }

  return { updatedTotal, updatedPools };
}

function renderPoolSidebar() {
  els.poolList.innerHTML = '';
  state.pools.forEach((p) => {
    const key = normalizePool(p.key);
    const count = Array.isArray(getPoolRow(key).candidates) ? getPoolRow(key).candidates.length : 0;
    const isCustom = !BASE_POOL_KEY_SET.has(key);
    const row = document.createElement('div');
    row.className = `pool-item${key === state.activePool ? ' active' : ''}`;
    row.setAttribute('data-pool', key);
    row.innerHTML = `
      <div class="pool-label">${p.label}</div>
      <div class="pool-row-actions">
        <button class="icon-btn" data-pool-action="add-account" data-pool-key="${key}" title="新增账号">+</button>
        <button class="icon-btn" data-pool-action="export" data-pool-key="${key}" title="导出 JSON">⭳</button>
        ${isCustom ? `<button class="icon-btn" data-pool-action="rename" data-pool-key="${key}" title="改名">✎</button>` : ''}
        ${isCustom ? `<button class="icon-btn danger" data-pool-action="delete" data-pool-key="${key}" title="删除">🗑</button>` : ''}
      </div>
      <div class="pool-count">${count}</div>
    `;
    els.poolList.appendChild(row);
  });
  els.currentPoolTitle.textContent = `账号池 · ${poolLabel(state.activePool)}`;
}

function buildMoveOptions(selectedPool) {
  return state.pools
    .map((p) => `<option value="${p.key}"${normalizePool(p.key) === normalizePool(selectedPool) ? ' selected' : ''}>${p.label}</option>`)
    .join('');
}

function renderAccountList() {
  const rows = getCandidatesForActivePool();
  els.accountList.innerHTML = '';

  if (rows.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'account-card';
    empty.innerHTML = `
      <div></div>
      <div class="avatar-fallback" style="display:flex;">空</div>
      <div class="meta">
        <div class="name">当前集合暂无账号</div>
        <div class="sub">可点击左侧集合行内“+”图标新增，或使用剪贴板入池。</div>
      </div>
    `;
    els.accountList.appendChild(empty);
    renderBulkControls();
    return;
  }

  rows.forEach((c) => {
    const key = candidateKey(c);
    const card = document.createElement('div');
    card.className = 'account-card';

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.className = 'row-check';
    check.setAttribute('data-select-key', key);
    check.checked = state.selectedKeys.has(key);

    const img = document.createElement('img');
    img.className = 'avatar';
    img.src = avatarUrl(c);

    const fallback = document.createElement('div');
    fallback.className = 'avatar-fallback';
    fallback.textContent = getCardTitle(c).replace(/^@/, '').slice(0, 2).toUpperCase();
    img.onerror = () => {
      img.style.display = 'none';
      fallback.style.display = 'flex';
    };

    const left = document.createElement('div');
    left.appendChild(img);
    left.appendChild(fallback);

    const right = document.createElement('div');
    right.className = 'meta';
    right.innerHTML = `
      <div class="name">${getCardTitle(c)}</div>
      <div class="sub">${getCardSubtitle(c)}</div>
      <a class="link" href="${String(c.url || '#')}" target="_blank" rel="noopener noreferrer">${String(c.url || '')}</a>
      <div class="actions">
        <select data-move-select="${key}">${buildMoveOptions(state.activePool)}</select>
        <button data-move-btn="${key}">移动</button>
        <button class="danger" data-del-btn="${key}">删除</button>
      </div>
    `;

    card.appendChild(check);
    card.appendChild(left);
    card.appendChild(right);
    els.accountList.appendChild(card);
  });

  renderBulkControls();
}

function closeModal(result) {
  els.modalMask.classList.remove('show');
  const resolve = state.modalResolver;
  state.modalResolver = null;
  state.modalValueGetter = null;
  if (resolve) resolve(result);
}

function openModal({ title, desc = '', fieldsHtml = '', confirmText = '确认', confirmDanger = false, valueGetter = null }) {
  els.modalTitle.textContent = title;
  els.modalDesc.textContent = desc;
  els.modalFields.innerHTML = fieldsHtml;
  els.modalConfirmBtn.textContent = confirmText;
  els.modalConfirmBtn.classList.toggle('danger', Boolean(confirmDanger));
  els.modalConfirmBtn.classList.toggle('primary', !confirmDanger);
  els.modalMask.classList.add('show');
  const firstInput = els.modalFields.querySelector('input');
  if (firstInput instanceof HTMLInputElement) {
    setTimeout(() => firstInput.focus(), 0);
  }
  state.modalValueGetter = valueGetter;
  return new Promise((resolve) => {
    state.modalResolver = resolve;
  });
}

async function showCreateCollectionModal() {
  return openModal({
    title: '增加集合',
    desc: '输入新集合名称后会立刻创建并同步到数据库。',
    fieldsHtml: `
      <div class="modal-field">
        <label for="modalCollectionName">集合名称</label>
        <input id="modalCollectionName" placeholder="例如：中文AI博主" />
      </div>
    `,
    confirmText: '创建',
    valueGetter: () => String(document.getElementById('modalCollectionName')?.value || '').trim()
  });
}

async function showRenameCollectionModal(currentName) {
  return openModal({
    title: '集合改名',
    desc: '只会修改集合名称，不影响集合内账号。',
    fieldsHtml: `
      <div class="modal-field">
        <label for="modalCollectionRename">新名称</label>
        <input id="modalCollectionRename" value="${String(currentName || '').replace(/"/g, '&quot;')}" />
      </div>
    `,
    confirmText: '保存',
    valueGetter: () => String(document.getElementById('modalCollectionRename')?.value || '').trim()
  });
}

async function showAddAccountModal(collectionLabel) {
  return openModal({
    title: `新增账号 · ${collectionLabel}`,
    desc: '支持 X 账号/帖子、YouTube 频道/播放列表链接。',
    fieldsHtml: `
      <div class="modal-field">
        <label for="modalAccountUrl">账号链接</label>
        <input id="modalAccountUrl" placeholder="https://x.com/..." />
      </div>
      <div class="modal-field">
        <label for="modalAccountName">账号名称（可选）</label>
        <input id="modalAccountName" placeholder="例如：向阳乔木" />
      </div>
    `,
    confirmText: '新增',
    valueGetter: () => ({
      url: String(document.getElementById('modalAccountUrl')?.value || '').trim(),
      name: String(document.getElementById('modalAccountName')?.value || '').trim()
    })
  });
}

async function showDeleteCollectionModal(collectionLabel) {
  return openModal({
    title: '删除集合',
    desc: `确认删除集合「${collectionLabel}」吗？该集合内账号会一起删除。`,
    fieldsHtml: '',
    confirmText: '确认删除',
    confirmDanger: true,
    valueGetter: () => true
  });
}

function bindModalEvents() {
  els.modalCancelBtn.addEventListener('click', () => closeModal(null));
  els.modalConfirmBtn.addEventListener('click', () => {
    if (typeof state.modalValueGetter === 'function') {
      closeModal(state.modalValueGetter());
      return;
    }
    closeModal(true);
  });
  els.modalMask.addEventListener('click', (event) => {
    if (event.target === els.modalMask) {
      closeModal(null);
    }
  });
}

async function notifyMenusRebuild() {
  try {
    await chrome.runtime.sendMessage({ type: 'rebuild-context-menus' });
  } catch {
    // Ignore background wake-up errors.
  }
}

async function reloadData(options = {}) {
  try {
    await chrome.runtime.sendMessage({ type: 'ensure-default-seed' });
  } catch {
    // Continue with direct query.
  }
  const rows = await fetchPoolRows();
  state.customPools = getCustomPoolsFromRows(rows);
  state.pools = buildPools(rows, state.customPools);
  state.poolRows = new Map(
    rows
      .filter((r) => normalizePool(r.pool_key) !== META_POOL_KEY)
      .map((r) => [normalizePool(r.pool_key), r])
  );

  if (!state.pools.some((p) => p.key === state.activePool)) {
    state.activePool = state.pools.some((p) => p.key === 'ai_builders') ? 'ai_builders' : (state.pools[0]?.key || 'ai_builders');
  }

  pruneSelectedKeys();
  await rememberActivePool();
  renderPoolSidebar();
  renderAccountList();

  if (!options.skipEnrich) {
    try {
      const { updatedTotal, updatedPools } = await enrichXNamesForAllPools();
      if (updatedTotal > 0) {
        await reloadData({ skipEnrich: true });
        setStatus(`Updated ${updatedTotal} X display names across ${updatedPools} pools.`);
      }
    } catch {
      // Keep UI usable even when enrichment fails.
    }
  }
}

async function runWithBusy(loadingText, action, successText = '') {
  setBusy(true, loadingText);
  try {
    const result = await action();
    if (successText) setStatus(successText);
    return result;
  } catch (err) {
    setStatus(`失败：${err.message}`);
    return null;
  } finally {
    setBusy(false);
  }
}

async function createCollection(nameInput) {
  const name = String(nameInput || '').trim();
  if (!name) throw new Error('请先输入集合名称。');
  const key = slugifyPoolName(name);
  if (state.pools.some((p) => normalizePool(p.key) === key)) {
    throw new Error('集合已存在。');
  }
  state.customPools.push({ key, label: name });
  await upsertMetaRow();
  await upsertPoolRow(key, name, []);
  await notifyMenusRebuild();
  state.activePool = key;
  await reloadData();
}

async function renameCollection(poolKey, nextNameInput) {
  const key = normalizePool(poolKey);
  if (BASE_POOL_KEY_SET.has(key)) throw new Error('基础集合不支持改名。');
  const nextName = String(nextNameInput || '').trim();
  if (!nextName) throw new Error('新集合名称不能为空。');

  const hit = state.customPools.find((p) => normalizePool(p.key) === key);
  if (!hit) throw new Error('该集合不是自定义集合。');
  hit.label = nextName;
  const row = getPoolRow(key);
  await upsertMetaRow();
  await upsertPoolRow(key, nextName, row.candidates || []);
  await notifyMenusRebuild();
  await reloadData();
}

async function deleteCollection(poolKey) {
  const key = normalizePool(poolKey);
  if (BASE_POOL_KEY_SET.has(key)) throw new Error('基础集合不可删除。');
  state.customPools = state.customPools.filter((p) => normalizePool(p.key) !== key);
  await upsertMetaRow();
  await deletePoolRow(key);
  await notifyMenusRebuild();
  if (state.activePool === key) state.activePool = 'ai_builders';
  await reloadData();
}

async function addAccountToCollection(poolKey, url, name) {
  const pool = normalizePool(poolKey);
  try {
    const candidate = buildCandidateFromUrl(url, name);
    if (!candidate) throw new Error('Unsupported link. Only X account/status and YouTube channel/playlist are supported.');

    const row = getPoolRow(pool);
    const before = Array.isArray(row.candidates) ? row.candidates.length : 0;
    const next = dedupeCandidates([...(row.candidates || []), candidate]);
    const added = Math.max(0, next.length - before);
    const duplicates = 1 - added;

    await upsertPoolRow(pool, poolLabel(pool), next);
    await publishLocalWriteResult({
      ok: true,
      source: 'options_add_account',
      pool,
      poolLabel: poolLabel(pool),
      attempted: 1,
      added,
      duplicates,
      total: next.length
    });
    await reloadData();
  } catch (error) {
    await publishLocalWriteResult({
      ok: false,
      source: 'options_add_account',
      pool,
      poolLabel: poolLabel(pool),
      attempted: 1,
      error: error?.message || String(error || 'Unknown error')
    });
    throw error;
  }
}

async function exportCollection(poolKey) {
  const key = normalizePool(poolKey);
  const row = getPoolRow(key);
  const payload = {
    owner_id: SUPABASE_OWNER_ID,
    pool_key: key,
    pool_label: poolLabel(key),
    exported_at: new Date().toISOString(),
    candidates: row.candidates || []
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  await chrome.downloads.download({
    url,
    filename: `follow-builders-candidates-${key}-${ts}.json`,
    saveAs: true
  });
}

async function addClipboardAccountsToActive() {
  const pool = normalizePool(state.activePool);
  try {
    const text = await navigator.clipboard.readText();
    const urls = extractUrls(text);
    if (urls.length === 0) throw new Error('Clipboard has no supported links.');

    const row = getPoolRow(pool);
    const toAdd = urls.map((url) => buildCandidateFromUrl(url)).filter(Boolean);
    if (toAdd.length === 0) throw new Error('No capturable X/YouTube links found in clipboard.');

    const before = (row.candidates || []).length;
    const next = dedupeCandidates([...(row.candidates || []), ...toAdd]);
    const added = next.length - before;
    const duplicates = toAdd.length - added;

    await upsertPoolRow(pool, poolLabel(pool), next);
    await publishLocalWriteResult({
      ok: true,
      source: 'options_clipboard_import',
      pool,
      poolLabel: poolLabel(pool),
      attempted: toAdd.length,
      added,
      duplicates,
      total: next.length
    });
    await reloadData();
    setStatus(`Added ${added}, deduped ${duplicates}.`);
  } catch (error) {
    await publishLocalWriteResult({
      ok: false,
      source: 'options_clipboard_import',
      pool,
      poolLabel: poolLabel(pool),
      error: error?.message || String(error || 'Unknown error')
    });
    throw error;
  }
}

async function removeAccountByKey(key) {
  state.selectedKeys.delete(key);
  const row = getPoolRow(state.activePool);
  const next = (row.candidates || []).filter((c) => candidateKey(c) !== key);
  await upsertPoolRow(state.activePool, poolLabel(state.activePool), next);
  await reloadData();
}

async function moveAccountByKey(key, targetPool) {
  state.selectedKeys.delete(key);
  const fromPool = normalizePool(state.activePool);
  const toPool = normalizePool(targetPool);
  if (fromPool === toPool) return;

  const fromRow = getPoolRow(fromPool);
  const toRow = getPoolRow(toPool);
  const fromList = [...(fromRow.candidates || [])];
  const idx = fromList.findIndex((c) => candidateKey(c) === key);
  if (idx < 0) return;
  const [item] = fromList.splice(idx, 1);
  const toList = dedupeCandidates([...(toRow.candidates || []), item]);

  await upsertRows([
    {
      owner_id: SUPABASE_OWNER_ID,
      pool_key: fromPool,
      pool_label: poolLabel(fromPool),
      candidates: fromList,
      custom_pools: state.customPools,
      updated_at: new Date().toISOString()
    },
    {
      owner_id: SUPABASE_OWNER_ID,
      pool_key: toPool,
      pool_label: poolLabel(toPool),
      candidates: toList,
      custom_pools: state.customPools,
      updated_at: new Date().toISOString()
    }
  ]);
  await reloadData();
}

async function moveSelectedAccounts(targetPool) {
  const fromPool = normalizePool(state.activePool);
  const toPool = normalizePool(targetPool);
  if (!toPool || fromPool === toPool) return;

  const selected = new Set(state.selectedKeys);
  if (selected.size === 0) return;

  const fromRow = getPoolRow(fromPool);
  const toRow = getPoolRow(toPool);
  const fromList = [...(fromRow.candidates || [])];
  const moving = fromList.filter((c) => selected.has(candidateKey(c)));
  if (moving.length === 0) return;
  const nextFrom = fromList.filter((c) => !selected.has(candidateKey(c)));
  const nextTo = dedupeCandidates([...(toRow.candidates || []), ...moving]);

  await upsertRows([
    {
      owner_id: SUPABASE_OWNER_ID,
      pool_key: fromPool,
      pool_label: poolLabel(fromPool),
      candidates: nextFrom,
      custom_pools: state.customPools,
      updated_at: new Date().toISOString()
    },
    {
      owner_id: SUPABASE_OWNER_ID,
      pool_key: toPool,
      pool_label: poolLabel(toPool),
      candidates: nextTo,
      custom_pools: state.customPools,
      updated_at: new Date().toISOString()
    }
  ]);

  state.selectedKeys.clear();
  await reloadData();
}

function bindEvents() {
  bindModalEvents();

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;

    const nextWriteResult = changes?.[LAST_WRITE_RESULT_KEY]?.newValue;
    if (nextWriteResult) {
      renderWriteResult(nextWriteResult);
      setStatus(buildStatusFromWriteResult(nextWriteResult));
    }

    const nextValue = changes?.[POOL_CHANGE_KEY]?.newValue;
    if (!nextValue) return;
    scheduleSilentReload(nextValue);
  });

  els.searchInput.addEventListener('input', () => {
    state.search = String(els.searchInput.value || '');
    renderAccountList();
  });

  els.selectAllToggle?.addEventListener('change', () => {
    const visibleKeys = getVisibleCandidateKeys();
    if (els.selectAllToggle.checked) {
      visibleKeys.forEach((k) => state.selectedKeys.add(k));
    } else {
      visibleKeys.forEach((k) => state.selectedKeys.delete(k));
    }
    renderAccountList();
  });

  els.clearSelectionBtn?.addEventListener('click', () => {
    state.selectedKeys.clear();
    renderAccountList();
  });

  els.bulkMoveBtn?.addEventListener('click', async () => {
    const targetPool = String(els.bulkMoveTarget?.value || '');
    if (!targetPool) return;
    await runWithBusy('批量移动中...', () => moveSelectedAccounts(targetPool), '批量移动完成。');
  });

  els.addPoolInlineBtn.addEventListener('click', async () => {
    const name = await showCreateCollectionModal();
    if (!name) return;
    await runWithBusy('创建集合中...', () => createCollection(name), '集合创建成功。');
  });

  els.poolList.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const actionBtn = target.closest('button[data-pool-action]');
    if (actionBtn instanceof HTMLButtonElement) {
      const action = String(actionBtn.getAttribute('data-pool-action') || '');
      const poolKey = normalizePool(actionBtn.getAttribute('data-pool-key'));

      if (action === 'add-account') {
        const values = await showAddAccountModal(poolLabel(poolKey));
        if (!values || !values.url) return;
        await runWithBusy('新增账号中...', () => addAccountToCollection(poolKey, values.url, values.name || ''), '账号新增成功。');
        return;
      }
      if (action === 'export') {
        await runWithBusy('导出中...', () => exportCollection(poolKey), '集合导出完成。');
        return;
      }
      if (action === 'rename') {
        const nextName = await showRenameCollectionModal(poolLabel(poolKey));
        if (!nextName) return;
        await runWithBusy('集合改名中...', () => renameCollection(poolKey, nextName), '集合改名完成。');
        return;
      }
      if (action === 'delete') {
        const ok = await showDeleteCollectionModal(poolLabel(poolKey));
        if (!ok) return;
        await runWithBusy('删除集合中...', () => deleteCollection(poolKey), '集合删除完成。');
      }
      return;
    }

    const row = target.closest('.pool-item');
    if (!row) return;
    state.activePool = normalizePool(row.getAttribute('data-pool'));
    state.selectedKeys.clear();
    await rememberActivePool();
    renderPoolSidebar();
    renderAccountList();
  });

  els.refreshBtn.addEventListener('click', async () => {
    await runWithBusy('刷新数据库中...', reloadData, '数据库已刷新。');
  });

  els.importClipboardBtn.addEventListener('click', async () => {
    await runWithBusy('读取剪贴板并入池中...', addClipboardAccountsToActive);
  });

  els.accountList.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const delKey = target.getAttribute('data-del-btn');
    if (delKey) {
      await runWithBusy('删除账号中...', () => removeAccountByKey(delKey), '账号已删除。');
      return;
    }

    const moveKey = target.getAttribute('data-move-btn');
    if (moveKey) {
      const select = els.accountList.querySelector(`select[data-move-select="${CSS.escape(moveKey)}"]`);
      if (!(select instanceof HTMLSelectElement)) return;
      await runWithBusy('移动账号中...', () => moveAccountByKey(moveKey, select.value), '账号已移动。');
    }
  });

  els.accountList.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const key = target.getAttribute('data-select-key');
    if (!key) return;
    if (target.checked) state.selectedKeys.add(key);
    else state.selectedKeys.delete(key);
    renderBulkControls();
  });
}

(async () => {
  bindEvents();
  await loadLastWriteResult();
  state.activePool = await loadRememberedPool();
  await runWithBusy('连接数据库中...', reloadData, '管理中心已就绪。');
})();
