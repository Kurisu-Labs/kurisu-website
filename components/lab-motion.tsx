'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const pointerProperties = [
  '--pointer-x',
  '--pointer-y',
  '--tilt-x',
  '--tilt-y',
  '--pointer-shift-x',
  '--pointer-shift-y',
];
const motionProperties = [...pointerProperties, '--scroll-rotation', '--scroll-drift'];
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Optional decoration: content and controls never depend on this enhancement. */
export function LabMotion() {
  const pathname = usePathname();
  const previousPathname = useRef<string | null>(null);

  useEffect(() => {
    let skipInitialReveals =
      previousPathname.current !== null && previousPathname.current !== pathname;
    previousPathname.current = pathname;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const seenReveals = new WeakSet<Element>();
    let dispose = () => {};

    const configure = () => {
      dispose();
      dispose = () => {};
      if (reducedMotion.matches) return;

      const surfaces = [...document.querySelectorAll<HTMLElement>('[data-motion-surface]')];
      const fields = surfaces.filter((surface) => surface.dataset.motionSurface === 'field');
      const visibleFields = new Set<HTMLElement>();
      const ambientTargets = [
        ...document.querySelectorAll<HTMLElement | SVGElement>('[data-ambient-motion]'),
      ];
      const visibleAmbient = new Set<HTMLElement | SVGElement>();
      const reveals = [...document.querySelectorAll<HTMLElement>('[data-scroll-reveal]')];
      const readingTargets = [...document.querySelectorAll<HTMLElement>('[data-scroll-focus]')];
      const pendingPointers = new Map<HTMLElement, { x: number; y: number }>();
      const idlePointerTimers = new Map<HTMLElement, number>();
      const removeListeners: (() => void)[] = [];
      let frame = 0;
      let scrollPending = true;
      let disposed = false;

      const updateIdleActivity = () => {
        for (const field of fields) {
          field.dataset.idleRunning = String(
            visibleFields.has(field) &&
              !document.hidden &&
              !idlePointerTimers.has(field) &&
              !pendingPointers.has(field),
          );
        }
        for (const target of ambientTargets) {
          const running = String(visibleAmbient.has(target) && !document.hidden);
          if (target.dataset.ambientRunning !== running) target.dataset.ambientRunning = running;
        }
      };
      const pauseIdleForPointer = (field: HTMLElement) => {
        window.clearTimeout(idlePointerTimers.get(field));
        field.dataset.idleRunning = 'false';
        idlePointerTimers.set(
          field,
          window.setTimeout(() => {
            idlePointerTimers.delete(field);
            if (!disposed) updateIdleActivity();
          }, 600),
        );
      };

      const update = () => {
        frame = 0;
        if (disposed || document.hidden) return;
        for (const [surface, point] of pendingPointers) {
          const rect = surface.getBoundingClientRect();
          if (!rect.width || !rect.height) continue;
          const x = clamp((point.x - rect.left) / rect.width, 0, 1);
          const y = clamp((point.y - rect.top) / rect.height, 0, 1);
          surface.style.setProperty('--pointer-x', `${(x * 100).toFixed(2)}%`);
          surface.style.setProperty('--pointer-y', `${(y * 100).toFixed(2)}%`);
          if (surface.dataset.motionSurface === 'field') {
            surface.style.setProperty('--tilt-x', `${((0.5 - y) * 10).toFixed(2)}deg`);
            surface.style.setProperty('--tilt-y', `${((x - 0.5) * 10).toFixed(2)}deg`);
            surface.style.setProperty('--pointer-shift-x', `${((x - 0.5) * 12).toFixed(2)}px`);
            surface.style.setProperty('--pointer-shift-y', `${((y - 0.5) * 12).toFixed(2)}px`);
          } else if (surface.dataset.motionSurface === 'card') {
            surface.style.setProperty('--tilt-x', `${((0.5 - y) * 5).toFixed(2)}deg`);
            surface.style.setProperty('--tilt-y', `${((x - 0.5) * 5).toFixed(2)}deg`);
          }
          surface.dataset.pointerActive = 'true';
        }
        pendingPointers.clear();
        updateIdleActivity();
        if (scrollPending) {
          scrollPending = false;
          for (const field of visibleFields) {
            const rect = field.getBoundingClientRect();
            if (!rect.height || !rect.width) continue;
            const progress = clamp(
              (window.innerHeight / 2 - rect.top - rect.height / 2) /
                (window.innerHeight / 2 + rect.height / 2),
              -1,
              1,
            );
            field.style.setProperty('--scroll-rotation', `${(progress * 16).toFixed(2)}deg`);
            field.style.setProperty('--scroll-drift', `${(progress * 10).toFixed(2)}px`);
          }
        }
      };
      const requestUpdate = () => {
        if (!frame && !disposed) frame = window.requestAnimationFrame(update);
      };
      const onScroll = () => {
        if (!visibleFields.size || document.hidden) return;
        scrollPending = true;
        requestUpdate();
      };
      const observeFieldActivity = () => {
        updateIdleActivity();
        // Hidden mobile diagrams and offscreen fields do no scroll work.
        if (visibleFields.size) {
          window.addEventListener('scroll', onScroll, { passive: true });
          window.addEventListener('resize', onScroll, { passive: true });
          onScroll();
        } else {
          window.removeEventListener('scroll', onScroll);
          window.removeEventListener('resize', onScroll);
        }
      };

      const onActivityChange = () => {
        if (document.hidden) {
          window.cancelAnimationFrame(frame);
          frame = 0;
          pendingPointers.clear();
          idlePointerTimers.forEach((timer) => window.clearTimeout(timer));
          idlePointerTimers.clear();
          surfaces.forEach((surface) => {
            delete surface.dataset.pointerActive;
            motionProperties.forEach((property) => surface.style.removeProperty(property));
          });
        }
        updateIdleActivity();
        if (!document.hidden) onScroll();
      };
      document.addEventListener('visibilitychange', onActivityChange);

      for (const surface of surfaces) {
        surface.dataset.motionEnabled = 'true';
        if (!finePointer.matches) continue;
        const move = (event: PointerEvent) => {
          if (event.pointerType === 'touch' || document.hidden) return;
          pendingPointers.set(surface, { x: event.clientX, y: event.clientY });
          if (surface.dataset.motionSurface === 'field') pauseIdleForPointer(surface);
          requestUpdate();
        };
        const leave = () => {
          pendingPointers.delete(surface);
          window.clearTimeout(idlePointerTimers.get(surface));
          idlePointerTimers.delete(surface);
          delete surface.dataset.pointerActive;
          for (const property of pointerProperties) surface.style.removeProperty(property);
          updateIdleActivity();
        };
        surface.addEventListener('pointerenter', move, { passive: true });
        surface.addEventListener('pointermove', move, { passive: true });
        surface.addEventListener('pointerleave', leave, { passive: true });
        surface.addEventListener('pointercancel', leave, { passive: true });
        removeListeners.push(() => {
          surface.removeEventListener('pointerenter', move);
          surface.removeEventListener('pointermove', move);
          surface.removeEventListener('pointerleave', leave);
          surface.removeEventListener('pointercancel', leave);
        });
      }

      const observer =
        typeof IntersectionObserver === 'undefined'
          ? null
          : new IntersectionObserver(
              (entries) => {
                for (const entry of entries) {
                  if (!entry.isIntersecting || disposed) continue;
                  const element = entry.target as HTMLElement;
                  if (!seenReveals.has(element)) {
                    seenReveals.add(element);
                    element.dataset.scrollEntered = 'true';
                  }
                  observer?.unobserve(element);
                }
              },
              { threshold: 0.1, rootMargin: '0px 0px -4% 0px' },
            );
      reveals.forEach((element) => {
        if (skipInitialReveals) {
          // Next has restored route/hash scroll before this passive effect runs.
          // The page transition already introduced content visible at that position.
          const rect = element.getBoundingClientRect();
          if (
            rect.width > 0 &&
            rect.height > 0 &&
            rect.bottom > 0 &&
            rect.top < window.innerHeight &&
            rect.right > 0 &&
            rect.left < window.innerWidth
          )
            seenReveals.add(element);
        }
        if (!seenReveals.has(element)) observer?.observe(element);
      });
      skipInitialReveals = false;
      const fieldObserver =
        typeof IntersectionObserver === 'undefined'
          ? null
          : new IntersectionObserver((entries) => {
              if (disposed) return;
              for (const entry of entries) {
                const field = entry.target as HTMLElement;
                if (entry.isIntersecting && entry.boundingClientRect.width)
                  visibleFields.add(field);
                else visibleFields.delete(field);
              }
              observeFieldActivity();
            });
      fields.forEach((field) => fieldObserver?.observe(field));
      // One observer drives every small SVG loop; no per-frame JavaScript is needed.
      const ambientObserver =
        typeof IntersectionObserver === 'undefined'
          ? null
          : new IntersectionObserver((entries) => {
              if (disposed) return;
              for (const entry of entries) {
                const target = entry.target as HTMLElement | SVGElement;
                if (
                  entry.isIntersecting &&
                  entry.boundingClientRect.width > 0 &&
                  entry.boundingClientRect.height > 0
                )
                  visibleAmbient.add(target);
                else visibleAmbient.delete(target);
              }
              updateIdleActivity();
            });
      if (ambientObserver) {
        ambientTargets.forEach((target) => {
          target.dataset.ambientReady = 'true';
          target.dataset.ambientRunning = 'false';
          ambientObserver.observe(target);
        });
      }

      // A viewport band changes only decoration, never focus or the reading order.
      // Pixel margins use viewport height; IntersectionObserver's % margins use width.
      let readingObserver: IntersectionObserver | null = null;
      const observeReadingArea = () => {
        if (typeof IntersectionObserver === 'undefined' || disposed) return;
        readingObserver?.disconnect();
        readingObserver = new IntersectionObserver(
          (entries) => {
            if (disposed) return;
            for (const entry of entries) {
              const target = entry.target as HTMLElement;
              if (entry.isIntersecting) target.dataset.scrollFocused = 'true';
              else delete target.dataset.scrollFocused;
            }
          },
          {
            threshold: 0,
            rootMargin: `-${Math.round(window.innerHeight * 0.18)}px 0px -${Math.round(window.innerHeight * 0.32)}px 0px`,
          },
        );
        readingTargets.forEach((target) => readingObserver?.observe(target));
      };
      if (readingTargets.length) {
        observeReadingArea();
        window.addEventListener('resize', observeReadingArea, { passive: true });
      }
      requestUpdate();

      dispose = () => {
        disposed = true;
        window.cancelAnimationFrame(frame);
        observer?.disconnect();
        fieldObserver?.disconnect();
        ambientObserver?.disconnect();
        readingObserver?.disconnect();
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
        window.removeEventListener('resize', observeReadingArea);
        document.removeEventListener('visibilitychange', onActivityChange);
        removeListeners.forEach((remove) => remove());
        pendingPointers.clear();
        idlePointerTimers.forEach((timer) => window.clearTimeout(timer));
        idlePointerTimers.clear();
        surfaces.forEach((surface) => {
          delete surface.dataset.motionEnabled;
          delete surface.dataset.pointerActive;
          delete surface.dataset.idleRunning;
          motionProperties.forEach((property) => surface.style.removeProperty(property));
        });
        reveals.forEach((element) => {
          delete element.dataset.scrollEntered;
        });
        readingTargets.forEach((element) => {
          delete element.dataset.scrollFocused;
        });
        ambientTargets.forEach((target) => {
          delete target.dataset.ambientReady;
          delete target.dataset.ambientRunning;
        });
      };
    };

    configure();
    reducedMotion.addEventListener('change', configure);
    finePointer.addEventListener('change', configure);
    return () => {
      dispose();
      reducedMotion.removeEventListener('change', configure);
      finePointer.removeEventListener('change', configure);
    };
  }, [pathname]);

  return null;
}
