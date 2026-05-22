import React from "react";

interface ErrorMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
  icon?: boolean;
}

const ErrorMessage = React.forwardRef<HTMLParagraphElement, ErrorMessageProps>(
  (
    {
      children,
      icon = true,
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <p
        ref={ref}
        className={`text-error-600 dark:text-error-500 text-xs md:text-sm mt-1 flex items-center gap-1 ${className}`}
        {...props}
      >
        {icon && (
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18.101 12.93a1 1 0 00-1.414-1.414L10 15.586l-6.687-6.687a1 1 0 00-1.414 1.414l8.1 8.1a1 1 0 001.414 0l8.1-8.1z"
              clipRule="evenodd"
            />
          </svg>
        )}
        {children}
      </p>
    );
  }
);

ErrorMessage.displayName = "ErrorMessage";

export default ErrorMessage;