import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Button as ButtonPrimitive } from "@base-ui/react/button";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-ui border border-transparent text-sm font-medium whitespace-nowrap transition-colors duration-100 outline-none select-none hover:cursor-pointer focus-visible:outline-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default:
          "h-[var(--ui-control-height)] px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        sm: "h-8 px-2.5 text-xs",
        icon: "size-[var(--ui-icon-size)] p-0",
      },
      variant: {
        default: "bg-accent text-accent-ink hover:bg-accent-hover",
        destructive: "bg-accent text-accent-ink hover:bg-accent-hover",
        error: "border-border-strong text-accent hover:bg-surface-hover",
        ghost: "text-text-secondary hover:bg-surface-hover hover:text-text-primary",
        link: "h-auto border-0 bg-transparent p-0 text-accent underline-offset-4 hover:text-accent-hover hover:underline",
        outline: "border-border-strong text-text-primary hover:bg-surface-hover",
        secondary: "border-border-strong bg-surface-panel text-text-primary hover:bg-surface-hover",
        success: "bg-success text-success-ink hover:bg-success/90",
      },
    },
  },
);

const Button = ({
  className,
  variant = "default",
  size = "default",
  type = "button",
  disabled,
  children,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) => (
  <ButtonPrimitive
    data-slot="button"
    type={type}
    className={cn(buttonVariants({ size, variant }), className)}
    disabled={disabled}
    {...props}
  >
    {children}
  </ButtonPrimitive>
);

export default Button;
