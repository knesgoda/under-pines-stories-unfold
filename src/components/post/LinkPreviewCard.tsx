'use client';

type Props = {
  url: string;
  title?: string;
  description?: string;
  image_url?: string;
  site_name?: string;
  compact?: boolean;
};

export default function LinkPreviewCard({ url, title, description, image_url, site_name, compact }: Props) {
  const hostname = (() => {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
  })();

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg overflow-hidden border border-white/10 bg-background-panel hover:bg-white/5 transition"
    >
      {image_url && !compact && (
        <div className="relative w-full pt-[52%]">
          <img
            src={image_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-3">
        <div className="text-xs text-text-light/60">{site_name || hostname}</div>
        {title && <div className="mt-1 text-sm font-semibold text-text-light line-clamp-2">{title}</div>}
        {description && <div className="mt-1 text-xs text-text-light/70 line-clamp-2">{description}</div>}
      </div>
    </a>
  );
}

