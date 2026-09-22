import { PROTOCOL_FEE_BPS, VAULT_ADDRESS } from "@/lib/config";
import { CopyAddress } from "@/components/ui/CopyAddress";
import { Icon } from "@/components/ui/Icon";

export function ProtocolFee() {
  const pct = PROTOCOL_FEE_BPS / 100;
  return (
    <div className="fee card card-pad">
      <div className="fee-figure">
        <span className="fee-value num">
          {pct}
          <span>%</span>
        </span>
        <span className="fee-caption">Protocol fee</span>
      </div>
      <div className="fee-body">
        <h3>One transparent fee. It feeds the throne.</h3>
        <p>
          The {pct}% protocol fee is part of the platform economics. Fees are collected in a public
          vault and power the round reward — the buyback and burn of the winning token.
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
