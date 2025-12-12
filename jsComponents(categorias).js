import { DB } from './jsDB.js';
import { confirmAction } from './jsUtils.js';
import { appEvents } from './jsState.js';

export const Categorias = async () => {
	const wrap = document.createElement('section'); wrap.className = 'panel';
	const title = document.createElement('h2'); title.textContent = 'Gestión de categorías'; wrap.appendChild(title);
	const form = document.createElement('div'); form.className = 'form-row';
	const input = document.createElement('input'); input.placeholder = 'Nombre de la categoría';
	const addBtn = document.createElement('button'); addBtn.className = 'btn primary'; addBtn.textContent = 'Crear categoría'; form.appendChild(input); form.appendChild(addBtn); wrap.appendChild(form);
	const listPanel = document.createElement('div'); listPanel.className = 'panel'; const table = document.createElement('table'); table.className = 'table'; table.innerHTML = `<thead><tr><th>Nombre</th><th>Acciones</th></tr></thead><tbody></tbody>`; listPanel.appendChild(table); wrap.appendChild(listPanel);

	let editingId = null;
	const refresh = async () => {
		const tbody = table.querySelector('tbody'); tbody.innerHTML = ''; const cats = await DB.listCategorias();
		cats.forEach(c => { const tr = document.createElement('tr'); tr.innerHTML = `<td>${c.nombre}</td><td><button class="btn" data-edit="${c.id}">Editar</button> <button class="btn danger" data-del="${c.id}">Eliminar</button></td>`; tbody.appendChild(tr); });
		tbody.querySelectorAll('[data-del]').forEach(btn => { btn.addEventListener('click', async () => { const id = btn.dataset.del; const ok = confirmAction('¿Eliminar la categoría y todas sus transacciones asociadas?'); if (!ok) return; await DB.deleteCategoria(id); if (editingId === id) { editingId = null; input.value = ''; addBtn.textContent = 'Crear categoría'; } refresh(); appEvents.dispatchEvent(new CustomEvent('data-changed')); }); });
		tbody.querySelectorAll('[data-edit]').forEach(btn => { btn.addEventListener('click', async () => { const id = btn.dataset.edit; const all = await DB.listCategorias(); const it = all.find(x => x.id === id); if (!it) return; editingId = id; input.value = it.nombre; addBtn.textContent = 'Guardar cambios'; }); });
	};

	addBtn.addEventListener('click', async () => { const nombre = input.value.trim(); if (!nombre) return; if (editingId) { await DB.updateCategoria(editingId, nombre); editingId = null; addBtn.textContent = 'Crear categoría'; } else { await DB.createCategoria(nombre); } input.value = ''; await refresh(); appEvents.dispatchEvent(new CustomEvent('data-changed')); });

	await refresh(); return wrap;
};
