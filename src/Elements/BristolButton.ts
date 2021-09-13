
import {
    evalOptionalFunc, optFunc, UIFrameDescription_CornerWidthHeight,
    BristolFontFamily, BristolHAlign, BristolVAlign, UIElement, UIFrameResult,
    UIFrame_CornerWidthHeight, BristolBoard, FColor, optTransform, MouseState, evalOptionalTransfrom, MouseBtnInputEvent, MouseInputEvent, fColor
} from "../BristolImports";


export class UIButton extends UIElement {
    static uidCount = 0;
    paddingVertical: optFunc<number> = 32;
    paddingHorizontal: optFunc<number> = 64;
    text: optFunc<string>;
    textSize: optFunc<number> = 200;
    fontFamily: optFunc<BristolFontFamily>
    backgroundColor: optTransform<MouseState, FColor> = fColor.red.base;
    foregroundColor: optTransform<MouseState, FColor> = fColor.white;
    onClick: () => void;
    mouseState: MouseState = MouseState.Gone;
    constructor(text: optFunc<string>, onClick: () => void, uiFrame: UIFrame_CornerWidthHeight | UIFrameDescription_CornerWidthHeight, brist: BristolBoard<any>) {
        super(`btn${UIButton.uidCount++}`, uiFrame, brist);
        this.onClick = onClick;
        this.text = text;
    }
    autoPadding(heightToTextSize: number = 0.25, widthToTextSize: number = 0.6) {
        let textSize = evalOptionalFunc(this.textSize, 24);
        this.paddingVertical = () => (textSize * heightToTextSize);
        this.paddingHorizontal = () => (textSize * widthToTextSize);

    }
    autoWidth() {
        let ths = this;
        (this.frame as UIFrame_CornerWidthHeight).description.width = () => {
            ths.setupFont(ths.frame.lastResult);
            return ths.brist.ctx.measureText(evalOptionalFunc(this.text)).width + evalOptionalFunc(this.paddingHorizontal) * 2;
        }
        return this;
    }
    autoHeight() {
        let ths = this;
        (this.frame as UIFrame_CornerWidthHeight).description.height = () => {
            ths.setupFont(ths.frame.lastResult);
            let textMetrics = ths.brist.ctx.measureText(evalOptionalFunc(this.text))
            return textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent + evalOptionalFunc(this.paddingVertical) * 2;
        }
        return this;
    }
    onDrawBackground(frame: UIFrameResult, deltaMs: number) {
        let color = evalOptionalTransfrom(this.backgroundColor, this.mouseState);
        if (color != null) {
            this.brist.fillColor(color);
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
        this.brist.fillColor(evalOptionalTransfrom(this.foregroundColor, this.mouseState));
        this.brist.text(evalOptionalFunc(this.text), frame.centerX, frame.centerY);
    }
    mouseMoved(event: MouseInputEvent) {
        return true;
    }
    mousePressed(evt: MouseBtnInputEvent) {
        this.mouseState = MouseState.Pressed;
        this.onClick();
        return true;
    }
    mouseReleased(evt: MouseBtnInputEvent) {
        this.mouseState = this.isMouseTarget ? MouseState.Over : MouseState.Gone;
        return true;
    }
    mouseEnter(evt: MouseInputEvent) {
        this.mouseState = MouseState.Over;
        return true;
    }
    mouseExit(evt: MouseInputEvent) {
        this.mouseState = MouseState.Gone;
        return true;
    }

}