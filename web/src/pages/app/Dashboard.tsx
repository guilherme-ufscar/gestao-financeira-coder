import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Wallet, Building2, CreditCard } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { useAuthStore } from '../../lib/store/auth';
import api from '../../lib/api/client';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [monthSummary, setMonthSummary] = useState({ income: 0, expenses: 0 });
  const [upcoming, setUpcoming] = useState<any[]>([]);

  useEffect(() => {
    api.get('/accounts').then((r) => setAccounts(r.data));

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    api.get('/transactions?startDate=' + startOfMonth + '&endDate=' + endOfMonth + '&limit=200').then((r) => {
      const txs = r.data;
      const income = txs.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amountInCents, 0);
      const expenses = txs.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amountInCents, 0);
      setMonthSummary({ income, expenses });
    });

    const tomorrow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    api.get('/transactions?status=pending&startDate=' + now.toISOString() + '&endDate=' + tomorrow + '&limit=5').then((r) => {
      setUpcoming(r.data);
    });
  }, []);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balanceInCents, 0);
  const projectedBalance = totalBalance - monthSummary.expenses + monthSummary.income;

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between mb-2">
        <div>
          <p className="text-text-secondary text-sm">Ola,</p>
          <h1 className="text-lg font-bold text-text-primary">{user?.name || 'Bem-vindo'}</h1>
        </div>
        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
          <Wallet size={18} className="text-white" />
        </div>
      </header>

      <div className="glass-card-lg p-5">
        <p className="text-text-secondary text-xs uppercase tracking-wide mb-1">Saldo total</p>
        <p className="text-2xl font-bold text-text-primary">{formatCurrency(totalBalance)}</p>
        <div className="mt-2 flex items-center gap-1">
          <TrendingUp size={14} className="text-text-tertiary" />
          <p className="text-text-tertiary text-xs">Projetado: {formatCurrency(projectedBalance)}</p>
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
          <p className="text-success font-semibold">{formatCurrency(monthSummary.income)}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center">
              <TrendingDown size={16} className="text-danger" />
            </div>
            <span className="text-text-secondary text-xs">Despesas</span>
          </div>
          <p className="text-danger font-semibold">{formatCurrency(monthSummary.expenses)}</p>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-primary">Contas</h2>
          <button onClick={() => navigate('/contas')} className="text-xs text-primary">Ver todas</button>
        </div>
        {accounts.length === 0 ? (
          <p className="text-text-tertiary text-sm">Nenhuma conta cadastrada.</p>
        ) : (
          <div className="space-y-2">
            {accounts.slice(0, 3).map((a: any) => (
              <div key={a.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: a.color + '20' }}>
                  <Building2 size={14} style={{ color: a.color }} />
                </div>
                <span className="text-sm text-text-primary flex-1">{a.name}</span>
                <span className="text-sm font-medium text-text-primary">{formatCurrency(a.balanceInCents)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-primary">Proximos vencimentos</h2>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-text-tertiary text-sm">Nenhum vencimento proximo.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((tx: any) => (
              <div key={tx.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                  <CreditCard size={14} className="text-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{tx.description}</p>
                  <p className="text-[10px] text-text-tertiary">{new Date(tx.date).toLocaleDateString('pt-BR')}</p>
                </div>
                <span className="text-sm font-medium text-danger">{formatCurrency(tx.amountInCents)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}