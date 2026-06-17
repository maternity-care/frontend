import { Header } from "./Header";
import { ProtectedRoute } from "./ProtectedRoute";
import { Sidebar } from "./Sidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
  roles?: string[];
  permissions?: string[];
}

export function AdminLayout({ children, roles, permissions }: AdminLayoutProps) {
  return (
    <ProtectedRoute roles={roles} permissions={permissions}>
      <div className="flex min-h-screen bg-[#f5f7fb]">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <Header />
          <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
