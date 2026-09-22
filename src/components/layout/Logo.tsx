import Image from "next/image";
import logo from "@/assets/peak-logo.png";
import { SITE } from "@/lib/config";

/** Peak wordmark (mountain line over PEAK with a lime A). */
export function Logo({ height = 40 }: { height?: number }) {
  return (
    <Image
      src={logo}
      alt={SITE.name}
      height={height}
      width={Math.round((height * logo.width) / logo.height)}
      priority
      className="logo"
    />
  );
}
