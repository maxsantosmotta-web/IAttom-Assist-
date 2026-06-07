import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, RefreshCw, AlertCircle, Image, Save, Download, Video, Lock } from "lucide-react";
import { useGetCreditsBalance, getGetCreditsBalanceQueryKey } from "@workspace/api-client-react";
import { saveProjectAssets } from "@/lib/assetStorage";
import { useSavedItems } from "@/hooks/useSavedItems";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CreditsGate } from "@/components/CreditsGate";
import { useAiStream } from "@/hooks/useAiStream";
import type { CreativeIdeasResult, CreativeConcept } from "@/types/ai";
import type { FeatureKey } from "@/lib/credits";

type CreativeType = "image" | "video";
type PlatformKey = "instagram" | "facebook" | "tiktok" | "mercado_livre" | "shopee" | "hotmart" | "kiwify" | "perfil";

const MAX_FORMATS = 3;

const PLATFORMS: {
  key: PlatformKey;
  label: string;
  formats: { key: string; label: string }[];
}[] = [
  { key: "instagram",     label: "Instagram",    formats: [{ key: "feed", label: "Feed" }, { key: "stories", label: "Stories" }] },
  { key: "facebook",      label: "Facebook",      formats: [{ key: "feed", label: "Feed" }, { key: "stories", label: "Stories" }, { key: "banner", label: "Banner" }] },
  { key: "tiktok",        label: "TikTok",        formats: [{ key: "feed", label: "Feed" }, { key: "stories", label: "Stories" }] },
  { key: "mercado_livre", label: "Mercado Livre", formats: [{ key: "produto", label: "Produto" }, { key: "banner", label: "Banner" }] },
  { key: "shopee",        label: "Shopee",        formats: [{ key: "produto", label: "Produto" }, { key: "banner", label: "Banner" }] },
  { key: "hotmart",       label: "Hotmart",       formats: [{ key: "capa", label: "Capa" }, { key: "banner", label: "Banner" }] },
  { key: "kiwify",        label: "Kiwify",        formats: [{ key: "capa", label: "Capa" }, { key: "banner", label: "Banner" }] },
  { key: "perfil",        label: "Perfil",        formats: [{ key: "perfil", label: "Perfil" }] },
];

function formatToAspectClass(format: string): string {
  if (format === "stories" || format === "vertical") return "aspect-[9/16]";
  if (format === "banner") return "aspect-[16/9]";
  return "aspect-square";
}

function downloadImage(base64: string, filename: string) {
  const a = document.createElement("a");
  a.href = `data:image/png;base64,${base64}`;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function ConceptCard({ concept, index }: { concept: CreativeConcept; index: number }) {
  const aspectClass = formatToAspectClass(concept.format ?? "feed");
  const filename = `${concept.label.replace(/[\s/]+/g, "-").toLowerCase()}.png`;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
      <Card className="bg-[#111111] border-white/5 hover:border-primary/20 transition-colors overflow-hidden">
        {concept.imageBase64 ? (
          <div className={`relative bg-black overflow-hidden w-full ${aspectClass}`}>
            <img
              src={`data:image/png;base64,${concept.imageBase64}`}
              alt={concept.label}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className={`w-full ${aspectClass} bg-gradient-to-br from-white/[0.03] to-transparent flex items-center justify-center`}>
            <Image className="w-8 h-8 text-white/20" />
          </div>
        )}
        <CardContent className="p-3 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest truncate">{concept.label}</p>
          {concept.imageBase64 && (
            <button
              onClick={() => downloadImage(concept.imageBase64!, filename)}
              className="text-muted-foreground hover:text-white transition-colors shrink-0"
              title="Baixar imagem"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function CreativeGenerator() {
  const [creativeType, setCreativeType] = useState<CreativeType>("image");
  const [platform, setPlatform] = useState<PlatformKey | "">("");
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [restoredResult, setRestoredResult] = useState<CreativeIdeasResult | null>(null);

  // Estado do vídeo — estrutura preparada para BLOCO 2 (sem funcionalidade ainda)
  const [videoType, setVideoType] = useState<"executivo" | "casual">("executivo");
  const [videoAvatar, setVideoAvatar] = useState<"masculino" | "feminino">("masculino");
  const [videoAmbiente, setVideoAmbiente] = useState<string>("loja");
  const [videoPrompt, setVideoPrompt] = useState("");

  const { status, result, error, generate, reset } = useAiStream<CreativeIdeasResult>();
  const { toast } = useToast();
  const { saveItem, saveItemAssets } = useSavedItems();
  const { isFetching: fetchingCredits, refetch: refetchCredits } = useGetCreditsBalance({
    query: { queryKey: getGetCreditsBalanceQueryKey(), staleTime: 0 },
  });

  const refundCalledRef = useRef(false);
  const chargedFeatureRef = useRef<FeatureKey>("creativeImage1");

  useEffect(() => {
    if (status === "error" && !refundCalledRef.current) {
      refundCalledRef.current = true;
      fetch("/api/credits/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature: chargedFeatureRef.current }),
        credentials: "include",
      }).catch(() => {});
    }
    if (status === "idle" || status === "generating") {
      refundCalledRef.current = false;
    }
  }, [status]);

  // Limpar formatos ao trocar plataforma
  useEffect(() => { setSelectedFormats([]); }, [platform]);

  // Prefill a partir do módulo Campanha
  useEffect(() => {
    const saved = sessionStorage.getItem("iattom_creative_prefill");
    if (saved) {
      try {
        const d = JSON.parse(saved) as { prompt?: string };
        if (d.prompt) setPrompt(d.prompt);
      } catch { /* ignore */ }
      sessionStorage.removeItem("iattom_creative_prefill");
    }
  }, []);

  // Restaurar de Projetos Salvos
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("iattom_restore_creative_v1");
      if (!raw) return;
      sessionStorage.removeItem("iattom_restore_creative_v1");
      const saved = JSON.parse(raw) as {
        briefing?: {
          prompt?: string;
          platform?: string;
          selectedFormats?: string[];
          format?: string;
          quantity?: number;
        };
        result?: unknown;
      };
      if (saved.briefing?.prompt) setPrompt(saved.briefing.prompt);
      const savedPlatform = saved.briefing?.platform;
      if (savedPlatform && PLATFORMS.some((p) => p.key === savedPlatform)) {
        setPlatform(savedPlatform as PlatformKey);
      }
      if (Array.isArray(saved.briefing?.selectedFormats)) {
        setSelectedFormats((saved.briefing.selectedFormats as string[]).slice(0, MAX_FORMATS));
      }
      if (saved.result) setRestoredResult(saved.result as CreativeIdeasResult);
    } catch { /* ignore */ }
  }, []);

  const isGenerating = status === "generating";
  const isDone = status === "done";
  const isError = status === "error";
  const isRestoredMode = !!restoredResult && status === "idle";
  const activeResult = result ?? restoredResult;

  const featureKey: FeatureKey =
    selectedFormats.length <= 1 ? "creativeImage1" :
    selectedFormats.length === 2 ? "creativeImage2" :
    "creativeImage3";

  const toggleFormat = (fmt: string) => {
    setSelectedFormats((prev) => {
      if (prev.includes(fmt)) return prev.filter((f) => f !== fmt);
      if (prev.length >= MAX_FORMATS) return prev;
      return [...prev, fmt];
    });
  };

  const canGenerate = !!prompt.trim() && !!platform && selectedFormats.length > 0;

  const runGenerate = (charge: () => void) => {
    chargedFeatureRef.current = featureKey;
    generate("/api/ai/creative-ideas", {
      prompt,
      platform,
      selectedFormats,
    }).then((res) => {
      if (res !== null) charge();
    });
  };

  const handleSave = async () => {
    if (!activeResult || isSaving) return;
    setIsSaving(true);

    const platformLabel = PLATFORMS.find((p) => p.key === platform)?.label ?? String(platform);
    const content = [
      `Tipo: Imagem`,
      `Plataforma: ${platformLabel}`,
      `Formatos: ${selectedFormats.join(", ")}`,
      `Prompt: ${prompt.trim()}`,
    ].join(" | ");

    const resultWithoutImages: CreativeIdeasResult = {
      ...activeResult,
      concepts: activeResult.concepts?.map(({ imageBase64: _removed, ...rest }) => rest) ?? [],
    };

    const data = JSON.stringify({
      type: "image",
      platform,
      selectedFormats,
      prompt: prompt.trim(),
      result: resultWithoutImages,
    });

    const projectId = crypto.randomUUID();
    const title = `${platformLabel} — ${prompt.trim().slice(0, 60) || "Criativo"}`;
    const hasImages = (activeResult.concepts?.some((c) => !!c.imageBase64)) ?? false;

    try {
      const raw = localStorage.getItem("iattom_saved_items_v1");
      const existing = raw ? (JSON.parse(raw) as object[]) : [];
      existing.unshift({
        id: projectId, title, type: "creative", content, data, hasImages,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem("iattom_saved_items_v1", JSON.stringify(existing));
    } catch { /* ignore */ }

    const imageAssets = (activeResult.concepts ?? [])
      .map((c, i) => c.imageBase64
        ? { conceptIndex: i, base64: c.imageBase64, label: c.label ?? `Imagem ${i + 1}`, format: c.format ?? "PNG" }
        : null)
      .filter((a): a is NonNullable<typeof a> => a !== null);

    if (imageAssets.length > 0) void saveProjectAssets(projectId, imageAssets);

    try {
      await saveItem({ id: projectId, title, type: "creative", content, data, hasImages });
      if (imageAssets.length > 0) {
        try {
          await saveItemAssets(projectId, imageAssets);
          toast({ description: "Criativo salvo com imagens sincronizadas." });
        } catch {
          toast({ description: "Criativo salvo, mas as imagens não foram sincronizadas.", variant: "destructive" });
        }
      } else {
        toast({ description: "Criativo salvo." });
      }
    } catch {
      toast({ description: "Erro ao salvar. Tente novamente.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const currentPlatformFormats = platform ? (PLATFORMS.find((p) => p.key === platform)?.formats ?? []) : [];
  const loadingCount = Math.max(selectedFormats.length, 1);
  const resultCount = activeResult?.concepts?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">Módulo Criativo</p>
          <h2 className="text-2xl font-bold text-white mb-1">Gerador de Imagens</h2>
          <p className="text-muted-foreground text-sm">Gere imagens prontas para publicação.</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void refetchCredits()}
          disabled={fetchingCredits}
          className="border-white/10 text-zinc-400 hover:text-white hover:border-white/20 gap-1.5 shrink-0 mt-1"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${fetchingCredits ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </motion.div>

      {/* Tipo de criativo */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <Card className="bg-[#111111] border-white/5">
          <CardContent className="p-5">
            <Label className="text-sm text-muted-foreground block mb-3">Tipo de criativo</Label>
            <div className="flex gap-3">
              <button
                onClick={() => setCreativeType("image")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  creativeType === "image"
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-[#0a0a0a] text-zinc-500 border-white/[0.08] hover:border-white/20 hover:text-zinc-300"
                }`}
              >
                <Image className="w-4 h-4" />
                Imagem
              </button>
              <button
                onClick={() => setCreativeType("video")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  creativeType === "video"
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-[#0a0a0a] text-zinc-500 border-white/[0.08] hover:border-white/20 hover:text-zinc-300"
                }`}
              >
                <Video className="w-4 h-4" />
                Vídeo
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Formulário condicional */}
      <AnimatePresence mode="wait">
        {creativeType === "image" && (
          <motion.div
            key="image-form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="bg-[#111111] border-white/5">
              <CardContent className="p-6 space-y-6">

                {/* Plataforma */}
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground">Plataforma</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p.key}
                        onClick={() => setPlatform(p.key)}
                        className={`py-2.5 px-2 rounded-lg border text-xs font-medium transition-colors text-center ${
                          platform === p.key
                            ? "bg-primary/15 text-primary border-primary/30"
                            : "bg-[#0a0a0a] text-zinc-500 border-white/[0.08] hover:border-white/20 hover:text-zinc-300"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Formatos (aparece ao selecionar plataforma) */}
                <AnimatePresence>
                  {platform && (
                    <motion.div
                      key={platform}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-muted-foreground">Formatos</Label>
                        <span className="text-xs text-zinc-600">
                          {selectedFormats.length} de {MAX_FORMATS} selecionado{selectedFormats.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {currentPlatformFormats.map((f) => {
                          const isSelected = selectedFormats.includes(f.key);
                          const isDisabled = !isSelected && selectedFormats.length >= MAX_FORMATS;
                          return (
                            <button
                              key={f.key}
                              onClick={() => toggleFormat(f.key)}
                              disabled={isDisabled}
                              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-medium transition-colors ${
                                isSelected
                                  ? "bg-primary/15 text-primary border-primary/30"
                                  : isDisabled
                                  ? "bg-[#0a0a0a] text-zinc-700 border-white/[0.04] cursor-not-allowed"
                                  : "bg-[#0a0a0a] text-zinc-400 border-white/[0.08] hover:border-white/20 hover:text-zinc-300 cursor-pointer"
                              }`}
                            >
                              <span
                                className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                                  isSelected ? "bg-primary border-primary" : "border-white/20"
                                }`}
                              >
                                {isSelected && <span className="w-1.5 h-1.5 rounded-sm bg-black" />}
                              </span>
                              {f.label}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Prompt */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">O que você quer gerar?</Label>
                  <Input
                    placeholder="Ex: Moto premium em rua neon noturna"
                    className="bg-[#0a0a0a] border-white/10 focus-visible:ring-primary/50"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                </div>

                {/* Botão de geração */}
                <CreditsGate
                  feature={featureKey}
                  onSuccess={runGenerate}
                  disabled={!canGenerate || isGenerating}
                  hideCostBadge
                >
                  {({ trigger, isLoading }) => (
                    <Button
                      onClick={trigger}
                      disabled={isLoading || isGenerating || !canGenerate}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
                    >
                      {isLoading || isGenerating ? (
                        <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Gerando...</>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Gerar {selectedFormats.length <= 1 ? "Imagem" : `${selectedFormats.length} Imagens`}
                        </>
                      )}
                    </Button>
                  )}
                </CreditsGate>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Vídeo — Estrutura preparada para BLOCO 2 (sem geração ainda) */}
        {creativeType === "video" && (
          <motion.div
            key="video-form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="bg-[#111111] border-white/5">
              <CardContent className="p-6 space-y-6">

                {/* Tipo de Vídeo */}
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground">Tipo de Vídeo</Label>
                  <div className="flex gap-3">
                    {(["executivo", "casual"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setVideoType(t)}
                        className={`flex-1 flex items-center justify-center py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                          videoType === t
                            ? "bg-primary/15 text-primary border-primary/30"
                            : "bg-[#0a0a0a] text-zinc-500 border-white/[0.08] hover:border-white/20 hover:text-zinc-300"
                        }`}
                      >
                        {t === "executivo" ? "Executivo" : "Casual"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duração */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Duração</Label>
                  <div className="flex items-center px-3.5 py-2.5 rounded-lg bg-[#0a0a0a] border border-white/[0.08]">
                    <span className="text-sm text-zinc-400">20 segundos</span>
                  </div>
                </div>

                {/* Personagem */}
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground">Personagem</Label>
                  <div className="flex gap-3">
                    {(["masculino", "feminino"] as const).map((a) => (
                      <button
                        key={a}
                        onClick={() => setVideoAvatar(a)}
                        className={`flex-1 flex items-center justify-center py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                          videoAvatar === a
                            ? "bg-primary/15 text-primary border-primary/30"
                            : "bg-[#0a0a0a] text-zinc-500 border-white/[0.08] hover:border-white/20 hover:text-zinc-300"
                        }`}
                      >
                        {a === "masculino" ? "Masculino" : "Feminino"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ambiente — apenas para Casual */}
                {videoType === "casual" && (
                  <div className="space-y-3">
                    <Label className="text-sm text-muted-foreground">Ambiente</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["Loja", "Shopping", "Restaurante", "Rua", "Casa", "Livre"] as const).map((amb) => (
                        <button
                          key={amb}
                          onClick={() => setVideoAmbiente(amb.toLowerCase())}
                          className={`py-2.5 px-2 rounded-lg border text-xs font-medium transition-colors text-center ${
                            videoAmbiente === amb.toLowerCase()
                              ? "bg-primary/15 text-primary border-primary/30"
                              : "bg-[#0a0a0a] text-zinc-500 border-white/[0.08] hover:border-white/20 hover:text-zinc-300"
                          }`}
                        >
                          {amb}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prompt */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Prompt</Label>
                  <Input
                    placeholder="Descreva o contexto do vídeo..."
                    className="bg-[#0a0a0a] border-white/10 focus-visible:ring-primary/50"
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                  />
                </div>

                {/* Aviso + botão desabilitado */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <Lock className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                  <p className="text-xs text-zinc-600">Funcionalidade em preparação.</p>
                </div>

                <Button disabled className="w-full opacity-40 cursor-not-allowed">
                  <Video className="w-4 h-4 mr-2" />
                  Em breve
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resultados */}
      <AnimatePresence mode="wait">
        {isGenerating && (
          <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center gap-3 text-muted-foreground mb-5">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <span className="text-sm">
                Gerando {loadingCount === 1 ? "imagem" : `${loadingCount} imagens`}...
              </span>
            </div>
            <div className={`grid gap-4 ${
              loadingCount === 1 ? "grid-cols-1 max-w-sm mx-auto" :
              loadingCount === 2 ? "grid-cols-2" :
              "grid-cols-3"
            }`}>
              {Array.from({ length: loadingCount }).map((_, i) => {
                const fmt = selectedFormats[i] ?? "feed";
                return (
                  <div
                    key={i}
                    className={`rounded-lg bg-white/5 border border-white/5 animate-pulse ${formatToAspectClass(fmt)}`}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                );
              })}
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
                  <p className="text-xs text-muted-foreground">{error}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    reset();
                    generate("/api/ai/creative-ideas", { prompt, platform, selectedFormats });
                  }}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Tentar novamente
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {(isDone || isRestoredMode) && activeResult && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {isRestoredMode && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-primary/5 border border-primary/15">
                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <p className="text-xs text-primary">Criativo restaurado de Projetos Salvos</p>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Imagens Geradas</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => void handleSave()}
                  disabled={isSaving}
                  className="text-xs text-muted-foreground hover:text-white transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  {isSaving ? "Salvando..." : "Salvar"}
                </button>
                <button
                  onClick={() => { reset(); setRestoredResult(null); }}
                  className="text-xs text-muted-foreground hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" /> Gerar novamente
                </button>
              </div>
            </div>

            <div className={`grid gap-4 ${
              resultCount <= 1 ? "grid-cols-1 max-w-sm mx-auto" :
              resultCount === 2 ? "md:grid-cols-2" :
              "md:grid-cols-3"
            }`}>
              {activeResult.concepts?.map((concept: CreativeConcept, i: number) => (
                <ConceptCard key={concept.id ?? i} concept={concept} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
