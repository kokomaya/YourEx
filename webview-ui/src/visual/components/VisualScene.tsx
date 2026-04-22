import type { CSSProperties, ReactNode } from 'react';
import type { VisualSceneModel } from '../theme/types';

interface VisualSceneProps {
  scene: VisualSceneModel;
  children: ReactNode;
}

export function VisualScene({ scene, children }: VisualSceneProps) {
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
        {scene.layers.map((layer, index) => (
          <div
            key={`${layer.token}-${index}`}
            className={`visual-layer ${layer.className}`}
            style={{
              opacity: layer.opacity,
              ['--layer-speed' as string]: String(layer.speed || 0.01),
              ['--layer-duration' as string]: `${layer.duration}s`,
            } as CSSProperties}
          />
        ))}
      </div>
      <div className="visual-scene__content">{children}</div>
    </div>
  );
}
