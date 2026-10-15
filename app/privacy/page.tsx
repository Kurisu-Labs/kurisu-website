import { pageMetadata, site } from '@/lib/site';
export const metadata = pageMetadata(
  'Privacy',
  'How the Kurisu Labs website handles local interactions, external links, and email contact.',
  '/privacy',
);
export default function Privacy() {
  return (
    <article className="container legal-page">
      <p className="eyebrow">Website notice</p>
      <h1>Privacy</h1>
      <p className="lead">A simple website, with a direct way to get in touch.</p>
      <div className="prose">
        <h2>Using this website</h2>
        <p>
          This website does not embed analytics, advertising, social trackers, or a contact form.
          Fonts and brand assets are served with the website. The interface does not set cookies.
        </p>
        <h2>Your color theme</h2>
        <p>
          The website follows your device&apos;s color theme by default. If you choose Light or
          Dark, that preference is saved in this browser&apos;s local storage so it can be
          remembered on your next visit. It is not sent to us. Choosing System removes the saved
          preference. The theme control still works for the current visit when browser storage is
          unavailable.
        </p>
        <h2>Copying an address or code</h2>
        <p>
          Copy buttons write the selected text to your clipboard only when you activate them. They
          do not read your clipboard. If copying is unavailable, the text remains selectable.
        </p>
        <h2>External links and email</h2>
        <p>
          Links to GitHub and other external resources take you to services with their own privacy
          practices. Email links open your email application. Contacting us at{' '}
          <a href={`mailto:${site.email}`}>{site.email}</a> shares your message and email address
          with us through the email service.
        </p>
        <h2>Website infrastructure</h2>
        <p>
          Hosting infrastructure may process technical information, such as IP addresses and request
          logs, to deliver and protect the website. Provider-specific details will depend on the
          hosting arrangement used for the live site.
        </p>
        <h2>Questions</h2>
        <p>
          For questions about this website or information you have shared by email, contact{' '}
          <a href={`mailto:${site.email}`}>{site.email}</a>.
        </p>
      </div>
    </article>
  );
}
