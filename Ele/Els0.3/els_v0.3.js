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

/* Elements */
/* 獲取元素集合 */
function Elements(ele) {
	var els = {}
	if (typeof ele == "object") {
		if (isHTML(ele)) { this[0] = ele, this.length = 0 } else { return "数据类型错误" }
	} else if (typeof ele == "string") {
		els = document.querySelectorAll(ele)
		this.length = els.length
		for (var i = 0; i < els.length; i++) { this[i] = els[i] }
	}
	return this
}

/* 對外擴展 */
/* 使用如：ele("#c").extend("vfp",function(){代碼}) */
Elements.prototype.extend = function (name, functionName) { Elements.prototype[name] = functionName }

Elements.prototype.batch = elsBatch

/* 實例化對象 */
var els = function (els) { return new Elements(els) }

/* on事件封裝 */
events.forEach(function (i, index) {
	Elements.prototype[i] = function (f) { for (var j = 0; j < this.length; j++) { this[j].addEventListener(i, f) }; return this }
})

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
function elsReadWrite(els, func, param, check) {
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

function elsBatch(type, funs) {
	let t = type.toLowerCase()
	funs.forEach(func => {
		this[func.name] = function (param) {
			switch (t) {
				case 'read':
					return elsRead(this, func, param)
					break
				case 'write':
					return elsWrite(this, func, param)
					break
				case 'readwrite':
					return elsReadWrite(this, func, param)
					break
			}

		}
	})
}

/* 下面批量註冊的函數為個人所寫，不在此文檔中 */

elsBatch('read', [index, hasClass, getClass, getStyle, offspringCollection, offspring])
elsBatch('write', [onActive, removeClass, addClass, setClass, css])
elsBatch('readwrite', [html, text])