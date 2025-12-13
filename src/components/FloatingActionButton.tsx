
import { ReactNode } from "react";

interface FloatingActionButtonProps {
  children: ReactNode;
}

export function FloatingActionButton({ children }: FloatingActionButtonProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {children}
    </div>
  );
}
