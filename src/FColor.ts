
export class FColorSwath {
    constructor(data: any) {
        this.lighten4 = FColor.fromHex(data['100']);
        this.lighten3 = FColor.fromHex(data['200']);
        this.lighten2 = FColor.fromHex(data['300']);
        this.lighten1 = FColor.fromHex(data['400']);
        this.base = FColor.fromHex(data['500']);
        this.darken1 = FColor.fromHex(data['600']);
        this.darken2 = FColor.fromHex(data['700']);
        this.darken3 = FColor.fromHex(data['800']);
        this.darken4 = FColor.fromHex(data['900']);
        this.accent1 = FColor.fromHex(data['a100'] ?? '#000');
        this.accent2 = FColor.fromHex(data['a200'] ?? '#000');
        this.accent3 = FColor.fromHex(data['a400'] ?? '#000');
        this.accent4 = FColor.fromHex(data['a700'] ?? '#000');
    }
    lighten5: FColor;
    lighten4: FColor;
    lighten3: FColor;
    lighten2: FColor;
    lighten1: FColor;
    base: FColor;
    darken1: FColor;
    darken2: FColor;
    darken3: FColor;
    darken4: FColor;
    accent1: FColor;
    accent2: FColor;
    accent3: FColor;
    accent4: FColor;
}
export class FColor {
    private aa: number;
    private bb: number;
    private gg: number;
    private rr: number;
    total: number = 255;
    constructor(r: number, g: number, b: number, a: number, total: number = 255) {
        this.rr = r;
        this.gg = g;
        this.bb = b;
        this.aa = a;
        this.total = total;

    }
    static fromHex(colorHex: string) {
        colorHex = colorHex.replaceAll('#', '').replaceAll(' ', '');

        let r = parseInt(colorHex.substr(0, 2), 16);
        let g = parseInt(colorHex.substr(2, 2), 16);
        let b = parseInt(colorHex.substr(4, 2), 16);

        let a = colorHex.length > 6 ? parseInt(colorHex.substr(6, 2), 16) : -1;
        return new FColor(r, g, b, a);
    }
    lastHex: string = null;
    setHex(colorHex: string) {
        this.lastHex = colorHex;
        colorHex = colorHex.replaceAll('#', '').replaceAll(' ', '');

        let r = parseInt(colorHex.substr(0, 2), 16);
        let g = parseInt(colorHex.substr(2, 2), 16);
        let b = parseInt(colorHex.substr(4, 2), 16);

        let a = colorHex.length > 6 ? parseInt(colorHex.substr(6, 2), 16) : -1;
        this.rr = r;
        this.gg = g;
        this.bb = b;
        this.aa = a;
        this.total = 255;
    }
    get r(): number {
        return (this.rr / this.total) * 255
    }
    get g(): number {
        return (this.gg / this.total) * 255
    }
    get b(): number {
        return (this.bb / this.total) * 255
    }
    get a(): number {
        return (this.aa / this.total) * 255
    }
    get hasChanged(): boolean {
        return this.oldStr == null; (this.oldVals[0] != this.r) || (this.oldVals[1] != this.g) || (this.oldVals[2] != this.b) || (this.oldVals[3] != this.a);
    }
    private genStr() {
        this.oldStr = `rgb${this.a != -1 ? 'a' : ''}(${this.r}, ${this.g}, ${this.b}${this.a != -1 ? (', ' + this.a) : ''})`;
    }
    private oldStr: string = null;
    private oldVals: [number, number, number, number] = [-1, -1, -1, -1];
    toHexString() {
        if (this.hasChanged) {
            this.genStr();
        }
        return this.oldStr;
    }
    copy() {
        return new FColor(this.rr, this.gg, this.bb, this.aa, this.total);
    }
    //opacity 0-255
    setAlpha(a: number) {
        this.aa = a
        return this;
    }
    //opacity 0-1
    setOpacity(decimalPercent: number) {
        this.setAlpha(this.total * decimalPercent);
        return this;
    }
}
export class FColorDirectory {
    static materialColors = {
        "red": {
            "50": "#ffebee",
            "100": "#ffcdd2",
            "200": "#ef9a9a",
            "300": "#e57373",
            "400": "#ef5350",
            "500": "#f44336",
            "600": "#e53935",
            "700": "#d32f2f",
            "800": "#c62828",
            "900": "#b71c1c",
            "a100": "#ff8a80",
            "a200": "#ff5252",
            "a400": "#ff1744",
            "a700": "#d50000"
        },
        "pink": {
            "50": "#fce4ec",
            "100": "#f8bbd0",
            "200": "#f48fb1",
            "300": "#f06292",
            "400": "#ec407a",
            "500": "#e91e63",
            "600": "#d81b60",
            "700": "#c2185b",
            "800": "#ad1457",
            "900": "#880e4f",
            "a100": "#ff80ab",
            "a200": "#ff4081",
            "a400": "#f50057",
            "a700": "#c51162"
        },
        "purple": {
            "50": "#f3e5f5",
            "100": "#e1bee7",
            "200": "#ce93d8",
            "300": "#ba68c8",
            "400": "#ab47bc",
            "500": "#9c27b0",
            "600": "#8e24aa",
            "700": "#7b1fa2",
            "800": "#6a1b9a",
            "900": "#4a148c",
            "a100": "#ea80fc",
            "a200": "#e040fb",
            "a400": "#d500f9",
            "a700": "#aa00ff"
        },
        "deepPurple": {
            "50": "#ede7f6",
            "100": "#d1c4e9",
            "200": "#b39ddb",
            "300": "#9575cd",
            "400": "#7e57c2",
            "500": "#673ab7",
            "600": "#5e35b1",
            "700": "#512da8",
            "800": "#4527a0",
            "900": "#311b92",
            "a100": "#b388ff",
            "a200": "#7c4dff",
            "a400": "#651fff",
            "a700": "#6200ea"
        },
        "indigo": {
            "50": "#e8eaf6",
            "100": "#c5cae9",
            "200": "#9fa8da",
            "300": "#7986cb",
            "400": "#5c6bc0",
            "500": "#3f51b5",
            "600": "#3949ab",
            "700": "#303f9f",
            "800": "#283593",
            "900": "#1a237e",
            "a100": "#8c9eff",
            "a200": "#536dfe",
            "a400": "#3d5afe",
            "a700": "#304ffe"
        },
        "blue": {
            "50": "#e3f2fd",
            "100": "#bbdefb",
            "200": "#90caf9",
            "300": "#64b5f6",
            "400": "#42a5f5",
            "500": "#2196f3",
            "600": "#1e88e5",
            "700": "#1976d2",
            "800": "#1565c0",
            "900": "#0d47a1",
            "a100": "#82b1ff",
            "a200": "#448aff",
            "a400": "#2979ff",
            "a700": "#2962ff"
        },
        "lightBlue": {
            "50": "#e1f5fe",
            "100": "#b3e5fc",
            "200": "#81d4fa",
            "300": "#4fc3f7",
            "400": "#29b6f6",
            "500": "#03a9f4",
            "600": "#039be5",
            "700": "#0288d1",
            "800": "#0277bd",
            "900": "#01579b",
            "a100": "#80d8ff",
            "a200": "#40c4ff",
            "a400": "#00b0ff",
            "a700": "#0091ea"
        },
        "cyan": {
            "50": "#e0f7fa",
            "100": "#b2ebf2",
            "200": "#80deea",
            "300": "#4dd0e1",
            "400": "#26c6da",
            "500": "#00bcd4",
            "600": "#00acc1",
            "700": "#0097a7",
            "800": "#00838f",
            "900": "#006064",
            "a100": "#84ffff",
            "a200": "#18ffff",
            "a400": "#00e5ff",
            "a700": "#00b8d4"
        },
        "teal": {
            "50": "#e0f2f1",
            "100": "#b2dfdb",
            "200": "#80cbc4",
            "300": "#4db6ac",
            "400": "#26a69a",
            "500": "#009688",
            "600": "#00897b",
            "700": "#00796b",
            "800": "#00695c",
            "900": "#004d40",
            "a100": "#a7ffeb",
            "a200": "#64ffda",
            "a400": "#1de9b6",
            "a700": "#00bfa5"
        },
        "green": {
            "50": "#e8f5e9",
            "100": "#c8e6c9",
            "200": "#a5d6a7",
            "300": "#81c784",
            "400": "#66bb6a",
            "500": "#4caf50",
            "600": "#43a047",
            "700": "#388e3c",
            "800": "#2e7d32",
            "900": "#1b5e20",
            "a100": "#b9f6ca",
            "a200": "#69f0ae",
            "a400": "#00e676",
            "a700": "#00c853"
        },
        "lightGreen": {
            "50": "#f1f8e9",
            "100": "#dcedc8",
            "200": "#c5e1a5",
            "300": "#aed581",
            "400": "#9ccc65",
            "500": "#8bc34a",
            "600": "#7cb342",
            "700": "#689f38",
            "800": "#558b2f",
            "900": "#33691e",
            "a100": "#ccff90",
            "a200": "#b2ff59",
            "a400": "#76ff03",
            "a700": "#64dd17"
        },
        "lime": {
            "50": "#f9fbe7",
            "100": "#f0f4c3",
            "200": "#e6ee9c",
            "300": "#dce775",
            "400": "#d4e157",
            "500": "#cddc39",
            "600": "#c0ca33",
            "700": "#afb42b",
            "800": "#9e9d24",
            "900": "#827717",
            "a100": "#f4ff81",
            "a200": "#eeff41",
            "a400": "#c6ff00",
            "a700": "#aeea00"
        },
        "yellow": {
            "50": "#fffde7",
            "100": "#fff9c4",
            "200": "#fff59d",
            "300": "#fff176",
            "400": "#ffee58",
            "500": "#ffeb3b",
            "600": "#fdd835",
            "700": "#fbc02d",
            "800": "#f9a825",
            "900": "#f57f17",
            "a100": "#ffff8d",
            "a200": "#ffff00",
            "a400": "#ffea00",
            "a700": "#ffd600"
        },
        "amber": {
            "50": "#fff8e1",
            "100": "#ffecb3",
            "200": "#ffe082",
            "300": "#ffd54f",
            "400": "#ffca28",
            "500": "#ffc107",
            "600": "#ffb300",
            "700": "#ffa000",
            "800": "#ff8f00",
            "900": "#ff6f00",
            "a100": "#ffe57f",
            "a200": "#ffd740",
            "a400": "#ffc400",
            "a700": "#ffab00"
        },
        "orange": {
            "50": "#fff3e0",
            "100": "#ffe0b2",
            "200": "#ffcc80",
            "300": "#ffb74d",
            "400": "#ffa726",
            "500": "#ff9800",
            "600": "#fb8c00",
            "700": "#f57c00",
            "800": "#ef6c00",
            "900": "#e65100",
            "a100": "#ffd180",
            "a200": "#ffab40",
            "a400": "#ff9100",
            "a700": "#ff6d00"
        },
        "deepOrange": {
            "50": "#fbe9e7",
            "100": "#ffccbc",
            "200": "#ffab91",
            "300": "#ff8a65",
            "400": "#ff7043",
            "500": "#ff5722",
            "600": "#f4511e",
            "700": "#e64a19",
            "800": "#d84315",
            "900": "#bf360c",
            "a100": "#ff9e80",
            "a200": "#ff6e40",
            "a400": "#ff3d00",
            "a700": "#dd2c00"
        },
        "brown": {
            "50": "#efebe9",
            "100": "#d7ccc8",
            "200": "#bcaaa4",
            "300": "#a1887f",
            "400": "#8d6e63",
            "500": "#795548",
            "600": "#6d4c41",
            "700": "#5d4037",
            "800": "#4e342e",
            "900": "#3e2723"
        },
        "grey": {
            "50": "#fafafa",
            "100": "#f5f5f5",
            "200": "#eeeeee",
            "300": "#e0e0e0",
            "400": "#bdbdbd",
            "500": "#9e9e9e",
            "600": "#757575",
            "700": "#616161",
            "800": "#424242",
            "900": "#212121"
        },
        "blueGrey": {
            "50": "#eceff1",
            "100": "#cfd8dc",
            "200": "#b0bec5",
            "300": "#90a4ae",
            "400": "#78909c",
            "500": "#607d8b",
            "600": "#546e7a",
            "700": "#455a64",
            "800": "#37474f",
            "900": "#263238"
        },
        "black": "#000000",
        "white": "#ffffff",
        "iowaGold": "#FFCD00"

    }
    red: FColorSwath;
    pink: FColorSwath;
    purple: FColorSwath;
    deepPurple: FColorSwath;
    indigo: FColorSwath;
    blue: FColorSwath;
    lightBlue: FColorSwath;
    cyan: FColorSwath;
    teal: FColorSwath;
    green: FColorSwath;
    lightGreen: FColorSwath;
    lime: FColorSwath;
    yellow: FColorSwath;
    amber: FColorSwath;
    orange: FColorSwath;
    deepOrange: FColorSwath;
    brown: FColorSwath;
    grey: FColorSwath;
    blueGrey: FColorSwath;
    black: FColor;
    white: FColor;
    iowaGold: FColor;
    darkMode: [FColor, FColor, FColor, FColor, FColor, FColor, FColor, FColor, FColor, FColor, FColor, FColor] = [null, null, null, null, null, null, null, null, null, null, null, null]
    lightText: [FColor, FColor] = [FColor.fromHex('#a8a8a8'), FColor.fromHex('#E0E0E0')]
    darkText: [FColor, FColor] = [FColor.fromHex('#373737'), FColor.fromHex('#898989')]
    cssElement: HTMLStyleElement = null;
    public static fColor: FColorDirectory = null;//singlton instance

    proceduralCss: string[] = []
    addCss(css: string, update: boolean = true) {
        this.proceduralCss.push(css);
        if (update) {
            this.updateProceduralCss()
        }
    }
    updateProceduralCss() {
        this.cssElement.innerHTML = this.proceduralCss.join('\n');
    }
    constructor() {
        //          0  1   2   3   4   5   6   7   8   9   10  11
        let dmcs = [0, 15, 20, 25, 30, 34, 38, 42, 47, 54, 60, 70];
        let getDarkModeColor = (i) => {
            let s = dmcs[i] //Math.floor(70 * Math.pow(i / 10.0, 2));
            var p = s.toString(16);
            if (p.length == 1) {
                p = `0${p}`;
            }
            let out = `#${p}${p}${p}`
            //console.log(`Built dark mode color ${s} for index ${i}: ${out} `)
            return FColor.fromHex(out);
        }
        let darkModeColorCount = 11;
        this.cssElement = document.createElement('style');

        for (let i = 0; i <= darkModeColorCount; i++) {
            this.darkMode[i] = getDarkModeColor(i);
            this.addCss(`.darkBackground${i} {background-color: ${getDarkModeColor(i).toHexString()}}`, false)
            this.addCss(`.hover-darkBackground${i}:hover {background-color: ${getDarkModeColor(i).toHexString()} !important}`, false)
        }
        //let tst = //new DOMParser().parseFromString(`${genCss}</style>`, 'text/html')
        this.updateProceduralCss()
        document.querySelector('head').append(this.cssElement);
        //$(`${genCss}</style>`).appendTo("head");

        let colorNames = Object.keys(FColorDirectory.materialColors);
        var colorLabels = [];
        var englishLabel = "";
        var currentColor;
        //console.log("Mapping colors");
        for (var i = 0; i < colorNames.length; i++) {
            //console.log("Mapping " + colorNames[i]);
            currentColor = FColorDirectory.materialColors[colorNames[i]];

            if (typeof currentColor == 'object') {
                colorLabels = Object.keys(currentColor);
                this[colorNames[i]] = new FColorSwath(FColorDirectory.materialColors[colorNames[i]]);
                for (var j = 0; j < colorLabels.length; j++) {
                    switch (colorLabels[j]) {
                        case "50":
                            englishLabel = "lighten-5";
                            break;
                        case "100":
                            englishLabel = "lighten-4";
                            break;
                        case "200":
                            englishLabel = "lighten-3";
                            break;
                        case "300":
                            englishLabel = "lighten-2";
                            break;
                        case "400":
                            englishLabel = "lighten-1";
                            break;
                        case "500":
                            englishLabel = "base";
                            break;
                        case "600":
                            englishLabel = "darken-1";
                            break;
                        case "700":
                            englishLabel = "darken-2";
                            break;
                        case "800":
                            englishLabel = "darken-3";
                            break;
                        case "900":
                            englishLabel = "darken-4";
                            break;
                        case "a100":
                            englishLabel = "accent-1";
                            break;
                        case "a200":
                            englishLabel = "accent-2";
                            break;
                        case "a400":
                            englishLabel = "accent-3";
                            break;
                        case "a700":
                            englishLabel = "accent-4";
                            break;
                        default:
                            englishLabel = colorLabels[j];
                    }
                    //console.log("[" + i + ", " + j + "] Mapping colors." + colorNames[j] + "." + englishLabel + " = " + currentColor[colorLabels[j]]);
                    this[colorNames[i]][englishLabel] = FColor.fromHex(currentColor[colorLabels[j]]);
                    this.addCss(`.${colorNames[i]}-${englishLabel} {background-color: ${currentColor[colorLabels[j]]}}`, false);
                    this.addCss(`.hover-${colorNames[i]}-${englishLabel}:hover {background-color: ${currentColor[colorLabels[j]]} !important}`, false);
                }
            } else {
                this[colorNames[i]] = FColor.fromHex(currentColor ?? "#ff00ff");
                this.addCss(`.${colorNames[i]}-${englishLabel} {background-color: ${currentColor ?? "#ff00ff"}}`, false);
                this.addCss(`.hover-${colorNames[i]}-${englishLabel}:hover {background-color: ${currentColor ?? "#ff00ff"} !important}`, false);
            }
        }
        this.updateProceduralCss();
    }
    createCssHoverClass(className: string, hoverBackground: FColor) {
        //this.addCss(`.${className} {background-color: ${hoverBackground.toHexString()} !important}`)
        this.addCss(`.${className}:hover {background-color: ${hoverBackground.toHexString()} !important}`)
    }
}