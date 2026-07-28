import { HeroDotField } from "./HeroDotField";
import { PageFrame } from "./SiteChrome";

export type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <PageFrame>
      <section className="legal-hero">
        <HeroDotField />
        <div className="route-container">
          <p>Effective July 27, 2026</p>
          <h1>{title}</h1>
          <span>{intro}</span>
        </div>
      </section>
      <section className="legal-section">
        <div className="route-container legal-layout">
          <aside aria-label="On this page">
            <strong>On this page</strong>
            {sections.map((section, index) => (
              <a href={`#legal-${index + 1}`} key={section.title}>
                {section.title}
              </a>
            ))}
          </aside>
          <div className="legal-copy">
            {sections.map((section, index) => (
              <section id={`legal-${index + 1}`} key={section.title}>
                <h2>{section.title}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets && <ul>{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>}
              </section>
            ))}
          </div>
        </div>
      </section>
    </PageFrame>
  );
}
