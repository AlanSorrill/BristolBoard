

declare global {

    interface String {
        replaceAll(a: string, b: string): string;
    }
    interface Array<T> {
        pushAll(arr: T[]): void;
        get first(): T
        get last(): T
        removeInPlace(shouldKeep: (value: T, index: number) => boolean): number
    }


}
//t: title, v: value
export type optFunc<T> = (T | (() => T)) | { t: string, v: optFunc<T> };
export type optTransform<I, O> = (O | ((input: I) => O)) | { t: string, v: optTransform<I, O> };

Array.prototype.removeInPlace = function <T>(shouldKeep: (value: T, index: number) => boolean) {
    let count = 0;
    
    for (let i = 0; i < this.length; i++) {
        if (!shouldKeep(this[i], i)) {
            this.splice(i, 1);
            count++;
        }
    }
    return count;
}
Array.prototype.pushAll = function <T>(arr: T[]) {
    if (arr == null || typeof arr == 'undefined') {
        return;
    }
    for (let i = 0; i < arr.length; i++) {
        this.push(arr[i]);
    }
}
Object.defineProperty(Array.prototype, "first", {
    get: function first() {
        return this.length == 0 ? null : this[0]
    }
})
Object.defineProperty(Array.prototype, "last", {
    get: function last() {
        return this.length == 0 ? null : this[this.length - 1]
    }
})
String.prototype.replaceAll = function (a: string, b: string) {
    return this.split(a).join(b);
};
export function isNumber(input: number | string) {
    return !isNaN(input as any)
}
export function lerp(start: number, end: number, alpha: number) {
    return start + (end - start) * alpha;
}
export function getOptFuncTitle<T>(input: optFunc<T>, def: string = null): string {
    if (input == null || input == undefined) {
        return def;
    }
    if (typeof input['t'] == 'string') {
        return `()=>(${input['t']})`;
    }
    return `()=>(${evalOptionalFunc(input) ?? def})`;
}

export function evalOptionalFunc<T>(input: optFunc<T>, def: T = null) {
    if (input == null || input == undefined) {
        return def;
    }
    if (typeof input == 'function') {
        return (input as (() => T))();
    }
    if (typeof input['t'] == 'string') {
        return evalOptionalFunc((input as { t: string, v: optFunc<T> }).v, def);
    }

    return input;
}
export function evalOptionalTransfrom<I, O>(transform: optTransform<I, O>, input: I, def: O = null) {
    if (transform == null || transform == undefined) {
        return def;
    }
    if (typeof transform == 'function') {
        return (transform as ((input: I) => O))(input);
    }
    if (typeof transform['t'] == 'string') {
        return evalOptionalTransfrom((transform as { t: string, v: optTransform<I, O> }).v, input, def);
    }

    return transform;
}
export function csvToJson<T>(csvText: string) {
    let csvLines = csvText.split(csvText.includes('\r\n') ? '\r\n' : '\n');
    let colTitles = csvLines.shift().split(',').map((oldTitle: string) => cammelCase(oldTitle));
    let out: T[] = [];
    for (let i = 0; i < csvLines.length; i++) {
        let row = csvLines[i].split(',');
        let rowData = {};
        for (let col = 0; col < colTitles.length; col++) {
            rowData[colTitles[col]] = row[col];
        }
        out.push(rowData as T);
    }
    return out;
}
export function cammelCase(text: string, startCapitalized: boolean = false) {
    text = text.replaceAll('/', 'Slash').replaceAll('.', 'Dot');
    if (text.length == 0) {
        return '';
    }
    let toUpper: boolean = false;
    let out = startCapitalized ? text[0].toUpperCase() : text[0].toLowerCase();

    for (let i = 1; i < text.length; i++) {
        if (toUpper) {
            out += text[i].toUpperCase();
            toUpper = false;
        } else if (text[i] == ' ') {
            toUpper = true;
        } else {
            out += text[i]
        }
    }
    return out;
}
export async function delay(ms: number): Promise<void> {
    return new Promise<void>((acc, rej) => {
        setTimeout(() => { acc(); }, ms)
    });
}
export class Averager {
    maxInd: number = 0;
    arr: number[];
    index: number = 0;
    constructor(size: number) {
        this.arr = new Array<number>(size);
    }
    add(val: number) {
        this.arr[this.index] = val;
        this.index++;
        if (this.index >= this.arr.length) {
            this.index = 0;
        }
        if (this.maxInd < this.arr.length - 1) {
            this.maxInd++;
        }
    }
    private total: number;
    private addHelper(val: number, index: number) {
        if (index <= this.maxInd) {
            this.total += val;
        }
    }
    get val() {
        this.total = 0;
        this.arr.forEach(this.addHelper.bind(this));
        return this.total / this.maxInd;
    }
}