;

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

import { CgDarkMode } from "react-icons/cg";
export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <Button
      onClick={handleToggle}
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      className="header-mode-toggle"
    >
      <CgDarkMode
        className="header-mode-toggle-icon"
      />
    </Button>
  );
}
