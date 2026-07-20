interface Rewrite {
  original: string;
  rewritten: string;
}

export function applyRewriteToText(rawText: string, rewrites: Rewrite[]) {
  let result = rawText;

  for (const r of rewrites) {
    if (!r.original || !r.rewritten) continue;

    const idx = result.indexOf(r.original);

    if (idx >= 0) {
      result =
        result.slice(0, idx) +
        r.rewritten +
        result.slice(idx + r.original.length);
    } else {
      result += `\n${r.rewritten}`;
    }
  }

  return result;
}

export function patchBulletsInSections(sections: unknown, rewrites: Rewrite[]) {
  if (!sections) return null;
  const cloned = JSON.parse(JSON.stringify(sections));
  for (const r of rewrites) {
    if (!r.original || !r.rewritten) continue;
    for (const exp of cloned.experience || {}) {
      if (!Array.isArray(exp.bullets)) continue;
      exp.bullets = exp.bullets.map((b: string) => {
        b === r.original ? r.rewritten : b;
      });
    }
  }
  return cloned;
}
