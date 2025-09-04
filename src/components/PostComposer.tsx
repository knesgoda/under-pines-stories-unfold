import * as React from "react";
import { Image as ImageIcon, Film } from "lucide-react";
import InlineSuggestions from "./InlineSuggestions";
import { searchUsersPrefix, searchTagsPrefix } from "@/services/search";

type Props = {
  avatarUrl: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  onAddPhotos?: () => void;
  onAddVideo?: () => void;
  onSubmit?: () => void;
  maxChars?: number;
  disabled?: boolean;
};

type Trigger = null | { kind: "at" | "tag"; start: number; query: string };

export default function PostComposer({
  avatarUrl,
  placeholder = "Share something…",
  value,
  onChange,
  onAddPhotos,
  onAddVideo,
  onSubmit,
  maxChars = 2500,
  disabled,
}: Props) {
  const remaining = maxChars - value.length;
  const taRef = React.useRef<HTMLTextAreaElement>(null);
  const [trigger, setTrigger] = React.useState<Trigger>(null);
  const [items, setItems] = React.useState<Array<{ id: string; label: string; sub?: string; avatarUrl?: string }>>([]);

  // Parse current token around caret to detect @ / #
  const detectTrigger = React.useCallback(() => {
    const el = taRef.current;
    if (!el) return setTrigger(null);
    const pos = el.selectionStart;
    const before = value.slice(0, pos);
    // find last whitespace or start
    const m = before.match(/(^|\s)([@#][A-Za-z0-9_]{0,64})$/);
    if (!m) return setTrigger(null);
    const token = m[2]; // like @ke or #su
    if (!token) return setTrigger(null);
    const kind = token[0] === "@" ? "at" : "tag";
    const query = token.slice(1); // without trigger char
    const start = pos - token.length;
    setTrigger({ kind, start, query });
  }, [value]);

  // Debounced search
  React.useEffect(() => {
    let active = true;
    async function run() {
      if (!trigger || trigger.query.length < 1) {
        setItems([]);
        return;
      }
      const results = trigger.kind === "at"
        ? await searchUsersPrefix(trigger.query)
        : await searchTagsPrefix(trigger.query);
      if (active) setItems(results);
    }
    const id = window.setTimeout(run, 120);
    return () => { active = false; window.clearTimeout(id); };
  }, [trigger]);

  const insertPick = (label: string) => {
    const el = taRef.current;
    if (!el || !trigger) return;
    const before = value.slice(0, trigger.start);
    const after = value.slice(el.selectionStart);
    const glue = before.endsWith(" ") || before.length === 0 ? "" : " ";
    const space = after.startsWith(" ") || after.length === 0 ? "" : " ";
    const next = `${before}${glue}${label}${space}${after}`;
    onChange(next);
    setItems([]);
    setTrigger(null);
    // place caret after inserted label + trailing space
    requestAnimationFrame(() => {
      const pos = (before + glue + label + " ").length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  return (
    <section className="relative">
      <div className="rounded-[1.35rem] p-0.5 shadow-[0_10px_34px_rgba(0,0,0,0.35)]">
        <div className="pointer-events-none absolute inset-0 rounded-[1.35rem] bg-gradient-to-br from-emerald-500/20 via-amber-300/10 to-emerald-800/20 opacity-50 blur-xl" />
        <div className="relative rounded-[1.2rem] border border-emerald-900/35 bg-[#F8F6F2]">
          <div className="flex items-start gap-4 p-4">
            <img
              src={avatarUrl}
              alt="Your avatar"
              className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-emerald-700/30"
            />

            <div className="relative min-w-0 flex-1">
              <textarea
                ref={taRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyUp={detectTrigger}
                onClick={detectTrigger}
                onKeyDown={detectTrigger}
                placeholder={placeholder}
                rows={3}
                className="
                  w-full resize-y bg-transparent text-[17px] leading-7
                  text-slate-800 placeholder:text-slate-400
                  focus:outline-none
                "
              />

              {/* Suggestions panel */}
              {trigger && items.length > 0 && (
                <InlineSuggestions
                  items={items}
                  onPick={(it) => insertPick(it.label)}
                  onClose={() => { setItems([]); setTrigger(null); }}
                />
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onAddPhotos}
                  className="
                    inline-flex items-center gap-2 rounded-2xl
                    bg-emerald-800 px-4 py-2.5 text-[15px] text-emerald-50
                    hover:bg-emerald-700 focus-visible:outline-none
                    focus-visible:ring-2 focus-visible:ring-amber-400
                  "
                >
                  <ImageIcon className="h-5 w-5" />
                  Photos
                </button>

                <button
                  type="button"
                  onClick={onAddVideo}
                  className="
                    inline-flex items-center gap-2 rounded-2xl
                    bg-emerald-800 px-4 py-2.5 text-[15px] text-emerald-50
                    hover:bg-emerald-700 focus-visible:outline-none
                    focus-visible:ring-2 focus-visible:ring-amber-400
                  "
                >
                  <Film className="h-5 w-5" />
                  Video
                </button>

                <span className="ml-auto text-sm text-slate-500">
                  {remaining}/{maxChars}
                </span>

                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={disabled || value.trim().length === 0}
                  className="
                    ml-2 rounded-2xl bg-amber-400 px-5 py-2.5 text-[15px] font-medium text-emerald-950
                    shadow-[0_8px_20px_rgba(253,186,116,0.35)]
                    hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400
                  "
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
