"use client"

import * as React from "react"
import { Menu } from "@base-ui/react/menu"
import { cn } from "@/lib/utils"

function DropdownMenu({ ...props }: Menu.Root.Props) {
  return <Menu.Root {...props} />
}

function DropdownMenuTrigger({ className, ...props }: Menu.Trigger.Props) {
  return (
    <Menu.Trigger
      data-slot="dropdown-menu-trigger"
      className={cn("outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
      {...props}
    />
  )
}

function DropdownMenuContent({ className, sideOffset = 8, align = "start", side = "bottom", ...props }: Menu.Popup.Props & { align?: any, side?: any, sideOffset?: number }) {
  return (
    <Menu.Portal>
      <Menu.Positioner sideOffset={sideOffset} align={align} side={side}>
        <Menu.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            "z-50 min-w-[12rem] overflow-hidden rounded-2xl border border-black/5 bg-white p-1 text-popover-foreground shadow-2xl transition-all duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            className
          )}
          {...props}
        />
      </Menu.Positioner>
    </Menu.Portal>
  )
}

function DropdownMenuItem({ className, ...props }: Menu.Item.Props) {
  return (
    <Menu.Item
      data-slot="dropdown-menu-item"
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-xl px-3 py-2 text-sm font-medium outline-none transition-colors hover:bg-black/5 focus:bg-black/5 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dropdown-menu-label"
      className={cn("px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-black/30", className)}
      {...props}
    />
  )
}

function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-black/5", className)}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
}
