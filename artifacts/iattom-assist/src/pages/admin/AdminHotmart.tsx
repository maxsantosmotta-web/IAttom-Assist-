import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Flame, RefreshCw, Loader2, Activity, Clock, BarChart2,
  Settings, WifiOff, CheckCircle2, ExternalLink, Package,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

interface HotmartProduct {
  id: number;
}

interface HotmartEvent {
  id: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminHotmart() {
  const [, navigate] = useLocation();
  const [platformConfig, setPlatformConfig] = useState<HotmartPlatformConfig | null>(null);
  const [productCount, setProductCount]     = useState<number | null>(null);
  const [eventCount, setEventCount]         = useState<number | null>(null);
  const [lastUpdated, setLastUpdated]       = useState<Date | null>(null);
  const [refreshing, setRefreshing]         = useState(false);

  // ── Load platform-level config status ────────────────────────────────────────
  const loadPlatformStatus = useCallback(async () => {
    try {
      const data = await apiFetch<HotmartPlatformConfig>("/api/hotmart/config");
      setPlatformConfig(data);
    } catch {
      setPlatformConfig(null);
    }
  }, []);

  // ── Load product count ────────────────────────────────────────────────────────
  const loadProducts = useCallback(async () => {
    try {
      const data = await apiFetch<HotmartProduct[]>("/api/hotmart/products");
      setProductCount(data.length);
    } catch {
      setProductCount(0);
    }
  }, []);

  // ── Load event count ──────────────────────────────────────────────────────────
  const loadEvents = useCallback(async () => {
    try {
      const data = await apiFetch<HotmartEvent[]>("/api/hotmart/events");
      setEventCount(data.length);
    } catch {
      setEventCount(0);
    }
  }, []);

  const handleRefreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadPlatformStatus(), loadProducts(), loadEvents()]);
    setLastUpdated(new Date());
    setRefreshing(false);
  }, [loadPlatformStatus, loadProducts, loadEvents]);

  useEffect(() => { void handleRefreshAll(); }, [handleRefreshAll]);

  const kpis = [
    {
      label: "Total de Produtos",
      value: productCount !== null ? String(productCount) : "—",
      icon: Package,
      color: "text-red-400",
    },
    {
      label: "Eventos Recebidos",
      value: eventCount !== null ? String(eventCount) : "—",
      icon: Activity,
      color: "text-emerald-400",
    },
    {
      label: "Ambiente",
      value: platformConfig?.environment
        ? platformConfig.environment === "production" ? "Produção" : "Sandbox"
        : "Não configurado",
      icon: BarChart2,
      color: "text-amber-400",
    },
    {
      label: "Última Atualização",
      value: lastUpdated
        ? lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        : "Nunca",
      icon: Clock,
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
              <p className="text-xs text-zinc-500">Central da plataforma Hotmart — produtos, eventos e configuração.</p>
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
          Configure em <span className="font-semibold">Integrações</span> para ativar a sincronização de produtos e o recebimento de eventos.
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

    </div>
  );
}
