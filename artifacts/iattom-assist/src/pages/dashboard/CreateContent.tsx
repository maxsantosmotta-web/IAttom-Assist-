import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Loader2, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const mockContent = {
  blog: `# 7 Reasons Why Serious Athletes Are Switching to HydroElite in 2025

The hydration market is flooded with options, but only one is becoming the go-to choice for competitive athletes, weekend warriors, and performance-obsessed fitness enthusiasts alike.

## 1. 48-Hour Cold Retention That Actually Works

Most bottles promise long retention. HydroElite delivers it — triple-wall vacuum insulation tested at -20°C to +45°C ambient temperatures.

## 2. Built for Your Life, Not a Lab

Rugged 18/8 stainless steel exterior survives drops, scratches, and that one friend who always breaks your gear.

## The Bottom Line

If you're serious about performance, your hydration gear should match that energy. HydroElite does.`,
  social: `Your hydration is holding you back.

While you're refilling that grocery-store bottle every 2 hours, HydroElite athletes are still drinking ice-cold water from this morning.

48-hour cold retention. Zero compromise.

The upgrade is obvious. The only question is why you waited.`,
  email: `Subject: The bottle that elite athletes won't shut up about

Hi [First Name],

I'll keep this short because you're busy.

There's a reason 12,000+ athletes switched to HydroElite this year.

It's not the design (though that's stunning).
It's not the lifetime warranty (though that's incredible).

It's the 48-hour cold retention that actually works.

Stop refilling. Start performing.

→ Get HydroElite with free shipping

Stay cold,
The HydroElite Team`,
};

export function CreateContent() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("");
  const [contentType, setContentType] = useState("blog");
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState<typeof mockContent | null>(null);
  const { toast } = useToast();

  const handleGenerate = () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setContent(mockContent);
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ description: "Content copied to clipboard" });
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">AI Content Studio</p>
        <h2 className="text-2xl font-bold text-white mb-1">Create Content</h2>
        <p className="text-muted-foreground text-sm">Generate blog posts, social captions, and email sequences that convert.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <Card className="bg-[#111111] border-white/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Content Brief
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Topic / Product</Label>
                <Input
                  data-testid="input-content-topic"
                  placeholder="e.g. HydroElite Water Bottle"
                  className="bg-[#0a0a0a] border-white/10 focus-visible:ring-primary/50"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Tone of Voice</Label>
                <Select onValueChange={setTone}>
                  <SelectTrigger data-testid="select-content-tone" className="bg-[#0a0a0a] border-white/10">
                    <SelectValue placeholder="Choose tone" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111111] border-white/10">
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="conversational">Conversational</SelectItem>
                    <SelectItem value="bold">Bold & Direct</SelectItem>
                    <SelectItem value="inspirational">Inspirational</SelectItem>
                    <SelectItem value="humorous">Witty & Humorous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              data-testid="button-generate-content"
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating content...</>
              ) : "Generate Content Suite"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {content && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Tabs defaultValue="blog">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="bg-[#111111] border border-white/5">
                <TabsTrigger value="blog" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Blog Post</TabsTrigger>
                <TabsTrigger value="social" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Social</TabsTrigger>
                <TabsTrigger value="email" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Email</TabsTrigger>
              </TabsList>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleGenerate} className="text-muted-foreground hover:text-white">
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Regenerate
                </Button>
              </div>
            </div>

            {(["blog", "social", "email"] as const).map((tab) => (
              <TabsContent key={tab} value={tab}>
                <Card className="bg-[#111111] border-primary/20">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-4 border-b border-white/5">
                      <p className="text-xs text-muted-foreground capitalize">{tab === "blog" ? "Blog Post" : tab === "social" ? "Social Caption" : "Email Copy"}</p>
                      <button
                        onClick={() => copyToClipboard(content[tab])}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </button>
                    </div>
                    <Textarea
                      className="min-h-[300px] bg-transparent border-0 text-sm text-muted-foreground leading-relaxed resize-none focus-visible:ring-0 p-4"
                      value={content[tab]}
                      readOnly
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>
      )}
    </div>
  );
}
