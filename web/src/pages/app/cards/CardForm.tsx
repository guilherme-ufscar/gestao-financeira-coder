import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../../lib/api/client';
import CreditCardVisual from './CreditCardVisual';
import CurrencyInput from '../../../components/ui/CurrencyInput';

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatorio'),
  brand: z.string().min(1),
  lastFourDigits: z.string().length(4, 'Informe 4 digitos'),
  limitInCents: z.number().positive('Limite obrigatorio'),
  closingDay: z.number().min(1).max(31),
  dueDay: z.number().min(1).max(31),
  paymentAccountId: z.string().optional(),
  color: z.string(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  card: any | null;
  accounts: any[];
  onClose: () => void;
  onSaved: () => void;
  onDelete?: () => void;
}

function detectBrand(digits: string): string {
  if (digits.startsWith('4')) return 'visa';
  if (digits.startsWith('5') || digits.startsWith('2')) return 'mastercard';
  if (digits.startsWith('3')) return 'amex';
  if (digits.startsWith('6')) return 'elo';
  return 'visa';
}

const brandColors: Record<string, string> = {
  visa: '#1A1F71',
  mastercard: '#EB001B',
  amex: '#006FCF',
  elo: '#00A4E0',
  hipercard: '#822124',
};

export default function CardForm({ card, accounts, onClose, onSaved, onDelete }: Props) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!card;

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: card?.name || '',
      brand: card?.brand || 'visa',
      lastFourDigits: card?.lastFourDigits || '',
      limitInCents: card?.limitInCents || 0,
      closingDay: card?.closingDay || 1,
      dueDay: card?.dueDay || 10,
      paymentAccountId: card?.paymentAccountId || '',
      color: card?.color || '#1A1F71',
    },
  });

  const watchedName = watch('name');
  const watchedDigits = watch('lastFourDigits');
  const watchedBrand = watch('brand');
  const watchedColor = watch('color');

  const handleDigitsChange = (value: string) => {
    const clean = value.replace(/\D/g, '').slice(0, 4);
    setValue('lastFourDigits', clean);
    if (clean.length > 0) {
      const brand = detectBrand(clean);
      setValue('brand', brand);
      setValue('color', brandColors[brand] || '#6D5FFD');
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (isEditing) {
        await api.put('/cards/' + card.id, data);
      } else {
        await api.post('/cards', data);
      }
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
      <div className="relative glass-card-lg w-full max-w-md max-h-[90vh] overflow-y-auto p-6 m-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary">
            {isEditing ? 'Editar cartao' : 'Novo cartao'}
          </h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        <CreditCardVisual
          name={watchedName || 'SEU NOME'}
          lastFour={watchedDigits || '0000'}
          brand={watchedBrand}
          color={watchedColor}
        />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">Nome no cartao</label>
            <input className="input-field" placeholder="Nome do titular" {...register('name')} />
            {errors.name && <p className="text-danger text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">Ultimos 4 digitos</label>
            <input
              className="input-field"
              placeholder="0000"
              maxLength={4}
              value={watchedDigits}
              onChange={(e) => handleDigitsChange(e.target.value)}
            />
            {errors.lastFourDigits && <p className="text-danger text-xs mt-1">{errors.lastFourDigits.message}</p>}
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">Limite</label>
            <CurrencyInput
              value={watch('limitInCents')}
              onChange={(v) => setValue('limitInCents', v)}
            />
            {errors.limitInCents && <p className="text-danger text-xs mt-1">{errors.limitInCents.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Dia fechamento</label>
              <input type="number" min="1" max="31" className="input-field" {...register('closingDay', { valueAsNumber: true })} />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Dia vencimento</label>
              <input type="number" min="1" max="31" className="input-field" {...register('dueDay', { valueAsNumber: true })} />
            </div>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">Conta de pagamento</label>
            <select className="input-field" {...register('paymentAccountId')}>
              <option value="">Nenhuma</option>
              {accounts.map((a: any) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-3 rounded-xl border border-danger/30 text-danger text-sm hover:bg-danger/10 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar cartao'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}