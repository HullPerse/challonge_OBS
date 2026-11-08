import { Field, Input as BaseInput } from "@base-ui/react";
import { cva } from "class-variance-authority";
import { cn } from "cn";
import type { ComponentProps } from "react";

const inputVariants = cva(
  [
    "flex w-full min-w-0 rounded-ui border border-border-strong",
    "bg-surface-sunken px-3 text-sm text-text-primary",
    "placeholder:text-text-muted",
    "outline-none transition-colors duration-100",
    "hover:border-surface-hover",
    "focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-accent",
    "disabled:pointer-events-none disabled:opacity-45",
    "aria-invalid:border-accent",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "h-8 px-2.5 text-xs",
        md: "h-10",
        lg: "h-11 px-4",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

function Input({
  className,
  wrapperClassName,
  size,
  label,
  description,
  error,
  id,
  ...props
}: Omit<ComponentProps<typeof BaseInput>, "size"> & {
  size?: "sm" | "md" | "lg";
  label?: string;
  description?: string;
  error?: string;
  wrapperClassName?: string;
}) {
  return (
    <Field.Root className={cn("flex w-full flex-col gap-1.5", wrapperClassName)} invalid={!!error}>
      {label && (
        <Field.Label className="text-xs font-medium text-text-secondary" htmlFor={id}>
          {label}
        </Field.Label>
      )}

      <BaseInput {...props} id={id} className={cn(inputVariants({ size }), className)} />

      {error ? (
        <Field.Error className="text-xs text-accent">{error}</Field.Error>
      ) : description ? (
        <Field.Description className="text-xs text-text-muted">{description}</Field.Description>
      ) : null}
    </Field.Root>
  );
}

export { Input, inputVariants };
