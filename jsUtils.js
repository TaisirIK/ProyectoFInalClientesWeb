export const fmtCurrency = (n) => {
	const value = Number(n ?? 0) || 0;
	const formatted = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

	return `ᚱ ${formatted} runas`;
};

const runeSVG = `<svg class="icon icon-rune" width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#c59d3d"></circle><text x="12" y="16" font-size="12" text-anchor="middle" fill="#000" font-family="Cinzel">ᚱ</text></svg>`;

export const fmtCurrencyHTML = (n) => {
	const value = Number(n ?? 0) || 0;
	const formatted = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
	return `${runeSVG} <span class="currency-value">${formatted} runas</span>`;
};

export const yyyymm = (date) => { const d = new Date(date); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; };

export const parseMonthValue = (val) => { const [y,m] = (val||'').split('-'); return { year: Number(y), month: Number(m) }; };

export const confirmAction = (msg) => window.confirm(msg);
