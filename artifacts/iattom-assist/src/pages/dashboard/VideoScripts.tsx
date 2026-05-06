import { useState } from "react";
import { motion } from "framer-motion";
import { Video, Loader2, Copy, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const mockScript = {
  title: "HydroElite — 30 Second Hook Ad",
  duration: "30s",
  hooks: [
    "This bottle kept my coffee hot for 10 hours. I tested it so you don't have to.",
    "Every serious athlete I know switched to this. Here's why.",
    "I was embarrassed by my old water bottle until I found this.",
  ],
  scenes: [
    { time: "0-3s", visual: "Close-up of condensation-free bottle on a sweaty gym bag", script: "You're losing performance. And you don't even know it." },
    { time: "3-8s", visual: "Split screen: regular bottle vs HydroElite in ice water test", script: "Most bottles can't hold temperature past 12 hours. HydroElite holds for 48." },
    { time: "8-20s", visual: "Athlete montage — trail running, gym, cycling, office", script: "Whether you're pushing limits at 6AM or grinding through back-to-back meetings — HydroElite is the only bottle built for both." },
    { time: "20-27s", visual: "Product rotating on clean background, gold light", script: "Triple-wall vacuum insulation. 18/8 stainless steel. Lifetime guarantee." },
    { time: "27-30s", visual: "CTA screen with product and link", script: "HydroElite. Upgrade your standard. Link in bio." },
  ]
};

export function VideoScripts() {
  const [product, setProduct] = useState("");
  const [format, setFormat] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [script, setScript] = useState<typeof mockScript | null>(null);
  const { toast } = useToast();

  const handleGenerate = () => {
    if (!product.trim()) return;
    setIsGenerating(true);
    setScript(null);
    setTimeout(() => {
      setIsGenerating(false);
      setScript(mockScript);
    }, 2200);
  };

  const copyScene = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ description: "Copied to clipboard" });
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">Script Intelligence</p>
        <h2 className="text-2xl font-bold text-white mb-1">Video Scripts</h2>
        <p className="text-muted-foreground text-sm">Generate viral-ready video scripts with scene breakdowns and hook variations.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <Card className="bg-[#111111] border-white/5">
          <CardContent className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Product / Brand</Label>
                <Input
                  data-testid="input-script-product"
                  placeholder="e.g. HydroElite Water Bottle"
                  className="bg-[#0a0a0a] border-white/10 focus-visible:ring-primary/50"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Video Format</Label>
                <Select onValueChange={setFormat}>
                  <SelectTrigger data-testid="select-script-format" className="bg-[#0a0a0a] border-white/10">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111111] border-white/10">
                    <SelectItem value="15s">15s — Quick Hook</SelectItem>
                    <SelectItem value="30s">30s — Standard Ad</SelectItem>
                    <SelectItem value="60s">60s — Story Format</SelectItem>
                    <SelectItem value="ugc">UGC Style</SelectItem>
                    <SelectItem value="explainer">Explainer Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              data-testid="button-generate-script"
              onClick={handleGenerate}
              disabled={isGenerating || !product.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Writing your script...</>
              ) : (
                <><Video className="w-4 h-4 mr-2" /> Generate Script</>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {script && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-4">
          <Card className="bg-[#111111] border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Video className="w-4 h-4 text-primary" />
                  {script.title}
                </CardTitle>
                <Badge variant="outline" className="border-primary/30 text-primary flex items-center gap-1">
                  <Clock className="w-3 h-3" />{script.duration}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Hook Variations</p>
                <div className="space-y-2">
                  {script.hooks.map((hook, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-white/5 border border-white/5 rounded-lg">
                      <span className="text-xs font-bold text-primary shrink-0 mt-0.5">H{i + 1}</span>
                      <p className="text-sm text-white flex-1">{hook}</p>
                      <button onClick={() => copyScene(hook)} className="text-muted-foreground hover:text-white transition-colors shrink-0">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Scene Breakdown</p>
                <div className="space-y-3">
                  {script.scenes.map((scene, i) => (
                    <div key={i} className="border border-white/5 rounded-lg overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border-b border-white/5">
                        <span className="text-xs font-bold text-primary">Scene {i + 1}</span>
                        <Badge variant="outline" className="text-xs border-white/10 text-muted-foreground">{scene.time}</Badge>
                      </div>
                      <div className="p-4 grid md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Visual</p>
                          <p className="text-sm text-muted-foreground italic">{scene.visual}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Voiceover</p>
                          <p className="text-sm text-white">{scene.script}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
