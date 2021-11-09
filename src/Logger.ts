export enum LogLevel {
    error,
    warn,
    info,
    verbose,
    debug,
    silly,
    naughty
}
export function LogLevelMap(numToText = true) {
    let vals = [];
    var i = 0;
    for (let a in LogLevel) {
        vals.push(a)
    }
    let out = {}
    var a, b;
    for (let i = 0; i < vals.length / 2; i++) {
        a = vals[i]
        b = vals[i + vals.length / 2]
        if (numToText) {
            out[a] = b;
        } else {
            out[b] = a;
        }
    }
    return out;
}

// export class LogEntry {
//     level: LogLevel = null
//     message: string = null
//     obj?: any = null
//     constructor(level: LogLevel, message: string, obj: any = null){
//         this.level = level;
//         this.message = message;
//         this.obj = obj;
//     }
// }
export enum LoggerFilterResult {
    differ, allow, deny
}
export class LoggerColor {
    static yellow: [string, string] = ['\u001b[1;33m', '#e5e510']
    static green: [string, string] = ['\u001b[1;32m', '#0dbc79']
    static red: [string, string] = ['\u001b[1;31m', '#cd3131']
    static blue: [string, string] = ['\u001b[1;34m', '#2472c8']
    static magenta: [string, string] = ['\u001b[1;35m', '#bc3fbc']
    static white: [string, string] = ['\u001b[1;37m', '#e5e5e5']
    static grey: [string, string] = ['\u001b[1;90m', '#666666']
}

export class Logger {
    setCustomPrinter(printer: (subject: string, level: LogLevel, message: string, color: [string, string], obj?: any) => void) {
        this._customPrinter = printer;
    }
    _customPrinter: (subject: string, level: LogLevel, message: string, color: [string, string], obj?: any) => void = null;
    //return false to remove
    filters: Array<(subject: string, level: LogLevel) => LoggerFilterResult> = []
    constructor() {

    }
    filterLevel(lvl: LogLevel) {
        this.filters.push((subject: string, level: LogLevel) => {
            return level > lvl ? LoggerFilterResult.deny : LoggerFilterResult.differ;
        })
    }

    allowBelowLvl(sub: string, lvl: LogLevel) {
        this.filters.push((subject: string, level: LogLevel) => {
            return (subject == sub && level <= lvl) ? LoggerFilterResult.allow : LoggerFilterResult.differ;
        })
    }
    // onlySubject(sub: string) {
    //     this.filters.push((subject: string, level: LogLevel) => {
    //         return subject == sub;
    //     })
    // }
    // silenceSubject(sub: string) {
    //     this.filters.push((subject: string, level: LogLevel) => {
    //         return subject != sub;
    //     })
    // }

    info(subject: string, message: string, obj?: any) {
        this.log(subject, LogLevel.info, message, LoggerColor.yellow, obj);
    }
    error(subject: string, message: string, obj?: any) {
        this.log(subject, LogLevel.error, message, LoggerColor.red, obj);
    }
    debug(subject: string, message: string, obj?: any) {
        this.log(subject, LogLevel.debug, message, LoggerColor.white, obj);
    }
    silly(subject: string, message: string, obj?: any) {
        this.log(subject, LogLevel.silly, message, LoggerColor.white, obj);
    }
    verbose(subject: string, message: string, obj?: any) {
        this.log(subject, LogLevel.verbose, message, LoggerColor.white, obj);
    }
    warn(subject: string, message: string, obj?: any) {
        this.log(subject, LogLevel.warn, message, LoggerColor.magenta, obj);
    }
    ret(subject: string, message: string, obj?: any) {
        this.log(subject, LogLevel.naughty, message, LoggerColor.grey, obj);
    }
    logListener: (text: string) => void = null;
    private printColored(text: string, color: [string, string], obj: any = null) {
        let isNode = (typeof window == 'undefined')
        let colorCode = color[isNode ? 0 : 1];
        let hasObj = obj != null && obj != undefined;
        if (this.logListener != null) {
            this.logListener(text);
        }
        if (isNode) {
            text = colorCode + text;
            if (hasObj) {
                console.log(text, obj);
            } else {
                console.log(text);
            }
        } else {
            text = `%c${text}`
            let css = `color: ${colorCode}`;
            if (hasObj) {
                console.log(text, css, obj);
            } else {
                console.log(text, css);
            }
        }

    }
    log(subject: string, level: LogLevel, message: string, color: [string, string], obj: any = null) {
        var res: LoggerFilterResult
        let accept = () => {
            this.printColored(`[${Logger.levelToString(level)}-${subject}] ${message}`, color, obj);
        }
        if (this._customPrinter != null) {
            this._customPrinter(subject, level, message, color, obj);
        }
        for (let filter of this.filters) {
            res = filter(subject, level)
            switch (res) {
                case LoggerFilterResult.allow:
                    accept();
                    return;
                case LoggerFilterResult.deny:
                    return;
            }
        }

    }
    local(subject: string) {
        return new LocalLogger(this, subject);
    }
    static levelToString(lvl: LogLevel) {
        switch (lvl) {
            case LogLevel.debug:
                return 'DEBUG'
            case LogLevel.error:
                return 'ERROR'
            case LogLevel.info:
                return 'INFO'
            case LogLevel.silly:
                return 'SILLY'
            case LogLevel.verbose:
                return 'VERBOSE'
            case LogLevel.warn:
                return 'WARN'
            case LogLevel.naughty:
                return "RET"
        }
    }
}

export class LocalLogger {
    allowBelowLvl(lvl: LogLevel) {
        this.parent.allowBelowLvl(this.subject, lvl);
        return this;
    }



    parent: Logger
    subject: string
    constructor(parent: Logger, subject: string) {
        this.parent = parent;
        this.subject = subject;
    }

    info(message: string, obj?: any) {
        this.parent.info(this.subject, `${message}`, obj);
    }
    error(message: string, obj?: any) {
        this.parent.error(this.subject, message, obj);
    }
    debug(message: string, obj?: any) {
        this.parent.debug(this.subject, message, obj);
    }
    silly(message: string, obj?: any) {
        this.parent.silly(this.subject, message, obj);
    }
    verbose(message: string, obj?: any) {
        this.parent.verbose(this.subject, message, obj);
    }
    warn(message: string, obj?: any) {
        this.parent.warn(this.subject, message, obj);
    }
    naughty(message: string, obj?: any) {
        this.parent.ret(this.subject, message, obj);
    }
    logOnLvl(level: LogLevel, message: string, obj?: any) {
        switch (level) {
            case LogLevel.debug:
                this.debug(message, obj);
                break;
            case LogLevel.error:
                this.error(message, obj);
                break;
            case LogLevel.info:
                this.info(message, obj);
                break;
            case LogLevel.naughty:
                this.naughty(message, obj);
                break;
            case LogLevel.silly:
                this.silly(message, obj);
                break;
            case LogLevel.verbose:
                this.verbose(message, obj);
                break;
            case LogLevel.warn:
                this.warn(message, obj);
                break;
            default:
                this.info(message, obj);
                break;
        }
    }
    log(level: LogLevel, message: string, color: [string, string], obj: any = null) {
        this.parent.log(this.subject, level, message, color, obj)
    }
    timer(title: string, level: LogLevel = LogLevel.debug) {
        return new LoggedTimer(this.parent, this.subject, level, title, LoggerColor.blue);
    }
    multiTimer(title: string, level: LogLevel = LogLevel.debug, color: [string, string] = LoggerColor.blue) {
        return new MultiLoggedTimer(this.parent, this.subject, level, title, color);
    }

}

export class LoggedTimer {
    logger: Logger
    name: string
    lvl: LogLevel
    subject: string
    startTime: number
    color: [string, string]
    constructor(logger: Logger, subject: string, lvl: LogLevel, name: string, color: [string, string]) {
        this.startTime = Date.now();
        this.logger = logger;
        this.subject = subject;
        this.lvl = lvl;
        this.name = name;
        this.color = color;
        this.logger.log(this.subject, this.lvl, `Starting ${this.name}`, this.color);
    }
    end() {
        let endTime = Date.now();
        let delta = endTime - this.startTime;
        var str;
        if (delta < 1000) {
            str = `${delta}ms`
        } else if (delta < 1000 * 60) {
            str = `${delta / 1000}s`
        } else {
            str = `${delta / 60000} mins`
        }
        this.logger.log(this.subject, this.lvl, `${this.name} took ${str}`, this.color);
    }
}
export class MultiLoggedTimer {
    logger: Logger
    name: string
    lvl: LogLevel
    subject: string
    startTime: number
    entries: [string, number][] = [];
    color: [string, string]
    constructor(logger: Logger, subject: string, lvl: LogLevel, name: string, color: [string, string]) {
        this.startTime = Date.now();
        this.logger = logger;
        this.subject = subject;
        this.lvl = lvl;
        this.name = name;
        this.color = color;
        // this.logger.log(this.subject, this.lvl, `Starting ${this.name}`, this.color);
    }
    mark(label: string) {
        this.entries.push([label, Date.now()]);
    }
    end() {
        var lastTime: number = this.startTime;
        var delta;
        var str;
        this.logger.log(this.subject, this.lvl, `---------${this.name}---------`, this.color);
        for (let i = 0; i < this.entries.length; i++) {
            if (this.entries[i][0]) {
                delta = this.entries[i][1] - lastTime;
                if (delta < 1000) {
                    str = `${delta}ms`
                } else if (delta < 1000 * 60) {
                    str = `${delta / 1000}s`
                } else {
                    str = `${delta / 60000} mins`
                }
                this.logger.log(this.subject, this.lvl, `--${this.entries[i][0]} took ${str}`, this.color);
            }
            lastTime = this.entries[i][1];
        }
        this.logger.log(this.subject, this.lvl, '-----------------------', this.color);
    }
}
export function LogFunction(localLogger: LocalLogger) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        let og = descriptor.value;
        descriptor.value = (...args: any[]) => {
            localLogger.silly(`Calling ${propertyKey}`)
            og.apply(target, args);
        }
    };
}
function logFunc() {

}
