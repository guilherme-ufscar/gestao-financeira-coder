import { useEffect, useState } from 'react';
import { Users, Plus, Mail, Check, X, Crown, UserPlus, TrendingUp, TrendingDown, Wallet, Copy, Hash, Trash2 } from 'lucide-react';
import api from '../../../lib/api/client';
import { formatCurrency } from '../../../lib/utils';

export default function FamilyPage() {
  const [circles, setCircles] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [circleName, setCircleName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [selectedCircle, setSelectedCircle] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joinError, setJoinError] = useState('');

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
        <div className="flex gap-2">
          {circles.length === 0 && (
            <button
              onClick={() => setShowJoin(true)}
              className="w-9 h-9 rounded-xl glass-card flex items-center justify-center"
            >
              <Hash size={16} className="text-text-primary" />
            </button>
          )}
          {circles.length > 0 && (
            <button
              onClick={() => setShowInvite(true)}
              className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center"
            >
              <UserPlus size={16} className="text-white" />
            </button>
          )}
        </div>
      </header>

      <div className="glass-card p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <Users size={16} className="text-primary" />
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          Compartilhe suas financas com a familia. Crie um grupo, convide membros por email ou codigo e acompanhem juntos receitas, despesas e saldos.
        </p>
      </div>

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
          <button onClick={() => setShowJoin(true)} className="mt-3 text-sm text-primary hover:underline">
            Tenho um codigo de grupo
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

              <button
                onClick={async () => {
                  if (!confirm('Tem certeza que deseja excluir este circulo? Todos os membros serao removidos.')) return;
                  try {
                    await api.delete('/family/circles/' + selectedCircle.id);
                    fetchData();
                  } catch (err: any) {
                    alert(err.response?.data?.message || 'Erro ao excluir');
                  }
                }}
                className="w-full py-3 rounded-xl border border-danger/30 text-danger text-sm hover:bg-danger/10 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={14} /> Excluir circulo
              </button>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowInvite(false)} />
          <div className="relative glass-card-lg w-full max-w-md p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary">Convidar membro</h2>
              <button onClick={() => setShowInvite(false)} className="text-text-tertiary hover:text-text-primary">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="glass-card p-4">
                <p className="text-xs text-text-tertiary uppercase tracking-wide mb-2">Codigo do grupo</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-mono font-bold text-primary tracking-widest">
                    {selectedCircle?.joinCode || '----'}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedCircle?.joinCode || '');
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                  >
                    {copied ? <Check size={16} className="text-success" /> : <Copy size={16} className="text-primary" />}
                  </button>
                </div>
                <p className="text-[10px] text-text-tertiary mt-2">Compartilhe este codigo para alguem entrar no grupo</p>
              </div>

              <div className="relative flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-text-tertiary uppercase">ou convide por email</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div>
                <input
                  type="email"
                  className="input-field mb-3"
                  placeholder="E-mail do membro"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <button onClick={sendInvite} disabled={loading || !inviteEmail.trim()} className="btn-primary w-full disabled:opacity-40">
                  <Mail size={14} className="inline mr-1.5" />
                  {loading ? 'Enviando...' : 'Enviar convite por email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showJoin && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => { setShowJoin(false); setJoinError(''); }} />
          <div className="relative glass-card-lg w-full max-w-md p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary">Entrar em um grupo</h2>
              <button onClick={() => { setShowJoin(false); setJoinError(''); }} className="text-text-tertiary hover:text-text-primary">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-text-secondary mb-4">Digite o codigo de 4 digitos do grupo familiar</p>
            <input
              className="input-field text-center text-2xl font-mono tracking-[0.5em] uppercase mb-3"
              placeholder="XXXX"
              maxLength={4}
              value={joinCode}
              onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(''); }}
              autoFocus
            />
            {joinError && <p className="text-danger text-xs mb-3">{joinError}</p>}
            <button
              onClick={async () => {
                if (joinCode.length !== 4) return;
                setLoading(true);
                try {
                  await api.post('/family/circles/join', { code: joinCode });
                  setShowJoin(false);
                  setJoinCode('');
                  fetchData();
                } catch (err: any) {
                  setJoinError(err.response?.data?.message || 'Codigo invalido');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading || joinCode.length !== 4}
              className="btn-primary w-full disabled:opacity-40"
            >
              <Hash size={14} className="inline mr-1.5" />
              {loading ? 'Entrando...' : 'Entrar no grupo'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
