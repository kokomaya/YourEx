import { useCallback, useEffect, useRef } from 'react';

interface VSCodeApi {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

declare function acquireVsCodeApi(): VSCodeApi;

let cachedApi: VSCodeApi | undefined;

function getVSCodeApi(): VSCodeApi {
  if (!cachedApi) {
    cachedApi = acquireVsCodeApi();
  }
  return cachedApi;
}

export function useVSCode() {
  const api = useRef(getVSCodeApi());

  const postMessage = useCallback((message: unknown) => {
    api.current.postMessage(message);
  }, []);

  return {
    postMessage,
    getState: api.current.getState.bind(api.current),
    setState: api.current.setState.bind(api.current),
  };
}

export function useMessageListener(handler: (message: unknown) => void) {
  const savedHandler = useRef(handler);
  savedHandler.current = handler;

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      savedHandler.current(event.data);
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);
}
