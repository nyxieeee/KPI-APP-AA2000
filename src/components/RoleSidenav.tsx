import React from 'react';
import { createPortal } from 'react-dom';
import { LogOut, Menu } from 'lucide-react';
import { APP_NAV_SIDENAV_HEIGHT, APP_NAV_SIDENAV_TOP } from '../constants/navbarLayout';
import { useAuthActions } from '../contexts/AuthActionsContext';
import { useRoleSidenavRail } from '../contexts/RoleSidenavRailContext';

export type RoleSidenavItem<T extends string> = {
  id: T;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  badge?: number | null;
};

interface Props<T extends string> {
  /** Used in pill + aria label. Example: "Supervisor" */
  roleLabel: string;
  /** Used for the page title in the brand block. Example: "Portal" */
  brandTitle?: string;
  items: Array<RoleSidenavItem<T>>;
  activeId: T;
  onSelect: (id: T) => void;
  /** Shows a Sign out button in the footer when rail is open */
  showSignOut?: boolean;
}

export function RoleSidenav<T extends string>({
  roleLabel,
  brandTitle = 'Portal',
  items,
  activeId,
  onSelect,
  showSignOut = true,
}: Props<T>) {
  void brandTitle;
  const { logout } = useAuthActions();
  const { railOpen, toggleRail } = useRoleSidenavRail();

  return createPortal(
    <aside
      className={`fixed left-0 ${APP_NAV_SIDENAV_TOP} z-[1100] ${APP_NAV_SIDENAV_HEIGHT} overflow-hidden border-r border-slate-200 bg-white text-slate-900 shadow-sm transition-[width] duration-200 ease-out ${
        railOpen ? 'w-[272px]' : 'w-[76px]'
      }`}
      aria-label={`${roleLabel} sidenav`}
    >
      <div className="flex h-full min-h-0 flex-col">
        {/* Hamburger: parehong laki ng icon box (h-10 w-10); gitna lang sa makitid na rail, kaliwa kung bukas */}
        <div
          className={`shrink-0 pt-4 pb-2 ${railOpen ? 'px-4' : 'flex justify-center px-2'}`}
        >
          <button
            type="button"
            onClick={toggleRail}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            aria-expanded={railOpen}
            aria-label={railOpen ? 'Isara ang menu' : 'Buksan ang menu'}
          >
            <Menu className="h-5 w-5" strokeWidth={2.5} aria-hidden />
          </button>
        </div>

        {railOpen && (
          <>
            <nav
              className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-3 pb-2"
              aria-label={`${roleLabel} navigation`}
            >
              {items.map((item) => {
                const Icon = item.icon;
                const active = activeId === item.id;
                const badge = item.badge ?? null;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className={`group relative flex w-full min-w-0 items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-400/40 ${
                      active
                        ? 'border-blue-200 bg-blue-50 text-blue-900 shadow-sm'
                        : 'border-transparent text-slate-600 hover:border-slate-100 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                        active
                          ? 'border-blue-300 bg-blue-100'
                          : 'border-slate-200 bg-white group-hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`h-[18px] w-[18px] ${active ? 'text-blue-600' : 'text-slate-600 group-hover:text-slate-700'}`} aria-hidden />
                    </span>

                    <span className="min-w-0 flex-1 pt-0.5">
                      <span className={`block text-xs font-semibold leading-tight ${active ? 'text-blue-900' : 'text-slate-700'}`}>
                        {item.label}
                      </span>
                      {item.description && (
                        <span className={`mt-0.5 block text-[10px] font-normal leading-snug ${active ? 'text-blue-700' : 'text-slate-400'}`}>
                          {item.description}
                        </span>
                      )}
                    </span>

                    {badge != null && badge > 0 && (
                      <span
                        className={`ml-1 shrink-0 self-center rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                          active ? 'bg-blue-200 text-blue-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {showSignOut && (
              <div className="shrink-0 border-t border-slate-100 px-3 pb-4 pt-3">
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                  Sign out
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </aside>,
    document.body
  );
}
