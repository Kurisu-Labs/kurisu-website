import Link from 'next/link';
import { directions } from '@/lib/site';
import { Arrow } from './icons';
import { ResearchNetworkMotion } from './research-network-motion';
import '@/styles/research-network.css';

/** Native radio controls keep the complete research explorer usable without JavaScript. */
export function ResearchNetwork({ id = 'research-network' }: { id?: string }) {
  return (
    <div className="research-network-shell">
      <div className="research-network-toolbar" aria-hidden="true">
        <span>Living research network</span>
        <span>
          Explore a direction <span className="research-network-toolbar-arrow">↗</span>
        </span>
      </div>
      <fieldset className="research-network" id={id}>
        <legend className="research-network-legend">Choose a research direction</legend>
        <div className="research-network-map">
          <svg
            className="research-network-svg"
            viewBox="0 0 760 280"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            <path className="research-network-orbit" d="M190 14H570L650 140 570 266H190L110 140Z" />
            <path
              className="research-network-trace research-network-trace-1"
              d="M380 140H270L190 60V14"
            />
            <path
              className="research-network-trace research-network-trace-2"
              d="M380 140H490L570 60V14"
            />
            <path
              className="research-network-trace research-network-trace-3"
              d="M380 140H490L570 220V266"
            />
            <path
              className="research-network-trace research-network-trace-4"
              d="M380 140H270L190 220V266"
            />
            <path
              className="research-network-pulse research-network-pulse-1"
              pathLength="100"
              d="M380 140H270L190 60V14"
            />
            <path
              className="research-network-pulse research-network-pulse-2"
              pathLength="100"
              d="M380 140H490L570 60V14"
            />
            <path
              className="research-network-pulse research-network-pulse-3"
              pathLength="100"
              d="M380 140H490L570 220V266"
            />
            <path
              className="research-network-pulse research-network-pulse-4"
              pathLength="100"
              d="M380 140H270L190 220V266"
            />
            <circle
              className="research-network-port research-network-port-1"
              cx="190"
              cy="14"
              r="4"
            />
            <circle
              className="research-network-port research-network-port-2"
              cx="570"
              cy="14"
              r="4"
            />
            <circle
              className="research-network-port research-network-port-3"
              cx="570"
              cy="266"
              r="4"
            />
            <circle
              className="research-network-port research-network-port-4"
              cx="190"
              cy="266"
              r="4"
            />
            <path
              className="research-network-registration"
              d="M20 28V12h16M724 12h16v16M20 252v16h16M724 268h16v-16"
            />
          </svg>
          <svg
            className="research-network-hub"
            viewBox="0 0 140 140"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <circle className="research-network-core-aura" cx="70" cy="70" r="48" />
            <g className="research-network-rotor">
              <circle className="research-network-halo" cx="70" cy="70" r="65" />
              <ellipse
                className="research-network-orbital-ring"
                cx="70"
                cy="70"
                rx="62"
                ry="47"
                transform="rotate(-30 70 70)"
              />
              <circle className="research-network-orbital-dot" cx="70" cy="5" r="3" />
              <circle
                className="research-network-orbital-dot research-network-orbital-dot-secondary"
                cx="70"
                cy="135"
                r="2"
              />
            </g>
            <circle className="research-network-core" cx="70" cy="70" r="35" />
          </svg>
          <button
            className="research-network-next"
            type="button"
            data-network-next
            aria-label="Next direction in research network"
            title="Show the next research direction"
            hidden
          >
            <span data-network-counter aria-hidden="true">
              01 / {String(directions.length).padStart(2, '0')}
            </span>
            <span aria-hidden="true">
              Next
              <br />
              direction <span className="research-network-next-arrow">↗</span>
            </span>
          </button>
          <span className="research-network-center-label" aria-hidden="true">
            Four research
            <br />
            directions
          </span>
        </div>
        {directions.map((direction, index) => {
          const controlId = `${id}-${direction.id}`;
          return (
            <div
              className={`research-network-option research-network-option-${index + 1}`}
              key={direction.id}
            >
              <input
                className="research-network-radio"
                type="radio"
                id={controlId}
                name={`${id}-direction`}
                value={direction.id}
                defaultChecked={index === 0}
                aria-controls={`${controlId}-detail`}
                aria-describedby={`${controlId}-question`}
              />
              <label className="research-network-node" htmlFor={controlId}>
                <span className="research-network-node-signal" aria-hidden="true" />
                <span className="research-network-node-copy">
                  <span className="research-network-node-index" aria-hidden="true">
                    Direction / 0{index + 1}
                  </span>
                  <span className="research-network-node-title">{direction.title}</span>
                </span>
                <span className="research-network-node-indicator" aria-hidden="true">
                  ↗
                </span>
              </label>
              <section
                className="research-network-detail"
                id={`${controlId}-detail`}
                aria-labelledby={`${controlId}-title`}
              >
                <p className="research-network-detail-index" aria-hidden="true">
                  Research direction / 0{index + 1}
                </p>
                <h3 id={`${controlId}-title`}>{direction.title}</h3>
                <p className="research-network-question" id={`${controlId}-question`}>
                  {direction.question}
                </p>
                <p className="research-network-description">{direction.description}</p>
                <Link className="research-network-link" href={`/research#${direction.id}`}>
                  Explore this direction <Arrow />
                </Link>
              </section>
            </div>
          );
        })}
      </fieldset>
      <p
        className="research-network-status"
        data-network-status
        aria-live="polite"
        aria-atomic="true"
      />
      <p className="research-network-help">
        Select a direction to explore. Use arrow keys when a direction is focused.
      </p>
      <ResearchNetworkMotion networkId={id} />
    </div>
  );
}
