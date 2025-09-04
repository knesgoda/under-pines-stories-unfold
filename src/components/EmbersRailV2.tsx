import * as React from "react";
import { fetchEmberGroups } from "@/services/embersStories";
import EmberViewer from "./EmberViewer";
import { Plus } from "lucide-react";

export default function EmbersRailV2() {
  const [groups, setGroups] = React.useState<Awaited<ReturnType<typeof fetchEmberGroups>>>([]);
  const [openAt, setOpenAt] = React.useState<number | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const g = await fetchEmberGroups();
      if (alive) setGroups(g);
    })();
    return () => { alive = false; };
  }, []);

  return (
    <>
      <div className="no-scrollbar relative flex gap-3 overflow-x-auto pb-2 pt-1">
        {/* Your Ember bubble */}
        <button
          className="group relative grid h-20 w-20 shrink-0 place-items-center rounded-full
                     bg-gradient-to-br from-amber-300/40 via-emerald-400/20 to-emerald-900/20 p-0.5"
          title="Post an Ember"
          onClick={() => document.getElementById("ember-composer")?.scrollIntoView({ behavior: "smooth", block: "center" })}
        >
          <div className="grid h-full w-full place-items-center rounded-full bg-emerald-950/40 backdrop-blur ring-1 ring-emerald-800/40">
            <Plus className="h-6 w-6 text-amber-300 group-hover:scale-110 transition-transform" />
          </div>
          <span className="absolute -bottom-5 w-[90px] truncate text-center text-[12px] text-emerald-200/80">Your Ember</span>
        </button>

        {groups.map((g, i) => {
          const newest = g.items[0];                        // newest ember in the group
          const fade = Math.min(1, (Date.now() - new Date(newest.created_at).getTime()) / (24*3600*1000));
          const bright = 1 - 0.35 * fade;                   // 1 → 0.65 over 24h
          return (
            <button
              key={g.user.id + g.lastAt}
              onClick={() => setOpenAt(i)}
              className="group relative h-20 w-20 shrink-0 rounded-full p-[3px] transition-transform hover:-translate-y-0.5"
              title={g.user.display_name || g.user.username || "Embers"}
              style={{ filter: `brightness(${bright})` }}
            >
              {/* Ring shows unread */}
              <div className={`absolute inset-0 rounded-full ${g.hasUnseen
                ? "bg-[conic-gradient(at_50%_50%,_#fbbf24_0deg,_#34d399_120deg,_#065f46_300deg,_#fbbf24_360deg)]"
                : "bg-emerald-800/40"} blur-[1px]`} />
              <div className={`relative grid h-full w-full place-items-center rounded-full
                               bg-emerald-950/50 ring-1 ring-emerald-700/50 backdrop-blur`}>
                <img
                  src={g.user.avatar_url || "/avatar.png"}
                  alt=""
                  className="h-[70px] w-[70px] rounded-full object-cover"
                  loading="lazy"
                />
              </div>
              <span className="absolute -bottom-5 w-[92px] truncate text-center text-[12px] text-emerald-200/80">
                {g.user.display_name || g.user.username || "User"}
              </span>
            </button>
          );
        })}
      </div>

      {openAt !== null && (
        <EmberViewer
          groups={groups}
          startIndex={openAt}
          onClose={() => setOpenAt(null)}
          onUpdateGroups={setGroups}
        />
      )}
    </>
  );
}
