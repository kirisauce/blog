import { m3anim, type Animation as CustomAnimation } from '../utils/consts';

const STATE_KEY = 'data-toggler-state';
const ANIM_ID_KEY = 'data-toggler-anim-id';
const PRESET_KEY = 'data-toggle-preset';

export interface AnimationParamters {
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
}

export interface TogglePreset {
  enter: AnimationParamters;
  exit: AnimationParamters;
}

namespace genpreset {
  export const dropdown = (opts: CustomAnimation) => ({
    enter: {
      keyframes: [
        { opacity: 0, transform: 'translateY(-40%) scale(0.5)' },
        { opacity: 1, transform: 'translateY(0) scale(1.0)' },
      ],
      options: { ...opts },
    },
    exit: {
      keyframes: [
        { opacity: 1, transform: 'translateY(0) scale(1.0)' },
        { opacity: 0, transform: 'translateY(-60%) scale(0.65)' },
      ],
      options: { ...opts },
    },
  });
}

export const PRESETS: Record<string, TogglePreset> = {
  fade: {
    enter: {
      keyframes: [{ opacity: 0 }, { opacity: 1 }],
      options: { ...m3anim.expressiveSlowEffects },
    },
    exit: {
      keyframes: [{ opacity: 1 }, { opacity: 0 }],
      options: { ...m3anim.expressiveSlowEffects },
    },
  },

  dropdown: genpreset.dropdown(m3anim.expressiveDefaultEffects),
  'dropdown-fast': genpreset.dropdown(m3anim.expressiveFastEffects),
} as const;

const generateId = () =>
  Math.random()
    .toString(36)
    .slice(2, 2 + 8);

export interface AutoCloseHandler {
  eventHandler: any;
  eventName: string;
  ignoreEvent?: Event;

  ignore?: (event: Event) => void;
}

const autoCloseHandlerMap = new WeakMap<HTMLElement, AutoCloseHandler>();

export interface ToggleOptions {
  /**
   * Preset name for the toggle animation.
   *
   * This value will override the configured value existing in the DOM element (data-toggle-preset).
   */
  presetName?: string;

  /**
   * Preset. This value overrides all preset name set in other places.
   */
  preset?: TogglePreset;

  /**
   * If `autoClose` is set to true, `toggle` will attach a one-time click listener
   * to the document element. And when it triggers, it will hide the element.
   *
   * In common cases, you should also add a click event listener to the target element,
   * which calls `Event.stopPropagation()`. This filters out clicks inside the element,
   * preventing unintented 'auto closing'.
   */
  autoCloseWhen?: 'pointerdown' | 'pointerup' | 'pointerout' | 'click';
}

export interface ToggleResult {
  /**
   * The triggered animation.
   */
  animation: Animation;

  /**
   * The auto close handler.
   */
  autoCloseHandler: WeakRef<AutoCloseHandler> | undefined;
}

export const toggle = (
  el: HTMLElement,
  options?: ToggleOptions,
): ToggleResult => {
  const {
    presetName,
    autoCloseWhen: autoCloseWhen,
    preset: configuredPreset,
  } = options ?? {};

  let currentState = el.getAttribute(STATE_KEY);
  if (!currentState) {
    currentState =
      el.computedStyleMap().get('display') === 'none' ? 'hide' : 'show';
    el.setAttribute(STATE_KEY, currentState);
  }

  // Cancel previous animation
  const previousAnimId = el.getAttribute(ANIM_ID_KEY);
  if (previousAnimId) {
    const anim = el.getAnimations().find((anim) => anim.id === previousAnimId);
    try {
      anim?.commitStyles();
    } catch (err) {}
    anim?.cancel();
  }

  // Remove previous auto-close listener if it exists
  if (autoCloseHandlerMap.has(el)) {
    const { eventHandler: handler, eventName } = autoCloseHandlerMap.get(el)!;
    document.removeEventListener(eventName, handler);
    autoCloseHandlerMap.delete(el);
  }

  // Decide which preset will be used
  const preset =
    configuredPreset ??
    PRESETS[presetName ? presetName : (el.getAttribute(PRESET_KEY) ?? 'fade')];

  if (currentState === 'show') {
    // From show to hide (exit)
    el.setAttribute(STATE_KEY, 'hide');
    const { keyframes, options } = preset.exit;

    // Configure the animation
    const anim = el.animate(keyframes, options);
    anim.id = generateId();
    anim.addEventListener('finish', (ev) => {
      el.style.display = 'none';
      el.removeAttribute(ANIM_ID_KEY);
    });
    el.setAttribute(ANIM_ID_KEY, anim.id);

    anim.play();
    return {
      animation: anim,
      autoCloseHandler: undefined,
    };
  } else if (currentState === 'hide') {
    // From hide to show (enter)
    el.setAttribute(STATE_KEY, 'show');
    const { keyframes, options } = preset.enter;

    // Configure the animation
    const anim = el.animate(keyframes, options);
    anim.id = generateId();
    anim.addEventListener('finish', (ev) => {
      el.removeAttribute(ANIM_ID_KEY);
      try {
        anim.commitStyles();
      } catch (err) {}
    });
    el.style.display = '';
    el.setAttribute(ANIM_ID_KEY, anim.id);

    // Set up auto close listener
    let autoCloseHandler: undefined | WeakRef<AutoCloseHandler>;
    if (autoCloseWhen !== undefined) {
      const eventHandler = (ev: Event) => {
        if (ev !== autoCloseHandler?.deref()?.ignoreEvent) {
          toggle(el, { autoCloseWhen: undefined });
          document.removeEventListener(autoCloseWhen, eventHandler);
        }
      };
      document.addEventListener(autoCloseWhen, eventHandler);

      const autoCloseHandlerRaw = {
        eventHandler,
        eventName: autoCloseWhen,
        ignoreEvent: undefined,

        ignore(event) {
          this.ignoreEvent = event;
        },
      } satisfies AutoCloseHandler;
      autoCloseHandler = new WeakRef(autoCloseHandlerRaw);
      autoCloseHandlerMap.set(el, autoCloseHandlerRaw);
    }

    anim.play();
    return {
      animation: anim,
      autoCloseHandler,
    };
  } else {
    throw new Error(`Invalid state: ${currentState}`);
  }
};

export const getAutoClose = (el: HTMLElement) => autoCloseHandlerMap.get(el);
