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
      if (!creds) { setLoading(false); return; }
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
    if (saved) setBiometric(true);
    navigate('/');
  };

  if (showBiometricSetup) {
    return (
      <div className="m3-card-elevated p-8 text-center animate-scale-in">
        <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center mx-auto mb-5">
          <Fingerprint size={36} className="text-on-primary-container" />
        </div>
        <h2 className="text-headline text-text-primary mb-2">Ativar login por digital?</h2>
        <p className="text-body text-text-secondary mb-8">
          Nas proximas vezes, voce podera entrar usando apenas sua digital, sem precisar digitar a senha.
        </p>
        <div className="space-y-3">
          <button onClick={handleEnableBiometric} className="m3-btn w-full">
            <Fingerprint size={18} />
            Ativar digital
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3.5 text-sm text-text-secondary hover:text-text-primary transition-colors rounded-full"
          >
            Agora nao
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="m3-card-elevated p-7 animate-fade-in-up">
      <h1 className="text-headline text-center mb-8 text-text-primary">Entrar</h1>

      {error && (
        <div className="mb-5 p-4 rounded-xl bg-danger-container/30 border border-danger/20 text-danger text-sm">
          {error}
        </div>
      )}

      {biometricAvailable && biometricEnabled && Capacitor.isNativePlatform() && (
        <button
          onClick={handleBiometricLogin}
          disabled={loading}
          className="w-full mb-5 py-5 rounded-2xl border-2 border-primary/30 bg-primary-container/20 flex flex-col items-center gap-2.5 hover:bg-primary-container/30 transition-all duration-300 ease-spring disabled:opacity-50"
        >
          <Fingerprint size={36} className="text-primary" />
          <span className="text-sm text-primary font-semibold">
            {loading ? 'Verificando...' : 'Entrar com digital'}
          </span>
        </button>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-label text-text-secondary mb-2 pl-1">E-mail</label>
          <input
            type="email"
            className="m3-input"
            placeholder="seu@email.com"
            {...register('email')}
          />
          {errors.email && <p className="text-danger text-caption mt-2 pl-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-label text-text-secondary mb-2 pl-1">Senha</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="m3-input pr-12"
              placeholder="Sua senha"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-danger text-caption mt-2 pl-1">{errors.password.message}</p>}
        </div>

        <div className="text-right">
          <Link to="/recuperar-senha" className="text-label text-primary hover:underline">
            Esqueci minha senha
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="m3-btn w-full disabled:opacity-50"
        >
          <LogIn size={18} />
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="text-center text-body text-text-secondary mt-8">
        Nao tem conta?{' '}
        <Link to="/cadastro" className="text-primary hover:underline font-semibold">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
