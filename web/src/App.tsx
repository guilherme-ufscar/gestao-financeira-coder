import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './lib/store/auth';
import { useTheme } from './hooks/useTheme';
import AuthLayout from './pages/auth/AuthLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import AppLayout from './pages/app/AppLayout';
import Dashboard from './pages/app/Dashboard';
import Transactions from './pages/app/Transactions';
import Calendar from './pages/app/Calendar';
import More from './pages/app/More';
import AccountsList from './pages/app/accounts/AccountsList';
import CardsList from './pages/app/cards/CardsList';
import NewTransaction from './pages/app/NewTransaction';
import SubscriptionsList from './pages/app/subscriptions/SubscriptionsList';
import InvestmentsList from './pages/app/investments/InvestmentsList';
import BudgetPage from './pages/app/budget/BudgetPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  useTheme();

  return (
    <Routes>
      <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Register />} />
        <Route path="/recuperar-senha" element={<ForgotPassword />} />
      </Route>
      <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/transacoes" element={<Transactions />} />
        <Route path="/lancamento" element={<NewTransaction />} />
        <Route path="/calendario" element={<Calendar />} />
        <Route path="/mais" element={<More />} />
        <Route path="/contas" element={<AccountsList />} />
        <Route path="/cartoes" element={<CardsList />} />
        <Route path="/assinaturas" element={<SubscriptionsList />} />
        <Route path="/investimentos" element={<InvestmentsList />} />
        <Route path="/metas" element={<BudgetPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}