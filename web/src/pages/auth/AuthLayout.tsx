import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo.svg"
            alt="Cofrin"
            className="h-12 mb-2 [data-theme=light]:invert"
          />
        </div>
        <Outlet />
      </div>
    </div>
  );
}
