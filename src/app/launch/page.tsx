import type { Metadata } from "next";
import { LaunchForm } from "@/components/launch/LaunchForm";

export const metadata: Metadata = {
  title: "Launch a Token",
  description: "Launch a token and enter the King of the Hill arena.",
};

export default function LaunchPage() {
  return (
    <div className="container">
      <header className="page-head">
        <span className="eyebrow">Launch</span>
        <h1>
          Enter the <span className="serif accent">arena.</span>
        </h1>
        <p className="lead">
          Launch your token and start climbing. Market cap decides who holds the throne.
        </p>
      </header>
      <LaunchForm />
    </div>
  );
}
