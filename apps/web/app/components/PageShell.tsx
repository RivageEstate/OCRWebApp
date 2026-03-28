import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageShellProps = {
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg";
};

const maxWidthClass = {
  sm: "max-w-lg",
  md: "max-w-2xl",
  lg: "max-w-4xl",
} as const;

export function PageShell({ children, maxWidth = "md" }: PageShellProps) {
  return (
    <main className="min-h-screen bg-background">
      <div className={cn("mx-auto py-10 px-4", maxWidthClass[maxWidth])}>
        {children}
      </div>
    </main>
  );
}
