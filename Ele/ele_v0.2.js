/* 仿jQuery庫之Ele庫 */
/*
	版本：V0.2
	更新日期：2024.09.13
	使用說明：
		1、使用prototype方法編寫，此為終版，新版本將使用Class重寫
		2、Element執行速度快，Elements因為要遍歷，所以速度慢
		3、Elements是jQuery的仿寫
 */
/* on事件 */
/* 原有屬性包括獲取集合所需要的值和元素本身 */
var events = ["abort", "auxclick", "beforecopy", "beforecut", "beforepaste", "blur", "cancel", "canplay", "canplaythrough", "change", "click", "close", "contextmenu", "copy", "cuechange", "cut", "dblclick", "drag", "dragend", "dragenter", "dragleave", "dragover", "dragstart", "drop", "durationchange", "emptied", "ended", "error", "focus", "gotpointercapture", "input", "invalid", "keydown", "keypress", "keyup", "load", "loadeddata", "loadedmetadata", "loadstart", "lostpointercapture", "mousedown", "mouseenter", "mouseleave", "mousemove", "mouseout", "mouseover", "mouseup", "mousewheel", "paste", "pause", "play", "playing", "pointercancel", "pointerdown", "pointerenter", "pointerleave", "pointermove", "pointerout", "pointerover", "pointerup", "progress", "ratechange", "reset", "resize", "scroll", "search", "seeked", "seeking", "select", "selectstart", "stalled", "submit", "suspend", "timeupdate", "toggle", "volumechange", "waiting", "webkitfullscreenchange", "webkitfullscreenerror", "wheel"]
/* 獲取HTML類型 */
function isHTML(object) { return Object.prototype.toString.call(object).slice(8, 12) === "HTML" }

/* Element */
/* 獲取單一元素 */
function Element(ele) {
	if (typeof ele == "object") {
		if (isHTML(ele)) { this[0] = ele } else { return "数据类型错误" }
	} else {
		this[0] = document.querySelector(ele)
	}
	return this
}
/* 實例化對象 */
var ele = function (ele) { return new Element(ele) }

/* on事件封裝 */
events.forEach(function (i, index) {
	Element.prototype[i] = function (f) { this[0].addEventListener(i, f); return this }
})

/* Element讀取函數 */
function eleRead(ele, func, param) {
	return param ? func(ele, param) : func(ele)
}

/* Element讀寫函數 */
function eleRW(ele, func, param) {
	if (param) {
		func(ele, param)
		return new Element(ele)
	} else {
		return func(ele)
	}
}

/* Element寫入函數 */
function eleWrite(ele, func, param) {
	if (param) func(ele, param)
	else func(ele)
	return new Element(ele)
}

/* Element原型讀取 */
function EleRead(func) {
	Element.prototype[func.name] = function (param) { return eleRead(this[0], func, param) }
}

/* Element原型寫入 */
function EleWrite(func) {
	Element.prototype[func.name] = function (param) { return eleWrite(this[0], func, param) }
}

/* Element原型讀寫 */
function EleRW(func) {
	Element.prototype[func.name] = function (param) { return eleRW(this[0], func, param) }
}

/* Element批量原型寫入 */
function BatchEleWrite(funs) {
	funs.forEach(func => { EleWrite(func) })
}

/* Element批量原型讀取 */
function BatchEleRead(funs) {
	funs.forEach(func => { EleRead(func) })
}

/* Element批量原型讀寫 */
function BatchEleRW(funs) {
	funs.forEach(func => { EleRW(func) })
}

/* Length */
Element.prototype.__defineGetter__('length', function () {
	var count = 0
	for (name in this) { if (this.hasOwnProperty(name)) { count++ } }
	return count
})

/* Elements */
/* 獲取元素集合 */
function Elements(ele) {
	var els = {}
	if (typeof ele == "object") {
		if (isHTML(ele)) { this[0] = ele } else { return "数据类型错误" }
	} else if (typeof ele == "string") {
		els = document.querySelectorAll(ele)
		for (var i = 0; i < els.length; i++) { this[i] = els[i] }
	}
	return this
}

/* 對外擴展 */
/* 使用如：ele("#c").extend("vfp",function(){代碼}) */
Elements.prototype.extend = function (name, functionName) { Elements.prototype[name] = functionName }

/* 實例化對象 */
var els = function (els) { return new Elements(els) }

/* on事件封裝 */
events.forEach(function (i, index) {
	Elements.prototype[i] = function (f) { for (var j = 0; j < this.length; j++) { this[j].addEventListener(i, f) }; return this }
})

/* 原有屬性包括獲取集合所需要的值和元素本身 */

/* Elements讀取函數 */
function elsRead(els, func, param) {
	var arr = []
	for (var i = 0; i < els.length; i++) {
		if (param) {
			if (els.length == 1) {
				return func(els[0], param)
			}
			arr.push(func(els[i], param))
		} else {
			if (els.length == 1) {
				return func(els[0])
			}
			arr.push(func(els[i]))
		}
	}
	return arr
}

/* Elements寫入函數 */
function elsWrite(els, func, param) {
	var length = els.length
	for (var i = 0; i < length; i++) {
		if (param) {
			if (length > els.length) { func(els[0], param) }
			else { func(els[i], param) }
		} else {
			if (length > els.length) { func(els[0]) }
			else { func(els[i]) }
		}
	}
	return new Elements(els)
}

/* Elements讀寫函數 */
function elsRW(els, func, param, check) {
	var arr = []
	var length = els.length
	for (var i = 0; i < length; i++) {
		if (param) {
			if (length > els.length) { func(els[0], param) }
			else { func(els[i], param) }
		} else {
			if (els.length == 1) {
				return func(els[0])
			}
			arr.push(func(els[i]))
		}
	}
	if (param) { return new Elements(els) } else { return arr }
}

/* Elements原型讀取 */
function ElsRead(func) {
	Elements.prototype[func.name] = function (param) { return elsRead(this, func, param) }
}

/* Elements原型寫入 */
function ElsWrite(func) {
	Elements.prototype[func.name] = function (param) { return elsWrite(this, func, param) }
}

/* Elements原型讀寫 */
function ElsRW(func) {
	Elements.prototype[func.name] = function (param) { return elsRW(this, func, param) }
}

/* Elements批量原型寫入 */
function BatchElsWrite(funs) {
	funs.forEach(func => { ElsWrite(func) })
}

/* Elements批量原型讀取 */
function BatchElsRead(funs) {
	funs.forEach(func => { ElsRead(func) })
}

/* Elements批量原型讀寫 */
function BatchElsRW(funs) {
	funs.forEach(func => { ElsRW(func) })
}

/* Length */
Elements.prototype.__defineGetter__('length', function () {
	var count = 0
	for (name in this) { if (this.hasOwnProperty(name)) { count++ } }
	return count
})

/* 下面批量註冊的函數為個人所寫，不在此文檔中 */

BatchEleRead([index, hasClass, getClass, getStyle, offspringCollection, offspring])
BatchEleWrite([onActive, removeClass, addClass, setClass, css])
BatchEleRW([html, text])

BatchElsRead([index, hasClass, getClass, getStyle, offspringCollection, offspring])
BatchElsWrite([onActive, removeClass, addClass, setClass, css])
BatchElsRW([html, text])