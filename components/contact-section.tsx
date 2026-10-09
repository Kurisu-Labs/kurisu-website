import { homeCopy, site } from '@/lib/site';
import { CopyButton } from './copy-button';
import { Arrow } from './icons';
export function ContactSection() {
  return (
    <section className="contact-section" id="contact" aria-labelledby="contact-title">
      <div className="container contact-inner">
        <div>
          <p className="eyebrow">{homeCopy.contact.eyebrow}</p>
          <h2 id="contact-title">{homeCopy.contact.title}</h2>
        </div>
        <div className="contact-actions">
          <p>{homeCopy.contact.body}</p>
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
