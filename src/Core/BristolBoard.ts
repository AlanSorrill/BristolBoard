

import { CoordTuple, ForEachLinkedTuple, isRawPointerMoveData, lengthOfVector2d, TapTuple } from "..";
import {
    LinkedTuple, PunctuationCharacter, RawPointerData, RawPointerMoveData, StringToKeyboardInputKey,
    BristolFontStyle, BristolFontWeight, BristolFontFamily, BristolHAlign, BristolVAlign, LogLevel, UIFrame, UIFrameResult, logger, fColor, FColor, FHTML,
    UIElement, FGesture, Coordinate, MouseDragListener, MouseBtnListener, MouseMovementListener, InputEventAction, InputSource, MouseScrolledInputEvent, BristolCursor, Interp, KeyboardKey
} from "../BristolImports";


let log = logger.local('BristolBoard');
log.allowBelowLvl(LogLevel.debug);

export interface DebugFlags {
    debugUIFrame: boolean
    debugSelection: 'hover' | 'tilde',
    maxRecursionDepth: number
}
export type DebugFlagListener = (key: keyof DebugFlags) => void;


export class BristolBoard<RootElementType extends UIElement> {

    containerDiv: FHTML<HTMLDivElement>;
    canvas: FHTML<HTMLCanvasElement>;


    ctx: CanvasRenderingContext2D;
    mouseBtnsPressed: [boolean, boolean, boolean] = [false, false, false]
    // jobExecutor: JobExecutor = null;
    //keyboardState: Map<string, boolean> = new Map()
    deviceType: DeviceType;
    orientation: DeviceOrientation
    gesture: FGesture;
    fullscreenOnTouch: boolean = true;
    isKeyPressed(key: KeyboardKey): boolean {
        if (!this._pressedKeys.has(key)) {
            return false;
        }
        return this._pressedKeys.get(key);
    }
    dragLockElement: (UIElement & MouseDragListener) = null;
    mouseOverElement: (UIElement & MouseMovementListener) = null;
    debuggerFlags: DebugFlags
    private debuggerFlagListeners: Array<DebugFlagListener> = []


    constructor(containerDivElem: HTMLDivElement, buildRootElement: (brist: BristolBoard<RootElementType>) => Promise<RootElementType>) {

        let ths = this;
        this.debuggerFlags = new Proxy({
            debugSelection: 'hover',
            debugUIFrame: false,
            maxRecursionDepth: 100
        }, {
            set(target: DebugFlags, p: keyof DebugFlags, value: any, receiver: any): boolean {
                target[p as any] = value;
                ths.debuggerFlagListeners.forEach((listener: DebugFlagListener) => {
                    listener(p);
                })
                return true;
            }
        })
        this.deviceType = BristolBoard.getDeviceType();
        //this.uiElements = SortedLinkedList.Create((a: UIElement, b: UIElement) => (a.depth - b.depth));
        this.containerDiv = new FHTML(containerDivElem);

        this.canvas = new FHTML(document.createElement('canvas'));
        this.canvas.attr('oncontextmenu', 'return false');
        this.containerDiv.append(this.canvas);

        this.ctx = this.canvas.element.getContext('2d');
        // if (this.shouldExecJobs()) {
        //     this.jobExecutor = new JobExecutor();
        //     CerealBox.jobExecutor = this.jobExecutor;
        // }
        this.canvas.element.addEventListener('resize', (event) => {
            ths.onResize();
        })
        this.onResize();

        this.lastDrawTime = Date.now();
        this.canvas.element.addEventListener('wheel', (evt: WheelEvent) => {
            var parentOffset = ths.canvas.offset();
            //or $(this).offset(); if you really just want the current element's offset
            var relX = (evt.pageX - parentOffset.left) * ths.resolutionScale;
            var relY = (evt.pageY - parentOffset.top) * ths.resolutionScale;
            if (relX >= 0 && relX <= parentOffset.left + ths.canvas.width * ths.resolutionScale &&
                relY >= 0 && relY <= parentOffset.top + ths.canvas.height * ths.resolutionScale) {
                let event = new MouseScrolledInputEvent(relX, relY, evt.deltaY > 0 ? 1 : -1);

                let overElements = ths.rootElement?.findElementsUnderCursor(relX, relY).sort((a: UIElement, b: UIElement) => (a.depth - b.depth)) ?? [];

                let currentElement: UIElement | (UIElement & MouseBtnListener)
                //  ths.mouseBtnsPressed[evt.which] = false;
                for (let i = 0; i < overElements.length; i++) {
                    currentElement = overElements[i];
                    if (UIElement.hasWheelListener(currentElement)) {
                        log.naughty(`Checking mouseWheel on ${overElements[i].id}`)
                        if (currentElement.mouseWheel(event)) {
                            break;
                        }
                    }
                }
                evt.preventDefault();


            }
        })

        setTimeout(() => ths.refreshOrientation(), 1);
        window.addEventListener("orientationchange", function (event) {
            console.log("The orientation of the screen is: ", screen.orientation);
            ths.refreshOrientation();
            let isGlitched = () => (ths.orientation == DeviceOrientation.landscape && ths.getWidth() < ths.getHeight()) || (ths.orientation == DeviceOrientation.portrait && ths.getWidth() > ths.getHeight())
            let fixGlitches = () => {
                if (isGlitched()) {
                    console.log("GLITCHED!!!")
                    ths.onResize()
                    this.setTimeout(() => fixGlitches(), 1);
                }
            }
            fixGlitches();

            this.setTimeout(() => { }, 1)
        });

        document.addEventListener('mousemove', (evt: MouseEvent) => {
            var parentOffset = ths.canvas.offset();
            //or $(this).offset(); if you really just want the current element's offset
            var relX = (evt.pageX - parentOffset.left) * ths.resolutionScale;
            var relY = (evt.pageY - parentOffset.top) * ths.resolutionScale;
            let deltaX = relX - ths.iMouseX;
            let deltaY = relY - ths.iMouseY;
            ths.iMouseX = relX;
            ths.iMouseY = relY;

            let rawData: RawPointerMoveData = {
                position: [relX, relY],
                action: InputEventAction.Move,
                buttonOrFingerIndex: evt.which,
                source: InputSource.Mouse,
                timeStamp: evt.timeStamp,
                delta: [deltaX, deltaY]
            }
            ths.handlePointerInput(rawData);

            // for (let btnNumber = 0; btnNumber < ths.mouseBtnsPressed.length; btnNumber++) {
            //     if (ths.mouseBtnsPressed[btnNumber]) {
            //         let dragEvent = new MouseDraggedInputEvent(relX, relY, btnNumber, deltaX, deltaY);
            //         if (ths.dragLockElement != null) {
            //             if (!ths.dragLockElement.mouseDragged(dragEvent)) {
            //                 ths.dragLockElement.onDragEnd(dragEvent);
            //                 ths.dragLockElement = null;
            //             } else {
            //                 return;
            //             }
            //         }
            //     }
            // }
            // let event = new MouseMovedInputEvent(relX, relY, deltaX, deltaY);




            // if (this.mouseOverElement != null) {
            //     if (!this.mouseOverElement.frame.containsPoint(relX, relY)) {
            //         this.mouseOverElement.isMouseTarget = false;
            //         this.mouseOverElement.mouseExit(event);
            //         this.mouseOverElement = null;
            //     } else {
            //         return;
            //     }
            // }
            // let overElements: (UIElement)[] = ths.rootElement?.findElementsUnderCursor(relX, relY)?.sort((a: UIElement, b: UIElement) => (a.depth - b.depth)) ?? [];

            // let currentElement: UIElement | (UIElement & MouseMovementListener)
            // for (let i = 0; i < overElements.length; i++) {
            //     currentElement = overElements[i]
            //     if (UIElement.hasMouseMovementListener(currentElement)) {
            //         if (currentElement.mouseMoved(event)) {
            //             if (this.mouseOverElement != null) {
            //                 this.mouseOverElement.mouseExit(event);
            //             }
            //             this.mouseOverElement = currentElement;
            //             this.mouseOverElement.isMouseTarget = true;
            //             this.mouseOverElement.mouseEnter(event);
            //             evt.preventDefault();
            //             break;
            //         }
            //     }
            // }

        })
        document.addEventListener('mousedown', (evt: MouseEvent) => {
            if (this.isFullscreen == false) {
                // this.fullscreen();
            }
            var parentOffset = ths.canvas.offset();

            var relX = (evt.pageX - parentOffset.left) * ths.resolutionScale;
            var relY = (evt.pageY - parentOffset.top) * ths.resolutionScale;
            if (relX >= 0 && relX <= parentOffset.left + ths.canvas.width * ths.resolutionScale &&
                relY >= 0 && relY <= parentOffset.top + ths.canvas.height * ths.resolutionScale) {

                let rawData: RawPointerData = {
                    position: [relX, relY],
                    action: InputEventAction.Down,
                    buttonOrFingerIndex: evt.which,
                    source: InputSource.Mouse,
                    timeStamp: evt.timeStamp
                }
                ths.handlePointerInput(rawData);


                // let overElements = ths.rootElement?.findElementsUnderCursor(relX, relY)?.sort((a: UIElement, b: UIElement) => (b.depth - a.depth)) ?? [];
                // let event = new MouseBtnInputEvent(relX, relY, evt.which, InputEventAction.Down);
                // ths.mouseBtnsPressed[evt.which] = true;

                // let currentElement: UIElement | (UIElement & MouseBtnListener) | (UIElement & MouseDragListener)

                // for (let i = 0; i < overElements.length; i++) {
                //     currentElement = overElements[i];
                //     if (UIElement.hasMouseDragListener(currentElement)) {
                //         if (currentElement.shouldDragLock(event)) {
                //             ths.dragLockElement = currentElement
                //         }
                //     }
                //     if (UIElement.hasMouseBtnListener(currentElement)) {
                //         log.naughty(`Checking mousePressed on ${currentElement.id}`)
                //         if (currentElement.mousePressed(event)) {
                //             break;
                //         }
                //     }

                // }
                evt.preventDefault();

            }
        })
        document.addEventListener('mouseup', (evt: MouseEvent) => {
            var parentOffset = ths.canvas.offset();
            //or $(this).offset(); if you really just want the current element's offset
            var relX = (evt.pageX - parentOffset.left) * ths.resolutionScale;
            var relY = (evt.pageY - parentOffset.top) * ths.resolutionScale;
            if (relX >= 0 && relX <= parentOffset.left + ths.canvas.width * ths.resolutionScale &&
                relY >= 0 && relY <= parentOffset.top + ths.canvas.height * ths.resolutionScale) {
                let rawData: RawPointerData = {
                    position: [relX, relY],
                    action: InputEventAction.Up,
                    buttonOrFingerIndex: evt.which,
                    source: InputSource.Mouse,
                    timeStamp: Date.now()
                }
                ths.handlePointerInput(rawData);


                // let event = new MouseBtnInputEvent(relX, relY, evt.which, InputEventAction.Up);
                // if (ths.dragLockElement != null) {
                //     ths.dragLockElement.onDragEnd(event);
                //     ths.dragLockElement = null;
                // }
                // let overElements = ths.rootElement?.findElementsUnderCursor(relX, relY).sort((a: UIElement, b: UIElement) => (a.depth - b.depth)) ?? [];

                // let currentElement: UIElement | (UIElement & MouseBtnListener)
                // ths.mouseBtnsPressed[evt.which] = false;
                // for (let i = 0; i < overElements.length; i++) {
                //     currentElement = overElements[i];
                //     if (UIElement.hasMouseBtnListener(currentElement)) {
                //         log.naughty(`Checking mouseReleased on ${overElements[i].id}`)
                //         if (currentElement.mouseReleased(event)) {
                //             break;
                //         }
                //     }
                // }
                evt.preventDefault();


            }
        })
        this.gesture = new FGesture(this.canvas, {
            onTouchStart: (index: number, pos: Coordinate) => {
                if (this.isFullscreen == false && ths.deviceType != DeviceType.Desktop && this.fullscreenOnTouch) {
                    this.fullscreen();
                }

                pos.x = pos.x * ths.resolutionScale;
                pos.y = pos.y * ths.resolutionScale;
                let rawData: RawPointerData = {
                    position: [pos.x, pos.y],
                    action: InputEventAction.Down,
                    buttonOrFingerIndex: index,
                    source: InputSource.Touch,
                    timeStamp: Date.now()
                }
                ths.handlePointerInput(rawData);






            },
            onTouchEnd: (index: number, pos: Coordinate) => {
                if (this.isFullscreen == false) {
                    // this.fullscreen();
                }

                pos.x = pos.x * ths.resolutionScale;
                pos.y = pos.y * ths.resolutionScale;

                let rawData: RawPointerData = {
                    position: [pos.x, pos.y],
                    action: InputEventAction.Up,
                    buttonOrFingerIndex: index,
                    source: InputSource.Touch,
                    timeStamp: Date.now()
                }
                ths.handlePointerInput(rawData);


            },
            onDrag: (index: number, pos: Coordinate, delta: Coordinate) => {
                // console.log('drag', { pos, delta })
                pos.x = pos.x * ths.resolutionScale;
                pos.y = pos.y * ths.resolutionScale;
                delta.x = delta.x * ths.resolutionScale;
                delta.y = delta.y * ths.resolutionScale;


                let rawData: RawPointerMoveData = {
                    position: [pos.x, pos.y],
                    action: InputEventAction.Move,
                    buttonOrFingerIndex: index,
                    source: InputSource.Touch,
                    timeStamp: Date.now(),
                    delta: [delta.x, delta.y]
                }
                ths.handlePointerInput(rawData);

            }
            // onPinch: (pos: Coordinate, dragDelta: Coordinate, pinchDelta: Coordinate) => {
            //     // console.log('pinch', { pos, dragDelta, pinchDelta })
            //     pos.x = pos.x * ths.resolutionScale;
            //     pos.y = pos.y * ths.resolutionScale;
            //     dragDelta.x = dragDelta.x * ths.resolutionScale;
            //     dragDelta.y = dragDelta.y * ths.resolutionScale;
            //     pinchDelta.x = pinchDelta.x * ths.resolutionScale;
            //     pinchDelta.y = pinchDelta.y * ths.resolutionScale;
            //     let overElements = ths.rootElement?.findElementsUnderCursor(pos.x, pos.y)?.sort((a: UIElement, b: UIElement) => (b.depth - a.depth)) ?? [];
            //     let event = new MousePinchedInputEvent(pos.x, pos.y, 1, dragDelta.x, dragDelta.y, pinchDelta.x, pinchDelta.y);

            //     let currentElement: UIElement | (UIElement & MouseDragListener)
            //     for (let i = 0; i < overElements.length; i++) {
            //         currentElement = overElements[i];
            //         log.naughty(`Checking mousePinched on ${overElements[i].id}`)
            //         if (UIElement.hasMouseDragListener(currentElement) && currentElement.mousePinched(event)) {
            //             break;
            //         }
            //     }
            // }
        });
        document.addEventListener('keydown', (ev: KeyboardEvent) => {
            console.log(ev.key)
            let key: KeyboardKey | null = StringToKeyboardInputKey(ev.key);
            this._pressedKeys.set(key, true);
            if (key == PunctuationCharacter.BackTick) {
                console.log(`Saving ${ths.debugElem?.id} to bookmarks`);
                if (this.debuggerFlags.debugSelection == 'tilde') {
                    ths.debugElem = this.rootElement.findElementsUnderCursor(this.mouseX, this.mouseY).last;
                }
                ths.debugElementBookmarks.push(ths.debugElem)



            }
        })
        document.addEventListener('keyup', (ev: KeyboardEvent) => {
            console.log(ev.key)
            let key: KeyboardKey | null = StringToKeyboardInputKey(ev.key);
            this._pressedKeys.set(key, false);
        })
        // this.canvas.on('keydown', (event: JQuery.KeyDownEvent<HTMLCanvasElement, null, HTMLCanvasElement, HTMLCanvasElement>)=>{
        //     return ths.keyDown(event);
        // })
        // this.canvas.on('keyup',(event: KeyboardEvent)=>{
        //     return ths.keyUp(event);
        // })

        buildRootElement(this).then((rootElem: RootElementType) => {
            if (ths.rootElement == null) {
                ths.rootElement = rootElem;
            }
            ths.draw();
        })

    }

    public interactionEvents: InteractionEventWatcher[] = [];



    handlePointerInput(rawData: RawPointerData) {
        //console.log(rawData);
        while (rawData.buttonOrFingerIndex >= this.interactionEvents.length) {
            this.interactionEvents.push(new InteractionEventWatcher(this));
        }
        this.interactionEvents[rawData.buttonOrFingerIndex].addInteraction(rawData);


        switch (rawData.action) {
            case InputEventAction.Down:
                // let overElements = ths.rootElement?.findElementsUnderCursor(pos.x, pos.y)?.sort((a: UIElement, b: UIElement) => (b.depth - a.depth)) ?? [];
                // let event = new MouseBtnInputEvent(pos.x, pos.y, 1, InputEventAction.Down);
                // ths.mouseBtnsPressed[0] = true;

                // let currentElement: UIElement | (UIElement & MouseBtnListener) | (UIElement & MouseDragListener)
                // for (let i = 0; i < overElements.length; i++) {
                //     currentElement = overElements[i];
                //     if (UIElement.hasMouseDragListener(currentElement) && currentElement.shouldDragLock(event)) {
                //         ths.dragLockElement = currentElement
                //     }

                //     log.naughty(`Checking mousePressed on ${overElements[i].id}`)
                //     if (UIElement.hasMouseBtnListener(currentElement) && currentElement.mousePressed(event)) {
                //         break;
                //     }
                // }
                break;
            case InputEventAction.Up:
                // let overElements = ths.rootElement?.findElementsUnderCursor(pos.x, pos.y)?.sort((a: UIElement, b: UIElement) => (b.depth - a.depth)) ?? [];
                // let event = new MouseBtnInputEvent(pos.x, pos.y, 1, InputEventAction.Up);
                // if (ths.dragLockElement != null) {
                //     ths.dragLockElement.onDragEnd(event);
                //     ths.dragLockElement = null;
                // }
                // ths.mouseBtnsPressed[0] = false;
                // let currentElement: UIElement | (UIElement & MouseBtnListener)
                // for (let i = 0; i < overElements.length; i++) {
                //     currentElement = overElements[i];
                //     log.debug(`Checking mouseReleased on ${overElements[i].id}`)
                //     if (UIElement.hasMouseBtnListener(currentElement) && currentElement.mouseReleased(event)) {
                //         break;
                //     }
                // }
                break;
            case InputEventAction.Move:

                // let event = new MouseDraggedInputEvent(pos.x, pos.y, 1, delta.x, delta.y);

                // if (ths.dragLockElement != null) {
                //     ths.dragLockElement.mouseDragged(event);
                //     return;
                // }
                // let overElements = ths.rootElement?.findElementsUnderCursor(pos.x, pos.y)?.sort((a: UIElement, b: UIElement) => (b.depth - a.depth)) ?? [];

                // let currentElement: UIElement | (UIElement & MouseDragListener)
                // for (let i = 0; i < overElements.length; i++) {
                //     currentElement = overElements[i];
                //     log.naughty(`Checking mouseDragged on ${overElements[i].id}`)
                //     if (UIElement.hasMouseDragListener(currentElement) && currentElement.mouseDragged(event)) {
                //         break;
                //     }
                // }
                break;
        }
    }
    getElementsUnderTouch(rawData: RawPointerData) {
        return this.rootElement?.findElementsUnderCursor(rawData.position[0], rawData.position[1]).sort((a: UIElement, b: UIElement) => (a.depth - b.depth)) ?? [];
    }
    getKeys() {
        return this._pressedKeys.toArrayWithKeys();
    }
    private _pressedKeys: Map<KeyboardKey, boolean> = new Map();
    rootElement: RootElementType = null;

    // mousePressed(evt: MouseBtnInputEvent) {
    //     return this.rootElement.mousePressed(evt);
    // }
    //  mouseReleased(evt: { start: RawPointerData; end: RawPointerData; timeDown: number; }) {
    //     return this.rootElement.mouseReleased(evt);
    // }
    // mouseMoved(event: MouseMovedInputEvent) {
    //     return false;
    // }
    // keyUp(event: KeyboardInputEvent): boolean {
    //     return false;
    // }
    // keyDown(event: KeyboardInputEvent): boolean {
    //     return false;
    // }
    addOnDebuggerFlagListener(listener: DebugFlagListener) {
        this.debuggerFlagListeners.push(listener);
    }
    pixelDensity(): number {
        return window.devicePixelRatio;
    }
    minTouchSize() {
        return Math.min(this.getWidth(), this.getHeight()) / 6;
    }
    private lastScrollOffset: [number, number] = [0, 0];
    private scrollDeltaY: number = 0;
    private scrollDeltaX: number = 0;
    // private hammerManager: HammerManager
    // private rotateRecognizer: RotateRecognizer;
    // private panRecognizer: PanRecognizer;
    private lastDrawTime: number;
    private currentDrawTime: number;
    private deltaDrawTime: number;
    get targetFrameTime(): number {
        return 1000 / this.targetFps;
    }
    get fps() {
        return 1 / (this.deltaDrawTime / 1000)
    }
    get performanceRatio() {
        return this.targetFps / this.deltaDrawTime
    }

    targetFps: number = 20;

    private draw() {

        this.currentDrawTime = Date.now();
        this.deltaDrawTime = (this.currentDrawTime - this.lastDrawTime);

        this.onDraw(this.deltaDrawTime);
        this.lastDrawTime = this.currentDrawTime;
        let ths = this;
        // if (this.shouldExecJobs()) {
        //     await this.jobExecutor.execJobs();
        // }

        if (this.autoFrames) {
            if (this.deltaDrawTime >= this.targetFrameTime || this.targetFps == -1) {
                window.requestAnimationFrame(() => {
                    ths.draw();
                });
            } else {
                setTimeout(() => {
                    window.requestAnimationFrame(() => {
                        ths.draw();
                    });
                }, Math.max(this.targetFrameTime - this.deltaDrawTime, 0))
            }

        }

    }
    drawFrame() {
        if (!this.autoFrames) {
            window.requestAnimationFrame(this.draw.bind(this));
            return true;
        }
        return false;
    }
    autoFrames: boolean = true;
    getWidth() {
        return this.iWidth * this.resolutionScale;
    }
    getHeight() {
        return this.iHeight * this.resolutionScale;
    }
    private iWidth: number;
    private iHeight: number;
    private iMouseX: number;
    private iMouseY: number;
    get mouseX(): number {
        return this.iMouseX;
    }
    get mouseY(): number {
        return this.iMouseY;
    }
    public resolutionScale: number = 2;
    private onResize() {
        this.iWidth = this.containerDiv.width;
        this.iHeight = this.containerDiv.height;
        this.canvas.element.width = this.iWidth * this.resolutionScale;
        this.canvas.element.height = this.iHeight * this.resolutionScale;
        this.canvas.setCss('width', `${this.iWidth}px`);
        this.canvas.setCss('height', `${this.iHeight}px`);
    }
    refreshOrientation() {
        let type: DeviceOrientation = screen.orientation.type.split('-')[0] as DeviceOrientation;
        console.log(type);
        this.orientation = type;
    }
    displayDensity() {
        return 1;
    }
    static noStyle: string = ''
    strokeColor(style: FColor) {
        this.ctx.strokeStyle = style?.toHexString() ?? '#000000';
    }
    roundedRect(x: number, y: number, w: number, h: number, rad: number | CornerRadius) {
        if (typeof rad == 'number') {
            rad = {
                lowerLeft: rad,
                lowerRight: rad,
                upperLeft: rad,
                upperRight: rad
            }
        }
        let upperLeft: [number, number] = [x, y];
        let upperRight: [number, number] = [x + w, y];
        let lowerRight: [number, number] = [x + w, y + h];
        let lowerLeft: [number, number] = [x, y + h];

        this.ctx.beginPath();
        this.ctx.moveTo(upperLeft[0] + rad.upperLeft, upperLeft[1]);
        this.ctx.lineTo(upperRight[0] - rad.upperRight, upperRight[1]);
        this.ctx.arcTo(upperRight[0], upperRight[1], upperRight[0], upperRight[1] + rad.upperRight, rad.upperRight);
        this.ctx.lineTo(lowerRight[0], lowerRight[1] - rad.lowerRight);
        this.ctx.arcTo(lowerRight[0], lowerRight[1], lowerRight[0] - rad.lowerRight, lowerRight[1], rad.lowerRight);
        this.ctx.lineTo(lowerLeft[0] + rad.lowerLeft, lowerLeft[1]);
        this.ctx.arcTo(lowerLeft[0], lowerLeft[1], lowerLeft[0], lowerLeft[1] - rad.lowerLeft, rad.lowerLeft);
        this.ctx.lineTo(upperLeft[0], upperLeft[1] + rad.upperLeft);
        this.ctx.arcTo(upperLeft[0], upperLeft[1], upperLeft[0] + rad.upperLeft, upperLeft[1], rad.upperLeft);
        this.ctx.closePath();
    }
    isFullscreen: boolean = false;
    fullscreen() {
        //TODO instantiate this method
        // let ths = this;
        // document.documentElement.requestFullscreen({ navigationUI: "hide" }).then(() => {
        //     console.log('gotFullscreen')
        //     ths.isFullscreen = true;
        // })
    }
    roundedRectFrame(frame: UIFrame | UIFrameResult, rad: number | CornerRadius, fill: boolean = false, stroke: boolean = false) {
        if (typeof rad == 'number') {
            rad = {
                lowerLeft: rad,
                lowerRight: rad,
                upperLeft: rad,
                upperRight: rad
            }
        }
        let upperLeft: [number, number];
        let upperRight: [number, number];
        let lowerRight: [number, number];
        let lowerLeft: [number, number];

        if (frame instanceof UIFrame) {
            lowerLeft = [frame.leftX(), frame.bottomY()];
            lowerRight = [frame.rightX(), frame.bottomY()];
            upperRight = [frame.rightX(), frame.topY()];
            upperLeft = [frame.leftX(), frame.topY()];
        } else {
            lowerLeft = [frame.left, frame.bottom];
            lowerRight = [frame.right, frame.bottom];
            upperRight = [frame.right, frame.top];
            upperLeft = [frame.left, frame.top];
        }


        this.ctx.beginPath();
        this.ctx.moveTo(upperLeft[0] + rad.upperLeft, upperLeft[1]);
        this.ctx.lineTo(upperRight[0] - rad.upperRight, upperRight[1]);
        this.ctx.arcTo(upperRight[0], upperRight[1], upperRight[0], upperRight[1] + rad.upperRight, rad.upperRight);
        this.ctx.lineTo(lowerRight[0], lowerRight[1] - rad.lowerRight);
        this.ctx.arcTo(lowerRight[0], lowerRight[1], lowerRight[0] - rad.lowerRight, lowerRight[1], rad.lowerRight);
        this.ctx.lineTo(lowerLeft[0] + rad.lowerLeft, lowerLeft[1]);
        this.ctx.arcTo(lowerLeft[0], lowerLeft[1], lowerLeft[0], lowerLeft[1] - rad.lowerLeft, rad.lowerLeft);
        this.ctx.lineTo(upperLeft[0], upperLeft[1] + rad.upperLeft);
        this.ctx.arcTo(upperLeft[0], upperLeft[1], upperLeft[0] + rad.upperLeft, upperLeft[1], rad.upperLeft);
        this.ctx.closePath();

        if (fill) {
            this.ctx.fill();
        }
        if (stroke) {
            this.ctx.stroke();
        }
    }
    // rectFrame(frame: UIFrame, rad: number | CornerRadius) {
    //     let upperLeft: [number, number] = [frame.upLeftX(), frame.topY()];
    //     let upperRight: [number, number] = [frame.upRightX(), frame.upRightY()];
    //     let lowerRight: [number, number] = [frame.rightX(), frame.bottomY()];
    //     let lowerLeft: [number, number] = [frame.leftX(), frame.bottomY()];

    //     this.ctx.beginPath();
    //     this.ctx.moveTo(frame.upLeftX(), frame.topY());
    //     this.ctx.lineTo(frame.upRightX(), frame.upRightY());
    //     this.ctx.lineTo(frame.rightX(), frame.bottomY());
    //     this.ctx.lineTo(frame.leftX(), frame.downLeftY());
    //     this.ctx.lineTo(frame.upLeftX(), frame.topY());
    //     this.ctx.closePath();
    // }


    candleIcon(x: number, y: number, w: number, h: number, rad: number = 2, wiskerSize: [number, number] = [0.2, 0.9], boxSize: [number, number] = [0.4, 0.6], padding: number = 2) {
        let boxVPadding = (h - (h * boxSize[1])) / 2;
        let boxWPadding = (w - (w * boxSize[0])) / 2;
        let wiskerVPadding = (h - (h * wiskerSize[1])) / 2;
        let wiskerWPadding = (w - (w * wiskerSize[0])) / 2;
        let boxTop = y + boxVPadding;
        let boxBottom = y + h - boxVPadding;
        let boxLeft = x + boxWPadding;
        let boxRight = x + w - boxWPadding;

        let wiskerTop = y + wiskerVPadding;
        let wiskerBottom = y + h - wiskerVPadding;
        let wiskerLeft = x + wiskerWPadding;
        let wiskerRight = x + w - wiskerWPadding;
        let data: Array<[number, number] | [[number, number], [number, number], [number, number], number]> = [
            [wiskerLeft, boxTop],
            [[wiskerLeft, wiskerTop + rad], [wiskerLeft, wiskerTop], [wiskerLeft + rad, wiskerTop], rad],

            [[wiskerRight - rad, wiskerTop], [wiskerRight, wiskerTop], [wiskerRight, wiskerTop + rad], rad],
            [wiskerRight, boxTop],
            [[boxRight - rad, boxTop], [boxRight, boxTop], [boxRight, boxTop + rad], rad],
            [[boxRight, boxBottom - rad], [boxRight, boxBottom], [boxRight - rad, boxBottom], rad],
            [wiskerRight, boxBottom],
            [[wiskerRight, wiskerBottom - rad], [wiskerRight, wiskerBottom], [wiskerRight - rad, wiskerBottom], rad],
            [[wiskerLeft + rad, wiskerBottom], [wiskerLeft, wiskerBottom], [wiskerLeft, wiskerBottom - rad], rad],
            [wiskerLeft, boxBottom],
            [[boxLeft + rad, boxBottom], [boxLeft, boxBottom], [boxLeft, boxBottom - rad], rad],
            [[boxLeft, boxTop + rad], [boxLeft, boxTop], [boxLeft + rad, boxTop], rad],
            [wiskerLeft, boxTop]
        ]
        //[x, y] | [[x,y],[x,y],[x,y],radius]
        this.ctx.beginPath();

        var startPoint: [number, number] = data[0] as [number, number];
        this.ctx.moveTo(startPoint[0], startPoint[1]);
        var points: [[number, number], [number, number], [number, number], number]
        for (let i = 1; i < data.length; i++) {
            if (data[i].length == 2) {//[x,y]
                this.ctx.lineTo(data[i][0] as number, data[i][1] as number);
            } else {//[[x, y], [x, y], [x, y], radius]
                points = data[i] as any;
                this.ctx.lineTo(points[0][0], points[0][1]);//A
                this.ctx.arcTo(points[1][0], points[1][1], points[2][0], points[2][1], points[3]);
            }
        }
    }
    fillColor(style: FColor) {
        if (style == null) {
            this.ctx.fillStyle = BristolBoard.noStyle;
            return;
        }
        this.ctx.fillStyle = style.toHexString();
    }
    noStroke() {
        this.ctx.strokeStyle = BristolBoard.noStyle;
    }
    noFill() {
        this.ctx.fillStyle = BristolBoard.noStyle
    }
    strokeWeight(weight: number) {
        this.ctx.lineWidth = weight;
    }
    cursor(cursorCss: BristolCursor) {
        this.canvas.setCss('cursor', cursorCss);
    }
    background(color: FColor) {
        this.noStroke();
        this.fillColor(color);
        this.ctx.fillRect(0, 0, this.getWidth(), this.getHeight());
    }
    line(x1: number, y1: number, x2: number, y2: number) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }
    ellipse(centerX: number, centerY: number, width: number, height: number, stroke: boolean = true, fill: boolean = false) {
        this.ellipseBounds(centerX - width / 2.0, centerY - height / 2.0, width, height, stroke, fill);
    }

    // ellipseFrame(uiFrame: UIFrame, stroke: boolean = true, fill: boolean = false) {
    //     this.ellipseBounds(uiFrame.leftX(), uiFrame.topY(), uiFrame.measureWidth(), uiFrame.measureHeight())
    // }
    ellipseBounds(cornerX: number, cornerY: number, w: number, h: number, stroke: boolean = true, fill: boolean = false) {
        var kappa = .5522848,
            ox = (w / 2) * kappa, // control point offset horizontal
            oy = (h / 2) * kappa, // control point offset vertical
            xe = cornerX + w,           // x-end
            ye = cornerY + h,           // y-end
            xm = cornerX + w / 2,       // x-middle
            ym = cornerY + h / 2;       // y-middle

        this.ctx.beginPath();
        this.ctx.moveTo(cornerX, ym);
        this.ctx.bezierCurveTo(cornerX, ym - oy, xm - ox, cornerY, xm, cornerY);
        this.ctx.bezierCurveTo(xm + ox, cornerY, xe, ym - oy, xe, ym);
        this.ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
        this.ctx.bezierCurveTo(xm - ox, ye, cornerX, ym + oy, cornerX, ym);

        if (stroke) {
            this.ctx.stroke();
        }
        if (fill) {
            this.ctx.fill();
        }
    }
    text(str: string, x: number, y: number) {
        this.ctx.fillText(str, x, y);
    }
    protected font: BristolFont = new BristolFont();
    getFontText() {
        return this.font.toString();
    }
    textWeight(weight: BristolFontWeight) {
        this.font.weight = weight;
        this.ctx.font = this.font.toString();
    }
    textSizeMaxWidth(perferredSize: number, textToMeasure: string, maxWidth: number, stepSize: number = 5) {
        this.textSize(perferredSize);
        let textMetrics = this.ctx.measureText(textToMeasure);
        let textWidth = Math.abs(textMetrics.actualBoundingBoxLeft) +
            Math.abs(textMetrics.actualBoundingBoxRight);
        while (textWidth > maxWidth) {
            if (perferredSize <= 0) {
                perferredSize = 1;
                this.textSize(perferredSize);
                break;
            }
            perferredSize -= stepSize;
            this.textSize(perferredSize);
            textMetrics = this.ctx.measureText(textToMeasure);
            textWidth = Math.abs(textMetrics.actualBoundingBoxLeft) +
                Math.abs(textMetrics.actualBoundingBoxRight);
        }
    }
    textSize(size: number) {
        this.font.size = size;
        this.ctx.font = this.font.toString()
    }
    fontFamily(family: BristolFontFamily) {
        this.font.family = family;
        this.ctx.font = this.font.toString();
    }
    textAlign(horizontal: BristolHAlign, vertical: BristolVAlign) {
        this.ctx.textAlign = horizontal;
        this.ctx.textBaseline = vertical;
    }
    textWidth(text: string): number {
        return this.ctx.measureText(text).width;
    }
    rect(x: number, y: number, w: number, h: number, stroke: boolean = true, fill: boolean = false) {
        this.ctx.rect(x, y, w, h)
        if (stroke) {
            this.ctx.stroke();
        }
        if (fill) {
            this.ctx.fill();
        }
    }
    ellipseFrame(frame: UIFrameResult | UIFrame, stroke: boolean = true, fill: boolean = false) {
        if (frame instanceof UIFrame) {
            return this.ellipseFrame(frame.result, stroke, fill);
        }
        this.ellipseBounds(frame.left, frame.top, frame.width, frame.height, stroke, fill)
    }
    rectFrame(frame: UIFrameResult | UIFrame, stroke: boolean = true, fill: boolean = false) {
        if (frame instanceof UIFrame) {
            return this.rectFrame(frame.result, stroke, fill);
        }
        this.ctx.rect(frame.left, frame.top, frame.width, frame.height);
        if (stroke && this.ctx.strokeStyle != null) {
            this.ctx.stroke();
        }
        if (fill && this.ctx.fillStyle != null) {
            this.ctx.fill();
        }
    }


    shouldExecJobs(): boolean {
        return false;
    }

    highFpsRequests: HighFpsRequest = null;
    manageHighFpsRequests() {
        if (this.highFpsRequests == null) {
            this.targetFps = 20;
            return;
        }
        this.targetFps = 60;
        if (!this.highFpsRequests[0]()) {
            this.highFpsRequests = this.highFpsRequests[1];
        }
        if (this.highFpsRequests == null) {
            this.targetFps = 20;
            return;
        }
        let last = this.highFpsRequests;
        let current = this.highFpsRequests[1];
        while (current != null) {
            if (!current[0]()) {
                last[1] = current[1];
            }
            last = current;
            current = current[1];
        }
    }
    requestHighFps(lock: () => boolean) {
        if (this.highFpsRequests == null) {
            this.highFpsRequests = [lock, null];
            return;
        }
        let current = this.highFpsRequests;
        while (current[1] != null) {
            current = current[1];
        }
        current[1] = [lock, null];
    }
    debugElementBookmarks: UIElement[] = [];
    debugElem: UIElement = null;
    onDraw(deltaMs: number): void {
        let ths = this;
        this.noStroke();
        this.fillColor(fColor.grey.darken3);
        this.ctx.fillRect(0, 0, this.getWidth(), this.getHeight());

        //this.targetFps = Interp.highFPSRequests > 0 ? 60 : 20;
        this.manageHighFpsRequests();

        this.rootElement?.measure(deltaMs);
        this.rootElement?.draw(deltaMs);

        if (this.debuggerFlags.debugUIFrame && this.rootElement != null) {

            if (this.debuggerFlags.debugSelection == 'hover') {
                this.debugElem = this.rootElement.findElementsUnderCursor(this.mouseX, this.mouseY).last
            }
            if (this.debugElem == null) {
                this.debugElem = this.rootElement;
            }
            this.debugElem.drawUIFrame(true, 3);
            if (this.debugElem != null) {
                this.fillColor(this.debugElem.debugFrameColor);
                this.textAlign(BristolHAlign.Left, BristolVAlign.Bottom);
                this.textSize(12);
                this.ctx.fillText(this.debugElem?.id, this.mouseX, this.mouseY)
            }
        }
    }

    static getDeviceType(): DeviceType {
        if (this.isPhone()) {
            return DeviceType.Phone;
        } else if (this.isPhoneOrTablet()) {
            return DeviceType.Tablet;
        } else {
            return DeviceType.Desktop;
        }
    }

    static isPhone(): boolean {
        let check = false;
        (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window['opera']);
        return check;
    };

    static isPhoneOrTablet(): boolean {
        let check = false;
        (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window['opera']);
        return check;
    };
}

export class InteractionEventWatcher {
    interactions: LinkedTuple<RawPointerData> = null;
    brist: BristolBoard<any>;
    static minDragDistance = 10;
    constructor(brist: BristolBoard<any>, trackHover: boolean = false) {
        this.brist = brist;
        if (trackHover !== false) {
            this._hoverElement = null;
        }
    }
    get currentInteraction(): null | 'Drag' | TapTuple {
        if (!this.isDown) {
            return null;
        }
        let distance = this.distanceSinceLastDown;
        if (distance > InteractionEventWatcher.minDragDistance) {
            return 'Drag'
        }
        let timeDown = this.timeSinceDown;

    }
    get lastEvent(): RawPointerData {
        return (this.interactions == null) ? null : this.interactions[0];
    }
    lastDown: RawPointerData = null
    lastUp: RawPointerData = null
    lastMove: RawPointerData = null

    private _hoverElement: UIElement | Boolean = false
    private _dragLock: UIElement & MouseDragListener = null
    private _lastTap: UIElement & MouseBtnListener = null

    get doesTrackHover(): boolean {
        return this._hoverElement !== false;
    }
    get isDown(): boolean {
        if (this.lastDown == null) { return false }
        if (this.lastUp == null) { return true; }
        return (this.lastDown.timeStamp > this.lastUp.timeStamp);
    }
    get distanceSinceLastDown(): number | null {
        let delta = this.deltaSinceLastDown;
        if (delta == null) {
            return null;
        }
        return Math.sqrt(Math.pow(delta[0], 2) + Math.pow(delta[1], 2));
    }

    get deltaSinceLastDown(): CoordTuple | null {
        if (!this.isDown) {
            return null;
        }
        let delta: CoordTuple = [0, 0]
        ForEachLinkedTuple(this.interactions, (value: RawPointerData, depth: number) => {
            if (isRawPointerMoveData(value)) {
                delta[0] += Math.abs(value.delta[0]);
                delta[1] += Math.abs(value.delta[1]);
            } else {
                return false;
            }
        })
        return delta;
    }

    get timeSinceDown(): number {
        if (this.lastDown == null) { return -1 }
        return Date.now() - this.lastDown.timeStamp;
    }

    updateTimeouts() {

    }

    addInteraction(rawData: RawPointerData) {
        let overElements = this.brist.getElementsUnderTouch(rawData);
        let currentElement: UIElement
        switch (rawData.action) {
            case InputEventAction.Down:
                this.lastDown = rawData;
                for (let i = 0; i < overElements.length; i++) {
                    currentElement = overElements[i]
                    if (UIElement.hasMouseDragListener(currentElement)) {
                        if (currentElement.shouldDragLock(rawData)) {
                            this._dragLock = currentElement;

                            currentElement.dragLockCount++;
                            break;
                        }
                    }
                }
                break;
            case InputEventAction.Up:
                this.lastUp = rawData;
                if (this._dragLock != null) {
                    this._dragLock.dragLockCount--;
                    this._dragLock.onDragEnd(rawData);

                    this._dragLock = null;
                }

                let timeDown = this.timeSinceDown;
                let distance = lengthOfVector2d(this.deltaSinceLastDown);

                if (distance < InteractionEventWatcher.minDragDistance) {
                    for (let i = 0; i < overElements.length; i++) {
                        currentElement = overElements[i]
                        if (UIElement.hasMouseBtnListener(currentElement)) {
                            if (currentElement.mouseReleased({ start: this.lastDown, end: this.lastUp, timeDown: timeDown })) {
                           // if (currentElement.mouseTapped(rawData)) {
                                break;
                            }
                        }
                    }
                }

                break;
            case InputEventAction.Move:
                this.lastMove = rawData;

                if (this.isDown) {//drag
                    if (this._dragLock == null) {
                        let current: UIElement | (UIElement & MouseDragListener);
                        for (let i = 0; i < overElements.length; i++) {
                            current = overElements[i]
                            if (UIElement.hasMouseDragListener(current)) {
                                if (current.shouldDragLock([this.lastDown, rawData as RawPointerMoveData])) {
                                    this._dragLock = current;
                                    this._dragLock.dragLockCount++;
                                    this._dragLock.mouseDragged(rawData as RawPointerMoveData);
                                    break;
                                }
                            }
                        }
                    } else {
                        this._dragLock.mouseDragged(rawData as RawPointerMoveData);
                    }
                }
                break;
        }

        this.interactions = [rawData, this.interactions]
    }

}
export class BristolFont {
    style: BristolFontStyle = BristolFontStyle.Normal
    weight: BristolFontWeight | number = BristolFontWeight.normal;
    family: BristolFontFamily = BristolFontFamily.Monospace;
    size: number = 12;
    toString() {
        return `${this.size}px ${this.family}`// ${this.style} ${this.weight}
    }
}

export type HighFpsRequest = [(() => boolean), HighFpsRequest]
export interface CornerRadius {
    upperLeft: number
    upperRight: number
    lowerLeft: number
    lowerRight: number
}
export enum DeviceType {
    Phone, Tablet, Desktop
}
export enum DeviceOrientation {
    portrait = 'portrait', landscape = 'landscape'
}