/** Explain content lives at content/explain/<chapter>/<concept>.md. */
export function explainPath(chapter: string, concept: string): string {
  return `/explain/${chapter}/${concept}`
}

/** Parses a content path back into its curriculum slugs, or null if it is not an explain path. */
export function parseExplainPath(path: string): { chapter: string; concept: string } | null {
  const m = /^\/explain\/([a-z0-9-]+)\/([a-z0-9-]+)$/.exec(path)
  return m ? { chapter: m[1]!, concept: m[2]! } : null
}
