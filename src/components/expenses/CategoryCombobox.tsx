"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tag } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface ExpenseCategory {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
}

interface CategoryComboboxProps {
  categories: ExpenseCategory[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  id?: string;
}

export function CategoryCombobox({
  categories,
  value,
  onChange,
  required = false,
  placeholder = "เลือกหมวดหมู่",
  id = "transaction-category-select",
}: CategoryComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedCategory = categories.find((c) => c.id === value);

  // Filter categories based on search
  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset search when closing
  useEffect(() => {
    if (!isOpen) {
      setSearch("");
    }
  }, [isOpen]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = useCallback(
    (categoryId: string) => {
      onChange(categoryId);
      setIsOpen(false);
      setSearch("");
    },
    [onChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const items = listRef.current?.querySelectorAll("li");
      if (!items || items.length === 0) return;

      const currentIndex = Array.from(items).findIndex(
        (item) => item === document.activeElement
      );

      const nextIndex =
        e.key === "ArrowDown"
          ? currentIndex < items.length - 1
            ? currentIndex + 1
            : 0
          : currentIndex > 0
            ? currentIndex - 1
            : items.length - 1;

      (items[nextIndex] as HTMLElement)?.focus();
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const focused = document.activeElement as HTMLLIElement;
      if (focused?.tagName === "LI") {
        focused.click();
      }
    }
  };

  return (
    <div
      id="transaction-category-select-wrap"
      ref={containerRef}
      className="relative"
    >
      {/* Selected Category / Search Input */}
      <div className="relative">
        {/* Icon (left) */}
        {selectedCategory ? (
          <span
            id="transaction-category-selected-icon"
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 z-10 text-xl"
          >
            {selectedCategory.icon ?? "📦"}
          </span>
        ) : (
          <Tag
            id="transaction-category-placeholder-icon"
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 z-10"
          />
        )}

        {/* Input */}
        <Input
          ref={inputRef}
          id={id}
          type="text"
          value={isOpen ? search : selectedCategory?.name || ""}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required && !selectedCategory}
          className="border-border bg-background text-foreground focus-visible:ring-foreground/30 h-12 w-full appearance-none rounded-lg border py-0 pr-11 pl-12 text-base font-medium transition-colors outline-none focus-visible:ring-2 cursor-pointer"
          autoComplete="off"
        />

        {/* Chevron icon (right) */}
        <Tag
          id="transaction-category-select-icon"
          className={`text-muted-foreground pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {/* Dropdown List */}
      {isOpen && (
        <ul
          ref={listRef}
          id="transaction-category-dropdown"
          className="border-border bg-card absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border shadow-lg"
          role="listbox"
        >
          {filtered.length === 0 ? (
            <li
              id="no-categories-found"
              className="text-muted-foreground px-4 py-3 text-center text-sm"
            >
              {search ? "ไม่พบหมวดหมู่" : "ยังไม่มีหมวดหมู่"}
            </li>
          ) : (
            filtered.map((category, index) => {
              const isSelected = category.id === value;
              return (
                <li
                  key={category.id}
                  id={`category-option-${category.id}`}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={index === 0 ? 0 : -1}
                  onClick={() => handleSelect(category.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelect(category.id);
                    }
                  }}
                  className={`hover:bg-muted/50 flex cursor-pointer items-center gap-3 px-4 py-3 text-base transition-colors ${
                    isSelected
                      ? "bg-muted/70 text-foreground font-semibold"
                      : "text-foreground"
                  }`}
                >
                  <span className="text-lg">
                    {category.icon ?? "📦"}
                  </span>
                  <span>{category.name}</span>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
