import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Copy, RefreshCw, AlertCircle, Monitor, Smartphone, Image, Save } from "lucide-react";
import { useGetCreditsBalance, getGetCreditsBalanceQueryKey } from "@workspace/api-client-react";
import { saveProjectAssets } from "@/lib/assetStorage";
import { useSavedItems } from "@/hooks/useSavedItems";
import { getEffectiveProductType, detectIncompatibility, INCOMPATIBILITY_MESSAGES } from "@/lib/productPlatformCompatibility";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CreditsGate } from "@/components/CreditsGate";
import { useAiStream } from "@/hooks/useAiStream";
import type { CreativeIdeasResult, CreativeConcept } from "@/types/ai";

const formatIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "1:1 quadrado": Monitor,
  "9:16 story": Smartphone,
  "16:9 banner": Monitor,
  "1080x1080 square": Monitor,
  "9:16 story (legacy)": Smartphone,
  default: Image,
};

const gradients = [
  "from-primary/30 to-amber-900/20",
  "from-blue-900/30 to-purple-900/20",
  "from-emerald-900/30 to-teal-900/20",
  "from-rose-900/30 to-orange-900/20",
];

const PLATFORM_OPTIONS = [
  { value: "instagram",     label: "Vender no Instagram",     formats: ["1:1 feed", "9:16 story"] },
  { value: "tiktok",        label: "Vender no TikTok",        formats: ["9:16 vertical", "9:16 variação"] },
  { value: "facebook",      label: "Vender no Facebook",      formats: ["1:1 feed", "16:9 banner"] },
  { value: "shopee",        label: "Vender na Shopee",        formats: ["1:1 quadrado", "16:9 banner"] },
  { value: "mercado_livre", label: "Vender no Mercado Livre", formats: ["1:1 quadrado", "1:1 variação"] },
  { value: "hotmart",       label: "Vender na Hotmart",       formats: ["1:1 thumb", "16:9 banner"] },
  { value: "kiwify",        label: "Vender na Kiwify",        formats: ["1:1 thumb", "1:1 variação"] },
] as const;

function formatToAspectClass(format: string): string {
  const f = format.toLowerCase();
  if (f.includes("9:16") || f.includes("story") || f.includes("vertical") || f.includes("reels") || f.includes("status")) return "aspect-[9/16]";
  if (f.includes("16:9") || f.includes("banner") || f.includes("landscape")) return "aspect-[16/9]";
  return "aspect-square";
}

function ConceptCard({ concept, index }: { concept: CreativeConcept; index: number }) {
  const { toast } = useToast();
  const FormatIcon = formatIcons[concept.format] ?? formatIcons.default;
  const aspectClass = formatToAspectClass(concept.format);

  const copyAll = () => {
    const text = `${concept.copyHook}\n\nCTA: ${concept.cta}`;
    navigator.clipboard.writeText(text);
    toast({ description: "Criativo copiado" });
  };

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
          <div className={`w-full ${aspectClass} bg-gradient-to-br ${gradients[index % gradients.length]} flex items-center justify-center`}>
            <FormatIcon className="w-8 h-8 text-white/20" />
          </div>
        )}
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest">{concept.label}</p>
            <button onClick={copyAll} className="text-muted-foreground hover:text-white transition-colors shrink-0">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-0.5">Headline</p>
            <p className="text-sm font-semibold text-white leading-snug">{concept.copyHook}</p>
          </div>

          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-0.5">CTA</p>
            <p className="text-xs text-primary font-semibold">{concept.cta}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function CreativeGenerator() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [platform, setPlatform] = useState("");
  const { status, result, error, generate, reset } = useAiStream<CreativeIdeasResult>();
  const { toast } = useToast();
  const { saveItem, saveItemAssets } = useSavedItems();
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
        body: JSON.stringify({ feature: "creative" }),
        credentials: "include",
      }).catch(() => {});
    }
    if (status === "idle" || status === "generating") {
      refundCalledRef.current = false;
    }
  }, [status]);

  useEffect(() => {
    const saved = sessionStorage.getItem("iattom_creative_prefill");
    if (saved) {
      try {
        const d = JSON.parse(saved) as { prompt?: string; targetAudience?: string; style?: string };
        if (d.prompt) setPrompt(d.prompt);
        if (d.targetAudience) setTargetAudience(d.targetAudience);
        if (d.style) setStyle(d.style);
      } catch { /* ignore */ }
      sessionStorage.removeItem("iattom_creative_prefill");
    }
  }, []);

  const [restoredResult, setRestoredResult] = useState<CreativeIdeasResult | null>(null);
  const isRestoredMode = !!restoredResult && status === "idle";
  const activeResult = result ?? restoredResult;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("iattom_restore_creative_v1");
      if (!raw) return;
      sessionStorage.removeItem("iattom_restore_creative_v1");
      const saved = JSON.parse(raw) as { briefing?: { prompt?: string; style?: string; targetAudience?: string; formatPack?: string }; result?: CreativeIdeasResult };
      if (saved.briefing?.prompt) setPrompt(saved.briefing.prompt);
      if (saved.briefing?.style) setStyle(saved.briefing.style);
      if (saved.briefing?.targetAudience) setTargetAudience(saved.briefing.targetAudience);
      if (saved.briefing?.formatPack) setPlatform("");
      if (saved.result) setRestoredResult(saved.result);
    } catch {}
  }, []);

  const isGenerating = status === "generating";
  const isDone = status === "done";
  const isError = status === "error";

  const incompatibility = useMemo(
    () => detectIncompatibility(getEffectiveProductType(prompt, null), platform),
    [prompt, platform],
  );

  const runGenerate = (charge: () => void) => {
    generate("/api/ai/creative-ideas", {
      prompt,
      style: style || undefined,
      targetAudience: targetAudience || undefined,
      platform: platform || undefined,
    }).then((res) => {
      if (res !== null) charge();
    });
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!activeResult || isSaving) return;
    setIsSaving(true);

    const lines: string[] = [];
    activeResult.concepts?.forEach((c: CreativeConcept, i: number) => {
      lines.push(`CRIATIVO ${i + 1}: ${c.label}`);
      if (c.copyHook) lines.push(`Headline: ${c.copyHook}`);
      if (c.cta) lines.push(`CTA: ${c.cta}`);
    });
    const content = lines.join("\n");

    const resultWithoutImages: CreativeIdeasResult = {
      ...activeResult,
      concepts: activeResult.concepts?.map(({ imageBase64: _removed, ...rest }) => rest) ?? [],
    };

    const data = JSON.stringify({
      briefing: { prompt: prompt.trim(), style, targetAudience, platform },
      result: resultWithoutImages,
    });

    const imageAssets = (activeResult.concepts ?? [])
      .map((c, i) => c.imageBase64
        ? { conceptIndex: i, base64: c.imageBase64, label: c.label ?? `Criativo ${i + 1}`, format: c.format ?? "PNG" }
        : null)
      .filter((a): a is NonNullable<typeof a> => a !== null);

    const projectId = crypto.randomUUID();
    const title = prompt.trim() || "Criativo gerado";
    try {
      const raw = localStorage.getItem("iattom_saved_items_v1");
      const existing = raw ? (JSON.parse(raw) as object[]) : [];
      existing.unshift({ id: projectId, title, type: "creative", content, data, hasImages: imageAssets.length > 0, createdAt: new Date().toISOString() });
      localStorage.setItem("iattom_saved_items_v1", JSON.stringify(existing));
    } catch {}

    if (imageAssets.length > 0) void saveProjectAssets(projectId, imageAssets);

    try {
      await saveItem({ id: projectId, title, type: "creative", content, data, hasImages: imageAssets.length > 0 });

      if (imageAssets.length > 0) {
        try {
          await saveItemAssets(projectId, imageAssets);
          toast({ description: "Projeto salvo com imagens sincronizadas." });
        } catch {
          toast({
            description: "Projeto salvo, mas as imagens não foram sincronizadas. Tente salvar novamente.",
            variant: "destructive",
          });
        }
      } else {
        toast({ description: "Projeto salvo." });
      }
    } catch {
      toast({ description: "Erro ao salvar projeto. Tente novamente.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Gerador Criativo</h2>
          <p className="text-muted-foreground text-sm">Gere imagens e conceitos prontos para publicação.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => void refetchCredits()} disabled={fetchingCredits} className="border-white/10 text-zinc-400 hover:text-white hover:border-white/20 gap-1.5 shrink-0 mt-1">
          <RefreshCw className={`w-3.5 h-3.5 ${fetchingCredits ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <Card className="bg-[#111111] border-white/5">
          <CardContent className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-sm text-muted-foreground">Gerador de Imagem</Label>
                <Input placeholder="Ex: Moto premium em rua neon noturna" className="bg-[#0a0a0a] border-white/10 focus-visible:ring-primary/50" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Estilo Visual</Label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full h-9 rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-1 text-sm text-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-0"
                >
                  <option value="" disabled>Selecionar estilo</option>
                  <option value="Photorealistic lifestyle">Lifestyle Fotorrealista</option>
                  <option value="Minimalist clean">Minimalista e Limpo</option>
                  <option value="Bold graphic">Arrojado e Gráfico</option>
                  <option value="Luxury editorial">Editorial de Luxo</option>
                  <option value="Raw authentic UGC">UGC Autêntico e Bruto</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Público-alvo (opcional)</Label>
                <Input placeholder="ex: Entusiastas de fitness 25-35" className="bg-[#0a0a0a] border-white/10 focus-visible:ring-primary/50" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">Objetivo da imagem</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full h-9 rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-1 text-sm text-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-0"
              >
                <option value="" disabled>Selecionar</option>
                {PLATFORM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {incompatibility && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/[0.07] px-3.5 py-3">
                <span className="text-red-400 text-sm leading-none mt-0.5">!</span>
                <p className="text-xs text-red-300/90 leading-relaxed">
                  {INCOMPATIBILITY_MESSAGES[incompatibility]}
                </p>
              </div>
            )}

            <CreditsGate feature="creative" onSuccess={runGenerate} disabled={!prompt.trim() || isGenerating || incompatibility !== null}>
              {({ trigger, isLoading }) => (
                <Button onClick={trigger} disabled={isLoading || isGenerating || !prompt.trim() || incompatibility !== null} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full">
                  {isLoading || isGenerating ? (<><Loader2 className="w-4 h-4 animate-spin mr-2" /> Gerando conceitos...</>) : (<><Sparkles className="w-4 h-4 mr-2" /> Gerar Conceitos Criativos</>)}
                </Button>
              )}
            </CreditsGate>
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence mode="wait">
        {isGenerating && (
          <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center gap-3 text-muted-foreground mb-5">
              <div className="flex gap-1">{[0, 1, 2].map((i) => (<span key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />))}</div>
              <span className="text-sm">Criando conceitos e gerando imagens...</span>
            </div>
            <div className="grid grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-64 rounded-lg bg-white/5 border border-white/5 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />))}</div>
          </motion.div>
        )}

        {isError && (
          <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="bg-red-950/20 border-red-500/20">
              <CardContent className="p-5 flex items-center gap-4">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <div className="flex-1"><p className="text-sm font-semibold text-red-400">Falha na geração</p><p className="text-xs text-muted-foreground">{error}</p></div>
                <Button size="sm" variant="outline" onClick={() => { reset(); generate("/api/ai/creative-ideas", { prompt, style: style || undefined, targetAudience: targetAudience || undefined, platform: platform || undefined }); }} className="border-red-500/30 text-red-400 hover:bg-red-500/10 shrink-0"><RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Tentar novamente</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {(isDone || isRestoredMode) && activeResult && (
          <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            {isRestoredMode && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-primary/5 border border-primary/15">
                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <p className="text-xs text-primary">Criativo restaurado de Projetos Salvos</p>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Conceitos Criativos</h3>
              <div className="flex items-center gap-3">
                <button onClick={() => { void handleSave(); }} disabled={isSaving} className="text-xs text-muted-foreground hover:text-white transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">{isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}{isSaving ? "Salvando..." : "Salvar"}</button>
                <button onClick={() => { reset(); setRestoredResult(null); }} className="text-xs text-muted-foreground hover:text-white transition-colors flex items-center gap-1.5"><RefreshCw className="w-3 h-3" /> Novos conceitos</button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
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
