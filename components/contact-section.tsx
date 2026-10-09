import { homeCopy, site } from '@/lib/site';
import { CopyButton } from './copy-button';
import { Arrow } from './icons';
export function ContactSection() {
  return (
    <section className="contact-section" id="contact" aria-labelledby="contact-title">
      <div className="container contact-inner">
        <div>
          <p className="eyebrow">Start a conversation</p>
          <h2 id="contact-title">
            What are you
            <br className="desktop-break" /> thinking about?
          </h2>
        </div>
        <div className="contact-actions">
          <p>
            A technical question, an early idea, or a research collaboration. We’d like to hear
            about it.
          </p>
          <a className="contact-email" href={`mailto:${site.email}`}>
            {site.email}
            <Arrow external />
          </a>
          <CopyButton
            value={site.email}
            label={homeCopy.copyFeedback.label}
            success={homeCopy.copyFeedback.success}
            failure={homeCopy.copyFeedback.error}
          />
        </div>
      </div>
    </section>
  );
}
