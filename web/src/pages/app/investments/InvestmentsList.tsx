import { useEffect, useState } from 'react';
import { Plus, TrendingUp, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../../lib/api/client';
import { formatCurrency } from '../../../lib/utils';
import CurrencyInput from '../../../components/ui/CurrencyInput';

const schema = z.object({
  type: z.string().min(1),
  name: z.string().min(1, 'Nome obrigatorio'),
  ticker: z.string().optional(),
  amountInCents: z.number().positive(),
  currentValueInCents: z.number().positive(),
  yieldRatePercent: z.number().nullable().optional(),
  yieldType: z.string().optional(),
  startDate: z.string(),
  note: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const investmentTypes = [
  { value: 'cdb', label: 'CDB' },
  { value: 'acoes', label: 'Acoes' },
  { value: 'fii', label: 'FIIs' },
  { value: 'tesouro', label: 'Tesouro Direto' },
  { value: 'cripto', label: 'Criptomoedas' },
  { value: 'poupanca', label: 'Poupanca' },
  { value: 'fundo', label: 'Fundos' },
  { value: 'outro', label: 'Outro' },
];

export default function InvestmentsList() {
  const [investments, setInvestments] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => { const { data } = await api.get('/investments'); setInvestments(data); };
  useEffect(() => { fetchData(); }, []);

  const totalInvested = investments.reduce((s, i) => s + i.amountInCents, 0);
  const totalCurrent = investments.reduce((s, i) => s + i.currentValueInCents, 0);
  const totalYield = totalCurrent - totalInvested;

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'cdb', startDate: new Date().toISOString().split('T')[0] },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try { await api.post('/investments', data); setShowForm(false); fetchData(); }
    catch {} finally { setLoading(false); }
  };

  const typeColors: Record<string, string> = {
    cdb: '#B794F6', acoes: '#7DD3FC', fii: '#7DD3FC', tesouro: '#FDE68A',
    cripto: '#F9A8D4', poupanca: '#6EE7B7', fundo: '#B794F6', outro: '#C9BFD6',
  };

  return (
    <div className="p-5 space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-headline text-text-primary">Investimentos</h1>
        <button onClick={() => setShowForm(true)} className="m3-fab-small">
          <Plus size={18} />
        </button>
      </header>

      <div className="m3-card-hero p-6">
        <p className="text-label text-on-primary-container/70 uppercase tracking-wider mb-1">Patrimonio investido</p>
        <p className="text-display text-on-primary-container">{formatCurrency(totalCurrent)}</p>
        <div className="flex items-center gap-4 mt-3">
          <span className="text-label text-on-primary-container/60">Aplicado: {formatCurrency(totalInvested)}</span>
          <span className={'text-label font-bold ' + (totalYield >= 0 ? 'text-success' : 'text-danger')}>
            {totalYield >= 0 ? '+' : ''}{formatCurrency(totalYield)}
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        {investments.map((inv) => {
          const yieldVal = inv.currentValueInCents - inv.amountInCents;
          const color = typeColors[inv.type] || '#B794F6';
          return (
            <div key={inv.id} className="m3-card-elevated p-4 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '18' }}>
                <TrendingUp size={18} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body font-medium text-text-primary truncate">{inv.name}</p>
                <p className="text-caption text-text-tertiary">
                  {investmentTypes.find((t) => t.value === inv.type)?.label || inv.type}
                  {inv.ticker ? ' - ' + inv.ticker : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-body font-bold text-text-primary">{formatCurrency(inv.currentValueInCents)}</p>
                <p className={'text-caption font-medium ' + (yieldVal >= 0 ? 'text-success' : 'text-danger')}>
                  {yieldVal >= 0 ? '+' : ''}{formatCurrency(yieldVal)}
                </p>
              </div>
            </div>
          );
        })}
        {investments.length === 0 && (
          <div className="m3-card-filled p-10 text-center">
            <TrendingUp size={36} className="mx-auto mb-3 text-text-tertiary opacity-50" />
            <p className="text-text-tertiary text-body">Nenhum investimento cadastrado.</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative m3-dialog w-full max-w-md max-h-[85vh] overflow-y-auto p-7 m-4 animate-slide-up sm:animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-title-lg text-text-primary">Novo investimento</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-surface-high flex items-center justify-center text-text-tertiary hover:text-text-primary">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <select className="m3-select" {...register('type')}>
                {investmentTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <input className="m3-input" placeholder="Nome (ex: CDB Banco Inter)" {...register('name')} />
              {errors.name && <p className="text-danger text-caption">{errors.name.message}</p>}
              <input className="m3-input" placeholder="Ticker (opcional)" {...register('ticker')} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-label text-text-secondary mb-2 pl-1">Valor aplicado</label>
                  <CurrencyInput value={watch('amountInCents')} onChange={(v) => { setValue('amountInCents', v); setValue('currentValueInCents', v); }} />
                </div>
                <div>
                  <label className="block text-label text-text-secondary mb-2 pl-1">Valor atual</label>
                  <CurrencyInput value={watch('currentValueInCents')} onChange={(v) => setValue('currentValueInCents', v)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" step="0.01" className="m3-input" placeholder="Rentabilidade % a.a." onChange={(e) => setValue('yieldRatePercent', parseFloat(e.target.value) || null)} />
                <input type="date" className="m3-input" {...register('startDate')} />
              </div>
              <input className="m3-input" placeholder="Nota (opcional)" {...register('note')} />
              <button type="submit" disabled={loading} className="m3-btn w-full disabled:opacity-40">
                {loading ? 'Salvando...' : 'Adicionar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
