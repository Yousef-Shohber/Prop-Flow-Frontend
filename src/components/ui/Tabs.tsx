import * as RT from "@radix-ui/react-tabs";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Tabs = RT.Root;
export function TabList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <RT.List className={cn("mb-5 flex gap-1 border-b border-line", className)}>
      {children}
    </RT.List>
  );
}
export function TabTrigger({
  value,
  children,
}: {
  value: string;
  children: ReactNode;
}) {
  return (
    <RT.Trigger
      value={value}
      className="relative -mb-px px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-ink data-[state=active]:text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:scale-x-0 after:rounded-full after:bg-accent after:transition-transform data-[state=active]:after:scale-x-100"
    >
      {children}
    </RT.Trigger>
  );
}
export const TabContent = RT.Content;
