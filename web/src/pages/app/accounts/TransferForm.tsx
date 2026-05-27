import { useState } from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../../lib/api/client';
import { formatCurrency } from '../../../lib/utils';
import CurrencyInput from '../../../components/ui/CurrencyInput';

const schema = z.object({
  fromAccountId: z.string().uuid('Selecione a conta de origem'),
  toAccountId: z.string().uuid('Selecione a conta de destino'),
  amountInCents: z.number().positive('Valor deve ser positivo'),
  note: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Account {
  id: string;
  name: string;
  balanceInCents: number;
  color: string;
}

interface Props {
  accounts: Account[];
  onClose: () => void;
  onSaved: () => void;
}

export default function TransferForm({ accounts, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fromAccountId: '', toAccountId: '', amountInCents: 0 },
  });

  const onSubmit = async (data: FormData) => {
    if (data.fromAccountId === data.toAccountId) return;
    setLoading(true);
    try {
      await api.post('/accounts/transfer', {
        ...data,
        date: new Date().toISOString(),
      });
      onSaved();
    } catch {
      // handle
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative glass-card-lg w-full max-w-md p-6 m-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary">Transferencia</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">De</label>
            <select className="input-field" {...register('fromAccountId')}>
              <option value="">Selecione...</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balanceInCents)})</option>
              ))}
            </select>
            {errors.fromAccountId && <p className="text-danger text-xs mt-1">{errors.fromAccountId.message}</p>}
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">Para</label>
            <select className="input-field" {...register('toAccountId')}>
              <option value="">Selecione...</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balanceInCents)})</option>
              ))}
            </select>
            {errors.toAccountId && <p className="text-danger text-xs mt-1">{errors.toAccountId.message}</p>}
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">Valor</label>
            <CurrencyInput
              value={watch('amountInCents')}
              onChange={(v) => setValue('amountInCents', v)}
            />
            {errors.amountInCents && <p className="text-danger text-xs mt-1">{errors.amountInCents.message}</p>}
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">Nota (opcional)</label>
            <input className="input-field" placeholder="Descricao" {...register('note')} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Transferindo...' : 'Transferir'}
          </button>
        </form>
      </div>
    </div>
  );
}