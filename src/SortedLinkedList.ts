import { isNumber } from './CommonImports';

export class SortedLinkedList<T> {
    get length(): number {
        return this.count;
    }
    private count: number = 0;


    comparator: (a: T, b: T) => number;
    head: SortedLinkedListNode<T> = null;

    public static Create<T>(comparator: (a: T, b: T) => number) {
        let out = new SortedLinkedList<T>(comparator);
        return new Proxy(out, {
            get: function (target: SortedLinkedList<T>, name) {
                if (name in target) {
                    return target[name]
                };
                if (isNumber(name as any)) {//get items by index, for example: let x = myList[2];
                    let targetIndex = Number(name);
                    let out: T = null;
                    target.forEach((v: T, index: number) => {
                        if (index == targetIndex) {
                            out = v;
                            return true;
                        }
                    })
                    return out;
                }
                return undefined;
            }
        })
    }
    ensureOrder(node: SortedLinkedListNode<T> = null) {
        if (node == null) {
            //ensure order on head
            if (this.head != null && this.head.next != null) {
                if (this.comparator(this.head.value, this.head.next.value) < 0) {
                    let nodes: [SortedLinkedListNode<T>, SortedLinkedListNode<T>, SortedLinkedListNode<T>] = [this.head, this.head.next, this.head.next.next]
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
    private moveForward(node: SortedLinkedListNode<T>) {
        console.log(`Moving node forward ${node.value}`)
        if (node == null) {
            return;
        }
        if (node.next == null) {
            return;
        }
        let nodes: [lastNode: SortedLinkedListNode<T>, thisNode: SortedLinkedListNode<T>, nextNode: SortedLinkedListNode<T>, nextNextNode: SortedLinkedListNode<T>] = [node.last, node, node.next, node.next.next];
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
    add(value: T) {
        this.count++;
        if (this.head == null) {
            this.head = new SortedLinkedListNode<T>(value);
            return 0;
        }

        let fresh: SortedLinkedListNode<T> = new SortedLinkedListNode<T>(value);
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
    remove(condition: ((v: T) => boolean)) {
        if (condition(this.head.value)) {
            this.head = this.head.next;
            if (this.head != null) {
                this.head.last = null;
                this.count--;
            } else {
                this.count = 0;
            }
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
                break;
            }
            lastN = n;
            n = n.next;
        }
    }
    clear(onRemove: (value: T) => void = (v: T) => { }) {
        let tmp = this.head;
        this.head = null;
        let next: SortedLinkedListNode<T>;
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

    //return true to break
    forEach(callback: (value: T, index: number) => (void | boolean), fixOrder: boolean = true) {
        let n = this.head;
        let i = 0;
        if (fixOrder) {
            this.ensureOrder();
            while (n != null) {
                this.ensureOrder(n);
                if (callback(n.value, i) == true) {
                    break;
                }
                i++;
                n = n.next;
            }
        } else {
            while (n != null) {
                if (callback(n.value, i) == true) {
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

    private constructor(comparator: (a: T, b: T) => number) {
        this.comparator = comparator;
    }

    get tail(): SortedLinkedListNode<T> {
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

export class SortedLinkedListNode<T> {
    value: T
    next: SortedLinkedListNode<T>
    last: SortedLinkedListNode<T>
    constructor(value: T, next: SortedLinkedListNode<T> = null, last: SortedLinkedListNode<T> = null) {
        this.value = value;
        this.next = next;
        this.last = last;
    }
}

export type LinkedTuple<T> = [T, null | LinkedTuple<T>]

//return false to break loop
export function ForEachLinkedTuple<T>(linkedTuple: LinkedTuple<T>, callback: (value: T, depth: number)=>(void | false)){
    let tmp = linkedTuple
    let depth = 0;
    while(tmp != null){
        if(callback(tmp[0], depth) === false){
            break;
        }
        depth++;
        tmp = tmp[1];
    }
}
export function CreateLinkedTuple<T>(initialValue: T): LinkedTuple<T>{
    return [initialValue, null]
}