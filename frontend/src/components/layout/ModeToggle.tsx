"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FaSun, FaMoon, FaDesktop } from "react-icons/fa";

export function ModeToggle() {
  const { theme: currentTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const themeOptions = [
    {
      id: "light",
      label: "Light",
      icon: FaSun,
      iconActiveColor: "text-[var(--yellow-600)]",
      iconInactiveColor: "text-[var(--muted-foreground)]",
      bgColor: "bg-[var(--yellow-100)]"
    },
    {
      id: "dark",
      label: "Dark",
      icon: FaMoon,
      iconActiveColor: "text-[var(--slate-300)]",
      iconInactiveColor: "text-[var(--muted-foreground)]",
      bgColor: "bg-[var(--slate-100)]"
    },
    {
      id: "system",
      label: "System",
      icon: FaDesktop,
      iconActiveColor: "text-[var(--blue-500)]",
      iconInactiveColor: "text-[var(--muted-foreground)]",
      bgColor: "bg-[var(--blue-100)]"
    },
  ];

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="border-none hover:bg-[var(--accent)]/50 cursor-pointer focus:outline-none focus-ring-none">
        <FaSun className="h-[1.2rem] w-[1.2rem] text-[var(--muted-foreground)]" />
        
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-[var(--accent)]/50 cursor-pointer transition-colors rounded-lg focus:outline-none focus-ring-none"
        >
          {currentTheme === "dark" ? (
            <FaMoon className="h-[1.2rem] w-[1.2rem] text-[var(--blue-500)]" />
          ) : (
            <FaSun className="h-[1.2rem] w-[1.2rem] text-[var(--yellow-600)]" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="absolute top-1 -left-16 p-2 bg-[var(--popover)] shadow-lg backdrop-blur-sm border-none"
        align="end"
        sideOffset={8}
      >
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const isActive = currentTheme === option.id;
          
          return (
            <DropdownMenuItem
              key={option.id}
              onClick={() => setTheme(option.id)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer
                hover:bg-[var(--accent)]/70 focus:bg-[var(--accent)]/70
                ${isActive ? "bg-[var(--accent)]/20" : ""}
                transition-colors`}
            >
              <div
                className={`w-8 h-8 rounded-md flex items-center justify-center ${option.bgColor} ${
                  isActive ? option.iconActiveColor : option.iconInactiveColor
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {option.label}
                </span>
              </div>
              {isActive && (
                <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}