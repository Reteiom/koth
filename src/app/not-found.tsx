import Link from "next/link";
import { EmptyState } from "@/components/ui/States";

export default function NotFound() {
  return (
    <div className="container page-state">
      <div className="card">
        <EmptyState
          icon="mountain"
          title="Page not found"
          action={
            <Link href="/" className="btn btn-primary btn-sm">
              Back to the arena
            </Link>
          }
        >
          This page does not exist — or the address is not a valid token contract.
        </EmptyState>
      </div>
    </div>
  );
}
