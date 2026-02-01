import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <main 
      className={cn(
        "min-h-screen pb-24 pt-16 px-4",
        "max-w-2xl mx-auto",
        className
      )}
    >
      {children}
    </main>
  );
}
