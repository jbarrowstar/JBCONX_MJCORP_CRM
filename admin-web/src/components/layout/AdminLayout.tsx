import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { navItemFor } from './navigation';
import { PreviewBanner } from '../common/PreviewBanner';
import { ToastHost } from '../common/ToastHost';
import { useAppDispatch } from '../../redux/hooks';
import { setMobileNavOpen } from '../../redux/slices/uiSlice';

export const AdminLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();
  const item = navItemFor(pathname);

  // Close the small-screen navigation drawer whenever the route changes.
  useEffect(() => {
    dispatch(setMobileNavOpen(false));
  }, [pathname, dispatch]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-canvas">
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AdminHeader />
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scroll-thin px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
          {item && !item.live && <PreviewBanner phase={item.phase} />}
          <Outlet />
        </main>
      </div>
      <ToastHost />
    </div>
  );
};
