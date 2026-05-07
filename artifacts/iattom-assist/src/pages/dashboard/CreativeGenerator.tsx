import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Copy, RefreshCw, AlertCircle, Monitor, Smartphone, Image, Palette, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { useToast } from "@/hooks/use-toast";
import { CreditsGate } from "@/components/CreditsGate";
import { useAiStream } from "@/hooks/useAiStream";
import type { CreativeIdeasResult, CreativeConcept } from "@/types/ai";

const formatIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "1080x1080 square": Monitor,
  "9:16 story": Smartphone,
  default: Image,
};

const gradients = [
  "from-primary/30 to-amber-900/20",
  "from-blue-900/30 to-purple-900/20",
  "from-emerald-900/30 to-teal-900/20",
  "from-rose-900/30 to-orange-900/20",
];

function ConceptCard({ concept, index }: { concept: CreativeConcept; index: number }) {
  const { toast } = useToast();
  const FormatIcon = formatIcons[concept.format] ?? formatIcons.default;

  const copyAll = () => {
    const text = `HOOK: ${concept.copyHook}\n\nBODY: ${concept.bodyText}\n\nCTA: ${concept.cta}\n\nVISUAL: ${concept.visualDirection}\n\nIMAGE PROMPT: ${concept.imagePrompt}`;
    navigator.clipboard.writeText(text);
    toast({ description: "Creative concept copied" });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
      <Card className="bg-[#111111] border-white/5 hover:border-primary/20 transition-colors overflow-hidden">
        <div className={`h-24 bg-gradient-to-br ${gradients[index % gradients.length]} flex items-center justify-center`}>
          <FormatIcon className="w-8 h-8 text-white/20" />
        </div>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-widest">{concept.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{concept.format} &middot; {concept.bestPlatform}</p>
            </div>
            <button onClick={copyAll} className="text-muted-foreground hover:text-white transition-colors shrink-0">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-0.5">Hook</p>
            <p className="text-sm font-semibold text-white leading-snug">{concept.copyHook}</p>
          </div>

          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-0.5">Body</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{concept.bodyText}</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-0.5">CTA</p>
              <p className="text-xs text-primary font-semibold">{concept.cta}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-0.5">Trigger</p>
              <p className="text-xs text-amber-400">{concept.emotionalTrigger}</p>
            </div>
          </div>

          {concept.visualDirection && (
            <div className="p-2.5 rounded bg-white/5 border border-white/5">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-0.5">Visual Direction</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{concept.visualDirection}</p>
            </div>
          )}

          {concept.imagePrompt && (
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-0.5">AI Image Prompt</p>
              <p className="text-xs text-muted-foreground/70 leading-relaxed italic">{concept.imagePrompt}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function CreativeGenerator() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const { status, result, error, generate, reset } = useAiStream<CreativeIdeasResult>();

  const isGenerating = status === "generating";
  const isDone = status === "done";
  const isError = status === "error";

  const runGenerate = () => {
    generate("/api/ai/creative-ideas", { prompt, style: style || undefined, targetAudience: targetAudience || undefined });
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">Visual Intelligence</p>
        <h2 className="text-2xl font-bold text-white mb-1">Creative Generator</h2>
        <p className="text-muted-foreground text-sm">Generate premium ad creative concepts — copy, hooks, visual directions, and AI image prompts.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <Card className="bg-[#111111] border-white/5">
          <CardContent className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-sm text-muted-foreground">Creative Brief</Label>
                <Input placeholder="e.g. Premium water bottle for outdoor athletes, minimalist aesthetic" className="bg-[#0a0a0a] border-white/10 focus-visible:ring-primary/50" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Visual Style</Label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full h-9 rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-1 text-sm text-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-0"
                >
                  <option value="" disabled>Select style</option>
                  <option value="Photorealistic lifestyle">Photorealistic Lifestyle</option>
                  <option value="Minimalist clean">Minimalist Clean</option>
                  <option value="Bold graphic">Bold &amp; Graphic</option>
                  <option value="Luxury editorial">Luxury Editorial</option>
                  <option value="Raw authentic UGC">Raw Authentic UGC</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Target Audience (optional)</Label>
                <Input placeholder="e.g. Fitness enthusiasts 25-35" className="bg-[#0a0a0a] border-white/10 focus-visible:ring-primary/50" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} />
              </div>
            </div>
            <CreditsGate feature="creative" onSuccess={runGenerate} disabled={!prompt.trim() || isGenerating}>
              {({ trigger, isLoading }) => (
                <Button onClick={trigger} disabled={isLoading || isGenerating || !prompt.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full">
                  {isLoading || isGenerating ? (<><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating concepts...</>) : (<><Sparkles className="w-4 h-4 mr-2" /> Generate Creative Concepts</>)}
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
              <span className="text-sm">Creating breakthrough concepts...</span>
            </div>
            <div className="grid grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-64 rounded-lg bg-white/5 border border-white/5 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />))}</div>
          </motion.div>
        )}

        {isError && (
          <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="bg-red-950/20 border-red-500/20">
              <CardContent className="p-5 flex items-center gap-4">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <div className="flex-1"><p className="text-sm font-semibold text-red-400">Generation failed</p><p className="text-xs text-muted-foreground">{error}</p></div>
                <Button size="sm" variant="outline" onClick={() => { reset(); runGenerate(); }} className="border-red-500/30 text-red-400 hover:bg-red-500/10 shrink-0"><RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {isDone && result && (
          <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            {result.overarchingTheme && (
              <div className="mb-5 p-4 rounded-lg bg-primary/5 border border-primary/15">
                <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">Creative Theme</p>
                <p className="text-sm text-white">{result.overarchingTheme}</p>
                <div className="flex flex-wrap gap-4 mt-3">
                  {result.colorPalette && (
                    <div className="flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">{result.colorPalette}</p>
                    </div>
                  )}
                  {result.typographyDirection && (
                    <div className="flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">{result.typographyDirection}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Creative Concepts</h3>
              <button onClick={reset} className="text-xs text-muted-foreground hover:text-white transition-colors flex items-center gap-1.5"><RefreshCw className="w-3 h-3" /> New concepts</button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {result.concepts?.map((concept: CreativeConcept, i: number) => (
                <ConceptCard key={concept.id ?? i} concept={concept} index={i} />
              ))}
            </div>

            {result.brandVoiceNotes && (
              <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/5">
                <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-1">Brand Voice Notes</p>
                <p className="text-sm text-muted-foreground">{result.brandVoiceNotes}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
