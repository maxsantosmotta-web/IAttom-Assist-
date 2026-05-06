import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, TrendingUp, Users, DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const mockAnalysis = {
  score: 81,
  verdict: "Strong Market Fit",
  marketSize: "$2.4B",
  competition: "Medium",
  buyerIntentScore: 87,
  strengths: ["Growing search volume (+34% YoY)", "Underserved premium segment", "High repeat purchase rate"],
  risks: ["Established competitors with brand recognition", "Seasonal demand fluctuations"],
  recommendation: "High potential. Target the premium segment with differentiated branding and build towards subscription/consumable revenue.",
};

export function ValidateProducts() {
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<typeof mockAnalysis | null>(null);

  const handleValidate = () => {
    if (!productName.trim()) return;
    setIsValidating(true);
    setResult(null);
    setTimeout(() => {
      setIsValidating(false);
      setResult(mockAnalysis);
    }, 2200);
  };

  const scoreColor = result
    ? result.score >= 80 ? "text-emerald-400" : result.score >= 60 ? "text-primary" : "text-red-400"
    : "";

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">Market Intelligence</p>
        <h2 className="text-2xl font-bold text-white mb-1">Validate Products</h2>
        <p className="text-muted-foreground text-sm">Run AI-powered market validation before committing resources.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <Card className="bg-[#111111] border-white/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-white">Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Product / Idea Name</Label>
              <Input
                data-testid="input-product-name"
                placeholder="e.g. Smart Hydration Bottle"
                className="bg-[#0a0a0a] border-white/10 focus-visible:ring-primary/50"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Description (optional)</Label>
              <Textarea
                data-testid="input-product-description"
                placeholder="Describe your product, target audience, price point..."
                className="bg-[#0a0a0a] border-white/10 focus-visible:ring-primary/50 resize-none"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Button
              data-testid="button-validate"
              onClick={handleValidate}
              disabled={isValidating || !productName.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
            >
              {isValidating ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analyzing market data...</>
              ) : (
                "Run Validation"
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <Card className="bg-[#111111] border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Validation Result</p>
                  <h3 className="text-xl font-bold text-white">{result.verdict}</h3>
                </div>
                <div className="text-center">
                  <p className={`text-5xl font-bold tabular-nums ${scoreColor}`}>{result.score}</p>
                  <p className="text-xs text-muted-foreground mt-1">/ 100</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Market Size", value: result.marketSize, icon: DollarSign },
                  { label: "Competition", value: result.competition, icon: Users },
                  { label: "Buyer Intent", value: `${result.buyerIntentScore}%`, icon: TrendingUp },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="bg-white/5 rounded-lg p-3 text-center border border-white/5">
                      <Icon className="w-4 h-4 text-primary mx-auto mb-1.5" />
                      <p className="text-sm font-bold text-white">{item.value}</p>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                    </div>
                  );
                })}
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Strengths</p>
                  {result.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest">Risks</p>
                  {result.risks.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/5 pt-4">
                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">AI Recommendation</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{result.recommendation}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
