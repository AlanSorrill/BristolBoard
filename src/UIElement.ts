import { UIFrameDescription, UIFrameResult, SortedLinkedList, KeyboardInputEvent, MouseBtnInputEvent, MouseDraggedInputEvent, MouseInputEvent, MouseMovedInputEvent, MouseScrolledInputEvent, UIFrame, fColor, BristolBoard, MousePinchedInputEvent } from './BristolImports'


export class UIElement {
    id: string;
    parent: UIElement | BristolBoard<any> = null;
    cElements: SortedLinkedList<UIElement> = SortedLinkedList.Create((a: UIElement, b: UIElement) => (a.depth - b.depth));
    // childElements: Array<UIElement> = [];
    zOffset: number = 0;
    frame: UIFrame;
    brist: BristolBoard<any>;
    isMouseTarget: boolean = false;

    // panel: UIContentPanel;


private static idCounter = 0;
public static createUID(name: string){
    return `${name}${this.idCounter++}`
}


    get depth() {
        if (this.parent == null || this.parent instanceof BristolBoard) {
            return this.zOffset;
        }

        if (this.parent instanceof UIElement) {
            return this.parent.depth + 1 + this.zOffset;
        }
    }
    constructor(uid: string, uiFrame: UIFrame | UIFrameDescription, brist: BristolBoard<any>) {
        this.id = uid;
        this.brist = brist;
        // this.panel = panel;
        if (uiFrame instanceof UIFrame) {
            this.frame = uiFrame;
        } else {

            this.frame = UIFrame.Build(uiFrame);
        }
    }

    findChild(childId: string) {
        return this.cElements.find((elem) => (elem.id == childId));
        // for (let i = 0; i < this.childElements.length; i++) {
        //     if (this.childElements[i].id == childId) {
        //         return this.childElements[i];
        //     }
        // }
        // return null;
    }
    addChild(childElement: UIElement) {
        // let index: number = -1;

        // index = this.childElements.push(childElement) - 1;

        let i = this.cElements.add(childElement);
        childElement.parent = this;
        childElement.frame.parent = this.frame;
        childElement.onAddToParent();
        return i;
    }


    removeFromParent() {
        if (this.parent instanceof UIElement) {
            this.parent.removeUIElement(this.id);
        } else {
            // (this.parent as any as BristolBoard<any>).removeUIElement(this);
        }
    }
    removeUIElement(childId: string) {
        this.cElements.remove((elem: UIElement) => (elem.id == childId))
        // for (let i = 0; i < this.childElements.length; i++) {
        //     if (this.childElements[i].id == childId) {
        //         this.childElements[i].onRemoveFromParent();
        //         this.childElements[i].parent = null;
        //         this.childElements.splice(i, 1);
        //     }
        // }
    }

    clearChildElements() {
        this.cElements.clear();

    }
    measure(deltaTime: number) {
        let ths = this;
        this.frame.lastResult = {
            left: ths.frame.leftX(),
            right: ths.frame.rightX(),
            top: ths.frame.topY(),
            bottom: ths.frame.bottomY(),
            centerX: ths.frame.centerX(),
            centerY: ths.frame.centerY(),
            width: ths.frame.measureWidth(),
            height: ths.frame.measureHeight()
        }
        this.cElements.forEach((elem: UIElement) => {

            if (elem.frame.isVisible()) {
                elem.measure(deltaTime);
            }
        })
    }

    draw(deltaTime: number) {
        let frame = this.frame.lastResult;
        this.onDrawBackground(frame, deltaTime);

        this.cElements.forEach((elem: UIElement) => {

            if (elem.frame.isVisible()) {
                elem.draw(deltaTime);
            }
        })

        this.onDrawForeground(frame, deltaTime);
    }
    onDrawBackground(frame: UIFrameResult, deltaTime: number) {

    }
    onDrawForeground(frame: UIFrameResult, deltaTime: number) {

    }
    isInside(x: number, y: number) {
        return this.frame.isInside(x, y);
    }

    onAddToParent() {
    }
    onRemoveFromParent() {
    }
    onPanelShow() {
        this.cElements.forEach((elem: UIElement) => {
            elem.onPanelShow();
        })
    }
    onPanelHide() {
        this.cElements.forEach((elem: UIElement) => {
            elem.onPanelHide();
        })
    }
    findElementsUnderCursor(x: number, y: number, found: UIElement[] = []) {
        if (this.frame.isInside(x, y) && this.frame.isVisible()) {
            found.push(this);
            this.cElements.forEach((elem: UIElement) => {
                elem.findElementsUnderCursor(x, y, found);
            })
            return found;
        }

    }
    mousePressed(evt: MouseBtnInputEvent) { return false; }
    mouseReleased(evt: MouseBtnInputEvent) { return false; }
    mouseEnter(evt: MouseInputEvent) { return true; }
    mouseExit(evt: MouseInputEvent) { return false; }
    mouseMoved(evt: MouseMovedInputEvent) { return false; }
    mouseDragged(evt: MouseDraggedInputEvent) { return false; }
    mousePinched(evt: MousePinchedInputEvent) {return false;}
    mouseWheel(delta: MouseScrolledInputEvent) { return false; }
    keyPressed(evt: KeyboardInputEvent) { return false; }
    keyReleased(evt: KeyboardInputEvent) { return false; }


    private dfc = null;
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
    drawUIFrame(drawChildFrames: boolean = true, weight: number = 1) {
        if (this.frame.isVisible()) {
            this.brist.strokeColor(this.debugFrameColor);
            this.brist.strokeWeight(weight);
            this.brist.ellipse(this.frame.leftX(), this.frame.topY(), weight * 2, weight * 2);
            this.brist.line(this.frame.leftX(), this.frame.topY(), this.frame.rightX(), this.frame.topY());
            this.brist.ellipse(this.frame.rightX(), this.frame.topY(), weight * 2, weight * 2);
            this.brist.line(this.frame.rightX(), this.frame.topY(), this.frame.rightX(), this.frame.bottomY());
            this.brist.ellipse(this.frame.rightX(), this.frame.bottomY(), weight * 2, weight * 2);
            this.brist.line(this.frame.rightX(), this.frame.bottomY(), this.frame.leftX(), this.frame.bottomY());
            this.brist.ellipse(this.frame.leftX(), this.frame.bottomY(), weight * 2, weight * 2);
            this.brist.line(this.frame.leftX(), this.frame.bottomY(), this.frame.leftX(), this.frame.topY());
            this.brist.ellipse(this.frame.centerX(), this.frame.centerY(), weight * 2, weight * 2);
            // this.brist.ctx.strokeRect(this.frame.upLeftX(), this.frame.topY(), this.frame.measureWidth(), this.frame.measureHeight());

            if (drawChildFrames) {
                this.cElements.forEach((elem: UIElement) => {
                    elem.drawUIFrame(true, weight);
                })

            }
        }
    }
    get left(){
        if(this.frame.lastResult != null){
            return this.frame.lastResult.left;
        }
        return this.frame.leftX();
    }
    get right(){
        if(this.frame.lastResult != null){
            return this.frame.lastResult.right;
        }
        return this.frame.rightX();
    }
    get top(){
        if(this.frame.lastResult != null){
            return this.frame.lastResult.top;
        } 
        return this.frame.topY();
    }
    get bottom(){
        if(this.frame.lastResult != null){
            return this.frame.lastResult.bottom;
        }
        return this.frame.bottomY();
    }
    get centerX(){
        if(this.frame.lastResult != null){
            return this.frame.lastResult.centerX;
        }
        return this.frame.centerX();
    }
    get centerY(){
        if(this.frame.lastResult != null){
            return this.frame.lastResult.centerY;
        }
        return this.frame.centerY();
    }
    get width(){
        if(this.frame.lastResult != null){
            return this.frame.lastResult.width;
        }
        return this.frame.measureWidth();
    }
    get height(){
        if(this.frame.lastResult != null){
            return this.frame.lastResult.height;
        }
        return this.frame.measureHeight();
    }
}
export enum MouseState {
    Gone,
    Over,
    Pressed
}