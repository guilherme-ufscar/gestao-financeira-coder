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

  const fetchData = async () => {
    const { data } = await api.get('/investments');
    setInvestments(data);
  };

  useEffect(() => { fetchData(); }, []);

  const totalInvested = investments.reduce((s, i) => s + i.amountInCents, 0);
  const totalCurrent = investments.reduce((s, i) => s + i.currentValueInCents, 0);
  const totalYield = totalCurrent - totalInvested;

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'cdb',
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await api.post('/investments', data);
      setShowForm(false);
      fetchData();
    } catch {
      // handle
    } finally {
      setLoading(false);
    }
  };


  const typeColors: Record<string, string> = {
    cdb: '#6D5FFD',
    acoes: '#4F7DFF',
    fii: '#3DD9D6',
    tesouro: '#FFB454',
    cripto: '#FF5C7A',
    poupanca: '#2FD180',
    fundo: '#A78BFA',
    outro: '#636E72',
  };

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary">Investimentos</h1>
        <button
          onClick={() => setShowForm(true)}
          className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center"
        >
          <Plus size={16} className="text-white" />
        </button>
      </header>

      <div className="glass-card-lg p-5">
        <p className="text-text-secondary text-xs uppercase tracking-wide mb-1">Patrimonio investido</p>
        <p className="text-2xl font-bold text-text-primary">{formatCurrency(totalCurrent)}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-text-tertiary">Aplicado: {formatCurrency(totalInvested)}</span>
          <span className={'text-xs font-medium ' + (totalYield >= 0 ? 'text-success' : 'text-danger')}>
            {totalYield >= 0 ? '+' : ''}{formatCurrency(totalYield)}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {investments.map((inv) => {
          const yieldVal = inv.currentValueInCents - inv.amountInCents;
          const color = typeColors[inv.type] || '#6D5FFD';
          return (
            <div key={inv.id} className="glass-card p-4 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: color + '20' }}
              >
                <TrendingUp size={16} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{inv.name}</p>
                <p className="text-[10px] text-text-tertiary">
                  {investmentTypes.find((t) => t.value === inv.type)?.label || inv.type}
                  {inv.ticker ? ' - ' + inv.ticker : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-text-primary">{formatCurrency(inv.currentValueInCents)}</p>
                <p className={'text-[10px] ' + (yieldVal >= 0 ? 'text-success' : 'text-danger')}>
                  {yieldVal >= 0 ? '+' : ''}{formatCurrency(yieldVal)}
                </p>
              </div>
            </div>
          );
        })}
        {investments.length === 0 && (
          <div className="glass-card p-6 text-center">
            <TrendingUp size={32} className="mx-auto mb-2 text-text-tertiary" />
            <p className="text-text-tertiary text-sm">Nenhum investimento cadastrado.</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowForm(false)} />
          <div className="relative glass-card-lg w-full max-w-md max-h-[85vh] overflow-y-auto p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary">Novo investimento</h2>
              <button onClick={() => setShowForm(false)} className="text-text-tertiary hover:text-text-primary">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <select className="input-field" {...register('type')}>
                {investmentTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <input className="input-field" placeholder="Nome (ex: CDB Banco Inter)" {...register('name')} />
              {errors.name && <p className="text-danger text-xs mt-1">{errors.name.message}</p>}
              <input className="input-field" placeholder="Ticker (opcional)" {...register('ticker')} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-tertiary mb-1">Valor aplicado</label>
                  <CurrencyInput
                    value={watch('amountInCents')}
                    onChange={(v) => { setValue('amountInCents', v); setValue('currentValueInCents', v); }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-tertiary mb-1">Valor atual</label>
                  <CurrencyInput
                    value={watch('currentValueInCents')}
                    onChange={(v) => setValue('currentValueInCents', v)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="0.01"
                  className="input-field"
                  placeholder="Rentabilidade % a.a."
                  onChange={(e) => setValue('yieldRatePercent', parseFloat(e.target.value) || null)}
                />
                <input type="date" className="input-field" {...register('startDate')} />
              </div>
              <input className="input-field" placeholder="Nota (opcional)" {...register('note')} />
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                {loading ? 'Salvando...' : 'Adicionar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}