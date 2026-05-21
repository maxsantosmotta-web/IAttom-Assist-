import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Flame, RefreshCw, Loader2, Users, Activity, Clock, BarChart2,
  Settings, WifiOff, CheckCircle2, ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface HotmartPlatformConfig {
  configured: boolean;
  isActive: boolean;
  environment?: string;
  updatedAt?: string;
}

interface HotmartUserConnection {
  id: number;
  clerkUserId: string;
  platformUserId?: string | null;
  platformUsername?: string | null;
  expiresAt?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminHotmart() {
  const [, navigate] = useLocation();
  const [connections, setConnections]         = useState<HotmartUserConnection[]>([]);
  const [loadingConns, setLoadingConns]       = useState(false);
  const [lastUpdated, setLastUpdated]         = useState<Date | null>(null);
  const [refreshing, setRefreshing]           = useState(false);
  const [platformConfig, setPlatformConfig]   = useState<HotmartPlatformConfig | null>(null);

  // ── Load platform-level config status (admin route) ──────────────────────────
  const loadPlatformStatus = useCallback(async () => {
    try {
      const data = await apiFetch<HotmartPlatformConfig>("/api/hotmart/config");
      setPlatformConfig(data);
    } catch {
      setPlatformConfig(null);
    }
  }, []);

  // ── Load per-user connection list (monitoring) ────────────────────────────────
  const loadConnections = useCallback(async () => {
    setLoadingConns(true);
    try {
      const data = await apiFetch<HotmartUserConnection[]>("/api/hotmart/user-connections");
      setConnections(data);
    } catch {
      setConnections([]);
    } finally {
      setLoadingConns(false);
    }
  }, []);

  const handleRefreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadConnections(), loadPlatformStatus()]);
    setLastUpdated(new Date());
    setRefreshing(false);
  }, [loadConnections, loadPlatformStatus]);

  useEffect(() => { void handleRefreshAll(); }, [handleRefreshAll]);

  const activeConnections = connections.filter(c => c.isActive);

  const expired = activeConnections.filter(
    c => c.expiresAt && new Date(c.expiresAt) < new Date(),
  ).length;

  const expiringSoon = activeConnections.filter(c => {
    if (!c.expiresAt) return false;
    const diff = new Date(c.expiresAt).getTime() - Date.now();
    return diff > 0 && diff < 7 * 24 * 3_600_000;
  }).length;

  const kpis = [
    {
      label: "Usuários Conectados",
      value: activeConnections.length > 0 ? String(activeConnections.length) : "0",
      icon: Users,
      color: "text-red-400",
    },
    {
      label: "Conexões Ativas",
      value: activeConnections.length > 0 ? String(activeConnections.length - expired) : "0",
      icon: Activity,
      color: "text-emerald-400",
    },
    {
      label: "Tokens Expirando",
      value: activeConnections.length > 0 ? String(expiringSoon + expired) : "0",
      icon: Clock,
      color: "text-amber-400",
    },
    {
      label: "Última Atualização",
      value: lastUpdated
        ? lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        : "—",
      icon: BarChart2,
      color: "text-zinc-400",
    },
  ];

  const isPlatformConfigured = platformConfig?.configured ?? false;
  const isPlatformActive     = platformConfig?.isActive ?? false;

  return (
    <div className="p-6 space-y-6 max-w-4xl">

      {/* ─── Header ──────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Hotmart</h1>
              <p className="text-xs text-zinc-500">Monitoramento de conexões dos usuários com a Hotmart.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isPlatformConfigured && isPlatformActive ? (
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                <CheckCircle2 className="w-2.5 h-2.5 mr-1" />Plataforma Configurada
              </Badge>
            ) : isPlatformConfigured ? (
              <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px]">
                <WifiOff className="w-2.5 h-2.5 mr-1" />Credenciais Inativas
              </Badge>
            ) : (
              <Badge className="bg-zinc-500/15 text-zinc-400 border-zinc-500/30 text-[10px]">
                <WifiOff className="w-2.5 h-2.5 mr-1" />Não Configurada
              </Badge>
            )}
            <Button size="sm" variant="outline"
              onClick={() => navigate("/admin/integrations")}
              className="border-white/10 text-zinc-400 hover:text-white h-8 gap-1.5 text-xs">
              <Settings className="w-3.5 h-3.5" />
              Configurar Hotmart
              <ExternalLink className="w-3 h-3 opacity-50" />
            </Button>
            <Button size="sm" variant="outline"
              onClick={() => void handleRefreshAll()}
              disabled={refreshing}
              className="border-white/10 text-zinc-400 hover:text-white h-8 gap-1.5 text-xs">
              {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Atualizar
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ─── Platform status note ─────────────────────────────────── */}
      {!isPlatformConfigured && (
        <div className="rounded-lg bg-amber-500/8 border border-amber-500/20 px-4 py-3 text-xs text-amber-400/80 leading-relaxed">
          As credenciais da plataforma Hotmart ainda não foram configuradas.
          Configure em <span className="font-semibold">Integrações</span> para que usuários possam autorizar suas contas.
        </div>
      )}

      {/* ─── KPIs ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-white/3 border-white/8">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider leading-tight">{label}</p>
                <Icon className={`w-3.5 h-3.5 ${color} shrink-0`} />
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Usuários Conectados ──────────────────────────────────── */}
      <Card className="bg-white/3 border-white/8">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-500" />
              Usuários Conectados
              {!loadingConns && activeConnections.length > 0 && (
                <span className="text-[11px] font-normal text-zinc-500">
                  ({activeConnections.length} {activeConnections.length === 1 ? "ativo" : "ativos"})
                </span>
              )}
            </CardTitle>
            <Button size="sm" variant="ghost" onClick={() => void loadConnections()} disabled={loadingConns}
              className="h-7 px-2 text-zinc-600 hover:text-white">
              {loadingConns
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <RefreshCw className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingConns ? (
            <div className="flex items-center gap-2 text-zinc-500 text-sm px-5 py-6">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />Carregando conexões...
            </div>
          ) : activeConnections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-2 px-5">
              <div className="w-10 h-10 rounded-full bg-white/3 border border-white/8 flex items-center justify-center mb-1">
                <Flame className="w-4 h-4 text-zinc-700" />
              </div>
              <p className="text-sm text-zinc-500">Nenhum usuário conectado à Hotmart.</p>
              <p className="text-[11px] text-zinc-700 max-w-xs">
                As conexões aparecerão aqui após usuários autorizarem suas contas Hotmart.
              </p>
            </div>
          ) : (
            <div className="max-h-[480px] overflow-y-auto divide-y divide-white/5">
              {activeConnections.map(conn => {
                const displayName = conn.platformUsername || conn.platformUserId || conn.clerkUserId;
                const isExpired   = conn.expiresAt ? new Date(conn.expiresAt) < new Date() : false;
                const isSoon      = conn.expiresAt
                  ? !isExpired && new Date(conn.expiresAt).getTime() - Date.now() < 7 * 24 * 3_600_000
                  : false;
                return (
                  <div key={conn.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/2 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/15 flex items-center justify-center shrink-0">
                      <Flame className="w-3.5 h-3.5 text-red-400/60" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-xs font-semibold text-white truncate">{displayName}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {isExpired ? (
                          <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[9px] px-1.5 py-0">Token expirado</Badge>
                        ) : isSoon ? (
                          <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[9px] px-1.5 py-0">Expirando em breve</Badge>
                        ) : (
                          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[9px] px-1.5 py-0">Ativo</Badge>
                        )}
                        <span className="text-[10px] text-zinc-600">
                          {conn.createdAt
                            ? new Date(conn.createdAt).toLocaleString("pt-BR", {
                                day: "2-digit", month: "2-digit", year: "2-digit",
                                hour: "2-digit", minute: "2-digit",
                              })
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
