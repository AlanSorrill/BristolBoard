import { IsType, MouseDragListener, UIFrame } from '..';
import { MouseBtnInputEvent, MouseInputEvent, MouseMovedInputEvent, MouseDraggedInputEvent, MousePinchedInputEvent, MouseScrolledInputEvent, KeyboardInputEvent } from '../BristolBoard';
import { BristolBoard, UIFrame_CornerWidthHeight, UIElement, optFunc } from '../BristolImports'
import { UIFrameResult } from '../UIFrame';
export interface UIFrameDescription_StackChild {
    width: optFunc<number>
    height: optFunc<number>
}
export interface UIStackOptions {
    childLength: (index: number) => number;
    buildChild: (index: number, frame: UIFrame, brist: BristolBoard<any>) => UIElement
    isVertical: boolean
}
export class UIStack extends UIElement {
    options: UIStackOptions
    onDrawBackground(frame: UIFrameResult, deltaTime: number): void {
        this.brist.ctx.save();
        this.brist.ctx.rect(frame.left, frame.top, frame.width, frame.height);
        this.brist.ctx.clip();
    }
    onDrawForeground(frame: UIFrameResult, deltaTime: number): void {
        this.brist.ctx.restore();
    }

    constructor(options: UIStackOptions, frame: UIFrame_CornerWidthHeight, brist: BristolBoard<any>) {
        super(UIElement.createUID('stack'), frame, brist);
        this.options = options;
    }
    forEachVisibleChild(onEach: (elem: UIElement, index: number) => void) {
        this.cElements.forEach((value: UIElement, ind: number) => {
            if (value.frame.isVisible()) {
                onEach(value, ind);
            }
        })
    }
}
export interface RecyclerAdapter<DataType, ChildType extends UIElement> {
    get rows(): number
    get columns(): number
    getColumnWidth(col: number): number
    getRowHeight(row: number): number
    buildChild(): ChildType
    getData(row: number, col: number): DataType
    bindData(data: DataType, child: ChildType, row: number, col: number): void
}
export class ArrayRecyclerAdapter<DataType, ChildType extends UIElement> implements RecyclerAdapter<DataType, ChildType>{
    data: DataType[];
    constructor(data: DataType[], options: {
        limit: { rows: number } | { columns: number }
        
    }) {
        this.data = data;
        
        let limit:{ rows: number } | { columns: number } = options.limit;
        if (IsType<{ rows: number }>(limit, 'rows')) {
            this.rowGetter = () => limit['rows'];
        } else {
            this.colGetter = () => limit['columns']
        }
    }
    rowGetter: () => number;
    colGetter: () => number;
    get rows(): number {
        return this.rowGetter();
    }
    get columns(): number {
        return this.colGetter();
    }
    getColumnWidth(col: number): number {
        return 100;
    }
    getRowHeight(row: number): number {
        return 100;
    }
    buildChild(): ChildType {
        throw new Error('Method not implemented.');
    }
    getData(row: number, col: number): DataType {
        let i = row * this.rows;
        throw new Error('Method not implemented.');
    }
    bindData(data: DataType, child: ChildType, row: number, col: number): void {
        throw new Error('Method not implemented.');
    }

}
export class UIRecycler<DataType, ChildType extends UIElement> extends UIElement implements MouseDragListener {
    adapter: RecyclerAdapter<DataType, ChildType>;
    constructor(adapter: RecyclerAdapter<DataType, ChildType>, frame: UIFrame, brist: BristolBoard<any>) {
        super(UIElement.createUID('stack'), frame, brist);
        this.adapter = adapter;

    }
    shouldDragLock(event: MouseBtnInputEvent): boolean {
        return true;
    }
    mouseDragged(evt: MouseDraggedInputEvent): boolean {
        this.addOffset(evt.deltaX, 0);
        return true;
    }
    mousePinched(evt: MousePinchedInputEvent): boolean {
        return false;
    }
    onDragEnd(event: MouseBtnInputEvent): boolean {
        return true;
    }
    startCell: {
        row: number,
        col: number,
        x: number,
        y: number
    } = {
            row: 0,
            col: 0,
            x: 0,
            y: 0
        }

    private get startCellRight(): number {
        return this.startCell.x + this.adapter.getColumnWidth(this.startCell.col);
    }
    private get startCellBottom(): number {
        return this.startCell.y + this.adapter.getRowHeight(this.startCell.row);
    }

    addOffset(x: number, y: number) {
        this.startCell.x += x;
        //this.startCell.y += y;
        // if (this.startCell.x > 0) {
        //     this.startCell.x = 0;
        // }

        while (this.startCellRight < 0 && this.startCell.col < this.adapter.columns - 1) {
            this.startCell.col++
            this.startCell.x -= this.adapter.getColumnWidth(this.startCell.col);
        }
        while (this.startCell.x > 0 && this.startCell.col > 0) {
            this.startCell.col--
            this.startCell.x += this.adapter.getColumnWidth(this.startCell.col)
        }
    }
    forEachVisibleChild(onEach: (elem: UIElement, index: number) => void) {
        let cx = this.startCell.x;
        let cy = this.startCell.y;
        let ccol = this.startCell.col;
        while (ccol < this.adapter.columns) {

        }
    }
    invalidateDataset() {

    }
    onDrawBackground(frame: UIFrameResult, deltaTime: number): void {
        this.brist.ctx.save();
        this.brist.ctx.rect(frame.left, frame.top, frame.width, frame.height);
        this.brist.ctx.clip();
    }
    onDrawForeground(frame: UIFrameResult, deltaTime: number): void {
        this.brist.ctx.restore();
    }


}