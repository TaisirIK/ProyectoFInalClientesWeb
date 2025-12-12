import { DB } from './jsDB.js';
import { getState, appEvents } from './jsState.js';
import { fmtCurrencyHTML, yyyymm, parseMonthValue } from './jsUtils.js';

export const Transacciones = async () => {
	const state = getState();
	const el = document.createElement('div');
	el.className = 'panel';

	const cats = await DB.listCategorias();

	el.innerHTML = `
		<h2>Transacciones</h2>
		<div class="form-row">
			<select id="filterTipo">
				<option value="">Todos</option>
				<option value="Ingreso">Ingreso</option>
				<option value="Egreso">Egreso</option>
			</select>
			<select id="filterCat"><option value="">Todas las categorías</option>${cats.map(c=>`<option value="${c.id}">${c.nombre}</option>`).join('')}</select>
			<input id="filterSearch" placeholder="Buscar descripción o categoría" />
		</div>
		<div class="form-row">
			<input id="desc" placeholder="Descripción" />
			<input id="monto" type="number" placeholder="Monto" />
			<select id="cat">${cats.map(c=>`<option value="${c.id}">${c.nombre}</option>`).join('')}</select>
			<input id="fecha" type="date" value="${new Date().toISOString().slice(0,10)}" />
			<select id="tipo"><option value="Ingreso">Ingreso</option><option value="Egreso">Egreso</option></select>
			<button id="add">Agregar</button>
		</div>
		<table class="table"><thead><tr><th>Fecha</th><th>Tipo</th><th>Desc</th><th>Cat</th><th>Monto</th><th>Acciones</th></tr></thead>
		<tbody></tbody></table>
	`;

	const tbody = el.querySelector('tbody');

	const renderList = async () => {
		tbody.innerHTML = '';
		const tipo = el.querySelector('#filterTipo').value || undefined;
		const categoriaId = el.querySelector('#filterCat').value || undefined;
		const search = el.querySelector('#filterSearch').value || undefined;
		const txs = await DB.listTransacciones({ tipo, categoriaId, search, yyyymm: state.selectedMonth });
		for (const t of txs) {
			const d = new Date(t.fecha);
			tbody.insertAdjacentHTML('beforeend', `<tr data-id="${t.id}"><td>${d.toLocaleDateString()}</td><td>${t.tipo}</td><td>${t.descripcion||''}</td><td>${t.categoriaNombre||''}</td><td>${fmtCurrencyHTML(t.monto)}</td><td><button class="edit" data-id="${t.id}">Editar</button> <button class="del" data-id="${t.id}">Eliminar</button></td></tr>`);
		}
	};

	// initial list
	await renderList();

	// Add / Edit flow
	let editingId = null;
	el.querySelector('#add').addEventListener('click', async ()=>{
		const descripcion = el.querySelector('#desc').value.trim();
		const monto = Number(el.querySelector('#monto').value);
		const categoriaId = el.querySelector('#cat').value;
		const fecha = el.querySelector('#fecha').value;
		const tipo = el.querySelector('#tipo').value;
		if(!tipo || !monto || !categoriaId) return alert('Tipo, monto y categoría son obligatorios');
		const cat = cats.find(c=>c.id===categoriaId);
		if (editingId) {
			await DB.updateTransaccion(editingId, { tipo, monto, fecha: new Date(fecha).toISOString(), categoriaId, categoriaNombre: cat?cat.nombre:'', descripcion });
			// check budget for edited transaction
			const y2 = new Date(fecha).getFullYear();
			const m2 = String(new Date(fecha).getMonth()+1).padStart(2,'0');
			const yyyymm2 = `${y2}-${m2}`;
			const presupuestos2 = await DB.listPresupuestos({ yyyymm: yyyymm2 });
			const pCat2 = presupuestos2.find(p => p.categoriaId === categoriaId);
			if (pCat2) {
				const txsMes2 = await DB.listTransacciones({ yyyymm: yyyymm2, tipo: 'Egreso', categoriaId });
				const real2 = txsMes2.reduce((acc,t) => acc + t.monto, 0);
				if (real2 > pCat2.monto) alert(`Presupuesto superado en ${pCat2.categoriaNombre}: ${real2} > ${pCat2.monto}`);
			}
			editingId = null;
			el.querySelector('#add').textContent = 'Agregar';
		} else {
			const created = await DB.createTransaccion({ tipo, monto, fecha: new Date(fecha).toISOString(), categoriaId, categoriaNombre: cat?cat.nombre:'', descripcion });
			// after creating, check budgets and notify if exceeded
			const y = new Date(fecha).getFullYear();
			const m = String(new Date(fecha).getMonth()+1).padStart(2,'0');
			const yyyymm = `${y}-${m}`;
			const presupuestos = await DB.listPresupuestos({ yyyymm });
			const pCat = presupuestos.find(p => p.categoriaId === categoriaId);
			if (pCat) {
				const txsMes = await DB.listTransacciones({ yyyymm, tipo: 'Egreso', categoriaId });
				const real = txsMes.reduce((acc,t) => acc + t.monto, 0);
				if (real > pCat.monto) alert(`Presupuesto superado en ${pCat.categoriaNombre}: ${real} > ${pCat.monto}`);
			}
		}
		el.querySelector('#desc').value = '';
		el.querySelector('#monto').value = '';
		await renderList();
		appEvents.dispatchEvent(new CustomEvent('data-changed'));
	});

	// Filters
	el.querySelector('#filterTipo').addEventListener('change', renderList);
	el.querySelector('#filterCat').addEventListener('change', renderList);
	el.querySelector('#filterSearch').addEventListener('input', () => { setTimeout(renderList, 250); });

	el.addEventListener('click', async (e)=>{
		if (e.target.classList.contains('del')) {
			const id = e.target.getAttribute('data-id');
			if(!confirm('Eliminar transacción?')) return;
			await DB.deleteTransaccion(id);
			await renderList();
			appEvents.dispatchEvent(new CustomEvent('data-changed'));
		}
		if (e.target.classList.contains('edit')) {
			const id = e.target.getAttribute('data-id');
			const all = await DB.listTransacciones();
			const it = all.find(x => x.id === id);
			if (!it) return;
			editingId = id;
			el.querySelector('#desc').value = it.descripcion || '';
			el.querySelector('#monto').value = it.monto;
			el.querySelector('#cat').value = it.categoriaId;
			el.querySelector('#fecha').value = new Date(it.fecha).toISOString().slice(0,10);
			el.querySelector('#tipo').value = it.tipo;
			el.querySelector('#add').textContent = 'Guardar cambios';
		}
	});

	return el;
};
