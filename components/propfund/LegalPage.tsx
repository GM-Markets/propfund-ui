import { HeroDotField } from "./HeroDotField";
import { PageFrame } from "./SiteChrome";

export type LegalSection = {
  title: string;
  paragraphs: React.ReactNode[];
  bullets?: React.ReactNode[];
  /** Optional closing paragraphs rendered after the bullets. */
  after?: React.ReactNode[];
};

export function LegalPage({
  title,
  intro,
  sections,
  effectiveDate = "September 15, 2026",
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
  effectiveDate?: string;
}) {
  return (
    <PageFrame>
      <section className="legal-hero">
        <HeroDotField />
        <div className="route-container">
          <p>Effective {effectiveDate}</p>
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
                {index + 1}. {section.title}
              </a>
            ))}
          </aside>
          <div className="legal-copy">
            {sections.map((section, index) => (
              <section id={`legal-${index + 1}`} key={section.title}>
                <h2>{index + 1}. {section.title}</h2>
                {section.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
                {section.bullets && <ul>{section.bullets.map((item, i) => <li key={i}>{item}</li>)}</ul>}
                {section.after?.map((paragraph, i) => <p className="legal-after" key={i}>{paragraph}</p>)}
              </section>
            ))}
          </div>
        </div>
      </section>
    </PageFrame>
  );
}
