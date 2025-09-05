import React from "react";
import { Link } from "react-router-dom";

const TAG_RE = /#([A-Za-z0-9_]{2,64})/g;
const AT_RE  = /@([A-Za-z0-9_]{2,32})/g;

// Splits once using a regex and returns an array of parts preserving tokens
function splitWithRegex(text: string, re: RegExp) {
  const parts: Array<string | { token: string; value: string }> = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  re.lastIndex = 0;
  while ((m = re.exec(text)) !== null) {
    const start = m.index;
    if (start > lastIndex) parts.push(text.slice(lastIndex, start));
    parts.push({ token: m[0], value: m[1] });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

export function renderRichText(text: string) {
  // First split on hashtags
  const parts1 = splitWithRegex(text, TAG_RE).flatMap((p): Array<string | { type: "tag"; value: string }> => {
    if (typeof p === "string") return [p];
    return [{ type: "tag", value: p.value }];
  });

  // Then split each plain string piece on @mentions
  const finalParts: Array<JSX.Element | string> = [];
  parts1.forEach((p, i) => {
    if (typeof p !== "string") {
      finalParts.push(
        <Link
          key={`tag-${i}-${(p as { value: string }).value}`}
          to={`/tag/${(p as { value: string }).value.toLowerCase()}`}
          className="text-emerald-300 hover:underline"
        >
          #{(p as { value: string }).value}
        </Link>
      );
      return;
    }
    const pieces = splitWithRegex(p, AT_RE);
    pieces.forEach((q, j) => {
      if (typeof q === "string") {
        finalParts.push(q);
      } else {
        finalParts.push(
          <Link
            key={`at-${i}-${j}-${q.value}`}
            to={`/@${q.value}`}
            className="text-emerald-300 hover:underline"
          >
            @{q.value}
          </Link>
        );
      }
    });
  });

  return <>{finalParts}</>;
}
