import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import RouteLoadingOverlay from "@/components/layout/RouteLoadingOverlay";
import CollapsiblePanels from "@/components/layout/CollapsiblePanels";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-shell">
      <RouteLoadingOverlay />
      <CollapsiblePanels />
      <Sidebar />

      <div className="admin-main">
        <Header />
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
