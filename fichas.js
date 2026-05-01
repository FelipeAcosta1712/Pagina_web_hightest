document.addEventListener('DOMContentLoaded', function () {
  // Datos de las fichas (Anexos A..N) - contenido básico editable
  const fichas = [
    { id: 'anexo-a-guantes', title: 'FR-7.2.1.2 ANEXO A', subtitle: 'Guantes', summary: '<strong>Ficha técnica de ensayo:</strong> Documento que respalda y estandariza el procedimiento de verificación, control y aceptación de los ensayos realizados. Permite garantizar la trazabilidad, la seguridad y el cumplimiento normativo en cada etapa del proceso. <br><span style="color:#0b62b0;font-weight:500">Elemento: Guantes dieléctricos.</span>', contentUrl: 'fichas/FiT-guantes.html', html: `<div></div>` },

    { id: 'anexo-a-mangas', title: 'FR-7.2.1.2 ANEXO A', subtitle: 'Mangas', summary: '<strong>Ficha técnica de ensayo:</strong> Documento que respalda y estandariza el procedimiento de verificación, control y aceptación de los ensayos realizados. Permite garantizar la trazabilidad, la seguridad y el cumplimiento normativo en cada etapa del proceso. <br><span style="color:#0b62b0;font-weight:500">Elemento: Mangas aislantes.</span>', contentUrl: 'fichas/FiT-mangas.html', html: `
      <div class="sheet">
        <div class="sheet-top"><div class="sheet-title">FICHA TÉCNICA DE ENSAYO</div><div class="sheet-subtitle">FR-7.2.1.2 ANEXO A — Mangas</div></div>
        <div class="box"><h4>SECCIÓN 1 - PARÁMETROS</h4><ul><li>Material aislante</li><li>Condición: sin cortes ni desgaste</li></ul></div>
      </div>` },

    { id: 'anexo-b-jumpers', title: 'FR-7.2.1.2 ANEXO B', subtitle: 'By-pass / Jumpers', summary: '<strong>Ficha técnica de ensayo:</strong> Documento que respalda y estandariza el procedimiento de verificación, control y aceptación de los ensayos realizados. Permite garantizar la trazabilidad, la seguridad y el cumplimiento normativo en cada etapa del proceso. <br><span style="color:#0b62b0;font-weight:500">Elemento: By-pass / Jumpers.</span>', contentUrl: 'fichas/FiT-by-pass-jumpers.html', html: `
      <div class="sheet">
        <div class="sheet-top"><div class="sheet-title">FICHA TÉCNICA</div><div class="sheet-subtitle">FR-7.2.1.2 ANEXO B — By-pass / Jumpers</div></div>
        <div class="box"><h4>CARACTERÍSTICAS</h4><ul><li>Resistencia eléctrica adecuada</li><li>Conectores en buen estado</li></ul></div>
      </div>` },

    { id: 'anexo-c-tapetes', title: 'FR-7.2.1.2 ANEXO C', subtitle: 'Tapetes', summary: '<strong>Ficha técnica de ensayo:</strong> Documento que respalda y estandariza el procedimiento de verificación, control y aceptación de los ensayos realizados. Permite garantizar la trazabilidad, la seguridad y el cumplimiento normativo en cada etapa del proceso. <br><span style="color:#0b62b0;font-weight:500">Elemento: Tapetes dieléctricos.</span>', contentUrl: 'fichas/FiT-tapetes.html', html: `
      <div class="sheet"><div class="sheet-top"><div class="sheet-title">FICHA TÉCNICA</div><div class="sheet-subtitle">ANEXO C — Tapetes</div></div>
        <div class="box"><h4>INSPECCIÓN</h4><ul><li>Sin perforaciones</li><li>Superficie limpia y seca</li></ul></div></div>` },

    { id: 'anexo-d-mantas', title: 'FR-7.2.1.2 ANEXO D', subtitle: 'Mantas', summary: '<strong>Ficha técnica de ensayo:</strong> Documento que respalda y estandariza el procedimiento de verificación, control y aceptación de los ensayos realizados. Permite garantizar la trazabilidad, la seguridad y el cumplimiento normativo en cada etapa del proceso. <br><span style="color:#0b62b0;font-weight:500">Elemento: Mantas aislantes.</span>', contentUrl: 'fichas/FiT-mantas.html', html: `
      <div class="sheet"><div class="sheet-top"><div class="sheet-title">FICHA TÉCNICA</div><div class="sheet-subtitle">ANEXO D — Mantas</div></div>
        <div class="box"><h4>USO</h4><ul><li>Protección contra arcos</li><li>Sin cortes ni quemaduras</li></ul></div></div>` },

    { id: 'anexo-e-mangueras', title: 'FR-7.2.1.2 ANEXO E', subtitle: 'Mangueras y cubiertas', summary: '<strong>Ficha técnica de ensayo:</strong> Documento que respalda y estandariza el procedimiento de verificación, control y aceptación de los ensayos realizados. Permite garantizar la trazabilidad, la seguridad y el cumplimiento normativo en cada etapa del proceso. <br><span style="color:#0b62b0;font-weight:500">Elemento: Mangueras y cubiertas.</span>', contentUrl: 'fichas/FiT-mangueras-y-cubiertas.html', html: `
      <div class="sheet"><div class="sheet-top"><div class="sheet-title">FICHA TÉCNICA</div><div class="sheet-subtitle">ANEXO E — Mangueras y Cubiertas</div></div>
        <div class="box"><h4>CONDICIÓN</h4><ul><li>Sin fisuras</li><li>Conectores firmes</li></ul></div></div>` },

    { id: 'anexo-f-cubiertas', title: 'FR-7.2.1.2 ANEXO F', subtitle: 'Cubiertas plásticas', summary: '<strong>Ficha técnica de ensayo:</strong> Documento que respalda y estandariza el procedimiento de verificación, control y aceptación de los ensayos realizados. Permite garantizar la trazabilidad, la seguridad y el cumplimiento normativo en cada etapa del proceso. <br><span style="color:#0b62b0;font-weight:500">Elemento: Cubiertas plásticas.</span>', contentUrl: 'fichas/FiT-cubiertas-plasticas.html', html: `
      <div class="sheet"><div class="sheet-top"><div class="sheet-title">FICHA TÉCNICA</div><div class="sheet-subtitle">ANEXO F — Cubiertas Plásticas</div></div>
        <div class="box"><h4>VERIFICACIÓN</h4><ul><li>Integridad física</li><li>Ajuste correcto</li></ul></div></div>` },

    { id: 'anexo-g-cascos', title: 'FR-7.2.1.2 ANEXO G', subtitle: 'Cascos', summary: '<strong>Ficha técnica de ensayo:</strong> Documento que respalda y estandariza el procedimiento de verificación, control y aceptación de los ensayos realizados. Permite garantizar la trazabilidad, la seguridad y el cumplimiento normativo en cada etapa del proceso. <br><span style="color:#0b62b0;font-weight:500">Elemento: Cascos dieléctricos.</span>', contentUrl: 'fichas/FiT-cascos.html', html: `
      <div class="sheet"><div class="sheet-top"><div class="sheet-title">FICHA TÉCNICA</div><div class="sheet-subtitle">ANEXO G — Cascos</div></div>
        <div class="box"><h4>SEGURIDAD</h4><ul><li>Sin fisuras</li><li>Cinturón y acolchado en buen estado</li></ul></div></div>` },

    { id: 'anexo-h-plataformas', title: 'FR-7.2.1.2 ANEXO H', subtitle: 'Plataformas', summary: '<strong>Ficha técnica de ensayo:</strong> Documento que respalda y estandariza el procedimiento de verificación, control y aceptación de los ensayos realizados. Permite garantizar la trazabilidad, la seguridad y el cumplimiento normativo en cada etapa del proceso. <br><span style="color:#0b62b0;font-weight:500">Elemento: Plataformas de trabajo.</span>', contentUrl: 'fichas/FiT-plataformas.html', html: `
      <div class="sheet"><div class="sheet-top"><div class="sheet-title">FICHA TÉCNICA</div><div class="sheet-subtitle">ANEXO H — Plataformas</div></div>
        <div class="box"><h4>MONTAJE</h4><ul><li>Fijación segura</li><li>Inspección de soldaduras</li></ul></div></div>` },

    { id: 'anexo-i-calzado', title: 'FR-7.2.1.2 ANEXO I', subtitle: 'Calzado', summary: '<strong>Ficha técnica de ensayo:</strong> Documento que respalda y estandariza el procedimiento de verificación, control y aceptación de los ensayos realizados. Permite garantizar la trazabilidad, la seguridad y el cumplimiento normativo en cada etapa del proceso. <br><span style="color:#0b62b0;font-weight:500">Elemento: Calzado dieléctrico.</span>', contentUrl: 'fichas/FiT-calzado.html', html: `
      <div class="sheet"><div class="sheet-top"><div class="sheet-title">FICHA TÉCNICA</div><div class="sheet-subtitle">ANEXO I — Calzado</div></div>
        <div class="box"><h4>INSPECCIÓN</h4><ul><li>Suela en buen estado</li><li>Aislamiento intacto</li></ul></div></div>` },

    { id: 'anexo-j-detectores', title: 'FR-7.2.1.2 ANEXO J', subtitle: 'Detectores', summary: '<strong>Ficha técnica de ensayo:</strong> Documento que respalda y estandariza el procedimiento de verificación, control y aceptación de los ensayos realizados. Permite garantizar la trazabilidad, la seguridad y el cumplimiento normativo en cada etapa del proceso. <br><span style="color:#0b62b0;font-weight:500">Elemento: Detectores eléctricos.</span>', contentUrl: 'fichas/FiT-detectores.html', html: `
      <div class="sheet"><div class="sheet-top"><div class="sheet-title">FICHA TÉCNICA</div><div class="sheet-subtitle">ANEXO J — Detectores</div></div>
        <div class="box"><h4>CALIBRACIÓN</h4><ul><li>Fecha de calibración</li><li>Prueba funcional</li></ul></div></div>` },

    { id: 'anexo-k-herramientas', title: 'FR-7.2.1.2 ANEXO K', subtitle: 'Herramientas', summary: '<strong>Ficha técnica de ensayo:</strong> Documento que respalda y estandariza el procedimiento de verificación, control y aceptación de los ensayos realizados. Permite garantizar la trazabilidad, la seguridad y el cumplimiento normativo en cada etapa del proceso. <br><span style="color:#0b62b0;font-weight:500">Elemento: Herramientas aisladas.</span>', contentUrl: 'fichas/FiT-herramientas.html', html: `
      <div class="sheet"><div class="sheet-top"><div class="sheet-title">FICHA TÉCNICA</div><div class="sheet-subtitle">ANEXO K — Herramientas</div></div>
        <div class="box"><h4>CONDICIÓN</h4><ul><li>Aisladas y sin desgaste</li></ul></div></div>` },
    
    { id: 'anexo-l-pertigas', title: 'FR-7.2.1.2 ANEXO L', subtitle: 'Pértigas / Bastones', summary: '<strong>Ficha técnica de ensayo:</strong> Documento que respalda y estandariza el procedimiento de verificación, control y aceptación de los ensayos realizados. Permite garantizar la trazabilidad, la seguridad y el cumplimiento normativo en cada etapa del proceso. <br><span style="color:#0b62b0;font-weight:500">Elemento: Pértigas / Bastones.</span>', contentUrl: 'fichas/FiT-pertigas.html', html: ` 
      <div class="sheet"><div class="sheet-top"><div class="sheet-title">FICHA TÉCNICA</div><div class="sheet-subtitle">ANEXO L — Pértigas / Bastones</div></div>
        <div class="box"><h4>CONDICIÓN</h4><ul><li>Aisladas y sin desgaste</li></ul></div></div>` },
    
    { id: 'anexo-m-puentes', title: 'FR-7.2.1.2 ANEXO M', subtitle: 'Puentes temporales de puesta a tierra', summary: '<strong>Ficha técnica de ensayo:</strong> Documento que respalda y estandariza el procedimiento de verificación, control y aceptación de los ensayos realizados. Permite garantizar la trazabilidad, la seguridad y el cumplimiento normativo en cada etapa del proceso. <br><span style="color:#0b62b0;font-weight:500">Elemento: Puentes temporales de puesta a tierra.</span>', contentUrl: 'fichas/FiT-puentes-temporales-de-puesta-a-tierra.html', html: `
      <div class="sheet"><div class="sheet-top"><div class="sheet-title">FICHA TÉCNICA</div><div class="sheet-subtitle">ANEXO M — Puentes temporales de puesta a tierra</div></div>
        <div class="box"><h4>INSTALACIÓN</h4><ul><li>Conexión segura</li><li>Resistencia de puesta a tierra</li></ul></div></div>` },

    { id: 'anexo-n-liner', title: 'FR-7.2.1.2 ANEXO N', subtitle: 'Liner', summary: '<strong>Ficha técnica de ensayo:</strong> Documento que respalda y estandariza el procedimiento de verificación, control y aceptación de los ensayos realizados. Permite garantizar la trazabilidad, la seguridad y el cumplimiento normativo en cada etapa del proceso. <br><span style="color:#0b62b0;font-weight:500">Elemento: Liner aislante.</span>', contentUrl: 'fichas/FiT-liner.html', html: `
      <div class="sheet"><div class="sheet-top"><div class="sheet-title">FICHA TÉCNICA</div><div class="sheet-subtitle">ANEXO N — Liner</div></div>
        <div class="box"><h4>ESPECIFICACIONES</h4><ul><li>Material aislante</li><li>Estado general</li></ul></div></div>` },

    { id: 'anexo-n-vehiculos', title: 'FR-7.2.1.2 ANEXO N', subtitle: 'Vehículos', contentUrl: 'fichas/FiT-vehiculos.html', summary: '<strong>Ficha técnica de ensayo:</strong> Documento que respalda y estandariza el procedimiento de verificación, control y aceptación de los ensayos realizados. Permite garantizar la trazabilidad, la seguridad y el cumplimiento normativo en cada etapa del proceso. <br><span style="color:#0b62b0;font-weight:500">Elemento: Vehículos aéreos.</span>', html: `
      <div class="sheet"><div class="sheet-top"><div class="sheet-title">FICHA TÉCNICA DE ENSAYO</div><div class="sheet-subtitle">FR-7.2.1.2 ANEXO N — Vehículos</div></div>
        <div class="box"><h4>MONTAJE</h4><ul><li>Verificar brazo y aislación</li><li>Conductor de medición aislado</li></ul></div></div>` }
  ];

  const galleryGrid = document.getElementById('galleryGrid') || document.querySelector('.gallery-grid');
  if (!galleryGrid) return;

  // Renderizar tarjetas dinámicamente
  fichas.forEach((ficha, idx) => {
    const card = document.createElement('div');
    card.className = 'ficha-card';
    card.setAttribute('data-index', idx);
    card.setAttribute('tabindex', '0');

    const thumb = document.createElement('div');
    thumb.className = 'ficha-thumb';
    thumb.textContent = ficha.title + ' — ' + ficha.subtitle;

    const h4 = document.createElement('h4');
    h4.className = 'ficha-title';
    h4.textContent = ficha.subtitle;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'ficha-content';
    contentDiv.hidden = true;
    contentDiv.innerHTML = ficha.html;

    card.appendChild(thumb);
    card.appendChild(h4);
    card.appendChild(contentDiv);
    galleryGrid.appendChild(card);
  });

  // --- Modal y navegación ---
  const modal = document.getElementById('fichaModal');
  if (!modal) return;
  const modalBody = modal.querySelector('.modal-body');
  const closeBtn = modal.querySelector('.modal-close');
  const prevBtn = modal.querySelector('.modal-prev');
  const nextBtn = modal.querySelector('.modal-next');
  const overlay = modal.querySelector('.modal-overlay');
  let currentIndex = -1;
  const editBtn = modal.querySelector('.modal-edit');
  const viewBtn = modal.querySelector('.modal-download');

  const cards = Array.from(document.querySelectorAll('.ficha-card'));

  // Local save disabled: stubs to avoid reading/writing localStorage temporarily
  const savedKey = (id) => null;
  const getSaved = (id) => null;
  const saveSaved = (id, html) => { /* localStorage disabled temporarily */ };

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>\"]/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]);
    });
  }

  async function loadFullContentFor(ficha) {
    if (ficha && ficha.contentUrl) {
      try {
        const resp = await fetch(ficha.contentUrl, { cache: 'no-store' });
        if (resp.ok) return await resp.text();
      } catch (err) {
        // fallthrough
      }
    }

    return ficha && ficha.html ? ficha.html : '<p>No hay contenido disponible.</p>';
  }

  function showOverview(ficha) {
    const summary = ficha && ficha.summary ? ficha.summary : '<p>No hay resumen disponible.</p>';
    const subtitle = escapeHtml(ficha?.subtitle || ficha?.title || 'Ficha técnica');

    modalBody.innerHTML = `
      <div class="ficha-overview">
        <div class="sheet-top"><div class="sheet-title">FICHA TÉCNICA</div><div class="sheet-subtitle">${subtitle}</div></div>
        <div class="ficha-summary">${summary}</div>
      </div>
    `;

    // En el modal sólo mostramos 'Ver ficha técnica' y ocultamos 'Editar'
    if (editBtn) editBtn.style.display = 'none';
    if (viewBtn) viewBtn.style.display = 'inline-block';
  }

  if (viewBtn) {
    viewBtn.addEventListener('click', async () => {
      if (currentIndex < 0) return;
      const ficha = fichas[currentIndex] || {};
      if (ficha.contentUrl) {
        // Navegar a la ficha en la misma pestaña
        window.location.href = ficha.contentUrl;
      } else {
        alert('No hay URL de contenido disponible para esta ficha.');
      }
    });
  }

  function findNextVisible(idx) {
    for (let i = idx + 1; i < cards.length; i++) {
      if (cards[i].style.display !== 'none') return i;
    }
    return null;
  }
  function findPrevVisible(idx) {
    for (let i = idx - 1; i >= 0; i--) {
      if (cards[i].style.display !== 'none') return i;
    }
    return null;
  }

  function updateNavButtons() {
    if (!prevBtn || !nextBtn) return;
    prevBtn.disabled = findPrevVisible(currentIndex) === null;
    nextBtn.disabled = findNextVisible(currentIndex) === null;
  }

  async function openModal(index) {
    const card = cards[index];
    if (!card) return;
    const ficha = fichas[index];
    // Mostrar vista general (resumen) inicialmente. El usuario puede
    // abrir la ficha completa o entrar en modo edición.
    showOverview(ficha);

    // Ensure modal not editable and hide edit button
    if (modalBody) modalBody.contentEditable = 'false';
    if (modal.querySelector('.modal-edit')) modal.querySelector('.modal-edit').style.display = 'none';
    if (modal.querySelector('.modal-download')) modal.querySelector('.modal-download').style.display = 'inline-block';
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    currentIndex = index;
    document.body.style.overflow = 'hidden';
    updateNavButtons();
    closeBtn.focus();
  }

  function closeModal() {
    // Ensure modal not editable when closing
    if (modalBody) modalBody.contentEditable = 'false';
    if (modal.querySelector('.modal-edit')) modal.querySelector('.modal-edit').style.display = 'none';
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    currentIndex = -1;
  }

  cards.forEach((card, idx) => {
    card.addEventListener('click', () => openModal(idx));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(idx);
      }
    });
  });
  
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);

  // ===== BÚSQUEDA EN LA GALERÍA DE FICHAS =====
  // Filtra tarjetas según el input #fichaSearch (título, subtítulo y resumen)
  (function setupFichaSearch() {
    const input = document.getElementById('fichaSearch');
    if (!input) return;

    function normalizeText(s) {
      return String(s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    }

    function filterCards(raw) {
      const q = normalizeText(raw.trim());
      cards.forEach((card, idx) => {
        const ficha = fichas[idx] || {};
        const hay = `${ficha.title || ''} ${ficha.subtitle || ''} ${ficha.summary || ''} ${ficha.html || ''}`;
        const hayNorm = normalizeText(hay);
        if (!q || hayNorm.includes(q)) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    }

    // Debounce ligero
    let debounceTimer = null;
    input.addEventListener('input', function (e) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => filterCards(e.target.value), 120);
    });

    // Enter: abrir la primera tarjeta visible (si existe)
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const firstVisible = cards.findIndex(c => c.style.display !== 'none');
        if (firstVisible >= 0) {
          openModal(firstVisible);
        }
      }
    });
  })();

  prevBtn.addEventListener('click', function () {
    const prev = findPrevVisible(currentIndex);
    if (prev !== null) openModal(prev);
  });
  nextBtn.addEventListener('click', function () {
    const next = findNextVisible(currentIndex);
    if (next !== null) openModal(next);
  });

  document.addEventListener('keydown', function (e) {
    if (modal.classList.contains('open')) {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') prevBtn.click();
      if (e.key === 'ArrowRight') nextBtn.click();
    }
  });

  // Exponer datos para uso en el footer (índice rápido) y otras utilidades
  try {
    window.fichasList = fichas;
  } catch (err) {
    // silencio en caso de entornos estrictos
  }

});