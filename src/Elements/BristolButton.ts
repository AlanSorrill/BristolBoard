
import { clamp, RawPointerData } from "..";
import {
    MouseTapListener, MouseMovementListener,
    evalOptionalFunc, optFunc, UIFrameDescription_CornerWidthHeight,
    BristolFontFamily, BristolHAlign, BristolVAlign, UIElement, UIFrameResult,
    UIFrame_CornerWidthHeight, BristolBoard, FColor, optTransform, evalOptionalTransfrom, fColor
} from "../BristolImports";
import { RawPointerMoveData } from "../BristolInput";


export class UIButton extends UIElement implements MouseMovementListener, MouseTapListener {
    static uidCount = 0;
    frame: UIFrame_CornerWidthHeight
    paddingVertical: optFunc<number> = 32;
    paddingHorizontal: optFunc<number> = 64;
    text: optFunc<string>;
    textSize: optFunc<number> = 200;
    fontFamily: optFunc<BristolFontFamily>
    backgroundColor: optFunc<FColor> = fColor.red.base;
    foregroundColor: optFunc<FColor> = fColor.white;
    ensureTextNotTooWide: optFunc<boolean> = false;
    onClick: () => void;

    constructor(text: optFunc<string>, onClick: (() => void) | ({
        onClick: () => void,
        onMouseEnter: (evt: RawPointerMoveData) => void,
        onMouseExit: (evt: RawPointerMoveData) => void
    }), uiFrame: UIFrame_CornerWidthHeight | UIFrameDescription_CornerWidthHeight, brist: BristolBoard<any>) {
        super(`btn${UIButton.uidCount++}`, uiFrame, brist);
        if (typeof onClick == 'function') {
            this.onClick = onClick;
        } else {
            this.onClick = onClick.onClick;
            this.onMouseEnter = onClick.onMouseEnter;
            this.onMouseExit = onClick.onMouseExit;
        }
        this.text = text;
    }
    onMouseEnter: (evt: RawPointerMoveData) => void = () => { };
    onMouseExit: (evt: RawPointerMoveData) => void = () => { };
    mouseEnter(evt: RawPointerMoveData): boolean {
        this.onMouseEnter(evt);
        return true;
    }
    mouseExit(evt: RawPointerMoveData): void {
        this.onMouseExit(evt);
    }
    isMouseOver: boolean = false;

    mouseMoved(evt: RawPointerMoveData): boolean {
        return true;
    }

    autoPadding(heightToTextSize: number = 0.25, widthToTextSize: number = 0.6) {
        let textSize = evalOptionalFunc(this.textSize, 24);
        this.paddingVertical = () => (textSize * heightToTextSize);
        this.paddingHorizontal = () => (textSize * widthToTextSize);
    }

    autoWidth() {
        let ths = this;
        (this.frame as UIFrame_CornerWidthHeight).description.width = () => {
            ths.setupFont(ths.frame.result);
            return ths.brist.ctx.measureText(evalOptionalFunc(this.text)).width + evalOptionalFunc(this.paddingHorizontal) * 2;
        }
        return this;
    }
    autoHeight() {
        let ths = this;
        (this.frame as UIFrame_CornerWidthHeight).description.height = () => {
            ths.setupFont(ths.frame.result);
            let textMetrics = ths.brist.ctx.measureText(evalOptionalFunc(this.text))
            return textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent + evalOptionalFunc(this.paddingVertical) * 2;
        }
        return this;
    }
    onDrawBackground(frame: UIFrameResult, deltaMs: number) {
        let color = evalOptionalFunc(this.backgroundColor);
        if (color != null) {
            this.brist.fillColor(color);
            this.brist.ctx.beginPath();
            this.brist.rectFrame(frame, false, true);
            this.brist.ctx.beginPath();
        }
    }
    private lastFontSize = -1;
    private lastWidth = -1;
    private lastCalculatedFontSize = 1;
    setupFont(frame: UIFrameResult) {
        this.brist.fillColor(fColor.lightText[1]);
        this.brist.textAlign(BristolHAlign.Center, BristolVAlign.Middle);
        this.brist.fontFamily(evalOptionalFunc(this.fontFamily, BristolFontFamily.Verdana));
        if (evalOptionalFunc(this.ensureTextNotTooWide, false)) {
            let fontSize = evalOptionalFunc(this.textSize, 24);
            let text = evalOptionalFunc(this.text, '');
            this.brist.textSize(fontSize);
            if (this.lastFontSize != fontSize || this.lastWidth != this.getWidth()) {

                while (this.brist.ctx.measureText(text).width >= this.getWidth() - evalOptionalFunc(this.paddingHorizontal, 0) * 2) {
                    fontSize -= 2;
                    this.brist.textSize(fontSize);
                }
                this.lastCalculatedFontSize = fontSize;
            } else {
                this.brist.textSize(this.lastCalculatedFontSize);
            }
        } else {
            this.brist.textSize(evalOptionalFunc(this.textSize, 24));

        }
    }
    onDrawForeground(frame: UIFrameResult, deltaMs: number) {
        this.setupFont(frame);
        this.brist.fillColor(evalOptionalTransfrom(this.foregroundColor, this.isMouseOver));
        this.brist.text(evalOptionalFunc(this.text), frame.centerX, frame.centerY);
    }



    mouseTapped(upEvt: RawPointerData): boolean {
        this.onClick();
        return true;
    }



}
export class UIProgressButton extends UIButton {
    progressColor: optFunc<FColor> = fColor.green.base;
    getProgress: optFunc<number> = 0;
    constructor(text: optFunc<string>, onClick: () => void | ({
        onClick: () => void,
        onMouseEnter: (evt: RawPointerMoveData) => void,
        onMouseExit: (evt: RawPointerMoveData) => void
    }), getProgress: () => number, uiFrame: UIFrame_CornerWidthHeight | UIFrameDescription_CornerWidthHeight, brist: BristolBoard<any>) {
        super(text, onClick, uiFrame, brist);
        this.getProgress = getProgress;
    }
    onDrawBackground(frame: UIFrameResult, deltaMs: number): void {
        let progressColor = evalOptionalFunc(this.progressColor);
        let background = evalOptionalFunc(this.backgroundColor);
        if (progressColor != null) {
            this.brist.ctx.beginPath();
            this.brist.fillColor(background);
            this.brist.rectFrame(frame, false, true);
            this.brist.ctx.beginPath();
            this.brist.fillColor(progressColor);
            this.brist.ctx.rect(frame.left, frame.top, frame.width * clamp(evalOptionalFunc(this.getProgress, 0), 0, 1), frame.height);
            this.brist.ctx.fill();
            this.brist.ctx.beginPath();
        }
        //super.onDrawBackground(frame,deltaMs);
    }
}