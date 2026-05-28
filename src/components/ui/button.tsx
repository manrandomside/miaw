import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-none border-[3px] border-black bg-clip-padding text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-75 outline-none select-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 dark:border-white dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]",
  {
    variants: {
      variant: {
        default: "bg-[#ffde43] text-black hover:bg-[#ffe566] dark:bg-white dark:text-black dark:hover:bg-[#f4f4f0]",
        outline: "bg-background text-foreground hover:bg-muted dark:bg-black dark:text-white dark:hover:bg-[#111]",
        secondary: "bg-[#3b82f6] text-white hover:bg-[#60a5fa]",
        ghost: "border-transparent bg-transparent shadow-none hover:bg-muted hover:border-black active:border-black active:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none dark:hover:bg-muted/50",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "border-transparent bg-transparent shadow-none active:translate-x-0 active:translate-y-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-6 py-2",
        xs: "h-7 px-3 text-xs",
        sm: "h-8 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
