import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail } from 'lucide-react';
import api from '../../lib/api/client';

const schema = z.object({
  email: z.string().email('E-mail invalido'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', data);
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao enviar e-mail');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="glass-card p-6 text-center">
        <Mail size={48} className="mx-auto mb-4 text-primary" />
        <h1 className="text-xl font-bold mb-2 text-text-primary">E-mail enviado</h1>
        <p className="text-text-secondary text-sm mb-6">
          Verifique sua caixa de entrada para redefinir sua senha.
        </p>
        <Link to="/login" className="text-primary hover:underline font-medium text-sm">
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h1 className="text-xl font-bold text-center mb-2 text-text-primary">Recuperar senha</h1>
      <p className="text-text-secondary text-sm text-center mb-6">
        Informe seu e-mail para receber o link de recuperacao.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
          {error}
        </div>
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

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Mail size={18} />
          {loading ? 'Enviando...' : 'Enviar link'}
        </button>
      </form>

      <p className="text-center text-sm text-text-secondary mt-6">
        <Link to="/login" className="text-primary hover:underline font-medium">
          Voltar ao login
        </Link>
      </p>
    </div>
  );
}
