import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TokenView } from "@/components/arena/TokenView";
import { Icon } from "@/components/ui/Icon";
import { isAddress, shortAddress } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/tokens/[address]">): Promise<Metadata> {
  const { address } = await params;
  return { title: `Token ${shortAddress(address)}` };
}

export default async function TokenPage({ params }: PageProps<"/tokens/[address]">) {
  const { address } = await params;
  if (!isAddress(address)) notFound();

  return (
    <div className="container">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/tokens" className="link">
          <Icon name="arrowRight" style={{ transform: "rotate(180deg)" }} /> All tokens
        </Link>
      </nav>
      <TokenView address={address} />
    </div>
  );
}
