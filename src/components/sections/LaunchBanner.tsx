import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export function LaunchBanner() {
  return (
    <div className="banner card">
      <div className="banner-glow" aria-hidden="true" />
      <div className="banner-copy">
        <span className="eyebrow">Your move</span>
        <h2 className="h2">
          There is always a fight <br className="hero-br" />
          for the <span className="serif accent">throne.</span>
        </h2>
        <p className="lead">Launch a token and enter the arena. A new round starts every hour.</p>
      </div>
      <div className="banner-actions">
        <Link href="/launch" className="btn btn-primary btn-lg">
          Launch a Token <Icon name="arrowRight" className="arrow" />
        </Link>
        <Link href="/how-it-works" className="btn btn-ghost btn-lg">
          How it works
        </Link>
      </div>
    </div>
  );
}
