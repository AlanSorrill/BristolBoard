
import {
    BristolFontStyle, BristolFontWeight, BristolFontFamily, BristolHAlign, BristolVAlign, LogLevel, UIFrame, UIFrameResult, logger, fColor, FColor, FHTML,
    UIElement, FGesture, Coordinate, MouseDragListener, MouseBtnListener, MouseMovementListener, InputEventAction, KeyboardInputKey, MouseBtnInputEvent, MouseDraggedInputEvent, MouseMovedInputEvent, MousePinchedInputEvent, MouseScrolledInputEvent
} from "../BristolImports";


let log = logger.local('BristolBoard');
log.allowBelowLvl(LogLevel.debug);


export class BristolBoard<RootElementType extends UIElement> {

    containerDiv: FHTML<HTMLDivElement>;
    canvas: FHTML<HTMLCanvasElement>;
    canvasElem: HTMLCanvasElement = null;
    containerDivElem: HTMLDivElement;
    ctx: CanvasRenderingContext2D;
    mouseBtnsPressed: [boolean, boolean, boolean] = [false, false, false]
    // jobExecutor: JobExecutor = null;
    keyboardState: Map<string, boolean> = new Map()
    deviceType: DeviceType;
    orientation: DeviceOrientation
    gesture: FGesture;
    fullscreenOnTouch: boolean = true;
    isKeyPressed(key: KeyboardInputKey): boolean {
        return this.keyboardState.get(key) || false;
    }
    dragLockElement: (UIElement & MouseDragListener) = null;
    mouseOverElement: (UIElement & MouseMovementListener) = null;
    debuggerFlags: {
        uiFrameOutlines: boolean
    } = {
            uiFrameOutlines: false
        }


    constructor(containerDivElem: HTMLDivElement, buildRootElement: (brist: BristolBoard<RootElementType>) => Promise<RootElementType>) {
        this.deviceType = BristolBoard.getDeviceType();
        let ths = this;
        //this.uiElements = SortedLinkedList.Create((a: UIElement, b: UIElement) => (a.depth - b.depth));
        this.containerDiv = new FHTML(containerDivElem);
        this.containerDivElem = containerDivElem;
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
                let event = new MouseScrolledInputEvent(relX, relY, evt.deltaY);

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
            let isGlitched = () => (ths.orientation == DeviceOrientation.landscape && ths.width < ths.height) || (ths.orientation == DeviceOrientation.portrait && ths.width > ths.height)
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
        // this.hammerManager = new Hammer.Manager(this.canvas.element);
        // this.rotateRecognizer = new Hammer.Rotate();
        // this.panRecognizer = new Hammer.Pan();
        // this.hammerManager.add(this.rotateRecognizer);
        // this.hammerManager.add(this.panRecognizer);

        // this.hammerManager.on('panstart', (evt: HammerInput) => {
        //     this.lastScrollOffset = [0, 0];
        //     if (this.mousePressed(new MouseBtnInputEvent(evt.center.x * this.resolutionScale, evt.center.y * this.resolutionScale, 1, InputEventAction.Down))) {
        //         evt.preventDefault();
        //     }
        // })
        // this.hammerManager.on('panend', (evt: HammerInput) => {
        //     this.lastScrollOffset = [0, 0];

        //     if (this.mouseReleased(new MouseBtnInputEvent(evt.center.x * this.resolutionScale, evt.center.y * this.resolutionScale, 1, InputEventAction.Up))) {
        //         evt.preventDefault();
        //     }
        // })
        // this.hammerManager.on('pan', (evt: HammerInput) => {
        //     ths.scrollDeltaX += evt.deltaX * this.resolutionScale - ths.lastScrollOffset[0];
        //     ths.scrollDeltaY += evt.deltaY * this.resolutionScale - ths.lastScrollOffset[1];
        //     ths.lastScrollOffset[0] = evt.deltaX * this.resolutionScale;
        //     ths.lastScrollOffset[1] = evt.deltaY * this.resolutionScale;
        //     if (Math.max(Math.abs(this.scrollDeltaX), Math.abs(this.scrollDeltaY)) > 1) {
        //         //  console.log(`${this.scrollDeltaX}, ${this.scrollDeltaY}`);
        //         ths.mouseDragged(new MouseDraggedInputEvent(evt.center.x * this.resolutionScale, evt.center.y * this.resolutionScale, 1, ths.scrollDeltaX, ths.scrollDeltaY))
        //         // ths.mouseDragged(evt, this.scrollDeltaX, this.scrollDeltaY);
        //         this.scrollDeltaX = 0;
        //         this.scrollDeltaY = 0;
        //     }
        // })

        // document.addEventListener('keydown', (evt: KeyboardEvent) => {

        //     // var inputKey: KeyboardInputKey
        //     // if(evt.shiftKey){
        //     //     inputKey = KeyboardInputKey.shift;
        //     // } else if(evt.ctrlKey){
        //     //     inputKey = KeyboardInputKey.ctrl;
        //     // } else if(evt.altKey){
        //     //     inputKey = KeyboardInputKey.alt;

        //     // } else {
        //     //     inputKey = KeyboardInputKey[evt.key.toLowerCase()];
        //     // }
        //     this.keyboardState.set(evt.key, true);
        //     let event = new KeyboardInputEvent(InputEventAction.Down, evt.key, this.isKeyPressed(KeyboardInputKey.shift), this.isKeyPressed(KeyboardInputKey.ctrl), this.isKeyPressed(KeyboardInputKey.alt))
        //     if (ths.keyDown(event)) {
        //         evt.preventDefault();
        //     }
        // })
        // document.addEventListener('keyup', (evt: KeyboardEvent) => {

        //     this.keyboardState.set(evt.key, false);
        //     let event = new KeyboardInputEvent(InputEventAction.Down, evt.key, this.isKeyPressed(KeyboardInputKey.shift), this.isKeyPressed(KeyboardInputKey.ctrl), this.isKeyPressed(KeyboardInputKey.alt))
        //     if (ths.keyUp(event)) {
        //         evt.preventDefault();
        //     }
        // })
        document.addEventListener('mousemove', (evt: MouseEvent) => {
            var parentOffset = ths.canvas.offset();
            //or $(this).offset(); if you really just want the current element's offset
            var relX = (evt.pageX - parentOffset.left) * ths.resolutionScale;
            var relY = (evt.pageY - parentOffset.top) * ths.resolutionScale;
            let deltaX = relX - ths.iMouseX;
            let deltaY = relY - ths.iMouseY;
            ths.iMouseX = relX;
            ths.iMouseY = relY;

            for (let btnNumber = 0; btnNumber < ths.mouseBtnsPressed.length; btnNumber++) {
                if (ths.mouseBtnsPressed[btnNumber]) {
                    let dragEvent = new MouseDraggedInputEvent(relX, relY, btnNumber, deltaX, deltaY);
                    if (ths.dragLockElement != null) {
                        ths.dragLockElement.mouseDragged(dragEvent);
                        return;
                    }
                }
            }
            let event = new MouseMovedInputEvent(relX, relY, deltaX, deltaY);



            let overElements: (UIElement)[] = ths.rootElement?.findElementsUnderCursor(relX, relY)?.sort((a: UIElement, b: UIElement) => (a.depth - b.depth)) ?? [];

            if (this.mouseOverElement != null) {
                if (!this.mouseOverElement.frame.isInside(relX, relY)) {
                    this.mouseOverElement.isMouseTarget = false;
                    this.mouseOverElement.mouseExit(event);
                    this.mouseOverElement = null;
                }
            }
            let currentElement: UIElement | (UIElement & MouseMovementListener)
            for (let i = 0; i < overElements.length; i++) {
                currentElement = overElements[i]
                if (UIElement.hasMouseMovementListener(currentElement)) {
                    if (currentElement.mouseMoved(event)) {
                        if (this.mouseOverElement != null) {
                            this.mouseOverElement.mouseExit(event);
                        }
                        this.mouseOverElement = currentElement;
                        this.mouseOverElement.isMouseTarget = true;
                        this.mouseOverElement.mouseEnter(event);
                        evt.preventDefault();
                        break;
                    }
                }
            }

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

                let overElements = ths.rootElement?.findElementsUnderCursor(relX, relY)?.sort((a: UIElement, b: UIElement) => (b.depth - a.depth)) ?? [];
                let event = new MouseBtnInputEvent(relX, relY, evt.which, InputEventAction.Down);
                ths.mouseBtnsPressed[evt.which] = true;

                let currentElement: UIElement | (UIElement & MouseBtnListener) | (UIElement & MouseDragListener)

                for (let i = 0; i < overElements.length; i++) {
                    currentElement = overElements[i];
                    if (UIElement.hasMouseDragListener(currentElement)) {
                        if (currentElement.shouldDragLock(event)) {
                            ths.dragLockElement = currentElement
                        }
                    }
                    if (UIElement.hasMouseBtnListener(currentElement)) {
                        log.naughty(`Checking mousePressed on ${currentElement.id}`)
                        if (currentElement.mousePressed(event)) {
                            break;
                        }
                    }

                }
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
                let event = new MouseBtnInputEvent(relX, relY, evt.which, InputEventAction.Up);
                if (ths.dragLockElement != null) {
                    ths.dragLockElement.onDragEnd(event);
                    ths.dragLockElement = null;
                }
                let overElements = ths.rootElement?.findElementsUnderCursor(relX, relY).sort((a: UIElement, b: UIElement) => (a.depth - b.depth)) ?? [];

                let currentElement: UIElement | (UIElement & MouseBtnListener)
                ths.mouseBtnsPressed[evt.which] = false;
                for (let i = 0; i < overElements.length; i++) {
                    currentElement = overElements[i];
                    if (UIElement.hasMouseBtnListener(currentElement)) {
                        log.naughty(`Checking mouseReleased on ${overElements[i].id}`)
                        if (currentElement.mouseReleased(event)) {
                            break;
                        }
                    }
                }
                evt.preventDefault();


            }
        })
        this.gesture = new FGesture(this.canvas, {
            onTouchStart: (pos: Coordinate) => {
                if (this.isFullscreen == false && ths.deviceType != DeviceType.Desktop && this.fullscreenOnTouch) {
                    this.fullscreen();
                }

                pos.x = pos.x * ths.resolutionScale;
                pos.y = pos.y * ths.resolutionScale;
                let overElements = ths.rootElement?.findElementsUnderCursor(pos.x, pos.y)?.sort((a: UIElement, b: UIElement) => (b.depth - a.depth)) ?? [];
                let event = new MouseBtnInputEvent(pos.x, pos.y, 1, InputEventAction.Down);
                ths.mouseBtnsPressed[0] = true;

                let currentElement: UIElement | (UIElement & MouseBtnListener) | (UIElement & MouseDragListener)
                for (let i = 0; i < overElements.length; i++) {
                    currentElement = overElements[i];
                    if (UIElement.hasMouseDragListener(currentElement) && currentElement.shouldDragLock(event)) {
                        ths.dragLockElement = currentElement
                    }

                    log.naughty(`Checking mousePressed on ${overElements[i].id}`)
                    if (UIElement.hasMouseBtnListener(currentElement) && currentElement.mousePressed(event)) {
                        break;
                    }
                }



            },
            onTouchEnd: (pos: Coordinate) => {
                if (this.isFullscreen == false) {
                    // this.fullscreen();
                }

                pos.x = pos.x * ths.resolutionScale;
                pos.y = pos.y * ths.resolutionScale;
                let overElements = ths.rootElement?.findElementsUnderCursor(pos.x, pos.y)?.sort((a: UIElement, b: UIElement) => (b.depth - a.depth)) ?? [];
                let event = new MouseBtnInputEvent(pos.x, pos.y, 1, InputEventAction.Up);
                if (ths.dragLockElement != null) {
                    ths.dragLockElement.onDragEnd(event);
                    ths.dragLockElement = null;
                }
                ths.mouseBtnsPressed[0] = false;
                let currentElement: UIElement | (UIElement & MouseBtnListener)
                for (let i = 0; i < overElements.length; i++) {
                    currentElement = overElements[i];
                    log.debug(`Checking mouseReleased on ${overElements[i].id}`)
                    if (UIElement.hasMouseBtnListener(currentElement) && currentElement.mouseReleased(event)) {
                        break;
                    }
                }
            },
            onDrag: (pos: Coordinate, delta: Coordinate) => {
                // console.log('drag', { pos, delta })
                pos.x = pos.x * ths.resolutionScale;
                pos.y = pos.y * ths.resolutionScale;
                delta.x = delta.x * ths.resolutionScale;
                delta.y = delta.y * ths.resolutionScale;
                let event = new MouseDraggedInputEvent(pos.x, pos.y, 1, delta.x, delta.y);

                if (ths.dragLockElement != null) {
                    ths.dragLockElement.mouseDragged(event);
                    return;
                }
                let overElements = ths.rootElement?.findElementsUnderCursor(pos.x, pos.y)?.sort((a: UIElement, b: UIElement) => (b.depth - a.depth)) ?? [];

                let currentElement: UIElement | (UIElement & MouseDragListener)
                for (let i = 0; i < overElements.length; i++) {
                    currentElement = overElements[i];
                    log.naughty(`Checking mouseDragged on ${overElements[i].id}`)
                    if (UIElement.hasMouseDragListener(currentElement) && currentElement.mouseDragged(event)) {
                        break;
                    }
                }
            },
            onPinch: (pos: Coordinate, dragDelta: Coordinate, pinchDelta: Coordinate) => {
                // console.log('pinch', { pos, dragDelta, pinchDelta })
                pos.x = pos.x * ths.resolutionScale;
                pos.y = pos.y * ths.resolutionScale;
                dragDelta.x = dragDelta.x * ths.resolutionScale;
                dragDelta.y = dragDelta.y * ths.resolutionScale;
                pinchDelta.x = pinchDelta.x * ths.resolutionScale;
                pinchDelta.y = pinchDelta.y * ths.resolutionScale;
                let overElements = ths.rootElement?.findElementsUnderCursor(pos.x, pos.y)?.sort((a: UIElement, b: UIElement) => (b.depth - a.depth)) ?? [];
                let event = new MousePinchedInputEvent(pos.x, pos.y, 1, dragDelta.x, dragDelta.y, pinchDelta.x, pinchDelta.y);

                let currentElement: UIElement | (UIElement & MouseDragListener)
                for (let i = 0; i < overElements.length; i++) {
                    currentElement = overElements[i];
                    log.naughty(`Checking mousePinched on ${overElements[i].id}`)
                    if (UIElement.hasMouseDragListener(currentElement) && currentElement.mousePinched(event)) {
                        break;
                    }
                }
            }
        });
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

    rootElement: RootElementType = null;
    // mousePressed(evt: MouseBtnInputEvent) {
    //     return this.rootElement.mousePressed(evt);
    // }
    // mouseReleased(evt: MouseBtnInputEvent) {
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
    pixelDensity(): number {
        return window.devicePixelRatio;
    }
    minTouchSize() {
        return Math.min(this.width, this.height) / 6;
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
            setTimeout(() => {
                window.requestAnimationFrame(() => {
                    ths.draw();
                });
            }, Math.max(this.targetFrameTime - this.deltaDrawTime, 0))
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
    get width() {
        return this.iWidth * this.resolutionScale;
    }
    get height() {
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
    cursor(cursorCss: string) {
        this.canvas.setCss('cursor', cursorCss);
    }
    background(color: FColor) {
        this.noStroke();
        this.fillColor(color);
        this.ctx.fillRect(0, 0, this.width, this.height);
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
    textSizeMaxWidth(perferredSize: number, textToMeasure: string, maxWidth: number, stepSize: number = 2) {
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
    // fillRectFrame(frame: UIFrame) {
    //     return this.ctx.fillRect(frame.leftX(), frame.topY(), frame.measureWidth(), frame.measureHeight());


    //overridable methods--------------------------------------------------
    shouldExecJobs(): boolean {
        return false;
    }

    // addUiElement(element: UIElement) {
    //     element.parent = this as any;//bad type
    //     this.uiElements.add(element);
    //     // for (let i = 0; i < this.uiElements.length; i++) {
    //     //     if (this.uiElements[i].depth >= element.depth) {
    //     //         this.uiElements.splice(i, 0, element);
    //     //         return;
    //     //     }
    //     // }
    //     // this.uiElements.push(element);

    // }
    // removeUIElement(element: UIElement) {
    //     element.parent = null;
    //     this.uiElements.remove((elem: UIElement) => (elem.id == element.id));
    //     // var removeIndex = this.uiElements.map(item => item.id)
    //     //     .indexOf(element.id);
    //     // if (removeIndex !== -1) {
    //     //     ~removeIndex && this.uiElements.splice(removeIndex, 1);
    //     // }
    // }
    onDraw(deltaMs: number): void {
        let ths = this;
        this.noStroke();
        this.fillColor(fColor.grey.darken3);
        this.ctx.fillRect(0, 0, this.width, this.height);

        // this.currentContentPanel.drawBackground(deltaMs);

        //  this.ctx.fillStyle = fColor.green.darken2.toHexString();
        // this.ctx.fillRect(0,0, 500, 500);
        //         console.log(this.ctx);
        this.rootElement?.measure(deltaMs);
        this.rootElement?.draw(deltaMs);
        // this.uiElements.forEach((element: UIElement) => {

        //     if (element.frame.isVisible()) {
        //         element.draw(deltaMs, ths.ctx);
        //     }
        // })
        if (this.debuggerFlags.uiFrameOutlines && this.rootElement != null) {
            this.rootElement.drawUIFrame(true, 1);
            let debugElem = this.rootElement.findElementsUnderCursor(this.mouseX, this.mouseY).last
            if (debugElem != null) {
                this.fillColor(debugElem.debugFrameColor);
                this.textAlign(BristolHAlign.Left, BristolVAlign.Bottom);
                this.textSize(12);
                this.ctx.fillText(debugElem?.id, this.mouseX, this.mouseY)
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

export class BristolFont {
    style: BristolFontStyle = BristolFontStyle.Normal
    weight: BristolFontWeight | number = BristolFontWeight.normal;
    family: BristolFontFamily = BristolFontFamily.Monospace;
    size: number = 12;
    toString() {
        return `${this.size}px ${this.family}`// ${this.style} ${this.weight}
    }
}


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