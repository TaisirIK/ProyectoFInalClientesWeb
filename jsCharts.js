
import { fmtCurrency } from '../ProyectoFinalClientes/commit2/jsUtils.js';

export const ChartManager = {
	instances: {},
	destroy(id){ const inst = this.instances[id]; if (inst) { inst.destroy(); delete this.instances[id]; } },
	upsert(id, ctx, config){ this.destroy(id); const chart = new Chart(ctx, config); this.instances[id] = chart; return chart; }
};

export const buildDonutGastosPorCategoria = (labels, data) => ({
	type: 'doughnut', data: { labels, datasets: [{ data, backgroundColor: genColors(data.length), borderWidth: 0 }] },
	options: { plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (c) => `${c.label}: ${fmtCurrency(c.parsed)}` } } } }
});

export const buildLineBalanceRealVsEstimado = (labels, realData, estimadoData) => ({
	type: 'line', data: { labels, datasets: [ { label: 'Balance real', data: realData, borderColor: '#22d3ee', backgroundColor: 'transparent' }, { label: 'Balance estimado', data: estimadoData, borderColor: '#f59e0b', backgroundColor: 'transparent' } ] },
	options: { plugins: { legend: { position: 'bottom' } } }
});

export const buildBarEgresosEstimadosVsReales = (labels, estimado, real) => ({
	type: 'bar', data: { labels, datasets: [ { label: 'Estimado', data: estimado, backgroundColor: '#f59e0b' }, { label: 'Real', data: real, backgroundColor: '#ef4444' } ] },
	options: { plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (c)=> `${c.dataset.label}: ${fmtCurrency(c.parsed.y)}` } } }, scales: { y: { ticks: { callback: (v)=> fmtCurrency(v) } } } }
});

export const buildLineEvolucionBalanceAnual = (labels, balance) => ({
	type: 'line', data: { labels, datasets: [{ label:'Balance', data: balance, borderColor:'#10b981', backgroundColor:'transparent' }] },
	options: { plugins: { legend: { position:'bottom' } }, scales:{ y:{ ticks:{ callback:(v)=> fmtCurrency(v) } } } }
});

export const buildBarDistribucionIngresosVsGastos = (labels, ingresos, gastos) => ({
	type: 'bar', data: { labels, datasets: [ { label:'Ingresos', data: ingresos, backgroundColor:'#10b981' }, { label:'Gastos', data: gastos, backgroundColor:'#ef4444' } ] },
	options: { plugins: { legend:{ position:'bottom' } }, scales:{ y:{ ticks:{ callback:(v)=> fmtCurrency(v) } } } }
});

const genColors = (n) => { const base = ['#22d3ee','#ef4444','#10b981','#f59e0b','#6366f1','#a855f7','#fb7185','#14b8a6']; const out = []; for (let i=0;i<n;i++) out.push(base[i % base.length]); return out; };
