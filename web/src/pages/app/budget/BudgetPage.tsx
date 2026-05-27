import { useEffect, useState } from 'react';
import { Plus, X, Target, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../../lib/api/client';
import { formatCurrency } from '../../../lib/utils';
import CurrencyInput from '../../../components/ui/CurrencyInput';

const budgetSchema = z.object({ categoryId: z.string().uuid(), limitInCents: z.number().positive() });
const goalSchema = z.object({ name: z.string().min(1), targetInCents: z.number().positive(), currentInCents: z.number().default(0), deadline: z.string().optional() });
const debtSchema = z.object({ description: z.string().min(1), totalInCents: z.number().positive(), remainingInCents: z.number(), creditor: z.string().optional(), dueDate: z.string().optional() });

type Tab = 'budget' | 'goals' | 'debts';

export default function BudgetPage() {
  const [tab, setTab] = useState<Tab>('budget');
  const [budgets, setBudgets] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const fetchData = async () => {
    const [b, g, d, c] = await Promise.all([
      api.get('/budget?month=' + month + '&year=' + year),
      api.get('/budget/goals'),
      api.get('/budget/debts'),
      api.get('/transactions/categories'),
    ]);
    setBudgets(b.data); setGoals(g.data); setDebts(d.data); setCategories(c.data);
    const start = new Date(year, month - 1, 1).toISOString();
    const end = new Date(year, month, 0).toISOString();
    const txRes = await api.get('/transactions?startDate=' + start + '&endDate=' + end + '&type=expense&limit=500');
    setTransactions(txRes.data);
  };

  useEffect(() => { fetchData(); }, []);

  const getSpentForCategory = (categoryId: string) => {
    return transactions.filter((t: any) => t.categoryId === categoryId).reduce((s: number, t: any) => s + t.amountInCents, 0);
  };

  const budgetForm = useForm<any>({ resolver: zodResolver(budgetSchema) });
  const goalForm = useForm<any>({ resolver: zodResolver(goalSchema), defaultValues: { currentInCents: 0 } });
  const debtForm = useForm({ resolver: zodResolver(debtSchema) });

  const onBudgetSubmit = async (data: any) => { setLoading(true); await api.post('/budget', { ...data, month, year }); setShowForm(false); setLoading(false); fetchData(); };
  const onGoalSubmit = async (data: any) => { setLoading(true); await api.post('/budget/goals', data); setShowForm(false); setLoading(false); fetchData(); };
  const onDebtSubmit = async (data: any) => { setLoading(true); await api.post('/budget/debts', data); setShowForm(false); setLoading(false); fetchData(); };

  return (
    <div className="p-5 space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-headline text-text-primary">
          {tab === 'budget' ? 'Orcamento' : tab === 'goals' ? 'Metas' : 'Dividas'}
        </h1>
        <button onClick={() => setShowForm(true)} className="m3-fab-small">
          <Plus size={18} />
        </button>
      </header>

      <div className="m3-segmented">
        {(['budget', 'goals', 'debts'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={'m3-segmented-item ' + (tab === t ? 'm3-segmented-active' : '')}>
            {t === 'budget' ? 'Orcamento' : t === 'goals' ? 'Metas' : 'Dividas'}
          </button>
        ))}
      </div>

      {tab === 'budget' && (
        <div className="space-y-3">
          {budgets.map((b: any) => {
            const spent = getSpentForCategory(b.categoryId);
            const percent = b.limitInCents > 0 ? (spent / b.limitInCents) * 100 : 0;
            const isOver = percent > 100;
            return (
              <div key={b.id} className="m3-card-elevated p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-body font-medium text-text-primary">{b.category?.name}</span>
                  <span className={'text-label ' + (isOver ? 'text-danger font-bold' : 'text-text-secondary')}>
                    {formatCurrency(spent)} / {formatCurrency(b.limitInCents)}
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-surface-highest">
                  <div className="h-full rounded-full transition-all duration-500 ease-spring"
                    style={{ width: Math.min(percent, 100) + '%', backgroundColor: isOver ? 'var(--m3-danger)' : percent > 80 ? 'var(--m3-warning)' : 'var(--m3-primary)' }} />
                </div>
                {isOver && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <AlertTriangle size={12} className="text-danger" />
                    <span className="text-caption text-danger font-medium">Orcamento estourado</span>
                  </div>
                )}
              </div>
            );
          })}
          {budgets.length === 0 && (
            <div className="m3-card-filled p-10 text-center">
              <p className="text-text-tertiary text-body">Nenhum orcamento definido para este mes.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'goals' && (
        <div className="space-y-3">
          {goals.map((g: any) => {
            const percent = g.targetInCents > 0 ? (g.currentInCents / g.targetInCents) * 100 : 0;
            return (
              <div key={g.id} className="m3-card-elevated p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <Target size={18} style={{ color: g.color || 'var(--m3-primary)' }} />
                  <span className="text-body font-medium text-text-primary">{g.name}</span>
                </div>
                <div className="flex justify-between text-label text-text-secondary mb-2">
                  <span>{formatCurrency(g.currentInCents)}</span>
                  <span>{formatCurrency(g.targetInCents)}</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-surface-highest">
                  <div className="h-full rounded-full transition-all duration-500 ease-spring"
                    style={{ width: Math.min(percent, 100) + '%', backgroundColor: g.color || 'var(--m3-primary)' }} />
                </div>
                <p className="text-caption text-text-tertiary mt-2">{percent.toFixed(0)}% concluido</p>
              </div>
            );
          })}
          {goals.length === 0 && (
            <div className="m3-card-filled p-10 text-center">
              <p className="text-text-tertiary text-body">Nenhuma meta criada.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'debts' && (
        <div className="space-y-3">
          {debts.map((d: any) => {
            const paidPercent = d.totalInCents > 0 ? ((d.totalInCents - d.remainingInCents) / d.totalInCents) * 100 : 0;
            return (
              <div key={d.id} className="m3-card-elevated p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-body font-medium text-text-primary">{d.description}</span>
                  <span className={'text-caption px-2.5 py-1 rounded-full font-medium ' + (d.status === 'paid' ? 'bg-success-container/30 text-success' : 'bg-danger-container/30 text-danger')}>
                    {d.status === 'paid' ? 'Quitada' : 'Ativa'}
                  </span>
                </div>
                {d.creditor && <p className="text-caption text-text-tertiary mb-2">Credor: {d.creditor}</p>}
                <div className="flex justify-between text-label text-text-secondary mb-2">
                  <span>Pago: {formatCurrency(d.totalInCents - d.remainingInCents)}</span>
                  <span>Total: {formatCurrency(d.totalInCents)}</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-surface-highest">
                  <div className="h-full rounded-full bg-primary transition-all duration-500 ease-spring" style={{ width: paidPercent + '%' }} />
                </div>
              </div>
            );
          })}
          {debts.length === 0 && (
            <div className="m3-card-filled p-10 text-center">
              <p className="text-text-tertiary text-body">Nenhuma divida registrada.</p>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative m3-dialog w-full max-w-md p-7 m-4 animate-slide-up sm:animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-title-lg text-text-primary">
                {tab === 'budget' ? 'Novo orcamento' : tab === 'goals' ? 'Nova meta' : 'Nova divida'}
              </h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-surface-high flex items-center justify-center text-text-tertiary hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            {tab === 'budget' && (
              <form onSubmit={budgetForm.handleSubmit(onBudgetSubmit)} className="space-y-4">
                <select className="m3-select" {...budgetForm.register('categoryId')}>
                  <option value="">Categoria</option>
                  {categories.filter((c: any) => c.type === 'expense').map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <CurrencyInput value={budgetForm.watch('limitInCents')} onChange={(v) => budgetForm.setValue('limitInCents', v)} placeholder="Limite" />
                <button type="submit" disabled={loading} className="m3-btn w-full disabled:opacity-40">Salvar</button>
              </form>
            )}

            {tab === 'goals' && (
              <form onSubmit={goalForm.handleSubmit(onGoalSubmit)} className="space-y-4">
                <input className="m3-input" placeholder="Nome da meta" {...goalForm.register('name')} />
                <CurrencyInput value={goalForm.watch('targetInCents')} onChange={(v) => goalForm.setValue('targetInCents', v)} placeholder="Valor alvo" />
                <CurrencyInput value={goalForm.watch('currentInCents')} onChange={(v) => goalForm.setValue('currentInCents', v)} placeholder="Valor atual" />
                <input type="date" className="m3-input" placeholder="Prazo" {...goalForm.register('deadline')} />
                <button type="submit" disabled={loading} className="m3-btn w-full disabled:opacity-40">Salvar</button>
              </form>
            )}

            {tab === 'debts' && (
              <form onSubmit={debtForm.handleSubmit(onDebtSubmit)} className="space-y-4">
                <input className="m3-input" placeholder="Descricao" {...debtForm.register('description')} />
                <CurrencyInput value={debtForm.watch('totalInCents')} onChange={(v) => { debtForm.setValue('totalInCents', v); debtForm.setValue('remainingInCents', v); }} placeholder="Valor total" />
                <input className="m3-input" placeholder="Credor (opcional)" {...debtForm.register('creditor')} />
                <input type="date" className="m3-input" {...debtForm.register('dueDate')} />
                <button type="submit" disabled={loading} className="m3-btn w-full disabled:opacity-40">Salvar</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
