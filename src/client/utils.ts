export const mayStartViewTransition = (
  callbackOrOptions?:
    ViewTransitionUpdateCallback | StartViewTransitionOptions | undefined,
) => {
  if (!!document.startViewTransition) {
    return document.startViewTransition(callbackOrOptions);
  } else if (typeof callbackOrOptions === 'function') {
    callbackOrOptions();
  } else {
    callbackOrOptions?.update?.();
  }
};

export const getGlobalPreferences = () => window['__PREFERENCES__'];

export const preferencesReadyThen = (cb: () => void) => {
  if (window.__PREFERENCES__) {
    cb();
  } else {
    if (window.__PREFERENCES_READY_CALLBACKS__ !== undefined) {
      window.__PREFERENCES_READY_CALLBACKS__.push(cb);
    } else {
      window.__PREFERENCES_READY_CALLBACKS__ = [cb];
    }
  }
};
