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
    forEach(callback: (value: T, index: number) => (void | boolean)) {
        let n = this.head;
        let i = 0;
        while (n != null) {
            if (callback(n.value, i) == true) {
                break;
            }
            i++;
            n = n.next;
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