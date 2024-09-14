/* 仿jQuery庫之Ele庫 */
/* ES2015類 */
/*
	版本：V0.1
	更新日期：2020.04.20
	使用說明：
		1、使用prototype方法編寫
		2、Element執行速度快，Elements因為要遍歷，所以速度慢
		3、Elements是jQuery的仿寫
 */

/* prototype方法 */
/* Element執行速度快，Elements因為要遍歷，所以速度慢 */
/* 獲取單一元素 */
function Element(ele) {
	if (typeof ele == "object") {
		if (isHTML(ele)) { this[0] = ele } else { return "数据类型错误" }
	} else {
		this[0] = document.querySelector(ele)
	}
	return this
}

/* 獲取元素集合 */
function Elements(ele) {
	var els = {}
	if (typeof ele == "object") {
		if (isHTML(ele)) { this[0] = ele } else { return "数据类型错误" }
	} else if (typeof ele == "string") {
		if (ele.search(' ') > 0) {
			var eles = ele.split(' ')
			var newEles = eles.filter(function (s) {
				return s && s.trim()
			})
			var elses = [document]
			newEles.forEach(function (e) {
				var tmpEls = []
				if (elses.length) {
					elses.forEach(function (ce) {
						var ces = ce.querySelectorAll(e)
						for (var i = 0; i < ces.length; i++) { tmpEls.push(ces[i]) }
					})
					elses = tmpEls
				}
			})
			els = Array.from(new Set(elses))
		} else {
			els = document.querySelectorAll(ele)
		}
		for (var i = 0; i < els.length; i++) { this[i] = els[i] }
	}
	return this
}

/* 獲取HTML類型 */
function isHTML(object) { return Object.prototype.toString.call(object).slice(8, 12) === "HTML" }

/* 對外擴展 */
/* 使用如：ele("#c").extend("vfp",function(){代碼}) */
Element.prototype.extend = function (name, functionName) { Element.prototype[name] = functionName }
Elements.prototype.extend = function (name, functionName) { Elements.prototype[name] = functionName }

/* 實例化對象 */
var ele = function (ele) { return new Element(ele) }
var els = function (els) { return new Elements(els) }

/* on事件封裝 */
var events = ["abort", "auxclick", "beforecopy", "beforecut", "beforepaste", "blur", "cancel", "canplay", "canplaythrough", "change", "click", "close", "contextmenu", "copy", "cuechange", "cut", "dblclick", "drag", "dragend", "dragenter", "dragleave", "dragover", "dragstart", "drop", "durationchange", "emptied", "ended", "error", "focus", "gotpointercapture", "input", "invalid", "keydown", "keypress", "keyup", "load", "loadeddata", "loadedmetadata", "loadstart", "lostpointercapture", "mousedown", "mouseenter", "mouseleave", "mousemove", "mouseout", "mouseover", "mouseup", "mousewheel", "paste", "pause", "play", "playing", "pointercancel", "pointerdown", "pointerenter", "pointerleave", "pointermove", "pointerout", "pointerover", "pointerup", "progress", "ratechange", "reset", "resize", "scroll", "search", "seeked", "seeking", "select", "selectstart", "stalled", "submit", "suspend", "timeupdate", "toggle", "volumechange", "waiting", "webkitfullscreenchange", "webkitfullscreenerror", "wheel"]
events.forEach(function (i, index) {
	Element.prototype[i] = function (f) { this[0].addEventListener(i, f); return this }
	Elements.prototype[i] = function (f) { for (var j = 0; j < this.length; j++) { this[j].addEventListener(i, f) }; return this }
})

/* 原有屬性包括獲取集合所需要的值和元素本身 */

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

/* Element讀寫函數 */
function eleRW(ele, func, param) {
	if (param) {
		func(ele, param)
		return new Element(ele)
	} else {
		return func(ele)
	}
}

/* Element讀取函數 */
function eleRead(ele, func, param) {
	if (param) {
		return func(ele, param)
	} else {
		return func(ele)
	}
}

/* Element寫入函數 */
function eleWrite(ele, func, param) {
	if (param) {
		func(ele, param)
	} else {
		func(ele)
	}
	return new Element(ele)
}

/* Length */
Element.prototype.__defineGetter__('length', function () {
	var count = 0
	for (name in this) { if (this.hasOwnProperty(name)) { count++ } }
	return count
})
Elements.prototype.__defineGetter__('length', function () {
	var count = 0
	for (name in this) { if (this.hasOwnProperty(name)) { count++ } }
	return count
})

/* 動態顯示時間 */
Element.prototype.activeClock = function () { return eleWrite(this[0], activeClock) }
Elements.prototype.activeClock = function () { return elsWrite(this, activeClock) }

/* 獲取在父元素中的順序 */
Element.prototype.index = function () { return eleRead(this[0], index) }
Elements.prototype.index = function () { return elsRead(this, index) }

/************************* 元素操作 *************************/

/* 刪除元素 */
Element.prototype.remove = function () { return eleWrite(this[0], remove) }
Elements.prototype.remove = function () { return elsWrite(this, remove) }

/* 獲取某元素內子節點集合 */
Element.prototype.offspringCollection = function () { return eleRead(this[0], offspringCollection) }
Elements.prototype.offspringCollection = function () { return elsRead(this, offspringCollection) }

/* 獲取指定元素的所有域內元素 */
Element.prototype.offspring = function () { return eleRead(this[0], offspring) }
Elements.prototype.offspring = function () { return elsRead(this, offspring) }

/************************* class操作 *************************/

/* 給某個元素添加屬性 */
Element.prototype.onActive = function (className) { return eleWrite(this[0], onActive, className) }
Elements.prototype.onActive = function (className) { return elsWrite(this, onActive, className) }

/* 判斷指定元素是否存在class */
Element.prototype.hasClass = function (className) { return eleRead(this[0], hasClass, className) }
Elements.prototype.hasClass = function (className) { return elsRead(this, hasClass, className) }

/* 獲取/設置class */
Element.prototype.getClass = function (className) { return eleRW(this[0], getClass, className) }
Elements.prototype.getClass = function (className) { return elsRW(this, getClass, className) }

/* 移除class */
Element.prototype.removeClass = function (className) { return eleWrite(this[0], removeClass, className) }
Elements.prototype.removeClass = function (className) { return elsWrite(this, removeClass, className) }

/* 添加class */
Element.prototype.addClass = function (className) { return eleWrite(this[0], addClass, className) }
Elements.prototype.addClass = function (className) { return elsWrite(this, addClass, className) }

/* 設置style */
Element.prototype.css = function (styleName, styleValue) { return eleWrite(this[0], addClass, { name: styleName, value: styleValue }) }
Elements.prototype.css = function (styleName, styleValue) { return elsWrite(this, addClass, { name: styleName, value: styleValue }) }

/************************* 內容操作 *************************/

/* 設置/讀取元素的innerHtml */
Element.prototype.html = function (text) { return eleRW(this[0], html, text) }
Elements.prototype.html = function (text) { return elsRW(this, html, text) }

/* 設置/讀取元素的innerText */
Element.prototype.text = function (value) { return eleRW(this[0], text, value) }
Elements.prototype.text = function (value) { return elsRW(this, text, value) }