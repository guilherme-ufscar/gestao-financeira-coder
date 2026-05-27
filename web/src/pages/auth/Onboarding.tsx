import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, PieChart, CreditCard, CalendarDays, Users, TrendingUp,
  Building2, Target, Repeat, Shield, Bell, ArrowRight, ChevronRight
} from 'lucide-react';

const slides = [
  {
    title: 'Controle total das suas financas',
    subtitle: 'Tudo em um so lugar',
    cards: [
      { icon: Wallet, label: 'Saldo em tempo real', desc: 'Veja quanto tem em todas as contas', color: '#6D5FFD' },
      { icon: TrendingUp, label: 'Saldo projetado', desc: 'Saiba quanto vai sobrar no fim do mes', color: '#2FD180' },
      { icon: Building2, label: 'Multiplas contas', desc: 'Nubank, Itau, Bradesco, todas juntas', color: '#4F7DFF' },
    ],
  },
  {
    title: 'Lancamento rapido',
    subtitle: 'Registre gastos em segundos',
    cards: [
      { icon: ArrowRight, label: 'Fluxo em 4 passos', desc: 'Valor, categoria, conta e pronto', color: '#6D5FFD' },
      { icon: Repeat, label: 'Recorrencias', desc: 'Contas fixas lancadas automaticamente', color: '#3DD9D6' },
      { icon: CreditCard, label: 'Parcelamento', desc: 'Compras parceladas organizadas por fatura', color: '#A78BFA' },
    ],
  },
  {
    title: 'Cartoes de credito',
    subtitle: 'Faturas e limites sob controle',
    cards: [
      { icon: CreditCard, label: 'Card visual', desc: 'Veja seus cartoes como na carteira', color: '#FF5C7A' },
      { icon: CalendarDays, label: 'Faturas mensais', desc: 'Acompanhe fechamento e vencimento', color: '#FFB454' },
      { icon: Target, label: 'Limite disponivel', desc: 'Saiba quanto ainda pode gastar', color: '#4F7DFF' },
    ],
  },
  {
    title: 'Orcamento e metas',
    subtitle: 'Planeje e conquiste objetivos',
    cards: [
      { icon: PieChart, label: 'Orcamento mensal', desc: 'Defina limites por categoria', color: '#A78BFA' },
      { icon: Target, label: 'Metas financeiras', desc: 'Junte dinheiro para seus sonhos', color: '#2FD180' },
      { icon: TrendingUp, label: 'Investimentos', desc: 'Acompanhe seu patrimonio investido', color: '#FFB454' },
    ],
  },
  {
    title: 'Visao completa',
    subtitle: 'Graficos e relatorios detalhados',
    cards: [
      { icon: PieChart, label: 'Gastos por categoria', desc: 'Descubra para onde vai seu dinheiro', color: '#FF5C7A' },
      { icon: CalendarDays, label: 'Calendario financeiro', desc: 'Visualize entradas e saidas por dia', color: '#3DD9D6' },
      { icon: Bell, label: 'Alertas inteligentes', desc: 'Notificacoes de vencimentos e limites', color: '#FFB454' },
    ],
  },
  {
    title: 'Gestao familiar',
    subtitle: 'Financas da familia em um so app',
    cards: [
      { icon: Users, label: 'Circulo familiar', desc: 'Convide membros e compartilhe dados', color: '#6D5FFD' },
      { icon: Shield, label: 'Privacidade', desc: 'Controle o que cada membro ve', color: '#4F7DFF' },
      { icon: Wallet, label: 'Consolidado', desc: 'Veja o total da familia em um lugar', color: '#2FD180' },
    ],
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const touchStart = useRef(0);

  const next = () => {
    if (current < slides.length - 1) setCurrent(current + 1);
    else navigate('/login');
  };

  const prev = () => {
    if (current > 0) setCurrent(current - 1);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (diff > 50) next();
    else if (diff < -50) prev();
  };

  const slide = slides[current];

  return (
    <div
      className="min-h-screen gradient-bg flex flex-col px-5 py-8 select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center justify-between mb-6">
        <img src="/logo.svg" alt="Cofrin" className="h-8 [data-theme=light]:invert" />
        <button
          onClick={() => navigate('/login')}
          className="text-xs text-text-tertiary hover:text-text-secondary transition-colors px-3 py-1.5 rounded-lg glass-card"
        >
          Pular
        </button>
      </div>

      <div className="flex gap-1.5 mb-8">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{
              background: i === current
                ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))'
                : i < current
                  ? 'var(--color-primary)'
                  : 'var(--color-surface)',
              opacity: i < current ? 0.4 : 1,
            }}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col"
          >
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-text-primary leading-tight mb-1">
                {slide.title}
              </h1>
              <p className="text-sm text-text-secondary">{slide.subtitle}</p>
            </div>

            <div className="flex-1 flex flex-col gap-3 justify-center">
              {slide.cards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.3 }}
                    className="glass-card p-4 flex items-center gap-4"
                  >
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: card.color + '15' }}
                    >
                      <Icon size={22} style={{ color: card.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary">{card.label}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{card.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3 mt-6">
        {current > 0 && (
          <button
            onClick={prev}
            className="btn-secondary flex-shrink-0 px-5"
          >
            Voltar
          </button>
        )}
        <button
          onClick={next}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          {current === slides.length - 1 ? 'Comecar' : 'Proximo'}
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
