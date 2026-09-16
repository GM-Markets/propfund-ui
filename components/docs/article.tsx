import Link from "next/link";
import type { Metadata } from "next";

import { getAdjacentArticles, getHelpArticle, HELP_NAV } from "@/lib/docs/nav";

export function helpMetadata(slug: string): Metadata {
  const article = getHelpArticle(slug);
  return {
    title: `${article?.label ?? "Help"} | Propfund help`,
    description: article?.description,
  };
}

/** Wraps a help article: eyebrow, serif title, lede, body and previous/next links. */
export function HelpArticle({ slug, children }: { slug: string; children: React.ReactNode }) {
  const article = getHelpArticle(slug);
  const group = HELP_NAV.find((item) => item.items.some((entry) => entry.slug === slug));
  const { previous, next } = getAdjacentArticles(slug);

  return (
    <article className="help-article" data-help-article>
      <header className="help-article-head">
        <p>{group?.title ?? "Help center"}</p>
        <h1>{article?.label}</h1>
        {article?.description && <span>{article.description}</span>}
      </header>
      <div className="help-article-body">{children}</div>
      <footer className="help-article-foot">
        <nav aria-label="More articles">
          {previous ? (
            <Link href={previous.href}><small>Previous</small>{previous.label}</Link>
          ) : <span />}
          {next ? (
            <Link className="next" href={next.href}><small>Next</small>{next.label}</Link>
          ) : <span />}
        </nav>
        <p>Still need help? Email <a href="mailto:support@propfund.io">support@propfund.io</a>.</p>
      </footer>
    </article>
  );
}
