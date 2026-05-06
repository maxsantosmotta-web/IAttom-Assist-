import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Search, 
  CheckCircle, 
  Megaphone, 
  FileText, 
  Sparkles, 
  Video, 
  FolderOpen, 
  Clock, 
  Settings,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/find-products", label: "Find Products", icon: Search },
  { href: "/dashboard/validate-products", label: "Validate Products", icon: CheckCircle },
  { href: "/dashboard/create-campaign", label: "Create Campaign", icon: Megaphone },
  { href: "/dashboard/create-content", label: "Create Content", icon: FileText },
  { href: "/dashboard/creative-generator", label: "Creative Generator", icon: Sparkles },
  { href: "/dashboard/video-scripts", label: "Video Scripts", icon: Video },
  { href: "/dashboard/projects", label: "Projects", icon: FolderOpen },
  { href: "/dashboard/history", label: "History", icon: Clock },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const currentPage = navItems.find(item => item.href === location)?.label || "Dashboard";

  const closeSidebar = () => setIsMobileOpen(false);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 md:hidden" 
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2" onClick={closeSidebar}>
              <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center border border-primary/30">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <span className="font-bold text-lg tracking-tight">IAttom Assist</span>
            </Link>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={closeSidebar}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Nav Links */}
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
            {navItems.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${
                    isActive 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                  onClick={closeSidebar}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* User Profile */}
          <div className="p-4 border-t border-sidebar-border shrink-0">
            <Link href="/dashboard/settings" className="flex items-center gap-3 p-2 rounded-md hover:bg-white/5 transition-colors" onClick={closeSidebar}>
              <Avatar className="w-10 h-10 border border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary">JD</AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate">John Doe</span>
                <span className="text-xs text-muted-foreground truncate">john@example.com</span>
              </div>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">{currentPage}</h1>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#0a0a0a] p-6">
          <div className="max-w-6xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
