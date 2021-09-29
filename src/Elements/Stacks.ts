import { MouseBtnInputEvent, MouseInputEvent, MouseMovedInputEvent, MouseDraggedInputEvent, MousePinchedInputEvent, MouseScrolledInputEvent, KeyboardInputEvent } from '../BristolBoard';
import { BristolBoard, UIFrame_CornerWidthHeight, UIElement } from '../BristolImports'
import { UIFrameResult } from '../UIFrame';

export class UIStack extends UIElement {
    onDrawBackground(frame: UIFrameResult, deltaTime: number): void {
        throw new Error('Method not implemented.');
    }
    onDrawForeground(frame: UIFrameResult, deltaTime: number): void {
        throw new Error('Method not implemented.');
    }

    constructor(frame: UIFrame_CornerWidthHeight, brist: BristolBoard<any>) {
        super(UIElement.createUID('stack'), frame, brist);
    }
}