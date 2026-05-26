import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, ArrowLeftRight, Plus, CalendarDays, Menu } from 'lucide-react';
import { cn } from '../../lib/utils';

const tabs = [
  { path: '/', icon: Home, label: 'Inicio' },
  { path: '/transacoes', icon: ArrowLeftRight, label: 'Transacoes' },
  { path: '/lancamento', icon: Plus, label: 'Lancar', isCenter: true },
  { path: '/calendario', icon: CalendarDays, label: 'Calendario' },
  { path: '/mais', icon: Menu, label: 'Mais' },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col gradient-bg">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 glass-card rounded-none border-t border-border border-x-0 border-b-0 px-2 pt-2 pb-safe z-50">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            const Icon = tab.icon;

            if (tab.isCenter) {
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className="relative -top-4 w-14 h-14 rounded-full gradient-primary flex items-center justify-center shadow-glow"
                >
                  <Icon size={24} className="text-white" />
                </button>
              );
            }

            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg transition-colors',
                  isActive ? 'text-primary' : 'text-text-tertiary hover:text-text-secondary'
                )}
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
