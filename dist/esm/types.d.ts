export interface LayerOptions {
    inpoints: number[];
    outpoints: number[];
    speed: number;
}
export interface SceneOptions {
    speedDelta?: number;
    layerDepth?: number;
    breakpoints: number[];
    inpoints: number[];
    layers?: LayerOptions[];
}
export interface PushInOptions {
    debug?: boolean;
    layers?: LayerOptions[];
    scene?: SceneOptions;
}
export interface PushInLayer {
    element: HTMLElement;
    index: number;
    originalScale: number;
}
export interface LayerRef {
    inpoints: number[];
    outpoints: number[];
    speed: number;
}
export interface LayerParams {
    inpoint: number;
    outpoint: number;
    speed: number;
}
