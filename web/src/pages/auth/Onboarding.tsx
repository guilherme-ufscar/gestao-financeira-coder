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
      { icon: Wallet, label: 'Saldo em tempo real', desc: 'Veja quanto tem em todas as contas', color: '#B794F6' },
      { icon: TrendingUp, label: 'Saldo projetado', desc: 'Saiba quanto vai sobrar no fim do mes', color: '#6EE7B7' },
      { icon: Building2, label: 'Multiplas contas', desc: 'Nubank, Itau, Bradesco, todas juntas', color: '#7DD3FC' },
    ],
  },
  {
    title: 'Lancamento rapido',
    subtitle: 'Registre gastos em segundos',
    cards: [
      { icon: ArrowRight, label: 'Fluxo em 4 passos', desc: 'Valor, categoria, conta e pronto', color: '#B794F6' },
      { icon: Repeat, label: 'Recorrencias', desc: 'Contas fixas lancadas automaticamente', color: '#7DD3FC' },
      { icon: CreditCard, label: 'Parcelamento', desc: 'Compras parceladas organizadas por fatura', color: '#F9A8D4' },
    ],
  },
  {
    title: 'Cartoes de credito',
    subtitle: 'Faturas e limites sob controle',
    cards: [
      { icon: CreditCard, label: 'Card visual', desc: 'Veja seus cartoes como na carteira', color: '#F9A8D4' },
      { icon: CalendarDays, label: 'Faturas mensais', desc: 'Acompanhe fechamento e vencimento', color: '#FDE68A' },
      { icon: Target, label: 'Limite disponivel', desc: 'Saiba quanto ainda pode gastar', color: '#7DD3FC' },
    ],
  },
  {
    title: 'Orcamento e metas',
    subtitle: 'Planeje e conquiste objetivos',
    cards: [
      { icon: PieChart, label: 'Orcamento mensal', desc: 'Defina limites por categoria', color: '#F9A8D4' },
      { icon: Target, label: 'Metas financeiras', desc: 'Junte dinheiro para seus sonhos', color: '#6EE7B7' },
      { icon: TrendingUp, label: 'Investimentos', desc: 'Acompanhe seu patrimonio investido', color: '#FDE68A' },
    ],
  },
  {
    title: 'Visao completa',
    subtitle: 'Graficos e relatorios detalhados',
    cards: [
      { icon: PieChart, label: 'Gastos por categoria', desc: 'Descubra para onde vai seu dinheiro', color: '#F9A8D4' },
      { icon: CalendarDays, label: 'Calendario financeiro', desc: 'Visualize entradas e saidas por dia', color: '#7DD3FC' },
      { icon: Bell, label: 'Alertas inteligentes', desc: 'Notificacoes de vencimentos e limites', color: '#FDE68A' },
    ],
  },
  {
    title: 'Gestao familiar',
    subtitle: 'Financas da familia em um so app',
    cards: [
      { icon: Users, label: 'Circulo familiar', desc: 'Convide membros e compartilhe dados', color: '#B794F6' },
      { icon: Shield, label: 'Privacidade', desc: 'Controle o que cada membro ve', color: '#7DD3FC' },
      { icon: Wallet, label: 'Consolidado', desc: 'Veja o total da familia em um lugar', color: '#6EE7B7' },
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
      className="min-h-screen bg-background flex flex-col px-5 py-8 select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center justify-between mb-8">
        <img src="/logo.svg" alt="Cofrin" className="h-9 [data-theme=light]:invert" />
        <button
          onClick={() => navigate('/login')}
          className="text-label text-text-tertiary hover:text-text-secondary transition-colors px-4 py-2 rounded-full bg-surface-container"
        >
          Pular
        </button>
      </div>

      <div className="flex gap-2 mb-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="h-1.5 flex-1 rounded-full transition-all duration-500 ease-spring"
            style={{
              background: i === current
                ? 'var(--m3-primary)'
                : i < current
                  ? 'var(--m3-primary-container)'
                  : 'var(--m3-surface-container-high)',
            }}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 40, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -40, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            className="flex-1 flex flex-col"
          >
            <div className="mb-8">
              <h1 className="text-headline-lg text-text-primary leading-tight mb-2">
                {slide.title}
              </h1>
              <p className="text-body-lg text-text-secondary">{slide.subtitle}</p>
            </div>

            <div className="flex-1 flex flex-col gap-4 justify-center stagger-children">
              {slide.cards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 24, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.1, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                    className="m3-card-elevated p-5 flex items-center gap-4"
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: card.color + '20' }}
                    >
                      <Icon size={24} style={{ color: card.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-title font-semibold text-text-primary">{card.label}</p>
                      <p className="text-body text-text-secondary mt-0.5">{card.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3 mt-8">
        {current > 0 && (
          <button onClick={prev} className="m3-btn-tonal flex-shrink-0 px-6">
            Voltar
          </button>
        )}
        <button onClick={next} className="m3-btn flex-1">
          {current === slides.length - 1 ? 'Comecar' : 'Proximo'}
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
