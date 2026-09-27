import originals from "@/data/lookbook-originals.json";

export type LookbookOriginals = Record<string, Record<string, string>>;

const data = originals as LookbookOriginals;

export function getOriginalUrl(
  season: string,
  key: string,
): string | undefined {
  return data[season]?.[key];
}
