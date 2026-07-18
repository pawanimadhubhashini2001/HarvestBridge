export type UnauthorizedReason = 'expired' | 'unauthorized';

type UnauthorizedHandler = (reason: UnauthorizedReason) => Promise<void> | void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function registerUnauthorizedHandler(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler;

  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null;
    }
  };
}

export async function notifyUnauthorized(reason: UnauthorizedReason = 'unauthorized') {
  if (unauthorizedHandler) {
    await unauthorizedHandler(reason);
  }
}
