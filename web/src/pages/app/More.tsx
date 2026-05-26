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
} from 'lucide-react';

const menuItems = [
  { icon: CreditCard, label: 'Cartoes', path: '/cartoes' },
  { icon: Repeat, label: 'Assinaturas', path: '/assinaturas' },
  { icon: TrendingUp, label: 'Investimentos', path: '/investimentos' },
  { icon: Target, label: 'Metas', path: '/metas' },
  { icon: PieChart, label: 'Relatorios', path: '/relatorios' },
  { icon: Users, label: 'Gestao Familiar', path: '/familia' },
  { icon: Settings, label: 'Configuracoes', path: '/configuracoes' },
];

export default function More() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="p-4">
      <h1 className="text-lg font-bold text-text-primary mb-4">Menu</h1>
      <div className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="glass-card w-full p-4 flex items-center gap-3 hover:bg-surface-hover transition-colors"
            >
              <Icon size={20} className="text-primary" />
              <span className="text-text-primary text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={handleLogout}
          className="glass-card w-full p-4 flex items-center gap-3 hover:bg-surface-hover transition-colors"
        >
          <LogOut size={20} className="text-danger" />
          <span className="text-danger text-sm font-medium">Sair</span>
        </button>
      </div>
    </div>
  );
}
