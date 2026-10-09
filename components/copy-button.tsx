'use client';
import { useState, useSyncExternalStore } from 'react';
import { CopyIcon } from './icons';
const subscribe = () => () => {};
export function CopyButton({
  value,
  label,
  success,
  failure,
}: {
  value: string;
  label: string;
  success: string;
  failure: string;
}) {
  const [feedback, setFeedback] = useState('');
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return (
    <div className="copy-control">
      {hydrated && (
        <button
          type="button"
          className="copy-button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setFeedback(success);
            } catch {
              setFeedback(failure);
            }
          }}
        >
          <CopyIcon />
          {label}
        </button>
      )}
      <span className="copy-feedback" role="status" aria-live="polite">
        {feedback}
      </span>
    </div>
  );
}
