"use client";

import { useEffect } from "react";

export function AdminTheme({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.getAttribute("data-theme");
    root.setAttribute("data-theme", "cleardesk");
    return () => root.setAttribute("data-theme", prev ?? "paperpay");
  }, []);

  return <div className="min-h-screen">{children}</div>;
}
