import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Download, RefreshCw, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditsGate } from "@/components/CreditsGate";

const mockCreatives = [
  { id: 1, label: "Hero Banner", color: "from-primary/30 to-amber-900/20" },
  { id: 2, label: "Square Ad", color: "from-blue-900/30 to-purple-900/20" },
  { id: 3, label: "Story Format", color: "from-emerald-900/30 to-teal-900/20" },
  { id: 4, label: "Product Focus", color: "from-rose-900/30 to-orange-900/20" },
];

export function CreativeGenerator() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const runGenerate = () => {
    setIsGenerating(true);
    setGenerated(false);
    setTimeout(() => {
      setIsGenerating(false);
      setGenerated(true);
    }, 2800);
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">Visual Intelligence</p>
        <h2 className="text-2xl font-bold text-white mb-1">Creative Generator</h2>
        <p className="text-muted-foreground text-sm">Generate ad creatives, banners, and visual assets ready for deployment.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <Card className="bg-[#111111] border-white/5">
          <CardContent className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Creative Prompt</Label>
                <Input
                  data-testid="input-creative-prompt"
                  placeholder="e.g. Minimalist product shot of water bottle on mountain"
                  className="bg-[#0a0a0a] border-white/10 focus-visible:ring-primary/50"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Visual Style</Label>
                <Select onValueChange={setStyle}>
                  <SelectTrigger data-testid="select-creative-style" className="bg-[#0a0a0a] border-white/10">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111111] border-white/10">
                    <SelectItem value="photorealistic">Photorealistic</SelectItem>
                    <SelectItem value="minimalist">Minimalist</SelectItem>
                    <SelectItem value="bold">Bold & Graphic</SelectItem>
                    <SelectItem value="luxury">Luxury Editorial</SelectItem>
                    <SelectItem value="lifestyle">Lifestyle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CreditsGate feature="creative" onSuccess={runGenerate} disabled={!prompt.trim() || isGenerating}>
              {({ trigger, isLoading }) => (
                <Button
                  data-testid="button-generate-creative"
                  onClick={trigger}
                  disabled={isLoading || isGenerating || !prompt.trim()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
                >
                  {isLoading || isGenerating ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating creatives...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Generate Creatives</>
                  )}
                </Button>
              )}
            </CreditsGate>
          </CardContent>
        </Card>
      </motion.div>

      {isGenerating && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-white/5 border border-white/5 animate-pulse" />
          ))}
        </div>
      )}

      {generated && !isGenerating && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Generated Creatives</h3>
            <Button variant="ghost" size="sm" onClick={runGenerate} className="text-muted-foreground hover:text-white">
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Regenerate
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mockCreatives.map((creative, i) => (
              <motion.div
                key={creative.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="group relative"
              >
                <div
                  data-testid={`creative-card-${creative.id}`}
                  className={`aspect-square rounded-lg bg-gradient-to-br ${creative.color} border border-white/10 flex flex-col items-center justify-center gap-2 overflow-hidden`}
                >
                  <ImageIcon className="w-8 h-8 text-white/30" />
                  <p className="text-xs text-white/40 font-medium">{creative.label}</p>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button size="sm" variant="outline" className="border-white/20 bg-black/50 text-white hover:bg-black/70">
                      <Download className="w-3.5 h-3.5 mr-1" /> Download
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">{creative.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
