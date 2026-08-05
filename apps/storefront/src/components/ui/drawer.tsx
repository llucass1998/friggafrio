import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { XMarkMini } from "@medusajs/icons"
import { clsx } from "clsx"

// Componente acessível e robusto de Drawer animado manualmente (CSS + state).
const Drawer = DialogPrimitive.Root
const DrawerTrigger = DialogPrimitive.Trigger
const DrawerClose = DialogPrimitive.Close
const DrawerPortal = DialogPrimitive.Portal

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    className={clsx(
      "fixed inset-0 z-50 bg-[#051428]/45 backdrop-blur-[2px]",
      "data-[state=open]:opacity-100 data-[state=closed]:opacity-0",
      "data-[state=open]:transition-opacity data-[state=closed]:transition-opacity",
      "data-[state=open]:duration-[280ms] data-[state=closed]:duration-[240ms]",
      "data-[state=open]:ease-[var(--motion-ease-enter)] data-[state=closed]:ease-[var(--motion-ease-exit)]",
      className
    )}
    {...props}
    ref={ref}
  />
))
DrawerOverlay.displayName = DialogPrimitive.Overlay.displayName

const drawerVariants = cva(
  "fixed z-50 bg-white shadow-xl transition-transform",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b border-zinc-200 data-[state=closed]:-translate-y-full data-[state=open]:translate-y-0",
        bottom: "inset-x-0 bottom-0 border-t border-zinc-200 data-[state=closed]:translate-y-full data-[state=open]:translate-y-0",
        left: "inset-y-0 left-0 h-full w-3/4 border-r border-zinc-200 data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0 sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-full border-l border-zinc-200 data-[state=closed]:translate-x-full data-[state=open]:translate-x-0 sm:max-w-[420px]",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

interface DrawerContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof drawerVariants> {
  hideClose?: boolean
}

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(({ side = "right", className, children, hideClose, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={clsx(
        drawerVariants({ side }),
        "group",
        // Animação CSS direta baseada em data-state sem depender de plugins animate-in
        "data-[state=open]:duration-[420ms] data-[state=closed]:duration-[320ms]",
        "data-[state=open]:ease-[var(--motion-ease-enter)] data-[state=closed]:ease-[var(--motion-ease-exit)]",
        className
      )}
      {...props}
    >
      {!hideClose && (
        <DialogPrimitive.Close className="absolute right-4 top-4 text-zinc-600 hover:text-zinc-500 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] motion-interactive disabled:pointer-events-none">
          <XMarkMini className="h-5 w-5" />
          <span className="sr-only">Fechar carrinho</span>
        </DialogPrimitive.Close>
      )}
      {/* O conteúdo interno perde opacidade discretamente antes de sair e entra com delay suave */}
      <div className="flex flex-col h-full opacity-100 group-data-[state=closed]:opacity-0 transition-opacity duration-[320ms]">
        {children}
      </div>
    </DialogPrimitive.Content>
  </DrawerPortal>
))
DrawerContent.displayName = DialogPrimitive.Content.displayName

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={clsx(
      "flex items-center justify-between h-16 px-6 border-b border-zinc-200",
      className
    )}
    {...props}
  />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={clsx("p-6 border-t border-zinc-200", className)}
    {...props}
  />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={clsx("text-lg text-zinc-900", className)}
    {...props}
  />
))
DrawerTitle.displayName = DialogPrimitive.Title.displayName

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={clsx("text-sm text-zinc-600", className)}
    {...props}
  />
))
DrawerDescription.displayName = DialogPrimitive.Description.displayName

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
