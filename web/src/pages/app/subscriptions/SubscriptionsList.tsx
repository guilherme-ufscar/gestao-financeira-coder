import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../../lib/api/client';
import { formatCurrency } from '../../../lib/utils';

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatorio'),
  logoUrl: z.string().optional(),
  amountInCents: z.number().positive(),
  cycle: z.enum(['monthly', 'yearly', 'weekly', 'biweekly']),
  billingDay: z.number().min(1).max(31),
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
  nextBillingDate: z.string(),
});

type FormData = z.infer<typeof schema>;

const knownServices = [
  { name: 'Netflix', color: '#E50914' },
  { name: 'Spotify', color: '#1DB954' },
  { name: 'Amazon Prime', color: '#00A8E1' },
  { name: 'Disney+', color: '#113CCF' },
  { name: 'YouTube Premium', color: '#FF0000' },
  { name: 'iCloud', color: '#3693F3' },
  { name: 'HBO Max', color: '#5822B4' },
  { name: 'Globoplay', color: '#F72B2B' },
  { name: 'ChatGPT Plus', color: '#10A37F' },
  { name: 'Adobe', color: '#FF0000' },
  { name: 'Microsoft 365', color: '#0078D4' },
  { name: 'Academia', color: '#FF6B35' },
];

export default function SubscriptionsList() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    const [subs, accs] = await Promise.all([
      api.get('/subscriptions'),
      api.get('/accounts'),
    ]);
    setSubscriptions(subs.data);
    setAccounts(accs.data);
  };

  useEffect(() => { fetchData(); }, []);

  const totalMonthly = subscriptions
    .filter((s) => s.active)
    .reduce((sum, s) => {
      if (s.cycle === 'yearly') return sum + Math.round(s.amountInCents / 12);
      if (s.cycle === 'weekly') return sum + s.amountInCents * 4;
      if (s.cycle === 'biweekly') return sum + s.amountInCents * 2;
      return sum + s.amountInCents;
    }, 0);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      cycle: 'monthly',
      billingDay: 1,
      nextBillingDate: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await api.post('/subscriptions', data);
      setShowForm(false);
      fetchData();
    } catch {
      // handle
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    await api.put('/subscriptions/' + id, { active: !active });
    fetchData();
  };


  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary">Assinaturas</h1>
        <button
          onClick={() => setShowForm(true)}
          className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center"
        >
          <Plus size={16} className="text-white" />
        </button>
      </header>

      <div className="glass-card-lg p-5">
        <p className="text-text-secondary text-xs uppercase tracking-wide mb-1">Total mensal estimado</p>
        <p className="text-2xl font-bold text-danger">{formatCurrency(totalMonthly)}</p>
        <p className="text-text-tertiary text-xs mt-1">
          {subscriptions.filter((s) => s.active).length} assinaturas ativas
        </p>
      </div>

      <div className="space-y-2">
        {subscriptions.map((sub) => {
          const service = knownServices.find((s) => sub.name.toLowerCase().includes(s.name.toLowerCase()));
          const color = service?.color || '#6D5FFD';

          return (
            <div key={sub.id} className="glass-card p-4 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: color }}
              >
                {sub.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{sub.name}</p>
                <p className="text-[10px] text-text-tertiary">
                  {sub.cycle === 'monthly' ? 'Mensal' : sub.cycle === 'yearly' ? 'Anual' : sub.cycle === 'weekly' ? 'Semanal' : 'Quinzenal'}
                  {' - Dia ' + sub.billingDay}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-text-primary">{formatCurrency(sub.amountInCents)}</p>
                <button
                  onClick={() => toggleActive(sub.id, sub.active)}
                  className={'text-[10px] ' + (sub.active ? 'text-success' : 'text-text-tertiary')}
                >
                  {sub.active ? 'Ativa' : 'Pausada'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowForm(false)} />
          <div className="relative glass-card-lg w-full max-w-md max-h-[85vh] overflow-y-auto p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary">Nova assinatura</h2>
              <button onClick={() => setShowForm(false)} className="text-text-tertiary hover:text-text-primary">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {knownServices.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => setValue('name', s.name)}
                  className="p-2 rounded-lg border border-border hover:border-primary text-center"
                >
                  <div className="w-6 h-6 rounded mx-auto mb-1 text-white text-[8px] font-bold flex items-center justify-center" style={{ backgroundColor: s.color }}>
                    {s.name.slice(0, 2)}
                  </div>
                  <span className="text-[9px] text-text-secondary">{s.name}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <input className="input-field" placeholder="Nome do servico" {...register('name')} />
                {errors.name && <p className="text-danger text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <input
                  type="number"
                  step="0.01"
                  className="input-field"
                  placeholder="Valor (R$)"
                  onChange={(e) => setValue('amountInCents', Math.round(parseFloat(e.target.value || '0') * 100))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select className="input-field" {...register('cycle')}>
                  <option value="monthly">Mensal</option>
                  <option value="yearly">Anual</option>
                  <option value="weekly">Semanal</option>
                  <option value="biweekly">Quinzenal</option>
                </select>
                <input type="number" min="1" max="31" className="input-field" placeholder="Dia" {...register('billingDay', { valueAsNumber: true })} />
              </div>
              <div>
                <select className="input-field" {...register('accountId')}>
                  <option value="">Conta de debito</option>
                  {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <input type="date" className="input-field" {...register('nextBillingDate')} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                {loading ? 'Salvando...' : 'Criar assinatura'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}