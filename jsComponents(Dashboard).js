import { DB } from './jsDB.js';
import { getState } from './jsState.js';
import { fmtCurrencyHTML as fmtCurrency } from '../ProyectoFinalClientes/commit2/jsUtils.js';
import { ChartManager, buildDonutGastosPorCategoria, buildLineBalanceRealVsEstimado, buildBarEgresosEstimadosVsReales, buildLineEvolucionBalanceAnual, buildBarDistribucionIngresosVsGastos } from './jsCharts.js';

export const Dashboard = async () => {
	const { selectedMonth } = getState();
	const wrap = document.createElement('section'); wrap.className = 'panel';
	const title = document.createElement('h2'); title.textContent = 'Dashboard'; wrap.appendChild(title);

	const resumenPanel = document.createElement('div'); resumenPanel.className = 'panel grid-3';
	const ingresosBox = document.createElement('div'); ingresosBox.className = 'panel';
	const gastosBox = document.createElement('div'); gastosBox.className = 'panel';
	const balanceBox = document.createElement('div'); balanceBox.className = 'panel';

	const txsMes = await DB.listTransacciones({ yyyymm: selectedMonth });
	const ingresos = txsMes.filter(t => t.tipo === 'Ingreso').reduce((a,b)=>a+b.monto,0);
	const gastos = txsMes.filter(t => t.tipo === 'Egreso').reduce((a,b)=>a+b.monto,0);
	const balance = ingresos - gastos;

	ingresosBox.innerHTML = `<h3>Ingresos</h3><p class="badge ok">${fmtCurrency(ingresos)}</p>`;
	gastosBox.innerHTML = `<h3>Gastos</h3><p class="badge danger">${fmtCurrency(gastos)}</p>`;
	balanceBox.innerHTML = `<h3>Balance</h3><p class="badge ${balance>=0?'ok':'danger'}">${fmtCurrency(balance)}</p>`;

	resumenPanel.appendChild(ingresosBox); resumenPanel.appendChild(gastosBox); resumenPanel.appendChild(balanceBox);

	const recientesPanel = document.createElement('div'); recientesPanel.className = 'panel';
	const recent = [...txsMes].sort((a,b)=>b.fecha-a.fecha).slice(0,5);
	const recentTable = document.createElement('table'); recentTable.className = 'table';
	recentTable.innerHTML = `
		<thead>
			<tr><th>Tipo</th><th>Monto</th><th>Fecha</th><th>Categoría</th><th>Descripción</th></tr>
		</thead>
		<tbody>
			${recent.map(t=>{ const d = new Date(t.fecha); return `<tr>
					<td><span class="badge ${t.tipo==='Ingreso'?'ok':'danger'}">${t.tipo}</span></td>
					<td>${fmtCurrency(t.monto)}</td>
					<td>${d.toLocaleDateString('es-ES')}</td>
					<td>${t.categoriaNombre}</td>
					<td>${t.descripcion||''}</td>
				</tr>`; }).join('')}
		</tbody>
	`;
	recientesPanel.appendChild(recentTable);

	const presupuestoPanel = document.createElement('div'); presupuestoPanel.className = 'panel';
	const cats = await DB.listCategorias();
	const presupuestos = await DB.listPresupuestos({ yyyymm: selectedMonth });
	const listaPres = document.createElement('table'); listaPres.className = 'table';
	listaPres.innerHTML = `
		<thead><tr><th>Categoría</th><th>Presupuesto</th><th>Gasto real</th><th>Estado</th></tr></thead>
		<tbody></tbody>
	`;
	const tbodyPres = listaPres.querySelector('tbody');
	for (const c of cats) {
		const pCat = presupuestos.find(p => p.categoriaId === c.id);
		const estimado = pCat?.monto ?? 0;
		const real = txsMes.filter(t => t.tipo==='Egreso' && t.categoriaId===c.id).reduce((a,b)=>a+b.monto,0);
		const estado = real > estimado ? 'Superado' : (real/Math.max(estimado,1) > 0.8 ? 'Al límite' : 'OK');
		const badgeClass = real > estimado ? 'danger' : (real/Math.max(estimado,1) > 0.8 ? 'warn' : 'ok');
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td>${c.nombre}</td>
			<td>${fmtCurrency(estimado)}</td>
			<td>${fmtCurrency(real)}</td>
			<td><span class="badge ${badgeClass}">${estado}</span></td>
		`;
		tbodyPres.appendChild(tr);
	}
	presupuestoPanel.appendChild(listaPres);

	const chartsPanel = document.createElement('div'); chartsPanel.className = 'panel grid-2';

	const chartsCfgs = [
		{ id:'gasto-categoria', title:'Gastos por categoría (mes)', build: async () => { const egresosMes = txsMes.filter(t => t.tipo==='Egreso'); const byCat = {}; egresosMes.forEach(e => { byCat[e.categoriaNombre] = (byCat[e.categoriaNombre]||0)+e.monto; }); const labels = Object.keys(byCat); const data = Object.values(byCat); return buildDonutGastosPorCategoria(labels, data); } },
		{ id:'balance-real-vs-estimado', title:'Balance real vs estimado (mensual)', build: async () => { const estimado = ingresos - presupuestos.reduce((a,b)=>a+b.monto,0); return buildLineBalanceRealVsEstimado([selectedMonth], [balance], [estimado]); } },
		{ id:'egresos-estimados-vs-reales', title:'Egresos estimados vs reales (comparativo)', build: async () => { const labels = cats.map(c=>c.nombre); const estimado = cats.map(c => presupuestos.find(p => p.categoriaId===c.id)?.monto ?? 0); const real = cats.map(c => txsMes.filter(t => t.tipo==='Egreso' && t.categoriaId===c.id).reduce((a,b)=>a+b.monto,0)); return buildBarEgresosEstimadosVsReales(labels, estimado, real); } },
		{ id:'evolucion-balance-anual', title:'Evolución del balance (anual)', build: async () => { const now = new Date(selectedMonth+'-01'); const year = now.getFullYear(); const labels = Array.from({length:12}, (_,i)=> `${year}-${String(i+1).padStart(2,'0')}`); const balances = []; for (const m of labels) { const txs = await DB.listTransacciones({ yyyymm: m }); const ing = txs.filter(t=>t.tipo==='Ingreso').reduce((a,b)=>a+b.monto,0); const eg = txs.filter(t=>t.tipo==='Egreso').reduce((a,b)=>a+b.monto,0); balances.push(ing - eg); } return buildLineEvolucionBalanceAnual(labels, balances); } }
	];

	for (const cfg of chartsCfgs) {
		const p = document.createElement('div'); p.className = 'panel'; const h = document.createElement('h3'); h.textContent = cfg.title; const cwrap = document.createElement('div'); cwrap.className = 'chart-wrap'; const canvas = document.createElement('canvas'); canvas.id = cfg.id; cwrap.appendChild(canvas); p.appendChild(h); p.appendChild(cwrap); chartsPanel.appendChild(p);
		const ctx = canvas.getContext('2d'); const chartConfig = await cfg.build(); ChartManager.upsert(cfg.id, ctx, chartConfig);
	}

	const extraPanel = document.createElement('div'); extraPanel.className = 'panel'; const h5 = document.createElement('h3'); h5.textContent = 'Distribución de ingresos vs gastos (mes)'; const cwrap5 = document.createElement('div'); cwrap5.className = 'chart-wrap'; const canvas5 = document.createElement('canvas'); canvas5.id = 'distribucion-ing-vs-gto'; cwrap5.appendChild(canvas5); extraPanel.appendChild(h5); extraPanel.appendChild(cwrap5);
	const ctx5 = canvas5.getContext('2d'); const cfg5 = await buildBarDistribucionIngresosVsGastos(['Mes actual'], [ingresos], [gastos]); ChartManager.upsert('distribucion-ing-vs-gto', ctx5, cfg5);

	wrap.appendChild(resumenPanel); wrap.appendChild(recientesPanel); wrap.appendChild(presupuestoPanel); wrap.appendChild(chartsPanel); wrap.appendChild(extraPanel);
	return wrap;
};
