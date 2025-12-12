import { getState } from './jsState.js';
import { Dashboard } from './jsComponents(Dashboard).js';
import { Categorias } from './jsComponents(categorias).js';
import { Transacciones } from './jsComponents(Transacciones).js';
import { Presupuestos } from './jsComponents(Presupuesto).js';

export const renderRoute = async () => {
	const root = document.getElementById('app-root');
	const { route } = getState();
	root.innerHTML = '';

	if (route === 'dashboard') {
		root.appendChild(await Dashboard());
	} else if (route === 'categorias') {
		root.appendChild(await Categorias());
	} else if (route === 'transacciones') {
		root.appendChild(await Transacciones());
	} else if (route === 'presupuestos') {
		root.appendChild(await Presupuestos());
	}
};
