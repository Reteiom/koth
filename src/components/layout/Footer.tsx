import Link from "next/link";
import { feePct, NETWORK_NAME, TRADING_FEE_BPS, VAULT_ADDRESS } from "@/lib/config";
import { CopyAddress } from "@/components/ui/CopyAddress";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Logo height={46} />
            <p>Competition creates attention. Attention creates volume. Volume fuels the throne.</p>
          </div>
          <div className="footer-cols">
            <div>
              <h4>Arena</h4>
              <Link href="/leaderboard">Leaderboard</Link>
              <Link href="/tokens">Tokens</Link>
              <Link href="/history">Throne History</Link>
            </div>
            <div>
              <h4>Platform</h4>
              <Link href="/launch">Launch a Token</Link>
              <Link href="/how-it-works">How It Works</Link>
              <Link href="/how-it-works#fees">Fees</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            {NETWORK_NAME} · Trading fee {feePct(TRADING_FEE_BPS)}%
          </span>
          <span className="footer-vault">
            Fee vault <CopyAddress address={VAULT_ADDRESS} label="vault address" />
          </span>
        </div>
        <p className="footer-note">
          Tokens launched on this platform are highly volatile. Nothing here is financial advice.
        </p>
      </div>
    </footer>
  );
}
