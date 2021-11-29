import { UIElement } from "./BristolImports";

export interface BristolInputEvent {
}
// export class TouchPoint {
//     startTime: number;
//     constructor(startLocation: [x: number, y: number], overElement: UIElement){

//         this.startTime = Date.now();
//     }
//     addMove(location: [x: number, y: number]){

//     }
// }
export enum BristolInteraction {
    tap,
    doubleTap,
    holdStart,
    holdEnd,
}
export interface BristolCursorEvent {
    type: 'mouse' | 'touch'
    get center(): [x: number, y: number]
}

export interface BristolMouseEvent extends BristolCursorEvent {
    type: 'mouse',
    buttons: [false | BristolInteraction, false | BristolInteraction, false | BristolInteraction]
}
export interface BristolTouchEvent extends BristolCursorEvent {
    type: 'touch',
    locations: Array<[x: number, y: number, interaction: BristolInteraction]>
}

export enum InputEventAction {
    Down, Up, Move
}
export enum InputSource {
    Mouse, Touch
}
export enum UppercaseEnglishLetterCharacter {
    A = 'A',
    B = 'B',
    C = 'C',
    D = 'D',
    E = 'E',
    F = 'F',
    G = 'G',
    H = 'H',
    I = 'I',
    J = 'J',
    K = 'K',
    L = 'L',
    M = 'M',
    N = 'N',
    O = 'O',
    P = 'P',
    Q = 'Q',
    R = 'R',
    S = 'S',
    T = 'T',
    U = 'U',
    V = 'V',
    W = 'W',
    X = 'X',
    Y = 'Y',
    Z = 'Z'
}
export function isUppercaseEnglishLetterCharacter(input: string): input is UppercaseEnglishLetterCharacter {
    return typeof UppercaseEnglishLetterCharacter[input] != 'undefined';
}
export enum LowercaseEnglishLetterCharacter {
    a = 'a',
    b = 'b',
    c = 'c',
    d = 'd',
    e = 'e',
    f = 'f',
    g = 'g',
    h = 'h',
    i = 'i',
    j = 'j',
    k = 'k',
    l = 'l',
    m = 'm',
    n = 'n',
    o = 'o',
    p = 'p',
    q = 'q',
    r = 'r',
    s = 's',
    t = 't',
    u = 'u',
    v = 'v',
    w = 'w',
    x = 'x',
    y = 'y',
    z = 'z'
}
export function isLowercaseEnglishLetterCharacter(input: string): input is LowercaseEnglishLetterCharacter {
    return typeof LowercaseEnglishLetterCharacter[input] != 'undefined';
}
export enum NumericCharacter {
    One = "1",
    Two = "2",
    Three = "3",
    Four = "4",
    Five = "5",
    Six = "6",
    Seven = "7",
    Eight = "8",
    Nine = "9",
    Zero = "0",
}
export function isNumericCharacter(input: string): input is NumericCharacter {
    return typeof NumericCharacter[input] != 'undefined';
}
export enum MathCharacter {
    Minus = "-",
    Equals = "=",
    Multiply = "*",
    Add = "+",
    Divide = "/",
    GreaterThen = ">",
    LessThen = "<"
}
export function isMathCharacter(input: string): input is MathCharacter {
    return typeof MathCharacter[input] != 'undefined';
}
export enum PunctuationCharacter {
    BackTick = "`",
    SemiColon = ";",
    SingleQuote = "\'",
    DoubleQuote = "\"",
    Comma = ",",
    Period = ".",
}
export function isPunctuationCharacter(input: string): input is PunctuationCharacter {
    return typeof PunctuationCharacter[input] != 'undefined';
}
export enum BracketCharacter {
    OpenSquareBracket = "[",
    CloseSquareBracket = "]",
    OpenCurlyBracket = "{",
    CloseCurlyBracket = "}",
    OpenParenthasis = "(",
    CloseParenthasis = ")"
}
export function isBracketCharacter(input: string): input is BracketCharacter {
    return typeof BracketCharacter[input] != 'undefined';
}
export enum SpecialKey {
    BackSpace = "Backspace",
    Tab = "Tab",
    BackSlash = "\\",
    CapsLock = "CapsLock",


    Enter = "Enter",
    Shift = "Shift",


    Control = "Control",
    Meta = "Meta",
    Alt = "Alt",
    ContextMenu = "ContextMenu",
    Insert = "Insert",
    Delete = "Delete",
    Numlock = "NumLock",
}
export function isSpecialKey(input: string): input is SpecialKey {
    return typeof SpecialKey[input] != 'undefined';
}
export type KeyboardKey = UppercaseEnglishLetterCharacter | LowercaseEnglishLetterCharacter | NumericCharacter | MathCharacter | PunctuationCharacter | BracketCharacter | SpecialKey


export function StringToKeyboardInputKey(str: string): KeyboardKey | null {
    if (isSpecialKey(str) || isUppercaseEnglishLetterCharacter(str) || isLowercaseEnglishLetterCharacter(str) || isNumericCharacter(str) || isMathCharacter(str) || isPunctuationCharacter(str) || isBracketCharacter(str)) {
        return str;
    }
    switch (str) {
        case PunctuationCharacter.BackTick:
            return str;
    }
    return null;
}
export class KeyboardInputEvent implements BristolInputEvent {
    key: string
    isAlt: boolean;
    isCtrl: boolean;
    isShift: boolean;
    action: InputEventAction
    constructor(action: InputEventAction, key: string, isShift: boolean, isCtrl: boolean, isAlt: boolean) {
        this.action = action;
        this.key = key;
        this.isShift = isShift;
        this.isCtrl = isCtrl;
        this.isAlt = isAlt;
    }
}

export class MouseInputEvent implements BristolInputEvent {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

}
export enum TapTuple {
    SingleTap, DoubleTap, TrippleTap
}
export type CoordTuple = [x: number, y: number]
export function lengthOfVector2d(vector: CoordTuple) {
    return Math.sqrt(Math.pow(vector[0], 2) + Math.pow(vector[1], 2));
}
export interface RawPointerData {
    position: [x: number, y: number] & CoordTuple
    timeStamp: number,
    source: InputSource
    buttonOrFingerIndex: number
    action: InputEventAction
}
export interface RawPointerMoveData extends RawPointerData {
    action: InputEventAction.Move,
    delta: [x: number, y: number] & CoordTuple
}
export function isRawPointerMoveData(rawData: RawPointerData): rawData is RawPointerMoveData {
    return rawData.action == InputEventAction.Move;
}

// export class MouseBtnInputEvent extends MouseInputEvent {
//     btn: number;
//     action: InputEventAction;
//     constructor(x: number, y: number, btn: number, action: InputEventAction = null) {
//         super(x, y);
//         this.action = action;
//         this.btn = btn;
//     }
// }
// export class MouseMovedInputEvent extends MouseInputEvent {
//     deltaX: number;
//     deltaY: number;
//     constructor(x: number, y: number, deltaX: number, deltaY: number) {
//         super(x, y);
//         this.deltaX = deltaX;
//         this.deltaY = deltaY;
//     }
// }
export class MouseScrolledInputEvent extends MouseInputEvent {
    amount: number
    constructor(x: number, y: number, amount: number) {
        super(x, y);
        this.amount = amount;
    }
}
// export class MouseDraggedInputEvent extends MouseMovedInputEvent {
//     btn: number
//     constructor(x: number, y: number, btn: number, deltaX: number, deltaY: number) {
//         super(x, y, deltaX, deltaY);
//         this.btn = btn;
//     }
// }
// export class MousePinchedInputEvent extends MouseMovedInputEvent {
//     btn: number
//     pinchX: number;
//     pinchY: number;

//     constructor(x: number, y: number, btn: number, deltaX: number, deltaY: number, pinchX: number, pinchY: number) {
//         super(x, y, deltaX, deltaY);
//         this.btn = btn;
//         this.pinchX = pinchX;
//         this.pinchY = pinchY;
//     }
// }