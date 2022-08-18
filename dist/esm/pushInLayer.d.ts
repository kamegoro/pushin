import { PushInScene } from './pushInScene';
import PushInBase from './pushInBase';
import { LayerOptions, LayerParams } from './types';
export declare class PushInLayer extends PushInBase {
    container: HTMLElement;
    private index;
    scene: PushInScene;
    options: LayerOptions;
    params: LayerParams;
    private originalScale;
    private ref;
    constructor(container: HTMLElement, index: number, scene: PushInScene, options: LayerOptions);
    /**
     * Get the transitions setting, either from the API or HTML attributes.
     *
     * @return {boolean}
     */
    private getTransitions;
    /**
     * Get the amount of overlap between previous and current layer.
     *
     * @return {number}
     */
    private getOverlap;
    /**
     * Get the transitionStart setting, either from the API or HTML attributes.
     *
     * @returns number
     */
    private getTransitionStart;
    /**
     * Get the transitionEnd setting, either from the API or HTML attributes.
     *
     * @returns number
     */
    private getTransitionEnd;
    /**
     * Get all inpoints for the layer.
     */
    private getInpoints;
    /**
     * Get all outpoints for the layer.
     */
    private getOutpoints;
    /**
     * Get the push-in speed for the layer.
     */
    private getSpeed;
    /**
     * Set the z-index of each layer so they overlap correctly.
     */
    setZIndex(total: number): void;
    /**
     * Set all the layer parameters.
     *
     * This is used during initalization and
     * if the window is resized.
     */
    setLayerParams(): void;
    private getDepth;
    /**
     * Get the initial scale of the element at time of DOM load.
     */
    private getElementScaleX;
    /**
     * Whether or not a layer should currently be zooming.
     */
    private isActive;
    /**
     * Get the current inpoint for a layer,
     * depending on window breakpoint.
     */
    private getInpoint;
    /**
     * Get the current outpoint for a layer,
     * depending on window breakpoint.
     */
    private getOutpoint;
    /**
     * Get the scaleX value for the layer.
     */
    private getScaleValue;
    /**
     * Set element scale.
     */
    private setScale;
    /**
     * Set CSS styles to control the effect on each layer.
     *
     * This will control the scale and opacity of the layer
     * as the user scrolls.
     */
    setLayerStyle(): void;
    /**
     * Set a css class depending on current opacity.
     */
    setLayerVisibility(): void;
}
