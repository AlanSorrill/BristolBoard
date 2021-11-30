import { isNumber } from './CommonImports';

export class LinkedList<T> {
    get length(): number {
        return this.count;
    }
    private count: number = 0;


    comparator: ((a: T, b: T) => number) | null;
    head: LinkedListNode<T> = null;

    get isSorted(): boolean {
        return this.comparator != null
    }
    public static CreateUnsorted<T>() {
        return this.CreateSorted<T>(null);
    }
    public static CreateSorted<T>(comparator: (a: T, b: T) => number) {
        let out = new LinkedList<T>(comparator);
        return new Proxy(out, {
            get: function (target: LinkedList<T>, name) {
                if (name in target) {
                    return target[name]
                };
                if (isNumber(name as any)) {//get items by index, for example: let x = myList[2];
                    let targetIndex = Number(name);
                    let out: T = null;
                    target.forEach((v: T, index: number) => {
                        if (index == targetIndex) {
                            out = v;
                            return 'break';
                        }
                    })
                    return out;
                }
                return undefined;
            }
        })
    }
    ensureOrder(node: LinkedListNode<T> = null) {
        if (node == null) {
            //ensure order on head
            if (this.head != null && this.head.next != null) {
                if (this.comparator(this.head.value, this.head.next.value) < 0) {
                    let nodes: [LinkedListNode<T>, LinkedListNode<T>, LinkedListNode<T>] = [this.head, this.head.next, this.head.next.next]
                    this.head = nodes[1];
                    this.head.next = nodes[0];
                    this.head.next.next = nodes[2];
                }
            }
        } else {
            if (node.next != null) {
                if (this.comparator(node.value, node.next.value) < 0) {
                    this.moveForward(node);
                }
            }
        }
    }
    private moveForward(node: LinkedListNode<T>) {
        console.log(`Moving node forward ${node.value}`)
        if (node == null) {
            return;
        }
        if (node.next == null) {
            return;
        }
        let nodes: [lastNode: LinkedListNode<T>, thisNode: LinkedListNode<T>, nextNode: LinkedListNode<T>, nextNextNode: LinkedListNode<T>] = [node.last, node, node.next, node.next.next];
        //cut thisNode out
        if (nodes[0] != null) {
            nodes[0].next = nodes[2];
        }
        nodes[2].last = nodes[0];
        //put it after next node
        nodes[2].next = nodes[1];
        if (nodes[3] != null) {
            nodes[3].last = nodes[1];
        }

        nodes[1].last = nodes[2];
        nodes[1].next = nodes[3];
    }
   
    //side start or end only works on unsorted lists
    add(value: T, side: 'start' | 'end' = 'end'): number {
        this.count++;
        if (this.head == null) {
            this.head = new LinkedListNode<T>(value);
            return 0;
        }
        if (!this.isSorted) {
            if (side == 'start') {
                let tmp = this.head;
                this.head = new LinkedListNode<T>(value);
                this.head.next = tmp;
                if (tmp != null) {
                    tmp.last = this.head;
                }
                return 0;
            } else {
                let tmp = this.tail;
                tmp.next = new LinkedListNode<T>(value);
                tmp.next.last = tmp;
                return this.count - 1;
            }
        }
        let fresh: LinkedListNode<T> = new LinkedListNode<T>(value);
        let n = this.head;
        if (this.isALesser(value, n.value)) {

            fresh.next = this.head;
            this.head.last = fresh;

            this.head = fresh;
            return 0;
        }
        let i = 1;
        while (n.next != null && (this.comparator(value, n.next.value) >= 0)) {
            n = n.next;
            i++;
        }
        let tmp = n.next;
        n.next = fresh;
        fresh.last = n;
        fresh.next = tmp;
        if (tmp != null) {
            tmp.last = fresh;
        }
        return i;
    }
    //removes first element that condition(T) returns true for
    remove(condition: ((v: T) => boolean), exitAfterFirstRemoval: boolean = true) {
        if (this.head == null) {
            return;
        }
        if (condition(this.head.value)) {
            this.head = this.head.next;
            if (this.head != null) {
                this.head.last = null;
                this.count--;
            } else {
                this.count = 0;
            }
            if (exitAfterFirstRemoval) {
                return;
            }
        }
        if (this.head == null) {
            return;
        }
        let n = this.head.next;
        let lastN = this.head;
        while (n != null) {
            if (condition(n.value)) {
                lastN.next = n.next;
                if (n.next != null) {
                    n.next.last = lastN;
                }
                this.count--;
                if (exitAfterFirstRemoval) {
                    break;
                }
            }
            lastN = n;
            n = n.next;
        }
    }
    clear(onRemove: (value: T) => void = (v: T) => { }) {
        let tmp = this.head;
        this.head = null;
        let next: LinkedListNode<T>;
        while (tmp != null) {
            next = tmp.next;
            onRemove(tmp.value);
            tmp.next = null;
            tmp.last = null;
            tmp.value = null;
            tmp = next;
        }
        this.count = 0;
    }
    find(condition: (elem: T) => boolean): T {
        let n = this.head;
        while (n != null) {
            if (condition(n.value)) {
                return n.value;
            }
            n = n.next;
        }
        return null;
    }

    //return 'break' to break
    forEach(callback: (value: T, index: number) => (void | 'break'), fixOrder: boolean = true) {
        let n = this.head;
        let i = 0;
        if (this.isSorted && fixOrder) {
            this.ensureOrder();
            while (n != null) {
                this.ensureOrder(n);
                if (callback(n.value, i) == 'break') {
                    break;
                }
                i++;
                n = n.next;
            }
        } else {
            while (n != null) {
                if (callback(n.value, i) == 'break') {
                    break;
                }
                i++;
                n = n.next;
            }
        }


    }
    //return true to break
    forEachReverse(callback: (value: T) => (void | boolean)) {
        let n = this.tail;
        while (n != null) {
            if (callback(n.value) == true) {
                break;
            }
            n = n.last;
        }
    }

    toArray(): T[] {
        let out: T[] = [];
        this.forEach((value: T) => {
            out.push(value);
        })
        return out;
    }

    private constructor(comparator: (a: T, b: T) => number | null) {
        this.comparator = comparator;
    }

    get tail(): LinkedListNode<T> {
        let n = this.head;
        if (n == null) {
            return null;
        }
        while (n.next != null) {
            n = n.next;
        }
        return n;
    }

    isAGreater(a: T, b: T) {
        return this.comparator(a, b) > 0;
    }

    isALesser(a: T, b: T) {
        return this.comparator(a, b) < 0;
    }

    isEqual(a: T, b: T) {
        return this.comparator(a, b) == 0;
    }
}

export class LinkedListNode<T> {
    value: T
    next: LinkedListNode<T>
    last: LinkedListNode<T>
    constructor(value: T, next: LinkedListNode<T> = null, last: LinkedListNode<T> = null) {
        this.value = value;
        this.next = next;
        this.last = last;
    }
}

export type LinkedTuple<T> = [T, null | LinkedTuple<T>]
export class LinkedTupleTools {
    static CreateLinkedTuple<T>(initialValue: T): LinkedTuple<T> {
        return [initialValue, null]
    }
    static ForEachLinkedTuple<T>(linkedTuple: LinkedTuple<T>, callback: (value: T, depth: number) => (void | false)) {
        let tmp = linkedTuple
        let depth = 0;
        while (tmp != null) {
            if (callback(tmp[0], depth) === false) {
                break;
            }
            depth++;
            tmp = tmp[1];
        }
    }
    static AddToEndOfLinkedTuple<T>(linkedTuple: LinkedTuple<T>, newEndValue: T) {
        if (linkedTuple == null) {
            return LinkedTupleTools.CreateLinkedTuple(newEndValue);
        }
        let current = linkedTuple;
        while (current[1] != null) {
            current = current[1];
        }
        current[1] = LinkedTupleTools.CreateLinkedTuple(newEndValue)
        return linkedTuple;
    }
    static SearchAndDestroy<T>(linkedTupleHead: LinkedTuple<T>, shouldRemove: (value: T) => boolean, onRemove?: (value: T) => void) {
        let tmp = linkedTupleHead

        while (tmp != null) {
            if (shouldRemove(tmp[0])) {
                onRemove?.(tmp[0]);
                if (tmp[1] != null) {
                    tmp[1] = tmp[1][1];
                } else {
                    tmp[1] = null;
                }
            }

            tmp = tmp[1];
        }
    }
}

