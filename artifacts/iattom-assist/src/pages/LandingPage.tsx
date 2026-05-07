import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { UserPlus, LogIn } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13 } },
};

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center selection:bg-yellow-800/30 selection:text-white px-6 py-12">

      {/* ambient glow behind logo */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_35%,_rgba(180,130,30,0.12)_0%,_transparent_70%)] pointer-events-none" />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center text-center w-full max-w-[340px] sm:max-w-[400px] gap-8"
      >

        {/* approved circular logo */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <img
            src="/iattom-logo-approved.png"
            alt="IAttom Assist"
            className="w-[220px] sm:w-[260px] h-auto drop-shadow-[0_0_40px_rgba(201,168,76,0.45)]"
            draggable={false}
          />
        </motion.div>

        {/* slogan */}
        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="text-[16px] sm:text-[17px] text-white/90 font-normal leading-snug tracking-wide px-2"
        >
          Um passo sólido vale mais do que cem recomeços.
        </motion.p>

        {/* buttons */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col w-full gap-3"
        >
          {/* primary — gold */}
          <Link href="/sign-up" className="w-full">
            <button className="w-full h-[52px] flex items-center justify-center gap-3 rounded-lg font-bold text-[13px] tracking-[0.15em] uppercase text-black transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #E8C84A 0%, #C9A030 40%, #A07820 70%, #C9A030 100%)",
                boxShadow: "0 4px 32px -6px rgba(201,160,48,0.55), inset 0 1px 0 rgba(255,255,255,0.18)",
              }}
            >
              <UserPlus className="w-[18px] h-[18px]" strokeWidth={2} />
              Criar Conta
            </button>
          </Link>

          {/* secondary — dark outlined */}
          <Link href="/sign-in" className="w-full">
            <button className="w-full h-[52px] flex items-center justify-center gap-3 rounded-lg font-bold text-[13px] tracking-[0.15em] uppercase text-white/80 transition-all duration-200 hover:bg-white/[0.06] hover:text-white active:scale-[0.98]"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1.5px solid rgba(255,255,255,0.13)",
              }}
            >
              <LogIn className="w-[18px] h-[18px]" strokeWidth={2} />
              Fazer Login
            </button>
          </Link>
        </motion.div>

        {/* footer */}
        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="text-[11px] text-white/25 tracking-wide pt-2"
        >
          &copy; {new Date().getFullYear()} IAttom Assist. Todos os direitos reservados.
        </motion.p>

      </motion.div>
    </div>
  );
}
