import React from 'react';
import { NavLink } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { setMobileNavOpen, toggleSidebar } from '../../redux/slices/uiSlice';
import { JBConXLogo } from '@shared/components/JBConXLogo';
import { ROLE_LABELS } from '@shared/auth/roles';
import { NAV_GROUPS, NAV_ITEMS } from './navigation';

const initials = (name?: string) =>
  (name ?? '?').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

/**
 * Admin navigation.
 * Desktop: expanded (w-64) or compact icon rail (w-[72px]); the collapse toggle lives inside the sidebar header.
 * Below lg: an off-canvas drawer opened from the header menu button.
 */
export const AdminSidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { sidebarOpen, mobileNavOpen } = useAppSelector((state) => state.ui);
  const { user } = useAppSelector((state) => state.auth);
  const items = NAV_ITEMS.filter((item) => !!user && item.roles.includes(user.role));
  const closeMobile = () => dispatch(setMobileNavOpen(false));

  const content = (compact: boolean, mobile: boolean) => (
    <div className="flex flex-col h-full min-h-0">
      {/* Brand + collapse control */}
      <div className={`h-16 flex items-center flex-shrink-0 border-b border-slate-100 ${compact ? 'justify-center px-2' : 'justify-between pl-5 pr-3'}`}>
        {compact ? (
          <button
            type="button"
            onClick={() => dispatch(toggleSidebar())}
            title="Toggle Navigation"
            aria-label="Expand navigation"
            className="group relative w-10 h-10 rounded-lg flex items-center justify-center hover:bg-slate-100"
          >
            <JBConXLogo size="sm" showText={false} className="group-hover:opacity-0 transition-opacity" />
            <PanelLeftOpen className="w-[18px] h-[18px] text-slate-600 absolute opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ) : (
          <>
            <JBConXLogo size="md" variant="dark" tagline="Enterprise Admin" />
            {mobile ? (
              <button type="button" onClick={closeMobile} aria-label="Close navigation" className="icon-btn w-8 h-8">
                <X className="w-[18px] h-[18px]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => dispatch(toggleSidebar())}
                title="Toggle Navigation"
                aria-label="Collapse navigation"
                className="icon-btn w-8 h-8"
              >
                <PanelLeftClose className="w-[18px] h-[18px]" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden scroll-thin py-4 ${compact ? 'px-2.5' : 'px-3'}`} aria-label="Main navigation">
        {NAV_GROUPS.filter((g) => items.some((i) => i.group === g)).map((group, gi) => {
          const groupItems = items.filter((i) => i.group === group);
          return (
            <div key={group} className="mb-5 last:mb-0">
              {compact ? (
                gi > 0 && <div className="mx-auto mb-3 h-px w-6 bg-slate-200" aria-hidden />
              ) : (
                <p className="px-3 mb-1.5 text-2xs font-semibold uppercase tracking-[0.08em] text-slate-400">{group}</p>
              )}
              <ul className="space-y-0.5">
                {groupItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        onClick={mobile ? closeMobile : undefined}
                        title={compact ? item.name : undefined}
                        className={({ isActive }) =>
                          `group relative flex items-center gap-3 rounded-lg text-[13px] font-medium transition-colors ${
                            compact ? 'justify-center h-10 w-10 mx-auto' : 'h-9 px-3'
                          } ${
                            isActive
                              ? 'bg-brand-50 text-brand-700'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && !compact && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-brand-600" aria-hidden />}
                            <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                            {!compact && <span className="flex-1 truncate">{item.name}</span>}
                            {!compact && !item.live && (
                              <span title="Preview: sample data, not connected yet" className="text-[9px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-px">
                                Preview
                              </span>
                            )}
                            {compact && !item.live && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" aria-hidden />}
                          </>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Signed-in user */}
      <div className={`flex-shrink-0 border-t border-slate-100 ${compact ? 'p-3 flex justify-center' : 'p-3'}`}>
        <div className={`flex items-center gap-3 rounded-lg ${compact ? '' : 'px-2 py-1.5'}`} title={compact ? `${user?.name ?? ''} · ${user ? ROLE_LABELS[user.role] : ''}` : undefined}>
          <span className="avatar w-9 h-9 text-xs">{initials(user?.name)}</span>
          {!compact && (
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-slate-900 truncate">{user?.name}</p>
              <p className="text-2xs text-slate-500 truncate">{user ? ROLE_LABELS[user.role] : ''} · {user?.email}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className={`hidden lg:flex flex-col flex-shrink-0 bg-white border-r border-slate-200/80 transition-[width] duration-200 ease-out ${
          sidebarOpen ? 'w-64' : 'w-[72px]'
        }`}
      >
        {content(!sidebarOpen, false)}
      </aside>

      {/* Mobile / tablet drawer */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-950/40 animate-fade-in" onClick={closeMobile} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-overlay animate-slide-in-left">{content(false, true)}</aside>
        </div>
      )}
    </>
  );
};
