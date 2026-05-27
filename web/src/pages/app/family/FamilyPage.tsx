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
    const [circlesRes, invitesRes] = await Promise.all([api.get('/family/circles'), api.get('/family/invites')]);
    setCircles(circlesRes.data); setInvites(invitesRes.data);
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
    setCircleName(''); setShowCreate(false); setLoading(false); fetchData();
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim() || !selectedCircle) return;
    setLoading(true);
    await api.post('/family/circles/' + selectedCircle.id + '/invite', { email: inviteEmail });
    setInviteEmail(''); setShowInvite(false); setLoading(false);
  };

  const acceptInvite = async (id: string) => { await api.post('/family/invites/' + id + '/accept'); fetchData(); };
  const rejectInvite = async (id: string) => { await api.post('/family/invites/' + id + '/reject'); fetchData(); };

  return (
    <div className="p-5 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-headline text-text-primary">Gestao Familiar</h1>
        <div className="flex gap-2.5">
          {circles.length === 0 && (
            <button onClick={() => setShowJoin(true)} className="m3-icon-container-sm bg-surface-container hover:bg-surface-high transition-colors">
              <Hash size={18} className="text-text-primary" />
            </button>
          )}
          {circles.length > 0 && (
            <button onClick={() => setShowInvite(true)} className="m3-fab-small">
              <UserPlus size={18} />
            </button>
          )}
        </div>
      </header>

      {invites.length > 0 && (
        <div className="space-y-2.5 animate-fade-in-up">
          <h2 className="text-caption font-semibold text-text-tertiary uppercase tracking-wider">Convites pendentes</h2>
          {invites.map((inv: any) => (
            <div key={inv.id} className="m3-card-elevated p-4 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-primary-container/30 flex items-center justify-center">
                <Mail size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body font-medium text-text-primary truncate">{inv.circle?.name}</p>
                <p className="text-caption text-text-tertiary">Convite para participar</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => acceptInvite(inv.id)} className="w-9 h-9 rounded-full bg-success/15 flex items-center justify-center hover:bg-success/25 transition-colors">
                  <Check size={16} className="text-success" />
                </button>
                <button onClick={() => rejectInvite(inv.id)} className="w-9 h-9 rounded-full bg-danger/15 flex items-center justify-center hover:bg-danger/25 transition-colors">
                  <X size={16} className="text-danger" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {circles.length === 0 ? (
        <div className="m3-card-hero p-10 text-center animate-fade-in-up">
          <div className="w-20 h-20 rounded-2xl bg-primary-container/50 flex items-center justify-center mx-auto mb-5">
            <Users size={32} className="text-on-primary-container" />
          </div>
          <h2 className="text-title-lg text-on-primary-container mb-2">Crie seu circulo familiar</h2>
          <p className="text-body text-on-primary-container/70 mb-6 max-w-xs mx-auto">
            Convide membros da familia para acompanhar as financas juntos
          </p>
          <button onClick={() => setShowCreate(true)} className="m3-btn">
            <Plus size={18} /> Criar circulo
          </button>
          <button onClick={() => setShowJoin(true)} className="block mx-auto mt-4 m3-btn-text text-label">
            Tenho um codigo de grupo
          </button>
        </div>
      ) : (
        <>
          {summary && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="m3-card-hero p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <Users size={18} className="text-on-primary-container" />
                  <h2 className="text-title font-bold text-on-primary-container">{selectedCircle?.name}</h2>
                  <span className="text-caption px-2.5 py-1 rounded-full bg-on-primary-container/10 text-on-primary-container ml-auto">
                    {summary.members?.length || 0} membros
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-xl bg-on-primary-container/10 flex items-center justify-center mx-auto mb-1.5">
                      <Wallet size={16} className="text-on-primary-container" />
                    </div>
                    <p className="text-label font-bold text-on-primary-container">{formatCurrency(summary.totalBalance || 0)}</p>
                    <p className="text-caption text-on-primary-container/60">Saldo</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center mx-auto mb-1.5">
                      <TrendingUp size={16} className="text-success" />
                    </div>
                    <p className="text-label font-bold text-success">{formatCurrency(summary.monthIncome || 0)}</p>
                    <p className="text-caption text-on-primary-container/60">Receitas</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-xl bg-danger/15 flex items-center justify-center mx-auto mb-1.5">
                      <TrendingDown size={16} className="text-danger" />
                    </div>
                    <p className="text-label font-bold text-danger">{formatCurrency(summary.monthExpenses || 0)}</p>
                    <p className="text-caption text-on-primary-container/60">Despesas</p>
                  </div>
                </div>
              </div>

              <div className="m3-card-elevated p-5">
                <h3 className="text-title text-text-primary mb-4">Membros</h3>
                <div className="space-y-3">
                  {summary.members?.map((m: any) => (
                    <div key={m.id} className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-on-primary text-label font-bold">{(m.name || 'U')[0].toUpperCase()}</span>
                      </div>
                      <p className="text-body font-medium text-text-primary flex-1">{m.name}</p>
                      {m.role === 'admin' && <Crown size={16} className="text-warning" />}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={async () => {
                  if (!confirm('Tem certeza que deseja excluir este circulo? Todos os membros serao removidos.')) return;
                  try { await api.delete('/family/circles/' + selectedCircle.id); fetchData(); }
                  catch (err: any) { alert(err.response?.data?.message || 'Erro ao excluir'); }
                }}
                className="m3-btn-outlined w-full border-danger/40 text-danger hover:bg-danger/10"
              >
                <Trash2 size={16} /> Excluir circulo
              </button>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative m3-dialog w-full max-w-md p-7 m-4 animate-slide-up sm:animate-scale-in">
            <h2 className="text-title-lg text-text-primary mb-5">Novo circulo familiar</h2>
            <input className="m3-input mb-5" placeholder="Nome do circulo (ex: Familia Silva)" value={circleName} onChange={(e) => setCircleName(e.target.value)} autoFocus />
            <button onClick={createCircle} disabled={loading || !circleName.trim()} className="m3-btn w-full disabled:opacity-40">
              {loading ? 'Criando...' : 'Criar circulo'}
            </button>
          </div>
        </div>
      )}

      {showInvite && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInvite(false)} />
          <div className="relative m3-dialog w-full max-w-md p-7 m-4 animate-slide-up sm:animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-title-lg text-text-primary">Convidar membro</h2>
              <button onClick={() => setShowInvite(false)} className="w-8 h-8 rounded-full bg-surface-high flex items-center justify-center text-text-tertiary hover:text-text-primary">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-5">
              <div className="m3-card-filled p-5 rounded-xl">
                <p className="text-caption text-text-tertiary uppercase tracking-wider mb-2">Codigo do grupo</p>
                <div className="flex items-center gap-3">
                  <span className="text-display-lg font-mono font-bold text-primary tracking-widest">
                    {selectedCircle?.joinCode || '----'}
                  </span>
                  <button onClick={() => { navigator.clipboard.writeText(selectedCircle?.joinCode || ''); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="w-10 h-10 rounded-full bg-primary-container/30 flex items-center justify-center hover:bg-primary-container/50 transition-colors">
                    {copied ? <Check size={18} className="text-success" /> : <Copy size={18} className="text-primary" />}
                  </button>
                </div>
                <p className="text-caption text-text-tertiary mt-2">Compartilhe este codigo para alguem entrar no grupo</p>
              </div>
              <div className="relative flex items-center gap-3">
                <div className="flex-1 m3-divider" />
                <span className="text-caption text-text-tertiary uppercase">ou convide por email</span>
                <div className="flex-1 m3-divider" />
              </div>
              <div>
                <input type="email" className="m3-input mb-4" placeholder="E-mail do membro" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                <button onClick={sendInvite} disabled={loading || !inviteEmail.trim()} className="m3-btn w-full disabled:opacity-40">
                  <Mail size={16} /> {loading ? 'Enviando...' : 'Enviar convite por email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showJoin && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowJoin(false); setJoinError(''); }} />
          <div className="relative m3-dialog w-full max-w-md p-7 m-4 animate-slide-up sm:animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-title-lg text-text-primary">Entrar em um grupo</h2>
              <button onClick={() => { setShowJoin(false); setJoinError(''); }} className="w-8 h-8 rounded-full bg-surface-high flex items-center justify-center text-text-tertiary hover:text-text-primary">
                <X size={18} />
              </button>
            </div>
            <p className="text-body text-text-secondary mb-5">Digite o codigo de 4 digitos do grupo familiar</p>
            <input className="m3-input text-center text-display font-mono tracking-[0.5em] uppercase mb-4"
              placeholder="XXXX" maxLength={4} value={joinCode}
              onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(''); }} autoFocus />
            {joinError && <p className="text-danger text-caption mb-4">{joinError}</p>}
            <button
              onClick={async () => {
                if (joinCode.length !== 4) return;
                setLoading(true);
                try { await api.post('/family/circles/join', { code: joinCode }); setShowJoin(false); setJoinCode(''); fetchData(); }
                catch (err: any) { setJoinError(err.response?.data?.message || 'Codigo invalido'); }
                finally { setLoading(false); }
              }}
              disabled={loading || joinCode.length !== 4}
              className="m3-btn w-full disabled:opacity-40"
            >
              {loading ? 'Entrando...' : 'Entrar no grupo'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
