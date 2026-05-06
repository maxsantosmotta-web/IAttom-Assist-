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
  X,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useState, useEffect } from "react";
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
import {
  useSyncUser,
  useGetMe,
  getGetMeQueryKey,
  useGetCreditsBalance,
  getGetCreditsBalanceQueryKey,
} from "@workspace/api-client-react";
import { getCreditColor, getCreditBarColor } from "@/lib/credits";

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
  { href: "/dashboard/credits", label: "Credits", icon: Zap },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const syncUser = useSyncUser();
  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey(), retry: false, enabled: !!isSignedIn } });
  const { data: creditsData } = useGetCreditsBalance({
    query: {
      queryKey: getGetCreditsBalanceQueryKey(),
      retry: false,
      enabled: !!isSignedIn,
      staleTime: 60_000,
    },
  });

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const email = user.primaryEmailAddress?.emailAddress;
      const name = user.fullName ?? user.firstName ?? undefined;
      if (email) {
        syncUser.mutate({ data: { email, name } });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  const currentPage = navItems.find((item) => item.href === location)?.label || "Dashboard";
  const closeSidebar = () => setIsMobileOpen(false);

  const displayName = user?.fullName || user?.firstName || user?.username || "User";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSignOut = () => {
    signOut({ redirectUrl: `${window.location.origin}${basePath}/` });
  };

  const isAdmin = me?.role === "admin";

  const creditBalance = creditsData?.balance ?? 0;
  const creditPct = creditsData?.percentage ?? 0;
  const creditBarColor = getCreditBarColor(creditPct);
  const creditTextColor = getCreditColor(creditPct);
  const isLowCredit = creditsData?.lowCredit ?? false;

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/80 md:hidden" onClick={closeSidebar} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
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
                  {item.href === "/dashboard/credits" && isLowCredit && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-red-400 shrink-0" />
                  )}
                </Link>
              );
            })}

            {isAdmin && (
              <div className="pt-2 mt-2 border-t border-white/5">
                <Link
                  href="/admin"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${
                    location.startsWith("/admin")
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                  onClick={closeSidebar}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin Panel
                  <Badge className="ml-auto text-[9px] px-1 py-0 bg-primary/20 text-primary border-primary/30 font-semibold">
                    ADMIN
                  </Badge>
                </Link>
              </div>
            )}
          </div>

          {creditsData && (
            <div className="px-4 py-3 border-t border-sidebar-border shrink-0">
              <Link
                href="/dashboard/credits"
                onClick={closeSidebar}
                className="block group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-primary fill-primary" />
                    <span className="text-xs text-muted-foreground font-medium">Credits</span>
                  </div>
                  <span className={`text-xs font-semibold tabular-nums ${creditTextColor}`}>
                    {creditBalance.toLocaleString()}
                    <span className="text-muted-foreground font-normal"> / {creditsData.planLimit.toLocaleString()}</span>
                  </span>
                </div>
                <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${creditBarColor}`}
                    style={{ width: `${Math.min(creditPct, 100)}%` }}
                  />
                </div>
                {isLowCredit && (
                  <p className="text-[10px] text-red-400 mt-1">Low credits — tap to upgrade</p>
                )}
              </Link>
            </div>
          )}

          <div className="p-4 border-t border-sidebar-border shrink-0">
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
                    <span className="text-sm font-medium truncate text-white">
                      {isLoaded ? displayName : "Loading..."}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">{email}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56 bg-[#111111] border-white/10">
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={closeSidebar}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/credits"
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={closeSidebar}
                  >
                    <Zap className="w-4 h-4" />
                    Credits
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 cursor-pointer text-primary focus:text-primary focus:bg-primary/10"
                      onClick={closeSidebar}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
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
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">{currentPage}</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#0a0a0a] p-6">
          <div className="max-w-6xl mx-auto h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
