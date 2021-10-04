import { UIFrameResult, BristolBoard, UIFrame_CornerWidthHeight, UIElement, optFunc, IsType, MouseBtnInputEvent, MouseDraggedInputEvent, MouseDragListener, MousePinchedInputEvent, UIFrame } from '../BristolImports'

export interface UIFrameDescription_StackChild {
    width: optFunc<number>
    height: optFunc<number>
}
export interface UIStackOptions<DataType, ChildType extends UIElement> {
    childLength: (index: number) => number;
    buildChild: (frame: UIFrame, brist: BristolBoard<any>) => ChildType
    bindData: (index: number, data: DataType, child: ChildType) => void
    isVertical: boolean
}
export interface UIStackRecyclerSource<DataType> {
    count: () => number; get: (index: number) => DataType;
}
export class UIStackRecycler<DataType, ChildType extends UIElement> extends UIElement {
    options: UIStackOptions<DataType, ChildType>
    extraElements: UIStackChildContainer<ChildType>[] = [] 
    rootElement: UIStackChildContainer<ChildType>
    rootIndex: number = 0
    rootOffset: number = 0;
    source: UIStackRecyclerSource<DataType>;
    static SourceFromArray<DataType>(data: DataType[]) {
        return {
            count: () => data.length,
            get: (index: number) => data[index]
        }
    }
    onDrawBackground(frame: UIFrameResult, deltaTime: number): void {
        this.brist.ctx.save();
        this.brist.ctx.rect(frame.left, frame.top, frame.width, frame.height);
        this.brist.ctx.clip();
    }
    onDrawForeground(frame: UIFrameResult, deltaTime: number): void {
        this.brist.ctx.restore();
    }

    constructor(source: DataType[] | { count: () => number, get: (index: number) => DataType }, options: UIStackOptions<DataType, ChildType>, frame: UIFrame, brist: BristolBoard<any>) {
        super(UIElement.createUID('stack'), frame, brist);
        this.options = options;
        if (IsType<UIStackRecyclerSource<DataType>>(source, 'count')) {
            this.source = source;
        } else {
            this.source = UIStackRecycler.SourceFromArray(source);
        }
        this.rootElement = new UIStackChildContainer(this, brist);
        this.rootElement.parent = this;
        this.rootElement.onAddToParent();
        //childElement.frame.parent = this.frame;
        //childElement.onAddToParent();
        this.options.bindData(0, this.source.get(0), this.rootElement.child);
    }
    invalidateData() {
        this.rootElement = new UIStackChildContainer(this, this.brist);
        let count = this.source.count();
        for (let i = 0; i < count; i++) {

        }
    }
    private fixFrame(frame: UIFrameResult) {
        frame.centerX = (frame.left + frame.right) / 2
        frame.centerY = (frame.top + frame.bottom) / 2
        frame.width = (frame.right - frame.left)
        frame.height = (frame.bottom - frame.top)
        return frame;
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

        let elem = this.rootElement;

        if (this.options.isVertical) {
            elem.frame.result = {
                left: ths.frame.result.left,
                right: ths.frame.result.right,
                top: ths.frame.result.top + ths.rootOffset,
                bottom: ths.frame.result.top + ths.rootOffset + ths.options.childLength(ths.rootIndex),
                centerX: 0,
                centerY: 0,
                width: 0,
                height: 0
            }


        } else {
            elem.frame.result = {
                left: ths.rootOffset,
                right: ths.rootOffset + ths.options.childLength(ths.rootIndex),
                top: ths.frame.result.top,
                bottom: ths.frame.result.bottom,
                centerX: 0,
                centerY: 0,
                width: 0,
                height: 0
            }
        }
        elem.frame.result = this.fixFrame(elem.frame.result);
        elem.child.frame.parent = elem.frame;
        elem.child.measure(deltaTime);
        let index = this.rootIndex + 1;
        elem = elem.next;
        while (elem != null) {
            if (this.options.isVertical) {
                elem.frame.result = {
                    top: elem.last.frame.result.bottom,
                    bottom: elem.last.frame.result.bottom + ths.options.childLength(index),
                    left: ths.frame.result.left,
                    right: ths.frame.result.right,
                    centerX: 0,
                    centerY: 0,
                    width: 0,
                    height: 0
                };

            } else { }
            elem.frame.result = this.fixFrame(elem.frame.result);
            elem.child.frame.parent = elem.frame;
            elem.child.measure(deltaTime);
            if (elem.next != null) {
                elem = elem.next;
                index++;
            } else {
                break;
            }
        }
        if (elem != null) {
            if (this.options.isVertical) {
                if (elem.frame.result.bottom < ths.frame.result.bottom) {
                    //needs more elements
                } else if (elem.frame.result.top > ths.frame.result.bottom) {
                    //needs less elements
                }

            } else {

            }
        }

        // this.forEachVisibleChild((elem: UIElement) => {

        //     if (elem.frame.isVisible()) {
        //         elem.measure(deltaTime);
        //     }
        // })
    }
    forEachVisibleChild(onEach: (elem: UIElement, index: number) => void) {
        let elem = this.rootElement;
        let index = this.rootIndex;
        while (elem != null) {
            onEach(elem, index);
            elem = elem.next;
            index++;
        }
    }
}
export class UIStackChildContainer<ChildType extends UIElement> extends UIElement {

    next: UIStackChildContainer<any> = null;
    last: UIStackChildContainer<any> = null;
    child: ChildType
    parent: UIStackRecycler<any, ChildType>
    get index(): number {
        if (this.last != null) {
            return this.last.index + 1;
        }
        this.parent.rootIndex;
    }
    onDrawBackground(frame: UIFrameResult, deltaTime: number): void {
    }
    onDrawForeground(frame: UIFrameResult, deltaTime: number): void {
    }
    frame: UIFrame_CornerWidthHeight
    constructor(parent: UIStackRecycler<any, ChildType>, brist: BristolBoard<any>) {
        super(UIElement.createUID('uiStackChildContainer'), (thus) => {
            let ths: UIStackChildContainer<ChildType> = thus as any;
            if (parent.options.isVertical) {
                let out = UIFrame.Build({
                    x: 0, y: () => {
                        if (ths.last != null) {
                            return 0;//ths.last.frame.description.y
                        }
                        return 0;
                    }, width: () => ths.width, height: () => parent.options.childLength(ths.index)
                })
                out.visible
                return out;
            } else {
 let out = UIFrame.Build({
                    x: () => {
                        if (ths.last != null) {
                            return 0;//ths.last.frame.description.y
                        }
                        return 0;
                    }, y: 0, width: () => ths.width, height: () => parent.options.childLength(ths.index)
                })
                out.visible
                return out;
            }

        }, brist);
        let ths = this;
        this.child = parent.options.buildChild(UIFrame.Build({
            x: 0, y: 0, width: () => ths.width, height: () => ths.height
        }), brist);
        this.addChild(this.child);
    }

}
export interface GridRecyclerAdapter<DataType, ChildType extends UIElement> {
    get rows(): number
    get columns(): number
    getColumnWidth(col: number): number
    getRowHeight(row: number): number
    buildChild(): ChildType
    getData(row: number, col: number): DataType
    bindData(data: DataType, child: ChildType, row: number, col: number): void
}
export class ArrayGridRecyclerAdapter<DataType, ChildType extends UIElement> implements GridRecyclerAdapter<DataType, ChildType>{
    data: DataType[];
    direction: 'vertical' | 'horizontal'
    get isVertical() {
        return this.direction == 'vertical'
    }
    constructor(data: DataType[], options: {
        limit: { rows: number } | { columns: number }

    }) {
        this.data = data;

        let limit: { rows: number } | { columns: number } = options.limit;
        if (IsType<{ rows: number }>(limit, 'rows')) {
            this.rowGetter = () => limit['rows'];
            this.direction = 'horizontal';
        } else {
            this.colGetter = () => limit['columns']
            this.direction = 'vertical'
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
export class UIGridRecycler<DataType, ChildType extends UIElement> extends UIElement implements MouseDragListener {
    adapter: GridRecyclerAdapter<DataType, ChildType>;
    constructor(adapter: GridRecyclerAdapter<DataType, ChildType>, frame: UIFrame, brist: BristolBoard<any>) {
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
    get offset() {
        return [this.startCell.x, this.startCell.y]
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
// export class UIRecyclerRow<DataType, ChildType extends UIElement>  extends UIElement {
//     up: UIRecyclerRow<DataType, ChildType>= null;
//     down: UIRecyclerRow<DataType, ChildType> = null;
//     constructor(recycler: UIRecycler<DataType, ChildType>, brist: BristolBoard<any>){
//         super(UIElement.createUID('RecyclerRow'), (ths: <DataType>UIRecyclerRow<DataType, ChildType>): UIFrame =>{
//             let offset = recycler.offset;
//             return UIFrame.Build({
//                 x: offset[0],
//                 y: offset[1]
//             })
//         }, brist);
//     }
//     onDrawBackground(frame: UIFrameResult, deltaTime: number): void {
//     }
//     onDrawForeground(frame: UIFrameResult, deltaTime: number): void {
//     }


// }