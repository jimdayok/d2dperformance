// Reject unsolicited link-placement sales pitches, not ordinary SEO inquiries.
export function isUnsolicitedLinkPitch(value: unknown) {
  const text = String(value ?? "").normalize("NFKC").toLowerCase();
  const links = text.match(/(?:https?:\/\/|www\.)[^\s<>]+/g) ?? [];
  const linkService = /\b(?:backlinks?|guest\s+posts?|link\s+(?:building|placements?|insertions?))\b/.test(text);
  const salesOffer = /\b(?:my|our)\s+(?:blogs?|sites?|websites?|list)\b|\b(?:pricing\s+details|price\s+list|paid\s+(?:links?|posts?)|we\s+(?:offer|sell|provide)|i\s+(?:offer|sell|provide))\b/.test(text);
  return linkService && salesOffer && links.length >= 3;
}
