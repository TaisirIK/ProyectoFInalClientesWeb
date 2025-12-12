import { db } from './jsDB.js';
import { yyyymm } from '../ProyectoFinalClientes/commit2/jsUtils.js';

const state = { route: 'dashboard', selectedMonth: yyyymm(new Date()) };

export const initState = () => state;
export const getState = () => state;
export const setRoute = (route) => { state.route = route; };
export const setSelectedMonth = (monthStr) => { state.selectedMonth = monthStr; };

export const preloadDefaults = async () => {
	const tx = db.transaction('categorias', 'readonly');
	const store = tx.objectStore('categorias');
	const all = await store.getAll();
	if (all.length === 0) {
		const defaults = ['Alimentación','Transporte','Ocio','Servicios','Salud','Educación','Otros'];
		const wtx = db.transaction('categorias', 'readwrite');
		const wstore = wtx.objectStore('categorias');
		for (const name of defaults) { await wstore.add({ id: crypto.randomUUID(), nombre: name, createdAt: Date.now() }); }
		await wtx.done;
	}
	await tx.done;
};
