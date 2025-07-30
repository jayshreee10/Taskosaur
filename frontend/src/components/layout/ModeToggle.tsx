"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="border-none">
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-[var(--accent)]/50 transition-colors rounded-lg flex items-center justify-center">
          {isDark ? (
            <Moon className="h-5 w-5 transition-transform duration-200" />
          ) : (
            <Sun className="h-5 w-5 transition-transform duration-200" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48 p-2 bg-[var(--background)] border-[var(--border)] shadow-lg backdrop-blur-sm" align="end" sideOffset={8}>
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-[var(--accent)]/50 transition-all duration-200"
        >
          <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
            <Sun className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="text-left flex-1">
            <div className="text-sm font-medium text-[var(--foreground)]">Light</div>
            <div className="text-xs text-[var(--muted-foreground)]">Bright and clean interface</div>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-[var(--accent)]/50 transition-all duration-200"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
            <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </div>
          <div className="text-left flex-1">
            <div className="text-sm font-medium text-[var(--foreground)]">Dark</div>
            <div className="text-xs text-[var(--muted-foreground)]">Easy on the eyes</div>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => setTheme("system")}
          className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-[var(--accent)]/50 transition-all duration-200"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-left flex-1">
            <div className="text-sm font-medium text-[var(--foreground)]">System</div>
            <div className="text-xs text-[var(--muted-foreground)]">Follows system preference</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
