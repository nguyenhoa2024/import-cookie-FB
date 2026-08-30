const $ = (s) => document.querySelector(s);

let activeTab = null;
let allCookies = [];
let selectedStoreId = null;
let visibleValues = new Set();

const toast = (message, type = 'info') => {
  const t = $('#toast');
  t.textContent = message;
  t.className = `toast show ${type}`;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2600);
};

function setStatus(text, state = 'ready') {
  const el = $('#status');
  el.textContent = text;
  el.className = `badge ${state}`;
}

function maskValue(value) {
  if (!value) return '';
  if (value.length <= 12) return '••••••••';
  return `${value.slice(0, 5)}••••${value.slice(-5)}`;
}

function parseHeader(input) {
  const parts = input.split(';');
  return parts.map((part) => {
    const i = part.indexOf('=');
    if (i <= 0) return null;
    const name = part.slice(0, i).trim();
    const value = part.slice(i + 1).trim();
    return name ? { name, value } : null;
  }).filter(Boolean);
}

function parseJson(input) {
  const parsed = JSON.parse(input);
  if (!Array.isArray(parsed)) throw new Error('JSON must be an array of cookies');
  return parsed.map((c, index) => {
    if (!c || typeof c !== 'object' || !c.name || typeof c.value !== 'string') {
      throw new Error(`Invalid cookie at JSON index ${index}`);
    }
    return {
      name: String(c.name),
      value: c.value,
      domain: c.domain,
      path: c.path || '/',
      secure: c.secure,
      httpOnly: c.httpOnly,
      sameSite: c.sameSite,
      expirationDate: Number.isFinite(c.expirationDate) ? c.expirationDate : undefined
    };
  });
}

function detectFormat(input) {
  const trimmed = input.trim();
  if (!trimmed) return 'empty';
  return trimmed.startsWith('[') || trimmed.startsWith('{') ? 'json' : 'header';
}

function isFacebook(hostname) {
  const h = hostname.toLowerCase();
  return h === 'facebook.com' || h.endsWith('.facebook.com');
}

function getTargetCookieDomain(hostname) {
  return isFacebook(hostname) ? '.facebook.com' : hostname.toLowerCase();
}

async function getTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0] || null;
}

async function resolveStore(tab) {
  const stores = await chrome.cookies.getAllCookieStores();
  const store = stores.find((s) => s.tabIds.includes(tab.id));
  return store?.id || stores.find((s) => !s.incognito)?.id || stores[0]?.id || null;
}

function cookieUrl(cookie) {
  const domain = String(cookie.domain || '').replace(/^\./, '');
  const scheme = cookie.secure ? 'https' : 'http';
  return `${scheme}://${domain}${cookie.path || '/'}`;
}

function render() {
  const q = $('#search').value.trim().toLowerCase();
  const rows = $('#rows');
  rows.textContent = '';

  const filtered = allCookies.filter((c) => `${c.name} ${c.domain} ${c.path}`.toLowerCase().includes(q));
  $('#count').textContent = `${filtered.length} cookie${filtered.length === 1 ? '' : 's'}`;
  $('#empty').hidden = filtered.length !== 0;

  for (const cookie of filtered) {
    const tr = document.createElement('tr');
    const cell = (text, cls = '') => {
      const td = document.createElement('td');
      td.className = cls;
      td.textContent = String(text ?? '');
      tr.appendChild(td);
      return td;
    };

    cell(cookie.name, 'name');
    cell(cookie.domain, 'domain');

    const valueCell = cell('', 'value-cell');
    const code = document.createElement('code');
    const key = `${cookie.name}|${cookie.domain}|${cookie.path}`;
    code.textContent = visibleValues.has(key) ? cookie.value : maskValue(cookie.value);
    code.title = 'Click to reveal/hide';
    code.onclick = () => {
      if (visibleValues.has(key)) visibleValues.delete(key); else visibleValues.add(key);
      render();
    };
    valueCell.appendChild(code);

    const actions = cell('', 'actions');
    const copy = document.createElement('button');
    copy.textContent = 'Copy';
    copy.onclick = async () => {
      await navigator.clipboard.writeText(cookie.value);
      toast('Cookie value copied', 'success');
    };
    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.className = 'danger';
    del.onclick = () => deleteCookie(cookie);
    actions.append(copy, del);
  }
}

async function load() {
  try {
    activeTab = await getTab();
    if (!activeTab?.url || !/^https?:\/\//i.test(activeTab.url)) {
      allCookies = [];
      $('#domain').textContent = 'Open facebook.com in the active tab';
      render();
      setStatus('NO TAB', 'warn');
      return;
    }

    const url = new URL(activeTab.url);
    if (!isFacebook(url.hostname)) {
      allCookies = [];
      $('#domain').textContent = `${url.hostname} — unsupported domain`;
      render();
      setStatus('FACEBOOK ONLY', 'warn');
      return;
    }

    selectedStoreId = await resolveStore(activeTab);
    $('#domain').textContent = `${url.hostname}${activeTab.incognito ? ' • INCOGNITO' : ''}`;
    allCookies = await chrome.cookies.getAll({ url: url.origin + '/', storeId: selectedStoreId || undefined });
    render();
    setStatus('READY', 'ready');
  } catch (error) {
    allCookies = [];
    render();
    setStatus('ERROR', 'error');
    toast(error?.message || 'Unable to read cookies', 'error');
  }
}

async function deleteCookie(cookie) {
  try {
    const removed = await chrome.cookies.remove({
      url: cookieUrl(cookie),
      name: cookie.name,
      storeId: cookie.storeId || selectedStoreId || undefined
    });
    if (!removed) throw new Error('Chrome did not remove the cookie');
    toast(`Deleted ${cookie.name}`, 'success');
    await load();
  } catch (error) {
    toast(`Delete failed: ${error?.message || 'Unknown error'}`, 'error');
  }
}

async function applyCookies() {
  try {
    if (!activeTab?.url || !/^https?:\/\//i.test(activeTab.url)) throw new Error('Open facebook.com in the active tab first');
    const url = new URL(activeTab.url);
    if (!isFacebook(url.hostname)) throw new Error('Open facebook.com in the active tab first');

    const input = $('#cookieInput').value.trim();
    if (!input) throw new Error('Paste cookies first');

    const format = detectFormat(input);
    const list = format === 'json' ? parseJson(input) : parseHeader(input);
    if (!list.length) throw new Error('No valid cookies found');

    setStatus('APPLYING…', 'loading');
    $('#apply').disabled = true;
    const defaultDomain = getTargetCookieDomain(url.hostname);
    const results = [];

    for (const item of list) {
      try {
        const details = {
          url: url.origin + '/',
          name: item.name,
          value: item.value,
          path: item.path || '/',
          storeId: selectedStoreId || undefined
        };

        if (format === 'json') {
          if (item.domain) details.domain = item.domain;
          if (typeof item.secure === 'boolean') details.secure = item.secure;
          if (typeof item.httpOnly === 'boolean') details.httpOnly = item.httpOnly;
          if (item.sameSite && ['no_restriction', 'lax', 'strict', 'unspecified'].includes(item.sameSite)) details.sameSite = item.sameSite;
          if (item.expirationDate && item.expirationDate > Date.now() / 1000) details.expirationDate = item.expirationDate;
        } else {
          details.domain = defaultDomain;
          details.secure = true;
        }

        const created = await chrome.cookies.set(details);
        if (!created) throw new Error('Chrome rejected the cookie');
        results.push({ name: item.name, ok: true });
      } catch (error) {
        results.push({ name: item.name, ok: false, error: error?.message || 'Set failed' });
      }
    }

    await load();
    const ok = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok);
    $('#result').hidden = false;
    $('#resultSummary').textContent = `${ok} applied • ${failed.length} failed`;
    $('#resultDetails').textContent = failed.length
      ? failed.map((r) => `${r.name}: ${r.error}`).join('\n')
      : 'All requested cookies were accepted by Chrome.';

    setStatus(failed.length ? 'PARTIAL' : 'APPLIED', failed.length ? 'warn' : 'ready');
    toast(`${ok} applied${failed.length ? `, ${failed.length} failed` : ''}`, failed.length ? 'warn' : 'success');
  } catch (error) {
    setStatus('ERROR', 'error');
    toast(error?.message || 'Import failed', 'error');
  } finally {
    $('#apply').disabled = false;
  }
}

function exportJson() {
  const blob = new Blob([JSON.stringify(allCookies, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `facebook-cookies-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
  toast('JSON exported', 'success');
}

async function clearDomain() {
  if (!allCookies.length) return toast('No cookies to clear', 'warn');
  if (!window.confirm('Clear all cookies for this Facebook domain?')) return;
  setStatus('CLEARING…', 'loading');
  let ok = 0;
  let fail = 0;
  for (const cookie of [...allCookies]) {
    try {
      const removed = await chrome.cookies.remove({ url: cookieUrl(cookie), name: cookie.name, storeId: cookie.storeId || selectedStoreId || undefined });
      if (removed) ok++; else fail++;
    } catch (_) { fail++; }
  }
  await load();
  toast(`${ok} deleted${fail ? `, ${fail} failed` : ''}`, fail ? 'warn' : 'success');
}

$('#search').addEventListener('input', render);
$('#refresh').addEventListener('click', load);
$('#apply').addEventListener('click', applyCookies);
$('#clearInput').addEventListener('click', () => { $('#cookieInput').value = ''; $('#result').hidden = true; });
$('#export').addEventListener('click', exportJson);
$('#clearAll').addEventListener('click', clearDomain);
$('#reload').addEventListener('click', () => activeTab && chrome.tabs.reload(activeTab.id));
load();
