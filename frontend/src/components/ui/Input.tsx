import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  inputSize?: "sm" | "md" | "lg";
}



const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      inputSize = "md",
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles =
  "w-full font-medium rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed"
  + " bg-white/10 border-white/20 text-white placeholder-white/40 focus:ring-blue-500 focus:border-blue-500";

    // Size styles
    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm",
      md: "px-4 py-2 text-sm md:px-6 md:py-2.5 md:text-base",
      lg: "px-6 py-3 text-base md:px-8 md:py-3.5 md:text-lg",
    };

    // Border color based on error state
    const borderStyles = error
      ? "border-error-500 dark:border-error-600"
      : "border-neutral-300 dark:border-neutral-600";

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
            {label}
            {props.required && <span className="text-error-600 ml-1">*</span>}
          </label>
        )}

        {/* Input */}
        <input
          ref={ref}
          disabled={disabled}
          className={`${baseStyles} ${sizeStyles[inputSize]} ${borderStyles} ${className}`}
          {...props}
        />

        {/* Error Message */}
        {error && (
          <p className="text-error-600 dark:text-error-500 text-xs md:text-sm mt-1">
            {error}
          </p>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <p className="text-neutral-600 dark:text-neutral-400 text-xs md:text-sm mt-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;