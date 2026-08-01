"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations();
  const nav = useTranslations("nav");
  const ft = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-baseline gap-1">
              <span className="font-serif text-2xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-gold bg-clip-text text-transparent">
                Belle
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                AI
              </span>
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              {ft("tagline")}
            </p>
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
                  href="/download"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {nav("download")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">{ft("legal")}</h3>
            <ul className="space-y-2 text-sm">
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
