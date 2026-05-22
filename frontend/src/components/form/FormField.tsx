import React from "react";
import Label from "../ui/Label";
import Input from "../ui/Input";
import ErrorMessage from "../ui/ErrorMessage";

interface FormFieldProps {
  label?: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  inputSize?: "sm" | "md" | "lg";
  disabled?: boolean;
  autoComplete?: string;
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      name,
      type = "text",
      placeholder,
      value,
      onChange,
      error,
      helperText,
      required = false,
      inputSize = "md",
      disabled = false,
      autoComplete,
    },
    ref
  ) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <Label htmlFor={name} required={required}>
            {label}
          </Label>
        )}

        <Input
          ref={ref}
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          inputSize={inputSize}
          disabled={disabled}
          autoComplete={autoComplete}
          error={error ? "error" : undefined}
        />

        {error && <ErrorMessage>{error}</ErrorMessage>}

        {helperText && !error && (
          <p className="text-neutral-600 dark:text-neutral-400 text-xs md:text-sm">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";

export default FormField;