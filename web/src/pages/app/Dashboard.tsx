import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export default function Dashboard() {
  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between mb-2">
        <div>
          <p className="text-text-secondary text-sm">Ola,</p>
          <h1 className="text-lg font-bold text-text-primary">Bem-vindo ao Cofrin</h1>
        </div>
        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
          <Wallet size={18} className="text-white" />
        </div>
      </header>

      <div className="glass-card-lg p-5">
        <p className="text-text-secondary text-xs uppercase tracking-wide mb-1">Saldo total</p>
        <p className="text-2xl font-bold text-text-primary">{formatCurrency(0)}</p>
        <div className="mt-2 flex items-center gap-1">
          <TrendingUp size={14} className="text-text-tertiary" />
          <p className="text-text-tertiary text-xs">Projetado: {formatCurrency(0)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp size={16} className="text-success" />
            </div>
            <span className="text-text-secondary text-xs">Receitas</span>
          </div>
          <p className="text-success font-semibold">{formatCurrency(0)}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center">
              <TrendingDown size={16} className="text-danger" />
            </div>
            <span className="text-text-secondary text-xs">Despesas</span>
          </div>
          <p className="text-danger font-semibold">{formatCurrency(0)}</p>
        </div>
      </div>

      <div className="glass-card p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Proximos vencimentos</h2>
        <p className="text-text-tertiary text-sm">Nenhum vencimento proximo.</p>
      </div>
    </div>
  );
}
