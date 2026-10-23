import { BrandLogo } from "@/components/BrandLogo";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const socialLinks = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/belleaicoloranalysis",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    name: "X",
    href: "https://x.com/BelleAIcolor",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/@coloranalysisbelleai",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    name: "Pinterest",
    href: "https://www.pinterest.com/coloranalysisbelleai",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.174.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />
      </svg>
    ),
  },
  {
    name: "Medium",
    href: "https://medium.com/@belleai",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
      </svg>
    ),
  },
];

export function Footer() {
  const nav = useTranslations("nav");
  const ft = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <BrandLogo />
            <p className="mt-2 text-sm text-muted-foreground">
              {ft("tagline")}
            </p>
            <div className="mt-4 flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">{ft("product")}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/personal-color-analysis" className="text-muted-foreground hover:text-foreground">{nav("colorAnalysis")}</Link></li>
              <li><Link href="/makeup-analysis" className="text-muted-foreground hover:text-foreground">{nav("makeupAnalysis")}</Link></li>
              <li><Link href="/face-shape-analysis" className="text-muted-foreground hover:text-foreground">{nav("faceAnalysis")}</Link></li>
              <li><Link href="/hair-color-analysis" className="text-muted-foreground hover:text-foreground">{ft("hairPreview")}</Link></li>
              <li><Link href="/outfit-color-analysis" className="text-muted-foreground hover:text-foreground">{ft("outfitColor")}</Link></li>
              <li><Link href="/glasses-analysis" className="text-muted-foreground hover:text-foreground">{ft("glassesMatch")}</Link></li>
              <li><Link href="/occasion-makeup" className="text-muted-foreground hover:text-foreground">{ft("occasionMakeup")}</Link></li>
              <li><Link href="/glow-up-report" className="text-muted-foreground hover:text-foreground">{ft("glowUpReport")}</Link></li>
              <li><Link href="/style-personality" className="text-muted-foreground hover:text-foreground">{ft("stylePersonality")}</Link></li>
              <li><Link href="/celebrity-match" className="text-muted-foreground hover:text-foreground">{ft("celebrityMatch")}</Link></li>
              <li><Link href="/jewelry-analysis" className="text-muted-foreground hover:text-foreground">{ft("jewelryGuide")}</Link></li>
              <li><Link href="/try" className="text-muted-foreground hover:text-foreground">{nav("tryNow")}</Link></li>
              <li><Link href="/pricing" className="text-muted-foreground hover:text-foreground">{nav("pricing")}</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">{ft("resources")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/color-analysis"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {nav("colorAnalysisGuide")}
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {nav("blog")}
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/color-quiz"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {nav("colorQuiz")}
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/face-shape-quiz"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {nav("faceQuiz")}
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/undertone-test"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {nav("undertoneTest")}
                </Link>
              </li>
              <li>
                <Link
                  href="/color-palette"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {ft("colorPalettes")}
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/embed"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {ft("embedQuizzes")}
                </Link>
              </li>
              <li>
                <Link
                  href="/vs/dressika"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {ft("vsDressika")}
                </Link>
              </li>
              <li>
                <Link
                  href="/vs/colorwise"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {ft("vsColorwise")}
                </Link>
              </li>
              <li>
                <Link
                  href="/vs"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {ft("vsAll")}
                </Link>
              </li>
              <li>
                <Link
                  href="/lookbook"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {ft("lookbook")}
                </Link>
              </li>
              <li>
                <Link
                  href="/transformations"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {ft("transformations")}
                </Link>
              </li>
              <li>
                <Link
                  href="/guides"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {ft("guides")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">{ft("company")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {ft("about")}
                </Link>
              </li>
              <li>
                <Link
                  href="/ai-color-analysis-accuracy"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {ft("aiAccuracy")}
                </Link>
              </li>
              <li>
                <Link
                  href="/press"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {ft("press")}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {ft("privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {ft("terms")}
                </Link>
              </li>
              <li>
                <Link
                  href="/acceptable-use"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {ft("acceptableUse")}
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@aicoloranalysis.io"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {ft("contact")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          {ft("copyright", { year })}
        </div>
      </div>
    </footer>
  );
}
