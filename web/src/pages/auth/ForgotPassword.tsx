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
      <div className="m3-card-elevated p-8 text-center animate-spring-pop">
        <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center mx-auto mb-5">
          <Mail size={36} className="text-on-primary-container" />
        </div>
        <h1 className="text-headline mb-3 text-text-primary">E-mail enviado</h1>
        <p className="text-body text-text-secondary mb-8">
          Verifique sua caixa de entrada para redefinir sua senha.
        </p>
        <Link to="/login" className="m3-btn-text text-label-lg">
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <div className="m3-card-elevated p-7 animate-fade-in-up">
      <h1 className="text-headline text-center mb-2 text-text-primary">Recuperar senha</h1>
      <p className="text-body text-text-secondary text-center mb-8">
        Informe seu e-mail para receber o link de recuperacao.
      </p>

      {error && (
        <div className="mb-5 p-4 rounded-xl bg-danger-container/30 border border-danger/20 text-danger text-sm">
          {error}
        </div>
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

        <button
          type="submit"
          disabled={loading}
          className="m3-btn w-full disabled:opacity-50"
        >
          <Mail size={18} />
          {loading ? 'Enviando...' : 'Enviar link'}
        </button>
      </form>

      <p className="text-center text-body text-text-secondary mt-8">
        <Link to="/login" className="text-primary hover:underline font-semibold">
          Voltar ao login
        </Link>
      </p>
    </div>
  );
}
