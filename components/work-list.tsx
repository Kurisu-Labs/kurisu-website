import type { Project } from '@/lib/content/schema';
import { humanize } from '@/lib/site';
import { Arrow } from './icons';
export function WorkList({ projects }: { projects: Project[] }) {
  return (
    <div className="work-list">
      {projects.map((project) => (
        <article className="work-row" key={project.slug}>
          <div className="work-period">
            <span className={`status status-${project.status}`}>{humanize(project.status)}</span>
            <span>{project.period}</span>
          </div>
          <div>
            <p className="meta">
              {humanize(project.type)}
              {project.ecosystems.length ? ` / ${project.ecosystems.join(', ')}` : ''}
            </p>
            <h3>
              <a href={`/work/${project.slug}`}>
                {project.title}
                <Arrow />
              </a>
            </h3>
            <p>{project.summary}</p>
            <p className="attribution">{project.attributionNote}</p>
            <div className="artifact-links">
              {project.links.repository && (
                <a href={project.links.repository}>
                  View source <Arrow external />
                </a>
              )}
              {project.links.docs && (
                <a href={project.links.docs}>
                  Read the docs <Arrow external />
                </a>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
