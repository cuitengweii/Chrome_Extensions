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

const ROOT_MENU_ID = 'fb-root';
const MENU_PREFIX = 'fb-pool:';
const LAST_POOL_KEY = 'follow_builders_last_pool';
const POOL_CHANGE_KEY = 'follow_builders_pool_change_v1';
const LAST_WRITE_RESULT_KEY = 'follow_builders_last_write_result_v1';
const ENABLE_PAGE_TOAST = false;
const poolWriteQueue = new Map();
const recentAutoCaptured = new Map();
const recentContextTargetByTab = new Map();
const DEFAULT_AI_BUILDERS_SEED = [
  { name: 'Andrej Karpathy', handle: 'karpathy' },
  { name: 'Swyx', handle: 'swyx' },
  { name: 'Josh Woodward', handle: 'joshwoodward' },
  { name: 'Kevin Weil', handle: 'kevinweil' },
  { name: 'Peter Yang', handle: 'petergyang' },
  { name: 'Nan Yu', handle: 'thenanyu' },
  { name: 'Madhu Guru', handle: 'realmadhuguru' },
  { name: 'Amanda Askell', handle: 'AmandaAskell' },
  { name: 'Cat Wu', handle: '_catwu' },
  { name: 'Thariq', handle: 'trq212' },
  { name: 'Google Labs', handle: 'GoogleLabs' },
  { name: 'Amjad Masad', handle: 'amasad' },
  { name: 'Guillermo Rauch', handle: 'rauchg' },
  { name: 'Alex Albert', handle: 'alexalbert__' },
  { name: 'Aaron Levie', handle: 'levie' },
  { name: 'Ryo Lu', handle: 'ryolu_' },
  { name: 'Garry Tan', handle: 'garrytan' },
  { name: 'Matt Turck', handle: 'mattturck' },
  { name: 'Zara Zhang', handle: 'zarazhangrui' },
  { name: 'Nikunj Kothari', handle: 'nikunj' },
  { name: 'Peter Steinberger', handle: 'steipete' },
  { name: 'Dan Shipper', handle: 'danshipper' },
  { name: 'Aditya Agarwal', handle: 'adityaag' },
  { name: 'Greg Isenberg', handle: 'gregisenberg' },
  { name: 'Lenny Rachitsky', handle: 'lennysan' },
  { name: 'Mckay Wrigley', handle: 'mckaywrigley' },
  { name: 'Steven Johnson', handle: 'stevenbjohnson' },
  { name: 'George Mack', handle: 'george__mack' },
  { name: 'Raiza Martin', handle: 'raizamrtn' },
  { name: 'Riley Brown', handle: 'rileybrown' },
  { name: 'Hamel Husain', handle: 'HamelHusain' },
  { name: 'Lulu Cheng Meservey', handle: 'lulumeservey' },
  { name: 'Justine Moore', handle: 'venturetwins' },
  { name: 'Julie Zhuo', handle: 'joulee' },
  { name: 'Gabriel Peters', handle: 'GabrielPeterss4' },
  { name: 'PJ Ace', handle: 'PJaccetturo' },
  { name: 'Sam Altman', handle: 'sama' },
  { name: 'Claude', handle: 'claudeai' }
];
const DEFAULT_AI_BUILDERS_PODCAST_SEED = [
  { name: 'Latent Space', url: 'https://www.youtube.com/@LatentSpacePod' },
  { name: 'Training Data', url: 'https://www.youtube.com/playlist?list=PLOhHNjZItNnMm5tdW61JpnyxeYH5NDDx8' },
  { name: 'No Priors', url: 'https://www.youtube.com/@NoPriorsPodcast' },
  { name: 'Unsupervised Learning', url: 'https://www.youtube.com/@RedpointAI' },
  { name: 'Data Driven NYC', url: 'https://www.youtube.com/@DataDrivenNYC/videos' }
];

function normalizePool(pool) {
  const v = String(pool || '').trim().toLowerCase();
  return v || 'ai_builders';
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

function isWeakName(name, handle) {
  const n = String(name || '').trim();
  const h = String(handle || '').trim();
  if (!n) return true;
  if (!h) return false;
  const nLower = n.toLowerCase();
  const hLower = h.toLowerCase();
  return nLower === hLower || nLower === `@${hLower}`;
}

function mergeCandidatesPreferName(existingList, incomingList) {
  const out = Array.isArray(existingList) ? [...existingList] : [];
  const idxByKey = new Map(out.map((c, i) => [candidateKey(c), i]));
  let added = 0;
  let upgraded = 0;
  let duplicate = 0;

  for (const incoming of incomingList || []) {
    const key = candidateKey(incoming);
    if (!key) continue;
    const idx = idxByKey.get(key);
    if (idx == null) {
      out.push(incoming);
      idxByKey.set(key, out.length - 1);
      added += 1;
      continue;
    }

    duplicate += 1;
    const prev = out[idx];
    const prevHandle = String(prev?.handle_or_id || '').trim();
    const nextName = String(incoming?.name || '').trim();
    if (!nextName) continue;
    if (isWeakName(prev?.name, prevHandle) && !isWeakName(nextName, prevHandle)) {
      out[idx] = { ...prev, name: nextName };
      upgraded += 1;
    }
  }

  return { merged: out, added, duplicate, upgraded };
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

async function hydrateXCandidateNames(candidates) {
  const list = Array.isArray(candidates) ? candidates : [];
  const handles = list
    .filter((candidate) => String(candidate?.source_type || '') === 'x_account')
    .map((candidate) => String(candidate?.handle_or_id || '').trim().toLowerCase())
    .filter(Boolean);

  if (handles.length === 0) return list;

  const nameMap = await fetchXDisplayNames(handles);
  if (nameMap.size < handles.length) {
    const unresolved = [...new Set(handles.filter((handle) => !nameMap.has(handle)))];
    for (const handle of unresolved.slice(0, 20)) {
      const displayName = await fetchXDisplayNameFromProfilePage(handle);
      if (displayName) nameMap.set(handle, displayName);
    }
  }

  return list.map((candidate) => {
    if (String(candidate?.source_type || '') !== 'x_account') return candidate;
    const handle = String(candidate?.handle_or_id || '').trim().toLowerCase();
    const displayName = nameMap.get(handle);
    if (displayName) {
      return { ...candidate, name: displayName };
    }
    return {
      ...candidate,
      name: String(candidate?.handle_or_id || candidate?.name || '').trim()
    };
  });
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
  const map = new Map(BASE_POOLS.map((p) => [p.key, { key: p.key, label: p.label }]));
  customPools.forEach((p) => map.set(normalizePool(p.key), { key: normalizePool(p.key), label: p.label }));
  rows.forEach((r) => {
    const key = normalizePool(r.pool_key);
    if (key === META_POOL_KEY) return;
    if (!map.has(key)) {
      map.set(key, { key, label: String(r.pool_label || key) });
    }
  });
  return [...map.values()];
}

function getPoolRow(rows, poolKey) {
  const key = normalizePool(poolKey);
  return rows.find((r) => normalizePool(r.pool_key) === key) || null;
}

async function getPoolLabelForKey(poolKey) {
  const key = normalizePool(poolKey);
  const basePool = BASE_POOLS.find((pool) => normalizePool(pool.key) === key);
  if (basePool) return basePool.label;
  try {
    const rows = await fetchPoolRows();
    const pools = buildPools(rows, getCustomPoolsFromRows(rows));
    return pools.find((pool) => normalizePool(pool.key) === key)?.label || key;
  } catch {
    return key;
  }
}

async function upsertRows(rows) {
  if (!rows || rows.length === 0) return;
  await supabaseRequest(`${SUPABASE_TABLE}?on_conflict=owner_id,pool_key`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: rows
  });
}

async function notifyPoolDataChanged(poolKey, meta = {}) {
  try {
    await chrome.storage.local.set({
      [POOL_CHANGE_KEY]: {
        pool: normalizePool(poolKey),
        ts: Date.now(),
        ...meta
      }
    });
  } catch {
    // Ignore notification failures; data is already written.
  }
}

function buildWriteResultPayload(payload = {}) {
  return {
    ok: Boolean(payload.ok),
    source: String(payload.source || 'unknown'),
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

async function publishLastWriteResult(payload) {
  try {
    await chrome.storage.local.set({
      [LAST_WRITE_RESULT_KEY]: buildWriteResultPayload(payload)
    });
  } catch {
    // Ignore status broadcast errors.
  }
}

function buildSeedCandidate(name, handle) {
  const url = `https://x.com/${String(handle || '').trim()}`;
  return {
    id: crypto.randomUUID(),
    source_type: 'x_account',
    name: String(name || handle || '').trim(),
    handle_or_id: String(handle || '').trim(),
    url,
    discovered_at: new Date().toISOString(),
    discovered_from: 'default-sources',
    confidence: 1,
    status: 'approved',
    reason: 'default seed'
  };
}

function buildAiBuildersDefaultCandidates() {
  const xCandidates = DEFAULT_AI_BUILDERS_SEED.map((x) => buildSeedCandidate(x.name, x.handle));
  const podcastCandidates = DEFAULT_AI_BUILDERS_PODCAST_SEED
    .map((x) => buildCandidateFromUrl(x.url, x.name))
    .filter(Boolean)
    .map((c) => ({
      ...c,
      discovered_from: 'default-sources',
      confidence: 1,
      status: 'approved',
      reason: 'default seed'
    }));
  return dedupeCandidates([...xCandidates, ...podcastCandidates]);
}

async function ensureDefaultSeedRows() {
  const rows = await fetchPoolRows();
  const customPools = getCustomPoolsFromRows(rows);
  const now = new Date().toISOString();
  const aiBuildersDefaultCandidates = buildAiBuildersDefaultCandidates();
  const existing = new Map(
    rows
      .filter((r) => normalizePool(r.pool_key) !== META_POOL_KEY)
      .map((r) => [normalizePool(r.pool_key), r])
  );
  const rowsToUpsert = [];

  for (const base of BASE_POOLS) {
    if (existing.has(base.key)) continue;
    rowsToUpsert.push({
      owner_id: SUPABASE_OWNER_ID,
      pool_key: base.key,
      pool_label: base.label,
      candidates:
        base.key === 'ai_builders'
          ? aiBuildersDefaultCandidates
          : [],
      custom_pools: customPools,
      updated_at: now
    });
  }

  const allCount = [...existing.values()].reduce((sum, row) => {
    const list = Array.isArray(row.candidates) ? row.candidates : [];
    return sum + list.length;
  }, 0);
  const aiBuildersRow = existing.get('ai_builders');
  const aiBuildersCount = Array.isArray(aiBuildersRow?.candidates) ? aiBuildersRow.candidates.length : 0;
  const aiBuildersList = Array.isArray(aiBuildersRow?.candidates) ? aiBuildersRow.candidates : [];
  const hasYoutubeSeed = aiBuildersList.some((c) => String(c?.source_type || '').startsWith('youtube_'));
  const looksLikeLegacyXOnlySeed =
    aiBuildersList.length > 0 &&
    aiBuildersList.length <= DEFAULT_AI_BUILDERS_SEED.length + 2 &&
    !hasYoutubeSeed;
  if (aiBuildersRow && aiBuildersCount === 0 && allCount === 0) {
    rowsToUpsert.push({
      owner_id: SUPABASE_OWNER_ID,
      pool_key: 'ai_builders',
      pool_label: aiBuildersRow.pool_label || 'AI 构建者',
      candidates: aiBuildersDefaultCandidates,
      custom_pools: customPools,
      updated_at: now
    });
  }

  if (aiBuildersRow && looksLikeLegacyXOnlySeed) {
    const { merged, added, upgraded } = mergeCandidatesPreferName(aiBuildersList, aiBuildersDefaultCandidates);
    if (added > 0 || upgraded > 0) {
      rowsToUpsert.push({
        owner_id: SUPABASE_OWNER_ID,
        pool_key: 'ai_builders',
        pool_label: aiBuildersRow.pool_label || 'AI Builders',
        candidates: merged,
        custom_pools: customPools,
        updated_at: now
      });
    }
  }

  const hasMeta = rows.some((r) => normalizePool(r.pool_key) === META_POOL_KEY);
  if (!hasMeta) {
    rowsToUpsert.push({
      owner_id: SUPABASE_OWNER_ID,
      pool_key: META_POOL_KEY,
      pool_label: '__meta__',
      candidates: [],
      custom_pools: customPools,
      updated_at: now
    });
  }

  if (rowsToUpsert.length === 0) return { seeded: false, rows: 0 };
  await upsertRows(rowsToUpsert);
  return { seeded: true, rows: rowsToUpsert.length };
}

async function addUrlsToPool(poolKey, urls, nameByUrl = null, meta = {}) {
  const pool = normalizePool(poolKey);
  const cleanedUrls = [...new Set((urls || []).map(normalizeUrl).filter(Boolean))];
  const source = String(meta?.source || 'unknown');
  let label = pool;

  try {
    const rows = await fetchPoolRows();
    const customPools = getCustomPoolsFromRows(rows);
    const pools = buildPools(rows, customPools);
    label = pools.find((p) => p.key === pool)?.label || pool;

    const existing = getPoolRow(rows, pool);
    const beforeList = Array.isArray(existing?.candidates) ? existing.candidates : [];
    const initialCandidates = cleanedUrls
      .map((u) => {
        const explicitName = nameByUrl instanceof Map ? String(nameByUrl.get(u) || '') : '';
        return buildCandidateFromUrl(u, explicitName);
      })
      .filter(Boolean);
    const toAdd = await hydrateXCandidateNames(initialCandidates);
    const { merged, added, duplicate, upgraded } = mergeCandidatesPreferName(beforeList, toAdd);

    await upsertRows([
      {
        owner_id: SUPABASE_OWNER_ID,
        pool_key: pool,
        pool_label: label,
        candidates: merged,
        custom_pools: customPools,
        updated_at: new Date().toISOString()
      }
    ]);
    await notifyPoolDataChanged(pool, {
      added,
      duplicates: duplicate,
      upgraded
    });

    const result = {
      pool,
      poolLabel: label,
      added,
      duplicates: duplicate,
      upgraded,
      total: merged.length
    };
    await publishLastWriteResult({
      ok: true,
      source,
      attempted: cleanedUrls.length,
      ...result
    });
    return result;
  } catch (error) {
    await publishLastWriteResult({
      ok: false,
      source,
      pool,
      poolLabel: label,
      attempted: cleanedUrls.length,
      error: error?.message || String(error || 'Unknown error')
    });
    throw error;
  }
}

function enqueuePoolWrite(poolKey, task) {
  const key = normalizePool(poolKey);
  const prev = poolWriteQueue.get(key) || Promise.resolve();
  const next = prev.catch(() => null).then(task);
  poolWriteQueue.set(key, next.finally(() => {
    if (poolWriteQueue.get(key) === next) {
      poolWriteQueue.delete(key);
    }
  }));
  return next;
}

async function getActivePoolFromStorage() {
  const data = await chrome.storage.local.get(LAST_POOL_KEY);
  return normalizePool(data?.[LAST_POOL_KEY] || 'ai_builders');
}

function rememberAutoCapturedUrls(urls) {
  const now = Date.now();
  (urls || []).forEach((u) => {
    const normalized = normalizeUrl(u);
    if (normalized) recentAutoCaptured.set(normalized, now);
  });
  for (const [url, ts] of recentAutoCaptured.entries()) {
    if (now - ts > 20000) recentAutoCaptured.delete(url);
  }
}

function filterUncapturedUrls(urls) {
  const now = Date.now();
  const pendingUrls = [];
  let skipped = 0;
  for (const raw of urls || []) {
    const normalized = normalizeUrl(raw);
    if (!normalized) continue;
    const ts = recentAutoCaptured.get(normalized) || 0;
    if (now - ts <= 12000) {
      skipped += 1;
      continue;
    }
    pendingUrls.push(normalized);
  }
  for (const [url, ts] of recentAutoCaptured.entries()) {
    if (now - ts > 20000) recentAutoCaptured.delete(url);
  }
  return { pendingUrls, skipped };
}

function rememberContextTarget(tabId, payload) {
  const id = Number(tabId);
  const statusUrl = normalizeUrl(payload?.url || '');
  if (!Number.isInteger(id) || id < 0 || !statusUrl) return;
  recentContextTargetByTab.set(id, {
    url: statusUrl,
    name: String(payload?.name || '').trim(),
    ts: Date.now()
  });
  const now = Date.now();
  for (const [key, value] of recentContextTargetByTab.entries()) {
    if (!value || now - Number(value.ts || 0) > 30000) {
      recentContextTargetByTab.delete(key);
    }
  }
}

function getRecentContextTarget(tabId) {
  const id = Number(tabId);
  if (!Number.isInteger(id) || id < 0) return null;
  const current = recentContextTargetByTab.get(id);
  if (!current) return null;
  if (Date.now() - Number(current.ts || 0) > 30000) {
    recentContextTargetByTab.delete(id);
    return null;
  }
  return current;
}

function createContextMenu(props) {
  return new Promise((resolve) => {
    chrome.contextMenus.create(props, () => {
      resolve();
    });
  });
}

function removeAllContextMenus() {
  return new Promise((resolve) => {
    chrome.contextMenus.removeAll(() => resolve());
  });
}

async function rebuildContextMenus() {
  let pools = BASE_POOLS;
  try {
    await ensureDefaultSeedRows();
    const rows = await fetchPoolRows();
    pools = buildPools(rows, getCustomPoolsFromRows(rows));
  } catch (err) {
    console.warn('Failed to load pools from Supabase, fallback to base pools:', err.message);
  }

  await removeAllContextMenus();
  await createContextMenu({
    id: ROOT_MENU_ID,
    title: 'X to Ai日报',
    contexts: ['link', 'selection', 'page']
  });
  for (const pool of pools) {
    await createContextMenu({
      id: `${MENU_PREFIX}${pool.key}`,
      parentId: ROOT_MENU_ID,
      title: pool.label,
      contexts: ['link', 'selection', 'page']
    });
  }
}

async function listPoolsWithCounts() {
  await ensureDefaultSeedRows();
  const rows = await fetchPoolRows();
  const pools = buildPools(rows, getCustomPoolsFromRows(rows));
  const counts = {};
  pools.forEach((p) => {
    const row = getPoolRow(rows, p.key);
    counts[p.key] = Array.isArray(row?.candidates) ? row.candidates.length : 0;
  });
  return { pools, counts };
}

function extractCaptureUrls(info, tab) {
  if (info.linkUrl) return [info.linkUrl];

  const selectionUrls = extractUrls(info.selectionText || '');
  if (selectionUrls.length > 0) return selectionUrls;

  if (info.pageUrl) return [info.pageUrl];
  if (tab?.url) return [tab.url];
  return [];
}

chrome.runtime.onInstalled.addListener(() => {
  rebuildContextMenus().catch((err) => {
    console.error('Failed to build context menus on install:', err);
  });
});

chrome.runtime.onStartup.addListener(() => {
  rebuildContextMenus().catch((err) => {
    console.error('Failed to build context menus on startup:', err);
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const menuId = String(info.menuItemId || '');
  if (!menuId.startsWith(MENU_PREFIX)) return;
  const pool = menuId.slice(MENU_PREFIX.length);
  const recentTarget = getRecentContextTarget(tab?.id);
  const urls = recentTarget?.url ? [recentTarget.url] : extractCaptureUrls(info, tab);
  if (urls.length === 0) return;

  const nameByUrl = recentTarget?.url
    ? new Map([[normalizeUrl(recentTarget.url), String(recentTarget.name || '')]])
    : null;

  (async () => {
    const result = await enqueuePoolWrite(pool, () => addUrlsToPool(pool, urls, nameByUrl, { source: 'context_menu' }));
    if (ENABLE_PAGE_TOAST && tab?.id != null) {
      const poolLabel = await getPoolLabelForKey(pool);
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'show-capture-toast',
          level: 'success',
          text: `Added ${result.added || 0} to ${poolLabel}${result.duplicates ? `, deduped ${result.duplicates}` : ''}.`
        });
      } catch {
        // Ignore if the content script is not available on the current page.
      }
    }
  })().catch((err) => {
    console.error('Context menu add failed:', err);
    if (ENABLE_PAGE_TOAST && tab?.id != null) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'show-capture-toast',
        level: 'error',
        text: `Add failed: ${err.message}`
      }).catch(() => {});
    }
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const type = message?.type;

  if (type === 'list-pools') {
    listPoolsWithCounts()
      .then((data) => sendResponse({ ok: true, ...data }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (type === 'ensure-default-seed') {
    ensureDefaultSeedRows()
      .then((data) => sendResponse({ ok: true, ...data }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (type === 'add-urls-to-pool') {
    const pool = normalizePool(message.pool);
    const urls = Array.isArray(message.urls) ? message.urls : [];
    const source = String(message.source || 'popup');
    enqueuePoolWrite(pool, () => addUrlsToPool(pool, urls, null, { source }))
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (type === 'capture-copied-link') {
    const rawUrl = String(message.url || '').trim();
    const explicitName = String(message.name || '').trim();
    const source = String(message.source || 'x_copy_capture');
    if (!rawUrl) {
      publishLastWriteResult({
        ok: false,
        source,
        pool: normalizePool(message.pool),
        error: 'missing url'
      }).catch(() => {});
      sendResponse({ ok: false, error: 'missing url' });
      return false;
    }
    rememberAutoCapturedUrls([rawUrl]);
    (async () => {
      const pool = normalizePool(message.pool || (await getActivePoolFromStorage()));
      const nameByUrl = new Map();
      if (explicitName) {
        nameByUrl.set(normalizeUrl(rawUrl), explicitName);
      }
      return enqueuePoolWrite(pool, () => addUrlsToPool(pool, [rawUrl], nameByUrl, { source }));
    })()
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (type === 'set-context-target') {
    rememberContextTarget(_sender?.tab?.id, {
      url: String(message.url || '').trim(),
      name: String(message.name || '').trim()
    });
    sendResponse({ ok: true });
    return false;
  }

  if (type === 'filter-uncaptured-urls') {
    const urls = Array.isArray(message.urls) ? message.urls : [];
    const filtered = filterUncapturedUrls(urls);
    sendResponse({ ok: true, ...filtered });
    return false;
  }

  if (type === 'rebuild-context-menus') {
    rebuildContextMenus()
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  return false;
});
