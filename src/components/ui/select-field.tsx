"use client";

import { useId } from "react";

type SelectOption =
  | string
  | {
      value: string;
      label?: string;
      disabled?: boolean;
    };

type SelectFieldProps = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  labelClassName?: string;
  wrapperClassName?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  id?: string;
  title?: string;
};

function ChevronDownIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
    >
      <path
        d="M5.5 7.5L10 12l4.5-4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
  className = "",
  labelClassName = "",
  wrapperClassName = "",
  helperText,
  error,
  disabled = false,
  id,
  title,
}: SelectFieldProps) {
  const reactId = useId();
  const selectId = id || `select-field-${reactId}`;

  return (
    <label className={`grid min-w-0 gap-1.5 ${wrapperClassName}`} htmlFor={selectId}>
      <span className={`text-xs font-semibold text-slate-600 ${labelClassName}`}>
        {label}
      </span>

      <div className="relative">
        <select
          id={selectId}
          title={title || label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className={`w-full appearance-none rounded-lg border bg-white px-3 py-2 pr-10 text-sm font-medium text-slate-800 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${
            error
              ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100"
              : "border-slate-300 focus:border-[#2f66e7] focus:ring-blue-100"
          } ${className}`}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => {
            const normalized =
              typeof option === "string"
                ? { value: option, label: option, disabled: false }
                : {
                    value: option.value,
                    label: option.label || option.value,
                    disabled: Boolean(option.disabled),
                  };

            return (
              <option
                key={`${normalized.value}-${normalized.label}`}
                value={normalized.value}
                disabled={normalized.disabled}
              >
                {normalized.label}
              </option>
            );
          })}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
          <ChevronDownIcon />
        </div>
      </div>

      {helperText && !error ? (
        <p className="text-[11px] font-medium text-slate-500">{helperText}</p>
      ) : null}
      {error ? <p className="text-[11px] font-medium text-red-600">{error}</p> : null}
    </label>
  );
}
