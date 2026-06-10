import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Megaphone, Sparkles, FileText, ChevronRight,
  Check, RefreshCw, Loader2, ArrowLeft, ShoppingCart,
  ShoppingBag, Music2, Flame, Layers, Facebook, Instagram,
  Globe, Image, AlignLeft,
} from "lucide-react";
import { useAuth } from "@clerk/react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const BASE = (import.meta.env.BASE_URL as string).replace(/\/$/, "");

type SavedItem = {
  id: string;
  title: string;
  type: string;
  platform: string | null;
  content: string;
  data: string | null;
  hasImages: boolean;
  createdAt: string;
};

type Step = "campaign" | "creative" | "content" | "review";

const STEPS: { key: Step; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
  { key: "campaign", label: "Campanha",  icon: Megaphone, desc: "Selecione o briefing da campanha" },
  { key: "creative", label: "Criativo",  icon: Sparkles,  desc: "Selecione a imagem ou criativo" },
  { key: "content",  label: "Conteúdo",  icon: FileText,  desc: "Selecione o texto do anúncio" },
  { key: "review",   label: "Lançar",    icon: Target,    desc: "Revise e configure o anúncio" },
];

type PlatformTarget = {
  key: string;
  label: string;
  route: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
};

const PLATFORMS: PlatformTarget[] = [
  { key: "facebook",     label: "Facebook",      route: "/dashboard/facebook",      icon: Facebook,     color: "text-blue-400 bg-blue-500/10 border-blue-500/20"     },
  { key: "instagram",    label: "Instagram",     route: "/dashboard/instagram",     icon: Instagram,    color: "text-pink-400 bg-pink-500/10 border-pink-500/20"     },
  { key: "tiktok",       label: "TikTok",        route: "/dashboard/tiktok",        icon: Music2,       color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20"     },
  { key: "hotmart",      label: "Hotmart",       route: "/dashboard/hotmart",       icon: Flame,        color: "text-red-400 bg-red-500/10 border-red-500/20"        },
  { key: "kiwify",       label: "Kiwify",        route: "/dashboard/kiwify",        icon: Layers,       color: "text-violet-400 bg-violet-500/10 border-violet-500/20"},
  { key: "shopee",       label: "Shopee",        route: "/dashboard/shopee",        icon: ShoppingBag,  color: "text-orange-400 bg-orange-500/10 border-orange-500/20"},
  { key: "mercado-livre",label: "Mercado Livre", route: "/dashboard/mercado-livre", icon: ShoppingCart, color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"},
];

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

function ItemCard({
  item,
  selected,
  onSelect,
  previewIcon: PreviewIcon,
}: {
  item: SavedItem;
  selected: boolean;
  onSelect: () => void;
  previewIcon: React.ComponentType<{ className?: string }>;
}) {
  const preview = item.content.slice(0, 100).trim();
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-150 ${
        selected
          ? "bg-primary/10 border-primary/40 ring-1 ring-primary/30"
          : "bg-[#111111] border-white/5 hover:border-white/15"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          selected ? "bg-primary/20 border border-primary/30" : "bg-white/[0.04] border border-white/8"
        }`}>
          {selected
            ? <Check className="w-4 h-4 text-primary" />
            : <PreviewIcon className="w-4 h-4 text-zinc-500" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${selected ? "text-primary" : "text-white"}`}>
            {item.title}
          </p>
          {preview && (
            <p className="text-[11px] text-zinc-500 line-clamp-2 mt-0.5 leading-relaxed">
              {preview}{item.content.length > 100 ? "…" : ""}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            {item.platform && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-zinc-600 border-white/8">
                {item.platform}
              </Badge>
            )}
            {item.hasImages && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-violet-400 border-violet-500/20">
                <Image className="w-2.5 h-2.5 mr-1" />imagens
              </Badge>
            )}
            <span className="text-[10px] text-zinc-700">{fmtDate(item.createdAt)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

export function CreateAd() {
  const { getToken } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [items, setItems]           = useState<SavedItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [step, setStep]             = useState<Step>("campaign");
  const [selCampaign, setSelCampaign] = useState<SavedItem | null>(null);
  const [selCreative, setSelCreative] = useState<SavedItem | null>(null);
  const [selContent, setSelContent]   = useState<SavedItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${BASE}/api/saved-items`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error();
      setItems(await res.json() as SavedItem[]);
    } catch {
      toast({ title: "Erro ao carregar itens", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [getToken, toast]);

  useEffect(() => { void load(); }, [load]);

  const campaigns    = items.filter((i) => i.type === "campaign");
  const creatives    = items.filter((i) => i.type === "creative");
  const contents     = items.filter((i) => i.type === "content");

  const currentStepIdx = STEPS.findIndex((s) => s.key === step);

  const canAdvance = () => {
    if (step === "campaign") return !!selCampaign;
    if (step === "creative") return !!selCreative;
    if (step === "content")  return !!selContent;
    return false;
  };

  const handleNext = () => {
    if (step === "campaign") setStep("creative");
    else if (step === "creative") setStep("content");
    else if (step === "content")  setStep("review");
  };

  const handleBack = () => {
    if (step === "creative") setStep("campaign");
    else if (step === "content")  setStep("creative");
    else if (step === "review")   setStep("content");
  };

  const handleLaunch = (platform: PlatformTarget) => {
    const prefill = {
      source: "create-ad",
      campaign: selCampaign ? { id: selCampaign.id, title: selCampaign.title, content: selCampaign.content } : null,
      creative: selCreative ? { id: selCreative.id, title: selCreative.title } : null,
      content:  selContent  ? { id: selContent.id,  title: selContent.title,  content: selContent.content  } : null,
    };
    sessionStorage.setItem("iattom_campaign_prefill", JSON.stringify({ product: selCampaign?.title ?? "" }));
    toast({ description: `Abrindo ${platform.label} com o anúncio configurado.` });
    navigate(platform.route);
  };

  const StepIcon = STEPS[currentStepIdx]?.icon ?? Target;

  return (
    <div className="space-y-8">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">Anúncio</p>
        <h2 className="text-2xl font-bold text-white mb-1">Criar Anúncio</h2>
        <p className="text-muted-foreground text-sm">
          Monte seu anúncio reutilizando campanhas, criativos e conteúdos já gerados.
        </p>
      </motion.div>

      {/* Step indicators */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
        className="flex items-center gap-2"
      >
        {STEPS.map((s, idx) => {
          const done    = idx < currentStepIdx;
          const active  = s.key === step;
          const Icon    = s.icon;
          return (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors ${
                active  ? "bg-primary/15 border-primary/30 text-primary" :
                done    ? "bg-white/[0.04] border-white/10 text-emerald-400" :
                          "bg-transparent border-transparent text-zinc-600"
              }`}>
                {done
                  ? <Check className="w-3 h-3" />
                  : <Icon className="w-3 h-3" />}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <ChevronRight className="w-3 h-3 text-zinc-700 shrink-0" />
              )}
            </div>
          );
        })}
      </motion.div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.2 }}
        >
          {step !== "review" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StepIcon className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold text-white">
                    {STEPS[currentStepIdx]?.desc}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void load()}
                  disabled={loading}
                  className="text-zinc-500 hover:text-white gap-1.5 text-xs"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                  Atualizar
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center gap-2 text-zinc-500 text-sm py-12 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Carregando...
                </div>
              ) : (
                <>
                  {step === "campaign" && (
                    campaigns.length === 0 ? (
                      <EmptyState
                        icon={Megaphone}
                        message="Nenhuma campanha salva."
                        hint="Crie uma campanha no módulo Criar Campanha primeiro."
                        route="/dashboard/create-campaign"
                        routeLabel="Criar Campanha"
                        navigate={navigate}
                      />
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {campaigns.map((item) => (
                          <ItemCard
                            key={item.id}
                            item={item}
                            selected={selCampaign?.id === item.id}
                            onSelect={() => setSelCampaign(item)}
                            previewIcon={Megaphone}
                          />
                        ))}
                      </div>
                    )
                  )}

                  {step === "creative" && (
                    creatives.length === 0 ? (
                      <EmptyState
                        icon={Sparkles}
                        message="Nenhum criativo salvo."
                        hint="Gere criativos no módulo Criar Imagem primeiro."
                        route="/dashboard/creative-generator"
                        routeLabel="Criar Imagem"
                        navigate={navigate}
                      />
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {creatives.map((item) => (
                          <ItemCard
                            key={item.id}
                            item={item}
                            selected={selCreative?.id === item.id}
                            onSelect={() => setSelCreative(item)}
                            previewIcon={Sparkles}
                          />
                        ))}
                      </div>
                    )
                  )}

                  {step === "content" && (
                    contents.length === 0 ? (
                      <EmptyState
                        icon={FileText}
                        message="Nenhum conteúdo salvo."
                        hint="Crie conteúdos no módulo Criar Conteúdo primeiro."
                        route="/dashboard/create-content"
                        routeLabel="Criar Conteúdo"
                        navigate={navigate}
                      />
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {contents.map((item) => (
                          <ItemCard
                            key={item.id}
                            item={item}
                            selected={selContent?.id === item.id}
                            onSelect={() => setSelContent(item)}
                            previewIcon={AlignLeft}
                          />
                        ))}
                      </div>
                    )
                  )}
                </>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                {currentStepIdx > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="text-zinc-400 gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Voltar
                  </Button>
                ) : <div />}
                <Button
                  size="sm"
                  onClick={handleNext}
                  disabled={!canAdvance()}
                  className="bg-primary text-black hover:bg-primary/90 font-semibold gap-1.5"
                >
                  {step === "content" ? "Revisar Anúncio" : "Continuar"}
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            /* ── Review step ── */
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-white">Resumo do Anúncio</p>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <SummaryCard label="Campanha" item={selCampaign} icon={Megaphone} color="text-primary" />
                <SummaryCard label="Criativo"  item={selCreative} icon={Sparkles}  color="text-violet-400" />
                <SummaryCard label="Conteúdo"  item={selContent}  icon={FileText}  color="text-blue-400" />
              </div>

              {/* Platform launch */}
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-3">
                  Configurar em uma plataforma
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PLATFORMS.map((p) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.key}
                        onClick={() => handleLaunch(p)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:brightness-110 ${p.color}`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="text-[12px]">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-zinc-600 mt-3">
                  O contexto do anúncio será carregado automaticamente na plataforma selecionada.
                </p>
              </div>

              {/* Back */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-zinc-400 gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function SummaryCard({
  label,
  item,
  icon: Icon,
  color,
}: {
  label: string;
  item: SavedItem | null;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <Card className="bg-[#111111] border-white/5">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`w-3.5 h-3.5 ${color}`} />
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">{label}</p>
        </div>
        {item ? (
          <>
            <p className="text-xs font-semibold text-white truncate">{item.title}</p>
            {item.platform && (
              <p className="text-[10px] text-zinc-600 mt-0.5 flex items-center gap-1">
                <Globe className="w-2.5 h-2.5" />{item.platform}
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-zinc-600 italic">Não selecionado</p>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({
  icon: Icon,
  message,
  hint,
  route,
  routeLabel,
  navigate,
}: {
  icon: React.ComponentType<{ className?: string }>;
  message: string;
  hint: string;
  route: string;
  routeLabel: string;
  navigate: (to: string) => void;
}) {
  return (
    <Card className="bg-[#111111] border-white/5">
      <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/8 flex items-center justify-center">
          <Icon className="w-5 h-5 text-zinc-700" />
        </div>
        <p className="text-sm text-zinc-500 text-center">{message}</p>
        <p className="text-[11px] text-zinc-700 text-center max-w-xs">{hint}</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(route)}
          className="border-white/10 text-zinc-400 hover:text-white gap-1.5 mt-1"
        >
          <Icon className="w-3.5 h-3.5" />
          {routeLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
