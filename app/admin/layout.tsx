import AdminSidebar from "@/components/layout/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <div className="relative flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
