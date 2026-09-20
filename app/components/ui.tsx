// Zajednički stilovi: jedna primarna boja za akcije, crvena samo za brisanje,
// a zelena/žuta/crvena su rezervisane za statuse i nivoe rizika.

export const btn = {
    primary: 'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50',
    secondary: 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50',
    danger: 'inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50',
    icon: 'inline-flex items-center justify-center rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700',
    iconDanger: 'inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600',
};

export const card = 'rounded-xl border border-slate-200 bg-white shadow-sm';

export const input = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

export const pageContainer = 'mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8';

const STATUSI: Record<string, { latinica: string; cirilica: string; boja: string }> = {
    u_toku: { latinica: 'U toku', cirilica: 'У току', boja: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
    zavrsena: { latinica: 'Završena', cirilica: 'Завршена', boja: 'bg-green-50 text-green-700 ring-green-600/20' },
    na_cekanju: { latinica: 'Na čekanju', cirilica: 'На чекању', boja: 'bg-slate-100 text-slate-700 ring-slate-500/20' },
    otkazana: { latinica: 'Otkazana', cirilica: 'Отказана', boja: 'bg-slate-100 text-slate-500 ring-slate-500/20' },
};

export function StatusBadge({ status, cirilica = false }: { status: string; cirilica?: boolean }) {
    const s = STATUSI[status] ?? STATUSI.na_cekanju;
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${s.boja}`}>
            {cirilica ? s.cirilica : s.latinica}
        </span>
    );
}

export function ProgressBar({ percent, className = '' }: { percent: number; className?: string }) {
    const p = Math.max(0, Math.min(100, percent));
    return (
        <div className={`h-1.5 w-full overflow-hidden rounded-full bg-slate-200 ${className}`}>
            <div
                className={`h-full rounded-full transition-all duration-300 ${p === 100 ? 'bg-green-500' : 'bg-blue-600'}`}
                style={{ width: `${p}%` }}
            />
        </div>
    );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
    return (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
                {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
    );
}

export function Spinner({ label }: { label?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            {label && <p className="mt-3 text-sm">{label}</p>}
        </div>
    );
}
