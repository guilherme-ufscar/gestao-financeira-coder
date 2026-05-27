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
    if (raw === '' || raw === '0') {
      setAmount('0,00');
      return;
    }
    const cents = parseInt(raw, 10);
    const reais = Math.floor(cents / 100);
    const centavos = cents % 100;
    setAmount(`${reais.toLocaleString('pt-BR')},${centavos.toString().padStart(2, '0')}`);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload: any = {
        type,
        amountInCents,
        description: description || (categories.find(c => c.id === categoryId)?.name || 'Lancamento'),
        date,
        status,
        categoryId: categoryId || undefined,
        installments,
      };
      if (useCard) {
        payload.creditCardId = creditCardId;
      } else {
        payload.accountId = accountId;
      }
      await api.post('/transactions', payload);
      navigate('/');
    } catch {
    } finally {
      setLoading(false);
    }
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
    enter: { x: 50, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 },
  };

  return (
    <div className="flex flex-col h-full p-4">
      <header className="flex items-center gap-3 mb-4">
        <button onClick={prevStep} className="w-9 h-9 rounded-xl glass-card flex items-center justify-center">
          <ChevronLeft size={18} className="text-text-primary" />
        </button>
        <div className="flex-1">
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full transition-all duration-300"
                style={{
                  background: i <= step
                    ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))'
                    : 'var(--color-surface)',
                }}
              />
            ))}
          </div>
        </div>
        <span className="text-xs text-text-tertiary">{step + 1}/4</span>
      </header>

      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setType('expense')}
                  className={'flex-1 py-3 rounded-2xl text-sm font-semibold transition-all ' +
                    (type === 'expense'
                      ? 'bg-danger/15 text-danger border-2 border-danger/30 shadow-lg shadow-danger/10'
                      : 'glass-card text-text-secondary')}
                >
                  <ArrowUpRight size={16} className="inline mr-1.5" />
                  Despesa
                </button>
                <button
                  onClick={() => setType('income')}
                  className={'flex-1 py-3 rounded-2xl text-sm font-semibold transition-all ' +
                    (type === 'income'
                      ? 'bg-success/15 text-success border-2 border-success/30 shadow-lg shadow-success/10'
                      : 'glass-card text-text-secondary')}
                >
                  <ArrowDownLeft size={16} className="inline mr-1.5" />
                  Receita
                </button>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center">
                <p className="text-text-tertiary text-xs mb-2 uppercase tracking-wider">Valor</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-text-tertiary text-xl">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="0,00"
                    autoFocus
                    className="bg-transparent text-center text-4xl font-bold text-text-primary outline-none w-48 placeholder:text-text-tertiary/30"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <p className="text-text-secondary text-sm mb-4">Escolha a categoria</p>
              <div className="grid grid-cols-3 gap-2.5">
                {filteredCategories.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryId(cat.id)}
                    className={'flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ' +
                      (categoryId === cat.id
                        ? 'border-2 shadow-lg'
                        : 'glass-card hover:bg-surface-hover')}
                    style={categoryId === cat.id ? {
                      borderColor: cat.color + '60',
                      backgroundColor: cat.color + '10',
                      boxShadow: '0 4px 15px ' + cat.color + '20',
                    } : {}}
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: cat.color + '20' }}
                    >
                      <span className="text-sm font-bold" style={{ color: cat.color }}>
                        {cat.name[0]}
                      </span>
                    </div>
                    <span className="text-[10px] text-text-secondary text-center leading-tight">{cat.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setUseCard(false)}
                  className={'flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ' +
                    (!useCard ? 'gradient-primary text-white shadow-glow' : 'glass-card text-text-secondary')}
                >
                  <Building2 size={14} className="inline mr-1" /> Conta
                </button>
                <button
                  onClick={() => setUseCard(true)}
                  className={'flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ' +
                    (useCard ? 'gradient-primary text-white shadow-glow' : 'glass-card text-text-secondary')}
                >
                  <CreditCard size={14} className="inline mr-1" /> Cartao
                </button>
              </div>

              {!useCard ? (
                <div className="space-y-2">
                  {accounts.map((a: any) => (
                    <button
                      key={a.id}
                      onClick={() => setAccountId(a.id)}
                      className={'w-full p-4 rounded-2xl flex items-center gap-3 transition-all ' +
                        (accountId === a.id
                          ? 'border-2 border-primary/40 bg-primary/5 shadow-lg shadow-primary/10'
                          : 'glass-card hover:bg-surface-hover')}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: a.color + '20' }}>
                        <Building2 size={16} style={{ color: a.color }} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-text-primary">{a.name}</p>
                        <p className="text-xs text-text-tertiary">{formatCurrency(a.balanceInCents)}</p>
                      </div>
                      {accountId === a.id && (
                        <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {cards.map((c: any) => (
                    <button
                      key={c.id}
                      onClick={() => setCreditCardId(c.id)}
                      className={'w-full p-4 rounded-2xl flex items-center gap-3 transition-all ' +
                        (creditCardId === c.id
                          ? 'border-2 border-primary/40 bg-primary/5 shadow-lg shadow-primary/10'
                          : 'glass-card hover:bg-surface-hover')}
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <CreditCard size={16} className="text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-text-primary">{c.name}</p>
                        <p className="text-xs text-text-tertiary">{c.brand} •••• {c.lastFourDigits}</p>
                      </div>
                      {creditCardId === c.id && (
                        <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <p className="text-text-secondary text-sm mb-4">Detalhes (opcional)</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-text-tertiary mb-1.5">Descricao</label>
                  <input
                    className="input-field"
                    placeholder="Ex: Supermercado"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-text-tertiary mb-1.5">Data</label>
                    <input
                      type="date"
                      className="input-field"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-tertiary mb-1.5">Status</label>
                    <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                      <option value="paid">{type === 'income' ? 'Recebido' : 'Pago'}</option>
                      <option value="pending">Pendente</option>
                    </select>
                  </div>
                </div>
                {useCard && (
                  <div>
                    <label className="block text-xs text-text-tertiary mb-1.5">Parcelas</label>
                    <input
                      type="number"
                      min="1"
                      max="72"
                      className="input-field"
                      value={installments}
                      onChange={(e) => setInstallments(parseInt(e.target.value) || 1)}
                    />
                    {installments > 1 && (
                      <p className="text-xs text-text-tertiary mt-1">
                        {installments}x de {formatCurrency(Math.round(amountInCents / installments))}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="glass-card-gradient p-4 mt-4 rounded-2xl">
                <p className="text-xs text-text-tertiary mb-2">Resumo</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-primary font-medium">
                    {type === 'expense' ? 'Despesa' : 'Receita'}
                  </span>
                  <span className={'text-lg font-bold ' + (type === 'expense' ? 'text-danger' : 'text-success')}>
                    {type === 'expense' ? '-' : '+'}{formatCurrency(amountInCents)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="pt-4">
        <button
          onClick={nextStep}
          disabled={!canAdvance() || loading}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {step === 3 ? (
            <>
              <Check size={18} />
              {loading ? 'Salvando...' : 'Confirmar'}
            </>
          ) : (
            'Continuar'
          )}
        </button>
      </div>
    </div>
  );
}