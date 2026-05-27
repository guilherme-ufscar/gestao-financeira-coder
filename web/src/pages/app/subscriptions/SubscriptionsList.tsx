import { useEffect, useState } from 'react';
import { Plus, X, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../../lib/api/client';
import { formatCurrency } from '../../../lib/utils';
import CurrencyInput from '../../../components/ui/CurrencyInput';

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatorio'),
  logoUrl: z.string().optional(),
  amountInCents: z.number().positive('Valor obrigatorio'),
  cycle: z.enum(['monthly', 'yearly', 'weekly', 'biweekly']),
  billingDay: z.number().min(1).max(31),
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
  nextBillingDate: z.string(),
});

type FormData = z.infer<typeof schema>;

const knownServices = [
  { name: 'Netflix', slug: 'netflix-icon', color: '#E50914' },
  { name: 'Spotify', slug: 'spotify', color: '#1DB954' },
  { name: 'Amazon Prime', slug: 'prime-video', color: '#00A8E1' },
  { name: 'Disney+', slug: 'disneyplus', color: '#113CCF' },
  { name: 'YouTube', slug: 'youtube', color: '#FF0000' },
  { name: 'iCloud', slug: 'icloud', color: '#3693F3' },
  { name: 'HBO Max', slug: 'hbo', color: '#5822B4' },
  { name: 'Globoplay', slug: '', color: '#F72B2B' },
  { name: 'ChatGPT', slug: 'openai', color: '#10A37F' },
  { name: 'Adobe', slug: 'adobe', color: '#FF0000' },
  { name: 'Microsoft 365', slug: 'microsoft', color: '#0078D4' },
  { name: 'Apple Music', slug: 'apple-music-icon', color: '#FA2D48' },
  { name: 'Twitch', slug: 'twitch', color: '#9146FF' },
  { name: 'Notion', slug: 'notion', color: '#000000' },
  { name: 'Figma', slug: 'figma', color: '#F24E1E' },
  { name: 'GitHub', slug: 'github', color: '#181717' },
  { name: 'Dropbox', slug: 'dropbox', color: '#0061FF' },
  { name: 'Google One', slug: 'google', color: '#4285F4' },
  { name: 'Crunchyroll', slug: 'crunchyroll', color: '#F47521' },
  { name: 'Deezer', slug: 'deezer', color: '#A238FF' },
];

export default function SubscriptionsList() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [customMode, setCustomMode] = useState(false);
  const [customColor, setCustomColor] = useState('#B794F6');

  const fetchData = async () => {
    const [subs, accs] = await Promise.all([api.get('/subscriptions'), api.get('/accounts')]);
    setSubscriptions(subs.data);
    setAccounts(accs.data);
  };

  useEffect(() => { fetchData(); }, []);

  const totalMonthly = subscriptions.filter((s) => s.active).reduce((sum, s) => {
    if (s.cycle === 'yearly') return sum + Math.round(s.amountInCents / 12);
    if (s.cycle === 'weekly') return sum + s.amountInCents * 4;
    if (s.cycle === 'biweekly') return sum + s.amountInCents * 2;
    return sum + s.amountInCents;
  }, 0);

  const defaultAccount = accounts.find((a: any) => a.isDefault);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', amountInCents: 0, cycle: 'monthly', billingDay: new Date().getDate(), accountId: '', nextBillingDate: new Date().toISOString().split('T')[0] },
  });

  useEffect(() => { if (defaultAccount) setValue('accountId', defaultAccount.id); }, [defaultAccount]);

  const fuzzyMatch = (query: string, target: string) => {
    const q = query.toLowerCase().replace(/[^a-z0-9]/g, '');
    const t = target.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (t.includes(q)) return true;
    let qi = 0;
    for (let i = 0; i < t.length && qi < q.length; i++) { if (t[i] === q[qi]) qi++; }
    return qi >= q.length * 0.7;
  };

  const filteredServices = search.length > 0 ? knownServices.filter((s) => fuzzyMatch(search, s.name)) : knownServices;

  const selectService = (service: typeof knownServices[0]) => {
    const existing = subscriptions.filter((s) => s.name.toLowerCase().startsWith(service.name.toLowerCase()));
    const name = existing.length > 0 ? `${service.name} - ${existing.length + 1}` : service.name;
    setValue('name', name);
    setSearch('');
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await api.post('/subscriptions', data);
      setShowForm(false); setCustomMode(false); setSearch(''); reset(); fetchData();
    } catch {} finally { setLoading(false); }
  };

  const toggleActive = async (id: string, active: boolean) => {
    await api.put('/subscriptions/' + id, { active: !active });
    fetchData();
  };

  return (
    <div className="p-5 space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-headline text-text-primary">Assinaturas</h1>
        <button onClick={() => setShowForm(true)} className="m3-fab-small">
          <Plus size={18} />
        </button>
      </header>

      <div className="m3-card-hero p-6">
        <p className="text-label text-on-primary-container/70 uppercase tracking-wider mb-1">Total mensal estimado</p>
        <p className="text-display text-danger">{formatCurrency(totalMonthly)}</p>
        <p className="text-caption text-on-primary-container/60 mt-1">
          {subscriptions.filter((s) => s.active).length} assinaturas ativas
        </p>
      </div>

      <div className="space-y-2.5">
        {subscriptions.map((sub) => {
          const service = knownServices.find((s) => sub.name.toLowerCase().includes(s.name.toLowerCase()));
          const color = service?.color || '#B794F6';
          return (
            <div key={sub.id} className="m3-card-elevated p-4 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-label font-bold" style={{ backgroundColor: color }}>
                {sub.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body font-medium text-text-primary truncate">{sub.name}</p>
                <p className="text-caption text-text-tertiary">
                  {sub.cycle === 'monthly' ? 'Mensal' : sub.cycle === 'yearly' ? 'Anual' : sub.cycle === 'weekly' ? 'Semanal' : 'Quinzenal'}
                  {' - Dia ' + sub.billingDay}
                </p>
              </div>
              <div className="text-right">
                <p className="text-body font-bold text-text-primary">{formatCurrency(sub.amountInCents)}</p>
                <button onClick={() => toggleActive(sub.id, sub.active)}
                  className={'text-caption font-medium ' + (sub.active ? 'text-success' : 'text-text-tertiary')}>
                  {sub.active ? 'Ativa' : 'Pausada'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowForm(false); setCustomMode(false); setSearch(''); }} />
          <div className="relative m3-dialog w-full max-w-md max-h-[85vh] overflow-y-auto p-7 m-4 animate-slide-up sm:animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-title-lg text-text-primary">Nova assinatura</h2>
              <button onClick={() => { setShowForm(false); setCustomMode(false); setSearch(''); }} className="w-8 h-8 rounded-full bg-surface-high flex items-center justify-center text-text-tertiary hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            <div className="mb-5">
              {!customMode ? (
                <>
                  <div className="relative mb-3">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
                    <input type="text" className="m3-input pl-10" placeholder="Buscar servico..." value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-4 gap-2.5 max-h-40 overflow-y-auto">
                    {filteredServices.map((s) => (
                      <button key={s.name} type="button" onClick={() => selectService(s)}
                        className={'p-2.5 rounded-xl border border-outline-variant hover:border-primary text-center transition-all duration-200' +
                          (watch('name')?.toLowerCase().includes(s.name.toLowerCase()) ? ' border-primary bg-primary-container/20' : '')}>
                        <div className="w-7 h-7 rounded-lg mx-auto mb-1.5 text-white text-[8px] font-bold flex items-center justify-center" style={{ backgroundColor: s.color }}>
                          {s.name.slice(0, 2)}
                        </div>
                        <span className="text-caption text-text-secondary leading-tight line-clamp-1">{s.name}</span>
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={() => setCustomMode(true)}
                    className="w-full mt-3 m3-btn-outlined text-label">
                    Personalizada (nao esta na lista)
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-label text-text-secondary mb-2 pl-1">Nome do servico</label>
                    <input className="m3-input" placeholder="Ex: Minha academia" onChange={(e) => setValue('name', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-label text-text-secondary mb-2 pl-1">Cor</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={customColor} onChange={(e) => setCustomColor(e.target.value)} className="w-11 h-11 rounded-xl border border-outline-variant cursor-pointer" />
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-label font-bold" style={{ backgroundColor: customColor }}>
                        {(watch('name') || '??').slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={() => { setCustomMode(false); setSearch(''); }} className="m3-btn-text text-label">
                    Voltar para lista
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <input type="hidden" {...register('name')} />
              {watch('name') && (
                <p className="text-body text-text-primary font-medium">Servico: <span className="text-primary">{watch('name')}</span></p>
              )}
              {errors.name && <p className="text-danger text-caption">{errors.name.message}</p>}
              <CurrencyInput value={watch('amountInCents') || 0} onChange={(v) => setValue('amountInCents', v)} placeholder="Valor" />
              <div className="grid grid-cols-2 gap-3">
                <select className="m3-select" {...register('cycle')}>
                  <option value="monthly">Mensal</option>
                  <option value="yearly">Anual</option>
                  <option value="weekly">Semanal</option>
                  <option value="biweekly">Quinzenal</option>
                </select>
                <input type="number" min="1" max="31" className="m3-input" placeholder="Dia cobranca" {...register('billingDay', { valueAsNumber: true })} />
              </div>
              <select className="m3-select" {...register('accountId')}>
                <option value="">Conta de debito</option>
                {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <input type="hidden" {...register('nextBillingDate')} />
              <button type="submit" disabled={loading || !watch('name')} className="m3-btn w-full disabled:opacity-40">
                {loading ? 'Salvando...' : 'Criar assinatura'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
