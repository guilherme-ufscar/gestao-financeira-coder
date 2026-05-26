import { useEffect, useState } from 'react';
import { Plus, Building2, ArrowRightLeft } from 'lucide-react';
import api from '../../../lib/api/client';
import { formatCurrency } from '../../../lib/utils';
import AccountForm from './AccountForm';
import TransferForm from './TransferForm';

interface Account {
  id: string;
  name: string;
  type: string;
  bankSlug: string | null;
  color: string;
  balanceInCents: number;
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
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary">Contas</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTransfer(true)}
            className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center border border-border hover:bg-surface-hover transition-colors"
          >
            <ArrowRightLeft size={16} className="text-primary" />
          </button>
          <button
            onClick={() => { setEditingAccount(null); setShowForm(true); }}
            className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center"
          >
            <Plus size={16} className="text-white" />
          </button>
        </div>
      </header>

      <div className="glass-card-lg p-5">
        <p className="text-text-secondary text-xs uppercase tracking-wide mb-1">Patrimonio em contas</p>
        <p className="text-2xl font-bold text-text-primary">{formatCurrency(totalBalance)}</p>
      </div>

      <div className="space-y-2">
        {accounts.map((account) => (
          <button
            key={account.id}
            onClick={() => { setEditingAccount(account); setShowForm(true); }}
            className="glass-card w-full p-4 flex items-center gap-3 hover:bg-surface-hover transition-colors text-left"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: account.color + '20' }}
            >
              <Building2 size={18} style={{ color: account.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{account.name}</p>
              <p className="text-xs text-text-tertiary">{account.type}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-semibold ${account.balanceInCents >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatCurrency(account.balanceInCents)}
              </p>
              {account.yieldsEnabled && (
                <p className="text-[10px] text-accent">Rende {account.yieldRatePercent}%</p>
              )}
            </div>
          </button>
        ))}
        {accounts.length === 0 && (
          <div className="glass-card p-6 text-center">
            <Building2 size={32} className="mx-auto mb-2 text-text-tertiary" />
            <p className="text-text-tertiary text-sm">Nenhuma conta cadastrada.</p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary mt-4 text-sm"
            >
              Adicionar conta
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <AccountForm
          account={editingAccount}
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
