import type { AnchorHTMLAttributes } from 'react';
// Standalone harness renders ordinary anchors; production uses Next's real Link.
export default function Link(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} />;
}
