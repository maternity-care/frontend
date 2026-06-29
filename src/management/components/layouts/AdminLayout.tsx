import { Header } from "./Header";
import { ProtectedRoute } from "./ProtectedRoute";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";

interface AdminLayoutProps {
  children: React.ReactNode;
  roles?: string[];
  permissions?: string[];
}

export function AdminLayout({ children, roles, permissions }: AdminLayoutProps) {
  return (
    <ProtectedRoute roles={roles} permissions={permissions}>
      <div className="flex h-screen overflow-hidden bg-[#f5f7fb]">
        <Sidebar />
        <div className="flex h-screen min-w-0 flex-1 flex-col overflow-y-auto">
          <Header />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  );
}
