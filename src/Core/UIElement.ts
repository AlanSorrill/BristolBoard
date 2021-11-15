
import { FColor, logger, UIFrameDescription, UIFrameResult, SortedLinkedList, KeyboardInputEvent, MouseBtnInputEvent, MouseDraggedInputEvent, MouseInputEvent, MouseMovedInputEvent, MouseScrolledInputEvent, UIFrame, fColor, BristolBoard, MousePinchedInputEvent, IsType } from '../BristolImports'
let log = logger.local('UIElement')

export abstract class UIElement {

    id: string;
    parent: UIElement | BristolBoard<any> = null;
    childElements: SortedLinkedList<UIElement> = SortedLinkedList.Create((a: UIElement, b: UIElement) => (b.depth - a.depth));

    zOffset: number = 0;
    frame: UIFrame;
    brist: BristolBoard<any>;
    isMouseTarget: boolean = false;

    get depth(): number {
        if (this.parent == null || this.parent instanceof BristolBoard) {
            return this.zOffset;
        } else if (this.parent instanceof UIElement) {
            return this.parent.depth + 1 + this.zOffset;
        } else {
            return this.zOffset;
        }
    }
    constructor(uid: string, uiFrame: UIFrame | UIFrameDescription | (<THIS extends UIElement>(element: THIS) => (UIFrame | UIFrameDescription)), brist: BristolBoard<any>) {
        this.id = uid;
        this.brist = brist;
        if (typeof uiFrame == 'function') {
            uiFrame = uiFrame(this);
        }
        // this.panel = panel;
        if (uiFrame instanceof UIFrame) {
            this.frame = uiFrame;
        } else {
            this.frame = UIFrame.Build(uiFrame);
        }
    }



    get isAttachedToBristol() {
        if (this.parent instanceof BristolBoard) {
            return true;
        }
        if (this.parent instanceof UIElement) {
            return this.parent.isAttachedToBristol;
        }
        return false;
    }

    measure(deltaTime: number) {
        let ths = this;
        this.frame.result = {
            left: ths.frame.leftX(),
            right: ths.frame.rightX(),
            top: ths.frame.topY(),
            bottom: ths.frame.bottomY(),
            centerX: ths.frame.centerX(),
            centerY: ths.frame.centerY(),
            width: ths.frame.measureWidth(),
            height: ths.frame.measureHeight()
        }
        this.forEachVisibleChild((elem: UIElement) => {

            if (elem.frame.isVisible()) {
                elem.measure(deltaTime);
            }
        })
    }

    draw(deltaTime: number) {
        let frame = this.frame.result;
        if (frame == null) {
            log.error(`${this.id} was unmeasured`);
            this.measure(deltaTime)
            return;
        }
        this.onDrawBackground(frame, deltaTime);

        this.forEachVisibleChild((elem: UIElement) => {

            if (elem.frame.isVisible()) {
                elem.draw(deltaTime);
            }
        })

        this.onDrawForeground(frame, deltaTime);
    }

    abstract onDrawBackground(frame: UIFrameResult, deltaTime: number): void
    abstract onDrawForeground(frame: UIFrameResult, deltaTime: number): void

    getLeft() {
        if (this.frame.result != null) {
            return this.frame.result.left;
        }
        return this.frame.leftX();
    }
    getRight() {
        if (this.frame.result != null) {
            return this.frame.result.right;
        }
        return this.frame.rightX();
    }
    getTop() {
        if (this.frame.result != null) {
            return this.frame.result.top;
        }
        return this.frame.topY();
    }
    getBottom() {
        if (this.frame.result != null) {
            return this.frame.result.bottom;
        }
        return this.frame.result.bottom;
    }
    getCenterX() {
        if (this.frame.result != null) {
            return this.frame.result.centerX;
        }
        return this.frame.centerX();
    }
    getCenterY() {
        if (this.frame.result != null) {
            return this.frame.result.centerY;
        }
        return this.frame.centerY();
    }
    getWidth() {
        if (this.frame.result != null) {
            return this.frame.result.width;
        }
        return this.frame.measureWidth();
    }
    getHeight() {
        if (this.frame.result != null) {
            return this.frame.result.height;
        }
        return this.frame.measureHeight();
    }

    containsPoint(x: number, y: number) {
        return this.frame.containsPoint(x, y);
    }
    get isDragLocked() {
        return this.brist.dragLockElement?.id == this.id;
    }


    findElementsUnderCursor(x: number, y: number, found: UIElement[] = [], dontCheckChildrenIfOutsideBounds = false) {
        if (this.frame.containsPoint(x, y) && this.frame.isVisible()) {
            found.push(this);
            dontCheckChildrenIfOutsideBounds = false;
        }
        if (!dontCheckChildrenIfOutsideBounds) {
            this.forEachVisibleChild((elem: UIElement) => {
                elem.findElementsUnderCursor(x, y, found);
            })
        }
        return found;


    }

    forEachVisibleChild(onEach: (elem: UIElement, index: number) => void) {
        this.childElements.forEach((value: UIElement, ind: number) => {
            if (value.frame.isVisible()) {
                onEach(value, ind);
            }
        })
    }
    findChild(childId: string) {
        return this.childElements.find((elem) => (elem.id == childId));

    }
    private onAttachToBristolListeners: (() => void)[] = []

    addOnAttachToBristolListener(listener: () => void) {
        if (this.isAttachedToBristol) {
            listener();
        } else {
            if (this.parent != null) {
                (this.parent as UIElement).addOnAttachToBristolListener(listener);
            } else {
                this.onAttachToBristolListeners.push(listener);
            }
        }
    }
    addChild(childElement: UIElement) {
        let i = this.childElements.add(childElement);
        childElement.parent = this;
        childElement.frame.parent = this.frame;
        childElement.onAddToParent();
        return i;
    }
    removeFromParent() {
        if (this.parent instanceof UIElement) {
            this.onRemoveFromParent();
            this.parent.removeChild(this.id);
        } else {
            throw new Error(`Cannot remove root element ${this.id}`)
        }
    }
    onAddToParent() {
        while (this.onAttachToBristolListeners.length > 0) {
            let listener = this.onAttachToBristolListeners.pop();
            if (this.parent instanceof BristolBoard) {
                listener();
            } else {
                this.parent.onAttachToBristolListeners.push(listener);
            }
        }
    }
    onRemoveFromParent() {
    }
    removeChild(childId: string) {
        this.childElements.remove((elem: UIElement) => (elem.id == childId))
    }
    clearChildElements() {
        this.childElements.clear();

    }
    setFrame(frame: UIFrame) {
        this.frame = frame;
    }


    private dfc: FColor = null;
    get debugFrameColor() {
        if (this.dfc == null) {
            let colors = ['red', 'blue', 'green', 'purple', 'orange', 'cyan'];
            let color = colors[Math.floor(Math.random() * colors.length)]
            let subColors = ['accent1', 'accent3', 'lighten2', 'lighten4'];
            let subColor = subColors[Math.floor(Math.random() * subColors.length)]
            this.dfc = fColor[color][subColor]
        }
        return this.dfc;
    }
    drawUIFrame(drawChildFrames: boolean = true, weight: number = 1, showNames: boolean = true) {
        if (this.frame.isVisible()) {
            this.brist.strokeColor(this.debugFrameColor);
            this.brist.strokeWeight(weight);
            this.brist.ellipse(this.frame.result.left, this.frame.result.top, weight * 2, weight * 2);
            this.brist.line(this.frame.result.left, this.frame.result.top, this.frame.result.right, this.frame.result.top);
            this.brist.ellipse(this.frame.result.right, this.frame.result.top, weight * 2, weight * 2);
            this.brist.line(this.frame.result.right, this.frame.result.top, this.frame.result.right, this.frame.result.bottom);
            this.brist.ellipse(this.frame.result.right, this.frame.result.bottom, weight * 2, weight * 2);
            this.brist.line(this.frame.result.right, this.frame.result.bottom, this.frame.result.left, this.frame.result.bottom);
            this.brist.ellipse(this.frame.result.left, this.frame.result.bottom, weight * 2, weight * 2);
            this.brist.line(this.frame.result.left, this.frame.result.bottom, this.frame.result.left, this.frame.result.top);
            this.brist.ellipse(this.frame.result.centerX, this.frame.result.centerY, weight * 2, weight * 2);
            // this.brist.ctx.strokeRect(this.frame.upLeftX(), this.frame.topY(), this.frame.measureWidth(), this.frame.measureHeight());
            //             this.brist.fontFamily(BristolFontFamily.Roboto);
            //             this.brist.textSize(12);
            //             this.brist.textAlign(BristolHAlign.Left, BristolVAlign.Top);
            //             this.brist.text(this.id, this.frame.result.left, this.frame.result.top)
            if (drawChildFrames) {
                this.forEachVisibleChild((elem: UIElement) => {
                    elem.drawUIFrame(true, weight);
                })

            }
        }
    }


    static hasMouseMovementListener(target: UIElement): target is (UIElement & MouseMovementListener) {
        return IsType<MouseMovementListener>(target, 'mouseEnter')
    }
    static hasMouseBtnListener(target: UIElement): target is (UIElement & MouseBtnListener) {
        return IsType<MouseBtnListener>(target, 'mousePressed')
    }
    static hasMouseDragListener(target: UIElement): target is (UIElement & MouseDragListener) {
        return IsType<MouseDragListener>(target, 'mouseDragged')
    }
    static hasWheelListener(target: UIElement): target is (UIElement & MouseWheelListener) {
        return IsType<MouseWheelListener>(target, 'mouseWheel');
    }
    static hasKeyListener(target: UIElement): target is (UIElement & KeyListener) {
        return IsType<KeyListener>(target, 'keyReleased')
    }
    private static idCounter = 0;
    public static createUID(name: string) {
        return `${name}${this.idCounter++}`
    }
}
export enum MouseState {
    Gone,
    Over,
    Pressed
}
export interface MouseMovementListener {
    mouseEnter(evt: MouseInputEvent): boolean
    mouseExit(evt: MouseInputEvent): boolean
    mouseMoved(evt: MouseMovedInputEvent): boolean
}
export interface MouseDragListener {
    shouldDragLock(event: MouseBtnInputEvent): boolean
    mouseDragged(evt: MouseDraggedInputEvent): boolean
    mousePinched(evt: MousePinchedInputEvent): boolean
    onDragEnd(event: MouseBtnInputEvent | MouseDraggedInputEvent): boolean
}
export interface KeyListener {
    keyPressed(evt: KeyboardInputEvent): boolean
    keyReleased(evt: KeyboardInputEvent): boolean
}
export interface MouseWheelListener {
    mouseWheel(delta: MouseScrolledInputEvent): boolean
}
export interface MouseBtnListener {
    mousePressed(evt: MouseBtnInputEvent): boolean
    mouseReleased(evt: MouseBtnInputEvent): boolean
}
