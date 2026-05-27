import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <img
            src="/logo.svg"
            alt="Cofrin"
            className="h-14 mb-3 [data-theme=light]:invert"
          />
        </div>
        <Outlet />
      </div>
    </div>
  );
}
