/* eslint-disable @next/next/no-img-element -- token images come from arbitrary hosts */

/** Token logo, or a deterministic generated mark when no image is available. */
function hue(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

export function TokenAvatar({
  symbol,
  address,
  logoUrl,
  size = 36,
}: {
  symbol: string;
  address: string;
  logoUrl: string | null;
  size?: number;
}) {
  const h = hue(address);
  // Keep generated marks within the moss/lime family so the page stays calm.
  const a = 45 + (h % 110);
  const b = a + 30 + ((h >> 5) % 50);
  const style = {
    width: size,
    height: size,
    fontSize: Math.round(size * 0.36),
    background: logoUrl
      ? "var(--surface-solid)"
      : `linear-gradient(145deg, hsl(${a} 78% 72%), hsl(${b} 42% 34%))`,
  };
  return (
    <span className="avatar" style={style}>
      {logoUrl ? (
        <img src={logoUrl} alt="" width={size} height={size} loading="lazy" />
      ) : (
        <span aria-hidden="true">{symbol.slice(0, 2)}</span>
      )}
    </span>
  );
}
