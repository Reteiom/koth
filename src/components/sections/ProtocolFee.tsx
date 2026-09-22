import {
  feePct,
  LAUNCHPAD_FEE_SHARE_PCT,
  PLATFORM_FEE_BPS,
  PLATFORM_FEE_SHARE_PCT,
  TRADING_FEE_BPS,
  VAULT_ADDRESS,
} from "@/lib/config";
import { CopyAddress } from "@/components/ui/CopyAddress";
import { Icon } from "@/components/ui/Icon";

export function ProtocolFee() {
  return (
    <div className="fee card card-pad">
      <div className="fee-figure">
        <span className="fee-value num">
          {feePct(TRADING_FEE_BPS)}
          <span>%</span>
        </span>
        <span className="fee-caption">Trading fee</span>
      </div>
      <div className="fee-body">
        <h3>One transparent fee. It feeds the throne.</h3>
        <p>
          Every trade on a token launched here pays {feePct(TRADING_FEE_BPS)}%.{" "}
          {PLATFORM_FEE_SHARE_PCT}% of it — {feePct(PLATFORM_FEE_BPS)}% of volume — goes to the
          public vault below and funds the round reward: the buyback and burn of the winning token.
          The remaining {LAUNCHPAD_FEE_SHARE_PCT}% goes to the underlying launchpad protocol.
        </p>
        <div className="fee-vault">
          <span className="fee-vault-label">
            <Icon name="vault" /> Fee vault
          </span>
          <CopyAddress address={VAULT_ADDRESS} label="vault address" />
        </div>
      </div>
    </div>
  );
}
