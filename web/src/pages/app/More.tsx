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
      { icon: Building2, label: 'Contas', path: '/contas', color: '#4F7DFF' },
      { icon: CreditCard, label: 'Cartoes', path: '/cartoes', color: '#6D5FFD' },
      { icon: Repeat, label: 'Assinaturas', path: '/assinaturas', color: '#3DD9D6' },
      { icon: TrendingUp, label: 'Investimentos', path: '/investimentos', color: '#2FD180' },
      { icon: Tag, label: 'Categorias', path: '/categorias', color: '#FF8C42' },
    ],
  },
  {
    title: 'Planejamento',
    items: [
      { icon: Target, label: 'Orcamento e Metas', path: '/metas', color: '#FFB454' },
      { icon: PieChart, label: 'Relatorios', path: '/relatorios', color: '#A78BFA' },
    ],
  },
  {
    title: 'Social',
    items: [
      { icon: Users, label: 'Gestao Familiar', path: '/familia', color: '#FF5C7A' },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { icon: Settings, label: 'Configuracoes', path: '/configuracoes', color: '#9AA3C4' },
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
    <div className="p-4 space-y-5">
      <button
        onClick={() => navigate('/configuracoes')}
        className="glass-card-gradient w-full p-4 flex items-center gap-3 text-left"
      >
        <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
          <span className="text-white text-lg font-bold">{(user?.name || 'U')[0].toUpperCase()}</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-text-primary">{user?.name}</p>
          <p className="text-xs text-text-secondary">{user?.email}</p>
        </div>
        <ChevronRight size={16} className="text-text-tertiary" />
      </button>

      {menuSections.map((section) => (
        <div key={section.title} className="space-y-1.5">
          <h2 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider px-1">{section.title}</h2>
          <div className="glass-card overflow-hidden">
            {section.items.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={'w-full p-3.5 flex items-center gap-3 hover:bg-surface-hover transition-colors ' +
                    (idx > 0 ? 'border-t border-border' : '')}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: item.color + '15' }}
                  >
                    <Icon size={16} style={{ color: item.color }} />
                  </div>
                  <span className="text-sm text-text-primary font-medium flex-1 text-left">{item.label}</span>
                  <ChevronRight size={14} className="text-text-tertiary" />
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <button
        onClick={handleLogout}
        className="glass-card w-full p-3.5 flex items-center gap-3 hover:bg-danger/5 hover:border-danger/20 transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-danger/10 flex items-center justify-center">
          <LogOut size={16} className="text-danger" />
        </div>
        <span className="text-sm font-medium text-danger">Sair da conta</span>
      </button>
    </div>
  );
}
