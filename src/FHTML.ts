

export class FHTML<TYPE extends HTMLElement> {
    offset() {
        return this.element.getBoundingClientRect();;
    }

    element: TYPE
    constructor(element: TYPE | string) {
        if (typeof element == "string") {
            this.element = document.querySelector(element);
        } else {
            this.element = element;
        }
    }
    get width() {
        return this.element.offsetWidth;
    }
    get height() {
        return this.element.offsetHeight;
    }
    setCss(name: string | Array<[string, string]>, value: string = null): this {
        if (typeof name == 'string') {
            this.element.style[name] = value;//(name, value);
            return this;
        } else {
            for (let i = 0; i < name.length; i++) {
                this.setCss(name[i][0], name[i][1]);
            }
            return this;
        }


    }
    append(element: FHTML<any>) {
        this.element.append(element.element);
    }
    getCss(name: string): string {
        return this.element.style[name];
    }
    attr(name: string, value: string = null): string {
        if (value != null) {
            this.element.setAttribute(name, value);
            return null;
        } else {
            return this.element.getAttribute(name);
        }
    }
    createChildDiv(id: string): FHTML<HTMLDivElement> {
        return this.createChildElem<"div">(id, "div");
    }
    createChildElem<FreshType extends keyof HTMLElementTagNameMap>(id: string, tagType: FreshType): FHTML<HTMLElementTagNameMap[FreshType]> {
        let output: FHTML<HTMLElementTagNameMap[FreshType]> = FHTML.CreateElement(tagType);
        output.attr("id", id);
        this.element.appendChild(output.element);
        return output;
    }
    static CreateElement<FreshType extends keyof HTMLElementTagNameMap>(tagType: FreshType): FHTML<HTMLElementTagNameMap[FreshType]> {
        let elem: HTMLElementTagNameMap[FreshType] = document.createElement<FreshType>(tagType);
        let output: FHTML<HTMLElementTagNameMap[FreshType]> = new FHTML(elem);
        return output;
    }
    static async loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((acc, rej) => {
            let img = new Image();

            img.onload = function () {
                acc(img);
            }
            img.onerror = function (err) {
                rej(err);
            }
            img.src = url;
        })


    }
}