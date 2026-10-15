import { directions } from '@/lib/site';
export function ResearchDirections() {
  return (
    <div className="directions-list">
      {directions.map((direction) => (
        <section
          className="direction-row"
          key={direction.id}
          id={direction.id}
          aria-labelledby={`${direction.id}-title`}
          data-scroll-focus
        >
          <h3 id={`${direction.id}-title`} data-scroll-reveal>
            {direction.title}
          </h3>
          <div className="direction-copy" data-scroll-reveal>
            <p className="direction-question">{direction.question}</p>
            <p className="direction-description">{direction.description}</p>
          </div>
        </section>
      ))}
    </div>
  );
}
