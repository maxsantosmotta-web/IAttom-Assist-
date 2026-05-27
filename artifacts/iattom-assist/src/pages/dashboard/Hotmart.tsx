import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Flame, Loader2, X, Info, AlertCircle,
  Megaphone, ClipboardList, ExternalLink,
  CheckCircle2, BarChart2, ShoppingBag, TrendingUp,
  RefreshCw, Copy, Package, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw Object.assign(new Error(body.error ?? `HTTP ${res.status}`), { status: res.status });
  }
  return res.json() as Promise<T>;
}

function InformativeModal({
  title,
  description,
  onClose,
  action,
}: {
  title: string;
  description: string;
  onClose: () => void;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#111111] border border-white/10 rounded-xl w-full max-w-md p-6 space-y-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Info className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm font-semibold text-white">{title}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        <div className="flex gap-2">
          {action && (
            <Button
              onClick={() => { action.onClick(); onClose(); }}
              className="flex-1 bg-primary text-black hover:bg-primary/90 font-semibold"
            >
              {action.label}
            </Button>
          )}
          <Button
            onClick={onClose}
            variant={action ? "outline" : "default"}
            className={action
              ? "border-white/10 text-muted-foreground hover:text-white"
              : "w-full bg-primary text-black hover:bg-primary/90 font-semibold"}
          >
            {action ? "Cancelar" : "Entendido"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

interface HotmartProduct {
  id: number;
  productId: string;
  name?: string | null;
  price?: string | null;
  currency?: string | null;
}

interface HotmartEvent {
  id: number;
  eventType?: string | null;
  buyerName?: string | null;
  buyerEmail?: string | null;
  value?: string | null;
  currency?: string | null;
  receivedAt?: string | null;
}

function thirtyDaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d;
}

function revenueIn30d(events: HotmartEvent[]): string {
  const cutoff = thirtyDaysAgo();
  const total = events
    .filter(e => e.eventType === "PURCHASE_APPROVED" && e.receivedAt && new Date(e.receivedAt) >= cutoff)
    .reduce((sum, e) => sum + parseFloat(e.value ?? "0"), 0);
  if (total === 0) return "R$ 0";
  return total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function Hotmart() {
  const { toast } = useToast();

  const [products, setProducts] = useState<HotmartProduct[]>([]);
  const [events, setEvents] = useState<HotmartEvent[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [modal, setModal] = useState<{
    title: string;
    description: string;
    action?: { label: string; onClick: () => void };
  } | null>(null);

  const showInfo = (
    title: string,
    description: string,
    action?: { label: string; onClick: () => void },
  ) => setModal({ title, description, action });

  const webhookEndpoint = `${window.location.origin}${BASE}/api/hotmart/webhook`;

  const handleLoadProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const data = await apiFetch<HotmartProduct[]>("/api/hotmart/user/products");
      setProducts(data);
    } catch {
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const handleLoadEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const data = await apiFetch<HotmartEvent[]>("/api/hotmart/user/sales");
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    void handleLoadProducts();
    void handleLoadEvents();
  }, [handleLoadProducts, handleLoadEvents]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await handleLoadProducts();
      await handleLoadEvents();
      toast({ description: "Sincronização concluída." });
    } finally {
      setSyncing(false);
    }
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookEndpoint);
    toast({ description: "Endereço copiado." });
  };

  const handleCriarCampanha = () => {
    sessionStorage.setItem("campaign_platform_context", JSON.stringify({ platform: "hotmart" }));
    window.location.href = `${BASE}/dashboard/create-campaign`;
  };

  const handleCriarConteudo = () => {
    sessionStorage.setItem("content_platform_context", JSON.stringify({ platform: "hotmart" }));
    window.location.href = `${BASE}/dashboard/create-content`;
  };

  const cutoff = thirtyDaysAgo();
  const approvedIn30d = events.filter(e =>
    e.eventType === "PURCHASE_APPROVED" && e.receivedAt && new Date(e.receivedAt) >= cutoff
  ).length;
  const hasActivity = events.length > 0;

  return (
    <div className="space-y-6">
      {modal && (
        <InformativeModal
          title={modal.title}
          description={modal.description}
          action={modal.action}
          onClose={() => setModal(null)}
        />
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Hotmart</h1>
              <p className="text-xs text-muted-foreground">Produtos digitais e campanhas</p>
            </div>
          </div>
          <Button
            onClick={handleCriarCampanha}
            className="bg-orange-500 hover:bg-orange-400 text-white font-semibold"
            size="sm"
          >
            <Megaphone className="w-3.5 h-3.5 mr-2" />
            Criar campanha
          </Button>
        </div>

        {/* ── Status Card ──────────────────────────────────────── */}
        <Card className="bg-[#111111] border-white/[0.06] mb-5">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Hotmart</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-400">Conta ativa</span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void handleSync()}
                  disabled={syncing}
                  className="border-white/10 text-muted-foreground hover:text-white h-8 text-xs gap-1.5"
                >
                  {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  Sincronizar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open("https://app.hotmart.com", "_blank", "noopener,noreferrer")}
                  className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 h-8 text-xs gap-1.5"
                >
                  <ExternalLink className="w-3 h-3" />
                  Abrir Hotmart
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Feature Cards 2×2 ────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-4">

          {/* Campanhas */}
          <Card className="bg-[#111111] border-white/[0.06]">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Megaphone className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-white">Campanhas</CardTitle>
                  <p className="text-xs text-muted-foreground">Promoção e alcance</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Crie campanhas para promover seus produtos Hotmart em diferentes canais.
              </p>
              <div className="grid grid-cols-3 gap-2 py-1">
                {[
                  { icon: Megaphone, label: "Campanhas", value: "—" },
                  { icon: BarChart2, label: "Alcance", value: "—" },
                  { icon: TrendingUp, label: "Conversão", value: "—" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="p-2 rounded bg-white/5 text-center">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs font-semibold text-white">{value}</p>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                onClick={handleCriarCampanha}
                className="w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold h-8 text-xs"
              >
                <Megaphone className="w-3 h-3 mr-1.5" />
                Criar campanha
              </Button>
            </CardContent>
          </Card>

          {/* Conteúdo */}
          <Card className="bg-[#111111] border-white/[0.06]">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-white">Conteúdo</CardTitle>
                  <p className="text-xs text-muted-foreground">Textos, criativos e scripts</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Produza materiais de divulgação para seus produtos.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCriarConteudo}
                  className="w-full border-white/10 text-muted-foreground hover:text-white h-8 text-xs"
                >
                  <ClipboardList className="w-3 h-3 mr-1.5" />
                  Criar conteúdo
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    sessionStorage.setItem("video_platform_context", JSON.stringify({ platform: "hotmart" }));
                    window.location.href = `${BASE}/dashboard/video-scripts`;
                  }}
                  className="w-full border-white/10 text-muted-foreground hover:text-white h-8 text-xs"
                >
                  <FileText className="w-3 h-3 mr-1.5" />
                  Scripts de vídeo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Atividade da conta */}
          <Card className="bg-[#111111] border-white/[0.06]">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-white">Atividade da conta</CardTitle>
                  <p className="text-xs text-muted-foreground">Movimentações recentes</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 py-1">
                {[
                  {
                    icon: CheckCircle2,
                    label: "Notificações",
                    value: hasActivity ? "Ativas" : "Aguardando",
                    ok: hasActivity,
                  },
                  {
                    icon: ShoppingBag,
                    label: "Vendas recebidas",
                    value: loadingEvents ? "—" : String(events.length),
                    ok: events.length > 0,
                  },
                  {
                    icon: TrendingUp,
                    label: "Aprovadas (30d)",
                    value: loadingEvents ? "—" : String(approvedIn30d),
                    ok: approvedIn30d > 0,
                  },
                ].map(({ icon: Icon, label, value, ok }) => (
                  <div key={label} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${ok ? "text-emerald-400" : "text-muted-foreground"}`} />
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                    <span className={`text-xs font-medium ${ok ? "text-emerald-400" : "text-white"}`}>{value}</span>
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => showInfo(
                  "Notificações de vendas",
                  "Configure o endereço abaixo no painel Hotmart para receber notificações de vendas, reembolsos e assinaturas em tempo real.",
                  { label: "Copiar endereço", onClick: handleCopyWebhook },
                )}
                className="w-full border-white/10 text-muted-foreground hover:text-white h-8 text-xs"
              >
                <Copy className="w-3 h-3 mr-1.5" />
                Conectar conta
              </Button>
            </CardContent>
          </Card>

          {/* Análise */}
          <Card className="bg-[#111111] border-white/[0.06]">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <BarChart2 className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-white">Análise</CardTitle>
                  <p className="text-xs text-muted-foreground">Produtos e receita</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Acompanhe o desempenho dos seus produtos e receita nos últimos 30 dias.
              </p>
              <div className="grid grid-cols-2 gap-2 py-1">
                {[
                  { icon: Package, label: "Produtos", value: loadingProducts ? "—" : String(products.length) },
                  { icon: BarChart2, label: "Receita (30d)", value: loadingEvents ? "—" : revenueIn30d(events) },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="p-2 rounded bg-white/5 text-center">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs font-semibold text-white truncate">{value}</p>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open("https://app.hotmart.com", "_blank", "noopener,noreferrer")}
                className="w-full border-white/10 text-muted-foreground hover:text-white h-8 text-xs"
              >
                <ExternalLink className="w-3 h-3 mr-1.5" />
                Ver análise
              </Button>
            </CardContent>
          </Card>

        </div>

      </motion.div>
    </div>
  );
}
