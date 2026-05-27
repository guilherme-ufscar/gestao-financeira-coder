import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../../lib/api/client';
import BankLogo from '../../../components/ui/BankLogo';
import CurrencyInput from '../../../components/ui/CurrencyInput';

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatorio'),
  type: z.string().min(1, 'Tipo obrigatorio'),
  bankSlug: z.string().optional(),
  color: z.string(),
  balanceInCents: z.number(),
  isDefault: z.boolean(),
  yieldsEnabled: z.boolean(),
  yieldRatePercent: z.number().nullable().optional(),
  yieldCapInCents: z.number().nullable().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  account: any | null;
  existingAccounts?: any[];
  onClose: () => void;
  onSaved: () => void;
  onDelete?: () => void;
}

const accountTypes = [
  'Conta corrente',
  'Conta digital',
  'Poupanca',
  'Carteira fisica',
  'Investimentos',
  'Outro',
];

const banks = [
  { slug: 'nubank', name: 'Nubank', color: '#8B11F0' },
  { slug: 'itau', name: 'Itau', color: '#EC7000' },
  { slug: 'bradesco', name: 'Bradesco', color: '#CC092F' },
  { slug: 'bb', name: 'BB', color: '#FFEF00' },
  { slug: 'caixa', name: 'Caixa', color: '#005CA9' },
  { slug: 'santander', name: 'Santander', color: '#EC0000' },
  { slug: 'inter', name: 'Inter', color: '#FF7A00' },
  { slug: 'c6', name: 'C6', color: '#1A1A1A' },
  { slug: 'mercadopago', name: 'M. Pago', color: '#009EE3' },
  { slug: 'picpay', name: 'PicPay', color: '#21C25E' },
  { slug: 'neon', name: 'Neon', color: '#0066FF' },
  { slug: 'pagbank', name: 'PagBank', color: '#00A859' },
  { slug: 'outro', name: 'Outro', color: '#6D5FFD' },
];

export default function AccountForm({ account, existingAccounts = [], onClose, onSaved, onDelete }: Props) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!account;

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: account?.name || '',
      type: account?.type || 'Conta corrente',
      bankSlug: account?.bankSlug || '',
      color: account?.color || '#6D5FFD',
      balanceInCents: account?.balanceInCents || 0,
      isDefault: account?.isDefault || false,
      yieldsEnabled: account?.yieldsEnabled || false,
      yieldRatePercent: account?.yieldRatePercent || null,
      yieldCapInCents: account?.yieldCapInCents || null,
    },
  });

  const yieldsEnabled = watch('yieldsEnabled');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (isEditing) {
        await api.put('/accounts/' + account.id, data);
      } else {
        await api.post('/accounts', data);
      }
      onSaved();
    } catch {
      // handle
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative glass-card-lg w-full max-w-md max-h-[85vh] overflow-y-auto p-6 m-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary">
            {isEditing ? 'Editar conta' : 'Nova conta'}
          </h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">Banco</label>
            <div className="grid grid-cols-4 gap-2">
              {banks.map((bank) => (
                <button
                  key={bank.slug}
                  type="button"
                  onClick={() => {
                    setValue('bankSlug', bank.slug);
                    setValue('color', bank.color);
                    if (!isEditing) {
                      const sameName = existingAccounts.filter((a) =>
                        a.name.toLowerCase().startsWith(bank.name.toLowerCase())
                      );
                      const name = sameName.length > 0 ? `${bank.name} - ${sameName.length + 1}` : bank.name;
                      setValue('name', name);
                    }
                  }}
                  className="p-2 rounded-lg border border-border hover:border-primary text-center transition-colors"
                  style={{ borderColor: watch('bankSlug') === bank.slug ? bank.color : undefined }}
                >
                  <div className="w-6 h-6 mx-auto mb-1 flex items-center justify-center">
                    <BankLogo slug={bank.slug} size={24} />
                  </div>
                  <span className="text-[10px] text-text-secondary">{bank.name}</span>
                </button>
              ))}
            </div>
          </div>

          {isEditing && (
            <div>
              <label className="block text-sm text-text-secondary mb-1">Nome da conta</label>
              <input className="input-field" placeholder="Ex: Nubank" {...register('name')} />
              {errors.name && <p className="text-danger text-xs mt-1">{errors.name.message}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm text-text-secondary mb-1">Tipo</label>
            <select className="input-field" {...register('type')}>
              {accountTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {!isEditing && (
            <div>
              <label className="block text-sm text-text-secondary mb-1">Saldo inicial</label>
              <CurrencyInput
                value={watch('balanceInCents')}
                onChange={(v) => setValue('balanceInCents', v)}
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isDefault"
              className="w-4 h-4 rounded accent-primary"
              {...register('isDefault')}
            />
            <label htmlFor="isDefault" className="text-sm text-text-secondary">
              Conta padrao para lancamentos
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="yields"
              className="w-4 h-4 rounded accent-primary"
              {...register('yieldsEnabled')}
            />
            <label htmlFor="yields" className="text-sm text-text-secondary">
              Esta conta rende automaticamente
            </label>
          </div>

          {yieldsEnabled && (
            <div className="space-y-3 pl-7">
              <div>
                <label className="block text-xs text-text-tertiary mb-1">Taxa anual (%)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input-field"
                  placeholder="Ex: 100 (% do CDI)"
                  onChange={(e) => setValue('yieldRatePercent', parseFloat(e.target.value) || null)}
                  defaultValue={account?.yieldRatePercent || ''}
                />
              </div>
              <div>
                <label className="block text-xs text-text-tertiary mb-1">Teto de rendimento</label>
                <CurrencyInput
                  value={watch('yieldCapInCents') || 0}
                  onChange={(v) => setValue('yieldCapInCents', v || null)}
                  placeholder="R$ 0,00 (rende ate esse saldo)"
                />
              </div>
            </div>
          )}

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
              {loading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar conta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}