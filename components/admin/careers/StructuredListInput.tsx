"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Edit2,
  Check,
  X,
  Undo2,
  ListPlus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface StructuredListInputProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  required?: boolean;
  minItems?: number;
  itemIconColor?: string;
  helperText?: string;
}

/**
 * Splits pasted multi-line, bulleted, or numbered text into clean individual items.
 */
export function splitPastedItems(text: string): string[] {
  return text
    .split(/\r?\n|•|(?<=\n)\s*[-*]\s+|\u2022/)
    .map((s) =>
      s
        .trim()
        .replace(/^[-*•]\s*/, "")
        .replace(/^[0-9]+[.)\]]\s*/, "")
        .trim(),
    )
    .filter((s) => s.length > 0);
}

const DEFAULT_EMPTY_ITEMS: string[] = [];

export function StructuredListInput({
  label,
  items = DEFAULT_EMPTY_ITEMS,
  onChange,
  placeholder = "Add an item or paste multiple bullet points...",
  required = false,
  minItems = 0,
  itemIconColor = "text-[#1155CC]",
  helperText = "Paste multi-line text to automatically split into separate list items.",
}: StructuredListInputProps): React.JSX.Element {
  const [inputValue, setInputValue] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [lastRemoved, setLastRemoved] = useState<{ item: string; index: number } | null>(null);

  const handleAdd = (): void => {
    if (!inputValue.trim()) return;
    const splitItems = splitPastedItems(inputValue);
    if (splitItems.length > 0) {
      onChange([...items, ...splitItems]);
      setInputValue("");
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>): void => {
    const pasteData = e.clipboardData.getData("text");
    const split = splitPastedItems(pasteData);
    if (split.length > 1) {
      e.preventDefault();
      onChange([...items, ...split]);
      setInputValue("");
    }
  };

  const handleRemove = (index: number): void => {
    const itemToRemove = items[index];
    if (itemToRemove !== undefined) {
      setLastRemoved({ item: itemToRemove, index });
    }
    onChange(items.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const handleUndo = (): void => {
    if (!lastRemoved) return;
    const next = [...items];
    next.splice(lastRemoved.index, 0, lastRemoved.item);
    onChange(next);
    setLastRemoved(null);
  };

  const handleMove = (index: number, direction: "up" | "down"): void => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const next = [...items];
    const currentItem = next[index];
    const targetItem = next[targetIndex];
    if (currentItem !== undefined && targetItem !== undefined) {
      next[index] = targetItem;
      next[targetIndex] = currentItem;
      onChange(next);
    }
  };

  const startEdit = (index: number, text: string): void => {
    setEditingIndex(index);
    setEditingText(text);
  };

  const saveEdit = (index: number): void => {
    if (!editingText.trim()) {
      handleRemove(index);
    } else {
      const next = [...items];
      next[index] = editingText.trim();
      onChange(next);
    }
    setEditingIndex(null);
    setEditingText("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
          <span className="ml-1 font-mono font-normal text-slate-400">({items.length})</span>
        </label>
        {lastRemoved && (
          <button
            type="button"
            onClick={handleUndo}
            className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-bold text-[#1155CC] hover:underline"
          >
            <Undo2 className="h-3 w-3" />
            <span>Undo removal</span>
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          className="rounded-xl text-xs"
        />
        <Button
          type="button"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="shrink-0 cursor-pointer gap-1 rounded-xl bg-[#1155CC] text-xs font-bold text-white hover:bg-[#0d44a5] disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add</span>
        </Button>
      </div>

      {helperText && (
        <p className="flex items-center gap-1 text-[11px] text-slate-400">
          <ListPlus className="h-3 w-3 shrink-0 text-slate-400" />
          <span>{helperText}</span>
        </p>
      )}

      {/* Items List */}
      {items.length > 0 ? (
        <div className="space-y-1.5 pt-1">
          {items.map((item, idx) => (
            <div
              key={item}
              className="group flex items-start justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50 p-2.5 text-xs transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-slate-700"
            >
              {editingIndex === idx ? (
                <div className="flex flex-1 items-center gap-1.5">
                  <Input
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        saveEdit(idx);
                      } else if (e.key === "Escape") {
                        setEditingIndex(null);
                      }
                    }}
                    className="h-7 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => saveEdit(idx)}
                    className="cursor-pointer p-1 text-emerald-600 hover:text-emerald-700"
                    aria-label="Save item"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingIndex(null)}
                    className="cursor-pointer p-1 text-slate-400 hover:text-slate-600"
                    aria-label="Cancel editing"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex min-w-0 flex-1 items-start gap-2 pt-0.5">
                    <CheckCircle2 className={`h-3.5 w-3.5 ${itemIconColor} mt-0.5 shrink-0`} />
                    <span className="leading-relaxed break-words text-slate-700 select-text dark:text-slate-300">
                      {item}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5 opacity-80 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, "up")}
                      className="cursor-pointer p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 dark:hover:text-slate-200"
                      title="Move up"
                      aria-label="Move item up"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === items.length - 1}
                      onClick={() => handleMove(idx, "down")}
                      className="cursor-pointer p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 dark:hover:text-slate-200"
                      title="Move down"
                      aria-label="Move item down"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(idx, item)}
                      className="cursor-pointer p-1 text-slate-400 hover:text-[#1155CC]"
                      title="Edit item inline"
                      aria-label="Edit item"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      className="cursor-pointer p-1 text-slate-400 hover:text-rose-600"
                      title="Remove item"
                      aria-label="Delete item"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 p-3.5 text-center text-xs text-slate-400 dark:border-slate-800">
          No items added yet. {minItems > 0 && `Minimum required: ${minItems}`}
        </div>
      )}
    </div>
  );
}
