"use client";

import Icon from "@/components/ui/Icon";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
  return (
    <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${nextTheme} mode`} title={`Switch to ${nextTheme} mode`}>
      <Icon name={resolvedTheme === "dark" ? "sun" : "moon"} size={17} />
      <span className="theme-toggle-label">{resolvedTheme === "dark" ? "Light" : "Dark"}</span>
    </button>
  );
}
