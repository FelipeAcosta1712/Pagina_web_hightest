/* ============================================
   ADMIN DASHBOARD - Datos Reales
   HIGH TEST SAS
   ============================================ */

if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
    Chart.defaults.plugins.datalabels = { display: false };
}

const DashboardModule = {
    stats: null,
    charts: {},
    filters: {
        mes: '',
        cliente: '',
        estado: ''
    },

    async init() {
        this.bindDashboardFilters();
        await this.loadStats();
    },

    bindDashboardFilters() {
        const monthSelect = document.getElementById('dashMonthFilter');
        const clientSelect = document.getElementById('dashClientFilter');
        const statusSelect = document.getElementById('dashStatusFilter');

        if (monthSelect) {
            monthSelect.addEventListener('change', () => {
                this.filters.mes = monthSelect.value;
                this.loadStats();
            });
        }
        if (clientSelect) {
            clientSelect.addEventListener('change', () => {
                this.filters.cliente = clientSelect.value === 'Todos los clientes' ? '' : clientSelect.value;
                this.loadStats();
            });
        }
        if (statusSelect) {
            statusSelect.addEventListener('change', () => {
                this.filters.estado = statusSelect.value === 'Todos los estados' ? '' : statusSelect.value;
                this.loadStats();
            });
        }
    },

    populateFilters() {
        if (!this.stats) return;

        const monthSelect = document.getElementById('dashMonthFilter');
        const clientSelect = document.getElementById('dashClientFilter');
        const statusSelect = document.getElementById('dashStatusFilter');

        if (monthSelect) {
            const prev = monthSelect.value;
            const months = this.stats.allMesesForFilter || [];
            monthSelect.innerHTML = '<option value="">Todos los meses</option>';
            months.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.value;
                opt.textContent = m.label;
                monthSelect.appendChild(opt);
            });
            if (prev && months.some(m => m.value === prev)) monthSelect.value = prev;
        }

        if (clientSelect) {
            const prev = clientSelect.value;
            const clients = this.stats.allClientesForFilter || [];
            clientSelect.innerHTML = '<option>Todos los clientes</option>';
            clients.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = c;
                clientSelect.appendChild(opt);
            });
            if (prev && clients.includes(prev)) clientSelect.value = prev;
        }

        if (statusSelect) {
            const prev = statusSelect.value;
            const statuses = this.stats.allEstadosForFilter || [];
            statusSelect.innerHTML = '<option>Todos los estados</option>';
            statuses.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s;
                opt.textContent = s;
                statusSelect.appendChild(opt);
            });
            if (prev && statuses.includes(prev)) statusSelect.value = prev;
        }
    },

    async loadStats() {
        try {
            const body = { action: 'get_dashboard_stats' };
            if (this.filters.mes) body.mes = this.filters.mes;
            if (this.filters.cliente) body.cliente = this.filters.cliente;
            if (this.filters.estado) body.estado = this.filters.estado;

            const res = await fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.ok) {
                this.stats = data.stats;
                this.populateFilters();
                this.renderAll();
            } else {
                console.error('Error cargando stats:', data.error);
            }
        } catch (err) {
            console.error('Error de red:', err);
        }
    },

    formatCurrency(value) {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
    },

    formatNumber(value) {
        return new Intl.NumberFormat('es-CO').format(value);
    },

    getTimeAgo(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);
        if (diff < 60) return 'Ahora mismo';
        if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
        if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} horas`;
        if (diff < 604800) return `Hace ${Math.floor(diff / 86400)} d\u00edas`;
        return date.toLocaleDateString('es-CO');
    },

    renderAll() {
        if (!this.stats) return;
        this.renderStatCards();
        this.renderRecepcionesPorMes();
        this.renderProcesosPorEstado();
        this.renderTop10Elementos();
        this.renderUnidadesPorMes();
        this.renderElementosPorCategoria();
        this.renderTop5ClientesUnidades();
        this.bindClientesUnidadesModal();
        this.renderTop5ClientesProcesos();
        this.renderRecibidasEntregadasPorDia();
        this.renderActividadReciente();
        this.renderIndicadores();
        this.renderUltimasRecepciones();
        this.renderFlujoProcesos();
        this.renderLastUpdate();
        this.bindAllElementsModal();
    },

    bindAllElementsModal() {
        const btn = document.getElementById('verTodosElementos');
        if (btn) {
            btn.onclick = (e) => {
                e.preventDefault();
                this.showAllElementsModal();
            };
        }
    },

    showAllElementsModal() {
        const container = document.getElementById('modalAllElementsContent');
        const modal = document.getElementById('modalAllElements');
        if (!container || !modal) return;

        const all = this.stats.allElementos || this.stats.topEnsayos || [];
        if (all.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af;">Sin datos disponibles</div>';
        } else {
            let html = '<table style="width:100%;border-collapse:collapse;font-size:0.85rem;">';
            html += '<thead><tr style="border-bottom:2px solid #e5e7eb;text-align:left;"><th style="padding:8px 12px;">#</th><th style="padding:8px 12px;">Elemento</th><th style="padding:8px 12px;text-align:right;">Unidades</th><th style="padding:8px 12px;text-align:right;">Recepciones</th></tr></thead><tbody>';
            all.forEach((el, i) => {
                html += `<tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:8px 12px;color:#6b7280;">${i + 1}</td><td style="padding:8px 12px;">${el.nombre}</td><td style="padding:8px 12px;text-align:right;font-weight:600;">${el.count}</td><td style="padding:8px 12px;text-align:right;">${el.recepciones || 0}</td></tr>`;
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        }

        modal.style.display = 'block';
    },

    // ── KPI Cards ──
    renderStatCards() {
        const s = this.stats;
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('dashProcesos', this.formatNumber(s.totalProcesos));
        set('dashUnidades', this.formatNumber(s.unidadesRecibidas || 0));
        set('dashInformes', this.formatNumber(s.informesGenerados || 0));
        set('dashClientes', this.formatNumber(s.clientesAtendidos || 0));
        set('dashFinalizados', this.formatNumber(s.procesosFinalizados || 0));
        set('dashActivos', this.formatNumber(s.procesosActivos || 0));

        // Último Cliente
        const ultimo = s.ultimoCliente;
        const nombreEl = document.getElementById('ultimoClienteNombre');
        const fechaEl = document.getElementById('ultimoClienteFecha');
        const freqEl = document.getElementById('clientesFrecuencia');
        const freqLabel = document.getElementById('clientesFrecuenciaLabel');
        if (ultimo && nombreEl) {
            nombreEl.textContent = ultimo.nombre || '-';
            if (fechaEl) {
                fechaEl.textContent = ultimo.fecha ? this.getTimeAgo(ultimo.fecha) : 'Sin fecha';
            }
            if (freqEl && ultimo.frecuenciaDias !== undefined) {
                const d = ultimo.frecuenciaDias;
                if (d < 1) {
                    freqEl.textContent = '< 1 día';
                } else if (d < 2) {
                    freqEl.textContent = '~1 día';
                } else {
                    freqEl.textContent = `~${Math.round(d)} días`;
                }
                if (freqLabel) freqLabel.textContent = `Se crea un cliente nuevo`;
            }
        } else if (nombreEl) {
            nombreEl.textContent = 'Sin registros';
            if (fechaEl) fechaEl.textContent = 'No hay clientes creados';
        }

        // Cliente anterior
        const penultimo = s.penultimoCliente;
        const penSection = document.getElementById('penultimoClienteSection');
        const penNombreEl = document.getElementById('penultimoClienteNombre');
        const penFechaEl = document.getElementById('penultimoClienteFecha');
        if (penultimo && penSection && penNombreEl) {
            penSection.style.display = 'block';
            penNombreEl.textContent = penultimo.nombre || '-';
            if (penFechaEl) {
                penFechaEl.textContent = penultimo.fecha ? this.getTimeAgo(penultimo.fecha) : 'Sin fecha';
            }
        }

        // Total clientes
        const totalClientesEl = document.getElementById('totalClientesCount');
        if (totalClientesEl) {
            totalClientesEl.textContent = this.formatNumber(s.totalClientes || 0);
        }

        // Gráfico de clientes por mes
        this.renderClientesPorMes();
    },

    renderClientesPorMes() {
        const canvas = document.getElementById('chartClientesPorMes');
        if (!canvas || typeof Chart === 'undefined') return;
        if (this.charts.clientesPorMes) this.charts.clientesPorMes.destroy();

        const data = this.stats.clientesPorMes || {};
        const sortedKeys = Object.keys(data).sort();
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const labels = sortedKeys.map(k => { const [y, m] = k.split('-'); return `${months[parseInt(m) - 1]}`; });
        const values = sortedKeys.map(k => data[k]);

        this.charts.clientesPorMes = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Clientes',
                    data: values,
                    backgroundColor: '#e11d48',
                    borderRadius: 3,
                    maxBarThickness: 30
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { top: 15 } },
                plugins: {
                    legend: { display: false },
                    datalabels: { display: true, anchor: 'end', align: 'top', color: '#374151', font: { size: 10, weight: 'bold' }, padding: { top: 2 } }
                },
                scales: {
                    x: { ticks: { font: { size: 10 } } },
                    y: { beginAtZero: true, ticks: { font: { size: 10 }, stepSize: 1 } }
                }
            },
            plugins: [ChartDataLabels]
        });
    },

    // ── Recepciones por Mes (Bar Chart) ──
    renderRecepcionesPorMes() {
        const canvas = document.getElementById('chartEvolucion');
        if (!canvas || typeof Chart === 'undefined') return;
        if (this.charts.evolucion) this.charts.evolucion.destroy();

        const data = this.stats.recepcionesPorMes || {};
        const sortedKeys = Object.keys(data).sort();
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const labels = sortedKeys.map(k => { const [y, m] = k.split('-'); return `${months[parseInt(m) - 1]} ${y}`; });
        const values = sortedKeys.map(k => data[k]);
        const total = values.reduce((a, b) => a + b, 0);

        const footer = document.getElementById('evolucionFooter');
        if (footer) footer.textContent = `Total per\u00edodo: ${total} procesos`;

        this.charts.evolucion = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Recepciones',
                    data: values,
                    backgroundColor: '#3b82f6',
                    borderRadius: 4,
                    maxBarThickness: 60
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { top: 20 } },
                plugins: {
                    legend: { display: false },
                    datalabels: { display: true, anchor: 'end', align: 'top', color: '#374151', font: { size: 11, weight: 'bold' }, padding: { top: 4 } }
                },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 5 } } }
            },
            plugins: [ChartDataLabels]
        });
    },

    // ── Procesos por Estado (Donut) ──
    renderProcesosPorEstado() {
        const container = document.getElementById('legendEstado');
        const donutTotal = document.getElementById('donutTotal');
        const canvas = document.getElementById('chartEstado');
        if (!container || !canvas) return;
        if (this.charts.estado) this.charts.estado.destroy();

        const s = this.stats;
        const estados = s.procesosPorEstado || {};
        const total = s.totalProcesos;

        if (donutTotal) donutTotal.textContent = this.formatNumber(total);

        const colorMap = {
            'finalizado': '#4ade80', 'Finalizado': '#4ade80',
            'informe-de-ensayo': '#f97316', 'Informe': '#f97316',
            'entrega-cliente': '#3b82f6', 'Entrega cliente': '#3b82f6',
            'recepcion': '#a855f7', 'Recepci\u00f3n': '#a855f7',
            'lavado': '#8B5CF6', 'en-proceso-de-ensayo': '#F59E0B',
            'Sin estado': '#94A3B8'
        };
        const defaultColors = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#6B7280', '#EF4444', '#06B6D4'];

        container.innerHTML = '';
        let ci = 0;
        Object.entries(estados).forEach(([estado, count]) => {
            const color = colorMap[estado] || defaultColors[ci++ % defaultColors.length];
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const item = document.createElement('div');
            item.className = 'dash-legend-item';
            item.innerHTML = `<span class="dash-legend-item__color" style="background:${color}"></span><span class="dash-legend-item__label">${this.capitalizeFirst(estado)}</span><span class="dash-legend-item__value">${count} (${pct}%)</span>`;
            container.appendChild(item);
        });

        const footer = document.getElementById('donutFooter');
        const topEstado = Object.entries(estados).sort((a, b) => b[1] - a[1])[0];
        if (footer && topEstado) {
            const pct = Math.round((topEstado[1] / total) * 100);
            footer.textContent = `${this.capitalizeFirst(topEstado[0])}: ${pct}% del período`;
        }

        const labels = Object.keys(estados);
        const values = Object.values(estados);
        const bgColors = labels.map(l => colorMap[l] || '#94A3B8');

        this.charts.estado = new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: { labels: labels.map(l => this.capitalizeFirst(l)), datasets: [{ data: values, backgroundColor: bgColors, borderWidth: 2, borderColor: '#fff' }] },
            options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false } } }
        });
    },

    // ── Top 10 Elementos (Table) ──
    renderTop10Elementos() {
        const container = document.getElementById('top10Table');
        if (!container) return;
        const top = this.stats.topEnsayos || [];
        if (top.length === 0) { container.innerHTML = '<div style="text-align:center;padding:1rem;color:#9ca3af;font-size:0.75rem;">Sin datos</div>'; return; }

        container.innerHTML = `<div class="dash-top10-table__header"><span>#</span><span>Elemento</span><span style="text-align:right">Unidades</span><span style="text-align:right">Recepciones</span></div>`;
        const allElements = this.stats.allElementos || [];
        let totalUnidades = 0;
        let totalRecepciones = 0;
        allElements.forEach((el) => {
            totalUnidades += el.count;
            totalRecepciones += (el.recepciones || 0);
        });
        top.forEach((el, i) => {
            const row = document.createElement('div');
            row.className = 'dash-top10-table__row';
            row.innerHTML = `<span class="dash-top10-table__rank">${i + 1}</span><span class="dash-top10-table__name" title="${el.nombre}">${el.nombre}</span><span class="dash-top10-table__num">${el.count}</span><span class="dash-top10-table__num">${el.recepciones || 0}</span>`;
            container.appendChild(row);
        });
        const totalRow = document.createElement('div');
        totalRow.className = 'dash-top10-table__total';
        totalRow.innerHTML = `<span></span><span>Total</span><span class="dash-top10-table__num">${totalUnidades.toLocaleString()}</span><span class="dash-top10-table__num">${totalRecepciones.toLocaleString()}</span>`;
        container.appendChild(totalRow);
    },

    // ── Unidades Recibidas por Mes (Bar Chart) ──
    renderUnidadesPorMes() {
        const canvas = document.getElementById('chartUnidadesPorMes');
        if (!canvas || typeof Chart === 'undefined') return;
        if (this.charts.unidadesPorMes) this.charts.unidadesPorMes.destroy();

        const data = this.stats.unidadesPorMes || {};
        const sortedKeys = Object.keys(data).sort();
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const labels = sortedKeys.map(k => { const [y, m] = k.split('-'); return `${months[parseInt(m) - 1]} ${y}`; });
        const values = sortedKeys.map(k => data[k]);
        const total = values.reduce((a, b) => a + b, 0);

        const footer = document.getElementById('unidadesPorMesFooter');
        if (footer) footer.textContent = `Total per\u00edodo: ${total.toLocaleString()} unidades`;

        this.charts.unidadesPorMes = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Unidades',
                    data: values,
                    backgroundColor: '#10b981',
                    borderRadius: 4,
                    maxBarThickness: 60
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { top: 20 } },
                plugins: {
                    legend: { display: false },
                    datalabels: { display: true, anchor: 'end', align: 'top', color: '#374151', font: { size: 11, weight: 'bold' }, padding: { top: 4 } }
                },
                scales: { y: { beginAtZero: true } }
            },
            plugins: [ChartDataLabels]
        });
    },

    // ── Promedio de Días y Elementos por Cliente ──
    renderRecibidasEntregadasPorDia() {
        const canvasMenos = document.getElementById('chartEntregaMenos');
        const canvasMas = document.getElementById('chartEntregaMas');
        const footer = document.getElementById('recibidasEntregadasFooter');
        const filterSelect = document.getElementById('filterClienteEntrega');
        const container = document.getElementById('entregaChartsContainer');
        const headers = container?.querySelectorAll('.entrega-label-header');
        if (!canvasMenos || !canvasMas || typeof Chart === 'undefined') return;
        if (this.charts.entregaMenos) this.charts.entregaMenos.destroy();
        if (this.charts.entregaMas) this.charts.entregaMas.destroy();

        const data = this.stats.promedioDiasEntregaCliente || {};
        const clientes = (data.clientes || []).filter(c => c.promedio > 0);

        const dataElem = this.stats.promedioElementosPorCliente || {};
        const clientesElem = dataElem.clientes || [];

        // Mapa de elementos por nombre de cliente
        const mapElem = {};
        clientesElem.forEach(c => { mapElem[c.nombre] = c; });

        if (clientes.length === 0) {
            if (footer) footer.textContent = 'Sin datos disponibles';
            return;
        }

        // Llenar filtro de clientes (solo una vez)
        if (filterSelect && filterSelect.options.length <= 1) {
            clientes.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.nombre;
                opt.textContent = c.nombre;
                filterSelect.appendChild(opt);
            });
            filterSelect.addEventListener('change', () => this.renderRecibidasEntregadasPorDia());
        }

        const clienteFilter = filterSelect?.value || '';
        const promedioGeneral = data.promedioGeneral || 0;
        const promedioElemGeneral = dataElem.promedioGeneral || 0;

        const canvasMenosWrap = canvasMenos.parentElement;
        const canvasMasWrap = canvasMas.parentElement;
        const headerMenos = headers?.[0];
        const headerMas = headers?.[1];

        // ── Si se filtró un cliente específico ──
        if (clienteFilter) {
            canvasMenosWrap.style.display = 'none';
            canvasMasWrap.style.display = '';
            canvasMas.style.display = '';
            if (container) container.style.gridTemplateColumns = '1fr';
            if (headerMenos) headerMenos.style.display = 'none';
            if (headerMas) { headerMas.style.display = ''; headerMas.textContent = clienteFilter; headerMas.style.color = '#374151'; }

            const cliente = clientes.find(c => c.nombre === clienteFilter);
            const elem = mapElem[clienteFilter];

            if (!cliente) {
                if (footer) footer.textContent = 'Cliente sin datos de entrega';
                return;
            }

            if (footer) {
                const parts = [`Promedio días: ${Number.isInteger(cliente.promedio) ? cliente.promedio : cliente.promedio.toFixed(1)}`];
                if (elem) parts.push(`Promedio elementos: ${Number.isInteger(elem.promedio) ? elem.promedio : elem.promedio.toFixed(1)}`);
                footer.textContent = parts.join(' · ');
            }

            const diasColor = cliente.promedio <= 3 ? '#22c55e' : cliente.promedio <= 7 ? '#3b82f6' : cliente.promedio <= 15 ? '#f59e0b' : '#ef4444';
            const elemProm = elem ? (Number.isInteger(elem.promedio) ? elem.promedio : elem.promedio.toFixed(1)) : null;

            // Un solo chart con 2 barras: Días y Elementos
            const labels = ['Promedio Días'];
            const valores = [cliente.promedio];
            const colores = [diasColor];
            if (elemProm !== null) {
                labels.push('Promedio Elem.');
                valores.push(elemProm);
                colores.push('#8b5cf6');
            }

            const maxVal = Math.max(...valores);

            this.charts.entregaMas = new Chart(canvasMas.getContext('2d'), {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        data: valores,
                        backgroundColor: colores,
                        borderRadius: 6,
                        borderSkipped: false,
                        barPercentage: 0.5,
                        categoryPercentage: 0.7
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    layout: { padding: { left: 10, right: 60 } },
                    plugins: {
                        legend: { display: false },
                        datalabels: {
                            display: true,
                            anchor: 'end',
                            align: 'right',
                            offset: 6,
                            color: '#1f2937',
                            font: { size: 12, weight: '700' },
                            formatter: (value) => {
                                const d = Number.isInteger(value) ? value : value.toFixed(1);
                                return d + (value === cliente.promedio ? 'd' : 'e');
                            }
                        },
                        tooltip: {
                            backgroundColor: '#1f2937',
                            titleFont: { size: 12, weight: 'bold' },
                            bodyFont: { size: 11 },
                            padding: 8,
                            cornerRadius: 6,
                            displayColors: false,
                            callbacks: {
                                title: () => clienteFilter,
                                label: (ctxItem) => {
                                    const isDias = ctxItem.dataIndex === 0;
                                    const lines = [`${isDias ? 'Promedio: ' + ctxItem.raw + ' días' : 'Promedio: ' + ctxItem.raw + ' elementos'}`];
                                    lines.push(`Procesos: ${cliente.cantidad}`);
                                    if (elem && isDias) lines.push(`Total unidades: ${elem.totalUnidades}`);
                                    return lines;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            max: Math.ceil(maxVal * 1.4) || 5,
                            border: { display: false },
                            grid: { color: '#f3f4f6', drawTicks: false },
                            ticks: { font: { size: 10 }, color: '#9ca3af', padding: 4 }
                        },
                        y: {
                            border: { display: false },
                            grid: { display: false },
                            ticks: { font: { size: 12, weight: '600' }, color: '#374151', padding: 6 }
                        }
                    }
                },
                plugins: [ChartDataLabels]
            });
            return;
        }

        // ── Vista normal: 2 columnas ──
        canvasMenosWrap.style.display = '';
        canvasMasWrap.style.display = '';
        canvasMenos.style.display = '';
        canvasMas.style.display = '';
        if (container) container.style.gridTemplateColumns = '1fr 1fr';
        if (headerMenos) { headerMenos.style.display = ''; headerMenos.textContent = 'Menos días'; headerMenos.style.color = '#22c55e'; }
        if (headerMas) { headerMas.style.display = ''; headerMas.textContent = 'Más días'; headerMas.style.color = '#ef4444'; }

        if (footer) footer.textContent = `Promedio días: ${promedioGeneral} · Promedio elementos: ${promedioElemGeneral}`;

        // Separar: menos días (ascendente, top 6) y más días (descendente, top 6)
        const ordenados = [...clientes].sort((a, b) => a.promedio - b.promedio);
        const menosDias = ordenados.slice(0, 6);
        const masDias = [...ordenados].reverse().slice(0, 6);

        const makeConfig = (items) => {
            const labels = items.map(c => {
                return c.nombre.length > 16 ? c.nombre.substring(0, 16) + '…' : c.nombre;
            });
            const valores = items.map(c => c.promedio);
            const cantidades = items.map(c => c.cantidad);
            const elemPromedios = items.map(c => {
                const e = mapElem[c.nombre];
                return e ? (Number.isInteger(e.promedio) ? e.promedio : e.promedio.toFixed(1)) : null;
            });
            const colores = valores.map(v => {
                if (v <= 3) return '#22c55e';
                if (v <= 7) return '#3b82f6';
                if (v <= 15) return '#f59e0b';
                return '#ef4444';
            });
            return { labels, valores, cantidades, elemPromedios, colores, items };
        };

        const cfgMenos = makeConfig(menosDias);
        const cfgMas = makeConfig(masDias);

        const maxGlobal = Math.max(
            cfgMenos.valores.length ? Math.max(...cfgMenos.valores) : 0,
            cfgMas.valores.length ? Math.max(...cfgMas.valores) : 0
        );

        const baseOptions = (maxVal) => ({
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            layout: { padding: { left: 4, right: 80 } },
            plugins: {
                legend: { display: false },
                datalabels: {
                    display: true,
                    anchor: 'end',
                    align: 'right',
                    offset: 4,
                    color: '#1f2937',
                    font: { size: 10, weight: '700' },
                    formatter: (value, ctx) => {
                        const cant = ctx.dataset._cantidades[ctx.dataIndex];
                        const elem = ctx.dataset._elemPromedios[ctx.dataIndex];
                        const d = Number.isInteger(value) ? value : value.toFixed(1);
                        const eStr = elem !== null ? `${elem}e` : '';
                        return `${d}d · ${cant}p ${eStr}`;
                    }
                },
                tooltip: {
                    backgroundColor: '#1f2937',
                    titleFont: { size: 11, weight: 'bold' },
                    bodyFont: { size: 10 },
                    padding: 6,
                    cornerRadius: 5,
                    displayColors: false,
                    callbacks: {
                        title: (items) => {
                            const item = items[0];
                            return item?.dataset?._items?.[item.dataIndex]?.nombre || item?.chart?._srcItems?.[item.dataIndex]?.nombre || '';
                        },
                        label: (ctxItem) => {
                            const cant = ctxItem.dataset._cantidades[ctxItem.dataIndex];
                            const elem = ctxItem.dataset._elemPromedios[ctxItem.dataIndex];
                            const d = Number.isInteger(ctxItem.raw) ? ctxItem.raw : ctxItem.raw.toFixed(1);
                            const lines = [`Promedio: ${d} días · ${cant} proceso(s)`];
                            if (elem !== null) lines.push(`Promedio elementos: ${elem}`);
                            return lines;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: Math.ceil(maxVal * 1.3) || 5,
                    border: { display: false },
                    grid: { color: '#f3f4f6', drawTicks: false },
                    ticks: { font: { size: 9 }, color: '#9ca3af', padding: 3, callback: (v) => v + 'd' }
                },
                y: {
                    border: { display: false },
                    grid: { display: false },
                    ticks: { font: { size: 10, weight: '500' }, color: '#374151', padding: 4 }
                }
            }
        });

        // Chart Menos Días
        if (cfgMenos.valores.length) {
            const ds = {
                data: cfgMenos.valores,
                backgroundColor: cfgMenos.colores,
                borderRadius: 4,
                borderSkipped: false,
                barPercentage: 0.55,
                categoryPercentage: 0.85,
                _cantidades: cfgMenos.cantidades,
                _elemPromedios: cfgMenos.elemPromedios,
                _items: cfgMenos.items
            };
            this.charts.entregaMenos = new Chart(canvasMenos.getContext('2d'), {
                type: 'bar',
                data: { labels: cfgMenos.labels, datasets: [ds] },
                options: baseOptions(maxGlobal),
                plugins: [ChartDataLabels]
            });
            this.charts.entregaMenos._srcItems = menosDias;
        }

        // Chart Más Días
        if (cfgMas.valores.length) {
            const ds = {
                data: cfgMas.valores,
                backgroundColor: cfgMas.colores,
                borderRadius: 4,
                borderSkipped: false,
                barPercentage: 0.55,
                categoryPercentage: 0.85,
                _cantidades: cfgMas.cantidades,
                _elemPromedios: cfgMas.elemPromedios,
                _items: cfgMas.items
            };
            this.charts.entregaMas = new Chart(canvasMas.getContext('2d'), {
                type: 'bar',
                data: { labels: cfgMas.labels, datasets: [ds] },
                options: baseOptions(maxGlobal),
                plugins: [ChartDataLabels]
            });
            this.charts.entregaMas._srcItems = masDias;
        }

        // ── Modal: Ver todos los clientes ──
        const btnVerTodos = document.getElementById('verTodosClientesEntrega');
        const modal = document.getElementById('modalAllEntregaClientes');
        const modalBody = document.getElementById('modalAllEntregaBody');
        const closeModal = () => { modal.classList.remove('modal--open'); modal.setAttribute('aria-hidden', 'true'); };

        if (btnVerTodos && modal) {
            btnVerTodos.onclick = (e) => {
                e.preventDefault();
                const mapDias = {};
                clientes.forEach(c => { mapDias[c.nombre] = c; });
                const allNombres = [...new Set([...Object.keys(mapDias), ...Object.keys(mapElem)])];
                const allClientes = allNombres.map(nombre => ({
                    nombre,
                    promedioDias: mapDias[nombre]?.promedio ?? null,
                    cantidad: mapDias[nombre]?.cantidad ?? 0,
                    minimo: mapDias[nombre]?.minimo ?? '-',
                    maximo: mapDias[nombre]?.maximo ?? '-',
                    promedioElem: mapElem[nombre]?.promedio ?? null,
                    totalUnidades: mapElem[nombre]?.totalUnidades ?? 0
                })).sort((a, b) => (b.promedioDias || 0) - (a.promedioDias || 0));

                let html = `<table style="width:100%; border-collapse:collapse; font-size:0.78rem;">
                    <thead><tr style="border-bottom:2px solid #e5e7eb; text-align:left;">
                        <th style="padding:7px 8px; color:#6b7280;">#</th>
                        <th style="padding:7px 8px; color:#6b7280;">Cliente</th>
                        <th style="padding:7px 8px; color:#6b7280; text-align:center;">Proc.</th>
                        <th style="padding:7px 8px; color:#6b7280; text-align:right;">Prom. Días</th>
                        <th style="padding:7px 8px; color:#6b7280; text-align:right;">Min</th>
                        <th style="padding:7px 8px; color:#6b7280; text-align:right;">Max</th>
                        <th style="padding:7px 8px; color:#6b7280; text-align:right;">Prom. Elem.</th>
                    </tr></thead><tbody>`;
                allClientes.forEach((c, i) => {
                    const bg = i % 2 === 0 ? '#f9fafb' : '#fff';
                    const diasColor = c.promedioDias !== null ? (c.promedioDias <= 3 ? '#22c55e' : c.promedioDias <= 7 ? '#3b82f6' : c.promedioDias <= 15 ? '#f59e0b' : '#ef4444') : '#d1d5db';
                    const elemColor = '#8b5cf6';
                    const diasText = c.promedioDias !== null ? `<span style="background:${diasColor}; color:#fff; padding:2px 7px; border-radius:10px; font-weight:600; font-size:0.75rem;">${Number.isInteger(c.promedioDias) ? c.promedioDias : c.promedioDias.toFixed(1)}d</span>` : '<span style="color:#d1d5db;">—</span>';
                    const elemText = c.promedioElem !== null ? `<span style="background:${elemColor}; color:#fff; padding:2px 7px; border-radius:10px; font-weight:600; font-size:0.75rem;">${Number.isInteger(c.promedioElem) ? c.promedioElem : c.promedioElem.toFixed(1)}e</span>` : '<span style="color:#d1d5db;">—</span>';
                    html += `<tr style="background:${bg}; border-bottom:1px solid #f3f4f6;">
                        <td style="padding:6px 8px; color:#9ca3af;">${i + 1}</td>
                        <td style="padding:6px 8px; font-weight:500;">${c.nombre}</td>
                        <td style="padding:6px 8px; text-align:center; color:#6b7280;">${c.cantidad || '-'}</td>
                        <td style="padding:6px 8px; text-align:right;">${diasText}</td>
                        <td style="padding:6px 8px; text-align:right; color:#6b7280;">${c.minimo !== '-' ? c.minimo + 'd' : '—'}</td>
                        <td style="padding:6px 8px; text-align:right; color:#6b7280;">${c.maximo !== '-' ? c.maximo + 'd' : '—'}</td>
                        <td style="padding:6px 8px; text-align:right;">${elemText}</td>
                    </tr>`;
                });
                html += '</tbody></table>';
                modalBody.innerHTML = html;
                modal.classList.add('modal--open');
                modal.setAttribute('aria-hidden', 'false');
            };
        }

        // Cerrar modal
        const closeBtn = document.getElementById('closeModalAllEntrega');
        const closeBtnFooter = document.getElementById('closeModalAllEntregaBtn');
        if (closeBtn) closeBtn.onclick = closeModal;
        if (closeBtnFooter) closeBtnFooter.onclick = closeModal;
        if (modal) {
            modal.onclick = (e) => { if (e.target === modal) closeModal(); };
        }
    },

    // ── Elementos por Categoría (Donut + Legend) ──
    renderElementosPorCategoria() {
        const container = document.getElementById('legendCategorias');
        const canvas = document.getElementById('chartCategorias');
        if (!container || !canvas) return;
        if (this.charts.categorias) this.charts.categorias.destroy();

        const allCats = this.stats.elementosPorCategoria || [];
        if (allCats.length === 0) { container.innerHTML = '<div style="text-align:center;padding:1rem;color:#9ca3af;font-size:0.75rem;">Sin datos</div>'; return; }

        const top8 = allCats.slice(0, 8);
        const colors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#10B981', '#06B6D4', '#EF4444', '#84CC16'];

        container.innerHTML = '';
        top8.forEach((cat, i) => {
            const color = colors[i % colors.length];
            const item = document.createElement('div');
            item.className = 'dash-legend-item';
            item.innerHTML = `<span class="dash-legend-item__color" style="background:${color}"></span><span class="dash-legend-item__label">${cat.nombre}</span><span class="dash-legend-item__value">${cat.porcentaje}%</span>`;
            container.appendChild(item);
        });

        this.charts.categorias = new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: { labels: top8.map(c => c.nombre), datasets: [{ data: top8.map(c => c.unidades), backgroundColor: colors.slice(0, top8.length), borderWidth: 2, borderColor: '#fff' }] },
            options: { responsive: true, maintainAspectRatio: false, cutout: '55%', plugins: { legend: { display: false } } }
        });

        this.bindCategoriasModal();
    },

    bindCategoriasModal() {
        const btn = document.getElementById('verTodasCategorias');
        if (btn) {
            btn.onclick = (e) => {
                e.preventDefault();
                this.showAllCategoriasModal();
            };
        }
    },

    showAllCategoriasModal() {
        const container = document.getElementById('modalAllCategoriasContent');
        const modal = document.getElementById('modalAllCategorias');
        if (!container || !modal) return;

        const allCats = this.stats.elementosPorCategoria || [];
        if (allCats.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af;">Sin datos disponibles</div>';
        } else {
            const colors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#10B981', '#06B6D4', '#EF4444', '#84CC16', '#14B8A6', '#F97316'];
            let html = '<table style="width:100%;border-collapse:collapse;font-size:0.85rem;">';
            html += '<thead><tr style="border-bottom:2px solid #e5e7eb;text-align:left;"><th style="padding:8px 12px;">#</th><th style="padding:8px 12px;">Categoría</th><th style="padding:8px 12px;text-align:right;">Unidades</th><th style="padding:8px 12px;text-align:right;">%</th></tr></thead><tbody>';
            allCats.forEach((cat, i) => {
                const color = colors[i % colors.length];
                html += `<tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:8px 12px;color:#6b7280;">${i + 1}</td><td style="padding:8px 12px;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:8px;"></span>${cat.nombre}</td><td style="padding:8px 12px;text-align:right;font-weight:600;">${cat.unidades}</td><td style="padding:8px 12px;text-align:right;">${cat.porcentaje}%</td></tr>`;
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        }

        modal.style.display = 'block';
    },

    // ── Top 5 Clientes por Unidades (Horizontal Bar) ──
    renderTop5ClientesUnidades() {
        const canvas = document.getElementById('chartClientesUnidades');
        if (!canvas || typeof Chart === 'undefined') return;
        if (this.charts.clientesUnidades) this.charts.clientesUnidades.destroy();

        const clientes = (this.stats.topClientesUnidades || []).slice(0, 6);
        if (clientes.length === 0) return;

        const MAX_CHARS = 16;
        const MAX_LINES = 2;
        const splitLabel = (name) => {
            const text = String(name || '').trim();
            if (text.length <= MAX_CHARS) return text;
            const lines = [];
            let current = '';
            const push = (line) => { if (line) lines.push(line); };
            text.split(/\s+/).forEach(word => {
                while (word.length > MAX_CHARS) {
                    push(current);
                    current = '';
                    push(word.slice(0, MAX_CHARS));
                    word = word.slice(MAX_CHARS);
                }
                if (!word) return;
                const candidate = current ? `${current} ${word}` : word;
                if (candidate.length <= MAX_CHARS) {
                    current = candidate;
                } else {
                    push(current);
                    current = word;
                }
            });
            push(current);
            if (lines.length > MAX_LINES) {
                lines.length = MAX_LINES;
                lines[MAX_LINES - 1] = lines[MAX_LINES - 1].slice(0, MAX_CHARS - 1) + '…';
            }
            return lines.length === 1 ? lines[0] : lines;
        };

        this.charts.clientesUnidades = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: clientes.map(c => splitLabel(c.nombre)),
                datasets: [{ label: 'Unidades', data: clientes.map(c => c.unidades), backgroundColor: '#3b82f6', borderRadius: 4, maxBarThickness: 30, barPercentage: 0.85 }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { left: 0, right: 40 } },
                plugins: {
                    legend: { display: false },
                    datalabels: { display: true, anchor: 'end', align: 'right', color: '#374151', font: { size: 10, weight: 'bold' }, formatter: v => v },
                    tooltip: {
                        callbacks: {
                            title: (items) => {
                                const cliente = clientes[items[0]?.dataIndex];
                                return cliente ? cliente.nombre : '';
                            }
                        }
                    }
                },
                scales: {
                    x: { beginAtZero: true, grid: { display: false } },
                    y: { ticks: { font: { size: 10 }, autoSkip: false, padding: 6 }, grid: { display: false } }
                }
            },
            plugins: [ChartDataLabels]
        });
    },

    // ── Top 5 Clientes por Procesos ──
    renderTop5ClientesProcesos() {
        const container = document.getElementById('top5ClientesProcesosList');
        if (!container) return;
        const clientes = (this.stats.top5ClientesProcesos || []).slice(0, 6);
        if (clientes.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:1rem;color:#9ca3af;font-size:0.75rem;">Sin datos</div>';
            return;
        }
        const maxCount = clientes[0]?.count || 1;
        const colors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#06B6D4'];
        container.innerHTML = '';
        clientes.forEach((cliente, i) => {
            const pct = maxCount > 0 ? Math.round((cliente.count / maxCount) * 100) : 0;
            const item = document.createElement('div');
            item.className = 'dash-top5cp-item';
            item.innerHTML = `
                <div class="dash-top5cp-item__rank">${i + 1}</div>
                <div class="dash-top5cp-item__info">
                    <div class="dash-top5cp-item__header">
                        <span class="dash-top5cp-item__name">${cliente.nombre}</span>
                        <span class="dash-top5cp-item__stats">${cliente.count} procs · ${cliente.porcentaje}%</span>
                    </div>
                    <div class="dash-top5cp-item__bar">
                        <div class="dash-top5cp-item__bar-fill" style="width:${pct}%;background:${colors[i]}"></div>
                    </div>
                </div>`;
            container.appendChild(item);
        });
        this.bindClientesProcesosModal();
    },

    bindClientesProcesosModal() {
        const btn = document.getElementById('verTodosClientesProcesos');
        if (btn) {
            btn.onclick = (e) => {
                e.preventDefault();
                this.showAllClientesProcesosModal();
            };
        }
    },

    showAllClientesProcesosModal() {
        const container = document.getElementById('modalAllClientesProcesosContent');
        const modal = document.getElementById('modalAllClientesProcesos');
        if (!container || !modal) return;

        const allClientes = this.stats.allClientesProcesos || [];
        if (allClientes.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af;">Sin datos disponibles</div>';
        } else {
            const colors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#10B981', '#06B6D4', '#EF4444', '#84CC16', '#14B8A6', '#F97316'];
            let html = '<table style="width:100%;border-collapse:collapse;font-size:0.85rem;">';
            html += '<thead><tr style="border-bottom:2px solid #e5e7eb;text-align:left;"><th style="padding:8px 12px;">#</th><th style="padding:8px 12px;">Cliente</th><th style="padding:8px 12px;text-align:right;">Procesos</th><th style="padding:8px 12px;text-align:right;">%</th></tr></thead><tbody>';
            allClientes.forEach((cliente, i) => {
                const color = colors[i % colors.length];
                html += `<tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:8px 12px;color:#6b7280;">${i + 1}</td><td style="padding:8px 12px;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:8px;"></span>${cliente.nombre}</td><td style="padding:8px 12px;text-align:right;font-weight:600;">${cliente.count}</td><td style="padding:8px 12px;text-align:right;">${cliente.porcentaje}%</td></tr>`;
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        }

        modal.style.display = 'block';
    },

    // ── Modal: Todos los Clientes por Unidades ──
    bindClientesUnidadesModal() {
        const btn = document.getElementById('verTodosClientesUnidades');
        if (btn) {
            btn.onclick = (e) => {
                e.preventDefault();
                this.showAllClientesUnidadesModal();
            };
        }
    },

    showAllClientesUnidadesModal() {
        const container = document.getElementById('modalAllClientesUnidadesContent');
        const modal = document.getElementById('modalAllClientesUnidades');
        if (!container || !modal) return;

        const allClientes = this.stats.allClientesUnidades || [];
        if (allClientes.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af;">Sin datos disponibles</div>';
        } else {
            const colors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#10B981', '#06B6D4', '#EF4444', '#84CC16', '#14B8A6', '#F97316'];
            let html = '<table style="width:100%;border-collapse:collapse;font-size:0.85rem;">';
            html += '<thead><tr style="border-bottom:2px solid #e5e7eb;text-align:left;"><th style="padding:8px 12px;">#</th><th style="padding:8px 12px;">Cliente</th><th style="padding:8px 12px;text-align:right;">Unidades</th><th style="padding:8px 12px;text-align:right;">%</th></tr></thead><tbody>';
            allClientes.forEach((cliente, i) => {
                const color = colors[i % colors.length];
                html += `<tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:8px 12px;color:#6b7280;">${i + 1}</td><td style="padding:8px 12px;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:8px;"></span>${cliente.nombre}</td><td style="padding:8px 12px;text-align:right;font-weight:600;">${cliente.unidades}</td><td style="padding:8px 12px;text-align:right;">${cliente.porcentaje}%</td></tr>`;
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        }

        modal.style.display = 'block';
    },

    // ── Actividad Reciente ──
    renderActividadReciente() {
        const container = document.getElementById('activityList');
        if (!container) return;
        const actividad = (this.stats.actividadReciente || []).slice(0, 5);
        const icons = {
            'recepcion': { emoji: '\ud83d\udce6', color: 'blue' },
            'lavado': { emoji: '\ud83e\uddf9', color: 'purple' },
            'en-proceso-de-ensayo': { emoji: '\u2699\ufe0f', color: 'orange' },
            'entrega-cliente': { emoji: '\ud83d\ude9a', color: 'teal' },
            'informe-de-ensayo': { emoji: '\ud83d\udcc4', color: 'green' },
            'finalizado': { emoji: '\u2705', color: 'green' }
        };
        const defaultIcon = { emoji: '\ud83d\udccb', color: 'blue' };
        container.innerHTML = '';
        actividad.forEach(item => {
            const icon = icons[item.estado] || defaultIcon;
            const cliente = (item.cliente || '').trim();
            const aNombreDe = (item.informe_a_nombre_de || '').trim();
            const proc = (item.numero_proceso || '').trim();
            const inf = (item.informe || '').trim();
            let identificador = inf && inf !== '-' ? inf : (proc && proc !== '-' ? proc : '');
            let detail = '';
            if (identificador) { detail = identificador; if (cliente) detail += ` - ${cliente}`; if (aNombreDe && aNombreDe !== cliente) detail += ` (a nombre de: ${aNombreDe})`; }
            else if (cliente) { detail = cliente; if (aNombreDe && aNombreDe !== cliente) detail += ` (a nombre de: ${aNombreDe})`; }
            else { detail = aNombreDe || 'Sin cliente'; }

            const div = document.createElement('div');
            div.className = 'dash-activity-item';
            div.innerHTML = `<div class="dash-activity-item__icon dash-activity-item__icon--${icon.color}">${icon.emoji}</div><div class="dash-activity-item__content"><span class="dash-activity-item__text">${this.capitalizeFirst(item.estado || 'Nuevo proceso')}</span><span class="dash-activity-item__detail">${detail}</span></div><span class="dash-activity-item__time">${item.fecha ? new Date(item.fecha + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</span>`;
            container.appendChild(div);
        });
    },

    // ── Indicadores del Laboratorio ──
    renderIndicadores() {
        const container = document.getElementById('indicadoresGrid');
        if (!container) return;
        const s = this.stats;

        container.innerHTML = `
            <div class="dash-indicadores-row">
                <div class="dash-indicador dash-indicador--blue">
                    <div class="dash-indicador__icon-circle dash-indicador__icon-circle--blue">\ud83d\udce6</div>
                    <div class="dash-indicador__content">
                        <div class="dash-indicador__title dash-indicador__title--blue">Elemento m\u00e1s recibido</div>
                        <span class="dash-indicador__value dash-indicador__value--small">${s.elementoMasRecibido?.nombre || '--'}</span>
                        <div class="dash-indicador__sub">${s.elementoMasRecibido ? s.elementoMasRecibido.unidades + ' unidades recibidas' : ''}</div>
                    </div>
                </div>
                <div class="dash-indicador dash-indicador--purple">
                    <div class="dash-indicador__icon-circle dash-indicador__icon-circle--purple">\ud83d\udc65</div>
                    <div class="dash-indicador__content">
                        <div class="dash-indicador__title dash-indicador__title--purple">Cliente con m\u00e1s unidades</div>
                        <span class="dash-indicador__value dash-indicador__value--small">${s.clienteMasUnidades?.nombre || '--'}</span>
                        <div class="dash-indicador__sub">${s.clienteMasUnidades ? s.clienteMasUnidades.unidades + ' unidades recibidas' : ''}</div>
                    </div>
                </div>
                <div class="dash-indicador dash-indicador--indigo">
                    <div class="dash-indicador__icon-circle dash-indicador__icon-circle--indigo">\ud83d\udc64</div>
                    <div class="dash-indicador__content">
                        <div class="dash-indicador__title dash-indicador__title--indigo">Cliente con m\u00e1s recepciones</div>
                        <span class="dash-indicador__value dash-indicador__value--small">${s.clienteMasRecepciones?.nombre || '--'}</span>
                        <div class="dash-indicador__sub">${s.clienteMasRecepciones ? s.clienteMasRecepciones.recepciones + ' recepciones' : ''}</div>
                    </div>
                </div>
            </div>
            <div class="dash-indicadores-row dash-indicadores-row--3">
                <div class="dash-indicador dash-indicador--green">
                    <div class="dash-indicador__icon-circle dash-indicador__icon-circle--green">\ud83d\udcc4</div>
                    <div class="dash-indicador__content">
                        <div class="dash-indicador__title dash-indicador__title--green">Recepci\u00f3n m\u00e1s reciente</div>
                        <span class="dash-indicador__value">${s.recepcionMasReciente || '--'}</span>
                        <div class="dash-indicador__meta">
                            <span class="dash-indicador__meta-icon">\ud83d\udcc5</span> Reciente
                        </div>
                    </div>
                </div>
                <div class="dash-indicador dash-indicador--orange">
                    <div class="dash-indicador__icon-circle dash-indicador__icon-circle--orange">\ud83d\udcca</div>
                    <div class="dash-indicador__content">
                        <div class="dash-indicador__title dash-indicador__title--orange">Promedio</div>
                        <span class="dash-indicador__value">${s.promedioUnidadesPorRecepcion || '0'}</span>
                        <div class="dash-indicador__sub">unidades/recepci\u00f3n</div>
                        <div class="dash-indicador__meta">
                            <span class="dash-indicador__meta-icon">\ud83d\udce6</span> por elementos
                        </div>
                    </div>
                </div>
                <div class="dash-indicador dash-indicador--teal">
                    <div class="dash-indicador__icon-circle dash-indicador__icon-circle--teal">\u23f1\ufe0f</div>
                    <div class="dash-indicador__content">
                        <div class="dash-indicador__title dash-indicador__title--teal">Tiempo promedio</div>
                        <span class="dash-indicador__value">${s.tiempoPromedioEntrega || '0'} <small style="font-size:0.6em;font-weight:400;color:#6b7280;">d\u00edas</small></span>
                        <div class="dash-indicador__meta">
                            <span class="dash-indicador__meta-icon">\u2192</span> Recepci\u00f3n \u2192 Entrega
                        </div>
                    </div>
                </div>
            </div>
            <div class="dash-indicadores-footer">\u24d3 Los indicadores se calculan seg\u00fan el rango de fechas seleccionado.</div>
        `;
    },

    // \u00daltimas Recepciones (Table)
    renderUltimasRecepciones() {
        const container = document.getElementById('recepcionesTable');
        if (!container) return;
        const recepciones = this.stats.ultimasRecepciones || [];

        if (recepciones.length === 0) { container.innerHTML = '<div style="text-align:center;padding:1rem;color:#9ca3af;font-size:0.75rem;">Sin recepciones</div>'; return; }

        const estadoClass = (e) => {
            const map = { 'Recepci\u00f3n': 'recepcion', 'Lavado': 'lavado', 'Ensayo': 'ensayo', 'Informe': 'informe', 'Entrega': 'entrega', 'Finalizado': 'finalizado' };
            return map[e] || 'recepcion';
        };

        container.innerHTML = `<div class="dash-recepciones-table__header"><span>Proceso</span><span>Cliente</span><span>Fecha</span><span>Estado</span><span style="text-align:right">Elementos</span></div>`;
        recepciones.forEach(r => {
            const row = document.createElement('div');
            row.className = 'dash-recepciones-table__row';
            const fecha = r.fecha ? new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-CO') : '--';
            row.innerHTML = `<span>${r.numero_proceso}</span><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.cliente}</span><span>${fecha}</span><span><span class="dash-recepciones-table__badge dash-recepciones-table__badge--${estadoClass(r.estado)}">${r.estado}</span></span><span style="text-align:right;font-weight:500">${r.elementos}</span>`;
            container.appendChild(row);
        });
    },

    // ── Flujo de Procesos ──
    renderFlujoProcesos() {
        const f = this.stats.flujoProcesos || {};
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('flowRecibidos', f.recibidos || 0);
        set('flowInforme', f.informe || 0);
        set('flowEnsayo', f.ensayo || 0);
        set('flowEntrega', f.entrega || 0);
        set('flowFinalizado', f.finalizado || 0);
    },

    // ── Last Update ──
    renderLastUpdate() {
        const el = document.getElementById('dashLastUpdate');
        if (el) {
            const now = new Date();
            el.textContent = `Datos actualizados al ${now.toLocaleDateString('es-CO')} ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
        }
    },

    capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
};

// Inicializar cuando el DOM est\u00e9 listo
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('view-dashboard')) {
        DashboardModule.init();
    }
});
