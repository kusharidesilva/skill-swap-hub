"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useLookupOptions } from "@/lib/lookups";

const MAX_VISIBLE_RESULTS = 6;

type UniversityComboboxProps = {
  label: string;
  value: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  emptyValue?: string;
  className?: string;
  labelClassName?: string;
  helperText?: string;
  error?: string;
  id?: string;
};

export default function UniversityCombobox({
  label,
  value,
  onSelect,
  placeholder = "Type or select university...",
  emptyValue = "",
  className = "",
  labelClassName = "",
  helperText,
  error,
  id,
}: UniversityComboboxProps) {
  const reactId = useId();
  const inputId = id || `university-combobox-${reactId}`;
  const menuId = `${inputId}-menu`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [queryValue, setQueryValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const universities = useLookupOptions("universities");
  const selectedValue = value && value !== emptyValue ? value : "";
  const isLocked = Boolean(selectedValue);
  const inputValue = isLocked ? selectedValue : queryValue;

  useEffect(() => {
    // Clicking outside closes the options without changing the typed value.
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  // Search the full institution name while the user types.
  const filteredUniversities = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query) return universities;
    return universities.filter((university) =>
      university.toLowerCase().includes(query),
    );
  }, [inputValue, universities]);

  const commitValue = (nextValue: string) => {
    const normalized = nextValue.trim();
    onSelect(normalized || emptyValue);
    setQueryValue("");
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const clearValue = () => {
    onSelect(emptyValue);
    setQueryValue("");
    setIsOpen(true);
    setActiveIndex(-1);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const handleChange = (nextValue: string) => {
    if (isLocked) return;
    setQueryValue(nextValue);
    setIsOpen(true);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // Arrow keys, Enter, Escape, and Tab make the custom field keyboard friendly.
    if (isLocked) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) setIsOpen(true);
      setActiveIndex((current) =>
        Math.min(current + 1, filteredUniversities.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) setIsOpen(true);
      setActiveIndex((current) =>
        Math.max(current - 1, 0),
      );
      return;
    }

    if (event.key === "Enter") {
      if (isOpen && activeIndex >= 0 && filteredUniversities[activeIndex]) {
        event.preventDefault();
        commitValue(filteredUniversities[activeIndex]);
      } else if (filteredUniversities.length === 1) {
        event.preventDefault();
        commitValue(filteredUniversities[0]);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const exactMatch = filteredUniversities.find(
    (university) => university.toLowerCase() === inputValue.trim().toLowerCase(),
  );

  // Limit the open menu for faster rendering while the user is typing.
  const renderedOptions = filteredUniversities.slice(0, 60);

  return (
    <div className="grid min-w-0 gap-1.5" ref={rootRef}>
      <label
        htmlFor={inputId}
        className={`text-xs font-semibold text-slate-600 ${labelClassName}`}
      >
        {label}
      </label>

      <div className="relative">
        <div
          className={`flex min-h-10 items-center gap-2 rounded-lg border bg-white px-3 py-2 shadow-sm transition focus-within:ring-4 ${
            error
              ? "border-red-300 bg-red-50 focus-within:border-red-500 focus-within:ring-red-100"
              : "border-slate-300 focus-within:border-[#2f66e7] focus-within:ring-blue-100"
          } ${className}`}
        >
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            value={inputValue}
            onChange={(event) => handleChange(event.target.value)}
            onFocus={() => {
              if (!isLocked) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              window.setTimeout(() => {
                if (exactMatch) {
                  commitValue(exactMatch);
                } else {
                  setIsOpen(false);
                  setActiveIndex(-1);
                }
              }, 0);
            }}
            placeholder={placeholder}
            readOnly={isLocked}
            aria-expanded={isOpen}
            aria-controls={menuId}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck={false}
            role="combobox"
            className={`w-full min-w-0 bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 caret-[#2f66e7] ${
              isLocked ? "cursor-default" : "cursor-text"
            }`}
          />

          {inputValue && (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={clearValue}
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label={`Clear ${label}`}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                className="h-3.5 w-3.5"
              >
                <path
                  d="M5.5 5.5L14.5 14.5M14.5 5.5L5.5 14.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}

          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (isLocked) {
                clearValue();
              } else {
                setIsOpen((current) => !current);
                requestAnimationFrame(() => {
                  inputRef.current?.focus();
                });
              }
            }}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={isLocked ? `Change ${label}` : `Open ${label} menu`}
          >
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
          </button>
        </div>

        {isOpen && !isLocked && (
          <div
            id={menuId}
            role="listbox"
            className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl"
          >
            <div
              className="max-h-60 overflow-y-auto py-1"
              style={{
                maxHeight: `${MAX_VISIBLE_RESULTS * 2.5}rem`,
                scrollbarWidth: "thin",
                scrollbarColor: "#b6c5ef transparent",
              }}
            >
              {renderedOptions.length > 0 ? (
                renderedOptions.map((university, index) => (
                  <button
                    key={university}
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => commitValue(university)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${
                      index === activeIndex
                        ? "bg-blue-50 text-[#1453c4]"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="truncate">{university}</span>
                    {value === university ? (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 20 20"
                        fill="none"
                        className="h-4 w-4 shrink-0 text-[#1453c4]"
                      >
                        <path
                          d="M5.5 10.25L8.75 13.5L14.5 6.5"
                          stroke="currentColor"
                          strokeWidth="1.9"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-slate-400">
                  No universities found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {helperText && !error && (
        <p className="text-[11px] font-medium text-slate-500">{helperText}</p>
      )}
      {error && <p className="text-[11px] font-medium text-red-600">{error}</p>}
    </div>
  );
}
