import NSOSidebar from "@/components/layout/NSOSidebar";

export default function NSOLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <NSOSidebar />
      <div className="relative flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
