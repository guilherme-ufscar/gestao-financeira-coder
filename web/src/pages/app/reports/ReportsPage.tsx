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

  useEffect(() => {
    fetchData();
  }, [period]);

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
      const color = t.category?.color || '#636E72';
      if (!catMap[name]) catMap[name] = { name, color, value: 0 };
      catMap[name].value += t.amountInCents;
    });
    setCategoryData(Object.values(catMap).sort((a, b) => b.value - a.value).slice(0, 8));
  };

  const totalCatSpending = categoryData.reduce((s, c) => s + c.value, 0);

  return (
    <div className="p-4 space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary">Relatorios</h1>
        <div className="flex gap-1.5">
          {[3, 6, 12].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={'chip ' + (period === p ? 'chip-active' : '')}
            >
              {p}m
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp size={14} className="text-success" />
            </div>
          </div>
          <p className="text-[10px] text-text-tertiary uppercase">Receitas (mes)</p>
          <p className="text-base font-bold text-success">{formatCurrency(totals.income)}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center">
              <TrendingDown size={14} className="text-danger" />
            </div>
          </div>
          <p className="text-[10px] text-text-tertiary uppercase">Despesas (mes)</p>
          <p className="text-base font-bold text-danger">{formatCurrency(totals.expenses)}</p>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="section-header">
          <h2 className="section-title">Evolucao mensal</h2>
          <Calendar size={14} className="text-text-tertiary" />
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} barGap={2}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: 'var(--color-surface-solid)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 11 }}
                labelStyle={{ color: 'var(--color-text-primary)' }}
                formatter={(value: number) => ['R$ ' + value.toFixed(2)]}
              />
              <Bar dataKey="receitas" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" fill="var(--color-danger)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-success" />
            <span className="text-[10px] text-text-secondary">Receitas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-danger" />
            <span className="text-[10px] text-text-secondary">Despesas</span>
          </div>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="section-header">
          <h2 className="section-title">Gastos por categoria</h2>
          <span className="text-xs text-text-tertiary">Este mes</span>
        </div>
        {categoryData.length === 0 ? (
          <p className="text-text-tertiary text-sm text-center py-4">Sem dados para exibir</p>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-28 h-28 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    strokeWidth={0}
                  >
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {categoryData.map((cat) => {
                const percent = totalCatSpending > 0 ? (cat.value / totalCatSpending) * 100 : 0;
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-[11px] text-text-secondary">{cat.name}</span>
                      </div>
                      <span className="text-[11px] font-medium text-text-primary">{percent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1 rounded-full bg-surface">
                      <div className="h-full rounded-full" style={{ width: percent + '%', backgroundColor: cat.color }} />
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
