
import { evalOptionalFunc, ifUndefined, lerp, optFunc } from './CommonImports'

export class Animator<n> {
    time: number = 0;
    timeScale: number = 0.001;
    fps: number;
    values: [number, number][];
    update(deltaMs: number) {
        this.time += deltaMs * this.timeScale;
    }
    get timeBetweenFrames(): number {
        return 1 / this.fps;
    }
    get timeBetweenLoops(): number {
        return this.timeBetweenFrames * this.totalFrames;
    }
    get totalFrames() {
        return this.values.length;
    }
    get currentFrameIndex(): number {
        let alpha = (this.time % this.timeBetweenLoops) / this.timeBetweenLoops;
        let currentFrame = Math.round(alpha * (this.totalFrames - 1));
        console.log(currentFrame);
        return currentFrame;
    }
    constructor(values: Array<[number, number]>, fps: number) {
        this.fps = fps;
        this.values = values;

    }
    get value(): number {
        return 0;
    }
}

function Animate(id: string) {
    console.log("first(): factory evaluated");
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        console.log("first(): called");
    };
}
export type InterpEnd = 'A' | 'B';
export interface AnimKey {
    varPath: string
}
export interface InterpMethod<T> {
    mixer: (a: T, b: T, alpha: number) => T
    curve: (alpha: number) => number
}
export class InterpManager {
    update(delta: number) {

    }
}
export interface InterpOptions<T> {
    durration?: optFunc<number>,
    
    startAlpha?: number
    onAnimStart?: (interp: Interp<T>) => void
    onAnimEnd?: (interp: Interp<T>) => void
}
export class Interp<T> {
    static highFPSRequests: number = 0;

    a: optFunc<T>;
    b: optFunc<T>;
    get method(): InterpMethod<T> { return this.options }
    options: InterpOptions<T> & InterpMethod<T>
    lastToggle: {
        target: InterpEnd
        time: number,
        value: number
    }
    durration: optFunc<number>;
    target: optFunc<InterpEnd>
    isTransitioning: boolean = false;
    constructor(a: optFunc<T>, b: optFunc<T>, target: optFunc<InterpEnd>, options: InterpOptions<T> & InterpMethod<T>) {
        this.a = a;
        this.b = b;
        this.options = options;
        this.durration = ifUndefined(options.durration, 200);
        this.target = target;
        let startTarget = evalOptionalFunc(target, 'B');
        this.lastToggle = {
            'target': startTarget,
            time: Date.now(),
            value: 0
        }
        this.alpha = ifUndefined(options.startAlpha, 0);
    }
    get alpha(): number {

        let durration = evalOptionalFunc(this.durration, 1000);

        // let alpha;
        // if (this.lastToggle.target == 'B') {
        //     alpha = 
        // }

        // let aTime = this.lastToggle.target == 'B' ?
        //     this.lastToggle.time - this.lastToggle.value * durration :
        //     this.lastToggle.time + (1 - this.lastToggle.value) * durration
        // let bTime = this.lastToggle.target == 'B' ?
        //     this.lastToggle.time - this.lastToggle.value * durration :
        //     this.lastToggle.time + (1 - this.lastToggle.value) * durration
        let durrationAlpha = Math.min(1, (Date.now() - this.lastToggle.time) / durration)

        if (evalOptionalFunc(this.target) != this.lastToggle.target) {
            console.log(`Switching interp direction`)
            this.lastToggle.target = evalOptionalFunc(this.target);
            this.lastToggle.time = Date.now() - (1 - durrationAlpha) * durration;

            // this.lastToggle.value = Math.max(0, durrationAlpha)

        }
        if (this.isTransitioning) {
            if (durrationAlpha == 1 || durrationAlpha == 0) {
                this.isTransitioning = false;
                this.options.onAnimEnd?.(this);
                
            }
        } else {
            if (durrationAlpha != 1 && durrationAlpha != 0) {
                this.isTransitioning = true;
                this.options.onAnimStart?.(this);
                
            }
        }

        return durrationAlpha;

    }

    set alpha(fresh: number) {
        let durration = evalOptionalFunc(this.durration, 1000);
        this.lastToggle.time = Date.now() - (fresh) * durration;
    }
    getValue() {
        if (this.lastToggle.target == 'A') {
            return this.method.mixer(evalOptionalFunc(this.a), evalOptionalFunc(this.b), this.method.curve(this.alpha))
        }

        return this.method.mixer(evalOptionalFunc(this.b), evalOptionalFunc(this.a), this.method.curve(this.alpha))
    }
  
}

export function smoothFloat(inputValue: ()=>number, velocityPerSecond: optFunc<number> = 1.0){
    let lastTime = Date.now();
    let currentTime = lastTime;
    let previousValue: number = inputValue();
    let timeDelta: number;
    let valueDelta: number;
    let maxValueDelta: number;
    let sign: number = 1;
    return ()=>{
        currentTime = Date.now();
        timeDelta = (currentTime - lastTime) / 1000.0;
        valueDelta = inputValue() - previousValue;
        sign = valueDelta >= 0 ? 1 : -1;
        maxValueDelta = evalOptionalFunc(velocityPerSecond) * timeDelta;

        valueDelta = Math.min(Math.abs(valueDelta),maxValueDelta) * sign;
        previousValue += valueDelta;
        return previousValue;
    }
}
export function interpFunc<T>(a: optFunc<T>, b: optFunc<T>, target: optFunc<InterpEnd>, options: InterpOptions<T> & InterpMethod<T>): () => T {
    let interper = new Interp<T>(a, b, target, options);
    return () => interper.getValue();
}
export function linearInterp(a: optFunc<number>, b: optFunc<number>, target: optFunc<InterpEnd>, options: InterpOptions<number>) {
    let opts: InterpOptions<number> & InterpMethod<number> = options as any;
    opts.curve = (alpha) => alpha,
    opts.mixer = (a: number, b: number, alpha: number) => lerp(a, b, alpha)
    return interpFunc(a, b, target, opts)
}
