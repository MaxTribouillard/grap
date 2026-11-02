"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function AppProviders({ children }: { children: ReactNode }) {
  if (!convex) {
    return (
      <main className="mx-auto flex min-h-full max-w-xl flex-col justify-center px-6 py-16">
        <p className="font-display text-4xl text-gain">Grap</p>
        <p className="mt-4 text-lg leading-7 text-muted">
          Le backend n&apos;est pas relié. Lance{" "}
          <code className="text-foreground">npx convex dev</code> dans ce
          dossier, puis relance <code className="text-foreground">npm run dev</code>.
        </p>
      </main>
    );
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
