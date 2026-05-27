import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Layers, Loader2, X, Info, AlertCircle,
  Megaphone, ClipboardList, ExternalLink,
  CheckCircle2, BarChart2, ShoppingBag, TrendingUp,
  RefreshCw, Copy, Package, FileText, Save, Eye, EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const USER_CREDS_KEY = "iattom_kiwify_user_config_v1";

interface UserKiwifyCreds {
  storeId: string;
  clientId: string;
  savedAt: string;
}

function loadUserCreds(): UserKiwifyCreds | null {
  try {
    const raw = localStorage.getItem(USER_CREDS_KEY);
    return raw ? (JSON.parse(raw) as UserKiwifyCreds) : null;
  } catch {
    return null;
  }
}

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

interface KiwifyProduct {
  id: number;
  productId: string;
  name?: string | null;
  type?: string | null;
  status?: string | null;
  price?: string | null;
  currency?: string | null;
}

interface KiwifyEvent {
  id: number;
  eventType?: string | null;
  orderId?: string | null;
  buyerName?: string | null;
  buyerEmail?: string | null;
  value?: string | null;
  receivedAt?: string | null;
}

const EVENT_LABELS: Record<string, string> = {
  "order.approved": "Aprovada",
  "order.waiting_payment": "Aguardando",
  "order.refunded": "Reembolso",
  "order.chargeback": "Estorno",
  "order.canceled": "Cancelada",
  "order.abandoned": "Abandono",
  "subscription.active": "Assinatura ativa",
  "subscription.canceled": "Assinatura cancelada",
};

const EVENT_COLORS: Record<string, string> = {
  "order.approved": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "order.waiting_payment": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "order.refunded": "bg-orange-500/15 text-orange-400 border-orange-500/30",
  "order.chargeback": "bg-red-500/15 text-red-400 border-red-500/30",
  "order.canceled": "bg-red-500/15 text-red-400 border-red-500/30",
  "order.abandoned": "bg-zinc-700/40 text-zinc-400 border-zinc-600/30",
  "subscription.active": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

export function Kiwify() {
  const { toast } = useToast();

  const [savedCreds, setSavedCreds] = useState<UserKiwifyCreds | null>(loadUserCreds);
  const [form, setForm] = useState({ storeId: "", clientId: "", clientSecret: "" });
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmClearCreds, setConfirmClearCreds] = useState(false);

  const [products, setProducts] = useState<KiwifyProduct[]>([]);
  const [events, setEvents] = useState<KiwifyEvent[]>([]);
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

  const webhookEndpoint = `${window.location.origin}${BASE}/api/kiwify/webhook`;

  const handleSaveCreds = async () => {
    if (!form.storeId || !form.clientId) {
      toast({ variant: "destructive", description: "Store ID e Client ID são obrigatórios." });
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    const creds: UserKiwifyCreds = {
      storeId: form.storeId,
      clientId: form.clientId,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(USER_CREDS_KEY, JSON.stringify(creds));
    setSavedCreds(creds);
    setForm({ storeId: "", clientId: "", clientSecret: "" });
    setSaving(false);
    toast({ description: "Conta Kiwify configurada com sucesso." });
  };

  const handleLoadProducts = async () => {
    setLoadingProducts(true);
    try {
      const data = await apiFetch<KiwifyProduct[]>("/api/kiwify/products");
      setProducts(data);
    } catch (err) {
      const e = err as { status?: number };
      if (e.status === 403 || e.status === 401) {
        showInfo(
          "Produtos Kiwify",
          "A listagem de produtos é gerenciada pelo administrador da plataforma. Configure suas credenciais e solicite ao administrador que realize a sincronização.",
        );
      } else {
        toast({ variant: "destructive", description: "Não foi possível carregar os produtos." });
      }
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleLoadEvents = async () => {
    setLoadingEvents(true);
    try {
      const data = await apiFetch<KiwifyEvent[]>("/api/kiwify/events");
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await apiFetch<{ ok: boolean; synced: number }>("/api/kiwify/sync-products", { method: "POST" });
      toast({ description: "Sincronização concluída." });
      void handleLoadProducts();
    } catch (err) {
      const e = err as { status?: number };
      if (e.status === 403 || e.status === 401) {
        showInfo(
          "Sincronização Kiwify",
          "A sincronização de produtos é uma operação administrativa. Solicite ao administrador que realize a sincronização.",
        );
      } else {
        toast({ variant: "destructive", description: err instanceof Error ? err.message : "Falha na sincronização." });
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookEndpoint);
    toast({ description: "Endereço copiado." });
  };

  const handleCriarCampanha = () => {
    sessionStorage.setItem("campaign_platform_context", JSON.stringify({ platform: "kiwify" }));
    window.location.href = `${BASE}/dashboard/create-campaign`;
  };

  const handleCriarConteudo = () => {
    sessionStorage.setItem("content_platform_context", JSON.stringify({ platform: "kiwify" }));
    window.location.href = `${BASE}/dashboard/create-content`;
  };

  useEffect(() => {
    if (savedCreds) {
      void handleLoadProducts();
      void handleLoadEvents();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedCreds?.storeId]);

  const approvedCount = events.filter(e => e.eventType === "order.approved").length;
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
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Kiwify</h1>
              <p className="text-xs text-muted-foreground">Produtos digitais e vendas</p>
            </div>
          </div>
          <Button
            onClick={handleCriarCampanha}
            className="bg-primary hover:bg-primary/90 text-black font-semibold"
            size="sm"
          >
            <Megaphone className="w-3.5 h-3.5 mr-2" />
            Criar campanha
          </Button>
        </div>

        {/* ── Status Card ──────────────────────────────────────── */}
        <Card className="bg-[#111111] border-white/[0.06] mb-5">
          <CardContent className="p-4">
            {savedCreds ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">Loja: {savedCreds.storeId}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-400">Conta conectada</span>
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
                    variant="ghost"
                    onClick={() => setConfirmClearCreds(true)}
                    className="text-red-400/70 hover:text-red-400 h-8 text-xs gap-1.5"
                  >
                    Desconectar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Conta não configurada</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      Insira suas credenciais para conectar sua loja Kiwify.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Store ID</Label>
                    <Input
                      value={form.storeId}
                      onChange={(e) => setForm((f) => ({ ...f, storeId: e.target.value }))}
                      placeholder="sua_loja_id"
                      className="bg-[#0a0a0a] border-white/10 text-white h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Client ID</Label>
                    <Input
                      value={form.clientId}
                      onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                      placeholder="client_abc123"
                      className="bg-[#0a0a0a] border-white/10 text-white h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="relative">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Client Secret (opcional)</Label>
                  <Input
                    type={showSecret ? "text" : "password"}
                    value={form.clientSecret}
                    onChange={(e) => setForm((f) => ({ ...f, clientSecret: e.target.value }))}
                    placeholder="••••••••"
                    className="bg-[#0a0a0a] border-white/10 text-white pr-10 h-8 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret((v) => !v)}
                    className="absolute right-3 top-[calc(50%+10px)] text-muted-foreground hover:text-white transition-colors"
                  >
                    {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <Button
                  onClick={() => void handleSaveCreds()}
                  disabled={saving}
                  className="w-full bg-primary text-black hover:bg-primary/90 font-semibold"
                  size="sm"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Conectar conta
                </Button>
              </div>
            )}

            {confirmClearCreds && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/5 border border-red-500/20 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">Deseja desconectar esta conta?</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmClearCreds(false)}
                    className="text-muted-foreground h-7 text-xs px-3"
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      localStorage.removeItem(USER_CREDS_KEY);
                      setSavedCreds(null);
                      setConfirmClearCreds(false);
                      toast({ description: "Conta Kiwify desconectada." });
                    }}
                    className="bg-red-600 hover:bg-red-500 text-white h-7 text-xs px-3 font-semibold"
                  >
                    Confirmar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Feature Cards 2×2 ────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-4">

          {/* Campanhas */}
          <Card className="bg-[#111111] border-white/[0.06]">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Megaphone className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-white">Campanhas</CardTitle>
                  <p className="text-xs text-muted-foreground">Promoção e alcance</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Crie campanhas para promover seus produtos Kiwify em diferentes canais.
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
                className="w-full bg-primary hover:bg-primary/90 text-black font-semibold h-8 text-xs"
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
                    sessionStorage.setItem("video_platform_context", JSON.stringify({ platform: "kiwify" }));
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
              {loadingEvents ? (
                <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">Carregando...</span>
                </div>
              ) : hasActivity ? (
                <div className="space-y-1.5 py-1">
                  {events.slice(0, 4).map((ev) => (
                    <div key={ev.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#0d0d0d] border border-white/5">
                      <span className={`text-[10px] border rounded px-1.5 py-0.5 shrink-0 ${EVENT_COLORS[ev.eventType ?? ""] ?? "bg-zinc-700/40 text-zinc-400 border-zinc-600/30"}`}>
                        {EVENT_LABELS[ev.eventType ?? ""] ?? ev.eventType ?? "—"}
                      </span>
                      <p className="text-xs text-white truncate flex-1">
                        {ev.buyerName ?? ev.buyerEmail ?? "—"}
                      </p>
                      {ev.value && (
                        <span className="text-xs font-semibold text-primary shrink-0">R$ {ev.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 py-1">
                  {[
                    {
                      icon: CheckCircle2,
                      label: "Notificações",
                      value: "Aguardando",
                      ok: false,
                    },
                    {
                      icon: ShoppingBag,
                      label: "Vendas recebidas",
                      value: "—",
                      ok: false,
                    },
                    {
                      icon: TrendingUp,
                      label: "Aprovadas",
                      value: "—",
                      ok: false,
                    },
                  ].map(({ icon: Icon, label, value, ok }) => (
                    <div key={label} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-3.5 h-3.5 ${ok ? "text-emerald-400" : "text-muted-foreground"}`} />
                        <span className="text-xs text-muted-foreground">{label}</span>
                      </div>
                      <span className="text-xs font-medium text-white">{value}</span>
                    </div>
                  ))}
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => showInfo(
                  "Notificações de vendas",
                  "Configure o endereço abaixo no painel Kiwify para receber notificações de compras em tempo real.",
                  { label: "Copiar endereço", onClick: handleCopyWebhook },
                )}
                className="w-full border-white/10 text-muted-foreground hover:text-white h-8 text-xs"
              >
                <Copy className="w-3 h-3 mr-1.5" />
                Conectar notificações
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
                  <p className="text-xs text-muted-foreground">Produtos e vendas</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Acompanhe seus produtos e o volume de vendas aprovadas.
              </p>
              <div className="grid grid-cols-2 gap-2 py-1">
                {[
                  {
                    icon: Package,
                    label: "Produtos",
                    value: loadingProducts ? "—" : String(products.length),
                  },
                  {
                    icon: ShoppingBag,
                    label: "Aprovadas",
                    value: loadingEvents ? "—" : String(approvedCount),
                  },
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
                onClick={() => window.open("https://app.kiwify.com.br", "_blank", "noopener,noreferrer")}
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
