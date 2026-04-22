import type { CSSProperties, ReactNode } from 'react';
import type { MonitorSceneModel } from './monitorTypes';

interface MonitorViewportShellProps {
  monitor: MonitorSceneModel;
  children: ReactNode;
}

export function MonitorViewportShell({ monitor, children }: MonitorViewportShellProps) {
  if (!monitor.animationsEnabled && !monitor.frameClassName.includes('monitor-frame')) {
    // Frame disabled — render children directly
    return <>{children}</>;
  }

  return (
    <div
      className={monitor.frameClassName}
      style={monitor.cssVars as CSSProperties}
      data-monitor-theme={monitor.theme.id}
    >
      {/* Corner brackets */}
      <div className="monitor-corner monitor-corner--tl" aria-hidden="true" />
      <div className="monitor-corner monitor-corner--tr" aria-hidden="true" />
      <div className="monitor-corner monitor-corner--bl" aria-hidden="true" />
      <div className="monitor-corner monitor-corner--br" aria-hidden="true" />

      {/* Top bezel bar with status lights */}
      <div className="monitor-bezel monitor-bezel--top" aria-hidden="true">
        <span className="monitor-bezel__label">SIGNAL DECRYPTION TERMINAL</span>
        <div className={monitor.statusClassName}>
          <span className="monitor-status__dot" />
        </div>
      </div>

      {/* Signal scan overlay */}
      <div className="monitor-scan-overlay" aria-hidden="true" />

      {/* Alert strip */}
      <div className="monitor-alert-strip" aria-hidden="true" />

      {/* Content viewport */}
      <div className="monitor-viewport">
        {children}
      </div>

      {/* Bottom bezel */}
      <div className="monitor-bezel monitor-bezel--bottom" aria-hidden="true">
        <span className="monitor-bezel__label monitor-bezel__label--dim">SYS.ONLINE</span>
      </div>
    </div>
  );
}
