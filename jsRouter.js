import { setRoute } from './jsState.js';
import { renderRoute } from './jsApp.js';

export const initRouter = () => {
	document.querySelectorAll('[data-route]').forEach(btn => {
		btn.addEventListener('click', () => {
			setRoute(btn.dataset.route);
			renderRoute();
		});
	});
};
