import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = "default",
      padding = "md",
      className = "",
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles =
      "rounded-lg transition-all duration-200 dark:bg-dark-surface";

    // Variant styles (different card appearances)
    const variantStyles = {
      default:
        "bg-light-bg dark:bg-dark-surface border border-light-border dark:border-dark-border",
      elevated:
        "bg-light-surface dark:bg-dark-surface shadow-md dark:shadow-lg hover:shadow-lg dark:hover:shadow-xl",
      outlined:
        "bg-light-bg dark:bg-dark-bg border-2 border-primary-200 dark:border-primary-900",
    };

    // Padding styles
    const paddingStyles = {
      none: "p-0",
      sm: "p-3 md:p-4",
      md: "p-4 md:p-6",
      lg: "p-6 md:p-8",
    };

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";


// Card Header
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`border-b border-light-border dark:border-dark-border pb-4 mb-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);

CardHeader.displayName = "CardHeader";

// Card Body
interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
  ({ children, className = "", ...props }, ref) => (
    <div ref={ref} className={`${className}`} {...props}>
      {children}
    </div>
  )
);

CardBody.displayName = "CardBody";

// Card Footer
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`border-t border-light-border dark:border-dark-border pt-4 mt-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);

CardFooter.displayName = "CardFooter";

// Export all
export { Card, CardHeader, CardBody, CardFooter };
export default Card;



