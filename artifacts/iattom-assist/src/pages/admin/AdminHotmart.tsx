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

// ─── Component ────────────────────────────────────────────────────────────────

interface HotmartUserConnection {
  id: number;
  clerkUserId: string;
  userEmail?: string | null;
  userName?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

export function AdminHotmart() {
  const [, navigate] = useLocation();
  const [connections, setConnections]           = useState<HotmartUserConnection[]>([]);
  const [loadingConns, setLoadingConns]         = useState(false);
  const [lastUpdated, setLastUpdated]           = useState<Date | null>(null);
  const [refreshing, setRefreshing]             = useState(false);
  const [hotmartActive, setHotmartActive]       = useState<boolean | null>(null);
  const [hotmartConfigured, setHotmartConfigured] = useState(false);
  const [disconnectConfirm, setDisconnectConfirm] = useState(false);
  const [disconnecting, setDisconnecting]       = useState(false);

  const loadHotmartStatus = useCallback(async () => {
    try {
      const data = await apiFetch<{ configured: boolean; isActive: boolean }>("/api/hotmart/config");
      setHotmartConfigured(data.configured);
      setHotmartActive(data.isActive ?? false);
    } catch {
      setHotmartActive(null);
    }
  }, []);

  const handleAdminDisconnect = useCallback(() => {
    setDisconnectConfirm(false);
    navigate("/admin/integrations");
  }, [navigate]);

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
    await Promise.all([loadConnections(), loadHotmartStatus()]);
    setLastUpdated(new Date());
    setRefreshing(false);
  }, [loadConnections, loadHotmartStatus]);

  useEffect(() => { void handleRefreshAll(); }, [handleRefreshAll]);

  const expired = connections.filter(
    c => c.expiresAt && new Date(c.expiresAt) < new Date()
  ).length;

  const expiringSoon = connections.filter(c => {
    if (!c.expiresAt) return false;
    const diff = new Date(c.expiresAt).getTime() - Date.now();
    return diff > 0 && diff < 7 * 24 * 3_600_000;
  }).length;

  const kpis = [
    { label: "Usuários Conectados", value: connections.length > 0 ? String(connections.length) : "—", icon: Users,    color: "text-red-400"     },
    { label: "Conexões Ativas",     value: connections.length > 0 ? String(connections.length - expired) : "—", icon: Activity, color: "text-emerald-400" },
    { label: "Tokens Expirando",    value: connections.length > 0 ? String(expiringSoon + expired) : "—", icon: Clock,    color: "text-amber-400"   },
    { label: "Última Atualização",  value: lastUpdated ? lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—", icon: BarChart2, color: "text-zinc-400" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-4xl">

      {/* ─── Disconnect Confirmation Modal ───────────────────────── */}
      {disconnectConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111111] border border-white/10 rounded-xl w-full max-w-md p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                <WifiOff className="w-4 h-4 text-red-400" />
              </div>
              <p className="text-sm font-semibold text-white">Desconectar Hotmart?</p>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              A integração Hotmart será desativada para toda a plataforma. Produtos e eventos salvos não serão apagados.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => void handleAdminDisconnect()}
                disabled={disconnecting}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold"
              >
                {disconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : null}
                Desconectar
              </Button>
              <Button onClick={() => setDisconnectConfirm(false)} variant="outline"
                className="border-white/10 text-zinc-400 hover:text-white">
                Cancelar
              </Button>
            </div>
          </motion.div>
        </div>
      )}

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
            {hotmartActive === true && (
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                <CheckCircle2 className="w-2.5 h-2.5 mr-1" />Ativa
              </Badge>
            )}
            {hotmartActive === false && (
              <Badge className="bg-zinc-500/15 text-zinc-400 border-zinc-500/30 text-[10px]">
                <WifiOff className="w-2.5 h-2.5 mr-1" />Desconectada
              </Badge>
            )}
            <Button size="sm" variant="outline"
              onClick={() => navigate("/admin/integrations")}
              className="border-white/10 text-zinc-400 hover:text-white h-8 gap-1.5 text-xs">
              <Settings className="w-3.5 h-3.5" />
              Configurar Hotmart
              <ExternalLink className="w-3 h-3 opacity-50" />
            </Button>
            {hotmartConfigured && hotmartActive && (
              <Button size="sm" variant="outline"
                onClick={() => setDisconnectConfirm(true)}
                disabled={disconnecting}
                className="border-red-500/30 text-red-400 hover:text-red-300 hover:border-red-400/50 h-8 gap-1.5 text-xs">
                {disconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <WifiOff className="w-3.5 h-3.5" />}
                Desconectar Hotmart
              </Button>
            )}
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
              {!loadingConns && connections.length > 0 && (
                <span className="text-[11px] font-normal text-zinc-500">
                  ({connections.length} {connections.length === 1 ? "ativo" : "ativos"})
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
          ) : connections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-2 px-5">
              <div className="w-10 h-10 rounded-full bg-white/3 border border-white/8 flex items-center justify-center mb-1">
                <Flame className="w-4 h-4 text-zinc-700" />
              </div>
              <p className="text-sm text-zinc-500">Nenhum usuário conectado à Hotmart.</p>
              <p className="text-[11px] text-zinc-700 max-w-xs">
                As conexões aparecerão aqui após o usuário autenticar sua conta.
              </p>
            </div>
          ) : (
            <div className="max-h-[480px] overflow-y-auto divide-y divide-white/5">
              {connections.map(conn => {
                const displayName = conn.userName || conn.userEmail || conn.clerkUserId;
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
                          {conn.createdAt ? new Date(conn.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
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
