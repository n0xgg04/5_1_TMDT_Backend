import { Sidebar } from "@/components/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="operation-page flex h-screen overflow-hidden">
      <Sidebar section="admin" />
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
