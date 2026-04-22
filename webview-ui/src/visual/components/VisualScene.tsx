import { useEffect, useRef, useCallback } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { VisualSceneModel } from '../theme/types';
import { startVelocityMotion } from '../effects/velocityMotion';
import { startStarfieldMotion } from '../effects/starfieldMotion';

interface VisualSceneProps {
  scene: VisualSceneModel;
  children: ReactNode;
}

export function VisualScene({ scene, children }: VisualSceneProps) {
  const velocityCleanup = useRef<(() => void) | null>(null);
  const starfieldCleanup = useRef<(() => void) | null>(null);

  const velocityRef = useCallback((el: HTMLDivElement | null) => {
    if (velocityCleanup.current) {
      velocityCleanup.current();
      velocityCleanup.current = null;
    }
    if (el) {
      velocityCleanup.current = startVelocityMotion(el);
    }
  }, []);

  const starfieldRef = useCallback((el: HTMLDivElement | null) => {
    if (starfieldCleanup.current) {
      starfieldCleanup.current();
      starfieldCleanup.current = null;
    }
    if (el) {
      const mult = Number(scene.cssVars['--scene-starfield-multiplier']) || 1;
      starfieldCleanup.current = startStarfieldMotion(el, { speedMultiplier: mult });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (velocityCleanup.current) {
        velocityCleanup.current();
        velocityCleanup.current = null;
      }
      if (starfieldCleanup.current) {
        starfieldCleanup.current();
        starfieldCleanup.current = null;
      }
    };
  }, []);

  return (
    <div
      className={scene.rootClassName}
      style={scene.cssVars as CSSProperties}
      data-theme-id={scene.theme.id}
      data-performance-tier={scene.performanceTier}
      data-flight-phase={scene.flightPhase}
      data-cockpit-alert={scene.cockpitAlert}
      data-active-effects={scene.activeEffects.join(',')}
    >
      <div className="visual-scene__layers" aria-hidden="true">
        {scene.layers.map((layer, index) => {
          const isVelocity = layer.className.includes('visual-layer--velocity');
          const isStarfield = layer.className.includes('visual-layer--starfield');
          return (
            <div
              key={`${layer.token}-${index}`}
              ref={isVelocity ? velocityRef : isStarfield ? starfieldRef : undefined}
              className={`visual-layer ${layer.className}`}
              style={{
                opacity: layer.opacity,
                ['--layer-speed' as string]: String(layer.speed || 0.01),
                ['--layer-duration' as string]: `${layer.duration}s`,
              } as CSSProperties}
            />
          );
        })}
      </div>
      <div className="visual-scene__content">{children}</div>
    </div>
  );
}
