import { diffLines, diffWordsWithSpace } from "diff";
import type { Change } from "diff";

export function diffText(
  oldText: string,
  newText: string,
  mode: "words" | "lines" = "words",
) {
  const parts: Change[] =
    mode === "lines"
      ? diffLines(oldText || "", newText || "")
      : diffWordsWithSpace(oldText || "", newText || "");

  return parts.map((part) => ({
    value: part.value,
    added: !!part.added,
    removed: !!part.removed,
  }));
}

export function summarize(parts: Change[]) {
  let added = 0;
  let removed = 0;

  for (const p of parts) {
    if (p.added) {
      added += p.value.length;
    } else if (p.removed) {
      removed += p.value.length;
    }
  }

  return { added, removed };
}
