import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Bell, LogOut, Moon, Sun, Monitor, ChevronRight, Lock } from 'lucide-react';
import { useAuthStore } from '../../../lib/store/auth';
import api from '../../../lib/api/client';

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const biometricEnabled = useAuthStore((s) => s.biometricEnabled);
  const setBiometric = useAuthStore((s) => s.setBiometric);
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('cofrin-theme') || 'auto';
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    localStorage.setItem('cofrin-theme', theme);
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme === 'dark' ? '' : 'light');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const themeOptions = [
    { value: 'auto', label: 'Automatico', icon: Monitor },
    { value: 'dark', label: 'Escuro', icon: Moon },
    { value: 'light', label: 'Claro', icon: Sun },
  ];

  return (
    <div className="p-4 space-y-5">
      <header>
        <h1 className="text-lg font-bold text-text-primary">Configuracoes</h1>
      </header>

      <div className="glass-card-gradient p-5 flex items-center gap-4 animate-fade-in-up">
        <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
          <span className="text-white text-xl font-bold">{(user?.name || 'U')[0].toUpperCase()}</span>
        </div>
        <div className="flex-1">
          <p className="text-base font-bold text-text-primary">{user?.name}</p>
          <p className="text-xs text-text-secondary">{user?.email}</p>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider px-1">Aparencia</h2>
        <div className="glass-card p-2">
          <div className="grid grid-cols-3 gap-1.5">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const isActive = currentTheme === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleThemeChange(opt.value)}
                  className={'flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all ' +
                    (isActive ? 'bg-primary/10 border border-primary/30' : 'hover:bg-surface-hover')}
                >
                  <Icon size={18} className={isActive ? 'text-primary' : 'text-text-tertiary'} />
                  <span className={'text-[11px] font-medium ' + (isActive ? 'text-primary' : 'text-text-secondary')}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider px-1">Seguranca</h2>
        <div className="glass-card overflow-hidden">
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="w-full p-4 flex items-center gap-3 hover:bg-surface-hover transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center">
              <Lock size={16} className="text-warning" />
            </div>
            <span className="text-sm text-text-primary flex-1 text-left">Alterar senha</span>
            <ChevronRight size={16} className="text-text-tertiary" />
          </button>
          {showPasswordForm && (
            <div className="px-4 pb-4 space-y-3 animate-fade-in-up">
              <input
                type="password"
                className="input-field"
                placeholder="Senha atual"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
              <input
                type="password"
                className="input-field"
                placeholder="Nova senha (min. 6 caracteres)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              {passwordMsg && (
                <p className={'text-xs ' + (passwordMsg.includes('sucesso') ? 'text-success' : 'text-danger')}>{passwordMsg}</p>
              )}
              <button
                onClick={async () => {
                  try {
                    await api.post('/auth/change-password', { oldPassword, newPassword });
                    setPasswordMsg('Senha alterada com sucesso');
                    setOldPassword('');
                    setNewPassword('');
                  } catch {
                    setPasswordMsg('Erro ao alterar senha');
                  }
                }}
                disabled={newPassword.length < 6}
                className="btn-primary w-full text-sm disabled:opacity-40"
              >
                Salvar nova senha
              </button>
            </div>
          )}
          <div className="border-t border-border" />
          <div className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <Shield size={16} className="text-accent" />
            </div>
            <span className="text-sm text-text-primary flex-1">Biometria</span>
            <button
              onClick={() => setBiometric(!biometricEnabled)}
              className={'w-11 h-6 rounded-full transition-all relative ' +
                (biometricEnabled ? 'bg-primary' : 'bg-surface border border-border')}
            >
              <div className={'w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all ' +
                (biometricEnabled ? 'left-[22px]' : 'left-0.5')} />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider px-1">Notificacoes</h2>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell size={16} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-text-primary">Notificacoes push</p>
              <p className="text-[10px] text-text-tertiary">Vencimentos, faturas e alertas</p>
            </div>
            <span className="text-[10px] px-2 py-1 rounded-full bg-warning/10 text-warning">Em breve</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="glass-card w-full p-4 flex items-center gap-3 hover:bg-danger/5 hover:border-danger/20 transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-danger/10 flex items-center justify-center">
          <LogOut size={16} className="text-danger" />
        </div>
        <span className="text-sm font-medium text-danger">Sair da conta</span>
      </button>
    </div>
  );
}
