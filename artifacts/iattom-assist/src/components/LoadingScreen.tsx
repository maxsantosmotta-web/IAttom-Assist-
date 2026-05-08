import { motion } from "framer-motion";
import logoTransparent from "/logo-splash-transparent.png";

export function LoadingScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#080808]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      <div className="flex flex-col items-center gap-8">

        {/* Logo sem fundo */}
        <motion.img
          src={logoTransparent}
          alt="IAttom Assist"
          width={220}
          height={220}
          className="object-contain"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
        />

        {/* Ondulação dourada */}
        <div className="relative w-48 flex items-center justify-center" style={{ height: 18 }}>
          {[0, 1, 2, 3].map((i) => (
            <motion.span
              key={i}
              className="absolute rounded-full"
              style={{
                width: 48 + i * 32,
                height: 6 + i * 2,
                border: `1px solid rgba(201,168,76,${0.35 - i * 0.07})`,
                borderRadius: "50%",
                top: "50%",
                left: "50%",
                x: "-50%",
                y: "-50%",
              }}
              initial={{ scaleX: 0.6, opacity: 0 }}
              animate={{ scaleX: [0.6, 1.05, 0.95, 1], opacity: [0, 0.8, 0.5, 0] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                delay: i * 0.38,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* 3 pontos dourados pulsantes */}
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary"
              animate={{ opacity: [0.25, 1, 0.25], scale: [0.8, 1.15, 0.8] }}
              transition={{
                duration: 1.1,
                repeat: Infinity,
                delay: i * 0.22,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>

      </div>
    </motion.div>
  );
}
