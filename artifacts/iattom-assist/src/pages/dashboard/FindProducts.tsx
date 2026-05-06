import { useState } from "react";
import { motion } from "framer-motion";
import { Search, TrendingUp, Star, DollarSign, BarChart2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditsGate } from "@/components/CreditsGate";

const mockProducts = [
  { id: 1, name: "Portable Air Purifier", category: "Home & Living", score: 94, demand: "High", margin: "68%", trend: "+34%" },
  { id: 2, name: "Resistance Band Set", category: "Fitness", score: 88, demand: "Very High", margin: "72%", trend: "+21%" },
  { id: 3, name: "Bamboo Desk Organizer", category: "Office", score: 82, demand: "Medium", margin: "61%", trend: "+15%" },
  { id: 4, name: "LED Grow Light", category: "Garden", score: 79, demand: "High", margin: "65%", trend: "+28%" },
  { id: 5, name: "Silicone Food Bags", category: "Kitchen", score: 76, demand: "High", margin: "70%", trend: "+19%" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function FindProducts() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setSearched(true);
    }, 1800);
  };

  const displayProducts = searched ? mockProducts : mockProducts.slice(0, 3);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">AI Product Research</p>
        <h2 className="text-2xl font-bold text-white mb-1">Find Products</h2>
        <p className="text-muted-foreground text-sm">Discover high-margin, trending products vetted by AI market intelligence.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <Card className="bg-[#111111] border-white/5">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  data-testid="input-product-search"
                  placeholder="Search for products, niches, or categories..."
                  className="pl-10 bg-[#0a0a0a] border-white/10 focus-visible:ring-primary/50 text-white"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isSearching && query.trim() && runSearch()}
                />
              </div>
              <CreditsGate feature="product_discovery" onSuccess={runSearch} disabled={!query.trim() || isSearching}>
                {({ trigger, isLoading }) => (
                  <Button
                    data-testid="button-search"
                    onClick={trigger}
                    disabled={isLoading || isSearching || !query.trim()}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-6"
                  >
                    {isLoading || isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                  </Button>
                )}
              </CreditsGate>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {["Trending now", "High margin", "Low competition", "Home & Living", "Fitness", "Tech accessories"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {isSearching ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm">Analyzing market data...</span>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
              {searched ? `Results for "${query}"` : "Trending Opportunities"}
            </h3>
            <span className="text-xs text-muted-foreground">{displayProducts.length} found</span>
          </div>
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid gap-3">
            {displayProducts.map((product) => (
              <motion.div key={product.id} variants={itemVariants}>
                <Card
                  data-testid={`card-product-${product.id}`}
                  className="bg-[#111111] border-white/5 hover:border-primary/20 transition-colors cursor-pointer"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-white text-sm">{product.name}</h4>
                          <Badge variant="outline" className="text-xs border-white/10 text-muted-foreground">{product.category}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3" /> Demand: <span className="text-white font-medium ml-0.5">{product.demand}</span></span>
                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> Margin: <span className="text-emerald-400 font-medium ml-0.5">{product.margin}</span></span>
                          <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Trend: <span className="text-primary font-medium ml-0.5">{product.trend}</span></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Star className="w-4 h-4 text-primary fill-primary" />
                        <span className="text-lg font-bold text-white">{product.score}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
}
