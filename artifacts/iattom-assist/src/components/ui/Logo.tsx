interface LogoMarkProps {
  size?: number;
  className?: string;
}

export function LogoMark({ size = 36, className }: LogoMarkProps) {
  return (
    <img
      src="/logo-nobg.png"
      alt="IAttom Assist"
      width={size}
      height={size}
      className={`object-contain shrink-0 ${className ?? ""}`}
      draggable={false}
    />
  );
}

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

export function Logo({ size = 32, showWordmark = true, className }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <LogoMark size={size} />
      {showWordmark && (
        <div className="flex items-baseline gap-0.5">
          <span
            className="font-bold tracking-tight text-white leading-none"
            style={{ fontSize: size * 0.53 }}
          >
            IAttom
          </span>
          <span
            className="font-medium tracking-tight text-primary leading-none"
            style={{ fontSize: size * 0.44 }}
          >
            Assist
          </span>
        </div>
      )}
    </div>
  );
}
