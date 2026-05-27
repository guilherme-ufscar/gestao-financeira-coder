import { useEffect, useState } from 'react';
import { Users, Plus, Mail, Check, X, Crown, UserPlus, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import api from '../../../lib/api/client';
import { formatCurrency } from '../../../lib/utils';

export default function FamilyPage() {
  const [circles, setCircles] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [circleName, setCircleName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedCircle, setSelectedCircle] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    const [circlesRes, invitesRes] = await Promise.all([
      api.get('/family/circles'),
      api.get('/family/invites'),
    ]);
    setCircles(circlesRes.data);
    setInvites(invitesRes.data);

    if (circlesRes.data.length > 0) {
      const circle = circlesRes.data[0];
      setSelectedCircle(circle);
      const { data } = await api.get('/family/circles/' + circle.id + '/summary');
      setSummary(data);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const createCircle = async () => {
    if (!circleName.trim()) return;
    setLoading(true);
    await api.post('/family/circles', { name: circleName });
    setCircleName('');
    setShowCreate(false);
    setLoading(false);
    fetchData();
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim() || !selectedCircle) return;
    setLoading(true);
    await api.post('/family/circles/' + selectedCircle.id + '/invite', { email: inviteEmail });
    setInviteEmail('');
    setShowInvite(false);
    setLoading(false);
  };

  const acceptInvite = async (id: string) => {
    await api.post('/family/invites/' + id + '/accept');
    fetchData();
  };

  const rejectInvite = async (id: string) => {
    await api.post('/family/invites/' + id + '/reject');
    fetchData();
  };

  return (
    <div className="p-4 space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary">Gestao Familiar</h1>
        {circles.length > 0 && (
          <button
            onClick={() => setShowInvite(true)}
            className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center"
          >
            <UserPlus size={16} className="text-white" />
          </button>
        )}
      </header>

      {invites.length > 0 && (
        <div className="space-y-2 animate-fade-in-up">
          <h2 className="text-xs font-semibold text-text-secondary uppercase">Convites pendentes</h2>
          {invites.map((inv: any) => (
            <div key={inv.id} className="glass-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{inv.circle?.name}</p>
                <p className="text-[10px] text-text-tertiary">Convite para participar</p>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => acceptInvite(inv.id)}
                  className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center hover:bg-success/20 transition-colors"
                >
                  <Check size={14} className="text-success" />
                </button>
                <button
                  onClick={() => rejectInvite(inv.id)}
                  className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center hover:bg-danger/20 transition-colors"
                >
                  <X size={14} className="text-danger" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {circles.length === 0 ? (
        <div className="glass-card-gradient card-glow p-8 text-center animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-primary" />
          </div>
          <h2 className="text-base font-bold text-text-primary mb-2">Crie seu circulo familiar</h2>
          <p className="text-sm text-text-secondary mb-5 max-w-xs mx-auto">
            Convide membros da familia para acompanhar as financas juntos
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={16} className="inline mr-1.5" /> Criar circulo
          </button>
        </div>
      ) : (
        <>
          {summary && (
            <div className="space-y-3 animate-fade-in-up">
              <div className="glass-card-gradient card-glow p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={16} className="text-primary" />
                  <h2 className="text-sm font-bold text-text-primary">{selectedCircle?.name}</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary ml-auto">
                    {summary.members?.length || 0} membros
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-1">
                      <Wallet size={14} className="text-primary" />
                    </div>
                    <p className="text-xs font-bold text-text-primary">{formatCurrency(summary.totalBalance || 0)}</p>
                    <p className="text-[9px] text-text-tertiary">Saldo</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-1">
                      <TrendingUp size={14} className="text-success" />
                    </div>
                    <p className="text-xs font-bold text-success">{formatCurrency(summary.monthIncome || 0)}</p>
                    <p className="text-[9px] text-text-tertiary">Receitas</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center mx-auto mb-1">
                      <TrendingDown size={14} className="text-danger" />
                    </div>
                    <p className="text-xs font-bold text-danger">{formatCurrency(summary.monthExpenses || 0)}</p>
                    <p className="text-[9px] text-text-tertiary">Despesas</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4">
                <h3 className="section-title mb-3">Membros</h3>
                <div className="space-y-2.5">
                  {summary.members?.map((m: any) => (
                    <div key={m.id} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{(m.name || 'U')[0].toUpperCase()}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-primary">{m.name}</p>
                      </div>
                      {m.role === 'admin' && (
                        <Crown size={14} className="text-warning" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowCreate(false)} />
          <div className="relative glass-card-lg w-full max-w-md p-6 m-4">
            <h2 className="text-lg font-bold text-text-primary mb-4">Novo circulo familiar</h2>
            <input
              className="input-field mb-4"
              placeholder="Nome do circulo (ex: Familia Silva)"
              value={circleName}
              onChange={(e) => setCircleName(e.target.value)}
              autoFocus
            />
            <button onClick={createCircle} disabled={loading || !circleName.trim()} className="btn-primary w-full disabled:opacity-40">
              {loading ? 'Criando...' : 'Criar circulo'}
            </button>
          </div>
        </div>
      )}

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowInvite(false)} />
          <div className="relative glass-card-lg w-full max-w-md p-6 m-4">
            <h2 className="text-lg font-bold text-text-primary mb-2">Convidar membro</h2>
            <p className="text-sm text-text-secondary mb-4">Um e-mail sera enviado com o convite</p>
            <input
              type="email"
              className="input-field mb-4"
              placeholder="E-mail do membro"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              autoFocus
            />
            <button onClick={sendInvite} disabled={loading || !inviteEmail.trim()} className="btn-primary w-full disabled:opacity-40">
              {loading ? 'Enviando...' : 'Enviar convite'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
