import { useEffect, useState } from 'react';
import { Plus, X, Trash2, Tag, ShoppingCart, Home, Car, Utensils, Heart, Briefcase, GraduationCap, Plane, Gamepad2, Music, Shirt, Gift, Coffee, Wifi, Dumbbell, Baby, Dog, Pill, Scissors, Wrench, Zap, Droplets, Flame, Bus, Bike, Phone, Monitor, Camera, Book, Palette, Sparkles, Star, CircleDollarSign, Banknote, PiggyBank, Receipt, HandCoins } from 'lucide-react';
import api from '../../../lib/api/client';

const availableIcons = [
  { name: 'ShoppingCart', icon: ShoppingCart }, { name: 'Home', icon: Home }, { name: 'Car', icon: Car },
  { name: 'Utensils', icon: Utensils }, { name: 'Heart', icon: Heart }, { name: 'Briefcase', icon: Briefcase },
  { name: 'GraduationCap', icon: GraduationCap }, { name: 'Plane', icon: Plane }, { name: 'Gamepad2', icon: Gamepad2 },
  { name: 'Music', icon: Music }, { name: 'Shirt', icon: Shirt }, { name: 'Gift', icon: Gift },
  { name: 'Coffee', icon: Coffee }, { name: 'Wifi', icon: Wifi }, { name: 'Dumbbell', icon: Dumbbell },
  { name: 'Baby', icon: Baby }, { name: 'Dog', icon: Dog }, { name: 'Pill', icon: Pill },
  { name: 'Scissors', icon: Scissors }, { name: 'Wrench', icon: Wrench }, { name: 'Zap', icon: Zap },
  { name: 'Droplets', icon: Droplets }, { name: 'Flame', icon: Flame }, { name: 'Bus', icon: Bus },
  { name: 'Bike', icon: Bike }, { name: 'Phone', icon: Phone }, { name: 'Monitor', icon: Monitor },
  { name: 'Camera', icon: Camera }, { name: 'Book', icon: Book }, { name: 'Palette', icon: Palette },
  { name: 'Sparkles', icon: Sparkles }, { name: 'Star', icon: Star }, { name: 'CircleDollarSign', icon: CircleDollarSign },
  { name: 'Banknote', icon: Banknote }, { name: 'PiggyBank', icon: PiggyBank }, { name: 'Receipt', icon: Receipt },
  { name: 'HandCoins', icon: HandCoins }, { name: 'Tag', icon: Tag },
];

const presetColors = [
  '#F9A8D4', '#FCA5A5', '#FDE68A', '#6EE7B7', '#7DD3FC',
  '#B794F6', '#A78BFA', '#F472B6', '#C9BFD6', '#E17055',
  '#00B894', '#0984E3', '#D63031', '#6C5CE7', '#FDCB6E',
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
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('ShoppingCart');
  const [color, setColor] = useState('#B794F6');
  const [type, setType] = useState<'income' | 'expense'>('expense');

  const fetchCategories = () => { api.get('/transactions/categories').then((r) => setCategories(r.data)); };
  useEffect(() => { fetchCategories(); }, []);

  const filtered = filter === 'all' ? categories : categories.filter((c) => c.type === filter);

  const onSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try { await api.post('/transactions/categories', { name, icon, color, type }); setShowForm(false); setName(''); setIcon('ShoppingCart'); setColor('#B794F6'); fetchCategories(); }
    catch {} finally { setLoading(false); }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Excluir esta categoria? Transacoes vinculadas ficarao sem categoria.')) return;
    try { await api.delete('/transactions/categories/' + id); fetchCategories(); }
    catch (err: any) { alert(err.response?.data?.message || 'Erro ao excluir'); }
  };

  return (
    <div className="p-5 space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-headline text-text-primary">Categorias</h1>
        <button onClick={() => setShowForm(true)} className="m3-fab-small">
          <Plus size={18} />
        </button>
      </header>

      <div className="flex gap-2">
        {([
          { key: 'all', label: 'Todas' },
          { key: 'expense', label: 'Despesas' },
          { key: 'income', label: 'Receitas' },
        ] as const).map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={'m3-chip ' + (filter === f.key ? 'm3-chip-selected' : '')}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {filtered.map((cat) => {
          const IconComp = getCategoryIcon(cat.icon);
          return (
            <div key={cat.id} className="m3-card-elevated p-4 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: cat.color + '18' }}>
                <IconComp size={18} style={{ color: cat.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body font-medium text-text-primary truncate">{cat.name}</p>
                <p className="text-caption text-text-tertiary">
                  {cat.type === 'income' ? 'Receita' : 'Despesa'}
                  {cat.isDefault && ' - Padrao'}
                </p>
              </div>
              {!cat.isDefault && (
                <button onClick={() => deleteCategory(cat.id)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-text-tertiary hover:text-danger hover:bg-danger/10 transition-all duration-200">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative m3-dialog w-full max-w-md max-h-[85vh] overflow-y-auto p-7 m-4 animate-slide-up sm:animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-title-lg text-text-primary">Nova categoria</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-surface-high flex items-center justify-center text-text-tertiary hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-label text-text-secondary mb-2 pl-1">Nome</label>
                <input className="m3-input" placeholder="Ex: Mercado, Lazer, Freelance..." value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              </div>

              <div>
                <label className="block text-label text-text-secondary mb-2 pl-1">Tipo</label>
                <div className="m3-segmented">
                  <button type="button" onClick={() => setType('expense')}
                    className={'m3-segmented-item ' + (type === 'expense' ? 'm3-segmented-active' : '')}>Despesa</button>
                  <button type="button" onClick={() => setType('income')}
                    className={'m3-segmented-item ' + (type === 'income' ? 'm3-segmented-active' : '')}>Receita</button>
                </div>
              </div>

              <div>
                <label className="block text-label text-text-secondary mb-2 pl-1">Icone</label>
                <div className="grid grid-cols-8 gap-2 max-h-36 overflow-y-auto">
                  {availableIcons.map((i) => {
                    const IconComp = i.icon;
                    return (
                      <button key={i.name} type="button" onClick={() => setIcon(i.name)}
                        className={'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ease-spring ' +
                          (icon === i.name ? 'bg-primary-container border-2 border-primary/50 scale-110' : 'bg-surface-high hover:bg-surface-highest')}>
                        <IconComp size={16} className={icon === i.name ? 'text-on-primary-container' : 'text-text-secondary'} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-label text-text-secondary mb-2 pl-1">Cor</label>
                <div className="flex flex-wrap gap-2.5">
                  {presetColors.map((c) => (
                    <button key={c} type="button" onClick={() => setColor(c)}
                      className={'w-9 h-9 rounded-xl transition-all duration-200 ease-spring ' + (color === c ? 'scale-125 ring-2 ring-offset-2 ring-offset-background ring-primary' : '')}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              <div className="m3-card-filled p-4 rounded-xl flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '18' }}>
                  {(() => { const I = getCategoryIcon(icon); return <I size={18} style={{ color }} />; })()}
                </div>
                <div>
                  <p className="text-body font-medium text-text-primary">{name || 'Preview'}</p>
                  <p className="text-caption text-text-tertiary">{type === 'income' ? 'Receita' : 'Despesa'}</p>
                </div>
              </div>

              <button onClick={onSubmit} disabled={loading || !name.trim()} className="m3-btn w-full disabled:opacity-40">
                {loading ? 'Salvando...' : 'Criar categoria'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
