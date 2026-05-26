import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check } from 'lucide-react';
import api from '../../lib/api/client';

const schema = z.object({
  type: z.enum(['income', 'expense']),
  amountInCents: z.number().positive('Valor obrigatorio'),
  description: z.string().min(1, 'Descricao obrigatoria'),
  date: z.string(),
  status: z.enum(['paid', 'pending']),
  accountId: z.string().optional(),
  creditCardId: z.string().optional(),
  categoryId: z.string().optional(),
  installments: z.number().min(1).max(72).default(1),
});

type FormData = z.infer<typeof schema>;

export default function NewTransaction() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [useCard, setUseCard] = useState(false);

  useEffect(() => {
    api.get('/accounts').then((r) => setAccounts(r.data));
    api.get('/cards').then((r) => setCards(r.data));
    api.get('/transactions/categories').then((r) => setCategories(r.data));
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'expense',
      amountInCents: 0,
      description: '',
      date: today,
      status: 'paid',
      installments: 1,
    },
  });

  const txType = watch('type');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const payload: any = { ...data };
      if (!useCard) {
        delete payload.creditCardId;
      } else {
        delete payload.accountId;
      }
      await api.post('/transactions', payload);
      navigate('/transacoes');
    } catch {
      // handle
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-lg font-bold text-text-primary mb-4">Novo lancamento</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setValue('type', 'expense')}
            className={'flex-1 py-2 rounded-xl text-sm font-medium transition-colors ' + (txType === 'expense' ? 'bg-danger/20 text-danger border border-danger/30' : 'glass-card text-text-secondary')}
          >
            Despesa
          </button>
          <button
            type="button"
            onClick={() => setValue('type', 'income')}
            className={'flex-1 py-2 rounded-xl text-sm font-medium transition-colors ' + (txType === 'income' ? 'bg-success/20 text-success border border-success/30' : 'glass-card text-text-secondary')}
          >
            Receita
          </button>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            className="input-field text-xl font-bold"
            placeholder="0,00"
            autoFocus
            onChange={(e) => setValue('amountInCents', Math.round(parseFloat(e.target.value || '0') * 100))}
          />
          {errors.amountInCents && <p className="text-danger text-xs mt-1">{errors.amountInCents.message}</p>}
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">Descricao</label>
          <input className="input-field" placeholder="Ex: Supermercado" {...register('description')} />
          {errors.description && <p className="text-danger text-xs mt-1">{errors.description.message}</p>}
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">Categoria</label>
          <select className="input-field" {...register('categoryId')}>
            <option value="">Sem categoria</option>
            {categories.filter((c: any) => c.type === txType).map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <button
            type="button"
            onClick={() => setUseCard(false)}
            className={'px-3 py-1.5 rounded-lg text-xs font-medium ' + (!useCard ? 'gradient-primary text-white' : 'glass-card text-text-secondary')}
          >
            Conta
          </button>
          <button
            type="button"
            onClick={() => setUseCard(true)}
            className={'px-3 py-1.5 rounded-lg text-xs font-medium ' + (useCard ? 'gradient-primary text-white' : 'glass-card text-text-secondary')}
          >
            Cartao
          </button>
        </div>

        {!useCard ? (
          <div>
            <select className="input-field" {...register('accountId')}>
              <option value="">Selecione a conta</option>
              {accounts.map((a: any) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <>
            <div>
              <select className="input-field" {...register('creditCardId')}>
                <option value="">Selecione o cartao</option>
                {cards.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Parcelas</label>
              <input
                type="number"
                min="1"
                max="72"
                className="input-field"
                {...register('installments', { valueAsNumber: true })}
              />
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-text-secondary mb-1">Data</label>
            <input type="date" className="input-field" {...register('date')} />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Status</label>
            <select className="input-field" {...register('status')}>
              <option value="paid">Pago</option>
              <option value="pending">Pendente</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Check size={18} />
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </div>
  );
}