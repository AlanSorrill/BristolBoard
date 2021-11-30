
import { RawPointerData } from "..";
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
    onClick: () => void;

    constructor(text: optFunc<string>, onClick: () => void, uiFrame: UIFrame_CornerWidthHeight | UIFrameDescription_CornerWidthHeight, brist: BristolBoard<any>) {
        super(`btn${UIButton.uidCount++}`, uiFrame, brist);
        this.onClick = onClick;
        this.text = text;
    }
    mouseEnter(evt: RawPointerMoveData): boolean {
        return true;
    }
    mouseExit(evt: RawPointerMoveData): void {
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
        let color = evalOptionalTransfrom(this.backgroundColor, this.isMouseOver);
        if (color != null) {
            this.brist.fillColor(color);
            this.brist.ctx.beginPath();
            this.brist.rectFrame(frame, false, true);
            this.brist.ctx.beginPath();
        }
    }
    setupFont(frame: UIFrameResult) {
        this.brist.fillColor(fColor.lightText[1]);
        this.brist.textAlign(BristolHAlign.Center, BristolVAlign.Middle);
        this.brist.fontFamily(evalOptionalFunc(this.fontFamily, BristolFontFamily.Verdana));
        this.brist.textSize(evalOptionalFunc(this.textSize, 24));
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