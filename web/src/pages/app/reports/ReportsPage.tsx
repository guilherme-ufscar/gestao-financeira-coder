import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import api from '../../../lib/api/client';
import { formatCurrency } from '../../../lib/utils';

export default function ReportsPage() {
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [period, setPeriod] = useState(6);
  const [totals, setTotals] = useState({ income: 0, expenses: 0 });

  useEffect(() => { fetchData(); }, [period]);

  const fetchData = async () => {
    const now = new Date();
    const months: any[] = [];
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = d.toISOString();
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString();
      months.push({ start, end, label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') });
    }

    const results = await Promise.all(
      months.map(async (m) => {
        const { data } = await api.get('/transactions?startDate=' + m.start + '&endDate=' + m.end + '&limit=500');
        const income = data.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amountInCents, 0);
        const expenses = data.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amountInCents, 0);
        return { name: m.label, receitas: income / 100, despesas: expenses / 100 };
      })
    );
    setMonthlyData(results);

    const currentStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    const { data: currentTxs } = await api.get('/transactions?startDate=' + currentStart + '&endDate=' + currentEnd + '&limit=500');

    const income = currentTxs.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amountInCents, 0);
    const expenses = currentTxs.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amountInCents, 0);
    setTotals({ income, expenses });

    const catMap: Record<string, { name: string; color: string; value: number }> = {};
    currentTxs.filter((t: any) => t.type === 'expense').forEach((t: any) => {
      const name = t.category?.name || 'Outros';
      const color = t.category?.color || '#C9BFD6';
      if (!catMap[name]) catMap[name] = { name, color, value: 0 };
      catMap[name].value += t.amountInCents;
    });
    setCategoryData(Object.values(catMap).sort((a, b) => b.value - a.value).slice(0, 8));
  };

  const totalCatSpending = categoryData.reduce((s, c) => s + c.value, 0);

  return (
    <div className="p-5 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-headline text-text-primary">Relatorios</h1>
        <div className="flex gap-2">
          {[3, 6, 12].map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={'m3-chip ' + (period === p ? 'm3-chip-selected' : '')}>
              {p}m
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="m3-card-elevated p-5">
          <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center mb-3">
            <TrendingUp size={18} className="text-success" />
          </div>
          <p className="text-caption text-text-tertiary uppercase">Receitas (mes)</p>
          <p className="text-title font-bold text-success">{formatCurrency(totals.income)}</p>
        </div>
        <div className="m3-card-elevated p-5">
          <div className="w-10 h-10 rounded-xl bg-danger/15 flex items-center justify-center mb-3">
            <TrendingDown size={18} className="text-danger" />
          </div>
          <p className="text-caption text-text-tertiary uppercase">Despesas (mes)</p>
          <p className="text-title font-bold text-danger">{formatCurrency(totals.expenses)}</p>
        </div>
      </div>

      <div className="m3-card-elevated p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-title text-text-primary">Evolucao mensal</h2>
          <Calendar size={16} className="text-text-tertiary" />
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} barGap={4}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--m3-outline)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: 'var(--m3-surface-container-high)', border: '1px solid var(--m3-outline-variant)', borderRadius: 16, fontSize: 12 }}
                labelStyle={{ color: 'var(--m3-on-surface)' }}
                formatter={(value: number) => ['R$ ' + value.toFixed(2)]}
              />
              <Bar dataKey="receitas" fill="var(--m3-success)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="despesas" fill="var(--m3-danger)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-5 mt-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-caption text-text-secondary">Receitas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-danger" />
            <span className="text-caption text-text-secondary">Despesas</span>
          </div>
        </div>
      </div>

      <div className="m3-card-elevated p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-title text-text-primary">Gastos por categoria</h2>
          <span className="text-label text-text-tertiary">Este mes</span>
        </div>
        {categoryData.length === 0 ? (
          <p className="text-text-tertiary text-body text-center py-6">Sem dados para exibir</p>
        ) : (
          <div className="flex items-center gap-5">
            <div className="w-28 h-28 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={52} strokeWidth={0}>
                    {categoryData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2.5">
              {categoryData.map((cat) => {
                const percent = totalCatSpending > 0 ? (cat.value / totalCatSpending) * 100 : 0;
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-label text-text-secondary">{cat.name}</span>
                      </div>
                      <span className="text-label font-bold text-text-primary">{percent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-surface-highest">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: percent + '%', backgroundColor: cat.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
