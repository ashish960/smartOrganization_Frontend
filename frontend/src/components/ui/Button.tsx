import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    // Base styles (always applied)
    const baseStyles =
      "font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    // Variant styles (colors)
    const variantStyles = {
      primary:
         "text-white font-semibold transition-all duration-200",
      secondary:
        "bg-secondary-600 hover:bg-secondary-700 text-white dark:bg-secondary-500 dark:hover:bg-secondary-600",
      outline:
        "border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:border-primary-500 dark:text-primary-400 dark:hover:bg-primary-950",
      danger:
        "bg-error-600 hover:bg-error-700 text-white dark:bg-error-500 dark:hover:bg-error-600",
    };

    // Size styles (responsive)
    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm lg:px-5 lg:py-2.5",
      md: "px-4 py-2 text-sm md:px-6 md:py-2.5 md:text-base lg:px-8 lg:py-3",
      lg: "px-6 py-3 text-base md:px-8 md:py-3.5 md:text-lg lg:px-10 lg:py-4",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        style={
    variant === "primary"
      ? {
          background: "linear-gradient(135deg, #3b82f6, #a855f7)",
          boxShadow: "0 4px 15px rgba(59, 130, 246, 0.4)",
        }
      : {}
  }
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;