import { Link } from "wouter";
import { UserPlus, LogIn } from "lucide-react";
import { motion } from "framer-motion";

function IAttomBadge({ size = 240 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="ig_ring" x1="0" y1="0" x2="240" y2="240" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#F8E272"/>
          <stop offset="22%"  stopColor="#C49820"/>
          <stop offset="48%"  stopColor="#EDD050"/>
          <stop offset="73%"  stopColor="#7A5408"/>
          <stop offset="100%" stopColor="#F8E272"/>
        </linearGradient>
        <linearGradient id="ig_a" x1="120" y1="46" x2="120" y2="168" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#F8DF60"/>
          <stop offset="42%"  stopColor="#D4A828"/>
          <stop offset="100%" stopColor="#7A5008"/>
        </linearGradient>
        <linearGradient id="ig_bars" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#EFD048"/>
          <stop offset="100%" stopColor="#9A7015"/>
        </linearGradient>
        <linearGradient id="ig_label" x1="0" y1="174" x2="0" y2="196" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#F5DC60"/>
          <stop offset="100%" stopColor="#C49820"/>
        </linearGradient>
        <radialGradient id="ig_bg" cx="50%" cy="42%" r="62%">
          <stop offset="0%"   stopColor="#1e1608"/>
          <stop offset="100%" stopColor="#07050202"/>
        </radialGradient>
      </defs>

      {/* subtle outer glow ring */}
      <circle cx="120" cy="120" r="119" fill="none" stroke="#C49820" strokeWidth="1.5" opacity="0.28"/>
      {/* main gold ring */}
      <circle cx="120" cy="120" r="116" fill="none" stroke="url(#ig_ring)" strokeWidth="4.5"/>
      {/* inner accent ring */}
      <circle cx="120" cy="120" r="110" fill="none" stroke="url(#ig_ring)" strokeWidth="1.5" opacity="0.55"/>
      {/* dark background fill */}
      <circle cx="120" cy="120" r="109" fill="url(#ig_bg)"/>

      {/* ── "A" lettermark with counter cutout (evenodd) ── */}
      <path
        d="M120,46 L186,166 L165,166 L154,134 L86,134 L75,166 L54,166 Z
           M120,64 L151,122 L89,122 Z"
        fill="url(#ig_a)"
        fillRule="evenodd"
      />

      {/* ── Bar chart + arrow growth icon ── */}
      <rect x="148" y="118" width="8" height="17" rx="1.5" fill="url(#ig_bars)"/>
      <rect x="158" y="106" width="8" height="29" rx="1.5" fill="url(#ig_bars)"/>
      <rect x="168" y="92"  width="8" height="43" rx="1.5" fill="url(#ig_bars)"/>
      {/* arrow line */}
      <polyline
        points="149,116 159,102 169,88 177,78"
        stroke="#F5DC60"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* arrow head */}
      <polygon points="177,78 170,82 174,88" fill="#F5DC60"/>

      {/* ── IATTOM wordmark ── */}
      <text
        x="120" y="184"
        textAnchor="middle"
        fontSize="23"
        fontWeight="900"
        fontFamily="'Arial Black', Impact, Arial, sans-serif"
        fill="url(#ig_label)"
        letterSpacing="3"
      >IATTOM</text>

      {/* ── — ASSIST — tagline ── */}
      <text
        x="120" y="199"
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        fontFamily="Arial, sans-serif"
        fill="#C49820"
        letterSpacing="4"
      >— ASSIST —</text>
    </svg>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0  },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13 } },
};

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center selection:bg-yellow-900/30 selection:text-white px-6 py-10 overflow-hidden">

      {/* ambient gold glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_55%_42%_at_50%_38%,_rgba(180,130,20,0.13)_0%,_transparent_72%)] pointer-events-none"/>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center text-center w-full max-w-[340px] sm:max-w-[390px] gap-8 sm:gap-9"
      >

        {/* logo badge */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="drop-shadow-[0_0_48px_rgba(196,152,32,0.42)]"
        >
          <IAttomBadge size={220} />
        </motion.div>

        {/* slogan */}
        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="text-[16px] sm:text-[17px] text-white/88 font-normal leading-snug tracking-wide px-1"
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
            <button
              className="w-full h-[52px] flex items-center justify-center gap-3 rounded-lg font-bold text-[12px] tracking-[0.18em] uppercase text-black transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #E8C84A 0%, #C9A030 38%, #A07820 68%, #C9A030 100%)",
                boxShadow: "0 4px 28px -6px rgba(201,160,48,0.6), inset 0 1px 0 rgba(255,255,255,0.18)",
              }}
            >
              <UserPlus className="w-[17px] h-[17px]" strokeWidth={2.2}/>
              Criar Conta
            </button>
          </Link>

          {/* secondary — outlined */}
          <Link href="/sign-in" className="w-full">
            <button
              className="w-full h-[52px] flex items-center justify-center gap-3 rounded-lg font-bold text-[12px] tracking-[0.18em] uppercase text-white/75 transition-all duration-200 hover:bg-white/[0.06] hover:text-white active:scale-[0.98]"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1.5px solid rgba(255,255,255,0.12)",
              }}
            >
              <LogIn className="w-[17px] h-[17px]" strokeWidth={2.2}/>
              Fazer Login
            </button>
          </Link>
        </motion.div>

        {/* footer */}
        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="text-[11px] text-white/22 tracking-wide pt-1"
        >
          &copy; {new Date().getFullYear()} IAttom Assist. Todos os direitos reservados.
        </motion.p>

      </motion.div>
    </div>
  );
}
