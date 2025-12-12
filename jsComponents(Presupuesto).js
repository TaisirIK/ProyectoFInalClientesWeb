import { DB } from './jsDB.js';
import { getState, appEvents } from './jsState.js';
import { fmtCurrencyHTML as fmtCurrency } from './jsUtils.js';

export const Presupuestos = async () => {
	const { selectedMonth } = getState();
	const wrap = document.createElement('section'); wrap.className = 'panel';
	const title = document.createElement('h2'); title.textContent = `Presupuestos del mes (${selectedMonth})`; wrap.appendChild(title);
	const cats = await DB.listCategorias();
	const panelForm = document.createElement('div'); panelForm.className = 'panel grid-3';
	const forms = [];
	for (const c of cats) {
		const card = document.createElement('div'); card.className = 'panel'; const h = document.createElement('h3'); h.textContent = c.nombre; card.appendChild(h);
		const row = document.createElement('div'); row.className = 'form-row'; const inp = document.createElement('input'); inp.type = 'number'; inp.min = '0'; inp.placeholder = 'Monto estimado'; const btn = document.createElement('button'); btn.className = 'btn primary'; btn.textContent = 'Guardar'; row.appendChild(inp); row.appendChild(btn); card.appendChild(row);
		btn.addEventListener('click', async () => { const monto = Number(inp.value); if (monto < 0) return; await DB.upsertPresupuesto({ categoriaId: c.id, categoriaNombre: c.nombre, yyyymm: selectedMonth, monto }); await refreshResumen(); appEvents.dispatchEvent(new CustomEvent('data-changed')); });
		panelForm.appendChild(card); forms.push({ categoria: c, input: inp });
	}
	const resumenPanel = document.createElement('div'); resumenPanel.className = 'panel'; const resumenTable = document.createElement('table'); resumenTable.className = 'table'; resumenTable.innerHTML = `<thead><tr><th>Categoría</th><th>Presupuesto</th><th>Gasto real</th><th>Desviación</th><th>Estado</th></tr></thead><tbody></tbody>`; resumenPanel.appendChild(resumenTable);
	const refreshResumen = async () => { const tbody = resumenTable.querySelector('tbody'); tbody.innerHTML = ''; const presupuestos = await DB.listPresupuestos({ yyyymm: selectedMonth }); const txsMes = await DB.listTransacciones({ yyyymm: selectedMonth, tipo: 'Egreso' }); for (const c of cats) { const pCat = presupuestos.find(p => p.categoriaId === c.id); const estimado = pCat?.monto ?? 0; const real = txsMes.filter(t => t.categoriaId === c.id).reduce((acc, t) => acc + t.monto, 0); const desviacion = estimado - real; const estado = real > estimado ? 'Superado' : (real === 0 && estimado === 0 ? 'Sin datos' : 'Dentro'); const tr = document.createElement('tr'); tr.innerHTML = `<td>${c.nombre}</td><td>${fmtCurrency(estimado)}</td><td>${fmtCurrency(real)}</td><td>${fmtCurrency(desviacion)}</td><td><span class="badge ${real > estimado ? 'danger' : (real/Math.max(1,estimado) > 0.8 ? 'warn' : 'ok')}">${estado}</span></td>`; tbody.appendChild(tr); } };
	wrap.appendChild(panelForm); wrap.appendChild(resumenPanel); await refreshResumen(); return wrap;
};
