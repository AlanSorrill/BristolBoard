
import { isNumber, MouseWheelListener } from '..';
import { LogLevel, UIFrameResult, BristolBoard, UIFrame_CornerWidthHeight, UIElement, optFunc, IsType, MouseBtnInputEvent, MouseDraggedInputEvent, MouseDragListener, MousePinchedInputEvent, UIFrame, logger } from '../BristolImports'
import { MouseScrolledInputEvent } from '../BristolInput';
let log = logger.local('UIStack');
log.allowBelowLvl(LogLevel.naughty)
export interface UIFrameDescription_StackChild {
    width: optFunc<number>
    height: optFunc<number>
}
export enum OverScrollBehavior {
    hard, soft
}
export interface UIStackOptions<DataType, ChildType extends UIElement> {
    childLength: (index: number) => number;
    buildChild: (frame: UIFrame, brist: BristolBoard<any>) => ChildType
    bindData: (index: number, data: DataType, child: ChildType) => void
    isVertical: boolean
    overscroll?: OverScrollBehavior
}
export interface UIStackRecyclerSource<DataType> {
    count: () => number; get: (index: number) => DataType;
}
export class ArraySource<DataType> implements UIStackRecyclerSource<DataType>{
    data: DataType[];
    constructor(data: DataType[]) {
        this.data = data;
    }
    count() {
        return this.data.length;
    }
    get(index: number) {
        return this.data[index];
    }
}
export class UIStackRecycler<DataType, ChildType extends UIElement> extends UIElement implements MouseWheelListener, MouseDragListener {
    options: UIStackOptions<DataType, ChildType>
    extraElements: UIStackChildContainer<DataType, ChildType>
    rootElement: UIStackChildContainer<DataType, ChildType>
    rootIndex: number = 0
    rootOffset: number = 0;
    source: UIStackRecyclerSource<DataType>;
    get endCap() {
        let elem = this.rootElement;
        while (elem.next != null) {
            elem = elem.next;
        }
        return elem;
    }
    static SourceFromArray<DataType>(data: DataType[]) {
        return {
            count: () => data.length,
            get: (index: number) => data[index]
        }
    }
    static GridFixedColumns<DataType, ViewType extends UIElement>(data: DataType[], options: {
        buildCell: (frame: UIFrame, brist: BristolBoard<any>) => ViewType,
        rowHeight?: (row: number) => number,
        columnWidth?: (col: number) => number
        bindData: (index: number, data: DataType, child: ViewType) => void
        cols: number,
    },
        frame: UIFrame, brist: BristolBoard<any>): (UIStackRecycler<DataType, ViewType> & { data: DataType[] }) {
        type RowView = UIStackRecycler<DataType, ViewType>;
        let rowCount = () => {
            return Math.ceil(data.length / options.cols)
        }
        if (typeof options.columnWidth == 'undefined') {
            options.columnWidth = (col: number) => (frame.result.width / options.cols)
        }
        if (typeof options.rowHeight == 'undefined') {
            options.rowHeight = (row: number) => (frame.result.height / rowCount());
        }
        let out: (UIStackRecycler<DataType, ViewType> & { data: DataType[] }) = UIStackRecycler.create<DataType[], RowView>(UIStackRecycler.SourceFromArray(data.toSubArrays(options.cols)), {
            isVertical: true,
            overscroll: OverScrollBehavior.hard,
            childLength: (index: number) => { return options.rowHeight(Math.floor(index / options.cols)); },
            bindData: (index: number, data: DataType[], child: RowView) => {
                let d = child.source as ArraySource<DataType>;
                d.data = data;
                child.refeshData();
            },
            buildChild: (frame: UIFrame, brist: BristolBoard<any>) => {
                let rowView: (UIStackRecycler<DataType, ViewType> & { data: DataType[] }) = UIStackRecycler.create<DataType, ViewType>(new ArraySource([]), {
                    'bindData': options.bindData,
                    'buildChild': options.buildCell,
                    childLength: (index: number) => options.columnWidth(index % options.cols),
                    isVertical: false,

                }, frame, brist) as any;
                rowView.data = [];
                return rowView;
            }
        }, frame, brist) as any;
        return out;
    }
    onDrawBackground(frame: UIFrameResult, deltaTime: number): void {
        this.brist.ctx.save();
        this.brist.ctx.rect(frame.left, frame.top, frame.width, frame.height);
        this.brist.ctx.clip();
    }
    onDrawForeground(frame: UIFrameResult, deltaTime: number): void {
        this.brist.ctx.restore();
    }
    public static create<DataType, ChildType extends UIElement>(source: DataType[] | { count: () => number, get: (index: number) => DataType }, options: UIStackOptions<DataType, ChildType>, frame: UIFrame, brist: BristolBoard<any>) {
        return new Proxy(new UIStackRecycler(source, options, frame, brist), {
            get: function (target: UIStackRecycler<DataType, ChildType>, key: string) {
                if (isNumber(key)) {
                    let index = Number(key);
                    if (index < 0 || index >= target.source.count()) {
                        throw new Error(`Index ${index} out of bounds 0 - ${target.source.count()}`);
                    }
                    return [target.source.get(index), target.getChildByIndex(index)];
                }
                return target[key]
            }
        });
    }
    private constructor(source: DataType[] | { count: () => number, get: (index: number) => DataType }, options: UIStackOptions<DataType, ChildType>, frame: UIFrame, brist: BristolBoard<any>) {
        super(UIElement.createUID('stack'), frame, brist);
        this.options = options;
        if (IsType<UIStackRecyclerSource<DataType>>(source, 'count')) {
            this.source = source;
        } else {
            this.source = UIStackRecycler.SourceFromArray(source);
        }
        this.rootElement = new UIStackChildContainer(this);
        this.rootElement.parent = this;
        this.rootElement.onAddToParent();
        //childElement.frame.parent = this.frame;
        //childElement.onAddToParent();
        if (this.source.count() > 0) {
            this.options.bindData(0, this.source.get(0), this.rootElement.child);
        }
    }
    refeshData() {
        if (this.rootIndex >= this.source.count()) {
            this.rootIndex = 0;
            this.rootOffset = 0;

        }
        this.rootElement = new UIStackChildContainer(this);
        this.rootElement.parent = this;
        this.rootElement.onAddToParent();
        //childElement.frame.parent = this.frame;
        //childElement.onAddToParent();
        this.options.bindData(this.rootIndex, this.source.get(0), this.rootElement.child);
    }
    get overscrollBehavior(): OverScrollBehavior {
        if (typeof this.options.overscroll == 'undefined') {
            return OverScrollBehavior.hard
        }
        return this.options.overscroll;
    }
    shouldDragLock(event: MouseBtnInputEvent): boolean {
        return true;
    }
    mouseDragged(evt: MouseDraggedInputEvent): boolean {
        if (this.options.isVertical) {
            this.addScroll(evt.deltaY);
        } else {
            this.addScroll(evt.deltaX);
        }
        return true;
    }
    mousePinched(evt: MousePinchedInputEvent): boolean {
        return false;
    }
    onDragEnd(event: MouseBtnInputEvent): boolean {
        return true;
    }
    mouseWheel(event: MouseScrolledInputEvent): boolean {
        this.addScroll(event.amount);

        return true;
    }
    invalidateData() {
        this.rootElement = new UIStackChildContainer(this);
        let count = this.source.count();
        for (let i = 0; i < count; i++) {

        }
    }
    addScroll(amount: number) {
        this.rootOffset += amount;
        let endCap = this.endCap;
        if (this.rootIndex == 0 && this.rootOffset > 0) {
            switch (this.overscrollBehavior) {
                default:
                    log.info(`Unknown Overscroll behavior ${OverScrollBehavior[this.overscrollBehavior]}`)
                case OverScrollBehavior.hard:
                    this.rootOffset = 0;

            }
        } else if (endCap.frame.result.bottom < this.frame.result.bottom && endCap.index == this.source.count() - 1) {
            switch (this.overscrollBehavior) {
                default:
                    log.info(`Unknown Overscroll behavior ${OverScrollBehavior[this.overscrollBehavior]}`)
                case OverScrollBehavior.hard:
                    if (this.options.isVertical) {
                        this.rootOffset += this.frame.result.bottom - endCap.frame.result.bottom;
                    } else {
                        this.rootOffset += this.frame.result.right - endCap.frame.result.right;
                    }
            }
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
                left: ths.frame.result.left + ths.rootOffset,
                right: ths.frame.result.left + ths.rootOffset + ths.options.childLength(ths.rootIndex),
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

            } else {
                elem.frame.result = {
                    left: elem.last.frame.result.right,
                    right: elem.last.frame.result.right + ths.options.childLength(index),
                    top: ths.frame.result.top,
                    bottom: ths.frame.result.bottom,
                    centerX: 0,
                    centerY: 0,
                    width: 0,
                    height: 0
                };
            }
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
        if (elem == null) {
            elem = this.rootElement;
        }
        if (this.options.isVertical) {
            if (this.rootElement.frame.result.top > ths.frame.result.top && this.rootElement.index > 0) {
                this.rootElement.attachNext();
                this.measure(deltaTime);
                return;
            } else if (this.rootElement.frame.result.bottom < ths.frame.result.top) {
                this.rootElement.breakOff();
                return;
            }

            if (elem.frame.result.bottom < ths.frame.result.bottom && index < ths.source.count() - 1) {
                //needs more elements
                elem.attachNext();
                this.measure(deltaTime);
            } else if (elem.frame.result.top > ths.frame.result.bottom) {
                //needs less elements
                elem.breakOff();
            }

        } else {
            if (this.rootElement.frame.result.left > ths.frame.result.left && this.rootElement.index > 0) {
                this.rootElement.attachNext();
                this.measure(deltaTime);
                return;
            } else if (this.rootElement.frame.result.right < ths.frame.result.left) {
                this.rootElement.breakOff();
                return;
            }

            if (elem.frame.result.right < ths.frame.result.right && index < ths.source.count() - 1) {
                //needs more elements
                elem.attachNext();
                this.measure(deltaTime);
            } else if (elem.frame.result.left > ths.frame.result.right) {
                //needs less elements
                elem.breakOff();
            }
        }


        // this.forEachVisibleChild((elem: UIElement) => {

        //     if (elem.frame.isVisible()) {
        //         elem.measure(deltaTime);
        //     }
        // })
    }
    forEachVisibleChild(onEach: (elem: UIStackChildContainer<DataType, ChildType>, index: number) => (void | boolean)) {
        let elem = this.rootElement;
        let index = this.rootIndex;
        while (elem != null) {
            if (onEach(elem, index) === false) {
                break;
            };
            elem = elem.next;
            index++;
        }
    }
    getChildByIndex(index: number) {
        if (index < this.rootIndex) {
            return null;
        } else {
            let found: ChildType = null;
            this.forEachVisibleChild((elem: UIStackChildContainer<DataType, ChildType>, elemIndex: number) => {
                if (elemIndex == index) {
                    found = elem.child;
                    return false;
                }
            })
            return found;
        }
    }
    addExtraElement(elem: UIStackChildContainer<DataType, ChildType>) {
        if (this.extraElements == null) {
            this.extraElements = elem;
        } else {
            let next = this.extraElements;
            elem.next = next;
            next.last = elem;
            this.extraElements = elem;
        }
    }
    getExtraElement(): UIStackChildContainer<DataType, ChildType> {
        if (this.extraElements != null) {
            let elem = this.extraElements;
            this.extraElements = elem.next;
            if (elem.next != null) {
                elem.next.last = null;
            }
            elem.next = null;
            return elem;
        }
        return new UIStackChildContainer(this);
    }
}
export class UIStackChildContainer<DataType, ChildType extends UIElement> extends UIElement {

    next: UIStackChildContainer<DataType, ChildType> = null;
    last: UIStackChildContainer<DataType, ChildType> = null;
    child: ChildType
    parent: UIStackRecycler<DataType, ChildType>
    get index(): number {
        if (this.last != null) {
            return this.last.index + 1;
        }
        return this.parent.rootIndex;
    }
    onDrawBackground(frame: UIFrameResult, deltaTime: number): void {
    }
    onDrawForeground(frame: UIFrameResult, deltaTime: number): void {
    }
    frame: UIFrame_CornerWidthHeight
    constructor(parent: UIStackRecycler<any, ChildType>) {
        super(UIElement.createUID('uiStackChildContainer'), (thus) => {
            let ths: UIStackChildContainer<DataType, ChildType> = thus as any;
            if (parent.options.isVertical) {
                let out = UIFrame.Build({
                    x: 0, y: () => {
                        if (ths.last != null) {
                            return 0;//ths.last.frame.description.y
                        }
                        return 0;
                    }, width: () => ths.getWidth(), height: () => parent.options.childLength(ths.index)
                })

                return out;
            } else {
                let out = UIFrame.Build({
                    x: () => {
                        if (ths.last != null) {
                            return 0;//ths.last.frame.description.y
                        }
                        return 0;
                    }, y: 0,
                    width: () => {
                        console.log('tst')
                        let w = ths.getWidth();
                        return w;
                    },
                    height: () => parent.options.childLength(ths.index)
                })

                return out;
            }

        }, parent.brist);
        this.parent = parent;
        let ths = this;
        this.child = parent.options.buildChild(UIFrame.Build({
            x: 0, y: 0, width: () => ths.getWidth(), height: () => ths.getHeight()
        }), parent.brist);
        this.addChild(this.child);
    }
    get isEndCap() {
        return this.next == null;// && this.last != null;
    }
    get isStartCap() {
        return this.last == null;// && this.next != null;
    }
    breakOff() {
        if (this.next == null && this.last == null) {
            log.error('cannot break off root')
            return;
        }
        if (this.isEndCap) {
            log.info('Breaking off end cap')
            //end cap
            this.last.next = null;
            this.last = null;
        } else if (this.isStartCap) {
            //start cap
            log.info('Breaking off start cap')
            this.parent.rootOffset += this.parent.options.childLength(this.parent.rootIndex);
            this.parent.rootIndex++;
            this.parent.rootElement = this.next;
            this.next.last = null;
            this.next = null;
        }
        this.parent.addExtraElement(this);
    }

    attachNext() {
        let index = this.index;
        if (this.isEndCap) {

            // if(index >= this.parent.source.count()){
            //     return false;
            // }
            log.info(`Attaching to end cap ${index}`)
            //end cap
            this.next = this.parent.getExtraElement();
            this.next.last = this;
            this.parent.options.bindData(index + 1, this.parent.source.get(index + 1), this.next.child);
            return true;
        } else if (this.isStartCap) {
            //start cap
            log.info(`Attaching to start cap ${index}`)
            this.parent.rootIndex--;
            this.parent.rootOffset -= this.parent.options.childLength(this.parent.rootIndex);
            this.last = this.parent.getExtraElement();
            this.parent.options.bindData(this.parent.rootIndex, this.parent.source.get(this.parent.rootIndex), this.last.child);
            this.last.next = this;
            this.parent.rootElement = this.last;
        }
    }
}
// export interface GridRecyclerAdapter<DataType, ChildType extends UIElement> {
//     get rows(): number
//     get columns(): number
//     getColumnWidth(col: number): number
//     getRowHeight(row: number): number
//     buildChild(): ChildType
//     getData(row: number, col: number): DataType
//     bindData(data: DataType, child: ChildType, row: number, col: number): void
// }
// export class ArrayGridRecyclerAdapter<DataType, ChildType extends UIElement> implements GridRecyclerAdapter<DataType, ChildType>{
//     data: DataType[];
//     direction: 'vertical' | 'horizontal'
//     get isVertical() {
//         return this.direction == 'vertical'
//     }
//     constructor(data: DataType[], options: {
//         limit: { rows: number } | { columns: number }

//     }) {
//         this.data = data;

//         let limit: { rows: number } | { columns: number } = options.limit;
//         if (IsType<{ rows: number }>(limit, 'rows')) {
//             this.rowGetter = () => limit['rows'];
//             this.direction = 'horizontal';
//         } else {
//             this.colGetter = () => limit['columns']
//             this.direction = 'vertical'
//         }
//     }
//     rowGetter: () => number;
//     colGetter: () => number;
//     get rows(): number {
//         return this.rowGetter();
//     }
//     get columns(): number {
//         return this.colGetter();
//     }
//     getColumnWidth(col: number): number {
//         return 100;
//     }
//     getRowHeight(row: number): number {
//         return 100;
//     }
//     buildChild(): ChildType {
//         throw new Error('Method not implemented.');
//     }
//     getData(row: number, col: number): DataType {
//         let i = row * this.rows;
//         throw new Error('Method not implemented.');
//     }
//     bindData(data: DataType, child: ChildType, row: number, col: number): void {
//         throw new Error('Method not implemented.');
//     }

// }
// export class UIGridRecycler<DataType, ChildType extends UIElement> extends UIElement implements MouseDragListener {
//     adapter: GridRecyclerAdapter<DataType, ChildType>;
//     constructor(adapter: GridRecyclerAdapter<DataType, ChildType>, frame: UIFrame, brist: BristolBoard<any>) {
//         super(UIElement.createUID('stack'), frame, brist);
//         this.adapter = adapter;

//     }
//     shouldDragLock(event: MouseBtnInputEvent): boolean {
//         return true;
//     }
//     mouseDragged(evt: MouseDraggedInputEvent): boolean {
//         this.addOffset(evt.deltaX, 0);
//         return true;
//     }
//     mousePinched(evt: MousePinchedInputEvent): boolean {
//         return false;
//     }
//     onDragEnd(event: MouseBtnInputEvent): boolean {
//         return true;
//     }
//     startCell: {
//         row: number,
//         col: number,
//         x: number,
//         y: number
//     } = {
//             row: 0,
//             col: 0,
//             x: 0,
//             y: 0
//         }

//     private get startCellRight(): number {
//         return this.startCell.x + this.adapter.getColumnWidth(this.startCell.col);
//     }
//     private get startCellBottom(): number {
//         return this.startCell.y + this.adapter.getRowHeight(this.startCell.row);
//     }
//     get offset() {
//         return [this.startCell.x, this.startCell.y]
//     }
//     addOffset(x: number, y: number) {
//         this.startCell.x += x;
//         //this.startCell.y += y;
//         // if (this.startCell.x > 0) {
//         //     this.startCell.x = 0;
//         // }

//         while (this.startCellRight < 0 && this.startCell.col < this.adapter.columns - 1) {
//             this.startCell.col++
//             this.startCell.x -= this.adapter.getColumnWidth(this.startCell.col);
//         }
//         while (this.startCell.x > 0 && this.startCell.col > 0) {
//             this.startCell.col--
//             this.startCell.x += this.adapter.getColumnWidth(this.startCell.col)
//         }
//     }
//     forEachVisibleChild(onEach: (elem: UIElement, index: number) => void) {
//         let cx = this.startCell.x;
//         let cy = this.startCell.y;
//         let ccol = this.startCell.col;
//         while (ccol < this.adapter.columns) {

//         }
//     }
//     invalidateDataset() {

//     }
//     onDrawBackground(frame: UIFrameResult, deltaTime: number): void {
//         this.brist.ctx.save();
//         this.brist.ctx.rect(frame.left, frame.top, frame.width, frame.height);
//         this.brist.ctx.clip();
//     }
//     onDrawForeground(frame: UIFrameResult, deltaTime: number): void {
//         this.brist.ctx.restore();
//     }


// }
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