import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/ui/Logo";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14 } },
};

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center selection:bg-primary/25 selection:text-white overflow-hidden">

      {/* ambient gold glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_65%_50%_at_50%_40%,_rgba(201,168,76,0.13)_0%,_transparent_70%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_35%_30%_at_50%_50%,_rgba(201,168,76,0.06)_0%,_transparent_65%)] pointer-events-none" />

      {/* subtle grid */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.009)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.009)_1px,transparent_1px)] bg-[size:80px_80px] pointer-events-none" />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center text-center px-6 gap-10 sm:gap-12 max-w-sm sm:max-w-md w-full"
      >

        {/* logo */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl scale-125 pointer-events-none" />
          <div className="relative rounded-[22px] ring-1 ring-primary/20 shadow-[0_0_60px_-12px_rgba(201,168,76,0.5)]">
            <LogoMark size={96} />
          </div>
        </motion.div>

        {/* slogan */}
        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="text-[22px] sm:text-[26px] font-bold text-white tracking-[-0.02em] leading-[1.25] px-2"
        >
          Um passo sólido vale mais<br />
          <span className="bg-gradient-to-r from-[#F2E08E] via-[#C9A84C] to-[#9A6F28] bg-clip-text text-transparent">
            do que cem recomeços.
          </span>
        </motion.p>

        {/* buttons */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col w-full gap-3"
        >
          <Link href="/sign-up" className="w-full">
            <Button
              size="lg"
              className="w-full h-13 text-[13px] font-black tracking-widest uppercase bg-primary text-black hover:bg-primary/90 rounded-xl shadow-[0_0_55px_-10px_rgba(201,168,76,0.6)] hover:shadow-[0_0_75px_-10px_rgba(201,168,76,0.75)] transition-all duration-300"
            >
              Criar Conta
            </Button>
          </Link>
          <Link href="/sign-in" className="w-full">
            <Button
              size="lg"
              variant="outline"
              className="w-full h-13 text-[13px] font-semibold tracking-widest uppercase border-white/[0.10] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 rounded-xl transition-all"
            >
              Fazer Login
            </Button>
          </Link>
        </motion.div>

      </motion.div>
    </div>
  );
}
