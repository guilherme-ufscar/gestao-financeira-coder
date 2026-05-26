import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuthStore } from '../../lib/store/auth';
import api from '../../lib/api/client';

const schema = z.object({
  name: z.string().min(2, 'Minimo 2 caracteres'),
  email: z.string().email('E-mail invalido'),
  password: z.string().min(6, 'Minimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas nao conferem',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function Register() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  const onTurnstileSuccess = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  useEffect(() => {
    (window as any).onTurnstileSuccess = onTurnstileSuccess;
    return () => { delete (window as any).onTurnstileSuccess; };
  }, [onTurnstileSuccess]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!turnstileToken) {
      setError('Complete a verificacao de seguranca');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        turnstileToken,
      });
      setAuth(res.data.user, res.data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6">
      <h1 className="text-xl font-bold text-center mb-6 text-text-primary">Criar conta</h1>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm text-text-secondary mb-1">Nome</label>
          <input
            type="text"
            className="input-field"
            placeholder="Seu nome"
            {...register('name')}
          />
          {errors.name && <p className="text-danger text-xs mt-1">{errors.name.message}</p>}
        </div>

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
              placeholder="Minimo 6 caracteres"
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

        <div>
          <label className="block text-sm text-text-secondary mb-1">Confirmar senha</label>
          <input
            type="password"
            className="input-field"
            placeholder="Repita a senha"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && <p className="text-danger text-xs mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <div id="turnstile-container" className="flex justify-center">
          <div
            className="cf-turnstile"
            data-sitekey="0x4AAAAAADWxcIYnIuEowhAf"
            data-callback="onTurnstileSuccess"
          ></div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <UserPlus size={18} />
          {loading ? 'Criando...' : 'Criar conta'}
        </button>
      </form>

      <p className="text-center text-sm text-text-secondary mt-6">
        Ja tem conta?{' '}
        <Link to="/login" className="text-primary hover:underline font-medium">
          Entrar
        </Link>
      </p>
    </div>
  );
}
