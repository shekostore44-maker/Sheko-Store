import "server-only"

import sanitizeHtml from "sanitize-html"

/**
 * Cleans product descriptions written in the admin editor before they are
 * rendered for visitors: keeps formatting tags only, drops scripts/styles/events.
 */
export function sanitizeDescription(html: string | null): string {
  if (!html) return ""
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "h2",
      "h3",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "ul",
      "ol",
      "li",
      "a",
    ],
    allowedAttributes: { a: ["href", "rel", "target"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener nofollow",
        target: "_blank",
      }),
    },
  })
}

/** Plain text excerpt for meta descriptions. */
export function textExcerpt(html: string | null, max = 160): string {
  const text = sanitizeHtml(html ?? "", { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim()
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}
