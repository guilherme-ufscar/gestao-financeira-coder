import { useState, useRef } from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (valueInCents: number) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export default function CurrencyInput({ value, onChange, placeholder = 'R$ 0,00', className = 'input-field', id }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState(() => formatFromCents(value || 0));
  const inputRef = useRef<HTMLInputElement>(null);

  function formatFromCents(cents: number): string {
    if (!cents || cents === 0) return '';
    const abs = Math.abs(cents);
    const reais = Math.floor(abs / 100);
    const centavos = abs % 100;
    const formatted = `R$ ${reais.toLocaleString('pt-BR')},${centavos.toString().padStart(2, '0')}`;
    return cents < 0 ? `-${formatted}` : formatted;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw === '') {
      setDisplayValue('');
      onChange(0);
      return;
    }

    const cents = parseInt(raw, 10);
    const reais = Math.floor(cents / 100);
    const centavos = cents % 100;
    const formatted = `R$ ${reais.toLocaleString('pt-BR')},${centavos.toString().padStart(2, '0')}`;

    setDisplayValue(formatted);
    onChange(cents);
  }

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="numeric"
      className={className}
      placeholder={placeholder}
      value={displayValue}
      onChange={handleChange}
    />
  );
}
