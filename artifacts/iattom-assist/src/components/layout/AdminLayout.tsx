import { Link, useLocation } from "wouter";
import {
  BarChart3,
  Users,
  TrendingUp,
  Activity,
  Sparkles,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useUser, useClerk } from "@clerk/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { href: "/admin", label: "Overview", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/admin/activity", label: "Activity", icon: Activity },
];

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const currentPage = navItems.find((item) => item.href === location)?.label || "Admin";
  const closeSidebar = () => setIsMobileOpen(false);

  const displayName = user?.fullName || user?.firstName || user?.username || "Admin";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleSignOut = () => {
    signOut({ redirectUrl: `${window.location.origin}${basePath}/` });
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/80 md:hidden" onClick={closeSidebar} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0d0d0d] border-r border-primary/10 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 h-16 px-6 border-b border-primary/10 shrink-0">
            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center border border-primary/30">
              <ShieldCheck className="w-4 h-4 text-primary" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white">Admin</span>
              <Badge className="ml-2 text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-primary/30 font-semibold">
                PANEL
              </Badge>
            </div>
            <Button variant="ghost" size="icon" className="md:hidden ml-auto" onClick={closeSidebar}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="px-3 py-3 border-b border-primary/5">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
              onClick={closeSidebar}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Back to Dashboard
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
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

          <div className="p-4 border-t border-primary/10 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 p-2 rounded-md hover:bg-white/5 transition-colors w-full text-left">
                  <Avatar className="w-9 h-9 border border-primary/20 shrink-0">
                    {user?.imageUrl && <AvatarImage src={user.imageUrl} alt={displayName} />}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {isLoaded ? initials : ""}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                    <span className="text-sm font-medium truncate text-white">{isLoaded ? displayName : "Loading..."}</span>
                    <span className="text-xs text-primary font-medium">Administrator</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56 bg-[#111111] border-white/10">
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-red-400 focus:text-red-400 focus:bg-red-400/10 cursor-pointer gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 border-b border-primary/10 bg-[#0a0a0a] shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h1 className="text-base font-semibold">{currentPage}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">{email}</span>
            <Badge className="bg-primary/15 text-primary border-primary/25 text-xs">Admin</Badge>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#080808] p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
