import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Music2, RefreshCw, Loader2, Users, Activity, Clock, BarChart2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TikTokUserConnection {
  id: number;
  clerkUserId: string;
  displayName?: string | null;
  userEmail?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

const fmtDate = (d: string | null | undefined) =>
  d
    ? new Date(d).toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "2-digit",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminTikTok() {
  const [connections, setConnections]       = useState<TikTokUserConnection[]>([]);
  const [loadingConns, setLoadingConns]     = useState(false);
  const [lastUpdated, setLastUpdated]       = useState<Date | null>(null);
  const [refreshing, setRefreshing]         = useState(false);

  const loadConnections = useCallback(async () => {
    setLoadingConns(true);
    try {
      const data = await apiFetch<TikTokUserConnection[]>("/api/tiktok/user-connections");
      setConnections(data);
    } catch {
      setConnections([]);
    } finally {
      setLoadingConns(false);
    }
  }, []);

  const handleRefreshAll = useCallback(async () => {
    setRefreshing(true);
    await loadConnections();
    setLastUpdated(new Date());
    setRefreshing(false);
  }, [loadConnections]);

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
    { label: "Usuários Conectados", value: connections.length > 0 ? String(connections.length) : "—", icon: Users,    color: "text-violet-400"  },
    { label: "Conexões Ativas",     value: connections.length > 0 ? String(connections.length - expired) : "—", icon: Activity, color: "text-emerald-400" },
    { label: "Tokens Expirando",    value: connections.length > 0 ? String(expiringSoon + expired) : "—", icon: Clock,    color: "text-amber-400"   },
    { label: "Última Atualização",  value: lastUpdated ? lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—", icon: BarChart2, color: "text-zinc-400" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-4xl">

      {/* ─── Header ──────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
              <Music2 className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">TikTok</h1>
              <p className="text-xs text-zinc-500">Monitoramento de conexões dos usuários com o TikTok.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">Monitoramento ativo</Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void handleRefreshAll()}
              disabled={refreshing}
              className="border-white/10 text-zinc-400 hover:text-white h-8 gap-1.5 text-xs"
            >
              {refreshing
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <RefreshCw className="w-3.5 h-3.5" />}
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
                <Music2 className="w-4 h-4 text-zinc-700" />
              </div>
              <p className="text-sm text-zinc-500">Nenhum usuário conectado ao TikTok.</p>
              <p className="text-[11px] text-zinc-700 max-w-xs">
                As conexões aparecerão aqui após o usuário autenticar sua conta TikTok.
              </p>
            </div>
          ) : (
            <div className="max-h-[480px] overflow-y-auto divide-y divide-white/5">
              {connections.map(conn => {
                const displayName  = conn.displayName || conn.userEmail || conn.clerkUserId;
                const isExpired    = conn.expiresAt ? new Date(conn.expiresAt) < new Date() : false;
                const isSoon       = conn.expiresAt
                  ? !isExpired && new Date(conn.expiresAt).getTime() - Date.now() < 7 * 24 * 3_600_000
                  : false;
                return (
                  <div key={conn.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/2 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-violet-500/10 border border-violet-500/15 flex items-center justify-center shrink-0">
                      <Music2 className="w-3.5 h-3.5 text-violet-400/60" />
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
                        <span className="text-[10px] text-zinc-600">Conectado em {fmtDate(conn.createdAt)}</span>
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
