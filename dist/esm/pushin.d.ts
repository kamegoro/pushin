import { PushInScene } from './pushInScene';
import { PushInTarget } from './pushInTarget';
import { PushInOptions, PushInSettings } from './types';
import PushInBase from './pushInBase';
/**
 * PushIn object
 *
 * Once new object is created, it will initialize itself and
 * bind events to begin interacting with dom.
 */
export declare class PushIn extends PushInBase {
    container: HTMLElement;
    options: PushInOptions;
    scene: PushInScene;
    private pushinDebug?;
    target?: PushInTarget;
    scrollY: number;
    private lastAnimationFrameId;
    cleanupFns: VoidFunction[];
    settings: PushInSettings;
    mode: string;
    constructor(container: HTMLElement, options?: PushInOptions);
    /**
     * Initialize the object to start everything up.
     */
    start(): void;
    /**
     * Set the mode.
     *
     * @returns {string}    The mode setting, or "sequential" by default.
     */
    setMode(): void;
    /**
     * Set up the target element for this effect, and where to listen for scrolling.
     */
    setTarget(): void;
    /**
     * Does all necessary cleanups by removing event listeners.
     */
    destroy(): void;
    /**
     * If there is a window object,
     * get the current scroll position.
     *
     * Otherwise default to 0.
     */
    private getScrollY;
    /**
     * Bind event listeners to watch for page load and user interaction.
     */
    bindEvents(): void;
    /**
     * Animation effect, mimicking a camera dolly on the webpage.
     */
    private dolly;
    /**
     * Show or hide layers and set their scale, depending on if active.
     */
    private toggleLayers;
    /**
     * Automatically set the container height based on the greatest outpoint.
     *
     * If the container has a height set already (e.g. if set by CSS),
     * the larger of the two numbers will be used.
     */
    private setScrollLength;
    loadStyles(): void;
    /**
     * Show a debugging tool appended to the frontend of the page.
     * Can be used to determine best "pushin-from" and "pushin-to" values.
     */
    private showDebugger;
}
