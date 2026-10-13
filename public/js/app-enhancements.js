(() => {
  'use strict';
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];
  const KEY = 'straw-bridge-state-v1';
  const settingDefaults = {
    strategyMinutes: 5,
    buildMinutes: 25,
    reflectionMinutes: 5,
    presentationMinutes: 1,
    buildNoticePercent: 40,
    buildImportantPercent: 60,
    buildUrgentPercent: 80
  };
  let setupStep = 0;

  function repairLineBreaks(root = document) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const targets = [];
    while (walker.nextNode()) if (walker.currentNode.nodeValue.includes('\\n')) targets.push(walker.currentNode);
    targets.forEach(node => {
      const parts = node.nodeValue.split('\\n');
      const fragment = document.createDocumentFragment();
      parts.forEach((part, index) => { if (index) fragment.append(document.createElement('br')); fragment.append(part); });
      node.replaceWith(fragment);
    });
  }

  function showSetupStep(index) {
    const panels = $$('.setup-panel');
    setupStep = Math.max(0, Math.min(panels.length - 1, index));
    panels.forEach((panel, i) => panel.classList.toggle('active', i === setupStep));
    $$('[data-setup-tab]').forEach((button, i) => button.classList.toggle('active', i === setupStep));
    $('#setupStep').textContent = `${String(setupStep + 1).padStart(2, '0')} / ${String(panels.length).padStart(2, '0')}`;
    $('#setupPrevBtn').disabled = setupStep === 0;
    $('#setupNextBtn').hidden = setupStep === panels.length - 1;
    $('#saveSetupBtn').hidden = setupStep !== panels.length - 1;
    $('.setup-content').scrollTop = 0;
    updateSummary();
  }

  function updateSummary() {
    const editors = $$('[data-editor]');
    const count = editors.reduce((sum, row) => sum + $('[data-members]', row).value.split(/\r?\n/).filter(v => v.trim()).length, 0);
    if ($('#teamSummary')) $('#teamSummary').textContent = `${count}名・${editors.length}チーム`;
  }

  function readState() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
  }

  function loadSettings() {
    const state = readState();
    Object.entries(settingDefaults).forEach(([key, fallback]) => {
      const input = $('#' + key);
      if (input) input.value = Number(state[key]) || fallback;
    });
  }

  function collectDraft() {
    const state = readState();
    const editors = $$('[data-editor]');
    if (editors.length) state.teams = editors.map((row, i) => ({
      name: $('[data-name]', row).value.trim() || `${String.fromCharCode(65 + i)}チーム`,
      members: $('[data-members]', row).value.split(/\r?\n/).map(v => v.trim()).filter(Boolean)
    }));
    Object.entries(settingDefaults).forEach(([key, fallback]) => {
      const input = $('#' + key);
      const maximum = key.endsWith('Percent') ? 99 : Number(input?.max) || 120;
      state[key] = Math.max(1, Math.min(maximum, Number(input?.value) || state[key] || fallback));
    });
    state.scores = (state.teams || []).map((_, i) => state.scores?.[i] || 0);
    localStorage.setItem(KEY, JSON.stringify(state));
    return state;
  }

  const csvCell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
  function exportCsv() {
    const state = collectDraft();
    const rows = [['type','key','value'], ...Object.keys(settingDefaults).map(key => ['setting', key, state[key]])];
    (state.teams || []).forEach((team, index) => {
      rows.push(['team', index, team.name]);
      (team.members || []).forEach(member => rows.push(['member', index, member]));
    });
    const csv = '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = `straw-bridge-settings-${new Date().toISOString().slice(0,10)}.csv`; link.click();
    URL.revokeObjectURL(url);
  }

  function parseCsv(text) {
    const rows = []; let row = [], cell = '', quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted && c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = !quoted;
      else if (c === ',' && !quoted) { row.push(cell); cell = ''; }
      else if ((c === '\n' || c === '\r') && !quoted) { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); if (row.some(Boolean)) rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    row.push(cell); if (row.some(Boolean)) rows.push(row);
    return rows;
  }

  async function importCsv(file) {
    const rows = parseCsv((await file.text()).replace(/^\uFEFF/, '')).slice(1);
    const state = readState(), teams = [];
    rows.forEach(([type, key, value]) => {
      if (type === 'setting' && Object.hasOwn(settingDefaults, key)) state[key] = Math.max(1, Math.min(key.endsWith('Percent') ? 99 : 120, Number(value) || settingDefaults[key]));
      if (type === 'team') teams[Number(key)] = { name: value || `${Number(key)+1}チーム`, members: [] };
      if (type === 'member') { const i = Number(key); teams[i] ||= { name: `${i+1}チーム`, members: [] }; teams[i].members.push(value); }
    });
    state.teams = teams.filter(Boolean);
    if (!state.teams.length) throw new Error('チーム情報が見つかりません');
    state.scores = state.teams.map(() => 0);
    localStorage.setItem(KEY, JSON.stringify(state));
    alert('設定をインポートしました。画面を更新します。');
    location.reload();
  }

  $$('[data-setup-tab]').forEach(button => button.addEventListener('click', () => showSetupStep(Number(button.dataset.setupTab))));
  $('#setupPrevBtn').addEventListener('click', () => showSetupStep(setupStep - 1));
  $('#setupNextBtn').addEventListener('click', () => showSetupStep(setupStep + 1));
  $('#setupBtn').addEventListener('click', () => setTimeout(() => { loadSettings(); showSetupStep(0); }));
  $('#teamEditors').addEventListener('input', updateSummary);
  $('#addTeamBtn').addEventListener('click', () => setTimeout(updateSummary));
  $('#setupShuffleBtn').addEventListener('click', () => {
    const editors = $$('[data-editor]');
    const names = editors.flatMap(row => $('[data-members]', row).value.split(/\r?\n/).map(v => v.trim()).filter(Boolean)).sort(() => Math.random() - .5);
    editors.forEach(row => { $('[data-members]', row).value = ''; });
    names.forEach((name, i) => { const area = $('[data-members]', editors[i % editors.length]); area.value += `${area.value ? '\n' : ''}${name}`; });
    collectDraft(); updateSummary();
  });
  $('#exportSetupBtn').addEventListener('click', exportCsv);
  $('#importSetupBtn').addEventListener('click', () => $('#importSetupFile').click());
  $('#importSetupFile').addEventListener('change', event => { const file = event.target.files[0]; if (file) importCsv(file).catch(error => alert(`CSVを読み込めませんでした：${error.message}`)); });
  Object.keys(settingDefaults).forEach(key => $('#' + key)?.addEventListener('change', collectDraft));
  new MutationObserver(() => repairLineBreaks()).observe($('#deck'), { childList: true, subtree: true, characterData: true });
  loadSettings(); repairLineBreaks(); showSetupStep(0);
})();
