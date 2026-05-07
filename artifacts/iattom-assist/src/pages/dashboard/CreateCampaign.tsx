import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, Target, Globe, Loader2, Copy, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CreditsGate } from "@/components/CreditsGate";
import { useAiStream } from "@/hooks/useAiStream";
import type { CampaignResult } from "@/types/ai";

const platformIcons: Record<string, string> = {
  facebook: "fb", instagram: "ig", google: "g", email: "em", tiktok: "tk",
};

function CopyBlock({ label, content }: { label: string; content: string }) {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();
  const preview = content.slice(0, 120);
  const hasMore = content.length > 120;

  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-primary capitalize">{label}</p>
        <button
          onClick={() => { navigator.clipboard.writeText(content); toast({ description: `${label} copy copied` }); }}
          className="text-muted-foreground hover:text-white transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {expanded ? content : preview}
        {hasMore && !expanded && "..."}
      </p>
      {hasMore && (
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary/60 hover:text-primary mt-1.5 flex items-center gap-1">
          {expanded ? <><ChevronUp className="w-3 h-3" /> Less</> : <><ChevronDown className="w-3 h-3" /> Show more</>}
        </button>
      )}
    </div>
  );
}

export function CreateCampaign() {
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("");
  const { status, result, error, generate, reset } = useAiStream<CampaignResult>();
  const { toast } = useToast();

  const isGenerating = status === "generating";
  const isDone = status === "done";
  const isError = status === "error";

  // charge() is provided by CreditsGate and called only after AI returns a result.
  const runGenerate = (charge: () => void) => {
    generate("/api/ai/create-campaign", { product, audience: audience || undefined, goal: goal || undefined }).then((res) => {
      if (res !== null) charge();
    });
  };

  const copyAll = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ description: "Copied to clipboard" });
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">Campaign Builder</p>
        <h2 className="text-2xl font-bold text-white mb-1">Create Campaign</h2>
        <p className="text-muted-foreground text-sm">Generate a full campaign strategy with AI-crafted copy for every platform.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <Card className="bg-[#111111] border-white/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-white">Campaign Brief</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Product / Brand</Label>
                <Input placeholder="e.g. HydroElite Water Bottle" className="bg-[#0a0a0a] border-white/10 focus-visible:ring-primary/50" value={product} onChange={(e) => setProduct(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Campaign Goal</Label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full h-9 rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-1 text-sm text-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-0"
                >
                  <option value="" disabled>Select goal</option>
                  <option value="Drive sales">Drive Sales</option>
                  <option value="Brand Awareness">Brand Awareness</option>
                  <option value="Lead Generation">Lead Generation</option>
                  <option value="Website Traffic">Website Traffic</option>
                  <option value="App Installs">App Installs</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Target Audience (optional)</Label>
              <Input placeholder="e.g. Athletes 25-40, outdoor enthusiasts, premium buyers" className="bg-[#0a0a0a] border-white/10 focus-visible:ring-primary/50" value={audience} onChange={(e) => setAudience(e.target.value)} />
            </div>
            <CreditsGate feature="campaign" onSuccess={runGenerate} disabled={!product.trim() || isGenerating}>
              {({ trigger, isLoading }) => (
                <Button onClick={trigger} disabled={isLoading || isGenerating || !product.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full">
                  {isLoading || isGenerating ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Building your campaign...</>
                  ) : "Generate Campaign"}
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
              <span className="text-sm">Crafting your campaign strategy...</span>
            </div>
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-40 rounded-lg bg-white/5 border border-white/5 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />))}</div>
          </motion.div>
        )}

        {isError && (
          <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="bg-red-950/20 border-red-500/20">
              <CardContent className="p-5 flex items-center gap-4">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <div className="flex-1"><p className="text-sm font-semibold text-red-400">Generation failed</p><p className="text-xs text-muted-foreground mt-0.5">{error}</p></div>
                <Button size="sm" variant="outline" onClick={() => { reset(); generate("/api/ai/create-campaign", { product, audience: audience || undefined, goal: goal || undefined }); }} className="border-red-500/30 text-red-400 hover:bg-red-500/10 shrink-0"><RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {isDone && result && (
          <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="space-y-4">
            <Card className="bg-[#111111] border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-primary" />
                  <CardTitle className="text-base text-white">Campaign Strategy</CardTitle>
                  <button onClick={reset} className="ml-auto text-xs text-muted-foreground hover:text-white transition-colors flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> New campaign
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/15">
                  <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">Headline</p>
                  <p className="text-white font-bold text-lg leading-snug">{result.headline}</p>
                  <p className="text-muted-foreground text-sm mt-1">{result.subheadline}</p>
                  {result.cta && <p className="text-primary text-sm font-semibold mt-2">CTA: {result.cta}</p>}
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1"><Target className="w-3 h-3" /> Audience</p>
                    <p className="text-sm text-white">{result.audience}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1"><Globe className="w-3 h-3" /> Channels</p>
                    <div className="flex flex-wrap gap-1">
                      {result.channels?.map((c) => (<span key={c} className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{c}</span>))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5">Budget</p>
                    <p className="text-sm text-white">{result.budget}</p>
                  </div>
                </div>

                {result.uniqueAngle && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5 border border-white/5">
                    <Zap className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <div><p className="text-xs text-primary font-medium mb-0.5">Unique Angle</p><p className="text-xs text-muted-foreground">{result.uniqueAngle}</p></div>
                  </div>
                )}

                {result.copy && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 font-medium">Platform Copy</p>
                    <div className="grid md:grid-cols-2 gap-3">
                      {Object.entries(result.copy).map(([platform, copy]) => (
                        <CopyBlock key={platform} label={platform} content={copy} />
                      ))}
                    </div>
                  </div>
                )}

                {result.keyMessages?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-medium">Key Messages</p>
                    <div className="space-y-1.5">
                      {result.keyMessages.map((msg, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-primary font-bold shrink-0 text-xs mt-0.5">{i + 1}</span>
                          <p className="text-muted-foreground text-xs">{msg}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.launchTimeline && (
                  <div className="border-t border-white/5 pt-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5 font-medium">Launch Timeline</p>
                    <p className="text-sm text-muted-foreground">{result.launchTimeline}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
