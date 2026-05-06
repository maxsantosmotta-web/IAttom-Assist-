import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Globe, Shield, Sparkles, Target, Zap } from "lucide-react";
import { motion } from "framer-motion";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/30">
      {/* Navbar */}
      <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="font-bold text-xl tracking-tight text-white">IAttom Assist</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/sign-up">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative pt-32 pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-primary text-sm font-medium"
              >
                <Sparkles className="w-4 h-4" />
                Private intelligence for elite founders
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight"
              >
                Your unfair advantage in <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9A84C] to-[#E5C672]">building businesses</span>.
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              >
                Not just another chat interface. IAttom Assist is a surgical tool designed to find products, validate markets, and generate campaigns with lethal precision.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex items-center justify-center gap-4 pt-4"
              >
                <Link href="/sign-up">
                  <Button size="lg" className="h-14 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90 rounded-none">
                    Start Your Trial <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 bg-[#0a0a0a]">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Surgical Precision</h2>
              <p className="text-muted-foreground">Every tool you need to scale, engineered for maximum impact.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                {
                  icon: Target,
                  title: "Product Discovery",
                  desc: "Identify high-leverage market gaps before the competition sees them."
                },
                {
                  icon: BarChart3,
                  title: "Market Validation",
                  desc: "Data-backed confidence. Test viability with synthetic audience models."
                },
                {
                  icon: Zap,
                  title: "Campaign Generation",
                  desc: "Instantly deploy full-funnel marketing campaigns tailored to your niche."
                },
                {
                  icon: Shield,
                  title: "Private Workspace",
                  desc: "Your data remains yours. Secure, isolated intelligence."
                },
                {
                  icon: Globe,
                  title: "Global Reach",
                  desc: "Localize content and copy for 50+ markets instantly."
                },
                {
                  icon: Sparkles,
                  title: "Creative Assets",
                  desc: "Generate studio-quality visuals and video scripts on demand."
                }
              ].map((feature, i) => (
                <div key={i} className="p-6 bg-[#111111] border border-white/5 rounded-xl hover:border-primary/30 transition-colors group">
                  <feature.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t border-white/5 bg-background">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-semibold text-white">IAttom Assist</span>
          </div>
          <p className="text-sm text-muted-foreground">&copy; 2024 IAttom. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
