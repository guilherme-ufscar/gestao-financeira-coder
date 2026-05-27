import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuthStore } from '../../lib/store/auth';
import api from '../../lib/api/client';
import Turnstile from '../../components/ui/Turnstile';

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
    <div className="m3-card-elevated p-7 animate-fade-in-up">
      <h1 className="text-headline text-center mb-8 text-text-primary">Criar conta</h1>

      {error && (
        <div className="mb-5 p-4 rounded-xl bg-danger-container/30 border border-danger/20 text-danger text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-label text-text-secondary mb-2 pl-1">Nome</label>
          <input
            type="text"
            className="m3-input"
            placeholder="Seu nome"
            {...register('name')}
          />
          {errors.name && <p className="text-danger text-caption mt-2 pl-1">{errors.name.message}</p>}
        </div>

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
              placeholder="Minimo 6 caracteres"
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

        <div>
          <label className="block text-label text-text-secondary mb-2 pl-1">Confirmar senha</label>
          <input
            type="password"
            className="m3-input"
            placeholder="Repita a senha"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && <p className="text-danger text-caption mt-2 pl-1">{errors.confirmPassword.message}</p>}
        </div>

        <Turnstile onSuccess={onTurnstileSuccess} />

        <button
          type="submit"
          disabled={loading}
          className="m3-btn w-full disabled:opacity-50"
        >
          <UserPlus size={18} />
          {loading ? 'Criando...' : 'Criar conta'}
        </button>
      </form>

      <p className="text-center text-body text-text-secondary mt-8">
        Ja tem conta?{' '}
        <Link to="/login" className="text-primary hover:underline font-semibold">
          Entrar
        </Link>
      </p>
    </div>
  );
}
