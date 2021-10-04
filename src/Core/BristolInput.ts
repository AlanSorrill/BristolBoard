
export interface BristolInputEvent {

}
export enum InputEventAction {
    Down, Up
}

export enum KeyboardInputKey {
    a = 'a', b = 'b', c = 'c', d = 'd', e = 'e', f = 'f', g = 'g', h = 'h', i = 'i', j = 'j', k = 'k', l = 'l', m = 'm', n = 'n', o = '0', p = 'p',
    q = 'q', r = 'r', s = 's', t = 't', u = 'u', v = 'v', w = 'w', x = 'x', y = 'y', z = 'z', shift = 'shift', enter = 'enter', ctrl = 'ctrl', alt = 'alt'
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
export class MouseBtnInputEvent extends MouseInputEvent {
    btn: number;
    action: InputEventAction;
    constructor(x: number, y: number, btn: number, action: InputEventAction = null) {
        super(x, y);
        this.action = action;
        this.btn = btn;
    }
}
export class MouseMovedInputEvent extends MouseInputEvent {
    deltaX: number;
    deltaY: number;
    constructor(x: number, y: number, deltaX: number, deltaY: number) {
        super(x, y);
        this.deltaX = deltaX;
        this.deltaY = deltaY;
    }
}
export class MouseScrolledInputEvent extends MouseInputEvent {
    amount: number
    constructor(x: number, y: number, amount: number) {
        super(x, y);
        this.amount = amount;
    }
}
export class MouseDraggedInputEvent extends MouseMovedInputEvent {
    btn: number
    constructor(x: number, y: number, btn: number, deltaX: number, deltaY: number) {
        super(x, y, deltaX, deltaY);
        this.btn = btn;
    }
}
export class MousePinchedInputEvent extends MouseMovedInputEvent {
    btn: number
    pinchX: number;
    pinchY: number;

    constructor(x: number, y: number, btn: number, deltaX: number, deltaY: number, pinchX: number, pinchY: number) {
        super(x, y, deltaX, deltaY);
        this.btn = btn;
        this.pinchX = pinchX;
        this.pinchY = pinchY;
    }
}