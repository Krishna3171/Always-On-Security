import { AppSidebar } from "./app-sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-950">
      <AppSidebar />

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
