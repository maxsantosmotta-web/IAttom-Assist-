import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { motion } from "framer-motion";
import { Check, Zap, Star, RefreshCw, CheckCircle2 } from "lucide-react";
import {
  useGetStripePlans,
  getGetStripePlansQueryKey,
  useCreateCheckoutSession,
} from "@workspace/api-client-react";
import { PLAN_CREDITS } from "@/lib/credits";
import { useToast } from "@/hooks/use-toast";

type PlanKey = "free" | "pro" | "business" | "agency";

const PLAN_ORDER: PlanKey[] = ["free", "pro", "business", "agency"];

const PLAN_NAMES: Record<PlanKey, string> = {
  free: "START",
  pro: "Pro",
  business: "Business",
  agency: "Agency",
};

const PLAN_PRICES_DISPLAY: Record<PlanKey, string> = {
  free: "Grátis",
  pro: "$79/mês",
  business: "$199/mês",
  agency: "$499/mês",
};

const PLAN_COLORS: Record<PlanKey, string> = {
  free: "text-zinc-400",
  pro: "text-primary",
  business: "text-emerald-400",
  agency: "text-purple-400",
};

const PLAN_BORDER: Record<PlanKey, string> = {
  free: "border-white/10",
  pro: "border-primary/40",
  business: "border-emerald-500/30",
  agency: "border-purple-500/30",
};

const PLAN_GLOW: Record<PlanKey, string> = {
  free: "",
  pro: "shadow-[0_0_40px_rgba(201,168,76,0.07)]",
  business: "shadow-[0_0_40px_rgba(16,185,129,0.05)]",
  agency: "shadow-[0_0_40px_rgba(168,85,247,0.05)]",
};

const PLAN_BTN: Record<PlanKey, string> = {
  free: "bg-white/8 hover:bg-white/12 text-zinc-200 border border-white/10",
  pro: "bg-primary hover:bg-primary/90 text-black",
  business: "bg-emerald-500 hover:bg-emerald-500/90 text-black",
  agency: "bg-purple-500 hover:bg-purple-500/90 text-white",
};

const STATIC_FEATURES: Record<PlanKey, string[]> = {
  free: [
    "50 créditos por mês",
    "Todos os módulos de IA",
    "Histórico básico",
    "Suporte por email",
  ],
  pro: [
    "500 créditos por mês",
    "Analytics avançado",
    "Suporte prioritário",
    "Bônus de indicação 2×",
  ],
  business: [
    "2.000 créditos por mês",
    "Tudo do Pro",
    "Relatórios exportáveis",
    "Suporte dedicado",
  ],
  agency: [
    "10.000 créditos por mês",
    "Tudo do Business",
    "Multi-workspace",
    "Acesso à API",
  ],
};

function onboardingKey(userId: string) {
  return `iattom_onboarded_${userId}`;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.35 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 22, stiffness: 260 },
  },
};

export function Onboarding() {
  const [, navigate] = useLocation();
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const [selecting, setSelecting] = useState<PlanKey | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;
    if (localStorage.getItem(onboardingKey(user.id))) {
      navigate("/dashboard", { replace: true });
    }
  }, [isLoaded, user]);

  const { data: stripePlans = [] } = useGetStripePlans({
    query: {
      queryKey: getGetStripePlansQueryKey(),
      retry: false,
      staleTime: 60_000,
    },
  });

  const checkout = useCreateCheckoutSession({
    mutation: {
      onSuccess: (data) => {
        if (data.url) window.location.href = data.url;
      },
      onError: () => {
        setSelecting(null);
        toast({
          title: "Erro ao iniciar checkout",
          description: "Tente novamente em instantes.",
          variant: "destructive",
        });
      },
    },
  });

  const handleSelect = (planKey: PlanKey) => {
    if (!user || selecting) return;

    if (planKey === "free") {
      localStorage.setItem(onboardingKey(user.id), "1");
      navigate("/dashboard", { replace: true });
      return;
    }

    const stripePlan = stripePlans.find((p) => p.planKey === planKey);
    if (!stripePlan?.priceId) {
      toast({
        title: "Plano indisponível",
        description: "Os planos pagos serão ativados em breve.",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem(onboardingKey(user.id), "1");
    setSelecting(planKey);
    checkout.mutate({ data: { priceId: stripePlan.priceId, planKey } });
  };

  if (!isLoaded) return null;

  return (
    <div className="relative min-h-[100dvh] bg-[#0a0a0a] flex flex-col items-center px-4 py-14 overflow-x-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 inset-x-0 h-[45vh]"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,168,76,0.11) 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute bottom-0 inset-x-0 h-[30vh]"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(201,168,76,0.04) 0%, transparent 65%)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-12"
        >
          <img
            src="/iattom-logo-transparent.png"
            alt="iAttom"
            className="w-11 h-11 opacity-85"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.1,
              type: "spring",
              damping: 16,
              stiffness: 280,
            }}
            className="inline-flex items-center justify-center w-[60px] h-[60px] rounded-full bg-primary/10 border border-primary/25 mb-5"
          >
            <CheckCircle2 className="w-7 h-7 text-primary" />
          </motion.div>

          <h1 className="text-[28px] font-black text-white tracking-tight leading-none mb-2.5">
            Conta criada com sucesso
          </h1>
          <p className="text-[13px] text-zinc-400 max-w-xs mx-auto leading-relaxed">
            Escolha seu plano para começar a usar o iAttom Assist.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full"
        >
          {PLAN_ORDER.map((planKey) => {
            const isPopular = planKey === "pro";
            const isPending = selecting === planKey;

            return (
              <motion.div
                key={planKey}
                variants={cardVariants}
                className={`relative rounded-2xl border bg-[#111111] p-5 flex flex-col ${PLAN_BORDER[planKey]} ${PLAN_GLOW[planKey]}`}
              >
                {isPopular && (
                  <div className="absolute -top-px left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-3 py-[3px] rounded-b-lg bg-primary text-black tracking-wide">
                      <Star className="w-2.5 h-2.5 fill-black" />
                      RECOMENDADO
                    </span>
                  </div>
                )}

                <div className="mb-4 mt-2">
                  <p
                    className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${PLAN_COLORS[planKey]}`}
                  >
                    {PLAN_NAMES[planKey]}
                  </p>
                  <p className="text-[26px] font-black text-white tracking-tight leading-none">
                    {PLAN_PRICES_DISPLAY[planKey]}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 mb-4 px-2.5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  <Zap className="w-3.5 h-3.5 text-primary fill-primary shrink-0" />
                  <span className="text-[11px] font-semibold text-zinc-300">
                    {PLAN_CREDITS[planKey].toLocaleString()} créditos / mês
                  </span>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {STATIC_FEATURES[planKey].map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-[1px]" />
                      <span className="text-[12px] text-zinc-400 leading-snug">
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelect(planKey)}
                  disabled={!!selecting}
                  className={`w-full h-[42px] rounded-xl text-[12px] font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${PLAN_BTN[planKey]}`}
                >
                  {isPending ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : planKey === "free" ? (
                    "Começar grátis"
                  ) : (
                    `Escolher ${PLAN_NAMES[planKey]}`
                  )}
                </button>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="text-center text-[11px] text-zinc-600 mt-9 tracking-wide"
        >
          Cancele quando quiser · Cobrado mensalmente · Créditos renovam todo mês
        </motion.p>
      </div>
    </div>
  );
}
