class Vue {
    constructor(code) {
        this.code = code
        this.init()
    }
    init() {
        if (this.code.data) this.data()
        if (this.code.methods) this.methods()
        if (this.code.created) this.created()
        this.code.$refs = {}
    }
    data() {
        let data = this.code.data()
        for (let d in data) {
            this.code[d] = data[d]
        }
        delete this.code.data
    }
    methods() {
        let methods = this.code.methods()
        for (let m in methods) {
            this.code[m] = methods[m]
        }
        delete this.code.methods
    }
    created() {
        this.code.created()
    }
    mounted() {
        window.onload = () => {
            this.code.mounted()
            delete this.code.mounted
        }
    }
    computed() {
        this.code.computed()
    }
    beforeMount(app) {
        console.log(app);
        new Promise((resolve, rejec) => {
            // this.handleFor(app)
            this.handleIf(app).then(
                app => this.handleHtml(app).then(
                    app => this.handleText(app).then(
                        app => this.handleRefs(app)
                    )
                )
            ).catch(error => {
                throw new Error(error)
            })







        })
    }
    mount(app) {
        document.addEventListener('readystatechange', () => {
            if (document.readyState == 'interactive') {// 文檔加載完成
                let App = document.querySelector(app)
                this.beforeMount(App)
            }
        })
        if (this.code.mounted) this.mounted()
        return this.code
    }
    handleFor(app) {
        let fors = app.querySelectorAll('*[m-for]')
        // for (let i = 0; i < fors.length; i++) {
        //     let forValue = fors[i].getAttribute('m-for')
        //     var fvs = forValue.split['in']
        //     fv = this.code[fvs[1].trim()]
        //     let fvp = fvs[0].trim()
        //     if (fvp.search(',') > -1) {
        //         fvi = fvp.split[','][0]
        //         fvv = fvp.split[','][1]
        //     } else {
        //         fvi = fvp
        //     }
        //     if (fv instanceof Array) {
        //         fv.forEach((v, i) => {
        //             fvi = v
        //         })
        //     }
        // }
    }

    handleIf(app) {
        return new Promise((resolve, reject) => {
            let ifs = app.querySelectorAll('*[m-if]')
            for (let i = 0; i < ifs.length; i++) {
                let ifValue = ifs[i].getAttribute('m-if')
                let ifvs = this.splitString(ifValue)
                let Param1, Param2
                let operator = ifvs[2]
                if (this.code[ifvs[0]] === undefined) {
                    Param1 = ifvs[0].trim() === '' ? ifvs[0].trim() : eval(ifvs[0].trim())
                } else {
                    Param1 = this.code[ifvs[0].trim()]
                }
                if (this.code[ifvs[1]] === undefined) {
                    Param2 = ifvs[1].trim() === '' ? ifvs[1].trim() : eval(ifvs[1].trim())
                } else {
                    Param2 = this.code[ifvs[1].trim()]
                }
                let result = eval(Param1 + operator + Param2)
                if (!result) ifs[0].remove()
                ifs[i].removeAttribute('m-if')
            }
            resolve(app)
        })
    }
    handleHtml(app) {
        return new Promise(resolve => {
            let htmls = app.querySelectorAll('*[m-html]')
            for (let i = 0; i < htmls.length; i++) {
                let htmlValue = htmls[i].getAttribute('m-html')
                htmls[i].innerHTML = this.code[htmlValue]
                htmls[i].removeAttribute('m-html')
            }
            resolve(app)
        })
    }
    handleText(app) {
        return new Promise(resolve => {
            let texts = app.querySelectorAll('*[m-text]')
            for (let i = 0; i < texts.length; i++) {
                let textValue = texts[i].getAttribute('m-text')
                texts[i].innerText = this.code[textValue]
                texts[i].removeAttribute('m-text')
            }
            resolve(app)
        })
    }
    handleBrace(app) {
        return new Promise(resolve => {
            let iText = app.innerText
            let pt = /{{[^{}]}}/ig;
            let res = iText.match(pt)
            res.forEach(item => {
                let st = item.replace('{{').replace('}}').trim()

                if (this.code[ifvs[0]] === undefined) {
                    Param1 = ifvs[0].trim() === '' ? ifvs[0].trim() : eval(ifvs[0].trim())
                } else {
                    Param1 = this.code[ifvs[0].trim()]
                }
                if (this.code[ifvs[1]] === undefined) {
                    Param2 = ifvs[1].trim() === '' ? ifvs[1].trim() : eval(ifvs[1].trim())
                } else {
                    Param2 = this.code[ifvs[1].trim()]
                }
            })


            resolve(app)
        })
    }
    handleRefs(app) {
        return new Promise(resolve => {
            let refs = app.querySelectorAll('*[ref]')
            for (let i = 0; i < refs.length; i++) {
                let refsValue = refs[i].getAttribute('ref')
                this.code.$refs[refsValue] = refs[i]
                refs[i].removeAttribute('ref')
            }
            resolve(app)
        })
    }

    /* 分割值用於比較 */
    splitString(string) {
        var operator = ['===', '==', '!==', '!=', '>=', '<=', '>', '<', '!', ' and ', ' or ', '&&', '\\|\\|'];
        operator = operator.join('|')
        var regExp = new RegExp('(' + operator + ')', 'ig')
        regExp.exec(string)
        console.log(RegExp.$1);
        var compareArray = [];
        if (RegExp.$1) {
            compareArray = string.split(RegExp.$1);
            compareArray.push(RegExp.$1)
        } else {
            compareArray = [string, "", ""]
        }
        return compareArray
    }

    strEval(string, obj1, obj2) {
        if (!string) return '';
        if (Number(string) == string) return Number(string);
        var operator = ['\\+', '-', '\\*', '\/', '%'];/* 設置操作符 */
        operator = operator.join('|');/* 整合操作符 */
        var self = string || join(this, '');/* 整合字符串 */
        var regExp = new RegExp('(' + operator + ')', 'ig');/* 定義搜索正則表達式 */
        var regArray = self.match(regExp);/* 搜索表達式并返回數組 */
        var splitArray = self.split(regExp);/* 用表達式分割字符串 */
        var evalArray = splitArray;
        evalArray = arrOE(evalArray);/* 奇偶分割字符串 */
        var strArray = evalArray[0];/* 需要轉義的字符串 */
        var operatorArray = evalArray[1];/* 操作符數組 */
        strArray.forEach(function (item, index) {
            if ((typeof item == 'string') && (Number(item) != item) && (item.search(/^\'[\S\s]+\'$/) < 0)) {
                var pattern = /(\()|(\))/g;/* 對括號進行處理 */
                var text = trim(item);
                if (text.search(/^\([\S\s]+\)$/) > -1) { text = trim(text.replace(/\(/g, '').replace(/\)/g, '')) }/* 去除元素兩邊加括號的情況 */
                text.match(pattern)/* 檢索text中是否有括號 */
                var lre = RegExp.$1;
                var rre = RegExp.$2;
                text = trim(text.replace(/\(/g, '').replace(/\)/g, ''));/* 去除括號 */
                var val = '';
                /* 處理函數 */
                function innerEval(val, lre, rre, textArray) {
                    var variable = '';
                    if (textArray) {
                        for (var i = 1; i < textArray.length; i++) {
                            val = val[textArray[i]];
                        }
                    }
                    if (val instanceof Object) { val = JSON.stringify(val) };/* 將Object轉化為JSON防止無法讀取 */
                    if ((typeof val == 'string') && (Number(val) != val) && (val.search(/^\'[\S\s]+\'$/) < 0)) {
                        variable = lre + "'" + val + "'" + rre;/* 對結果為字符串的加上引號和括號 */
                    } else {
                        variable = lre + val + rre;
                    }
                    return variable;
                }
                /* 處理各類數據 */
                if (text.search(/\./) >= 0) {/* 處理帶. */
                    var textArray = text.split('.');/* 用.分割數值 */
                    var ta = textArray[0];/* 第一個數據代表查詢對象 */
                    if (obj1[ta] !== undefined) {
                        val = obj1[ta];
                        strArray[index] = innerEval(val, lre, rre, textArray);/* 獲取解析后的值 */
                    } else if (obj2[ta] !== undefined) {
                        val = obj2[ta];
                        strArray[index] = innerEval(val, lre, rre, textArray);
                    }
                } else if (text.search(/\[/) >= 0) {/* 處理帶[] */
                    var textArray = text.split('[');
                    for (var i = 1; i < textArray.length; i++) {
                        if (textArray[i].search(/\]$/) >= 0) {/* 在尾部查找到] */
                            textArray[i] = trim(textArray[i].replace(/\]$/, ''));
                        } else {
                            throw new Error('請檢查你的m-text語句')
                        }
                    }
                    var ta = trim(textArray[0]);
                    if (obj1[ta] !== undefined) {
                        val = obj1[ta];
                        strArray[index] = innerEval(val, lre, rre, textArray);
                    } else if (obj2[ta] !== undefined) {
                        val = obj2[ta];
                        strArray[index] = innerEval(val, lre, rre, textArray);
                    }
                } else {/* 處理正常 */
                    if (obj1[text] !== undefined) {/* 防止0/false/Null帶來的錯誤 */
                        val = obj1[text];
                        strArray[index] = innerEval(val, lre, rre);
                    } else if (obj2[text] !== undefined) {
                        val = obj2[text];
                        strArray[index] = innerEval(val, lre, rre);
                    }
                }
            }
        })
        var tva = [], tvs = '';/* tva:text eval array;tvs:text eval string */
        strArray.forEach(function (item, index) {
            tva.push(item, operatorArray[index])
        })
        tva.pop();
        tvs = tva.join('');
        return tvs;
    }
}
