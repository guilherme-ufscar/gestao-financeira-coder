import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/store/auth';
import {
  CreditCard,
  Repeat,
  TrendingUp,
  Target,
  PieChart,
  Users,
  Settings,
  LogOut,
  Building2,
  ChevronRight,
  Tag,
} from 'lucide-react';

const menuSections = [
  {
    title: 'Financas',
    items: [
      { icon: Building2, label: 'Contas', path: '/contas', color: '#7DD3FC' },
      { icon: CreditCard, label: 'Cartoes', path: '/cartoes', color: '#B794F6' },
      { icon: Repeat, label: 'Assinaturas', path: '/assinaturas', color: '#7DD3FC' },
      { icon: TrendingUp, label: 'Investimentos', path: '/investimentos', color: '#6EE7B7' },
      { icon: Tag, label: 'Categorias', path: '/categorias', color: '#F9A8D4' },
    ],
  },
  {
    title: 'Planejamento',
    items: [
      { icon: Target, label: 'Orcamento e Metas', path: '/metas', color: '#FDE68A' },
      { icon: PieChart, label: 'Relatorios', path: '/relatorios', color: '#B794F6' },
    ],
  },
  {
    title: 'Social',
    items: [
      { icon: Users, label: 'Gestao Familiar', path: '/familia', color: '#F9A8D4' },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { icon: Settings, label: 'Configuracoes', path: '/configuracoes', color: '#C9BFD6' },
    ],
  },
];

export default function More() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="p-5 space-y-6">
      <button
        onClick={() => navigate('/configuracoes')}
        className="m3-card-hero w-full p-5 flex items-center gap-4 text-left"
      >
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-elevation-2">
          <span className="text-on-primary text-xl font-bold">{(user?.name || 'U')[0].toUpperCase()}</span>
        </div>
        <div className="flex-1">
          <p className="text-title font-bold text-on-primary-container">{user?.name}</p>
          <p className="text-label text-on-primary-container/70">{user?.email}</p>
        </div>
        <ChevronRight size={18} className="text-on-primary-container/50" />
      </button>

      {menuSections.map((section) => (
        <div key={section.title} className="space-y-2">
          <h2 className="text-caption font-semibold text-text-tertiary uppercase tracking-wider px-1">{section.title}</h2>
          <div className="m3-card-elevated overflow-hidden">
            {section.items.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={'w-full p-4 flex items-center gap-3.5 hover:bg-surface-high transition-all duration-200 ' +
                    (idx > 0 ? 'border-t border-outline-variant' : '')}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: item.color + '18' }}
                  >
                    <Icon size={18} style={{ color: item.color }} />
                  </div>
                  <span className="text-body text-text-primary font-medium flex-1 text-left">{item.label}</span>
                  <ChevronRight size={16} className="text-text-tertiary" />
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <button
        onClick={handleLogout}
        className="m3-card-outlined w-full p-4 flex items-center gap-3.5 hover:bg-danger/5 hover:border-danger/30 transition-all duration-200"
      >
        <div className="w-10 h-10 rounded-xl bg-danger/12 flex items-center justify-center">
          <LogOut size={18} className="text-danger" />
        </div>
        <span className="text-body font-medium text-danger">Sair da conta</span>
      </button>
    </div>
  );
}
