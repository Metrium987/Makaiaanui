import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppStore } from '../../store/appStore';
import { cn } from '../../lib/utils';

export function AppLayout() {
  const { isSidebarOpen } = useAppStore();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <Sidebar />
      <Header />
      <main className={cn(
        "flex-1 transition-all duration-300 pt-16",
        isSidebarOpen ? "ml-64" : "ml-16"
      )}>
        <div className="p-8 max-w-[1400px] mx-auto flex flex-col gap-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
