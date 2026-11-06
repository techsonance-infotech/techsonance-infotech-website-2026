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

export function StructuredListInput({
  label,
  items = [],
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
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          {label} {required && <span className="text-rose-500">*</span>}
          <span className="text-slate-400 font-mono font-normal ml-1">({items.length})</span>
        </label>
        {lastRemoved && (
          <button
            type="button"
            onClick={handleUndo}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1155CC] hover:underline cursor-pointer"
          >
            <Undo2 className="w-3 h-3" />
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
          className="rounded-xl bg-[#1155CC] hover:bg-[#0d44a5] text-white text-xs font-bold shrink-0 gap-1 cursor-pointer disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </Button>
      </div>

      {helperText && (
        <p className="text-[11px] text-slate-400 flex items-center gap-1">
          <ListPlus className="w-3 h-3 text-slate-400 shrink-0" />
          <span>{helperText}</span>
        </p>
      )}

      {/* Items List */}
      {items.length > 0 ? (
        <div className="space-y-1.5 pt-1">
          {items.map((item, idx) => (
            <div
              key={`${idx}-${item.slice(0, 10)}`}
              className="group flex items-start justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs transition-colors hover:border-slate-300 dark:hover:border-slate-700"
            >
              {editingIndex === idx ? (
                <div className="flex-1 flex items-center gap-1.5">
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
                    autoFocus
                    className="h-7 text-xs rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => saveEdit(idx)}
                    className="p-1 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                    aria-label="Save item"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingIndex(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label="Cancel editing"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-2 min-w-0 flex-1 pt-0.5">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${itemIconColor} shrink-0 mt-0.5`} />
                    <span className="text-slate-700 dark:text-slate-300 break-words leading-relaxed select-text">
                      {item}
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, "up")}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                      title="Move up"
                      aria-label="Move item up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === items.length - 1}
                      onClick={() => handleMove(idx, "down")}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                      title="Move down"
                      aria-label="Move item down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(idx, item)}
                      className="p-1 text-slate-400 hover:text-[#1155CC] cursor-pointer"
                      title="Edit item inline"
                      aria-label="Edit item"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Remove item"
                      aria-label="Delete item"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
          No items added yet. {minItems > 0 && `Minimum required: ${minItems}`}
        </div>
      )}
    </div>
  );
}
