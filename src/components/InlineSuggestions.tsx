import * as React from "react";

type Item = { id: string; label: string; sub?: string; avatarUrl?: string };
type Props = {
  items: Item[];
  onPick: (item: Item) => void;
  onClose: () => void;
  anchor?: "left" | "right";
};

export default function InlineSuggestions({ items, onPick, onClose, anchor = "left" }: Props) {
  React.useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  if (!items.length) return null;

  return (
    <div
      className={`
        absolute z-30 mt-2 w-[320px]
        ${anchor === "left" ? "left-16" : "right-4"}
        rounded-2xl border border-emerald-800/40 bg-emerald-950/95 p-2
        text-emerald-50 shadow-xl backdrop-blur
      `}
      role="listbox"
    >
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onPick(it)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 hover:bg-emerald-900/50"
          role="option"
        >
          {it.avatarUrl ? (
            <img src={it.avatarUrl} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-emerald-800" />
          )}
          <div className="text-left">
            <div className="text-sm font-medium">{it.label}</div>
            {it.sub && <div className="text-xs text-emerald-200/70">{it.sub}</div>}
          </div>
        </button>
      ))}
    </div>
  );
}
