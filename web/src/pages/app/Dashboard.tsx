import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Building2, CreditCard, PieChart, Target, Repeat, ChevronRight, Eye, EyeOff, CalendarClock, Wallet, ArrowRightLeft, Plus } from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../lib/utils';
import { useAuthStore } from '../../lib/store/auth';
import api from '../../lib/api/client';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [monthSummary, setMonthSummary] = useState({ income: 0, expenses: 0 });
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [categorySpending, setCategorySpending] = useState<any[]>([]);
  const [showBalance, setShowBalance] = useState(true);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  useEffect(() => {
    api.get('/accounts').then((r) => setAccounts(r.data));
    api.get('/cards').then((r) => setCards(r.data));
    api.get('/subscriptions').then((r) => setSubscriptions(r.data));

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    api.get('/transactions?startDate=' + startOfMonth + '&endDate=' + endOfMonth + '&limit=500').then((r) => {
      const txs = r.data;
      const income = txs.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amountInCents, 0);
      const expenses = txs.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amountInCents, 0);
      setMonthSummary({ income, expenses });

      const catMap: Record<string, { name: string; color: string; total: number }> = {};
      txs.filter((t: any) => t.type === 'expense').forEach((t: any) => {
        const catName = t.category?.name || 'Outros';
        const catColor = t.category?.color || '#636E72';
        if (!catMap[catName]) catMap[catName] = { name: catName, color: catColor, total: 0 };
        catMap[catName].total += t.amountInCents;
      });
      const sorted = Object.values(catMap).sort((a, b) => b.total - a.total).slice(0, 5);
      setCategorySpending(sorted);
    });

    const tomorrow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    api.get('/transactions?status=pending&startDate=' + now.toISOString() + '&endDate=' + tomorrow + '&limit=5').then((r) => {
      setUpcoming(r.data);
    });
  }, []);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balanceInCents, 0);
  const balance = monthSummary.income - monthSummary.expenses;
  const totalSubsMonthly = subscriptions.filter(s => s.active).reduce((sum, s) => {
    if (s.cycle === 'yearly') return sum + Math.round(s.amountInCents / 12);
    if (s.cycle === 'weekly') return sum + s.amountInCents * 4;
    return sum + s.amountInCents;
  }, 0);

  return (
    <div className="p-4 space-y-6 pb-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-text-tertiary text-xs">Ola,</p>
          <h1 className="text-lg font-bold text-text-primary">{user?.name || 'Bem-vindo'}</h1>
        </div>
        <button
          onClick={() => navigate('/configuracoes')}
          className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-glow"
        >
          <span className="text-white text-sm font-bold">
            {(user?.name || 'U')[0].toUpperCase()}
          </span>
        </button>
      </header>

      <section>
        <div className="glass-card-gradient card-glow p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-text-secondary text-xs uppercase tracking-wider">Saldo total</p>
            <button onClick={() => setShowBalance(!showBalance)} className="text-text-tertiary">
              {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
          <p className="text-3xl font-bold text-text-primary tracking-tight">
            {showBalance ? formatCurrency(totalBalance) : 'R$ ••••••'}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="bg-success/10 rounded-xl p-2.5 text-center">
              <TrendingUp size={14} className="text-success mx-auto mb-1" />
              <p className="text-[10px] text-text-tertiary">Receitas</p>
              <p className="text-xs font-bold text-success">{showBalance ? formatCurrency(monthSummary.income) : '••••'}</p>
            </div>
            <div className="bg-danger/10 rounded-xl p-2.5 text-center">
              <TrendingDown size={14} className="text-danger mx-auto mb-1" />
              <p className="text-[10px] text-text-tertiary">Despesas</p>
              <p className="text-xs font-bold text-danger">{showBalance ? formatCurrency(monthSummary.expenses) : '••••'}</p>
            </div>
            <div className="bg-primary/10 rounded-xl p-2.5 text-center">
              <Wallet size={14} className="text-primary mx-auto mb-1" />
              <p className="text-[10px] text-text-tertiary">Balanco</p>
              <p className={'text-xs font-bold ' + (balance >= 0 ? 'text-success' : 'text-danger')}>
                {showBalance ? formatCurrency(balance) : '••••'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="section-header">
          <h2 className="section-title">Minhas contas</h2>
          <button onClick={() => navigate('/contas')} className="section-link flex items-center gap-0.5">
            Ver todas <ChevronRight size={12} />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {accounts.map((a: any) => (
            <button key={a.id} onClick={() => navigate('/contas')} className="glass-card p-4 min-w-[170px] flex-shrink-0 text-left hover:bg-surface-hover transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: a.color + '20' }}>
                  <Building2 size={15} style={{ color: a.color }} />
                </div>
                <span className="text-xs text-text-secondary truncate flex-1">{a.name}</span>
              </div>
              <p className="text-sm font-bold text-text-primary">{showBalance ? formatCurrency(a.balanceInCents) : '••••'}</p>
              {a.yieldsEnabled && (
                <div className="flex items-center gap-1 mt-1.5">
                  <TrendingUp size={10} className="text-accent" />
                  <p className="text-[10px] text-accent">Rende {a.yieldRatePercent}%</p>
                </div>
              )}
            </button>
          ))}
          <button onClick={() => navigate('/contas')} className="glass-card p-4 min-w-[100px] flex-shrink-0 flex flex-col items-center justify-center gap-2 hover:bg-surface-hover transition-colors">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Plus size={16} className="text-primary" />
            </div>
            <span className="text-[10px] text-text-tertiary">Adicionar</span>
          </button>
        </div>
      </section>

      <section>
        <div className="section-header">
          <h2 className="section-title">Cartoes</h2>
          <button onClick={() => navigate('/cartoes')} className="section-link flex items-center gap-0.5">
            Ver todos <ChevronRight size={12} />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {cards.map((card: any) => {
            const used = (card.invoices || []).filter((i: any) => i.status !== 'paid').reduce((s: number, i: any) => s + i.totalInCents, 0);
            const available = card.limitInCents - used;
            const usedPercent = card.limitInCents > 0 ? (used / card.limitInCents) * 100 : 0;
            return (
              <button key={card.id} onClick={() => navigate('/cartoes')} className="min-w-[200px] flex-shrink-0 rounded-2xl p-4 text-left" style={{ background: 'linear-gradient(135deg, ' + (card.color || '#6D5FFD') + '30, ' + (card.color || '#6D5FFD') + '10)', border: '1px solid ' + (card.color || '#6D5FFD') + '30' }}>
                <div className="flex items-center justify-between mb-3">
                  <CreditCard size={18} style={{ color: card.color || '#6D5FFD' }} />
                  <span className="text-[10px] text-text-tertiary uppercase">{card.brand}</span>
                </div>
                <p className="text-xs text-text-secondary mb-0.5">{card.name}</p>
                <p className="text-sm font-bold text-text-primary mb-2">•••• {card.lastFourDigits}</p>
                <div className="w-full h-1.5 rounded-full bg-black/10 mb-1.5">
                  <div className="h-full rounded-full transition-all" style={{ width: Math.min(usedPercent, 100) + '%', backgroundColor: usedPercent > 80 ? 'var(--color-danger)' : (card.color || '#6D5FFD') }} />
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-text-tertiary">Disponivel</span>
                  <span className="text-[10px] font-medium text-text-primary">{showBalance ? formatCurrency(available) : '••••'}</span>
                </div>
              </button>
            );
          })}
          {cards.length === 0 && (
            <button onClick={() => navigate('/cartoes')} className="glass-card p-4 min-w-[170px] flex-shrink-0 flex flex-col items-center justify-center gap-2">
              <CreditCard size={20} className="text-text-tertiary" />
              <span className="text-xs text-text-tertiary">Adicionar cartao</span>
            </button>
          )}
        </div>
      </section>

      <section>
        <div className="section-header">
          <h2 className="section-title">Gastos por categoria</h2>
          <button onClick={() => navigate('/relatorios')} className="section-link flex items-center gap-0.5">
            <PieChart size={12} /> Detalhes
          </button>
        </div>
        {categorySpending.length > 0 ? (
          <div className="glass-card p-4">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie data={categorySpending} dataKey="total" cx="50%" cy="50%" innerRadius={25} outerRadius={42} strokeWidth={0}>
                      {categorySpending.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                    </Pie>
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {categorySpending.map((cat) => {
                  const total = categorySpending.reduce((s, c) => s + c.total, 0);
                  const percent = total > 0 ? (cat.total / total) * 100 : 0;
                  return (
                    <div key={cat.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-[11px] text-text-secondary flex-1 truncate">{cat.name}</span>
                      <span className="text-[11px] font-medium text-text-primary">{percent.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card p-6 text-center">
            <PieChart size={24} className="mx-auto mb-2 text-text-tertiary opacity-50" />
            <p className="text-xs text-text-tertiary">Sem gastos este mes</p>
          </div>
        )}
      </section>

      <section>
        <div className="section-header">
          <div className="flex items-center gap-2">
            <CalendarClock size={14} className="text-warning" />
            <h2 className="section-title">Proximos vencimentos</h2>
          </div>
          <button onClick={() => navigate('/calendario')} className="section-link flex items-center gap-0.5">
            Calendario <ChevronRight size={12} />
          </button>
        </div>
        {upcoming.length === 0 ? (
          <div className="glass-card p-5 text-center">
            <CalendarClock size={22} className="mx-auto mb-2 text-text-tertiary opacity-50" />
            <p className="text-xs text-text-tertiary">Nenhum vencimento nos proximos 7 dias</p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {upcoming.map((tx: any) => (
              <div key={tx.id} className="glass-card p-4 min-w-[180px] flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                    <p className="text-[10px] text-warning font-bold">{new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit' })}</p>
                  </div>
                  <span className="text-[10px] text-text-tertiary">{new Date(tx.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                </div>
                <p className="text-sm text-text-primary font-medium truncate mb-1">{tx.description}</p>
                <p className="text-sm font-bold text-danger">{formatCurrency(tx.amountInCents)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="section-header">
          <h2 className="section-title">Acesso rapido</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate('/assinaturas')} className="glass-card p-4 text-left hover:bg-surface-hover transition-colors">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center mb-2">
              <Repeat size={16} className="text-accent" />
            </div>
            <p className="text-xs text-text-secondary mb-0.5">Assinaturas</p>
            <p className="text-sm font-bold text-text-primary">{showBalance ? formatCurrency(totalSubsMonthly) : '••••'}</p>
            <p className="text-[10px] text-text-tertiary">{subscriptions.filter(s => s.active).length} ativas/mes</p>
          </button>
          <button onClick={() => navigate('/investimentos')} className="glass-card p-4 text-left hover:bg-surface-hover transition-colors">
            <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center mb-2">
              <TrendingUp size={16} className="text-success" />
            </div>
            <p className="text-xs text-text-secondary mb-0.5">Investimentos</p>
            <p className="text-sm font-bold text-text-primary">Ver carteira</p>
            <p className="text-[10px] text-text-tertiary">Patrimonio investido</p>
          </button>
          <button onClick={() => navigate('/metas')} className="glass-card p-4 text-left hover:bg-surface-hover transition-colors">
            <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center mb-2">
              <Target size={16} className="text-warning" />
            </div>
            <p className="text-xs text-text-secondary mb-0.5">Metas</p>
            <p className="text-sm font-bold text-text-primary">Orcamento</p>
            <p className="text-[10px] text-text-tertiary">Planejamento mensal</p>
          </button>
          <button onClick={() => navigate('/familia')} className="glass-card p-4 text-left hover:bg-surface-hover transition-colors">
            <div className="w-9 h-9 rounded-xl bg-danger/10 flex items-center justify-center mb-2">
              <ArrowRightLeft size={16} className="text-danger" />
            </div>
            <p className="text-xs text-text-secondary mb-0.5">Familia</p>
            <p className="text-sm font-bold text-text-primary">Gestao</p>
            <p className="text-[10px] text-text-tertiary">Financas compartilhadas</p>
          </button>
        </div>
      </section>
    </div>
  );
}