import { useEffect, useState } from 'react';
import { Plus, Building2, ArrowRightLeft } from 'lucide-react';
import api from '../../../lib/api/client';
import { formatCurrency } from '../../../lib/utils';
import BankLogo from '../../../components/ui/BankLogo';
import AccountForm from './AccountForm';
import TransferForm from './TransferForm';

interface Account {
  id: string;
  name: string;
  type: string;
  bankSlug: string | null;
  color: string;
  balanceInCents: number;
  isDefault: boolean;
  yieldsEnabled: boolean;
  yieldRatePercent: number | null;
}

export default function AccountsList() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const fetchAccounts = async () => {
    const { data } = await api.get('/accounts');
    setAccounts(data);
  };

  useEffect(() => { fetchAccounts(); }, []);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balanceInCents, 0);

  const handleDelete = async (id: string) => {
    await api.delete('/accounts/' + id);
    fetchAccounts();
  };

  return (
    <div className="p-5 space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-headline text-text-primary">Contas</h1>
        <div className="flex gap-2.5">
          <button
            onClick={() => setShowTransfer(true)}
            className="m3-icon-container-sm bg-surface-container hover:bg-surface-high transition-colors"
          >
            <ArrowRightLeft size={18} className="text-primary" />
          </button>
          <button
            onClick={() => { setEditingAccount(null); setShowForm(true); }}
            className="m3-fab-small"
          >
            <Plus size={18} />
          </button>
        </div>
      </header>

      <div className="m3-card-hero p-6">
        <p className="text-label text-on-primary-container/70 uppercase tracking-wider mb-1">Patrimonio em contas</p>
        <p className="text-display text-on-primary-container">{formatCurrency(totalBalance)}</p>
      </div>

      <div className="space-y-2.5">
        {accounts.map((account) => (
          <button
            key={account.id}
            onClick={() => { setEditingAccount(account); setShowForm(true); }}
            className="m3-card-elevated w-full p-4 flex items-center gap-3.5 hover:bg-surface-high transition-all duration-200 text-left"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: account.color + '18' }}
            >
              {account.bankSlug && account.bankSlug !== 'outro' ? (
                <BankLogo slug={account.bankSlug} size={28} />
              ) : (
                <Building2 size={18} style={{ color: account.color }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-body font-medium text-text-primary truncate">{account.name}</p>
                {account.isDefault && (
                  <span className="text-caption px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container font-semibold shrink-0">Padrao</span>
                )}
              </div>
              <p className="text-caption text-text-tertiary">{account.type}</p>
            </div>
            <div className="text-right">
              <p className={`text-body font-bold ${account.balanceInCents >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatCurrency(account.balanceInCents)}
              </p>
              {account.yieldsEnabled && (
                <p className="text-caption text-success font-medium">Rende {account.yieldRatePercent}%</p>
              )}
            </div>
          </button>
        ))}
        {accounts.length === 0 && (
          <div className="m3-card-filled p-10 text-center">
            <Building2 size={36} className="mx-auto mb-3 text-text-tertiary opacity-50" />
            <p className="text-text-tertiary text-body mb-4">Nenhuma conta cadastrada.</p>
            <button onClick={() => setShowForm(true)} className="m3-btn">
              Adicionar conta
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <AccountForm
          account={editingAccount}
          existingAccounts={accounts}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchAccounts(); }}
          onDelete={editingAccount ? () => { handleDelete(editingAccount.id); setShowForm(false); } : undefined}
        />
      )}

      {showTransfer && (
        <TransferForm
          accounts={accounts}
          onClose={() => setShowTransfer(false)}
          onSaved={() => { setShowTransfer(false); fetchAccounts(); }}
        />
      )}
    </div>
  );
}
