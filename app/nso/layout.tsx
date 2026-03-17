import NSOSidebar from "@/components/layout/NSOSidebar";

export default function NSOLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <NSOSidebar />
      <div className="ml-[290px] flex flex-1 flex-col">{children}</div>
    </div>
  );
}
