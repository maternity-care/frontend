export function Footer() {
  return (
    <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between">
        <span className="font-semibold text-slate-600">Version 1.0.0</span>

        <p className="font-medium text-slate-500 sm:text-right">
          © {new Date().getFullYear()} Maternity Care
          <span className="mx-2 text-cyan-700">•</span>
          All rights reserved
        </p>
      </div>
    </footer>
  );
}
