
import { evalOptionalFunc, lerp,optFunc } from './CommonImports'

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
export class Interp<T> {
    a: optFunc<T>;
    b: optFunc<T>;
    method: InterpMethod<T>;
    lastToggle: {
        target: InterpEnd
        time: number,
        value: number
    }
    durration: optFunc<number>;
    target: optFunc<InterpEnd>
    constructor(a: optFunc<T>, b: optFunc<T>, target: optFunc<InterpEnd>, durration: optFunc<number>, method: InterpMethod<T>) {
        this.a = a;
        this.b = b;
        this.method = method;
        this.durration = durration;
        this.target = target;
        let startTarget = evalOptionalFunc(target, 'B');
        this.lastToggle = {
            'target': startTarget,
            time: Date.now(),
            value: 0
        }
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


export function interpFunc<T>(a: optFunc<T>, b: optFunc<T>, target: optFunc<InterpEnd>, durration: optFunc<number>, method: InterpMethod<T>, startAlpha: number = 0): () => T {
    let interper = new Interp<T>(a, b, target, durration, method);
    interper.alpha = (startAlpha);
    return () => interper.getValue();
}
export function linearInterp(a: optFunc<number>, b: optFunc<number>, target: optFunc<InterpEnd>, durration: optFunc<number>, startAlpha: number = 0) {
    return interpFunc(a, b, target, durration, {
        curve: (alpha) => alpha,
        mixer: (a: number, b: number, alpha: number) => lerp(a, b, alpha)
    },startAlpha)
}
