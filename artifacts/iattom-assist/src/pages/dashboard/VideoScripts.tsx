import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Loader2, Copy, AlertCircle, RefreshCw, Clock, Music, Zap, Film, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CreditsGate } from "@/components/CreditsGate";
import { useAiStream } from "@/hooks/useAiStream";
import type { VideoScriptResult, ScriptScene } from "@/types/ai";

export function VideoScripts() {
  const [product, setProduct] = useState("");
  const [format, setFormat] = useState("");
  const [duration, setDuration] = useState("");
  const [style, setStyle] = useState("");
  const { status, result, error, generate, reset } = useAiStream<VideoScriptResult>();
  const { toast } = useToast();

  const isGenerating = status === "generating";
  const isDone = status === "done";
  const isError = status === "error";

  // charge() is provided by CreditsGate and called only after AI returns a result.
  const runGenerate = (charge: () => void) => {
    generate("/api/ai/video-script", { product, format: format || undefined, duration: duration || undefined, style: style || undefined }).then((res) => {
      if (res !== null) charge();
    });
  };

  const copyFull = () => {
    if (!result) return;
    const scenes = result.scenes?.map((s, i) =>
      `SCENE ${i + 1} (${s.time})\nVisual: ${s.visual}\nScript: ${s.script}\nEmotion: ${s.emotion}`
    ).join("\n\n");
    const hooks = result.hooks?.join("\n");
    const text = `${result.title}\n\nHOOKS:\n${hooks}\n\nSCENES:\n${scenes}`;
    navigator.clipboard.writeText(text);
    toast({ description: "Full script copied" });
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">Script Intelligence</p>
        <h2 className="text-2xl font-bold text-white mb-1">Video Scripts</h2>
        <p className="text-muted-foreground text-sm">Generate production-ready video scripts with hooks, scenes, and direction notes.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <Card className="bg-[#111111] border-white/5">
          <CardContent className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Product / Brand</Label>
                <Input placeholder="e.g. HydroElite Water Bottle" className="bg-[#0a0a0a] border-white/10 focus-visible:ring-primary/50" value={product} onChange={(e) => setProduct(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Video Format</Label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full h-9 rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-1 text-sm text-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-0"
                >
                  <option value="" disabled>Select format</option>
                  <option value="TikTok / Reels hook ad">TikTok / Reels Hook Ad</option>
                  <option value="Facebook / Instagram ad">Facebook / Instagram Ad</option>
                  <option value="YouTube pre-roll ad">YouTube Pre-roll Ad</option>
                  <option value="UGC authentic review">UGC Authentic Review</option>
                  <option value="Brand story video">Brand Story Video</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Duration</Label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full h-9 rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-1 text-sm text-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-0"
                >
                  <option value="" disabled>Select duration</option>
                  <option value="15s">15s — Quick Hook</option>
                  <option value="30s">30s — Standard Ad</option>
                  <option value="60s">60s — Story Format</option>
                  <option value="90s">90s — Extended</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Style (optional)</Label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full h-9 rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-1 text-sm text-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-0"
                >
                  <option value="" disabled>Select style</option>
                  <option value="High energy fast-paced">High Energy Fast-Paced</option>
                  <option value="Cinematic storytelling">Cinematic Storytelling</option>
                  <option value="Conversational authentic">Conversational Authentic</option>
                  <option value="Problem-solution">Problem → Solution</option>
                  <option value="Testimonial social proof">Testimonial / Social Proof</option>
                </select>
              </div>
            </div>
            <CreditsGate feature="video_script" onSuccess={runGenerate} disabled={!product.trim() || isGenerating}>
              {({ trigger, isLoading }) => (
                <Button onClick={trigger} disabled={isLoading || isGenerating || !product.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full">
                  {isLoading || isGenerating ? (<><Loader2 className="w-4 h-4 animate-spin mr-2" /> Writing your script...</>) : (<><Video className="w-4 h-4 mr-2" /> Generate Script</>)}
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
              <span className="text-sm">Writing a high-converting script for <span className="text-white">"{product}"</span>...</span>
            </div>
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-28 rounded-lg bg-white/5 border border-white/5 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />))}</div>
          </motion.div>
        )}

        {isError && (
          <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="bg-red-950/20 border-red-500/20">
              <CardContent className="p-5 flex items-center gap-4">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <div className="flex-1"><p className="text-sm font-semibold text-red-400">Generation failed</p><p className="text-xs text-muted-foreground">{error}</p></div>
                <Button size="sm" variant="outline" onClick={() => { reset(); generate("/api/ai/video-script", { product, format: format || undefined, duration: duration || undefined, style: style || undefined }); }} className="border-red-500/30 text-red-400 hover:bg-red-500/10 shrink-0"><RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {isDone && result && (
          <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="space-y-4">
            <Card className="bg-[#111111] border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    <Video className="w-4 h-4 text-primary" />{result.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-primary/30 text-primary flex items-center gap-1 text-xs"><Clock className="w-3 h-3" />{result.duration}</Badge>
                    <button onClick={copyFull} className="text-muted-foreground hover:text-white transition-colors p-1"><Copy className="w-3.5 h-3.5" /></button>
                    <button onClick={reset} className="text-muted-foreground hover:text-white transition-colors text-xs flex items-center gap-1"><RefreshCw className="w-3 h-3" /></button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {(result.voiceoverStyle || result.musicMood || result.editingPace) && (
                  <div className="grid grid-cols-3 gap-3">
                    {result.voiceoverStyle && (
                      <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Voiceover</p>
                        <p className="text-xs text-white">{result.voiceoverStyle}</p>
                      </div>
                    )}
                    {result.musicMood && (
                      <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1"><Music className="w-3 h-3" />Music</p>
                        <p className="text-xs text-white">{result.musicMood}</p>
                      </div>
                    )}
                    {result.editingPace && (
                      <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1"><Film className="w-3 h-3" />Editing</p>
                        <p className="text-xs text-white">{result.editingPace}</p>
                      </div>
                    )}
                  </div>
                )}

                {result.hooks?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 font-medium">Hook Variations</p>
                    <div className="space-y-2">
                      {result.hooks.map((hook, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-white/5 border border-white/5 rounded-lg group">
                          <span className="text-xs font-bold text-primary shrink-0 mt-0.5">H{i + 1}</span>
                          <p className="text-sm text-white flex-1 leading-snug">{hook}</p>
                          <button
                            onClick={() => { navigator.clipboard.writeText(hook); toast({ description: "Hook copied" }); }}
                            className="text-muted-foreground hover:text-white transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.viralTrigger && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/15">
                    <Zap className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-primary font-medium mb-0.5">Viral Trigger</p>
                      <p className="text-xs text-muted-foreground">{result.viralTrigger}</p>
                    </div>
                  </div>
                )}

                {result.scenes?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 font-medium">Scene Breakdown</p>
                    <div className="space-y-3">
                      {result.scenes.map((scene: ScriptScene, i: number) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="border border-white/5 rounded-lg overflow-hidden">
                          <div className="flex items-center gap-3 px-4 py-2.5 bg-white/5 border-b border-white/5">
                            <span className="text-xs font-bold text-primary">Scene {i + 1}</span>
                            <Badge variant="outline" className="text-xs border-white/10 text-muted-foreground">{scene.time}</Badge>
                            {scene.emotion && <span className="text-xs text-amber-400 ml-auto">{scene.emotion}</span>}
                          </div>
                          <div className="p-4 grid md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5">Visual</p>
                              <p className="text-sm text-muted-foreground italic leading-relaxed">{scene.visual}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5">Voiceover / Text</p>
                              <p className="text-sm text-white leading-relaxed">{scene.script}</p>
                            </div>
                          </div>
                          {scene.direction && (
                            <div className="px-4 pb-3">
                              <p className="text-xs text-white/40 uppercase tracking-wider mb-0.5">Direction</p>
                              <p className="text-xs text-muted-foreground/70">{scene.direction}</p>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {result.distributionTips?.length > 0 && (
                  <div className="border-t border-white/5 pt-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 font-medium flex items-center gap-1.5"><Share2 className="w-3.5 h-3.5" /> Distribution Tips</p>
                    <div className="space-y-1.5">
                      {result.distributionTips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-primary font-bold text-xs shrink-0 mt-0.5">{i + 1}.</span>
                          <p className="text-xs text-muted-foreground">{tip}</p>
                        </div>
                      ))}
                    </div>
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
