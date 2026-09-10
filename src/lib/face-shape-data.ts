export interface FaceShapeData {
  slug: string;
  name: string;
  description: string;
  characteristics: {
    proportions: string;
    jawline: string;
    forehead: string;
    cheekbones: string;
  };
  bestHairstyles: string[];
  avoidHairstyles: string[];
  bangsGuide: string;
  glassesFrames: {
    best: string[];
    avoid: string[];
  };
  makeupTips: string[];
  celebrities: string[];
  relatedSlugs: string[];
}

export const FACE_SHAPE_SLUGS = [
  "oval",
  "round",
  "square",
  "heart",
  "oblong",
  "diamond",
  "triangle",
] as const;

export type FaceShapeSlug = (typeof FACE_SHAPE_SLUGS)[number];

export const FACE_SHAPES: Record<string, FaceShapeData> = {
  oval: {
    slug: "oval",
    name: "Oval",
    description:
      "Considered the most versatile face shape with balanced proportions. The face is slightly longer than wide, with a gently rounded jawline and forehead that narrows smoothly toward the chin.",
    characteristics: {
      proportions: "Face length is about 1.5× the width, with balanced upper and lower halves",
      jawline: "Gently rounded with a soft, slightly narrowed chin",
      forehead: "Slightly wider than the jawline but not prominently so",
      cheekbones: "The widest part of the face, creating a subtle curve",
    },
    bestHairstyles: [
      "Long layers with face-framing pieces",
      "Classic bob or lob (long bob)",
      "Side-parted waves or curls",
      "Textured pixie cuts",
      "Sleek, straight styles at any length",
    ],
    avoidHairstyles: [
      "Very heavy, blunt bangs that cover the forehead entirely",
      "Overly voluminous styles that add too much width",
    ],
    bangsGuide:
      "Almost any bangs style works — side-swept, curtain, wispy, or micro bangs all complement oval faces beautifully.",
    glassesFrames: {
      best: [
        "Virtually any frame shape works",
        "Rectangular or square frames for a structured look",
        "Cat-eye frames for vintage elegance",
        "Aviators for a classic, balanced style",
      ],
      avoid: [
        "Oversized frames that overwhelm your proportions",
        "Very narrow frames that look too small",
      ],
    },
    makeupTips: [
      "Light contouring under cheekbones to enhance natural bone structure",
      "Highlight the center of the forehead, nose bridge, and chin",
      "Blush applied to the apples of the cheeks, blended upward toward temples",
      "Keep brows naturally arched — avoid over-plucking",
    ],
    celebrities: ["Bella Hadid", "Beyoncé", "Jessica Alba"],
    relatedSlugs: [
      "face-shape-hairstyle-guide",
      "best-glasses-for-face-shape",
      "best-earring-styles-face-shape",
    ],
  },
  round: {
    slug: "round",
    name: "Round",
    description:
      "A youthful face shape where width and length are nearly equal. Characterized by full cheeks, a rounded jawline, and soft angles that give a friendly, approachable appearance.",
    characteristics: {
      proportions: "Width and length are approximately equal",
      jawline: "Soft, curved jawline with no sharp angles",
      forehead: "Rounded, similar width to the jawline",
      cheekbones: "Full and prominent, the widest point of the face",
    },
    bestHairstyles: [
      "Long layers that elongate the face",
      "Side parts to create asymmetry and visual length",
      "Asymmetrical bobs or angled lobs",
      "High-volume styles with height at the crown",
      "Face-framing layers below the chin",
    ],
    avoidHairstyles: [
      "Chin-length bobs that accentuate roundness",
      "Center parts with straight, flat hair",
      "Very rounded or curly styles at ear level",
      "Blunt, straight-across bangs",
    ],
    bangsGuide:
      "Side-swept or diagonal bangs work best to create angles. Avoid blunt, straight-across bangs that emphasize the face's circular shape.",
    glassesFrames: {
      best: [
        "Angular or rectangular frames to add definition",
        "Cat-eye frames to lift and elongate",
        "Geometric or square frames for contrast",
        "Browline frames for structure at the top",
      ],
      avoid: [
        "Small, round frames that mirror the face shape",
        "Rimless frames that lack structure",
      ],
    },
    makeupTips: [
      "Contour the sides of the forehead and under the cheekbones to create dimension",
      "Apply bronzer along the jawline to slim and define",
      "Highlight the center of the face vertically — forehead, nose, chin",
      "Use angular brow shapes to add structure",
      "Apply blush slightly higher, along the cheekbone ridge",
    ],
    celebrities: ["Selena Gomez", "Chrissy Teigen", "Ginnifer Goodwin"],
    relatedSlugs: [
      "face-shape-hairstyle-guide",
      "best-glasses-for-face-shape",
      "best-earring-styles-face-shape",
    ],
  },
  square: {
    slug: "square",
    name: "Square",
    description:
      "A strong, angular face shape with a prominent jawline. The forehead, cheekbones, and jaw are approximately the same width, creating a powerful, structured appearance.",
    characteristics: {
      proportions: "Width and length are similar, with equal-width forehead, cheeks, and jaw",
      jawline: "Strong, angular with sharp corners",
      forehead: "Broad and straight, matching the jaw width",
      cheekbones: "Flat or minimal prominence, aligned with jaw and forehead",
    },
    bestHairstyles: [
      "Soft waves and curls to soften angular features",
      "Long, layered cuts past the shoulders",
      "Side-swept styles that break up the symmetry",
      "Textured, tousled styles with movement",
      "Rounded bobs that soften the jawline",
    ],
    avoidHairstyles: [
      "Blunt, chin-length cuts that emphasize the jaw",
      "Straight, severe styles with no texture",
      "Very short crops that expose the angular jaw fully",
    ],
    bangsGuide:
      "Soft, wispy bangs or side-swept bangs help round the forehead. Avoid blunt, straight bangs that create another horizontal line across the face.",
    glassesFrames: {
      best: [
        "Round or oval frames to contrast the angular jawline",
        "Rimless frames for a softer look",
        "Cat-eye or butterfly frames to lift the face",
        "Frames with curved edges and thin temples",
      ],
      avoid: [
        "Boxy, angular frames that mirror the jaw shape",
        "Very small frames that emphasize the wide jaw",
      ],
    },
    makeupTips: [
      "Contour the corners of the forehead and jawline to soften angles",
      "Apply blush in a round, circular motion on the apples of cheeks",
      "Highlight the center of the face and under the eyes",
      "Opt for softly arched brows rather than angular shapes",
      "Use bronzer along the jaw corners to visually round the face",
    ],
    celebrities: ["Angelina Jolie", "Margot Robbie", "Keira Knightley"],
    relatedSlugs: [
      "face-shape-hairstyle-guide",
      "best-glasses-for-face-shape",
      "best-earring-styles-face-shape",
    ],
  },
  heart: {
    slug: "heart",
    name: "Heart",
    description:
      "A romantic face shape widest at the forehead and cheekbones, tapering to a delicate, pointed chin. Often features a widow's peak hairline and high cheekbones.",
    characteristics: {
      proportions: "Wider forehead narrowing to a pointed chin",
      jawline: "Narrow with a small, V-shaped or pointed chin",
      forehead: "The widest part of the face, often with a widow's peak",
      cheekbones: "High and prominent, contributing to the widest area",
    },
    bestHairstyles: [
      "Chin-length bobs to add width at the jaw",
      "Side-parted waves or soft curls",
      "Medium-length layers starting at the chin",
      "Textured lobs with volume at the ends",
      "Curtain bangs to soften a wide forehead",
    ],
    avoidHairstyles: [
      "Slicked-back styles that expose the wide forehead",
      "Very short pixie cuts that emphasize the pointed chin",
      "High-volume styles at the crown that add more width up top",
    ],
    bangsGuide:
      "Curtain bangs and side-swept bangs help balance the wider forehead. Wispy, feathered bangs also work well. Avoid heavy, full bangs that make the chin look even narrower.",
    glassesFrames: {
      best: [
        "Bottom-heavy frames to balance the wider forehead",
        "Round or oval frames for softness",
        "Light-colored or rimless bottom frames",
        "Low-set frames that add visual weight below",
      ],
      avoid: [
        "Top-heavy or decorative frames on the brow line",
        "Cat-eye frames that further widen the upper face",
      ],
    },
    makeupTips: [
      "Contour the sides of the forehead to visually narrow it",
      "Highlight the chin and jawline to balance proportions",
      "Apply blush below the cheekbones, sweeping downward",
      "Define brows with a soft, rounded arch",
      "Use a slightly darker shade along the temples",
    ],
    celebrities: ["Scarlett Johansson", "Reese Witherspoon", "Taylor Swift"],
    relatedSlugs: [
      "face-shape-hairstyle-guide",
      "best-glasses-for-face-shape",
      "best-earring-styles-face-shape",
    ],
  },
  oblong: {
    slug: "oblong",
    name: "Oblong",
    description:
      "Also known as rectangular. An elongated face shape where the length significantly exceeds the width. Features a long, straight cheek line with forehead, cheeks, and jaw of similar width.",
    characteristics: {
      proportions: "Face is noticeably longer than wide, often 2× or more",
      jawline: "Can be angular (rectangular) or softly rounded",
      forehead: "Similar width to cheekbones and jaw",
      cheekbones: "Not prominently wide — face maintains uniform width",
    },
    bestHairstyles: [
      "Shoulder-length cuts with volume at the sides",
      "Waves and curls that add horizontal width",
      "Layered bobs at chin or jaw length",
      "Full, blunt bangs to shorten the face visually",
      "Side-parted styles with body and movement",
    ],
    avoidHairstyles: [
      "Very long, straight hair that elongates further",
      "Center parts with flat, sleek styles",
      "Excessive height or volume at the crown",
    ],
    bangsGuide:
      "Blunt bangs or thick, straight-across bangs are ideal to shorten the face visually. Curtain bangs and layered bangs also work well to break up the length.",
    glassesFrames: {
      best: [
        "Wide, oversized frames to add horizontal balance",
        "Decorative or bold temple designs",
        "Round or aviator styles to contrast the length",
        "Frames with a strong top line or browbar",
      ],
      avoid: [
        "Small, narrow frames that emphasize face length",
        "Tall or deep frames that add vertical emphasis",
      ],
    },
    makeupTips: [
      "Contour the forehead along the hairline and under the chin to shorten the face",
      "Apply blush horizontally across the cheeks to add width",
      "Highlight the cheekbones outward toward the temples",
      "Use a wider, flatter brow shape to create horizontal lines",
      "Avoid vertical highlight strips down the center of the face",
    ],
    celebrities: ["Sarah Jessica Parker", "Liv Tyler", "Gisele Bündchen"],
    relatedSlugs: [
      "face-shape-hairstyle-guide",
      "best-glasses-for-face-shape",
      "best-earring-styles-face-shape",
    ],
  },
  diamond: {
    slug: "diamond",
    name: "Diamond",
    description:
      "A rare and striking face shape with wide, high cheekbones and a narrow forehead and jawline. Creates a dramatic, angular appearance with distinct geometry.",
    characteristics: {
      proportions: "Widest at the cheekbones, narrow at forehead and jaw",
      jawline: "Narrow, tapering to a small, pointed chin",
      forehead: "Narrow and angular, significantly narrower than cheeks",
      cheekbones: "Very prominent and wide — the defining feature",
    },
    bestHairstyles: [
      "Chin-length bobs that add width at the jaw",
      "Side-swept bangs to widen the forehead visually",
      "Tucked-behind-ear styles to showcase cheekbones",
      "Medium layers with volume at the jaw level",
      "Textured, piece-y styles with movement",
    ],
    avoidHairstyles: [
      "Slicked-back styles that expose the narrow forehead",
      "Very tight, pulled-back ponytails",
      "Styles with maximum width at the cheekbones",
    ],
    bangsGuide:
      "Side-swept bangs add width to the narrow forehead. Curtain bangs also work beautifully. Avoid center-parted bangs that narrow the forehead further.",
    glassesFrames: {
      best: [
        "Oval or rimless frames for balance",
        "Cat-eye frames that widen the brow area",
        "Frames that are wider than the cheekbones",
        "Browline or top-heavy frames to balance the narrow forehead",
      ],
      avoid: [
        "Narrow frames that match the forehead width",
        "Angular frames that compete with cheekbone angles",
      ],
    },
    makeupTips: [
      "Highlight the forehead center and chin to balance narrow points",
      "Contour under the cheekbones to soften their prominence",
      "Apply blush on the apples of the cheeks, blending toward the center",
      "Use a lighter foundation shade on the forehead to make it appear wider",
      "Shape brows with a soft curve to widen the brow area",
    ],
    celebrities: ["Rihanna", "Vanessa Hudgens", "Ashley Greene"],
    relatedSlugs: [
      "face-shape-hairstyle-guide",
      "best-glasses-for-face-shape",
      "best-earring-styles-face-shape",
    ],
  },
  triangle: {
    slug: "triangle",
    name: "Triangle",
    description:
      "Also called pear-shaped. A face shape widest at the jawline, with a narrower forehead. Creates a stable, grounded appearance with a strong lower face.",
    characteristics: {
      proportions: "Jaw is wider than the forehead, face widens downward",
      jawline: "The widest part of the face, often strong and prominent",
      forehead: "Narrow, significantly less wide than the jaw",
      cheekbones: "Moderate width, between forehead and jaw measurements",
    },
    bestHairstyles: [
      "Volume and width at the top and temples",
      "Side-swept bangs to add fullness to the upper face",
      "Layered styles with volume at the crown",
      "Chin-length or shorter styles that don't add jaw width",
      "Textured pixie cuts with volume on top",
    ],
    avoidHairstyles: [
      "Chin-length bobs that add width at the jawline",
      "Straight, sleek styles that lay flat on top",
      "Very long hair that hangs straight past the jaw",
    ],
    bangsGuide:
      "Full, voluminous bangs and side-swept bangs help widen the forehead. Layered bangs with body at the top are ideal. Avoid wispy bangs that make the narrow forehead look even smaller.",
    glassesFrames: {
      best: [
        "Cat-eye or semi-rimless frames to widen the upper face",
        "Decorative top frames with bold brow lines",
        "Aviator styles for horizontal top emphasis",
        "Wider-at-top frames to balance the jaw",
      ],
      avoid: [
        "Bottom-heavy or narrow frames",
        "Frames that are narrower than the jawline",
      ],
    },
    makeupTips: [
      "Highlight the forehead, temples, and under-eye area to widen the upper face",
      "Contour along the jawline and under the chin to minimize width",
      "Apply blush higher on the cheekbones, angled upward",
      "Use a slightly deeper shade along the jawline edges",
      "Create fuller, wider brows to add width to the forehead area",
    ],
    celebrities: ["Kelly Osbourne", "Minnie Driver", "Jennifer Aniston"],
    relatedSlugs: [
      "face-shape-hairstyle-guide",
      "best-glasses-for-face-shape",
      "best-earring-styles-face-shape",
    ],
  },
};
