import { evalOptionalTransfrom } from '..';
import { optFunc, evalOptionalFunc, BristolBoard, optTransform } from '../BristolImports'

export interface UIFrameResult {
    left: number,
    right: number,
    top: number,
    bottom: number,
    width: number,
    height: number,
    centerX: number,
    centerY: number
}
export abstract class UIFrame {
    result: UIFrameResult = null;
    visible: optFunc<boolean> = true;
    parent: UIFrame;
    isVisible(): boolean {
        return evalOptionalFunc(this.visible)
    }

    abstract leftX(): number


    abstract rightX(): number


    abstract topY(): number



    abstract bottomY(): number


    abstract containsPoint(x: number, y: number): boolean
    centerX(): number {
        return (this.leftX() + this.rightX()) / 2
    }

    centerY(): number {
        return (this.bottomY() + this.topY()) / 2
    }

    getCornerX(corner: UICorner, useResult = false) {
        if (useResult && this.result != null) {
            switch (corner) {
                case UICorner.upLeft:
                    return this.result.left;
                case UICorner.upRight:
                    return this.result.right;
                case UICorner.downRight:
                    return this.result.right;
                case UICorner.downLeft:
                    return this.result.left;
                case UICorner.center:
                    return this.result.centerX;
            }
        }
        switch (corner) {
            case UICorner.upLeft:
                return this.leftX();
            case UICorner.upRight:
                return this.rightX();
            case UICorner.downRight:
                return this.rightX();
            case UICorner.downLeft:
                return this.leftX();
            case UICorner.center:
                return this.centerX();
        }
    }
    getCornerY(corner: UICorner, useResult = false) {
        if (useResult && this.result != null) {
            switch (corner) {
                case UICorner.upLeft:
                    return this.result.top;
                case UICorner.upRight:
                    return this.result.top;
                case UICorner.downRight:
                    return this.result.bottom;
                case UICorner.downLeft:
                    return this.result.bottom;
                case UICorner.center:
                    return this.result.centerY;
            }
        }
        switch (corner) {
            case UICorner.upLeft:
                return this.topY();
            case UICorner.upRight:
                return this.topY();
            case UICorner.downRight:
                return this.bottomY();
            case UICorner.downLeft:
                return this.bottomY();
            case UICorner.center:
                return this.centerY();
        }
    }
    measureWidth(): number {
        return this.rightX() - this.leftX();
    }
    measureHeight(): number {
        return this.bottomY() - this.topY();
    }
    
    public static Build<DescriptionType extends UIFrameDescription>(description: DescriptionType | UIFrame, parent: UIFrame = null) {

        if (description instanceof UIFrame) {
            //pass through to allow for custom UIFrame construction
            return description;
        }

        if (typeof description['width'] != 'undefined') {
            return new UIFrame_CornerWidthHeight(description as any as UIFrameDescription_CornerWidthHeight, parent);
        }
        else if (typeof description['radius'] != 'undefined') {
            throw new Error(`Not yet supported`);
            // return new UIFrame_CenterRadius(description as any as UIFrameDescription_CenterRadius, parent)
        }
    }
}
export enum UICorner {
    upLeft, upRight, downRight, downLeft, center
}
export class UIFrame_CornerWidthHeight extends UIFrame {
    description: UIFrameDescription_CornerWidthHeight;

    constructor(description: UIFrameDescription_CornerWidthHeight, parent: UIFrame = null) {
        super();
        this.description = description;
        this.parent = parent;
    }
    isVisible() {
        return evalOptionalTransfrom(this.description.visible, this.result, true)
    }


    containsPoint(x: number, y: number): boolean {
        if (this.result != null) {
            return (x >= this.result.left && x <= this.result.right) && (y >= this.result.top && y <= this.result.bottom)
        }
        return (x >= this.leftX() && x <= this.rightX()) && (y >= this.topY() && y <= this.bottomY())
    }
    leftX(): number {
        switch (evalOptionalFunc(this.description.measureCorner, UICorner.upLeft)) {
            default:
            case UICorner.downLeft:
            case UICorner.upLeft:
                return this.x;

            case UICorner.upRight:
            case UICorner.downRight:
                return this.x - evalOptionalFunc(this.description.width);

            case UICorner.center:
                return this.x - (evalOptionalFunc(this.description.width) / 2);
        }
    }
    topY(): number {
        switch (evalOptionalFunc(this.description.measureCorner, UICorner.upLeft)) {
            default:
            case UICorner.downLeft:
            case UICorner.downRight:
                return this.y - evalOptionalFunc(this.description.height);

            case UICorner.upLeft:
            case UICorner.upRight:
                return this.y;
            case UICorner.center:
                return this.y - (evalOptionalFunc(this.description.height) / 2);
        }
    }
    rightX(): number {
        switch (evalOptionalFunc(this.description.measureCorner, UICorner.upLeft)) {
            default:
            case UICorner.downLeft:
            case UICorner.upLeft:
                return this.x + evalOptionalFunc(this.description.width);

            case UICorner.upRight:
            case UICorner.downRight:
                return this.x;
            case UICorner.center:
                return this.x + (evalOptionalFunc(this.description.width) / 2);
        }
    }


    bottomY(): number {
        switch (evalOptionalFunc(this.description.measureCorner, UICorner.upLeft)) {
            default:
            case UICorner.downLeft:
            case UICorner.downRight:
                return this.y;

            case UICorner.upLeft:
            case UICorner.upRight:
                return this.y + evalOptionalFunc(this.description.height);


            case UICorner.center:
                return this.y + (evalOptionalFunc(this.description.height) / 2);
        }
    }


    measureWidth() {
        return evalOptionalFunc(this.description.width);
    }
    measureHeight() {
        return evalOptionalFunc(this.description.height);
    }
    // relX: optFunc<number>
    // relY: optFunc<number>

    // absX: optFunc<number>;
    // absY: optFunc<number>;


    // width: optFunc<number>;
    // height: optFunc<number>;

    get hasParent(): boolean {
        return this.parent != null;
    }

    get x(): number {
        return (evalOptionalFunc(this.description.coordType, CoordType.Relative) == CoordType.Absolute) ? evalOptionalFunc(this.description.x) : (this.hasParent ? evalOptionalFunc(this.description.x) + this.parent.getCornerX(evalOptionalFunc(this.description.parentCorner, UICorner.upLeft), true) : evalOptionalFunc(this.description.x));
    }
    get y(): number {
        return (evalOptionalFunc(this.description.coordType, CoordType.Relative) == CoordType.Absolute) ? evalOptionalFunc(this.description.y) : (this.hasParent ? evalOptionalFunc(this.description.y) + this.parent.getCornerY(evalOptionalFunc(this.description.parentCorner, UICorner.upLeft), true) : evalOptionalFunc(this.description.y));
    }

}
// export class UIFrame_CenterRadius extends UIFrame {
//     description: UIFrameDescription_CenterRadius;
//     constructor(description: UIFrameDescription_CenterRadius, parent: UIFrame = null) {
//         super();
//         this.description = description;
//         this.parent = parent;
//         let ths = this;

//     }
//     leftX(): number {
//         return evalOptionalFunc(this.description?.x, 0) - evalOptionalFunc(this.description?.radius, 0);
//     }
//     rightX(): number {
//         return evalOptionalFunc(this.description?.x, 0) + evalOptionalFunc(this.description?.radius, 0);
//     }
//     topY(): number {
//         return evalOptionalFunc(this.description?.y, 0) - evalOptionalFunc(this.description?.radius, 0);
//     }
//     bottomY(): number {
//         return evalOptionalFunc(this.description?.y, 0) + evalOptionalFunc(this.description?.radius, 0);
//     }
//     isInside(x: number, y: number): boolean {
//         let center: [number, number] = [evalOptionalFunc(this.description?.x, 0), evalOptionalFunc(this.description?.y, 0)]
//         return Math.sqrt(Math.pow(x - center[0], 2) + Math.pow(y - center[1], 2)) < evalOptionalFunc(this.description?.radius, 1);
//     }

// }
export enum CoordType {
    Relative, Absolute
}
export interface UIFrameDescription {
    x: optFunc<number>,
    y: optFunc<number>,
    coordType?: optFunc<CoordType>// = CoordType.Relative
    visible?: optTransform<UIFrameResult, boolean>
}
export interface UIFrameDescription_CornerWidthHeight extends UIFrameDescription {
    width: optFunc<number>, //= 0
    height: optFunc<number>, //=0
    measureCorner?: optFunc<UICorner>// = UICorner.upLeft,
    parentCorner?: optFunc<UICorner>// = UICorner.upLeft,
}
// export interface UIFrameDescription_CenterRadius extends UIFrameDescription {
//     radius: optFunc<number>
// }
