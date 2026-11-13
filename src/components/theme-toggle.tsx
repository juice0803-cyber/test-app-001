"use client";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "./ui/button";
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return <Button variant="ghost" size="icon" aria-label="切換深色或淺色模式" title="切換顯示模式" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}><Sun className="theme-sun" size={19} /><Moon className="theme-moon" size={19} /></Button>;
}
