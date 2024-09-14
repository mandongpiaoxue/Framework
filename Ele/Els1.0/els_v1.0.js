/* 仿jQuery庫之Ele庫 */
/*
    版本：V1.0
    更新日期：2024.09.13
    使用說明：
        1、使用prototype方法編寫，此為終版，新版本將使用Class重寫
        3、Elements是jQuery的仿寫
 */
/* on事件 */
/* 原有屬性包括獲取集合所需要的值和元素本身 */
let events = ["abort", "auxclick", "beforecopy", "beforecut", "beforepaste", "blur", "cancel", "canplay", "canplaythrough", "change", "click", "close", "contextmenu", "copy", "cuechange", "cut", "dblclick", "drag", "dragend", "dragenter", "dragleave", "dragover", "dragstart", "drop", "durationchange", "emptied", "ended", "error", "focus", "gotpointercapture", "input", "invalid", "keydown", "keypress", "keyup", "load", "loadeddata", "loadedmetadata", "loadstart", "lostpointercapture", "mousedown", "mouseenter", "mouseleave", "mousemove", "mouseout", "mouseover", "mouseup", "mousewheel", "paste", "pause", "play", "playing", "pointercancel", "pointerdown", "pointerenter", "pointerleave", "pointermove", "pointerout", "pointerover", "pointerup", "progress", "ratechange", "reset", "resize", "scroll", "search", "seeked", "seeking", "select", "selectstart", "stalled", "submit", "suspend", "timeupdate", "toggle", "volumechange", "waiting", "webkitfullscreenchange", "webkitfullscreenerror", "wheel"]

/* 獲取HTML類型 */
function isHTML(object) { return Object.prototype.toString.call(object).slice(8, 12) === "HTML" }

class Elements {
    constructor(ele) {
        this.initElement(ele)
    }

    initElement(ele) {
        let els = {}
        if (typeof ele == "object") {
            if (isHTML(ele)) { this[0] = ele; this.length = 1 } else { return "数据类型错误" }
        } else if (typeof ele == "string") {
            els = document.querySelectorAll(ele)
            this.length = els.length
            for (var i = 0; i < els.length; i++) {
                this[i] = els[i]
            }
        }
        return this
    }

    /* 在class下用於擴展其他函數的函數 */
    extend(funs) {
        if (funs instanceof Array) {
            funs.forEach(func => {
                this[func.name] = func
            })
        } else {
            this[funs.name] = funs
        }
    }

    /* 在元素下掛載讀取函數的函數 */
    Read(func, param) {
        var arr = []
        for (var i = 0; i < this.length; i++) {
            if (param) {
                if (this.length == 1) {
                    return func(this[0], param)
                }
                arr.push(func(this[i], param))
            } else {
                if (this.length == 1) {
                    return func(this[0])
                }
                arr.push(func(this[i]))
            }
        }
        return arr
    }

    /* 在元素下掛載寫入函數的函數 */
    Write(func, param) {
        var length = this.length
        for (var i = 0; i < length; i++) {
            if (param) {
                if (length > this.length) { func(this[0], param) }
                else { func(this[i], param) }
            } else {
                if (length > this.length) { func(this[0]) }
                else { func(this[i]) }
            }
        }
        return this
    }

    /* 在元素下掛載讀寫函數的函數 */
    ReadWrite(func, param, check) {
        var arr = []
        var length = this.length
        for (var i = 0; i < length; i++) {
            if (param) {
                if (length > this.length) { func(this[0], param) }
                else { func(this[i], param) }
            } else {
                if (this.length == 1) {
                    return func(this[0])
                }
                arr.push(func(this[i]))
            }
        }
        if (param) { return this } else { return arr }
    }

    /* 在元素中批量註入函數 */
    Batch(type, funs) {
        let t = type.toLowerCase()
        funs.forEach(func => {
            this[func.name] = function (param) {
                switch (t) {
                    case 'read':
                        return this.Read(func, param)
                        break
                    case 'write':
                        return this.Write(func, param)
                        break
                    case 'readwrite':
                        return this.ReadWrite(func, param)
                        break
                }
            }
        })
    }
}

Elements.extend = Elements.prototype.extend

/* on事件封裝 */
events.forEach(i => {
    Elements.prototype[i] = function (f) { for (var j = 0; j < this.length; j++) { this[j].addEventListener(i, f) }; return this }
})

/* 實例化對象 */
var els = function (ele) { if (ele) { return new Elements(ele) } else { return Elements } }

/* 為Els添加函數、屬性 */
for (let i in Elements) { els[i] = Elements[i] }

/* 下面批量註冊的函數為個人所寫，不在此文檔中 */
Elements.prototype.Batch('read', [index, hasClass, getClass, getStyle, offspringCollection, offspring])
Elements.prototype.Batch('write', [onActive, removeClass, addClass, setClass, css])
Elements.prototype.Batch('readwrite', [html, text])