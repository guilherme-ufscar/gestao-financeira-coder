interface Props {
  name: string;
  lastFour: string;
  brand: string;
  color: string;
}

const brandLogos: Record<string, string> = {
  visa: 'VISA',
  mastercard: 'MC',
  amex: 'AMEX',
  elo: 'ELO',
  hipercard: 'HIPER',
};

export default function CreditCardVisual({ name, lastFour, brand, color }: Props) {
  return (
    <div
      className="relative w-full aspect-[1.586/1] rounded-2xl p-5 flex flex-col justify-between overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, ' + color + ' 0%, ' + color + '99 100%)',
      }}
    >
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

      <div className="relative flex items-center justify-between">
        <div className="w-10 h-7 rounded bg-yellow-300/80" />
        <span className="text-white/90 text-sm font-bold tracking-wider">
          {brandLogos[brand] || brand.toUpperCase()}
        </span>
      </div>

      <div className="relative">
        <p className="text-white/70 text-xs tracking-[0.3em] font-mono mb-3">
          **** **** **** {lastFour || '0000'}
        </p>
        <div className="flex items-center justify-between">
          <p className="text-white text-xs font-medium uppercase tracking-wide truncate max-w-[60%]">
            {name || 'SEU NOME'}
          </p>
          <p className="text-white/60 text-xs">
            12/28
          </p>
        </div>
      </div>
    </div>
  );
}