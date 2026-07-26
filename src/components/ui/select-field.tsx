"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

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

type NormalizedOption = {
  value: string;
  label: string;
  disabled: boolean;
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

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4 shrink-0"
    >
      <path
        d="M5.5 10.25L8.75 13.5L14.5 6.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Accept simple strings and detailed options through one component API.
function normalizeOption(option: SelectOption): NormalizedOption {
  if (typeof option === "string") {
    return { value: option, label: option, disabled: false };
  }

  return {
    value: option.value,
    label: option.label || option.value,
    disabled: Boolean(option.disabled),
  };
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
  const menuId = `${selectId}-menu`;
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const normalizedOptions = options.map(normalizeOption);
  const selectedOption = normalizedOptions.find((option) => option.value === value);
  const selectedLabel = selectedOption?.label || value || placeholder || "";

  useEffect(() => {
    // Clicking elsewhere closes the custom menu like a native select.
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const findEnabledIndex = (startIndex: number, direction: 1 | -1) => {
    if (normalizedOptions.length === 0) return -1;

    // Wrap around the list while skipping options the user cannot choose.
    let index = startIndex;
    for (let count = 0; count < normalizedOptions.length; count += 1) {
      index = (index + direction + normalizedOptions.length) % normalizedOptions.length;
      if (!normalizedOptions[index].disabled) return index;
    }

    return -1;
  };

  const openMenu = () => {
    if (disabled) return;

    const selectedIndex = normalizedOptions.findIndex(
      (option) => option.value === value && !option.disabled,
    );
    setActiveIndex(
      selectedIndex >= 0 ? selectedIndex : findEnabledIndex(-1, 1),
    );
    setIsOpen(true);
  };

  const selectOption = (option: NormalizedOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
    setActiveIndex(-1);
    buttonRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    // Mirror native select keyboard behaviour inside the custom popover.
    if (disabled) return;

    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!isOpen) {
        openMenu();
      } else if (activeIndex >= 0) {
        selectOption(normalizedOptions[activeIndex]);
      }
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;

      if (!isOpen) {
        openMenu();
        return;
      }

      setActiveIndex((current) => findEnabledIndex(current, direction));
    }
  };

  return (
    <div
      ref={rootRef}
      className={`grid min-w-0 max-w-full gap-1.5 ${wrapperClassName}`}
    >
      <label
        htmlFor={selectId}
        className={`text-xs font-semibold text-slate-600 ${labelClassName}`}
      >
        {label}
      </label>

      <div className="relative min-w-0">
        <button
          ref={buttonRef}
          type="button"
          id={selectId}
          title={title || label}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={menuId}
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
              setActiveIndex(-1);
            } else {
              openMenu();
            }
          }}
          onKeyDown={handleKeyDown}
          className={`flex w-full min-w-0 cursor-pointer items-center justify-between gap-2 overflow-hidden rounded-lg border bg-white px-3 py-2 pr-3 text-left text-sm font-medium text-slate-800 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${
            error
              ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100"
              : "border-slate-300 focus:border-[#2f66e7] focus:ring-blue-100"
          } ${className}`}
        >
          <span
            className={`block min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap ${
              !value ? "text-slate-400" : "text-slate-800"
            }`}
          >
            {selectedLabel}
          </span>
          <span
            className={`shrink-0 text-slate-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          >
            <ChevronDownIcon />
          </span>
        </button>

        {isOpen ? (
          <div
            id={menuId}
            role="listbox"
            aria-labelledby={selectId}
            className="absolute z-40 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl"
          >
            <div
              className="max-h-60 overflow-y-auto py-1"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#b6c5ef transparent",
              }}
            >
              {placeholder ? (
                <button
                  type="button"
                  role="option"
                  aria-selected={!value}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() =>
                    selectOption({
                      value: "",
                      label: placeholder,
                      disabled: false,
                    })
                  }
                  className={`flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-sm transition ${
                    !value
                      ? "bg-blue-50 text-[#1453c4]"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <span className="truncate">{placeholder}</span>
                  {!value ? <CheckIcon /> : null}
                </button>
              ) : null}

              {normalizedOptions.map((option, index) => {
                const isSelected = option.value === value;
                const isActive = index === activeIndex;

                return (
                  <button
                    key={`${option.value}-${option.label}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    onMouseEnter={() => {
                      if (!option.disabled) setActiveIndex(index);
                    }}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectOption(option)}
                    className={`flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300 ${
                      isSelected || isActive
                        ? "bg-blue-50 text-[#1453c4]"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected ? <CheckIcon /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {helperText && !error ? (
        <p className="text-[11px] font-medium text-slate-500">{helperText}</p>
      ) : null}
      {error ? <p className="text-[11px] font-medium text-red-600">{error}</p> : null}
    </div>
  );
}
