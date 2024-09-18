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

}
