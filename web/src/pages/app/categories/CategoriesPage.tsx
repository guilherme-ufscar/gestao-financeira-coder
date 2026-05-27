import { useEffect, useState } from 'react';
import { Plus, X, Trash2, Tag, ShoppingCart, Home, Car, Utensils, Heart, Briefcase, GraduationCap, Plane, Gamepad2, Music, Shirt, Gift, Coffee, Wifi, Dumbbell, Baby, Dog, Pill, Scissors, Wrench, Zap, Droplets, Flame, Bus, Bike, Phone, Monitor, Camera, Book, Palette, Sparkles, Star, CircleDollarSign, Banknote, PiggyBank, Receipt, HandCoins } from 'lucide-react';
import api from '../../../lib/api/client';

const availableIcons = [
  { name: 'ShoppingCart', icon: ShoppingCart },
  { name: 'Home', icon: Home },
  { name: 'Car', icon: Car },
  { name: 'Utensils', icon: Utensils },
  { name: 'Heart', icon: Heart },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'Plane', icon: Plane },
  { name: 'Gamepad2', icon: Gamepad2 },
  { name: 'Music', icon: Music },
  { name: 'Shirt', icon: Shirt },
  { name: 'Gift', icon: Gift },
  { name: 'Coffee', icon: Coffee },
  { name: 'Wifi', icon: Wifi },
  { name: 'Dumbbell', icon: Dumbbell },
  { name: 'Baby', icon: Baby },
  { name: 'Dog', icon: Dog },
  { name: 'Pill', icon: Pill },
  { name: 'Scissors', icon: Scissors },
  { name: 'Wrench', icon: Wrench },
  { name: 'Zap', icon: Zap },
  { name: 'Droplets', icon: Droplets },
  { name: 'Flame', icon: Flame },
  { name: 'Bus', icon: Bus },
  { name: 'Bike', icon: Bike },
  { name: 'Phone', icon: Phone },
  { name: 'Monitor', icon: Monitor },
  { name: 'Camera', icon: Camera },
  { name: 'Book', icon: Book },
  { name: 'Palette', icon: Palette },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Star', icon: Star },
  { name: 'CircleDollarSign', icon: CircleDollarSign },
  { name: 'Banknote', icon: Banknote },
  { name: 'PiggyBank', icon: PiggyBank },
  { name: 'Receipt', icon: Receipt },
  { name: 'HandCoins', icon: HandCoins },
  { name: 'Tag', icon: Tag },
];

const presetColors = [
  '#FF5C7A', '#FF8C42', '#FFB454', '#2FD180', '#3DD9D6',
  '#4F7DFF', '#6D5FFD', '#A78BFA', '#F472B6', '#636E72',
  '#E17055', '#00B894', '#0984E3', '#D63031', '#6C5CE7',
];

export function getCategoryIcon(iconName: string) {
  const found = availableIcons.find((i) => i.name === iconName);
  return found?.icon || Tag;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  // Form state
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('ShoppingCart');
  const [color, setColor] = useState('#6D5FFD');
  const [type, setType] = useState<'income' | 'expense'>('expense');

  const fetchCategories = () => {
    api.get('/transactions/categories').then((r) => setCategories(r.data));
  };

  useEffect(() => { fetchCategories(); }, []);

  const filtered = filter === 'all' ? categories : categories.filter((c) => c.type === filter);

  const onSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await api.post('/transactions/categories', { name, icon, color, type });
      setShowForm(false);
      setName('');
      setIcon('ShoppingCart');
      setColor('#6D5FFD');
      fetchCategories();
    } catch {} finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Excluir esta categoria? Transacoes vinculadas ficarao sem categoria.')) return;
    try {
      await api.delete('/transactions/categories/' + id);
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao excluir');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary">Categorias</h1>
        <button
          onClick={() => setShowForm(true)}
          className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center"
        >
          <Plus size={16} className="text-white" />
        </button>
      </header>

      <div className="glass-card p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#FF8C42]/10 flex items-center justify-center shrink-0 mt-0.5">
          <Tag size={16} className="text-[#FF8C42]" />
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          Organize seus lancamentos com categorias personalizadas. Escolha um icone e cor para identificar cada tipo de gasto ou receita.
        </p>
      </div>

      <div className="flex gap-2">
        {([
          { key: 'all', label: 'Todas' },
          { key: 'expense', label: 'Despesas' },
          { key: 'income', label: 'Receitas' },
        ] as const).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={'chip ' + (filter === f.key ? 'chip-active' : '')}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((cat) => {
          const IconComp = getCategoryIcon(cat.icon);
          return (
            <div key={cat.id} className="glass-card p-4 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: cat.color + '20' }}
              >
                <IconComp size={18} style={{ color: cat.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{cat.name}</p>
                <p className="text-[10px] text-text-tertiary">
                  {cat.type === 'income' ? 'Receita' : 'Despesa'}
                  {cat.isDefault && ' • Padrao'}
                </p>
              </div>
              {!cat.isDefault && (
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="p-2 rounded-lg text-text-tertiary hover:text-danger hover:bg-danger/10 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowForm(false)} />
          <div className="relative glass-card-lg w-full max-w-md max-h-[85vh] overflow-y-auto p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary">Nova categoria</h2>
              <button onClick={() => setShowForm(false)} className="text-text-tertiary hover:text-text-primary">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-text-tertiary mb-1">Nome</label>
                <input
                  className="input-field"
                  placeholder="Ex: Mercado, Lazer, Freelance..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs text-text-tertiary mb-1">Tipo</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={'flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ' +
                      (type === 'expense' ? 'bg-danger/15 text-danger border border-danger/30' : 'glass-card text-text-secondary')}
                  >
                    Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={'flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ' +
                      (type === 'income' ? 'bg-success/15 text-success border border-success/30' : 'glass-card text-text-secondary')}
                  >
                    Receita
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-text-tertiary mb-2">Icone</label>
                <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto">
                  {availableIcons.map((i) => {
                    const IconComp = i.icon;
                    return (
                      <button
                        key={i.name}
                        type="button"
                        onClick={() => setIcon(i.name)}
                        className={'w-9 h-9 rounded-lg flex items-center justify-center transition-colors ' +
                          (icon === i.name ? 'bg-primary/20 border-2 border-primary/50' : 'glass-card hover:bg-surface-hover')}
                      >
                        <IconComp size={16} className={icon === i.name ? 'text-primary' : 'text-text-secondary'} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs text-text-tertiary mb-2">Cor</label>
                <div className="flex flex-wrap gap-2">
                  {presetColors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={'w-8 h-8 rounded-lg transition-transform ' + (color === c ? 'scale-125 ring-2 ring-offset-2 ring-offset-surface ring-primary' : '')}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="glass-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
                  {(() => { const I = getCategoryIcon(icon); return <I size={18} style={{ color }} />; })()}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{name || 'Preview'}</p>
                  <p className="text-[10px] text-text-tertiary">{type === 'income' ? 'Receita' : 'Despesa'}</p>
                </div>
              </div>

              <button
                onClick={onSubmit}
                disabled={loading || !name.trim()}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Criar categoria'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
