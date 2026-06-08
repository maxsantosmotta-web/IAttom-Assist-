import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, Loader2, Copy, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Zap, Save, ExternalLink, FileText } from "lucide-react";
import { useGetCreditsBalance, getGetCreditsBalanceQueryKey } from "@workspace/api-client-react";
import { getEffectiveProductType, detectIncompatibility, INCOMPATIBILITY_MESSAGES, detectProductTypeMismatch, PRODUCT_TYPE_MISMATCH_MESSAGE } from "@/lib/productPlatformCompatibility";
import { useSavedItems } from "@/hooks/useSavedItems";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CreditsGate } from "@/components/CreditsGate";
import { useAiStream } from "@/hooks/useAiStream";
import type { CampaignResult, CampaignPlatformField, CampaignCreativeBriefing } from "@/types/ai";

// ─── Briefing labels ──────────────────────────────────────────────────────────
const BRIEFING_LABELS: Record<string, string> = {
  produto: "Produto",
  plataforma: "Plataforma",
  tipo_produto: "Tipo de Produto",
  objetivo: "Objetivo",
  promessa: "Promessa de Valor",
  dor: "Dor Principal",
  beneficio: "Benefício Principal",
  tom: "Tom de Voz",
  cta: "CTA Principal",
  ideia_visual: "Ideia Visual",
  restricoes: "Restrições",
};

// ─── Publicação assistida por plataforma ─────────────────────────────────────
interface PlatformGuide {
  name: string;
  url: string;
  steps: string[];
  note: string;
}

function getPlatformGuide(platform: string | undefined, fields: CampaignPlatformField[]): PlatformGuide | null {
  const get = (key: string) => fields.find((f) => f.key === key)?.value ?? "";
  const p = platform ?? "";

  switch (p) {
    case "mercado_livre":
      return {
        name: "Mercado Livre",
        url: "https://www.mercadolivre.com.br",
        steps: [
          "Acesse mercadolivre.com.br e faça login como vendedor",
          "Vá em Meus Anúncios → Criar anúncio",
          `Cole o Título do Anúncio gerado: "${get("titulo").slice(0, 60)}"`,
          "Selecione a Categoria Sugerida no campo de categoria",
          "Preencha as Características Técnicas nos atributos do produto",
          "Cole a Descrição Completa no campo de descrição do anúncio",
          "Adicione as Perguntas Frequentes via Central do Vendedor → FAQ",
          "Configure Produto Patrocinado em Publicidade para mais visibilidade",
          "Monitore visitas e conversões em Central do Vendedor → Meus Anúncios",
        ],
        note: "Publicação Assistida — orientações para publicação manual. Nenhuma ação automática é executada pela plataforma.",
      };

    case "shopee":
      return {
        name: "Shopee",
        url: "https://seller.shopee.com.br",
        steps: [
          "Acesse seller.shopee.com.br e faça login no Seller Centre",
          "Vá em Meus Produtos → Adicionar novo produto",
          `Cole o Nome do Anúncio gerado: "${get("nome_anuncio").slice(0, 120)}"`,
          "Selecione a Categoria Sugerida",
          "Cole a Descrição do Produto no campo de descrição",
          "Adicione as Palavras-chave de Busca nas tags do produto",
          "Configure as variações sugeridas se aplicável",
          "Ative Oferta Relâmpago e configure cupons em Marketing → Vouchers",
          "Acompanhe performance em Análise de Dados → Produtos",
        ],
        note: "Publicação Assistida — orientações para publicação manual. Nenhuma ação automática é executada pela plataforma.",
      };

    case "hotmart":
      return {
        name: "Hotmart",
        url: "https://app.hotmart.com",
        steps: [
          "Acesse app.hotmart.com e faça login",
          "Vá em Meus Produtos → selecione o produto → Página de Vendas",
          `Defina o Nome do Produto: "${get("nome_produto")}"`,
          `Cole a Headline: "${get("headline").slice(0, 80)}"`,
          "Cole a Descrição Completa no corpo da página de vendas",
          "Adicione os Benefícios em lista de checkmarks",
          "Adicione o Conteúdo do Produto na seção 'O que está incluso'",
          "Configure os Bônus na seção de bônus",
          `Configure a Garantia: "${get("garantia").slice(0, 80)}"`,
          `Configure o botão de compra com o CTA: "${get("cta")}"`,
          "Ative o Programa de Afiliados em Afiliados → Configurações",
        ],
        note: "Publicação Assistida — orientações para publicação manual. Nenhuma ação automática é executada pela plataforma.",
      };

    case "kiwify":
      return {
        name: "Kiwify",
        url: "https://app.kiwify.com.br",
        steps: [
          "Acesse app.kiwify.com.br e faça login",
          "Selecione o produto → Configurações → Página de Vendas",
          `Defina o Nome do Produto: "${get("nome_produto")}"`,
          `Cole a Headline: "${get("headline").slice(0, 80)}"`,
          "Cole a Descrição Completa no corpo da página",
          "Configure os Benefícios em lista",
          "Adicione os Bônus na seção correspondente",
          `Configure a Garantia: "${get("garantia").slice(0, 80)}"`,
          `Configure o botão de compra: "${get("cta")}"`,
          "Ative o Programa de Afiliados",
        ],
        note: "Publicação Assistida — orientações para publicação manual. Nenhuma ação automática é executada pela plataforma.",
      };

    case "facebook":
      return {
        name: "Facebook",
        url: "https://www.facebook.com",
        steps: [
          "Acesse sua página no Facebook → Criar publicação",
          "Cole o Texto Principal no campo de publicação",
          "Para anúncio: acesse Meta Ads Manager → Criar anúncio",
          `Use a Headline "${get("headline")}" no campo de título do anúncio`,
          `Configure a Descrição Curta "${get("descricao_curta")}" no campo descrição`,
          `Selecione o botão de CTA: "${get("cta")}"`,
          "Crie o criativo conforme a Sugestão de Criativo gerada",
          "Configure público-alvo, orçamento e veiculação",
          "Monitore resultados em Meta Ads Manager → Relatórios",
        ],
        note: "Publicação Assistida — orientações para publicação manual. Nenhuma ação automática é executada pela plataforma.",
      };

    case "instagram":
      return {
        name: "Instagram",
        url: "https://www.instagram.com",
        steps: [
          "Abra o Instagram → toque em + → Nova publicação ou Reel",
          "Escolha o formato conforme a Sugestão de Criativo gerada",
          `Use a Primeira Frase como abertura: "${get("primeira_frase").slice(0, 90)}"`,
          "Cole a Legenda completa no campo de legenda",
          "Adicione as Hashtags no final da legenda ou no primeiro comentário",
          `Finalize com o CTA: "${get("cta")}"`,
          "Para Stories: use o CTA como sticker de link ou caixa de pergunta",
          "Publique entre 18h e 21h para maior alcance orgânico",
          "Acompanhe os Insights após 24h",
        ],
        note: "Publicação Assistida — orientações para publicação manual. Nenhuma ação automática é executada pela plataforma.",
      };

    case "tiktok":
      return {
        name: "TikTok",
        url: "https://www.tiktok.com",
        steps: [
          "Abra o TikTok → toque em + → gravar ou importar vídeo",
          `Comece com o Gancho nos primeiros 2 segundos: "${get("gancho").slice(0, 80)}"`,
          "Siga o Roteiro gerado para o desenvolvimento do vídeo",
          "Adicione legendas em tela com o texto-chave do roteiro",
          "Cole a Legenda gerada no campo de legenda do vídeo",
          "Adicione as Hashtags na legenda",
          `Finalize com o CTA: "${get("cta")}"`,
          "Configure o som conforme a Sugestão de Criativo",
          "Publique e monitore retenção nos primeiros 30 minutos",
        ],
        note: "Publicação Assistida — orientações para publicação manual. Nenhuma ação automática é executada pela plataforma.",
      };

    default:
      return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isCampaignComplete(r: CampaignResult | null): r is CampaignResult {
  if (!r) return false;
  if (r.platformFields && r.platformFields.length > 0) {
    return r.platformFields.some((f) => f.value?.trim());
  }
  // legacy check
  return !!(r.headline?.trim() && r.audience?.trim());
}

function getBlockContent(data: CampaignResult, blockId: string): string {
  if (blockId.startsWith("platformField.")) {
    const key = blockId.replace("platformField.", "");
    return data.platformFields?.find((f) => f.key === key)?.value ?? "";
  }
  switch (blockId) {
    case "headline": return data.headline;
    case "audience": return data.audience;
    default: return "";
  }
}

function applyRefinedContent(prev: CampaignResult | null, blockId: string, content: string): CampaignResult | null {
  if (!prev) return prev;
  if (blockId.startsWith("platformField.")) {
    const key = blockId.replace("platformField.", "");
    return {
      ...prev,
      platformFields: prev.platformFields?.map((f) => f.key === key ? { ...f, value: content } : f),
    };
  }
  switch (blockId) {
    case "headline": return { ...prev, headline: content };
    case "audience": return { ...prev, audience: content };
    default: return prev;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function RefineBar({
  blockId: _blockId, value, onChange, onRefine, isRefining, disabled,
}: {
  blockId: string; value: string; onChange: (v: string) => void;
  onRefine: () => void; isRefining: boolean; disabled: boolean;
}) {
  return (
    <div className="mt-2.5 flex gap-2 items-center">
      <input
        className="flex-1 text-xs bg-[#0a0a0a] border border-white/10 rounded px-2.5 py-1.5 text-white placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/40 disabled:opacity-50"
        placeholder="Instrução de refinamento para este campo..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !isRefining && !disabled && value.trim()) onRefine(); }}
        disabled={isRefining || disabled}
      />
      <button
        onClick={onRefine}
        disabled={isRefining || disabled || !value.trim()}
        className="text-xs px-2.5 py-1.5 rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shrink-0 transition-colors"
      >
        {isRefining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
        Refinar
      </button>
    </div>
  );
}

function PlatformFieldBlock({
  field, refineInput, onRefineChange, onRefine, isRefining, disabled,
}: {
  field: CampaignPlatformField; refineInput: string; onRefineChange: (v: string) => void;
  onRefine: () => void; isRefining: boolean; disabled: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();
  const charLimit = 300;
  const preview = field.value.slice(0, charLimit);
  const hasMore = field.value.length > charLimit;

  return (
    <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-lg p-4">
      <div className="flex items-start justify-between mb-2 gap-2">
        <p className="text-xs font-semibold text-primary leading-tight">{field.label}</p>
        <button
          onClick={() => {
            void navigator.clipboard.writeText(field.value);
            toast({ description: `${field.label} copiado.` });
          }}
          className="text-muted-foreground hover:text-white transition-colors shrink-0"
          title="Copiar campo"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
        {expanded ? field.value : preview}
        {hasMore && !expanded && "..."}
      </p>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-primary/60 hover:text-primary mt-1.5 flex items-center gap-1 transition-colors"
        >
          {expanded ? <><ChevronUp className="w-3 h-3" /> Recolher</> : <><ChevronDown className="w-3 h-3" /> Ver completo</>}
        </button>
      )}
      <RefineBar
        blockId={`platformField.${field.key}`}
        value={refineInput}
        onChange={onRefineChange}
        onRefine={onRefine}
        isRefining={isRefining}
        disabled={disabled}
      />
    </div>
  );
}

function CreativeBriefingBlock({ briefing }: { briefing: CampaignCreativeBriefing }) {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  const entries = Object.entries(briefing).filter(([, v]) => v?.trim());

  const copyAll = () => {
    const text = entries.map(([k, v]) => `${BRIEFING_LABELS[k] ?? k}: ${v}`).join("\n");
    void navigator.clipboard.writeText(text);
    toast({ description: "Briefing copiado." });
  };

  return (
    <div className="border border-white/[0.05] rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-muted-foreground/60" />
          <p className="text-[11px] text-muted-foreground/60 uppercase tracking-widest font-medium">Briefing Criativo</p>
        </div>
        {expanded
          ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/60" />
          : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/60" />}
      </button>
      {expanded && (
        <div className="border-t border-white/[0.05] px-4 pb-4 pt-3 space-y-3">
          <div className="flex justify-end">
            <button
              onClick={copyAll}
              className="text-xs text-muted-foreground hover:text-white transition-colors flex items-center gap-1"
            >
              <Copy className="w-3 h-3" /> Copiar tudo
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-2">
            {entries.map(([key, value]) => (
              <div key={key} className="bg-[#0a0a0a] rounded p-2.5">
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mb-0.5">
                  {BRIEFING_LABELS[key] ?? key}
                </p>
                <p className="text-xs text-zinc-300 leading-snug">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function CreateCampaign() {
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("");
  const [mode, setMode] = useState("");
  const [productType, setProductType] = useState("");
  const { status, result, error, generate, reset } = useAiStream<CampaignResult>();
  const { toast } = useToast();
  const { saveItem } = useSavedItems();
  const { isFetching: fetchingCredits, refetch: refetchCredits } = useGetCreditsBalance({
    query: { queryKey: getGetCreditsBalanceQueryKey(), staleTime: 0 },
  });

  const refundCalledRef = useRef(false);
  useEffect(() => {
    if (status === "error" && !refundCalledRef.current) {
      refundCalledRef.current = true;
      fetch("/api/credits/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature: "campaign" }),
        credentials: "include",
      }).catch(() => {});
    }
    if (status === "idle" || status === "generating") {
      refundCalledRef.current = false;
    }
  }, [status]);

  const [isSaving, setIsSaving] = useState(false);
  const [campaignData, setCampaignData] = useState<CampaignResult | null>(null);
  const [refineInputs, setRefineInputs] = useState<Record<string, string>>({});
  const [refiningBlock, setRefiningBlock] = useState<string | null>(null);
  const [isRestored, setIsRestored] = useState(false);

  const isGenerating = status === "generating";
  const isDone = status === "done";
  const isError = status === "error";

  // Prefill from other modules
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("iattom_campaign_prefill");
      if (!raw) return;
      sessionStorage.removeItem("iattom_campaign_prefill");
      const prefill = JSON.parse(raw) as { product?: string; goal?: string };
      if (prefill.product) setProduct(prefill.product);
      if (prefill.goal) setGoal(prefill.goal);
    } catch {}
  }, []);

  // Reopen from Projetos Salvos
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("iattom_reopen_campaign_v1");
      if (!raw) return;
      sessionStorage.removeItem("iattom_reopen_campaign_v1");
      const saved = JSON.parse(raw) as {
        briefing?: { product?: string; goal?: string; mode?: string; audience?: string; productType?: string };
        result?: CampaignResult;
      };
      if (saved.briefing?.product) setProduct(saved.briefing.product);
      if (saved.briefing?.goal) setGoal(saved.briefing.goal);
      if (saved.briefing?.mode) setMode(saved.briefing.mode);
      if (saved.briefing?.audience) setAudience(saved.briefing.audience);
      if (saved.briefing?.productType) setProductType(saved.briefing.productType);
      if (saved.result) {
        setCampaignData(saved.result);
        setIsRestored(true);
      }
    } catch {}
  }, []);

  const handleReset = () => {
    reset();
    setCampaignData(null);
    setRefineInputs({});
    setRefiningBlock(null);
    setIsRestored(false);
  };

  const incompatibility = detectIncompatibility(getEffectiveProductType(product, productType || null), goal);
  const typeMismatch = detectProductTypeMismatch(product, productType || null);

  const runGenerate = (charge: () => void) => {
    if (isGenerating || !goal) return;
    generate("/api/ai/create-campaign", {
      product,
      audience: audience || undefined,
      goal: goal || undefined,
      mode: mode || undefined,
      productType: productType || undefined,
    }).then((res) => {
      if (res !== null) {
        charge();
        setCampaignData(res);
      }
    });
  };

  const setRefineInput = (blockId: string, value: string) => {
    setRefineInputs((prev) => ({ ...prev, [blockId]: value }));
  };

  const refineBlock = async (blockId: string) => {
    const instruction = refineInputs[blockId] ?? "";
    if (!instruction.trim() || !campaignData || refiningBlock) return;
    setRefiningBlock(blockId);
    const currentContent = getBlockContent(campaignData, blockId);
    const campaignContext = [product, goal, mode].filter(Boolean).join(" / ");
    try {
      const res = await fetch("/api/ai/refine-campaign-block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockId, currentContent, instruction, campaignContext }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json() as { refinedContent: string };
      setCampaignData((prev) => applyRefinedContent(prev, blockId, data.refinedContent));
      setRefineInputs((prev) => ({ ...prev, [blockId]: "" }));
    } catch (err) {
      toast({
        description: err instanceof Error ? err.message : "Erro ao refinar campo",
        variant: "destructive",
      });
    } finally {
      setRefiningBlock(null);
    }
  };

  const handleSave = async () => {
    if (!campaignData || isSaving) return;
    const title = product.trim()
      ? `${product.trim()}${goal ? ` — ${goal}` : ""}`
      : (campaignData.platformFields?.[0]?.value?.slice(0, 60) ?? campaignData.headline ?? "Campanha");
    const platform = campaignData.platform;

    const lines: string[] = [];
    if (campaignData.platformFields && campaignData.platformFields.length > 0) {
      lines.push(`ENTREGA — ${goal || product.trim()}`);
      if (product.trim()) lines.push(`Produto: ${product.trim()}`);
      lines.push("");
      campaignData.platformFields.forEach((f) => {
        lines.push(`${f.label.toUpperCase()}:`);
        lines.push(f.value);
        lines.push("");
      });
    } else {
      lines.push(`CAMPANHA: ${campaignData.headline}`);
      if (campaignData.audience) lines.push(`Público: ${campaignData.audience}`);
    }
    const content = lines.join("\n");
    const structuredData = JSON.stringify({
      briefing: { product: product.trim(), goal, mode, audience, productType },
      result: campaignData,
    });
    const projectId = crypto.randomUUID();
    try {
      const raw = localStorage.getItem("iattom_saved_items_v1");
      const existing = raw ? (JSON.parse(raw) as object[]) : [];
      existing.unshift({ id: projectId, title, type: "campaign", platform, content, data: structuredData, hasImages: false, createdAt: new Date().toISOString() });
      localStorage.setItem("iattom_saved_items_v1", JSON.stringify(existing));
    } catch {}
    setIsSaving(true);
    try {
      await saveItem({ id: projectId, title, type: "campaign", platform, content, data: structuredData, hasImages: false });
      toast({ description: "Projeto salvo em Projetos Salvos." });
    } catch {
      toast({ description: "Erro ao salvar. Tente novamente.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const showResult = (isDone || isRestored) && isCampaignComplete(campaignData);
  const hasPlatformFields = !!(campaignData?.platformFields && campaignData.platformFields.length > 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">Entrega por Plataforma</p>
          <h2 className="text-2xl font-bold text-white mb-1">Criar Campanha</h2>
          <p className="text-muted-foreground text-sm">Escolha a plataforma. A IA gera exatamente os campos que você precisa — na ordem de copiar e colar.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => void refetchCredits()} disabled={fetchingCredits} className="border-white/10 text-zinc-400 hover:text-white hover:border-white/20 gap-1.5 shrink-0 mt-1">
          <RefreshCw className={`w-3.5 h-3.5 ${fetchingCredits ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </motion.div>

      {/* Restored banner */}
      {isRestored && campaignData && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
              <p className="text-sm text-primary font-medium">Entrega restaurada de Projetos Salvos</p>
            </div>
            <button onClick={handleReset} className="text-xs text-muted-foreground hover:text-white transition-colors flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3" /> Nova entrega
            </button>
          </div>
        </motion.div>
      )}

      {/* Form */}
      {!(isRestored && campaignData) && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <Card className="bg-[#111111] border-white/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-white">Dados da Entrega</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Produto / Marca</Label>
                  <Input
                    placeholder="ex: Garrafa HydroElite, Curso de Excel, Consultoria de Tráfego"
                    className="bg-[#0a0a0a] border-white/10 focus-visible:ring-primary/50"
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">
                    Plataforma de Destino <span className="text-red-400">*</span>
                  </Label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className={`w-full h-9 rounded-md border bg-[#0a0a0a] px-3 py-1 text-sm text-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-0 transition-colors ${product.trim() && !goal ? "border-amber-500/40" : "border-white/10"}`}
                  >
                    <option value="" disabled>Selecionar plataforma</option>
                    <optgroup label="Marketplaces">
                      <option value="Vender no Mercado Livre">Mercado Livre</option>
                      <option value="Vender na Shopee">Shopee</option>
                    </optgroup>
                    <optgroup label="Produtos Digitais">
                      <option value="Vender na Hotmart">Hotmart</option>
                      <option value="Vender na Kiwify">Kiwify</option>
                    </optgroup>
                    <optgroup label="Redes Sociais">
                      <option value="Vender no Facebook">Facebook</option>
                      <option value="Vender no Instagram">Instagram</option>
                      <option value="Vender no TikTok">TikTok</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Tipo de Produto</Label>
                  <select
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    className="w-full h-9 rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-1 text-sm text-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-0"
                  >
                    <option value="">Selecionar tipo (opcional)</option>
                    <option value="Digital">Digital — curso, ebook, software, assinatura</option>
                    <option value="Físico">Físico — roupas, eletrônicos, suplementos</option>
                    <option value="Serviço">Serviço — consultoria, mentoria, agência</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Modo da Campanha</Label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="w-full h-9 rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-1 text-sm text-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-0"
                  >
                    <option value="">Padrão (Conversão)</option>
                    <option value="Orgânico">Orgânico — sem tráfego pago</option>
                    <option value="Iniciante">Iniciante — primeiras vendas</option>
                    <option value="Conversão">Conversão — venda imediata</option>
                    <option value="Viral">Viral — UGC, compartilhamento</option>
                    <option value="Agressivo">Agressivo — alta pressão, remarketing</option>
                    <option value="Premium">Premium — posicionamento de alto valor</option>
                    <option value="Escala">Escala — produto validado em expansão</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Público-alvo (opcional)</Label>
                <Input
                  placeholder="ex: Mulheres 25-40 interessadas em bem-estar, atletas amadores"
                  className="bg-[#0a0a0a] border-white/10 focus-visible:ring-primary/50"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                />
              </div>

              {/* Alerts */}
              {incompatibility && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/[0.07] px-3.5 py-3">
                  <span className="text-red-400 text-sm leading-none mt-0.5">!</span>
                  <p className="text-xs text-red-300/90 leading-relaxed">{INCOMPATIBILITY_MESSAGES[incompatibility]}</p>
                </div>
              )}
              {typeMismatch && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/[0.07] px-3.5 py-3">
                  <span className="text-red-400 text-sm leading-none mt-0.5">!</span>
                  <p className="text-xs text-red-300/90 leading-relaxed">{PRODUCT_TYPE_MISMATCH_MESSAGE}</p>
                </div>
              )}
              {product.trim() && !goal && (
                <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-3.5 py-3">
                  <span className="text-amber-400 text-sm leading-none mt-0.5">!</span>
                  <p className="text-xs text-amber-300/90 leading-relaxed">
                    Selecione a plataforma de destino antes de gerar.
                  </p>
                </div>
              )}

              <CreditsGate
                feature="campaign"
                onSuccess={runGenerate}
                disabled={!product.trim() || !goal || isGenerating || incompatibility !== null || typeMismatch}
              >
                {({ trigger, isLoading }) => (
                  <Button
                    onClick={trigger}
                    disabled={isLoading || isGenerating || !product.trim() || !goal || incompatibility !== null || typeMismatch}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 w-full disabled:opacity-40"
                  >
                    {isLoading || isGenerating ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Gerando entrega...</>
                    ) : "Gerar Entrega"}
                  </Button>
                )}
              </CreditsGate>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* States */}
      <AnimatePresence mode="wait">
        {isGenerating && (
          <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center gap-3 text-muted-foreground mb-5">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <span className="text-sm">Gerando campos para {goal?.replace("Vender n", "").replace("Vender no", "").replace("Vender na", "").trim() ?? "a plataforma"}...</span>
            </div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 rounded-lg bg-white/[0.03] border border-white/[0.04] animate-pulse" style={{ animationDelay: `${i * 0.08}s` }} />
              ))}
            </div>
          </motion.div>
        )}

        {isError && (
          <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="bg-red-950/20 border-red-500/20">
              <CardContent className="p-5 flex items-center gap-4">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-400">Falha na geração</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{error ?? "Não foi possível gerar a entrega. Tente novamente."}</p>
                </div>
                <Button size="sm" variant="outline" onClick={handleReset} className="border-red-500/30 text-red-400 hover:bg-red-500/10 shrink-0">
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Tentar novamente
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {showResult && campaignData && (
          <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="space-y-4">
            <Card className="bg-[#111111] border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Megaphone className="w-4 h-4 text-primary shrink-0" />
                  <CardTitle className="text-base text-white">
                    {goal?.replace("Vender n", "").replace("Vender no ", "").replace("Vender na ", "").trim() ?? "Entrega"}
                    {product.trim() ? ` — ${product.trim()}` : ""}
                  </CardTitle>
                  <div className="ml-auto flex items-center gap-3">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="text-xs text-muted-foreground hover:text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Save className="w-3 h-3" /> {isSaving ? "Salvando..." : "Salvar"}
                    </button>
                    <button
                      onClick={handleReset}
                      className="text-xs text-muted-foreground hover:text-white transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3 h-3" /> Nova entrega
                    </button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* ── NOVA ARQUITETURA: Campos por plataforma ── */}
                {hasPlatformFields && campaignData.platformFields && (
                  <>
                    <div className="flex items-center gap-2 pb-1 border-b border-white/[0.05]">
                      <p className="text-[11px] text-muted-foreground/60 uppercase tracking-widest font-medium">
                        Entrega da plataforma — copie e cole na ordem
                      </p>
                    </div>

                    <div className="space-y-3">
                      {campaignData.platformFields.map((field) => {
                        const blockId = `platformField.${field.key}`;
                        return (
                          <PlatformFieldBlock
                            key={field.key}
                            field={field}
                            refineInput={refineInputs[blockId] ?? ""}
                            onRefineChange={(v) => setRefineInput(blockId, v)}
                            onRefine={() => refineBlock(blockId)}
                            isRefining={refiningBlock === blockId}
                            disabled={!!refiningBlock && refiningBlock !== blockId}
                          />
                        );
                      })}
                    </div>

                    {/* Briefing criativo — colapsável, discreto */}
                    {campaignData.creativeBriefing && (
                      <CreativeBriefingBlock briefing={campaignData.creativeBriefing} />
                    )}
                  </>
                )}

                {/* ── FALLBACK LEGADO — saves antigos sem platformFields ── */}
                {!hasPlatformFields && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/15">
                      <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">Manchete</p>
                      <p className="text-white font-bold text-lg leading-snug">{campaignData.headline}</p>
                      {campaignData.subheadline && <p className="text-muted-foreground text-sm mt-1">{campaignData.subheadline}</p>}
                      {campaignData.cta && <p className="text-primary text-sm font-semibold mt-2">CTA: {campaignData.cta}</p>}
                    </div>
                    {campaignData.audience && (
                      <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5">Público</p>
                        <p className="text-sm text-white">{campaignData.audience}</p>
                      </div>
                    )}
                    {campaignData.keyMessages?.length > 0 && (
                      <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Mensagens-chave</p>
                        <div className="space-y-1.5">
                          {campaignData.keyMessages.map((msg, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="text-primary font-bold text-xs mt-0.5 shrink-0">{i + 1}</span>
                              <p className="text-xs text-muted-foreground">{msg}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Publicação assistida */}
                {hasPlatformFields && campaignData.platformFields && (() => {
                  const guide = getPlatformGuide(campaignData.platform, campaignData.platformFields);
                  if (!guide) return null;
                  return (
                    <div className="border-t border-white/[0.05] pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-primary/80 uppercase tracking-widest font-medium">Publicação Assistida</p>
                        <a
                          href={guide.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary/70 hover:text-primary border border-primary/20 hover:border-primary/40 rounded px-2 py-1 bg-primary/5 hover:bg-primary/10 transition-colors flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> Abrir {guide.name}
                        </a>
                      </div>
                      <div className="bg-[#0a0a0a] border border-primary/10 rounded-lg p-4">
                        <ol className="space-y-2">
                          {guide.steps.map((step, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                              <span className="text-primary font-bold text-xs shrink-0 mt-0.5 w-4">{i + 1}.</span>
                              <p className="text-xs text-muted-foreground leading-relaxed">{step}</p>
                            </li>
                          ))}
                        </ol>
                        <p className="text-xs text-muted-foreground/40 italic border-t border-white/5 pt-2 mt-3">{guide.note}</p>
                      </div>
                    </div>
                  );
                })()}

              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
