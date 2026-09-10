export const PARENT_SEASONS = ["spring", "summer", "autumn", "winter"] as const;
export type ParentSeason = (typeof PARENT_SEASONS)[number];

export const PARENT_SEASON_COLORS: Record<ParentSeason, { name: string; hex: string }[]> = {
  spring: [{"name":"Coral","hex":"#FF6B6B"},{"name":"Warm Peach","hex":"#FFBE98"},{"name":"Golden Yellow","hex":"#FFD700"},{"name":"Warm Green","hex":"#7CB342"},{"name":"Turquoise","hex":"#40E0D0"}],
  summer: [{"name":"Lavender","hex":"#B39DDB"},{"name":"Dusty Rose","hex":"#DCAE96"},{"name":"Slate Blue","hex":"#6A89A7"},{"name":"Soft Teal","hex":"#80CBC4"},{"name":"Mauve","hex":"#C4A4B5"}],
  autumn: [{"name":"Burnt Orange","hex":"#CC5500"},{"name":"Olive Green","hex":"#6B8E23"},{"name":"Rust","hex":"#B7410E"},{"name":"Mustard","hex":"#E1AD01"},{"name":"Teal","hex":"#008080"}],
  winter: [{"name":"True Red","hex":"#C41E3A"},{"name":"Royal Blue","hex":"#4169E1"},{"name":"Emerald","hex":"#046307"},{"name":"Hot Pink","hex":"#FF1493"},{"name":"Pure White","hex":"#FFFFFF"}],
};

export const PARENT_SEASON_RELATED_BLOGS: Record<ParentSeason, string[]> = {
  spring: ["spring-color-palettes-decoded", "best-colors-for-warm-undertones", "best-makeup-colors-color-season"],
  summer: ["summer-color-palettes-decoded", "best-colors-for-cool-undertones", "best-hair-color-for-color-season"],
  autumn: ["autumn-color-palettes-decoded", "best-colors-for-warm-undertones", "capsule-wardrobe-color-season"],
  winter: ["winter-color-palettes-decoded", "best-colors-for-cool-undertones", "best-makeup-colors-color-season"],
};
