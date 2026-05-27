import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, ArrowLeftRight, Plus, CalendarDays, Menu } from 'lucide-react';

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
    <div className="h-full flex flex-col bg-background">
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-surface-container rounded-t-2xl shadow-elevation-2 px-2 pt-2 pb-safe">
          <div className="flex items-end justify-around max-w-lg mx-auto">
            {tabs.map((tab) => {
              const isActive = location.pathname === tab.path;
              const Icon = tab.icon;

              if (tab.isCenter) {
                return (
                  <button
                    key={tab.path}
                    onClick={() => navigate(tab.path)}
                    className="relative -top-4 w-14 h-14 rounded-2xl bg-primary-container flex items-center justify-center shadow-elevation-3 transition-all duration-300 ease-spring hover:scale-105 active:scale-95"
                  >
                    <Icon size={22} strokeWidth={2.5} className="text-on-primary-container" />
                  </button>
                );
              }

              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className="flex flex-col items-center gap-0.5 py-2 px-2 min-w-[56px]"
                >
                  <div className={
                    'flex items-center justify-center w-14 h-7 rounded-full transition-all duration-300 ease-spring ' +
                    (isActive ? 'bg-primary-container' : '')
                  }>
                    <Icon
                      size={18}
                      strokeWidth={isActive ? 2.5 : 1.5}
                      className={'transition-colors duration-200 ' + (isActive ? 'text-on-primary-container' : 'text-text-tertiary')}
                    />
                  </div>
                  <span className={
                    'text-[10px] font-medium transition-colors duration-200 ' +
                    (isActive ? 'text-text-primary' : 'text-text-tertiary')
                  }>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
