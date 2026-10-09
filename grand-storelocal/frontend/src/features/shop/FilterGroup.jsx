import React from "react";
import { Check } from "lucide-react";

export default function FilterGroup({
  title,
  options,
  selectedValues,
  onToggle,
  formatLabel,
}) {
  return (
    <div className="border-b border-white/5 pb-8 mb-8 last:border-0 last:mb-0 last:pb-0">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white text-xs font-bold tracking-[0.2em] uppercase">
          {title}
        </h3>
        {selectedValues.length > 0 && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-black bg-[#b58b38] px-2 py-0.5 rounded-full">
            {selectedValues.length}
          </span>
        )}
      </div>
      <div className="space-y-3.5 max-h-60 overflow-y-auto pr-3 custom-scrollbar">
        {options.map((option, index) => {
          const isSelected = selectedValues.includes(option);
          return (
            <label
              key={option || index}
              className="group flex items-center gap-4 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={isSelected}
                onChange={() => onToggle(option)}
              />
              <div
                className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center transition-all duration-300 ${isSelected ? "border-transparent bg-gradient-to-br from-[#d4af37] to-[#aa8022] shadow-[0_0_10px_rgba(212,175,55,0.3)]" : "border border-white/20 bg-white/5 group-hover:border-[#b58b38]/50"}`}
              >
                {isSelected && (
                  <Check size={14} className="text-[#050505]" strokeWidth={3} />
                )}
              </div>
              <span
                className={`text-sm font-medium tracking-wide transition-all duration-300 ${isSelected ? "text-white translate-x-1" : "text-white/60 group-hover:text-white group-hover:translate-x-1"}`}
              >
                {formatLabel ? formatLabel(option) : option}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
