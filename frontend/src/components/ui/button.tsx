"use client";

import { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Loader2 } from "@/components/ui/icons";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  asChild?: boolean;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  outline: "btn-outline",
  ghost: "btn-ghost",
  danger: "btn-error",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      asChild = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const buttonClasses = cn(
      "btn",
      variantStyles[variant],
      sizeStyles[size],
      isLoading && "loading",
      className
    );

    const content = (
      <>
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : leftIcon}
        {children}
        {rightIcon}
      </>
    );

    // If asChild is true, we expect children to be a Link or anchor
    if (asChild) {
      // Clone the child element and pass our classes
      const child = children as React.ReactElement;
      if (child && typeof child === "object" && "props" in child) {
        return <span className={buttonClasses}>{child}</span>;
      }
    }

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || isLoading}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = "Button";

// LinkButton for navigation actions
interface LinkButtonProps {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn("btn", variantStyles[variant], sizeStyles[size], className)}
    >
      {children}
    </Link>
  );
}
