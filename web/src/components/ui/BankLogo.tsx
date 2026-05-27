interface BankLogoProps {
  slug: string;
  size?: number;
  className?: string;
}

const availableLogos = [
  'nubank', 'itau', 'bradesco', 'bb', 'caixa', 'santander',
  'inter', 'c6', 'mercadopago', 'picpay', 'neon', 'pagbank',
];

export default function BankLogo({ slug, size = 24, className = '' }: BankLogoProps) {
  if (!availableLogos.includes(slug)) {
    return (
      <div
        className={`rounded-md flex items-center justify-center ${className}`}
        style={{ width: size, height: size, backgroundColor: '#6D5FFD' }}
      >
        <span style={{ fontSize: size * 0.4, color: '#fff', fontWeight: 'bold' }}>?</span>
      </div>
    );
  }

  return (
    <img
      src={`/banks/${slug}.svg`}
      alt={slug}
      width={size}
      height={size}
      className={`rounded-md ${className}`}
    />
  );
}
