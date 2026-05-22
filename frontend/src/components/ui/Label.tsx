import React from "react";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  required?: boolean;
  size?: "sm" | "md" | "lg";
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  (
    {
      children,
      required = false,
      size = "md",
      className = "",
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles =
      "font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer transition-colors duration-200";

    // Size styles
    const sizeStyles = {
      sm: "text-xs md:text-sm",
      md: "text-sm md:text-base",
      lg: "text-base md:text-lg",
    };

    return (
      <label
        ref={ref}
        className={`${baseStyles} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        <span className="flex items-center gap-1">
          {children}
          {required && (
            <span className="text-error-600 dark:text-error-500" title="Required field">
              *
            </span>
          )}
        </span>
      </label>
    );
  }
);

Label.displayName = "Label";

export default Label;