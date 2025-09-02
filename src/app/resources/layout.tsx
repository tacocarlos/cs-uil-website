import type { ReactNode } from "react";

export default function ResourcesLayout({ children }: { children: ReactNode }) {
  return <main className="bg-primary min-h-screen">{children}</main>;
}
