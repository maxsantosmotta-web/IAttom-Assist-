import { useState } from "react";
import { motion } from "framer-motion";
import { Megaphone, Target, Globe, Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CreditsGate } from "@/components/CreditsGate";

const mockCampaign = {
  headline: "Finally — A Water Bottle That Actually Keeps Your Drinks Cold for 48 Hours",
  subheadline: "While other bottles fail after 12 hours, HydroElite's triple-wall insulation is engineered for real life.",
  cta: "Shop HydroElite — Free Shipping Over $50",
  audience: "Adults 25–45 interested in outdoor sports, fitness, and sustainable living",
  channels: ["Meta Ads", "Google Search", "Instagram Reels", "TikTok"],
  budget: "Recommended: $80–$150/day for initial testing",
  copy: {
    facebook: "Tired of warm drinks by noon? HydroElite keeps your water ice-cold for 48 hours straight. 12,000+ athletes trust it. Try it risk-free with our 30-day guarantee.",
    instagram: "Your old bottle is lying to you. HydroElite actually keeps drinks cold for 48 hours. Zero compromise. Tap to shop.",
  }
};

export function CreateCampaign() {
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [campaign, setCampaign] = useState<typeof mockCampaign | null>(null);
  const { toast } = useToast();

  const runGenerate = () => {
    setIsGenerating(true);
    setCampaign(null);
    setTimeout(() => {
      setIsGenerating(false);
      setCampaign(mockCampaign);
    }, 2500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ description: "Copied to clipboard" });
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">Campaign Builder</p>
        <h2 className="text-2xl font-bold text-white mb-1">Create Campaign</h2>
        <p className="text-muted-foreground text-sm">Generate a full campaign strategy with ad copy, audience targeting, and channel recommendations.</p>
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
                <Input
                  data-testid="input-campaign-product"
                  placeholder="e.g. HydroElite Water Bottle"
                  className="bg-[#0a0a0a] border-white/10 focus-visible:ring-primary/50"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Campaign Goal</Label>
                <Select onValueChange={setGoal}>
                  <SelectTrigger data-testid="select-campaign-goal" className="bg-[#0a0a0a] border-white/10 focus:ring-primary/50">
                    <SelectValue placeholder="Select goal" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111111] border-white/10">
                    <SelectItem value="awareness">Brand Awareness</SelectItem>
                    <SelectItem value="conversions">Drive Sales</SelectItem>
                    <SelectItem value="leads">Lead Generation</SelectItem>
                    <SelectItem value="traffic">Website Traffic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Target Audience</Label>
              <Textarea
                data-testid="input-campaign-audience"
                placeholder="Describe your ideal customer: age, interests, pain points..."
                className="bg-[#0a0a0a] border-white/10 focus-visible:ring-primary/50 resize-none"
                rows={2}
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />
            </div>
            <CreditsGate
              feature="campaign"
              onSuccess={runGenerate}
              disabled={!product.trim() || isGenerating}
            >
              {({ trigger, isLoading }) => (
                <Button
                  data-testid="button-generate-campaign"
                  onClick={trigger}
                  disabled={isLoading || isGenerating || !product.trim()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
                >
                  {isLoading || isGenerating ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Building your campaign...</>
                  ) : "Generate Campaign"}
                </Button>
              )}
            </CreditsGate>
          </CardContent>
        </Card>
      </motion.div>

      {campaign && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-4">
          <Card className="bg-[#111111] border-primary/20">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-primary" />
                <CardTitle className="text-base text-white">Campaign Strategy</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Headline</p>
                <p className="text-white font-semibold">{campaign.headline}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Sub-headline</p>
                <p className="text-muted-foreground text-sm">{campaign.subheadline}</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1"><Target className="w-3 h-3" /> Audience</p>
                  <p className="text-sm text-white">{campaign.audience}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1"><Globe className="w-3 h-3" /> Channels</p>
                  <div className="flex flex-wrap gap-1">
                    {campaign.channels.map((c) => (
                      <span key={c} className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{c}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(campaign.copy).map(([platform, copy]) => (
                  <div key={platform} className="bg-[#0a0a0a] border border-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-primary capitalize">{platform}</p>
                      <button onClick={() => copyToClipboard(copy)} className="text-muted-foreground hover:text-white transition-colors">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{copy}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
