import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, Moon, Sun, Monitor, Lock } from 'lucide-react';
import { useAuthStore } from '../../../lib/store/auth';
import api from '../../../lib/api/client';

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const biometricEnabled = useAuthStore((s) => s.biometricEnabled);
  const setBiometric = useAuthStore((s) => s.setBiometric);
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('cofrin-theme') || 'auto');
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

  const handleLogout = () => { logout(); navigate('/login'); };

  const themeOptions = [
    { value: 'auto', label: 'Automatico', icon: Monitor },
    { value: 'dark', label: 'Escuro', icon: Moon },
    { value: 'light', label: 'Claro', icon: Sun },
  ];

  return (
    <div className="p-5 space-y-6">
      <header>
        <h1 className="text-headline text-text-primary">Configuracoes</h1>
      </header>

      <div className="m3-card-hero p-6 flex items-center gap-4 animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-elevation-2">
          <span className="text-on-primary text-xl font-bold">{(user?.name || 'U')[0].toUpperCase()}</span>
        </div>
        <div className="flex-1">
          <p className="text-title font-bold text-on-primary-container">{user?.name}</p>
          <p className="text-label text-on-primary-container/70">{user?.email}</p>
        </div>
      </div>

      <div className="space-y-2.5">
        <h2 className="text-caption font-semibold text-text-tertiary uppercase tracking-wider px-1">Aparencia</h2>
        <div className="m3-card-elevated p-3">
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const isActive = currentTheme === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleThemeChange(opt.value)}
                  className={'flex flex-col items-center gap-2 py-4 rounded-xl transition-all duration-200 ease-spring ' +
                    (isActive ? 'bg-primary-container shadow-elevation-1 scale-[1.02]' : 'hover:bg-surface-high')}
                >
                  <Icon size={20} className={isActive ? 'text-on-primary-container' : 'text-text-tertiary'} />
                  <span className={'text-caption font-medium ' + (isActive ? 'text-on-primary-container' : 'text-text-secondary')}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        <h2 className="text-caption font-semibold text-text-tertiary uppercase tracking-wider px-1">Seguranca</h2>
        <div className="m3-card-elevated overflow-hidden">
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="w-full p-4 flex items-center gap-3.5 hover:bg-surface-high transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-warning/12 flex items-center justify-center">
              <Lock size={18} className="text-warning" />
            </div>
            <span className="text-body text-text-primary flex-1 text-left font-medium">Alterar senha</span>
          </button>
          {showPasswordForm && (
            <div className="px-5 pb-5 space-y-3 animate-fade-in-up">
              <input type="password" className="m3-input" placeholder="Senha atual" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
              <input type="password" className="m3-input" placeholder="Nova senha (min. 6 caracteres)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              {passwordMsg && (
                <p className={'text-caption pl-1 ' + (passwordMsg.includes('sucesso') ? 'text-success' : 'text-danger')}>{passwordMsg}</p>
              )}
              <button
                onClick={async () => {
                  try {
                    await api.post('/auth/change-password', { oldPassword, newPassword });
                    setPasswordMsg('Senha alterada com sucesso');
                    setOldPassword(''); setNewPassword('');
                  } catch { setPasswordMsg('Erro ao alterar senha'); }
                }}
                disabled={newPassword.length < 6}
                className="m3-btn w-full disabled:opacity-40"
              >
                Salvar nova senha
              </button>
            </div>
          )}
          <div className="m3-divider mx-4" />
          <div className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center">
              <Lock size={18} className="text-primary" />
            </div>
            <span className="text-body text-text-primary flex-1 font-medium">Biometria</span>
            <button
              onClick={() => setBiometric(!biometricEnabled)}
              className={'m3-switch ' + (biometricEnabled ? 'm3-switch-active' : '')}
            >
              <div className="m3-switch-thumb" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        <h2 className="text-caption font-semibold text-text-tertiary uppercase tracking-wider px-1">Notificacoes</h2>
        <div className="m3-card-elevated p-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center">
              <Bell size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-body text-text-primary font-medium">Notificacoes push</p>
              <p className="text-caption text-text-tertiary">Vencimentos, faturas e alertas</p>
            </div>
            <span className="text-caption px-3 py-1 rounded-full bg-warning-container/30 text-warning font-medium">Em breve</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="m3-card-outlined w-full p-4 flex items-center gap-3.5 hover:bg-danger/5 hover:border-danger/30 transition-all duration-200"
      >
        <div className="w-10 h-10 rounded-xl bg-danger/12 flex items-center justify-center">
          <LogOut size={18} className="text-danger" />
        </div>
        <span className="text-body font-medium text-danger">Sair da conta</span>
      </button>
    </div>
  );
}
