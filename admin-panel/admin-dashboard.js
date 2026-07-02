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

    async init() {
        await this.loadStats();
    },

    async loadStats() {
        try {
            const res = await fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_dashboard_stats' })
            });
            const data = await res.json();
            if (data.ok) {
                this.stats = data.stats;
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
        this.renderElementosPorCategoria();
        this.renderTop5ClientesUnidades();
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
        top.forEach((el, i) => {
            const row = document.createElement('div');
            row.className = 'dash-top10-table__row';
            row.innerHTML = `<span class="dash-top10-table__rank">${i + 1}</span><span class="dash-top10-table__name" title="${el.nombre}">${el.nombre}</span><span class="dash-top10-table__num">${el.count}</span><span class="dash-top10-table__num">${el.recepciones || 0}</span>`;
            container.appendChild(row);
        });
    },

    // ── Elementos por Categoría (Donut + Legend) ──
    renderElementosPorCategoria() {
        const container = document.getElementById('legendCategorias');
        const canvas = document.getElementById('chartCategorias');
        if (!container || !canvas) return;
        if (this.charts.categorias) this.charts.categorias.destroy();

        const allCats = this.stats.elementosPorCategoria || [];
        if (allCats.length === 0) { container.innerHTML = '<div style="text-align:center;padding:1rem;color:#9ca3af;font-size:0.75rem;">Sin datos</div>'; return; }

        const top10 = allCats.slice(0, 10);
        const colors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#10B981', '#06B6D4', '#EF4444', '#84CC16', '#14B8A6', '#F97316'];

        container.innerHTML = '';
        top10.forEach((cat, i) => {
            const color = colors[i % colors.length];
            const item = document.createElement('div');
            item.className = 'dash-legend-item';
            item.innerHTML = `<span class="dash-legend-item__color" style="background:${color}"></span><span class="dash-legend-item__label">${cat.nombre}</span><span class="dash-legend-item__value">${cat.porcentaje}%</span>`;
            container.appendChild(item);
        });

        this.charts.categorias = new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: { labels: allCats.map(c => c.nombre), datasets: [{ data: allCats.map(c => c.unidades), backgroundColor: colors.slice(0, allCats.length), borderWidth: 2, borderColor: '#fff' }] },
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

        const clientes = (this.stats.topClientesUnidades || []).slice(0, 5);
        if (clientes.length === 0) return;

        this.charts.clientesUnidades = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: clientes.map(c => c.nombre.length > 20 ? c.nombre.substring(0, 20) + '...' : c.nombre),
                datasets: [{ label: 'Unidades', data: clientes.map(c => c.unidades), backgroundColor: '#3b82f6', borderRadius: 4, maxBarThickness: 25 }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    datalabels: { display: true, anchor: 'end', align: 'right', color: '#374151', font: { size: 10, weight: 'bold' }, formatter: v => v }
                },
                scales: { x: { beginAtZero: true } }
            },
            plugins: [ChartDataLabels]
        });
    },

    // ── Actividad Reciente ──
    renderActividadReciente() {
        const container = document.getElementById('activityList');
        if (!container) return;
        const actividad = this.stats.actividadReciente || [];
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
            div.innerHTML = `<div class="dash-activity-item__icon dash-activity-item__icon--${icon.color}">${icon.emoji}</div><div class="dash-activity-item__content"><span class="dash-activity-item__text">${this.capitalizeFirst(item.estado || 'Nuevo proceso')}</span><span class="dash-activity-item__detail">${detail}</span></div><span class="dash-activity-item__time">${this.getTimeAgo(item.fecha)}</span>`;
            container.appendChild(div);
        });
    },

    // ── Indicadores del Laboratorio ──
    renderIndicadores() {
        const container = document.getElementById('indicadoresGrid');
        if (!container) return;
        const s = this.stats;

        const indicadores = [
            { icon: '\ud83d\udce6', value: s.elementoMasRecibido?.nombre || '--', valueClass: 'dash-indicador__value--small', label: 'Elemento m\u00e1s recibido', sub: s.elementoMasRecibido ? `${s.elementoMasRecibido.unidades} unidades` : '' },
            { icon: '\ud83d\udc65', value: s.clienteMasUnidades?.nombre || '--', valueClass: 'dash-indicador__value--small', label: 'Cliente con m\u00e1s unidades', sub: s.clienteMasUnidades ? `${s.clienteMasUnidades.unidades} unidades` : '' },
            { icon: '\ud83d\udce6', value: s.recepcionMasReciente || '--', label: 'Recepci\u00f3n m\u00e1s reciente', sub: '' },
            { icon: '\ud83d\udcca', value: s.promedioUnidadesPorRecepcion || '0', label: 'Promedio unidades/recepci\u00f3n', sub: 'elementos' },
            { icon: '\u23f1\ufe0f', value: s.tiempoPromedioDias || '0', label: 'Tiempo promedio de proceso', sub: 'd\u00edas' }
        ];

        container.innerHTML = '';
        indicadores.forEach(ind => {
            const div = document.createElement('div');
            div.className = 'dash-indicador';
            div.innerHTML = `<div class="dash-indicador__icon">${ind.icon}</div><span class="dash-indicador__value ${ind.valueClass || ''}">${ind.value}</span><span class="dash-indicador__label">${ind.label}</span>${ind.sub ? `<span class="dash-indicador__label">${ind.sub}</span>` : ''}`;
            container.appendChild(div);
        });
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
            const fecha = r.fecha ? new Date(r.fecha).toLocaleDateString('es-CO') : '--';
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
