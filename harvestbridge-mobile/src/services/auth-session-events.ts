type UnauthorizedHandler = () => Promise<void> | void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function registerUnauthorizedHandler(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler;

  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null;
    }
  };
}

export async function notifyUnauthorized() {
  if (unauthorizedHandler) {
    await unauthorizedHandler();
  }
}
