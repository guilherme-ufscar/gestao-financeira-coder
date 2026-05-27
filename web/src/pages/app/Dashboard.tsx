import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Building2, CreditCard, PieChart, ChevronRight, Eye, EyeOff, CalendarClock, Wallet, Users, Repeat } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'personal' | 'family'>('personal');
  const [circles, setCircles] = useState<any[]>([]);
  const [familySummary, setFamilySummary] = useState<any>(null);

  useEffect(() => {
    api.get('/family/circles').then((r) => setCircles(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (viewMode === 'family' && circles.length > 0) {
      api.get('/family/circles/' + circles[0].id + '/summary').then((r) => setFamilySummary(r.data));
    }
  }, [viewMode, circles]);

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
      setCategorySpending(Object.values(catMap).sort((a, b) => b.total - a.total).slice(0, 5));
    });

    const tomorrow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    api.get('/transactions?status=pending&startDate=' + now.toISOString() + '&endDate=' + tomorrow + '&limit=5').then((r) => {
      setUpcoming(r.data);
    });
  }, []);

  const totalBalance = viewMode === 'family' && familySummary
    ? familySummary.totalBalance || 0
    : accounts.reduce((sum, a) => sum + a.balanceInCents, 0);
  const balance = viewMode === 'family' && familySummary
    ? (familySummary.monthIncome || 0) - (familySummary.monthExpenses || 0)
    : monthSummary.income - monthSummary.expenses;
  const displayIncome = viewMode === 'family' && familySummary ? familySummary.monthIncome || 0 : monthSummary.income;
  const displayExpenses = viewMode === 'family' && familySummary ? familySummary.monthExpenses || 0 : monthSummary.expenses;
  const totalSubsMonthly = subscriptions.filter(s => s.active).reduce((sum, s) => {
    if (s.cycle === 'yearly') return sum + Math.round(s.amountInCents / 12);
    if (s.cycle === 'weekly') return sum + s.amountInCents * 4;
    return sum + s.amountInCents;
  }, 0);

  return (
    <div className="p-5 space-y-6 pb-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-label text-text-tertiary">Ola,</p>
          <h1 className="text-headline text-text-primary">{user?.name || 'Bem-vindo'}</h1>
        </div>
        <div className="flex items-center gap-3">
          {circles.length > 0 && (
            <button
              onClick={() => setViewMode(viewMode === 'personal' ? 'family' : 'personal')}
              className={'m3-icon-container-sm transition-all duration-300 ease-spring ' +
                (viewMode === 'family' ? 'bg-primary-container' : 'bg-surface-container-high')}
            >
              <Users size={18} className={viewMode === 'family' ? 'text-on-primary-container' : 'text-text-tertiary'} />
            </button>
          )}
          <button
            onClick={() => navigate('/configuracoes')}
            className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-elevation-2 transition-transform duration-200 ease-spring hover:scale-105 active:scale-95"
          >
            <span className="text-on-primary text-sm font-bold">
              {(user?.name || 'U')[0].toUpperCase()}
            </span>
          </button>
        </div>
      </header>

      {viewMode === 'family' && circles.length > 0 && (
        <div className="m3-card-filled p-3.5 flex items-center gap-2.5 animate-fade-in-up">
          <Users size={14} className="text-primary" />
          <span className="text-label text-text-secondary">Visualizando: <span className="font-semibold text-primary">{circles[0].name}</span></span>
        </div>
      )}

      {/* Saldo Hero */}
      <section className="m3-card-hero p-7 animate-fade-in-up">
        <div className="flex items-center justify-between mb-3">
          <p className="text-label font-semibold text-on-primary-container/70 uppercase tracking-wider">Saldo total</p>
          <button onClick={() => setShowBalance(!showBalance)} className="text-on-primary-container/60 hover:text-on-primary-container transition-colors">
            {showBalance ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        </div>
        <p className="text-display text-on-primary-container tracking-tight">
          {showBalance ? formatCurrency(totalBalance) : 'R$ ------'}
        </p>
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="bg-success/15 rounded-2xl p-3.5 text-center">
            <TrendingUp size={18} className="text-success mx-auto mb-1.5" />
            <p className="text-caption text-on-primary-container/60">Receitas</p>
            <p className="text-label font-bold text-success">{showBalance ? formatCurrency(displayIncome) : '----'}</p>
          </div>
          <div className="bg-danger/15 rounded-2xl p-3.5 text-center">
            <TrendingDown size={18} className="text-danger mx-auto mb-1.5" />
            <p className="text-caption text-on-primary-container/60">Despesas</p>
            <p className="text-label font-bold text-danger">{showBalance ? formatCurrency(displayExpenses) : '----'}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3.5 text-center">
            <Wallet size={18} className="text-on-primary-container mx-auto mb-1.5" />
            <p className="text-caption text-on-primary-container/60">Balanco</p>
            <p className={'text-label font-bold ' + (balance >= 0 ? 'text-success' : 'text-danger')}>
              {showBalance ? formatCurrency(balance) : '----'}
            </p>
          </div>
        </div>
      </section>

      {/* Contas */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-title text-text-primary">Minhas contas</h2>
          <button onClick={() => navigate('/contas')} className="m3-btn-text text-label flex items-center gap-0.5">
            Ver todas <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
          {accounts.map((a: any) => (
            <button key={a.id} onClick={() => navigate('/contas')} className="m3-card-elevated p-4 min-w-[180px] flex-shrink-0 text-left">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="m3-icon-container-sm" style={{ backgroundColor: a.color + '20' }}>
                  <Building2 size={16} style={{ color: a.color }} />
                </div>
                <span className="text-label text-text-secondary truncate flex-1">{a.name}</span>
              </div>
              <p className="text-title font-bold text-text-primary">{showBalance ? formatCurrency(a.balanceInCents) : '----'}</p>
              {a.yieldsEnabled && (
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp size={11} className="text-success" />
                  <p className="text-caption text-success font-medium">Rende {a.yieldRatePercent}%</p>
                </div>
              )}
            </button>
          ))}
          <button onClick={() => navigate('/contas')} className="m3-card-filled p-4 min-w-[110px] flex-shrink-0 flex flex-col items-center justify-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 size={18} className="text-primary" />
            </div>
            <span className="text-caption text-text-tertiary">Adicionar</span>
          </button>
        </div>
      </section>

      {/* Cartoes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-title text-text-primary">Cartoes</h2>
          <button onClick={() => navigate('/cartoes')} className="m3-btn-text text-label flex items-center gap-0.5">
            Ver todos <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
          {cards.map((card: any) => {
            const used = (card.invoices || []).filter((i: any) => i.status !== 'paid').reduce((s: number, i: any) => s + i.totalInCents, 0);
            const available = card.limitInCents - used;
            const usedPercent = card.limitInCents > 0 ? (used / card.limitInCents) * 100 : 0;
            return (
              <button key={card.id} onClick={() => navigate('/cartoes')} className="m3-card-elevated min-w-[210px] flex-shrink-0 p-4 text-left" style={{ borderLeft: '4px solid ' + (card.color || 'var(--m3-primary)') }}>
                <div className="flex items-center justify-between mb-3">
                  <CreditCard size={18} style={{ color: card.color || 'var(--m3-primary)' }} />
                  <span className="text-caption text-text-tertiary uppercase font-medium">{card.brand}</span>
                </div>
                <p className="text-label text-text-secondary mb-0.5">{card.name}</p>
                <p className="text-title font-bold text-text-primary mb-3">---- {card.lastFourDigits}</p>
                <div className="w-full h-2 rounded-full bg-surface-highest mb-2">
                  <div className="h-full rounded-full transition-all duration-500 ease-spring" style={{ width: Math.min(usedPercent, 100) + '%', backgroundColor: usedPercent > 80 ? 'var(--m3-danger)' : (card.color || 'var(--m3-primary)') }} />
                </div>
                <div className="flex justify-between">
                  <span className="text-caption text-text-tertiary">Disponivel</span>
                  <span className="text-caption font-semibold text-text-primary">{showBalance ? formatCurrency(available) : '----'}</span>
                </div>
              </button>
            );
          })}
          {cards.length === 0 && (
            <button onClick={() => navigate('/cartoes')} className="m3-card-filled p-5 min-w-[180px] flex-shrink-0 flex flex-col items-center justify-center gap-2.5">
              <CreditCard size={22} className="text-text-tertiary" />
              <span className="text-label text-text-tertiary">Adicionar cartao</span>
            </button>
          )}
        </div>
      </section>

      {/* Gastos por categoria */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-title text-text-primary">Gastos por categoria</h2>
          <button onClick={() => navigate('/relatorios')} className="m3-btn-text text-label flex items-center gap-0.5">
            <PieChart size={12} /> Detalhes
          </button>
        </div>
        {categorySpending.length > 0 ? (
          <div className="m3-card-elevated p-5">
            <div className="flex items-center gap-5">
              <div className="w-24 h-24 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie data={categorySpending} dataKey="total" cx="50%" cy="50%" innerRadius={25} outerRadius={44} strokeWidth={0}>
                      {categorySpending.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                    </Pie>
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                {categorySpending.map((cat) => {
                  const total = categorySpending.reduce((s, c) => s + c.total, 0);
                  const percent = total > 0 ? (cat.total / total) * 100 : 0;
                  return (
                    <div key={cat.name} className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-label text-text-secondary flex-1 truncate">{cat.name}</span>
                      <span className="text-label font-bold text-text-primary">{percent.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="m3-card-filled p-10 text-center">
            <PieChart size={32} className="mx-auto mb-3 text-text-tertiary opacity-50" />
            <p className="text-label text-text-tertiary">Sem gastos este mes</p>
          </div>
        )}
      </section>

      {/* Proximos */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <CalendarClock size={18} className="text-warning" />
            <h2 className="text-title text-text-primary">Proximos</h2>
          </div>
          <button onClick={() => navigate('/calendario')} className="m3-btn-text text-label flex items-center gap-0.5">
            Calendario <ChevronRight size={14} />
          </button>
        </div>
        {upcoming.length === 0 ? (
          <div className="m3-card-filled p-8 text-center">
            <CalendarClock size={28} className="mx-auto mb-3 text-text-tertiary opacity-50" />
            <p className="text-label text-text-tertiary">Nenhum vencimento nos proximos 7 dias</p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
            {upcoming.map((tx: any) => (
              <div key={tx.id} className="m3-card-elevated p-4 min-w-[190px] flex-shrink-0">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-8 h-8 rounded-lg bg-warning-container/30 flex items-center justify-center">
                    <CalendarClock size={14} className="text-warning" />
                  </div>
                  <span className="text-caption text-text-tertiary">
                    {new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                <p className="text-label text-text-primary truncate font-medium">{tx.description}</p>
                <p className="text-label font-bold text-danger mt-1">{formatCurrency(tx.amountInCents)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Assinaturas resumo */}
      {subscriptions.length > 0 && (
        <section>
          <button onClick={() => navigate('/assinaturas')} className="m3-card-elevated w-full p-5 flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-2xl bg-tertiary-container/30 flex items-center justify-center">
              <Repeat size={20} className="text-tertiary" />
            </div>
            <div className="flex-1">
              <p className="text-label text-text-secondary">Assinaturas ativas</p>
              <p className="text-title font-bold text-text-primary">{formatCurrency(totalSubsMonthly)}<span className="text-caption text-text-tertiary font-normal">/mes</span></p>
            </div>
            <ChevronRight size={18} className="text-text-tertiary" />
          </button>
        </section>
      )}
    </div>
  );
}
