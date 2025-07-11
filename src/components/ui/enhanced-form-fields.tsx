"use client";

import React from "react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Control, FieldValues, Path } from "react-hook-form";
import { AlertCircle, CheckCircle, Loader2, Eye, EyeOff } from "lucide-react";

// Base form field props
interface BaseFormFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label?: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

// Enhanced text input with validation states
interface TextInputProps<TFieldValues extends FieldValues>
  extends BaseFormFieldProps<TFieldValues> {
  type?: "text" | "email" | "url" | "tel";
  maxLength?: number;
  showCharacterCount?: boolean;
  autoComplete?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export function EnhancedTextInput<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  disabled,
  required,
  className,
  type = "text",
  maxLength,
  showCharacterCount,
  autoComplete,
  startIcon,
  endIcon,
}: TextInputProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel className="flex items-center gap-2">
              {label}
              {required && <span className="text-destructive">*</span>}
              {fieldState.isDirty && !fieldState.error && (
                <CheckCircle className="h-3 w-3 text-green-500" />
              )}
              {fieldState.error && (
                <AlertCircle className="h-3 w-3 text-destructive" />
              )}
            </FormLabel>
          )}
          <FormControl>
            <div className="relative">
              {startIcon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {startIcon}
                </div>
              )}
              <Input
                {...field}
                type={type}
                placeholder={placeholder}
                disabled={disabled}
                autoComplete={autoComplete}
                maxLength={maxLength}
                className={cn(
                  startIcon && "pl-10",
                  endIcon && "pr-10",
                  fieldState.error &&
                    "border-destructive focus-visible:ring-destructive",
                  fieldState.isDirty &&
                    !fieldState.error &&
                    "border-green-500 focus-visible:ring-green-500"
                )}
              />
              {endIcon && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {endIcon}
                </div>
              )}
            </div>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          {showCharacterCount && maxLength && (
            <div className="text-xs text-muted-foreground text-right">
              {field.value?.length || 0}/{maxLength}
            </div>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Enhanced password input with visibility toggle
interface PasswordInputProps<TFieldValues extends FieldValues>
  extends BaseFormFieldProps<TFieldValues> {
  showStrengthIndicator?: boolean;
  autoComplete?: string;
}

export function EnhancedPasswordInput<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  disabled,
  required,
  className,
  showStrengthIndicator,
  autoComplete = "current-password",
}: PasswordInputProps<TFieldValues>) {
  const [showPassword, setShowPassword] = React.useState(false);

  const getPasswordStrength = (
    password: string
  ): {
    score: number;
    label: string;
    color: string;
  } => {
    if (!password) return { score: 0, label: "", color: "" };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const strengthMap = {
      0: { label: "", color: "" },
      1: { label: "Very Weak", color: "bg-red-500" },
      2: { label: "Weak", color: "bg-orange-500" },
      3: { label: "Fair", color: "bg-yellow-500" },
      4: { label: "Good", color: "bg-blue-500" },
      5: { label: "Strong", color: "bg-green-500" },
    };

    return { score, ...strengthMap[score as keyof typeof strengthMap] };
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const strength = showStrengthIndicator
          ? getPasswordStrength(field.value || "")
          : null;

        return (
          <FormItem className={className}>
            {label && (
              <FormLabel className="flex items-center gap-2">
                {label}
                {required && <span className="text-destructive">*</span>}
                {fieldState.error && (
                  <AlertCircle className="h-3 w-3 text-destructive" />
                )}
              </FormLabel>
            )}
            <FormControl>
              <div className="relative">
                <Input
                  {...field}
                  type={showPassword ? "text" : "password"}
                  placeholder={placeholder}
                  disabled={disabled}
                  autoComplete={autoComplete}
                  className={cn(
                    "pr-10",
                    fieldState.error &&
                      "border-destructive focus-visible:ring-destructive"
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={disabled}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </FormControl>
            {showStrengthIndicator && strength && field.value && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={cn(
                        "h-1 flex-1 rounded-full",
                        level <= strength.score ? strength.color : "bg-muted"
                      )}
                    />
                  ))}
                </div>
                {strength.label && (
                  <p className="text-xs text-muted-foreground">
                    {strength.label}
                  </p>
                )}
              </div>
            )}
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

// Enhanced textarea with character count
interface TextareaInputProps<TFieldValues extends FieldValues>
  extends BaseFormFieldProps<TFieldValues> {
  rows?: number;
  maxLength?: number;
  showCharacterCount?: boolean;
  resize?: boolean;
}

export function EnhancedTextarea<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  disabled,
  required,
  className,
  rows = 3,
  maxLength,
  showCharacterCount,
  resize = true,
}: TextareaInputProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel className="flex items-center gap-2">
              {label}
              {required && <span className="text-destructive">*</span>}
              {fieldState.isDirty && !fieldState.error && (
                <CheckCircle className="h-3 w-3 text-green-500" />
              )}
              {fieldState.error && (
                <AlertCircle className="h-3 w-3 text-destructive" />
              )}
            </FormLabel>
          )}
          <FormControl>
            <Textarea
              {...field}
              placeholder={placeholder}
              disabled={disabled}
              rows={rows}
              maxLength={maxLength}
              className={cn(
                !resize && "resize-none",
                fieldState.error &&
                  "border-destructive focus-visible:ring-destructive",
                fieldState.isDirty &&
                  !fieldState.error &&
                  "border-green-500 focus-visible:ring-green-500"
              )}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          {showCharacterCount && maxLength && (
            <div className="text-xs text-muted-foreground text-right">
              {field.value?.length || 0}/{maxLength}
            </div>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Enhanced select with async loading support
interface SelectInputProps<TFieldValues extends FieldValues>
  extends BaseFormFieldProps<TFieldValues> {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  isLoading?: boolean;
  onValueChange?: (value: string) => void;
}

export function EnhancedSelect<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  disabled,
  required,
  className,
  options,
  isLoading,
  onValueChange,
}: SelectInputProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel className="flex items-center gap-2">
              {label}
              {required && <span className="text-destructive">*</span>}
              {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
              {fieldState.error && (
                <AlertCircle className="h-3 w-3 text-destructive" />
              )}
            </FormLabel>
          )}
          <Select
            onValueChange={(value) => {
              field.onChange(value);
              onValueChange?.(value);
            }}
            defaultValue={field.value}
            disabled={disabled || isLoading}
          >
            <FormControl>
              <SelectTrigger
                className={cn(
                  fieldState.error &&
                    "border-destructive focus:ring-destructive",
                  fieldState.isDirty &&
                    !fieldState.error &&
                    "border-green-500 focus:ring-green-500"
                )}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Form validation summary component
interface FormValidationSummaryProps {
  errors: Record<string, any>;
  title?: string;
  className?: string;
}

export function FormValidationSummary({
  errors,
  title = "Please fix the following errors:",
  className,
}: FormValidationSummaryProps) {
  const errorCount = Object.keys(errors).length;

  if (errorCount === 0) return null;

  return (
    <div
      className={cn(
        "rounded-md border border-destructive bg-destructive/10 p-4",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <h3 className="text-sm font-medium text-destructive">{title}</h3>
        <Badge variant="destructive" className="ml-auto">
          {errorCount} {errorCount === 1 ? "error" : "errors"}
        </Badge>
      </div>
      <ul className="text-sm text-destructive space-y-1">
        {Object.entries(errors).map(([field, error]) => (
          <li key={field} className="flex items-start gap-2">
            <span className="font-medium capitalize">
              {field.replace(/([A-Z])/g, " $1").toLowerCase()}:
            </span>
            <span>{error.message || error}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Submit button with loading state
interface SubmitButtonProps {
  isLoading?: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  loadingText?: string;
}

export function FormSubmitButton({
  isLoading,
  children,
  className,
  disabled,
  loadingText = "Submitting...",
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={disabled || isLoading}
      className={className}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isLoading ? loadingText : children}
    </Button>
  );
}
