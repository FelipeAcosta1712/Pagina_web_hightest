/* =============================================
   INFORME DE ENSAYOS - HIGHTEST SAS
   Lógica vanilla JS para FR-7.8
   ============================================= */

(function () {
  'use strict';

  /* --- Contador global de IDs --- */
  let globalCounter = 17;
  function nextId() {
    const id = String(globalCounter).padStart(3, '0');
    globalCounter++;
    return id;
  }

  /* --- Estado de las pestañas --- */
  function initTabs() {
    const tabs = document.querySelectorAll('.inf-tab');
    const panels = document.querySelectorAll('.inf-panel');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const target = document.getElementById('panel-' + tab.dataset.tab);
        if (target) target.classList.add('active');
      });
    });
  }

  /* --- Código de informe global --- */
  function initReportCode() {
    const codeInput = document.getElementById('reportCode');
    const codeDisplays = document.querySelectorAll('.report-code-display');
    if (!codeInput) return;
    codeInput.addEventListener('input', () => {
      codeDisplays.forEach(el => el.textContent = codeInput.value);
      updateAllIds();
    });
  }

  function getReportCode() {
    return (document.getElementById('reportCode') || {}).value || 'R26-0001';
  }

  function updateAllIds() {
    const code = getReportCode();
    document.querySelectorAll('.cell-id').forEach(td => {
      const id = td.dataset.consecutivo;
      if (id) td.textContent = code + '-' + id;
    });
  }

  /* --- Utilidades de tabla --- */
  function computeCumpleMangas(item) {
    if (item.disrupcion === 'Sí' || item.inspeccionVisual === 'No Pasa') return 'NO PASA';
    return 'PASA';
  }

  function computeCumpleAlfombras(item) {
    if (item.disrupcion === 'PRESENTA' || item.inspeccionVisual === 'NO PASA') return 'NO PASA';
    return 'PASA';
  }

  function computeCumpleConCorriente(item) {
    if (item.disrupcion === 'PRESENTA' || item.inspeccionVisual === 'NO PASA') return 'NO PASA';
    if (item.corriente && item.maxCorriente && parseFloat(item.corriente) > parseFloat(item.maxCorriente)) return 'NO PASA';
    return 'PASA';
  }

  function computeCumpleTubos(item) {
    if (item.disrupcion === 'PRESENTA' || item.incrementoTemp === 'PRESENTA' || item.inspeccionVisual === 'NO PASA') return 'NO PASA';
    return 'PASA';
  }

  function computeCumpleTierras(item) {
    if (item.inspeccionVisual === 'NO PASA' || item.continuidad === 'NO EFICIENTE') return 'NO PASA';
    if (item.resistenciaMedida && item.resistenciaMax && parseFloat(item.resistenciaMedida) > parseFloat(item.resistenciaMax)) return 'NO PASA';
    return 'PASA';
  }

  function renderBadge(cumple) {
    const cls = cumple === 'PASA' ? 'inf-badge--pass' : 'inf-badge--fail';
    return '<span class="inf-badge ' + cls + '">' + cumple + '</span>';
  }

  function selectColorClass(val, badVal) {
    return val === badVal ? 'text-red' : 'text-green';
  }

  /* --- MANGAS --- */
  const defaultMangas = [
    { idConsecutivo: '001', idCliente: '', descripcion: 'MANGA DIELÉCTRICA', fabricante: '', clase: '2', inspeccionVisual: 'Pasa', tensionAplicada: '', incertidumbre: '', disrupcion: 'No' }
  ];

  function renderMangas() {
    const tbody = document.getElementById('mangasBody');
    if (!tbody) return;
    const code = getReportCode();
    tbody.innerHTML = defaultMangas.map((item, i) => {
      const cumple = computeCumpleMangas(item);
      const rowCls = cumple === 'NO PASA' ? 'row-fail' : '';
      return '<tr class="' + rowCls + '">' +
        '<td class="cell-id" data-consecutivo="' + item.idConsecutivo + '">' + code + '-' + item.idConsecutivo + '</td>' +
        '<td><input type="text" data-field="idCliente" data-idx="' + i + '" data-section="mangas" value="' + (item.idCliente || '') + '"></td>' +
        '<td class="section-start"><input type="text" data-field="descripcion" data-idx="' + i + '" data-section="mangas" value="' + (item.descripcion || '') + '" class="uppercase"></td>' +
        '<td><input type="text" data-field="fabricante" data-idx="' + i + '" data-section="mangas" value="' + (item.fabricante || '') + '" class="uppercase"></td>' +
        '<td><select data-field="clase" data-idx="' + i + '" data-section="mangas">' + claseOptions(item.clase) + '</select></td>' +
        '<td class="section-start"><select data-field="inspeccionVisual" data-idx="' + i + '" data-section="mangas" class="inf-select-inspeccion">' + inspOptions(item.inspeccionVisual) + '</select></td>' +
        '<td><input type="number" data-field="tensionAplicada" data-idx="' + i + '" data-section="mangas" value="' + (item.tensionAplicada || '') + '"></td>' +
        '<td><input type="number" data-field="incertidumbre" data-idx="' + i + '" data-section="mangas" value="' + (item.incertidumbre || '') + '"></td>' +
        '<td><select data-field="disrupcion" data-idx="' + i + '" data-section="mangas" class="inf-select-disrupcion ' + selectColorClass(item.disrupcion, 'Sí') + '">' + disrupcionOptionsManga(item.disrupcion) + '</select></td>' +
        '<td class="section-start">' + renderBadge(cumple) + '</td>' +
        '<td class="print-hidden"><button class="inf-btn-del" data-section="mangas" data-idx="' + i + '">X</button></td>' +
        '</tr>';
    }).join('');
    bindTableEvents('mangas', defaultMangas, renderMangas, computeCumpleMangas);
  }

  function addManga() {
    defaultMangas.push({ idConsecutivo: nextId(), idCliente: '', descripcion: 'MANGA DIELÉCTRICA', fabricante: '', clase: '2', inspeccionVisual: 'Pasa', tensionAplicada: '', incertidumbre: '', disrupcion: 'No' });
    renderMangas();
  }

  /* --- ALFOMBRAS --- */
  const defaultAlfombras = [
    { idConsecutivo: '002', idExterna: '', elemento: 'TAPETE DIELÉCTRICO', fabricante: '', clase: '2', dimension: '', inspeccionVisual: 'PASA', tension: '', incertidumbre: '0.40', disrupcion: 'NO PRESENTA' }
  ];

  function renderAlfombras() {
    const tbody = document.getElementById('alfombrasBody');
    if (!tbody) return;
    const code = getReportCode();
    tbody.innerHTML = defaultAlfombras.map((item, i) => {
      const cumple = computeCumpleAlfombras(item);
      const rowCls = cumple === 'NO PASA' ? 'row-fail' : '';
      return '<tr class="' + rowCls + '">' +
        '<td class="cell-id" data-consecutivo="' + item.idConsecutivo + '">' + code + '-' + item.idConsecutivo + '</td>' +
        '<td><input type="text" data-field="idExterna" data-idx="' + i + '" data-section="alfombras" value="' + (item.idExterna || '') + '"></td>' +
        '<td class="section-start"><input type="text" data-field="elemento" data-idx="' + i + '" data-section="alfombras" value="' + (item.elemento || '') + '" class="uppercase"></td>' +
        '<td><input type="text" data-field="fabricante" data-idx="' + i + '" data-section="alfombras" value="' + (item.fabricante || '') + '" class="uppercase"></td>' +
        '<td><select data-field="clase" data-idx="' + i + '" data-section="alfombras">' + claseOptions(item.clase) + '</select></td>' +
        '<td><input type="text" data-field="dimension" data-idx="' + i + '" data-section="alfombras" value="' + (item.dimension || '') + '"></td>' +
        '<td class="section-start"><select data-field="inspeccionVisual" data-idx="' + i + '" data-section="alfombras" class="inf-select-inspeccion">' + inspOptions(item.inspeccionVisual) + '</select></td>' +
        '<td><input type="number" data-field="tension" data-idx="' + i + '" data-section="alfombras" value="' + (item.tension || '') + '"></td>' +
        '<td><input type="number" data-field="incertidumbre" data-idx="' + i + '" data-section="alfombras" value="' + (item.incertidumbre || '') + '"></td>' +
        '<td><select data-field="disrupcion" data-idx="' + i + '" data-section="alfombras" class="inf-select-disrupcion ' + selectColorClass(item.disrupcion, 'PRESENTA') + '">' + disrupcionOptionsAlfombra(item.disrupcion) + '</select></td>' +
        '<td class="section-start">' + renderBadge(cumple) + '</td>' +
        '<td class="print-hidden"><button class="inf-btn-del" data-section="alfombras" data-idx="' + i + '">X</button></td>' +
        '</tr>';
    }).join('');
    bindTableEvents('alfombras', defaultAlfombras, renderAlfombras, computeCumpleAlfombras);
  }

  function addAlfombra() {
    defaultAlfombras.push({ idConsecutivo: nextId(), idExterna: '', elemento: 'TAPETE DIELÉCTRICO', fabricante: '', clase: '2', dimension: '', inspeccionVisual: 'PASA', tension: '', incertidumbre: '0.40', disrupcion: 'NO PRESENTA' });
    renderAlfombras();
  }

  /* --- MANTAS --- */
  const defaultMantas = [
    { idConsecutivo: '003', idExterna: '', elemento: 'MANTA DIELÉCTRICA', fabricante: '', clase: '4', dimension: '', inspeccionVisual: 'PASA', tension: '', incertidumbre: '0.40', disrupcion: 'NO PRESENTA' }
  ];

  function renderMantas() {
    const tbody = document.getElementById('mantasBody');
    if (!tbody) return;
    const code = getReportCode();
    tbody.innerHTML = defaultMantas.map((item, i) => {
      const cumple = computeCumpleAlfombras(item);
      const rowCls = cumple === 'NO PASA' ? 'row-fail' : '';
      return '<tr class="' + rowCls + '">' +
        '<td class="cell-id" data-consecutivo="' + item.idConsecutivo + '">' + code + '-' + item.idConsecutivo + '</td>' +
        '<td><input type="text" data-field="idExterna" data-idx="' + i + '" data-section="mantas" value="' + (item.idExterna || '') + '"></td>' +
        '<td class="section-start"><input type="text" data-field="elemento" data-idx="' + i + '" data-section="mantas" value="' + (item.elemento || '') + '" class="uppercase"></td>' +
        '<td><input type="text" data-field="fabricante" data-idx="' + i + '" data-section="mantas" value="' + (item.fabricante || '') + '" class="uppercase"></td>' +
        '<td><select data-field="clase" data-idx="' + i + '" data-section="mantas">' + claseOptions(item.clase) + '</select></td>' +
        '<td><input type="text" data-field="dimension" data-idx="' + i + '" data-section="mantas" value="' + (item.dimension || '') + '"></td>' +
        '<td class="section-start"><select data-field="inspeccionVisual" data-idx="' + i + '" data-section="mantas" class="inf-select-inspeccion">' + inspOptions(item.inspeccionVisual) + '</select></td>' +
        '<td><input type="number" data-field="tension" data-idx="' + i + '" data-section="mantas" value="' + (item.tension || '') + '"></td>' +
        '<td><input type="number" data-field="incertidumbre" data-idx="' + i + '" data-section="mantas" value="' + (item.incertidumbre || '') + '"></td>' +
        '<td><select data-field="disrupcion" data-idx="' + i + '" data-section="mantas" class="inf-select-disrupcion ' + selectColorClass(item.disrupcion, 'PRESENTA') + '">' + disrupcionOptionsAlfombra(item.disrupcion) + '</select></td>' +
        '<td class="section-start">' + renderBadge(cumple) + '</td>' +
        '<td class="print-hidden"><button class="inf-btn-del" data-section="mantas" data-idx="' + i + '">X</button></td>' +
        '</tr>';
    }).join('');
    bindTableEvents('mantas', defaultMantas, renderMantas, computeCumpleAlfombras);
  }

  function addManta() {
    defaultMantas.push({ idConsecutivo: nextId(), idExterna: '', elemento: 'MANTA DIELÉCTRICA', fabricante: '', clase: '4', dimension: '', inspeccionVisual: 'PASA', tension: '', incertidumbre: '0.40', disrupcion: 'NO PRESENTA' });
    renderMantas();
  }

  /* --- Select option generators --- */
  function claseOptions(selected) {
    return ['00','0','1','2','3','4'].map(v => '<option value="' + v + '"' + (v === selected ? ' selected' : '') + '>' + v + '</option>').join('');
  }

  function inspOptions(selected) {
    return ['PASA', 'NO PASA'].map(v => '<option' + (v === selected ? ' selected' : '') + '>' + v + '</option>').join('');
  }

  function disrupcionOptionsManga(selected) {
    return ['No', 'Sí'].map(v => '<option' + (v === selected ? ' selected' : '') + '>' + v + '</option>').join('');
  }

  function disrupcionOptionsAlfombra(selected) {
    return ['NO PRESENTA', 'PRESENTA'].map(v => '<option' + (v === selected ? ' selected' : '') + '>' + v + '</option>').join('');
  }

  /* --- Bind events on table --- */
  function bindTableEvents(section, data, renderFn, computeFn) {
    const panel = document.getElementById('panel-' + section);
    if (!panel) return;

    panel.querySelectorAll('input[data-section="' + section + '"], select[data-section="' + section + '"]').forEach(el => {
      el.addEventListener('change', function () {
        const idx = parseInt(this.dataset.idx);
        const field = this.dataset.field;
        data[idx][field] = this.value;
        renderFn();
      });
    });

    panel.querySelectorAll('.inf-btn-del[data-section="' + section + '"]').forEach(btn => {
      btn.addEventListener('click', function () {
        const idx = parseInt(this.dataset.idx);
        data.splice(idx, 1);
        renderFn();
      });
    });

    const addBtn = panel.querySelector('.inf-btn-add button');
    if (addBtn) {
      addBtn.onclick = null;
      if (section === 'mangas') addBtn.onclick = addManga;
      else if (section === 'alfombras') addBtn.onclick = addAlfombra;
      else if (section === 'mantas') addBtn.onclick = addManta;
    }
  }

  /* --- Init --- */
  function init() {
    initTabs();
    initReportCode();
    renderMangas();
    renderAlfombras();
    renderMantas();
    updateAllIds();
  }

  document.addEventListener('DOMContentLoaded', init);

})();
