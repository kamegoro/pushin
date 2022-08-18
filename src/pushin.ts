import { PushInScene } from './pushInScene';
import { PushInOptions } from './types';
import { PUSH_IN_LAYER_INDEX_ATTRIBUTE } from './constants';
import PushInBase from './pushInBase';

/**
 * PushIn object
 *
 * Once new object is created, it will initialize itself and
 * bind events to begin interacting with dom.
 */
export class PushIn extends PushInBase {
  public scene!: PushInScene;
  private pushinDebug?: HTMLElement;
  public target?: HTMLElement | null;
  public scrollY = 0;
  private lastAnimationFrameId = -1;
  public cleanupFns: VoidFunction[] = [];
  public options: PushInOptions;
  public scrollTarget?: HTMLElement | string;
  private targetHeight: number;

  /* istanbul ignore next */
  constructor(public container: HTMLElement, options?: PushInOptions) {
    super();
    options = options ?? {};

    this.options = {
      debug: options?.debug ?? false,
      scene: options?.scene ?? { breakpoints: [], inpoints: [] },
      target: options?.target ?? undefined,
      scrollTarget: options?.scrollTarget,
    };

    this.options.scene!.composition = options?.composition ?? undefined;
    this.options.scene!.layers = options?.layers ?? undefined;

    // Defaults
    this.targetHeight = 0;
    this.options.debug = options?.debug ?? false;
  }

  /**
   * Initialize the object to start everything up.
   */
  /* istanbul ignore next */
  start(): void {
    if (this.container) {
      this.setTarget();
      this.setScrollTarget();
      this.setTargetHeight();

      this.scrollY = this.getScrollY();

      if (this.options.debug) {
        this.showDebugger();
      }

      this.scene = new PushInScene(this);

      this.setScrollLength();
      this.setTargetOverflow();
      this.scene.resize();

      if (typeof window !== 'undefined') {
        this.bindEvents();
      }

      // Set layer initial state
      this.toggleLayers();
    } else {
      // eslint-disable-next-line no-console
      console.error(
        'No container element provided to pushIn.js. Effect will not be applied.'
      );
    }
  }

  /**
   * Set the target height on initialization.
   *
   * This will be used to calculate scroll length.
   *
   * @see setScrollLength
   */
  setTargetHeight() {
    this.targetHeight = window.innerHeight;
    if (this.target) {
      const computedHeight = getComputedStyle(this.target).height;

      // Remove px and convert to number
      this.targetHeight = +computedHeight.replace('px', '');
    }
  }

  /**
   * Get scrollTarget option from data attribute
   * or JavaScript API.
   */
  setScrollTarget(): void {
    const value = this.getStringOption('scrollTarget');
    let scrollTarget;

    if (value) {
      if (value === 'window') {
        scrollTarget = value;
      } else {
        scrollTarget = document.querySelector(<string>value);
      }
    }

    if (!scrollTarget) {
      if (this.target) {
        scrollTarget = this.target;
      } else {
        scrollTarget = 'window';
      }
    }

    this.scrollTarget = <HTMLElement | string>scrollTarget;
  }

  /**
   * Set the target parameter and make sure
   * pushin is always a child of that target.
   *
   * @param options
   */
  setTarget(): void {
    const value = <string>this.getStringOption('target');

    if (value) {
      this.target = document.querySelector(value);
    }

    if (this.target && this.container.parentElement !== this.target) {
      // Move pushin into the target container
      this.target.appendChild(this.container);
    }
  }

  /**
   * Does all necessary cleanups by removing event listeners.
   */
  destroy(): void {
    cancelAnimationFrame(this.lastAnimationFrameId);

    while (this.cleanupFns.length) {
      this.cleanupFns.pop()!();
    }
  }

  /**
   * If there is a window object,
   * get the current scroll position.
   *
   * Otherwise default to 0.
   */
  private getScrollY(): number {
    let scrollY = 0;

    if (this.scrollTarget === 'window' && typeof window !== 'undefined') {
      scrollY = window.scrollY;
    } else {
      const target = <HTMLElement>this.scrollTarget;
      if (target) {
        scrollY = target.scrollTop;
      }
    }

    return scrollY;
  }

  /**
   * Set overflow-y and scroll-behavior styles
   * on the provided target element.
   */
  private setTargetOverflow(): void {
    if (this.target && this.scrollTarget !== 'window') {
      this.target.style.overflowY = 'scroll';
      this.target.style.scrollBehavior = 'smooth';
    }
  }

  /**
   * Bind event listeners to watch for page load and user interaction.
   */
  /* istanbul ignore next */
  bindEvents(): void {
    const scrollTarget =
      this.scrollTarget === 'window' ? window : <HTMLElement>this.scrollTarget;

    const onScroll = () => {
      this.scrollY = this.getScrollY();
      this.dolly();

      if (this.pushinDebug) {
        const content = this.pushinDebug?.querySelector(
          '.pushin-debug__content'
        );
        if (content) {
          content!.textContent = `Scroll position: ${Math.round(
            this.scrollY
          )}px`;
        }
      }
    };

    scrollTarget.addEventListener('scroll', onScroll);
    this.cleanupFns.push(() =>
      scrollTarget.removeEventListener('scroll', onScroll)
    );

    let resizeTimeout: number;
    const onResize = () => {
      clearTimeout(resizeTimeout);

      resizeTimeout = window.setTimeout(() => {
        this.scene.layers.forEach(layer => layer.setLayerParams());
        this.setScrollLength();
        this.scene.resize();
        this.toggleLayers();
      }, 300);
    };
    window.addEventListener('resize', onResize);
    this.cleanupFns.push(() => window.removeEventListener('resize', onResize));

    const onFocus = (event: FocusEvent) => {
      const target = <HTMLElement>event.target;
      if (
        'hasAttribute' in target &&
        target.hasAttribute(PUSH_IN_LAYER_INDEX_ATTRIBUTE)
      ) {
        const index = parseInt(
          <string>target!.getAttribute(PUSH_IN_LAYER_INDEX_ATTRIBUTE),
          10
        );

        const layer = this.scene.layers[index];
        if (layer) {
          const scrollTo = layer.params.inpoint + layer.params.transitionStart;

          if (this.scrollTarget === 'window') {
            window.scrollTo(0, scrollTo);
          } else {
            const container = <HTMLElement>scrollTarget;
            container.scrollTop = scrollTo;
          }
        }
      }
    };
    window.addEventListener('focus', onFocus, true);
  }

  /**
   * Animation effect, mimicking a camera dolly on the webpage.
   */
  /* istanbul ignore next */
  private dolly(): void {
    cancelAnimationFrame(this.lastAnimationFrameId);

    this.lastAnimationFrameId = requestAnimationFrame(() => {
      this.toggleLayers();
    });
  }

  /**
   * Show or hide layers and set their scale, depending on if active.
   */
  /* istanbul ignore next */
  private toggleLayers(): void {
    this.scene.layers.forEach(layer => {
      layer.setLayerStyle();
      layer.setLayerVisibility();
    });
  }

  /**
   * Automatically set the container height based on the greatest outpoint.
   *
   * If the container has a height set already (e.g. if set by CSS),
   * the larger of the two numbers will be used.
   */
  private setScrollLength(): void {
    const containerHeight = getComputedStyle(this.container).height.replace(
      'px',
      ''
    );

    let maxOutpoint = 0;
    this.scene.layers.forEach(layer => {
      maxOutpoint = Math.max(maxOutpoint, layer.params.outpoint);
    });

    this.container.style.height = `${Math.max(
      parseFloat(containerHeight),
      maxOutpoint + this.targetHeight
    )}px`;
  }

  /**
   * Show a debugging tool appended to the frontend of the page.
   * Can be used to determine best "pushin-from" and "pushin-to" values.
   */
  /* istanbul ignore next */
  private showDebugger(): void {
    this.pushinDebug = document.createElement('div');
    this.pushinDebug.classList.add('pushin-debug');

    const scrollTitle = document.createElement('p');
    scrollTitle.innerText = 'Pushin.js Debugger';
    scrollTitle.classList.add('pushin-debug__title');

    const debuggerContent = document.createElement('div');
    debuggerContent.classList.add('pushin-debug__content');
    debuggerContent.innerText = `Scroll position: ${this.scrollY}px`;

    this.pushinDebug.appendChild(scrollTitle);
    this.pushinDebug.appendChild(debuggerContent);

    const target = this.target ?? document.body;

    target.appendChild(this.pushinDebug);
  }
}
