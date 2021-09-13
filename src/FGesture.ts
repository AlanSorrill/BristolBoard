import { FHTML } from './BristolImports';

export interface TouchPoint extends Touch {
    delta: Coordinate
}
export type Coordinate = { x: number, y: number }
export interface FGesture_Listeners {
    onTouchStart: (pos: Coordinate) => void
    onTouchEnd: (pos: Coordinate) => void
    onDrag: (position: Coordinate, delta: Coordinate) => void
    onPinch: (position: Coordinate, dragDelta: Coordinate, pinchDelta: Coordinate) => void
}
export class FGesture {
    element: FHTML<any>;
    touchPoints: [TouchPoint, TouchPoint] = [null, null]
    listeners: FGesture_Listeners;
    constructor(element: FHTML<any>, listeners: FGesture_Listeners) {
        this.element = element
        this.listeners = listeners;
        let ths = this;
        document.addEventListener('touchstart', (ev: TouchEvent) => {
          //  console.log(ev);
            for (let i = 0; i < Math.min(ths.touchPoints.length, ev.changedTouches.length); i++) {
                if (ev.changedTouches[i].identifier < ths.touchPoints.length) {
                    ths.touchPoints[ev.changedTouches[i].identifier] = ev.changedTouches[i] as TouchPoint
                    ths.touchPoints[ev.changedTouches[i].identifier].delta = {
                        x: 0,
                        y: 0
                    }
                   // console.log(`Starting touch point ${ev.changedTouches[i].identifier}`, ths.touchPoints[ev.changedTouches[i].identifier])
                    ths.listeners.onTouchStart({x: ths.touchPoints[ev.changedTouches[i].identifier].clientX, y: ths.touchPoints[ev.changedTouches[i].identifier].clientY})
                }
            }
            ev.preventDefault();
        })
        document.addEventListener('touchmove', (ev: TouchEvent) => {
            ev.preventDefault();
           // console.log(ev);
            let lastX: number;
            let lastY: number;
            for (let i = 0; i < Math.min(ths.touchPoints.length, ev.changedTouches.length); i++) {
                if (ev.changedTouches[i].identifier < ths.touchPoints.length) {
                    lastX = ths.touchPoints[ev.changedTouches[i].identifier].clientX;
                    lastY = ths.touchPoints[ev.changedTouches[i].identifier].clientY;
                    ths.touchPoints[ev.changedTouches[i].identifier] = ev.changedTouches[i] as TouchPoint
                    ths.touchPoints[ev.changedTouches[i].identifier].delta = {
                        x: ths.touchPoints[ev.changedTouches[i].identifier].clientX - lastX,
                        y: ths.touchPoints[ev.changedTouches[i].identifier].clientY - lastY
                    }
                }
            }

            if (ev.targetTouches.length == 1) {
                this.listeners.onDrag(
                    { x: ths.touchPoints[ev.targetTouches[0].identifier].clientX, y: ths.touchPoints[ev.targetTouches[0].identifier].clientY },
                    ths.touchPoints[ev.targetTouches[0].identifier].delta
                )
            } else if (ev.targetTouches.length == 2) {

            }
//             console.log(ev);
        })
        document.addEventListener('touchend', (ev: TouchEvent) => {
         //   console.log(ev);
         let DEBUGG = {ev, ths};
            for (let i = 0; i < Math.min(ths.touchPoints.length, ev.changedTouches.length); i++) {
                ths.listeners.onTouchEnd({x: ths.touchPoints[ev.changedTouches[i].identifier]?.clientX, y: ths.touchPoints[ev.changedTouches[i].identifier]?.clientY})
                if (ev.changedTouches[i].identifier < ths.touchPoints.length) {
                    //console.log(`Removing touch point ${ev.changedTouches[i].identifier}`)
                    ths.touchPoints[ev.changedTouches[i].identifier] = null;
                }
                
            }
            ev.preventDefault();
        })
    }
}