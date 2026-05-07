import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Loader2, Copy, RefreshCw, AlertCircle, Hash, Mail, MessageSquare, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CreditsGate } from "@/components/CreditsGate";
import { useAiStream } from "@/hooks/useAiStream";
import type { ContentResult } from "@/types/ai";

function ContentTab({ content, label, icon: Icon }: { content: string; label: string; icon: React.ComponentType<{ className?: string }> }) {
  const { toast } = useToast();
  return (
    <Card className="bg-[#111111] border-primary/20">
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(content); toast({ description: "Copied to clipboard" }); }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors"
          >
            <Copy className="w-3.5 h-3.5" /> Copy
          </button>
        </div>
        <Textarea
          className="min-h-[280px] bg-transparent border-0 text-sm text-muted-foreground leading-relaxed resize-none focus-visible:ring-0 p-4"
          value={content}
          readOnly
        />
      </CardContent>
    </Card>
  );
}

export function CreateContent() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const { status, result, error, generate, reset } = useAiStream<ContentResult>();
  const { toast } = useToast();

  const isGenerating = status === "generating";
  const isDone = status === "done";
  const isError = status === "error";

  // charge() is provided by CreditsGate and called only after AI returns a result.
  const runGenerate = (charge: () => void) => {
    generate("/api/ai/create-content", { topic, tone: tone || undefined, additionalContext: additionalContext || undefined }).then((res) => {
      if (res !== null) charge();
    });
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">AI Content Studio</p>
        <h2 className="text-2xl font-bold text-white mb-1">Create Content</h2>
        <p className="text-muted-foreground text-sm">Generate a full content suite — blog, social, email, SMS — with one prompt.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <Card className="bg-[#111111] border-white/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Content Brief
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Topic / Product</Label>
                <Input placeholder="e.g. HydroElite Water Bottle launch" className="bg-[#0a0a0a] border-white/10 focus-visible:ring-primary/50" value={topic} onChange={(e) => setTopic(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Tone of Voice</Label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full h-9 rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-1 text-sm text-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-0"
                >
                  <option value="" disabled>Choose tone</option>
                  <option value="Bold and direct">Bold &amp; Direct</option>
                  <option value="Professional">Professional</option>
                  <option value="Conversational">Conversational</option>
                  <option value="Inspirational">Inspirational</option>
                  <option value="Witty and humorous">Witty &amp; Humorous</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Additional Context (optional)</Label>
              <Textarea placeholder="Target audience, key benefits, differentiators, price point..." className="bg-[#0a0a0a] border-white/10 focus-visible:ring-primary/50 resize-none" rows={2} value={additionalContext} onChange={(e) => setAdditionalContext(e.target.value)} />
            </div>
            <CreditsGate feature="content" onSuccess={runGenerate} disabled={!topic.trim() || isGenerating}>
              {({ trigger, isLoading }) => (
                <Button onClick={trigger} disabled={isLoading || isGenerating || !topic.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full">
                  {isLoading || isGenerating ? (<><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating content suite...</>) : "Generate Content Suite"}
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
              <span className="text-sm">Writing your content suite for <span className="text-white">"{topic}"</span>...</span>
            </div>
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-48 rounded-lg bg-white/5 border border-white/5 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />))}</div>
          </motion.div>
        )}

        {isError && (
          <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="bg-red-950/20 border-red-500/20">
              <CardContent className="p-5 flex items-center gap-4">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <div className="flex-1"><p className="text-sm font-semibold text-red-400">Generation failed</p><p className="text-xs text-muted-foreground">{error}</p></div>
                <Button size="sm" variant="outline" onClick={() => { reset(); generate("/api/ai/create-content", { topic, tone: tone || undefined, additionalContext: additionalContext || undefined }); }} className="border-red-500/30 text-red-400 hover:bg-red-500/10 shrink-0"><RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {isDone && result && (
          <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Content Suite Ready</h3>
              <button onClick={reset} className="text-xs text-muted-foreground hover:text-white transition-colors flex items-center gap-1.5"><RefreshCw className="w-3 h-3" /> New content</button>
            </div>

            {result.seoTitle && (
              <div className="mb-4 grid md:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <p className="text-xs text-primary font-medium mb-0.5">SEO Title</p>
                  <p className="text-sm text-white">{result.seoTitle}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <p className="text-xs text-primary font-medium mb-0.5">Meta Description</p>
                  <p className="text-sm text-muted-foreground">{result.seoDescription}</p>
                </div>
              </div>
            )}

            <Tabs defaultValue="blog">
              <TabsList className="bg-[#111111] border border-white/5 flex-wrap h-auto gap-1 p-1 mb-4">
                {[
                  { value: "blog", label: "Blog Post", icon: FileText },
                  { value: "social", label: "Social", icon: Hash },
                  { value: "email", label: "Email", icon: Mail },
                  { value: "tweet", label: "Tweet Thread", icon: Twitter },
                  { value: "sms", label: "SMS", icon: MessageSquare },
                ].map(({ value, label, icon: Icon }) => (
                  result[value === "tweet" ? "tweetThread" : value === "sms" ? "smsText" : value as keyof ContentResult] && (
                    <TabsTrigger key={value} value={value} className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-xs">
                      <Icon className="w-3 h-3 mr-1" />{label}
                    </TabsTrigger>
                  )
                ))}
              </TabsList>

              {result.blog && <TabsContent value="blog"><ContentTab content={result.blog} label="Blog Post" icon={FileText} /></TabsContent>}
              {result.social && <TabsContent value="social"><ContentTab content={result.social} label="Social Caption" icon={Hash} /></TabsContent>}
              {result.email && <TabsContent value="email"><ContentTab content={result.email} label="Email Copy" icon={Mail} /></TabsContent>}
              {result.tweetThread && <TabsContent value="tweet"><ContentTab content={result.tweetThread} label="Tweet Thread" icon={Twitter} /></TabsContent>}
              {result.smsText && <TabsContent value="sms"><ContentTab content={result.smsText} label="SMS Message" icon={MessageSquare} /></TabsContent>}
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
