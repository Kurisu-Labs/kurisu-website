export function BrandMark({
  decorative = true,
  className = '',
}: {
  decorative?: boolean;
  className?: string;
}) {
  // Pre-optimized, local raster derivative. The original mark is never reconstructed.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`brand-mark ${className}`}
      src="/brand/kurisu-mark.webp"
      width="548"
      height="496"
      alt={decorative ? '' : 'Kurisu Labs'}
    />
  );
}
