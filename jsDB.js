import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@8/+esm';

export let db;

export const initDB = async () => {
	db = await openDB('finanzas-db', 1, {
		upgrade(db) {
			const cat = db.createObjectStore('categorias', { keyPath: 'id' });
			cat.createIndex('nombre', 'nombre', { unique: false });

			const txs = db.createObjectStore('transacciones', { keyPath: 'id' });
			txs.createIndex('tipo', 'tipo');
			txs.createIndex('categoriaId', 'categoriaId');
			txs.createIndex('yyyymm', 'yyyymm');

			const p = db.createObjectStore('presupuestos', { keyPath: 'id' });
			p.createIndex('categoriaId_month', ['categoriaId','yyyymm'], { unique: true });
			p.createIndex('yyyymm', 'yyyymm');
		}
	});
};

export const DB = {
	async listCategorias() { return await db.getAll('categorias'); },
	async createCategoria(nombre) { const item = { id: crypto.randomUUID(), nombre, createdAt: Date.now() }; await db.add('categorias', item); return item; },
	async deleteCategoria(id) {
		const tAll = await db.getAllFromIndex('transacciones', 'categoriaId', id);
		const tx = db.transaction(['categorias','transacciones'], 'readwrite');
		const txStore = tx.objectStore('transacciones');
		for (const t of tAll) await txStore.delete(t.id);
		await tx.objectStore('categorias').delete(id);
		await tx.done;
	},
	async updateCategoria(id, nombre) { const item = await db.get('categorias', id); if (!item) return null; const updated = { ...item, nombre, updatedAt: Date.now() }; await db.put('categorias', updated); return updated; },
	async listTransacciones({ tipo, categoriaId, yyyymm, search } = {}) {
		const all = await db.getAll('transacciones');
		return all.filter(t => {
			const okTipo = tipo ? t.tipo === tipo : true;
			const okCat = categoriaId ? t.categoriaId === categoriaId : true;
			const okMonth = yyyymm ? t.yyyymm === yyyymm : true;
			const s = (search||'').toLowerCase();
			const okSearch = s ? (t.descripcion||'').toLowerCase().includes(s) || (t.categoriaNombre||'').toLowerCase().includes(s) : true;
			return okTipo && okCat && okMonth && okSearch;
		}).sort((a,b) => b.fecha - a.fecha);
	},
	async createTransaccion({ tipo, monto, fecha, categoriaId, categoriaNombre, descripcion }) {
		const item = { id: crypto.randomUUID(), tipo, monto: Number(monto), fecha: new Date(fecha).getTime(), yyyymm: `${new Date(fecha).getFullYear()}-${String(new Date(fecha).getMonth()+1).padStart(2,'0')}`, categoriaId, categoriaNombre, descripcion: descripcion || '' };
		await db.add('transacciones', item); return item;
	},
	async updateTransaccion(id, patch) { const item = await db.get('transacciones', id); if (!item) return null; const merged = { ...item, ...patch }; if (patch.fecha) { const d = new Date(patch.fecha); merged.fecha = d.getTime(); merged.yyyymm = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; } await db.put('transacciones', merged); return merged; },
	async deleteTransaccion(id) { await db.delete('transacciones', id); },
	async upsertPresupuesto({ categoriaId, categoriaNombre, yyyymm, monto }) {
		const all = await db.getAll('presupuestos');
		const found = all.find(p => p.categoriaId === categoriaId && p.yyyymm === yyyymm);
		if (found) { const updated = { ...found, monto: Number(monto), updatedAt: Date.now() }; await db.put('presupuestos', updated); return updated; }
		const item = { id: crypto.randomUUID(), categoriaId, categoriaNombre, yyyymm, monto: Number(monto), createdAt: Date.now() };
		await db.add('presupuestos', item); return item;
	},
	async listPresupuestos({ yyyymm } = {}) { const all = await db.getAll('presupuestos'); return yyyymm ? all.filter(p => p.yyyymm === yyyymm) : all; }
};
