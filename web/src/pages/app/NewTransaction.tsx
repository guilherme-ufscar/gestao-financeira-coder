import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronLeft, ArrowDownLeft, ArrowUpRight, Building2, CreditCard } from 'lucide-react';
import api from '../../lib/api/client';
import { formatCurrency } from '../../lib/utils';

export default function NewTransaction() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('0,00');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [creditCardId, setCreditCardId] = useState('');
  const [useCard, setUseCard] = useState(false);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [installments, setInstallments] = useState(1);
  const [status, setStatus] = useState<'paid' | 'pending'>('paid');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/accounts').then((r) => {
      setAccounts(r.data);
      const defaultAcc = r.data.find((a: any) => a.isDefault);
      if (defaultAcc) setAccountId(defaultAcc.id);
    });
    api.get('/cards').then((r) => setCards(r.data));
    api.get('/transactions/categories').then((r) => setCategories(r.data));
  }, []);

  const amountInCents = (() => {
    const raw = amount.replace(/\D/g, '');
    return parseInt(raw, 10) || 0;
  })();

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw === '' || raw === '0') { setAmount('0,00'); return; }
    const cents = parseInt(raw, 10);
    const reais = Math.floor(cents / 100);
    const centavos = cents % 100;
    setAmount(`${reais.toLocaleString('pt-BR')},${centavos.toString().padStart(2, '0')}`);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload: any = {
        type, amountInCents,
        description: description || (categories.find(c => c.id === categoryId)?.name || 'Lancamento'),
        date, status, categoryId: categoryId || undefined, installments,
      };
      if (useCard) payload.creditCardId = creditCardId;
      else payload.accountId = accountId;
      await api.post('/transactions', payload);
      navigate('/');
    } catch {} finally { setLoading(false); }
  };

  const canAdvance = () => {
    if (step === 0) return amountInCents > 0;
    if (step === 1) return !!categoryId;
    if (step === 2) return useCard ? !!creditCardId : !!accountId;
    return true;
  };

  const nextStep = () => {
    if (canAdvance() && step < 3) setStep(step + 1);
    if (step === 3) handleSubmit();
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
    else navigate(-1);
  };

  const filteredCategories = categories.filter((c: any) => c.type === type);

  const slideVariants = {
    enter: { x: 60, opacity: 0, scale: 0.96 },
    center: { x: 0, opacity: 1, scale: 1 },
    exit: { x: -60, opacity: 0, scale: 0.96 },
  };

  return (
    <div className="flex flex-col h-full p-5">
      <header className="flex items-center gap-3 mb-5">
        <button onClick={prevStep} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-high transition-colors">
          <ChevronLeft size={20} className="text-text-primary" />
        </button>
        <div className="flex-1">
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full transition-all duration-500 ease-spring"
                style={{ background: i <= step ? 'var(--m3-primary)' : 'var(--m3-surface-container-high)' }}
              />
            ))}
          </div>
        </div>
        <span className="text-label text-text-tertiary">{step + 1}/4</span>
      </header>

      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step0" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }} className="flex-1 flex flex-col">
              <div className="flex gap-3 mb-8">
                <button
                  onClick={() => setType('expense')}
                  className={'flex-1 py-4 rounded-2xl text-body font-semibold transition-all duration-300 ease-spring ' +
                    (type === 'expense' ? 'bg-danger/15 text-danger border-2 border-danger/30 shadow-elevation-1 scale-[1.02]' : 'm3-card text-text-secondary')}
                >
                  <ArrowUpRight size={18} className="inline mr-2" />Despesa
                </button>
                <button
                  onClick={() => setType('income')}
                  className={'flex-1 py-4 rounded-2xl text-body font-semibold transition-all duration-300 ease-spring ' +
                    (type === 'income' ? 'bg-success/15 text-success border-2 border-success/30 shadow-elevation-1 scale-[1.02]' : 'm3-card text-text-secondary')}
                >
                  <ArrowDownLeft size={18} className="inline mr-2" />Receita
                </button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center">
                <p className="text-label text-text-tertiary mb-3 uppercase tracking-wider">Valor</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-text-tertiary text-headline">R$</span>
                  <input
                    type="text" inputMode="numeric" value={amount} onChange={handleAmountChange}
                    placeholder="0,00" autoFocus
                    className="bg-transparent text-center text-display-lg text-text-primary outline-none w-52 placeholder:text-text-tertiary/30"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }} className="flex-1 flex flex-col">
              <p className="text-body text-text-secondary mb-5">Escolha a categoria</p>
              <div className="grid grid-cols-3 gap-3">
                {filteredCategories.map((cat: any) => (
                  <button
                    key={cat.id} onClick={() => setCategoryId(cat.id)}
                    className={'flex flex-col items-center gap-2.5 p-4 rounded-2xl transition-all duration-200 ease-spring ' +
                      (categoryId === cat.id ? 'border-2 shadow-elevation-2 scale-[1.03]' : 'm3-card hover:bg-surface-high')}
                    style={categoryId === cat.id ? { borderColor: cat.color + '60', backgroundColor: cat.color + '12' } : {}}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: cat.color + '20' }}>
                      <span className="text-body font-bold" style={{ color: cat.color }}>{cat.name[0]}</span>
                    </div>
                    <span className="text-caption text-text-secondary text-center leading-tight">{cat.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }} className="flex-1 flex flex-col">
              <div className="m3-segmented mb-5">
                <button onClick={() => setUseCard(false)}
                  className={'m3-segmented-item ' + (!useCard ? 'm3-segmented-active' : '')}>
                  <Building2 size={14} className="inline mr-1.5" /> Conta
                </button>
                <button onClick={() => setUseCard(true)}
                  className={'m3-segmented-item ' + (useCard ? 'm3-segmented-active' : '')}>
                  <CreditCard size={14} className="inline mr-1.5" /> Cartao
                </button>
              </div>

              {!useCard ? (
                <div className="space-y-2.5">
                  {accounts.map((a: any) => (
                    <button key={a.id} onClick={() => setAccountId(a.id)}
                      className={'w-full p-4 rounded-2xl flex items-center gap-3.5 transition-all duration-200 ease-spring ' +
                        (accountId === a.id ? 'border-2 border-primary/40 bg-primary-container/20 shadow-elevation-1' : 'm3-card hover:bg-surface-high')}>
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: a.color + '20' }}>
                        <Building2 size={18} style={{ color: a.color }} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-body font-medium text-text-primary">{a.name}</p>
                        <p className="text-caption text-text-tertiary">{formatCurrency(a.balanceInCents)}</p>
                      </div>
                      {accountId === a.id && (
                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                          <Check size={14} className="text-on-primary" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {cards.map((c: any) => (
                    <button key={c.id} onClick={() => setCreditCardId(c.id)}
                      className={'w-full p-4 rounded-2xl flex items-center gap-3.5 transition-all duration-200 ease-spring ' +
                        (creditCardId === c.id ? 'border-2 border-primary/40 bg-primary-container/20 shadow-elevation-1' : 'm3-card hover:bg-surface-high')}>
                      <div className="w-11 h-11 rounded-xl bg-primary-container/30 flex items-center justify-center">
                        <CreditCard size={18} className="text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-body font-medium text-text-primary">{c.name}</p>
                        <p className="text-caption text-text-tertiary">{c.brand} ---- {c.lastFourDigits}</p>
                      </div>
                      {creditCardId === c.id && (
                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                          <Check size={14} className="text-on-primary" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }} className="flex-1 flex flex-col">
              <p className="text-body text-text-secondary mb-5">Detalhes (opcional)</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-label text-text-secondary mb-2 pl-1">Descricao</label>
                  <input className="m3-input" placeholder="Ex: Supermercado" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-label text-text-secondary mb-2 pl-1">Data</label>
                    <input type="date" className="m3-input" value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-label text-text-secondary mb-2 pl-1">Status</label>
                    <select className="m3-select" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                      <option value="paid">{type === 'income' ? 'Recebido' : 'Pago'}</option>
                      <option value="pending">Pendente</option>
                    </select>
                  </div>
                </div>
                {useCard && (
                  <div>
                    <label className="block text-label text-text-secondary mb-2 pl-1">Parcelas</label>
                    <input type="number" min="1" max="72" className="m3-input" value={installments} onChange={(e) => setInstallments(parseInt(e.target.value) || 1)} />
                    {installments > 1 && (
                      <p className="text-caption text-text-tertiary mt-2 pl-1">
                        {installments}x de {formatCurrency(Math.round(amountInCents / installments))}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6">
        <button
          onClick={nextStep}
          disabled={!canAdvance() || loading}
          className="m3-btn w-full disabled:opacity-40"
        >
          {step === 3 ? (loading ? 'Salvando...' : 'Confirmar') : 'Proximo'}
        </button>
      </div>
    </div>
  );
}
