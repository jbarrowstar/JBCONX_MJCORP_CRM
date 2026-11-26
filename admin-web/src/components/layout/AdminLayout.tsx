import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { navItemFor } from './navigation';
import { PreviewBanner } from '../common/PreviewBanner';
import { ToastHost } from '../common/ToastHost';

export const AdminLayout: React.FC = () => {
  const { pathname } = useLocation();
  const item = navItemFor(pathname);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {item && !item.live && <PreviewBanner phase={item.phase} />}
          <Outlet />
        </main>
      </div>
      <ToastHost />
    </div>
  );
};
