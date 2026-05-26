import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn, Fingerprint } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useAuthStore } from '../../lib/store/auth';
import api from '../../lib/api/client';
import { isBiometricAvailable, getCredentials, saveCredentials } from '../../lib/biometric';

const schema = z.object({
  email: z.string().email('E-mail invalido'),
  password: z.string().min(6, 'Minimo 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const biometricEnabled = useAuthStore((s) => s.biometricEnabled);
  const setBiometric = useAuthStore((s) => s.setBiometric);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [pendingRefreshToken, setPendingRefreshToken] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    const available = await isBiometricAvailable();
    setBiometricAvailable(available);

    if (available && biometricEnabled && Capacitor.isNativePlatform()) {
      handleBiometricLogin();
    }
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const creds = await getCredentials();
      if (!creds) {
        setLoading(false);
        return;
      }

      const res = await api.post('/auth/refresh-biometric', {
        email: creds.email,
        refreshToken: creds.refreshToken,
      });

      setAuth(res.data.user, res.data.token);

      if (res.data.refreshToken) {
        await saveCredentials(creds.email, res.data.refreshToken);
      }

      navigate('/');
    } catch {
      setError('Sessao expirada. Faca login novamente.');
      setBiometric(false);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', data);
      setAuth(res.data.user, res.data.token);

      if (biometricAvailable && !biometricEnabled && Capacitor.isNativePlatform()) {
        setPendingEmail(data.email);
        setPendingRefreshToken(res.data.refreshToken || res.data.token);
        setShowBiometricSetup(true);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableBiometric = async () => {
    const saved = await saveCredentials(pendingEmail, pendingRefreshToken);
    if (saved) {
      setBiometric(true);
    }
    navigate('/');
  };

  const handleSkipBiometric = () => {
    navigate('/');
  };

  if (showBiometricSetup) {
    return (
      <div className="glass-card p-6 text-center">
        <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
          <Fingerprint size={32} className="text-white" />
        </div>
        <h2 className="text-lg font-bold text-text-primary mb-2">Ativar login por digital?</h2>
        <p className="text-sm text-text-secondary mb-6">
          Nas proximas vezes, voce podera entrar usando apenas sua digital, sem precisar digitar a senha.
        </p>
        <div className="space-y-3">
          <button
            onClick={handleEnableBiometric}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Fingerprint size={18} />
            Ativar digital
          </button>
          <button
            onClick={handleSkipBiometric}
            className="w-full py-3 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Agora nao
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h1 className="text-xl font-bold text-center mb-6 text-text-primary">Entrar</h1>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
          {error}
        </div>
      )}

      {biometricAvailable && biometricEnabled && Capacitor.isNativePlatform() && (
        <button
          onClick={handleBiometricLogin}
          disabled={loading}
          className="w-full mb-4 py-4 rounded-xl border border-primary/30 bg-primary/5 flex flex-col items-center gap-2 hover:bg-primary/10 transition-colors disabled:opacity-50"
        >
          <Fingerprint size={32} className="text-primary" />
          <span className="text-sm text-primary font-medium">
            {loading ? 'Verificando...' : 'Entrar com digital'}
          </span>
        </button>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm text-text-secondary mb-1">E-mail</label>
          <input
            type="email"
            className="input-field"
            placeholder="seu@email.com"
            {...register('email')}
          />
          {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">Senha</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-field pr-10"
              placeholder="Sua senha"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
        </div>

        <div className="text-right">
          <Link to="/recuperar-senha" className="text-sm text-primary hover:underline">
            Esqueci minha senha
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <LogIn size={18} />
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="text-center text-sm text-text-secondary mt-6">
        Nao tem conta?{' '}
        <Link to="/cadastro" className="text-primary hover:underline font-medium">
          Criar conta
        </Link>
      </p>
    </div>
  );
}