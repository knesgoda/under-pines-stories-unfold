import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Volume2, VolumeX } from "lucide-react";
import { EmberGroup } from "@/services/embersStories";
import { markSeen } from "@/services/embersStories";
import { getEmberCounts, reactToEmber } from "@/services/embers";

type Props = {
  groups: EmberGroup[];
  startIndex: number;
  onClose: () => void;
  onUpdateGroups: (next: EmberGroup[]) => void;
};

// visual timing
const DURATION_MS = 5000;

// tray emojis — keep in sync with your SQL CHECK list
const EMOJIS = ["👍", "😂", "😡", "😢", "🙄", "🔥"];

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

// 24h fade factor: 0 at t0 (bright) -> 1 at +24h (fully dim)
function fade24h(createdAtISO: string) {
  const span = 24 * 3600 * 1000;
  const elapsed = Date.now() - new Date(createdAtISO).getTime();
  return clamp01(elapsed / span);
}

export default function EmberViewer({ groups, startIndex, onClose, onUpdateGroups }: Props) {
  const [gIdx, setGIdx] = React.useState(startIndex);
  const [iIdx, setIIdx] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [muted, setMuted] = React.useState(true);
  const timerRef = React.useRef<number | null>(null);
  const progRef = React.useRef(0);
  const [tick, setTick] = React.useState(0);
  const [counts, setCounts] = React.useState<Record<string, number>>({});
  const [reacting, setReacting] = React.useState<string | null>(null);

  const group = groups[gIdx];
  const items = group.items;
  const item = items[iIdx];

  // progress / auto-advance
  React.useEffect(() => {
    progRef.current = 0;
    markSeen(item.id).catch(() => {});
    if (timerRef.current) cancelAnimationFrame(timerRef.current);

    const started = performance.now();
    const step = (t: number) => {
      if (paused) { timerRef.current = requestAnimationFrame(step); return; }
      const p = Math.min(1, (t - started) / DURATION_MS);
      progRef.current = p;
      setTick((n) => n + 1);
      if (p >= 1) return void next();
      timerRef.current = requestAnimationFrame(step);
    };
    timerRef.current = requestAnimationFrame(step);
    return () => { if (timerRef.current) cancelAnimationFrame(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gIdx, iIdx, paused]);

  // load counts for the current ember
  React.useEffect(() => {
    (async () => {
      const map = await getEmberCounts([item.id]);
      setCounts(map[item.id] || {});
    })();
  }, [item.id]);

  const next = React.useCallback(() => {
    if (iIdx < items.length - 1) setIIdx((v) => v + 1);
    else if (gIdx < groups.length - 1) { setGIdx((g) => g + 1); setIIdx(0); }
    else onClose();
  }, [iIdx, items.length, gIdx, groups.length, onClose]);

  const prev = React.useCallback(() => {
    if (iIdx > 0) setIIdx((v) => v - 1);
    else if (gIdx > 0) { const len = groups[gIdx - 1].items.length; setGIdx((g) => g - 1); setIIdx(len - 1); }
  }, [iIdx, gIdx, groups]);

  // update unread ring when a group's all seen
  React.useEffect(() => {
    const newGroups = groups.slice();
    if (newGroups[gIdx].hasUnseen) {
      newGroups[gIdx] = { ...newGroups[gIdx], hasUnseen: false };
      onUpdateGroups(newGroups);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gIdx]);

  // keyboard
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === " ") setPaused((p) => !p);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, next, prev]);

  // swipe gestures (left/right, pull down to close)
  const drag = React.useRef<{x: number; y: number; t: number} | null>(null);
  function onPD(e: React.PointerEvent) {
    setPaused(true);
    drag.current = { x: e.clientX, y: e.clientY, t: performance.now() };
  }
  function onPM(e: React.PointerEvent) {
    // optional: you can add live parallax based on (e.clientX - drag.current?.x)
  }
  function onPU(e: React.PointerEvent) {
    setPaused(false);
    const start = drag.current; drag.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const adx = Math.abs(dx), ady = Math.abs(dy);
    if (ady > adx && dy > 60) return void onClose();      // swipe down
    if (adx > 40) return void (dx < 0 ? next() : prev());   // swipe horizontally
    // small move -> treat as tap based on side
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const left = e.clientX - rect.left < rect.width / 2;
    void (left ? prev() : next());
  }

  // 24h fade factor -> visual dim overlay
  const f = fade24h(item.created_at);             // 0..1
  const dim = 0.15 + 0.55 * f;                    // tune if you want stronger fade
  const progressNow = progRef.current;

  async function react(emoji: string) {
    setReacting(emoji);
    try {
      await reactToEmber(item.id, emoji);
      setCounts((c) => ({ ...c, [emoji]: (c[emoji] || 0) + 1 }));
    } finally {
      setTimeout(() => setReacting(null), 350);
    }
  }

  return (
    <AnimatePresence initial={false}>
      <motion.div
        className="fixed inset-0 z-50 grid bg-black/90 backdrop-blur"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-black/40 text-white ring-1 ring-white/20"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Progress bars */}
        <div className="pointer-events-none absolute left-1/2 top-2 z-10 flex w-[min(720px,92vw)] -translate-x-1/2 gap-1">
          {items.map((_, idx) => (
            <div key={idx} className="h-1 w-full overflow-hidden rounded bg-white/20">
              <div
                className="h-full bg-white"
                style={{ transform: `scaleX(${idx < iIdx ? 1 : idx === iIdx ? progressNow : 0})`, transformOrigin: "left" }}
              />
            </div>
          ))}
        </div>

        {/* Viewer surface with gestures */}
        <div className="relative mx-auto flex w-[min(720px,92vw)] flex-col overflow-hidden rounded-3xl ring-1 ring-white/10">
          <div
            className="relative aspect-[9/16] select-none touch-pan-y bg-emerald-900/50"
            onPointerDown={onPD}
            onPointerMove={onPM}
            onPointerUp={onPU}
            onPointerCancel={() => { setPaused(false); drag.current = null; }}
          >
            {item.image_url ? (
              <img src={item.image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-700 to-emerald-900 p-6">
                <p className="text-balance text-center text-xl leading-7 text-emerald-50 drop-shadow">
                  {item.content}
                </p>
              </div>
            )}

            {/* brightness fade overlay */}
            <div className="pointer-events-none absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${dim})` }} />

            {/* header */}
            <div className="absolute left-0 right-0 top-0 flex items-center gap-2 bg-gradient-to-b from-black/50 to-transparent p-3 text-white">
              <img
                src={group.user.avatar_url || "/avatar.png"}
                className="h-8 w-8 rounded-full object-cover ring-2 ring-white/20"
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  {group.user.display_name || group.user.username || "User"}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
                className="ml-auto grid h-8 w-8 place-items-center rounded-full bg-black/40 ring-1 ring-white/20"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </div>

            {/* reaction tray */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-3">
              <div className="mx-auto flex w-max gap-2 rounded-full bg-black/35 px-3 py-2 ring-1 ring-white/10 backdrop-blur">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={(ev) => { ev.stopPropagation(); react(e); }}
                    className={`relative grid h-10 w-10 place-items-center rounded-full transition-transform hover:scale-110 ${reacting === e ? "scale-110" : ""}`}
                    aria-label={`React ${e}`}
                  >
                    <span className="text-2xl leading-none">{e}</span>
                    {!!counts[e] && (
                      <span className="pointer-events-none absolute -right-1 -top-1 rounded-full bg-white/90 px-1 text-[10px] text-black">
                        {counts[e]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="pointer-events-none mt-2 text-center text-xs text-white/80">Tap to navigate • Hold to pause • Swipe down to close</div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
