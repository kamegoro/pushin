/* Pushin.js - v5.2.1
Author: Nathan Blair <nate@natehub.net> (https://natehub.net)
License: MIT */
const DEFAULT_SPEED = 8;
// The data attribute which may be defined on the elemenet in the following way:
// `<div class="pushin-scene" data-pushin-breakpoints="768,1440"></div>`.
const PUSH_IN_BREAKPOINTS_DATA_ATTRIBUTE = 'pushinBreakpoints';
// The data attribute which may be defined on the elemenet in the following way:
// `<div data-pushin-speed="6"></div>`.
const PUSH_IN_SPEED_DATA_ATTRIBUTE = 'pushinSpeed';
const PUSH_IN_TO_DATA_ATTRIBUTE = 'pushinTo';
const PUSH_IN_FROM_DATA_ATTRIBUTE = 'pushinFrom';
const PUSH_IN_DEFAULT_BREAKPOINTS = [768, 1440, 1920];
const PUSH_IN_LAYER_INDEX_ATTRIBUTE = 'data-pushin-layer-index';
const PUSH_IN_DEFAULT_TRANSITION_LENGTH = 200;

class PushInBase {
    /**
     * Get the value for an option from either HTML markup or the JavaScript API.
     * Return a string or array of strings.
     */
    getStringOption(name) {
        let option;
        const attribute = this.getAttributeName(name);
        if (this.container.hasAttribute(attribute)) {
            option = this.container.getAttribute(attribute);
        }
        else if (typeof this.options[name] === 'string') {
            option = this.options[name];
        }
        else if (typeof this.options[name] === 'number') {
            // fail-safe in case numbers are passed in
            option = this.options[name].toString();
        }
        else if (this.options[name]) {
            const type = Object.prototype.toString.call(this.options[name]);
            if (type === '[object Array]') {
                option = this.options[name];
            }
        }
        else {
            option = '';
        }
        // If the string contains commas, convert it into an array
        if (typeof option === 'string' && option.includes(',')) {
            option = option.split(',');
        }
        return option;
    }
    /**
     * Get the value for an option from either HTML markup or the JavaScript API.
     * Returns a number or array of numbers.
     * If nothing found, returns null.
     */
    getNumberOption(name) {
        let option = null;
        const attribute = this.getAttributeName(name);
        if (this.container.hasAttribute(attribute)) {
            option = this.container.getAttribute(attribute);
        }
        else if (this.options[name]) {
            option = this.options[name];
        }
        if (typeof option === 'string') {
            option = option.split(',').map(val => parseFloat(val));
            option = option.length > 1 ? option : option[0];
        }
        return option;
    }
    /**
     * Get the value for an option from either HTML markup or the JavaScript API.
     * Returns a boolean or array of booleans.
     * If nothing found, returns null.
     */
    getBoolOption(name) {
        let option = null;
        const attribute = this.getAttributeName(name);
        if (this.container.hasAttribute(attribute)) {
            option = this.container.getAttribute(attribute);
        }
        else if (this.options[name]) {
            option = this.options[name];
        }
        if (typeof option === 'string') {
            option = option.split(',').map(val => (val === 'false' ? false : !!val));
            option = option.length > 1 ? option : option[0];
        }
        return option;
    }
    getAttributeName(name) {
        const kebabName = name.replace(/[A-Z]+(?![a-z])|[A-Z]/g, (char, idx) => (idx ? '-' : '') + char.toLowerCase());
        return `data-pushin-${kebabName}`;
    }
}

class PushInComposition extends PushInBase {
    /* istanbul ignore next */
    constructor(scene, options) {
        var _a;
        super();
        this.scene = scene;
        this.options = options;
        this.options = options;
        const container = this.scene.container.querySelector('.pushin-composition');
        if (container) {
            this.container = container;
        }
        else if ((_a = this.options) === null || _a === void 0 ? void 0 : _a.ratio) {
            this.container = document.createElement('div');
            this.container.classList.add('pushin-composition');
            this.container.innerHTML = this.scene.container.innerHTML;
            this.scene.container.innerHTML = '';
            this.scene.container.appendChild(this.container);
            this.scene.pushin.cleanupFns.push(() => {
                this.scene.container.innerHTML = this.container.innerHTML;
            });
        }
        if (this.container) {
            this.setRatio();
        }
    }
    /**
     * Set the aspect ratio based setting.
     */
    setRatio() {
        let ratio = this.getNumberOption('ratio');
        if (typeof ratio === 'number') {
            // fail-safe if an array was not provided
            ratio = [ratio, ratio];
        }
        if (ratio) {
            const paddingTop = ratio.reduce((prev, cur) => cur / prev) * 100;
            this.container.style.paddingTop = `${paddingTop.toString()}%`;
        }
    }
}

class PushInLayer extends PushInBase {
    /* istanbul ignore next */
    constructor(container, index, scene, options) {
        super();
        this.container = container;
        this.index = index;
        this.scene = scene;
        this.options = options;
        const inpoints = this.getInpoints(this.container, this.index);
        const outpoints = this.getOutpoints(this.container, inpoints[0]);
        const speed = this.getSpeed(this.container);
        this.originalScale = this.getElementScaleX(this.container);
        this.ref = { inpoints, outpoints, speed };
        this.container.setAttribute('data-pushin-layer-index', this.index.toString());
        // Set tabindex so we can sync scrolling with screenreaders
        this.container.setAttribute('tabindex', '0');
        this.setLayerParams();
    }
    /**
     * Get the transitions setting, either from the API or HTML attributes.
     *
     * @return {boolean}
     */
    getTransitions() {
        var _a, _b;
        let transitions = (_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.transitions) !== null && _b !== void 0 ? _b : true;
        if (this.container.hasAttribute('data-pushin-transitions')) {
            const attr = this.container.dataset.pushinTransitions;
            if (attr) {
                transitions = attr !== 'false' && attr !== '0';
            }
        }
        return transitions;
    }
    /**
     * Get the amount of overlap between previous and current layer.
     *
     * @return {number}
     */
    getOverlap() {
        let overlap = 0;
        if (this.index > 0) {
            const prevLayer = this.scene.layers[this.index - 1];
            const prevTranEnd = prevLayer.params.transitionEnd;
            const curTranStart = this.getTransitionStart();
            const average = (curTranStart + prevTranEnd) / 2;
            overlap = Math.min(average * 0.5, curTranStart);
        }
        return overlap;
    }
    /**
     * Get the transitionStart setting, either from the API or HTML attributes.
     *
     * @returns number
     */
    getTransitionStart() {
        let option = this.getNumberOption('transitionStart');
        if (option !== null && typeof option !== 'number') {
            // not yet compatible with breakpoints. Fall back to first value only.
            [option] = option;
        }
        const start = option;
        return start === null ? PUSH_IN_DEFAULT_TRANSITION_LENGTH : start;
    }
    /**
     * Get the transitionEnd setting, either from the API or HTML attributes.
     *
     * @returns number
     */
    getTransitionEnd() {
        let option = this.getNumberOption('transitionEnd');
        if (option !== null && typeof option !== 'number') {
            // not yet compatible with breakpoints. Fall back to first value only.
            [option] = option;
        }
        const end = option;
        return end === null ? PUSH_IN_DEFAULT_TRANSITION_LENGTH : end;
    }
    /**
     * Get all inpoints for the layer.
     */
    getInpoints(element, index) {
        var _a;
        let inpoints = [this.scene.getTop()];
        if (element.dataset[PUSH_IN_FROM_DATA_ATTRIBUTE]) {
            inpoints = element.dataset[PUSH_IN_FROM_DATA_ATTRIBUTE].split(',').map(inpoint => parseInt(inpoint.trim(), 10));
        }
        else if ((_a = this.options) === null || _a === void 0 ? void 0 : _a.inpoints) {
            inpoints = this.options.inpoints;
        }
        else if (index === 0) {
            inpoints = this.scene.getInpoints();
        }
        else if (index > 0) {
            // Set default for middle layers if none provided
            const { outpoint } = this.scene.layers[index - 1].params;
            inpoints = [outpoint - this.getOverlap()];
        }
        return inpoints;
    }
    /**
     * Get all outpoints for the layer.
     */
    getOutpoints(element, inpoint) {
        var _a;
        let outpoints = [inpoint + this.scene.layerDepth];
        if (element.dataset[PUSH_IN_TO_DATA_ATTRIBUTE]) {
            const values = element.dataset[PUSH_IN_TO_DATA_ATTRIBUTE].split(',');
            outpoints = values.map(value => parseInt(value.trim(), 10));
        }
        else if ((_a = this.options) === null || _a === void 0 ? void 0 : _a.outpoints) {
            outpoints = this.options.outpoints;
        }
        return outpoints;
    }
    /**
     * Get the push-in speed for the layer.
     */
    getSpeed(element) {
        var _a;
        let speed = null;
        if (element.dataset[PUSH_IN_SPEED_DATA_ATTRIBUTE]) {
            speed = parseFloat(element.dataset[PUSH_IN_SPEED_DATA_ATTRIBUTE]);
            if (Number.isNaN(speed)) {
                speed = DEFAULT_SPEED;
            }
        }
        else if ((_a = this.options) === null || _a === void 0 ? void 0 : _a.speed) {
            speed = this.options.speed;
        }
        return speed || DEFAULT_SPEED;
    }
    /**
     * Set the z-index of each layer so they overlap correctly.
     */
    setZIndex(total) {
        this.container.style.zIndex = (total - this.index).toString();
    }
    /**
     * Set all the layer parameters.
     *
     * This is used during initalization and
     * if the window is resized.
     */
    /* istanbul ignore next */
    setLayerParams() {
        this.params = {
            depth: this.getDepth(),
            inpoint: this.getInpoint(this.ref.inpoints),
            outpoint: this.getOutpoint(this.ref.outpoints),
            overlap: this.getOverlap(),
            speed: this.ref.speed,
            transitions: this.getTransitions(),
            transitionStart: this.getTransitionStart(),
            transitionEnd: this.getTransitionEnd(),
        };
    }
    /* istanbul ignore next */
    getDepth() {
        return (this.getOutpoint(this.ref.outpoints) - this.getInpoint(this.ref.inpoints));
    }
    /**
     * Get the initial scale of the element at time of DOM load.
     */
    getElementScaleX(element) {
        const transform = window
            .getComputedStyle(element)
            .getPropertyValue('transform');
        let scaleX = 1;
        if (transform && transform !== 'none') {
            const match = transform.match(/[matrix|scale]\(([\d,.\s]+)/);
            if (match && match[1]) {
                const matrix = match[1].split(', ');
                scaleX = parseFloat(matrix[0]);
            }
        }
        return scaleX;
    }
    /**
     * Whether or not a layer should currently be zooming.
     */
    isActive() {
        const { inpoint } = this.params;
        const { outpoint } = this.params;
        let active = true;
        if (this.params.transitions) {
            const min = this.scene.pushin.scrollY >= inpoint;
            const max = this.scene.pushin.scrollY <= outpoint;
            active = min && max;
            if (!active && this.params.transitionStart < 0 && !min) {
                active = true;
            }
            else if (!active && this.params.transitionEnd < 0 && !max) {
                active = true;
            }
        }
        return active;
    }
    /**
     * Get the current inpoint for a layer,
     * depending on window breakpoint.
     */
    /* istanbul ignore next */
    getInpoint(inpoints) {
        const { breakpoints } = this.scene.options;
        return inpoints[this.scene.getBreakpointIndex(breakpoints)] || inpoints[0];
    }
    /**
     * Get the current outpoint for a layer,
     * depending on window breakpoint.
     */
    /* istanbul ignore next */
    getOutpoint(outpoints) {
        const { breakpoints } = this.scene.options;
        return (outpoints[this.scene.getBreakpointIndex(breakpoints)] || outpoints[0]);
    }
    /**
     * Get the scaleX value for the layer.
     */
    getScaleValue(layer) {
        const distance = this.scene.pushin.scrollY - layer.params.inpoint;
        const speed = Math.min(layer.params.speed, 100) / 100;
        const delta = (distance * speed) / 100;
        return Math.max(layer.originalScale + delta, 0);
    }
    /**
     * Set element scale.
     */
    setScale(value) {
        const { style } = this.container;
        const scaleString = `scale(${value})`;
        style.webkitTransform = scaleString;
        style.mozTransform = scaleString;
        style.msTransform = scaleString;
        style.oTransform = scaleString;
        style.transform = scaleString;
    }
    /**
     * Set CSS styles to control the effect on each layer.
     *
     * This will control the scale and opacity of the layer
     * as the user scrolls.
     */
    setLayerStyle() {
        let opacity = 0;
        const isFirst = this.index === 0;
        const isLast = this.index + 1 === this.scene.layers.length;
        const { inpoint } = this.params;
        const { outpoint } = this.params;
        if (isFirst && this.scene.pushin.scrollY < inpoint) {
            opacity = 1;
        }
        else if (isLast && this.scene.pushin.scrollY > outpoint) {
            opacity = 1;
        }
        else if (this.isActive()) {
            let inpointDistance = Math.max(Math.min(this.scene.pushin.scrollY - inpoint, this.params.transitionStart), 0) / this.params.transitionStart;
            if (isFirst || this.params.transitionStart < 0) {
                inpointDistance = 1;
            }
            let outpointDistance = Math.max(Math.min(outpoint - this.scene.pushin.scrollY, this.params.transitionEnd), 0) / this.params.transitionEnd;
            if (isLast || this.params.transitionEnd < 0) {
                outpointDistance = 1;
            }
            opacity = this.params.transitions
                ? Math.min(inpointDistance, outpointDistance)
                : 1;
        }
        if (this.isActive()) {
            this.setScale(this.getScaleValue(this));
        }
        this.container.style.opacity = opacity.toString();
    }
    /**
     * Set a css class depending on current opacity.
     */
    setLayerVisibility() {
        if (parseFloat(this.container.style.opacity) > 0.1) {
            this.container.classList.add('pushin-layer--visible');
        }
        else {
            this.container.classList.remove('pushin-layer--visible');
        }
    }
}

class PushInScene extends PushInBase {
    /* istanbul ignore next */
    constructor(pushin) {
        var _a, _b, _c;
        super();
        this.pushin = pushin;
        const container = this.pushin.container.querySelector('.pushin-scene');
        if (container) {
            this.container = container;
        }
        else {
            this.container = document.createElement('div');
            this.container.classList.add('pushin-scene');
            this.container.innerHTML = this.pushin.container.innerHTML;
            this.pushin.container.innerHTML = '';
            this.pushin.container.appendChild(this.container);
            this.pushin.cleanupFns.push(() => {
                this.pushin.container.innerHTML = this.container.innerHTML;
            });
        }
        this.options = pushin.options.scene;
        this.layerDepth = ((_a = this.options) === null || _a === void 0 ? void 0 : _a.layerDepth) || 1000;
        this.layers = [];
        this.setSceneClasses();
        const compositionOptions = {
            ratio: (_c = (_b = pushin.options.composition) === null || _b === void 0 ? void 0 : _b.ratio) !== null && _c !== void 0 ? _c : undefined,
        };
        this.composition = new PushInComposition(this, compositionOptions);
        this.setBreakpoints();
        this.getLayers();
    }
    /**
     * Set scene class names.
     */
    /* istanbul ignore next */
    setSceneClasses() {
        if (this.pushin.target) {
            this.container.classList.add('pushin-scene--with-target');
        }
        if (this.pushin.scrollTarget === 'window') {
            this.container.classList.add('pushin-scene--scroll-target-window');
        }
    }
    /**
     * Resize the PushIn container if using a target container.
     */
    resize() {
        var _a;
        if (this.pushin.scrollTarget !== 'window') {
            const sizes = (_a = this.pushin.target) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect();
            if (sizes) {
                this.container.style.height = `${sizes.height}px`;
                this.container.style.width = `${sizes.width}px`;
            }
        }
    }
    /**
     * Set breakpoints for responsive design settings.
     */
    setBreakpoints() {
        var _a, _b;
        if (!((_a = this.options) === null || _a === void 0 ? void 0 : _a.breakpoints) || ((_b = this.options) === null || _b === void 0 ? void 0 : _b.breakpoints.length) === 0) {
            this.options.breakpoints = [...PUSH_IN_DEFAULT_BREAKPOINTS];
        }
        if (this.container.dataset[PUSH_IN_BREAKPOINTS_DATA_ATTRIBUTE]) {
            this.options.breakpoints = this.container.dataset[PUSH_IN_BREAKPOINTS_DATA_ATTRIBUTE].split(',').map(breakpoint => parseInt(breakpoint.trim(), 10));
        }
        // Always include break point 0 for anything under first breakpoint
        this.options.breakpoints.unshift(0);
    }
    /**
     * Find all layers on the page and store them with their parameters
     */
    getLayers() {
        var _a;
        const layers = Array.from(this.container.getElementsByClassName('pushin-layer'));
        for (let index = 0; index < layers.length; index++) {
            const element = layers[index];
            let options = {};
            if (((_a = this.options) === null || _a === void 0 ? void 0 : _a.layers) && this.options.layers.length > index) {
                options = this.options.layers[index];
            }
            const layer = new PushInLayer(element, index, this, options);
            this.layers.push(layer);
            layer.setZIndex(layers.length);
        }
    }
    /**
     * Get the array index of the current window breakpoint.
     */
    getBreakpointIndex(breakpoints) {
        const searchIndex = breakpoints
            .reverse()
            .findIndex(bp => bp <= window.innerWidth);
        return searchIndex === -1 ? 0 : breakpoints.length - 1 - searchIndex;
    }
    /**
     * Get the screen-top value of the container.
     *
     * If using a target, get the top of the
     * container relative to the target's top.
     *
     * @returns {number}
     */
    getTop() {
        let { top } = this.container.getBoundingClientRect();
        if (this.pushin.target) {
            top -= this.pushin.target.getBoundingClientRect().top;
        }
        return top;
    }
    /**
     * Get the scene inpoints provided by the JavaScript API
     * and/or the HTML data-attributes.
     *
     * @returns {number[]}
     */
    getInpoints() {
        var _a, _b;
        let inpoints = [this.getTop()];
        if (this.container.dataset[PUSH_IN_FROM_DATA_ATTRIBUTE]) {
            const pushInFrom = (this.container.dataset[PUSH_IN_FROM_DATA_ATTRIBUTE]);
            inpoints.push(parseInt(pushInFrom, 10));
        }
        else if (((_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.inpoints) === null || _b === void 0 ? void 0 : _b.length) > 0) {
            inpoints = this.options.inpoints;
        }
        return inpoints;
    }
}

/**
 * PushIn object
 *
 * Once new object is created, it will initialize itself and
 * bind events to begin interacting with dom.
 */
class PushIn extends PushInBase {
    /* istanbul ignore next */
    constructor(container, options) {
        var _a, _b, _c, _d, _e, _f;
        super();
        this.container = container;
        this.scrollY = 0;
        this.lastAnimationFrameId = -1;
        this.cleanupFns = [];
        options = options !== null && options !== void 0 ? options : {};
        this.options = {
            debug: (_a = options === null || options === void 0 ? void 0 : options.debug) !== null && _a !== void 0 ? _a : false,
            scene: (_b = options === null || options === void 0 ? void 0 : options.scene) !== null && _b !== void 0 ? _b : { breakpoints: [], inpoints: [] },
            target: (_c = options === null || options === void 0 ? void 0 : options.target) !== null && _c !== void 0 ? _c : undefined,
            scrollTarget: options === null || options === void 0 ? void 0 : options.scrollTarget,
        };
        this.options.scene.composition = (_d = options === null || options === void 0 ? void 0 : options.composition) !== null && _d !== void 0 ? _d : undefined;
        this.options.scene.layers = (_e = options === null || options === void 0 ? void 0 : options.layers) !== null && _e !== void 0 ? _e : undefined;
        // Defaults
        this.targetHeight = 0;
        this.options.debug = (_f = options === null || options === void 0 ? void 0 : options.debug) !== null && _f !== void 0 ? _f : false;
    }
    /**
     * Initialize the object to start everything up.
     */
    /* istanbul ignore next */
    start() {
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
        }
        else {
            // eslint-disable-next-line no-console
            console.error('No container element provided to pushIn.js. Effect will not be applied.');
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
    setScrollTarget() {
        const value = this.getStringOption('scrollTarget');
        let scrollTarget;
        if (value) {
            if (value === 'window') {
                scrollTarget = value;
            }
            else {
                scrollTarget = document.querySelector(value);
            }
        }
        if (!scrollTarget) {
            if (this.target) {
                scrollTarget = this.target;
            }
            else {
                scrollTarget = 'window';
            }
        }
        this.scrollTarget = scrollTarget;
    }
    /**
     * Set the target parameter and make sure
     * pushin is always a child of that target.
     *
     * @param options
     */
    setTarget() {
        const value = this.getStringOption('target');
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
    destroy() {
        cancelAnimationFrame(this.lastAnimationFrameId);
        while (this.cleanupFns.length) {
            this.cleanupFns.pop()();
        }
    }
    /**
     * If there is a window object,
     * get the current scroll position.
     *
     * Otherwise default to 0.
     */
    getScrollY() {
        let scrollY = 0;
        if (this.scrollTarget === 'window' && typeof window !== 'undefined') {
            scrollY = window.scrollY;
        }
        else {
            const target = this.scrollTarget;
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
    setTargetOverflow() {
        if (this.target && this.scrollTarget !== 'window') {
            this.target.style.overflowY = 'scroll';
            this.target.style.scrollBehavior = 'smooth';
        }
    }
    /**
     * Bind event listeners to watch for page load and user interaction.
     */
    /* istanbul ignore next */
    bindEvents() {
        const scrollTarget = this.scrollTarget === 'window' ? window : this.scrollTarget;
        const onScroll = () => {
            var _a;
            this.scrollY = this.getScrollY();
            this.dolly();
            if (this.pushinDebug) {
                const content = (_a = this.pushinDebug) === null || _a === void 0 ? void 0 : _a.querySelector('.pushin-debug__content');
                if (content) {
                    content.textContent = `Scroll position: ${Math.round(this.scrollY)}px`;
                }
            }
        };
        scrollTarget.addEventListener('scroll', onScroll);
        this.cleanupFns.push(() => scrollTarget.removeEventListener('scroll', onScroll));
        let resizeTimeout;
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
        const onFocus = (event) => {
            const target = event.target;
            if ('hasAttribute' in target &&
                target.hasAttribute(PUSH_IN_LAYER_INDEX_ATTRIBUTE)) {
                const index = parseInt(target.getAttribute(PUSH_IN_LAYER_INDEX_ATTRIBUTE), 10);
                const layer = this.scene.layers[index];
                if (layer) {
                    const scrollTo = layer.params.inpoint + layer.params.transitionStart;
                    if (this.scrollTarget === 'window') {
                        window.scrollTo(0, scrollTo);
                    }
                    else {
                        const container = scrollTarget;
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
    dolly() {
        cancelAnimationFrame(this.lastAnimationFrameId);
        this.lastAnimationFrameId = requestAnimationFrame(() => {
            this.toggleLayers();
        });
    }
    /**
     * Show or hide layers and set their scale, depending on if active.
     */
    /* istanbul ignore next */
    toggleLayers() {
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
    setScrollLength() {
        const containerHeight = getComputedStyle(this.container).height.replace('px', '');
        let maxOutpoint = 0;
        this.scene.layers.forEach(layer => {
            maxOutpoint = Math.max(maxOutpoint, layer.params.outpoint);
        });
        this.container.style.height = `${Math.max(parseFloat(containerHeight), maxOutpoint + this.targetHeight)}px`;
    }
    /**
     * Show a debugging tool appended to the frontend of the page.
     * Can be used to determine best "pushin-from" and "pushin-to" values.
     */
    /* istanbul ignore next */
    showDebugger() {
        var _a;
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
        const target = (_a = this.target) !== null && _a !== void 0 ? _a : document.body;
        target.appendChild(this.pushinDebug);
    }
}

/**
 * Helper function: Set up and start push-in effect on all elements
 * matching the provided selector.
 */
const pushInStart = (options) => {
    var _a;
    const pushInOptions = options !== null && options !== void 0 ? options : {};
    const selector = (_a = options === null || options === void 0 ? void 0 : options.selector) !== null && _a !== void 0 ? _a : '.pushin';
    const elements = document.querySelectorAll(selector);
    const instances = [];
    for (const element of elements) {
        const instance = new PushIn(element, pushInOptions);
        instance.start();
        instances.push(instance);
    }
    return instances;
};
if (typeof window !== 'undefined') {
    window.pushInStart = pushInStart;
}

export { PushIn };
//# sourceMappingURL=pushin.js.map
