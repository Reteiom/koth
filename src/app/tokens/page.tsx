import type { Metadata } from "next";
import { TokenGrid } from "@/components/arena/TokenGrid";

export const metadata: Metadata = {
  title: "Tokens",
  description: "Every token competing for the throne.",
};

export default function TokensPage() {
  return (
    <div className="container">
      <header className="page-head">
        <span className="eyebrow">Tokens</span>
        <h1>
          The <span className="serif accent">contenders.</span>
        </h1>
        <p className="lead">Every token in the arena. Open one to see its fight for the throne.</p>
      </header>
      <TokenGrid />
    </div>
  );
}
