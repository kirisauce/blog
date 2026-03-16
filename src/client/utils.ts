export const mayStartViewTransition = (
  callbackOrOptions?: ViewTransitionUpdateCallback | StartViewTransitionOptions | undefined,
) => {
  if (!!document.startViewTransition) {
    return document.startViewTransition(callbackOrOptions);
  } else if (typeof callbackOrOptions === 'function') {
    callbackOrOptions();
  } else {
    callbackOrOptions?.update?.();
  }
};
