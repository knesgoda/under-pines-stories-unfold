import * as React from "react";
import { Image as ImageIcon, Film } from "lucide-react";

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

  return (
    <section className="relative">
      {/* Gradient rim + soft shadow */}
      <div className="rounded-[1.35rem] p-0.5 shadow-[0_10px_34px_rgba(0,0,0,0.35)]">
        <div className="pointer-events-none absolute inset-0 rounded-[1.35rem] bg-gradient-to-br from-emerald-500/20 via-amber-300/10 to-emerald-800/20 opacity-50 blur-xl" />
        {/* Card body */}
        <div className="relative rounded-[1.2rem] border border-emerald-900/35 bg-[#F8F6F2]">
          <div className="flex items-start gap-4 p-4">
            <img
              src={avatarUrl}
              alt="Your avatar"
              className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-emerald-700/30"
            />

            <div className="min-w-0 flex-1">
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="
                  w-full resize-y bg-transparent text-[17px] leading-7
                  text-slate-800 placeholder:text-slate-400
                  focus:outline-none
                "
              />
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
