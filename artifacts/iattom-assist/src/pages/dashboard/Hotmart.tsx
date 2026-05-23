import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Flame, Loader2, ClipboardList,
  RefreshCw, ShoppingBag, DollarSign,
  Package, Megaphone, FolderOpen, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

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

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface SavedCampaign {
  id: string;
  title: string;
  content?: string;
  data?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function readSavedCampaigns(): SavedCampaign[] {
  const items: SavedCampaign[] = [];
  const seen = new Set<string>();
  try {
    const raw = localStorage.getItem("iattom_saved_items_v1");
    if (raw) {
      const parsed = JSON.parse(raw) as Array<{ id: string; title: string; type: string; platform?: string; content?: string; data?: string }>;
      if (Array.isArray(parsed)) {
        for (const i of parsed) {
          if (i.platform === "hotmart" && !seen.has(i.id)) {
            items.push({ id: i.id, title: i.title, content: i.content, data: i.data });
            seen.add(i.id);
          }
        }
      }
    }
  } catch {}
  try {
    const raw = localStorage.getItem("iattom_hotmart_campaigns_v1");
    if (raw) {
      const parsed = JSON.parse(raw) as SavedCampaign[];
      if (Array.isArray(parsed)) {
        for (const i of parsed) {
          if (!seen.has(i.id)) { items.push(i); seen.add(i.id); }
        }
      }
    }
  } catch {}
  return items;
}

function downloadCampaign(campaign: SavedCampaign) {
  const esc = (s?: string) =>
    (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  if (campaign.data) {
    try {
      const parsed = JSON.parse(campaign.data) as {
        briefing?: { product?: string; goal?: string; mode?: string; audience?: string };
        result?: {
          headline?: string;
          subheadline?: string;
          cta?: string;
          audience?: string;
          channels?: string[];
          budget?: string;
          copy?: Record<string, string>;
          keyMessages?: string[];
          launchTimeline?: string;
          uniqueAngle?: string;
          objectionHandling?: string;
        };
      };
      const r = parsed.result ?? {};
      const b = parsed.briefing ?? {};
      const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><title>${esc(campaign.title)}</title>
<style>body{font-family:Arial,sans-serif;max-width:820px;margin:0 auto;padding:2rem;background:#fff;color:#1a1a1a}h1{font-size:1.5rem;border-bottom:3px solid #C9A84C;padding-bottom:.5rem;margin-bottom:1.5rem}h2{font-size:1rem;color:#C9A84C;margin-top:2rem;margin-bottom:.75rem;text-transform:uppercase;letter-spacing:.05em}h3{font-size:.875rem;color:#555;margin-top:1.25rem;margin-bottom:.5rem;text-transform:uppercase;letter-spacing:.05em}.field{margin-bottom:1rem}.label{font-size:.7rem;text-transform:uppercase;letter-spacing:.1em;color:#888;margin-bottom:.25rem}.value{font-size:.9rem;white-space:pre-wrap;background:#f9f9f9;padding:.75rem;border-radius:4px;border:1px solid #eee;line-height:1.6}.chip{display:inline-block;background:#f0e8d5;color:#8a6d2a;border-radius:3px;padding:2px 8px;font-size:.8rem;margin:2px}ul{padding-left:1.25rem;margin:0}li{margin-bottom:.5rem;font-size:.9rem;line-height:1.5}.footer{margin-top:3rem;font-size:.7rem;color:#aaa;border-top:1px solid #eee;padding-top:1rem;text-align:center}</style>
</head><body>
<h1>${esc(campaign.title)}</h1>
${b.product ? `<p style="color:#888;font-size:.85rem;">Produto: ${esc(b.product)}${b.goal ? ` · ${esc(b.goal)}` : ""}</p>` : ""}
<h2>Manchete</h2>
${r.headline ? `<div class="field"><div class="label">Headline</div><div class="value">${esc(r.headline)}</div></div>` : ""}
${r.subheadline ? `<div class="field"><div class="label">Subheadline</div><div class="value">${esc(r.subheadline)}</div></div>` : ""}
${r.cta ? `<div class="field"><div class="label">CTA</div><div class="value">${esc(r.cta)}</div></div>` : ""}
<h2>Estratégia</h2>
${r.audience ? `<div class="field"><div class="label">Público-alvo</div><div class="value">${esc(r.audience)}</div></div>` : ""}
${r.channels?.length ? `<div class="field"><div class="label">Canais</div><div class="value">${r.channels.map(c => `<span class="chip">${esc(c)}</span>`).join(" ")}</div></div>` : ""}
${r.budget ? `<div class="field"><div class="label">Orçamento</div><div class="value">${esc(r.budget)}</div></div>` : ""}
${r.uniqueAngle ? `<div class="field"><div class="label">Ângulo Único</div><div class="value">${esc(r.uniqueAngle)}</div></div>` : ""}
${r.objectionHandling ? `<div class="field"><div class="label">Gestão de Objeções</div><div class="value">${esc(r.objectionHandling)}</div></div>` : ""}
${r.keyMessages?.length ? `<h2>Mensagens-chave</h2><ul>${r.keyMessages.map(m => `<li>${esc(m)}</li>`).join("")}</ul>` : ""}
${r.copy ? `<h2>Copy por Plataforma</h2>${Object.entries(r.copy).map(([pl, cp]) => `<div class="field"><h3>${esc(pl)}</h3><div class="value">${esc(cp)}</div></div>`).join("")}` : ""}
${r.launchTimeline ? `<h2>Cronograma</h2><div class="field"><div class="value">${esc(r.launchTimeline)}</div></div>` : ""}
<div class="footer">Gerado por IAttom Assist &middot; ${new Date().toLocaleDateString("pt-BR")}</div>
</body></html>`;
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `campanha-hotmart-${campaign.id.slice(0, 8)}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    } catch {}
  }
  const text = campaign.content ?? campaign.title;
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${campaign.title.replace(/[^a-z0-9]/gi, "_")}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

const isConnected = false;

// ─── Component ───────────────────────────────────────────────────────────────

export function Hotmart() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [products, setProducts]               = useState<HotmartProduct[]>([]);
  const [events, setEvents]                   = useState<HotmartEvent[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingEvents, setLoadingEvents]     = useState(false);
  const [syncing, setSyncing]                 = useState(false);
  const [savedCampaigns, setSavedCampaigns]   = useState<SavedCampaign[]>([]);
  const [showAdSelector, setShowAdSelector]   = useState(false);

  const handleRefreshCampaigns = useCallback(() => {
    setSavedCampaigns(readSavedCampaigns());
  }, []);

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
    handleRefreshCampaigns();
    if (isConnected) {
      void handleLoadProducts();
      void handleLoadEvents();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSync = () => {
    setSyncing(true);
    handleRefreshCampaigns();
    setTimeout(() => {
      setSyncing(false);
      toast({ description: "Lista de campanhas atualizada." });
    }, 400);
  };

  const handleCreateCampaign = () => {
    sessionStorage.setItem(
      "iattom_campaign_prefill",
      JSON.stringify({ product: "", goal: "Vender na Hotmart", platform: "hotmart" }),
    );
    navigate("/dashboard/create-campaign");
    toast({ description: "Campanha pré-configurada para Hotmart." });
  };

  const handleCreateAd = () => {
    if (savedCampaigns.length === 0) {
      toast({ description: "Nenhuma campanha salva ainda. Crie uma campanha primeiro." });
      return;
    }
    setShowAdSelector(prev => !prev);
  };

  const handleSelectCampaignForAd = (campaign: SavedCampaign) => {
    setShowAdSelector(false);
    window.open("https://editor.pages.hotmart.com", "_blank", "noopener,noreferrer");
    toast({ description: `Editor Hotmart aberto. Publique "${campaign.title}".` });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const cutoff = thirtyDaysAgo();
  const approvedIn30d = events.filter(e =>
    e.eventType === "PURCHASE_APPROVED" && e.receivedAt && new Date(e.receivedAt) >= cutoff
  ).length;
  const approvedSales = events.filter(e => e.eventType === "PURCHASE_APPROVED");

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="space-y-5">

        {/* 1. TOPO */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Hotmart</h1>
              <p className="text-xs text-muted-foreground">Produtos digitais, afiliados e assinaturas</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            disabled={syncing}
            className="border-white/10 text-muted-foreground hover:text-white"
          >
            {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <RefreshCw className="w-3.5 h-3.5 mr-2" />}
            Sincronizar
          </Button>
        </div>

        {/* 2. CONECTAR HOTMART */}
        <div className="flex justify-center">
          <Button
            onClick={() => window.open("https://app.hotmart.com", "_blank", "noopener,noreferrer")}
            className="bg-orange-500 hover:bg-orange-400 text-white font-semibold px-8"
          >
            Conectar Hotmart
          </Button>
        </div>

        {/* 3. CRIAR CAMPANHA */}
        <Card className="bg-[#111111] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-orange-400" />
              Criar Campanha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-6 text-center gap-4">
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                  Crie e organize o material da sua campanha dentro do IAttom antes de publicar.
                </p>
              </div>
              <Button
                size="sm"
                onClick={handleCreateCampaign}
                className="bg-orange-500 hover:bg-orange-400 text-white font-semibold"
              >
                <ClipboardList className="w-3.5 h-3.5 mr-2" />
                Criar Campanha
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 4. PUBLICAR ANÚNCIO HOTMART */}
        <Card className="bg-[#111111] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-orange-400" />
              Publicar Anúncio Hotmart
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-6 text-center gap-4">
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                  Selecione uma campanha salva e publique seu anúncio diretamente na Hotmart.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCreateAd}
                className="border-orange-500/30 text-orange-400 hover:text-orange-300 hover:border-orange-400/50"
              >
                <Megaphone className="w-3.5 h-3.5 mr-2" />
                Criar Anúncio
              </Button>

              {/* Seletor inline de campanhas */}
              {showAdSelector && (
                <div className="w-full mt-2 rounded-lg border border-white/10 bg-[#0d0d0d] overflow-hidden">
                  <p className="text-xs text-muted-foreground px-4 pt-3 pb-2 border-b border-white/5">
                    Escolha uma campanha para publicar:
                  </p>
                  <div className="divide-y divide-white/5">
                    {savedCampaigns.map((campaign) => (
                      <button
                        key={campaign.id}
                        onClick={() => handleSelectCampaignForAd(campaign)}
                        className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors"
                      >
                        {campaign.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 5. KPIs — um abaixo do outro */}
        <div className="grid grid-cols-1 gap-3">
          <Card className="bg-[#111111] border-white/[0.06]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Produtos</p>
                <Package className="w-3.5 h-3.5 text-orange-400" />
              </div>
              {loadingProducts
                ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                : <p className="text-xl font-bold text-white">{products.length}</p>
              }
            </CardContent>
          </Card>

          <Card className="bg-[#111111] border-white/[0.06]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Vendas (30d)</p>
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              {loadingEvents
                ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                : <p className="text-xl font-bold text-white">{approvedIn30d}</p>
              }
            </CardContent>
          </Card>

          <Card className="bg-[#111111] border-white/[0.06]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Receita (30d)</p>
                <DollarSign className="w-3.5 h-3.5 text-primary" />
              </div>
              {loadingEvents
                ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                : <p className="text-xl font-bold text-white">{revenueIn30d(events)}</p>
              }
            </CardContent>
          </Card>
        </div>

        {/* 6. VENDAS RECENTES */}
        <Card className="bg-[#111111] border-white/[0.06]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                Vendas Recentes
                {approvedSales.length > 0 && (
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs">
                    {approvedSales.filter(e => e.receivedAt && new Date(e.receivedAt) >= thirtyDaysAgo()).length} nos últimos 30d
                  </Badge>
                )}
              </CardTitle>
              <Button size="sm" variant="ghost"
                onClick={() => void handleLoadEvents()}
                disabled={loadingEvents}
                className="text-muted-foreground hover:text-white h-7 px-2">
                {loadingEvents ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingEvents ? (
              <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Carregando...</span>
              </div>
            ) : approvedSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <ShoppingBag className="w-9 h-9 text-white/8 mb-3" />
                <p className="text-sm font-semibold text-muted-foreground">Nenhuma venda registrada ainda</p>
                <p className="text-xs text-muted-foreground/50 mt-1.5 max-w-xs leading-relaxed">
                  As vendas da sua conta Hotmart aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {approvedSales.slice(0, 20).map((ev) => {
                  const date = ev.receivedAt
                    ? new Date(ev.receivedAt).toLocaleString("pt-BR", {
                        day: "2-digit", month: "2-digit", year: "2-digit",
                        hour: "2-digit", minute: "2-digit",
                      })
                    : null;
                  const buyer = ev.buyerName ?? ev.buyerEmail ?? "—";
                  const amount = ev.value && parseFloat(ev.value) > 0
                    ? parseFloat(ev.value).toLocaleString("pt-BR", { style: "currency", currency: ev.currency ?? "BRL" })
                    : null;
                  return (
                    <div key={ev.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-[#0d0d0d] border border-white/5 hover:border-white/10 transition-colors">
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs border shrink-0">
                        Aprovada
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{buyer}</p>
                        {date && <p className="text-[10px] text-muted-foreground tabular-nums mt-0.5">{date}</p>}
                      </div>
                      {amount && (
                        <span className="text-sm font-semibold text-primary shrink-0">{amount}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 7. CAMPANHAS SALVAS */}
        <Card className="bg-[#111111] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-muted-foreground" />
              Campanhas Salvas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {savedCampaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <FolderOpen className="w-9 h-9 text-white/8 mb-3" />
                <p className="text-sm font-semibold text-muted-foreground">Nenhuma campanha salva ainda</p>
              </div>
            ) : (
              <div className="max-h-[168px] overflow-y-auto space-y-1.5 pr-1">
                {savedCampaigns.slice(0, 10).map((campaign) => (
                  <div key={campaign.id}
                    className="px-3 py-2.5 rounded-lg bg-[#0d0d0d] border border-white/5">
                    <p className="text-sm text-white truncate">{campaign.title}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </motion.div>
    </div>
  );
}
