/* MIC框架
****MIC:Made In China
****版本：v0.3.1
****初始發佈：2018.08.01
****本版發佈：
****使用小說明：
	不支持IE
	m-for基本與Vue的v-for功能相同
	m-if支持判斷:===、==、!==、!=、>=、<=、>、<、!、and、or或者直接對數據進行判斷、支持運算(含括號)
	m-else支持功能同v-else
	m-text、{{}}支持+、-、*、/、%或運算(含括號)
	m-model支持功能同v-model
****相比Vue的優點：
	1、不僅支持.獲取數據，也支持[]獲取數據
****升級說明：
	1、解決異步請求無法自動解析問題
	2、解決上一版本m-model解析異常問題
	3、解決整體重新解析問題，實現單元素數據更改後解析
	4、重新布置架構，實現數據改變即解析
*/
var mic=function(obj){return new Mic(obj)};

function Mic(w){this.init(w);}
Mic.prototype.init=function(obj){
	var root=this;
	this['$data']={};
	this['$methods']={};
	this['$vdom']=document.getElementById(obj.el.substr(1));
	var element=document.getElementById(obj.el.substr(1));
	var cloneEle=element.cloneNode(true);
	element.parentElement.insertBefore(cloneEle,element);
	element.parentElement.removeChild(element);
	var rootProxy=new Proxy(root, {
		get:function(target,name,receiver){
			return target[name];
		},
		set:function(target,name,value){
			if(target[name]===undefined){//初始化變量
				target[name]=value;				
			}else{//監聽變量變化
				var tns=target[name].toString();
				var vs=value.toString();
				if((typeof target[name]!== typeof value)||(tns!==vs)){
					target[name]=value;
					root.reloadDom(obj,rootProxy,name,value);
				}
			}
		}
	});
	var begin=new Promise(function(){});
	begin.then(this.initData(obj,root))
	.then(this.execCreated(obj,rootProxy))
	.then(this.initDom(obj,rootProxy,cloneEle))
	.then(this.execAction(obj,rootProxy,cloneEle))
	.then(this.execMounted(obj,rootProxy))
	.then(this.runRemove(obj,rootProxy));
}
	
/***************************************************
***** 第一步，取得data內和methods內數據，便於操作 *****
****************************************************/
Mic.prototype.initData=function(obj,root){
	/* 獲取data內數據 */
	if(obj.data){
		for(name in obj.data){
			if((typeof obj.data[name]=='function')){
				console.error("data內請不要定義函數");return false;
			}else{
				root[name]=obj.data[name];
				root['$data'][name]=obj.data[name];
			}
		}
	};

	/* 獲取methods內函數 */
	if(obj.methods){
		for(name in obj.methods){
			if(typeof obj.methods[name] =='function'){
				root[name]=obj.methods[name];
				root['$methods'][name]=obj.methods[name];
			}else{
				console.error("methods內請定義函數");return false
			}
		}
	};		
}

/**********************************
***** 第二步，執行created內代碼 *****
***********************************/

Mic.prototype.execCreated=function(obj,root){
	/* 將created的作用域設置在自己體內 */
	if(obj.created){
		obj.created.call(root);//不能call(this)，否則兼聽不到
	}
}	



/***************************************
***** 第三步，獲取HTML內的元素DOM ********
******* 並對el內的所有元素進行操作 *******
****************************************/



Mic.prototype.initDom=function(obj,root,ele){		

	/* 獲取的DOM元素 */
	var element=ele;

	/* 獲得所有域內元素 */
	
	var eleOffspring=offspring(element);

	/* 第一步處理m-for,必須先處理m-for */

	/* 將m-for統一存放到數組 */
	var forCollection = collection(eleOffspring, 'm-for');
	var forAttCol=forCollection.attCol;
	var forElsCol=forCollection.elsCol;
	

	/* 處理for */
	if(forCollection){
		for(var i=0;i<forAttCol.length;i++){
			evalFor(i,forAttCol,forElsCol,root)
		}
	};
	
	/* 第二處理m-text */	
	
	/* 重新獲取數據 */
	eleOffspring=offspring(element);/* 重新獲取元素 */

	/* 獲取{{}}集合 */

	var braces=nodesCollection(eleOffspring);

	/* 解析{{}} */
	if(braces){
		for(var i=0;i<braces.length;i++){
			if(braces[i].parent.__mic__.attributes===undefined)braces[i].parent.__mic__.attributes={};
			if(braces[i].parent.__mic__.attributes.braces===undefined)braces[i].parent.__mic__.attributes.braces=braces[i];
			evalBraces(braces[i],root)
		}
	}

	/* 獲取text集合 */

	var textCollection = collection(eleOffspring, 'm-text');
	var textAttCol=textCollection.attCol;
	var textElsCol=textCollection.elsCol;
	
	/* 再處理m-text */
	if (textCollection){
		for(var i=0;i<textAttCol.length;i++){
			evalText(i,textAttCol,textElsCol,root)
		}
	};

	/* 最后處理m-if，必須最後處理 */

	/* 獲取if集合 */
	eleOffspring=offspring(element);/* 重新獲取元素 */
	var ifCollection=collection(eleOffspring,'m-if');
	var ifAttCol=ifCollection.attCol;
	var ifElsCol=ifCollection.elsCol;
	ifCollection.comments=[];
	
	/* 處理m-if */
	if(ifCollection){
		for(var i=0;i<ifAttCol.length;i++){
			ifCollection.comments[i]=document.createComment('');
			ifElsCol[i].parent=ifElsCol[i].parentNode;
			evalIf(i,ifCollection,root)
		}
	};
	
	/* 動態處理m-model */

	/* 獲取model集合 */
	eleOffspring=offspring(element);/* 重新獲取元素 */
	var modelCollection=syncCollection(eleOffspring,'m-model');
	var modelAttCol=modelCollection.attCol;
	var modelElsCol=modelCollection.elsCol;
	var modelValCol=modelCollection.valCol;
	textCollection = syncCollection(eleOffspring, 'm-text');/* 獲取text集合 */
	textAttCol=textCollection.attCol;
	textElsCol=textCollection.elsCol;
	textValCol=textCollection.valCol;
	var bracesCollection=syncCollection(eleOffspring,'braces');

	if(modelCollection){
		var modelEle={};
		for(var i=0;i<modelAttCol.length;i++){
			modelEle=modelElsCol[i];
			var modelEleValue=modelValCol[i];
			var pattern=new RegExp('(\\+|-|\\*|\/|%|\s|\(|^)+'+modelEleValue+'(\\+|-|\\*|\/|%|\s|\)|$)+');
			modelEle.value=root[modelEleValue];
			if (textCollection){
				for(var j=0;j<textAttCol.length;j++){
					var textEle=textElsCol[j];/* 獲取m-text屬性的所在DOM元素 */
					var textEleValue=textValCol[j];/* 獲取m-text的值 */
					/* 解析數據 */					
					if (textEleValue.search(pattern)>=0){
						textEle.__mic__.text=textEleValue;					
					}
				}
			};
			
			/* 激活oninput */
			if(modelEle.oninput!==undefined){
				modelEle.oninput=function(){					
					modelEleValue=this.__mic__.attributes['m-model'];
					root[modelEleValue]=this.value?this.value:"+''";
					modelTextEval(root,textCollection,modelEleValue,pattern);
					modelBracesEval(root,bracesCollection,modelEleValue,pattern);
				}
			}
		}
	}	
}

/**********************************
****** 第四步，重新加載Dom元素 ******
***********************************/

Mic.prototype.reloadDom=function(obj,root,name,value){
	/* 獲取帶Vue的DOM元素 */
	var vdom=root['$vdom'];
	var element=document.getElementById(obj.el.substr(1));

	/* 獲得所有域內元素 */
	var vdomOffspring=offspring(vdom);
	var eleOffspring=offspring(element);
	
	/* 將m-for統一存放到數組 */
	var forCollection = syncCollection(vdomOffspring, 'm-for');
	var forAttCol=forCollection.attCol;
	var forElsCol=forCollection.elsCol;
	
	if (forCollection){
		for(var i=0;i<forAttCol.length;i++){			
			if(forElsCol[i].__mic__.attributes['m-text']===name){					
				evalFor(i,forAttCol,forElsCol,root);
			};
		}
	};

	var bracesCollection=syncCollection(eleOffspring,'braces');
	var bracesAttCol=bracesCollection.attCol;
	var bracesElsCol=bracesCollection.elsCol;
	
	if (bracesCollection){
		for(var i=0;i<bracesElsCol.length;i++){
			var braces=bracesElsCol[i].__mic__.attributes.braces;			
			for(var j=0;j<braces.data.length;j++){
				var bn=alltrim(braces.data[j].replace('{{','').replace('}}',''));
				if(bn===name){
					evalBraces(braces,root);
				};
			}
		}
	};

	var textCollection = syncCollection(eleOffspring, 'm-text');/* 獲取text集合 */
	var textAttCol=textCollection.attCol;
	var textElsCol=textCollection.elsCol;

	if (textCollection){
		for(var i=0;i<textAttCol.length;i++){			
			if(textElsCol[i].__mic__.attributes['m-text']===name){					
				evalText(i,textAttCol,textElsCol,root);
			};
		}
	};

	if(root.$vdom.ifc){
		for(var i=0;i<root.$vdom.ifc.attCol.length;i++){			
			// if(root.$vdom.ifc.elsCol[i].__mic__.attributes['m-if']===name){					
				evalIf(i,root.$vdom.ifc,root);
			// };
		}
	};
}

/**********************************
***** 第五步，執行mounted內代碼 *****
***********************************/

/* 將mounted的作用域設置在自己體內 */
Mic.prototype.execMounted=function(obj,root){
	if(obj.mounted)obj.mounted.call(root);
}

/**********************************
***** 第五步，執行mounted內代碼 *****
***********************************/
Mic.prototype.execAction=function(obj,root,element){

	/* 獲得所有域內元素 */
	
	var eleOffspring=offspring(element);	

	/* 將m-bind統一存放到數組 */
	var actionCollection = syncCollection(eleOffspring, '@');
	var actionAttCol=actionCollection.attCol;
	var actionElsCol=actionCollection.elsCol;
	
	if(actionCollection){		
		for(var i=0;i<actionAttCol.length;i++){
			var actionName=actionAttCol[i].slice(1);/* 獲取@綁定的行為 */
			actionElsCol[i].addEventListener(actionName,function(){/* 添加行為 */
				var onData=this.__mic__.data;
				var action=this.__mic__.attributes['@'+actionName];
				if(action.search(/(\()/)>0){					
					var sf=action.split('(');
					var paramString=sf[1].replace(')','')
					var params=paramString.split(',');
					var param=[];
					params.forEach(function(item,index){
						if(onData[item]!==undefined){param.push("'"+onData[item]+"'")}
						else{param.push('root.'+item)};
					})
					param=param.join(',');
					var ec='root.'+sf[0]+'('+param+')';
					eval(ec);
				}else{
					root[action]();
				}			
			})
		}
	}
}

/********************************
***** 第六步，銷毀所有內創信息 *****
*********************************/
Mic.prototype.runRemove=function(obj,root){
	
	/* 獲取帶Vue的DOM元素 */
	var element=document.getElementById(obj.el.substr(1));

	/* 獲得所有域內元素 */
	var eleOffspring=offspring(element);
	/* 移除所有vue屬性 */
	var attributes=['m-text','m-if','@',':','m-else','m-model'];
	removeAttribute(eleOffspring,attributes);
	for(var i=0;i<root.$vdom.ifc.elsCol.length;i++){
		var eo=offspring(root.$vdom.ifc.elsCol[i]);
		removeAttribute(eo,attributes);
	}
}

/**********************************************************
************************* 功能函數 *************************
***********************************************************/

/* IE判斷:是否為IE指定版本以下 */
var isIE=document.all;
var isIE6=document.all&&!window.XMLHttpRequest;
var isIE7=document.all&&!document.querySelector;
var isIE8=document.all&&!document.addEventListener;
var isIE9=document.all&&!window.atob;

/* 屏蔽IE7(含)以下版本 */
if(isIE7){
	alert('您的瀏覽器版本太低，請升級您的瀏覽器！！！');
	window.onload=function() {
		var body=document.getElementsByTagName('body')[0];
		body.innerHTML="<p style='font-size:50px;text-align:center;font-weight:bold;color:red;'>IE8以下版本，不顯示內容！</p><p style='font-size:50px;text-align:center;font-weight:bold;color:red;'>請升級至IE8以上版本！</p>"
	}
}

/* forEach函數用來遍歷數組和object */
/* 數組返回的數據分別是值(value)、序列(index)、本身(this) */
/* 對象返回的數據分別是值(value)、序列(index)、鍵(key)、本身(this) */
function forEach(){
	if(typeof arguments[0] == 'function'){
		returnValue(this,arguments[0])
	}else{
		returnValue(arguments[0],arguments[1])
	};
	function returnValue(object,callback) {
		if(object instanceof Array){
			for(var i=0;i<object.length;i++){
				callback(object[i],i,object);
			}
		}else{
			var count=0;
			var length=object.length||objectLength(object);
			for(name in object){
				/* 屏蔽prototype內部數據和自己的foreach */
				if(count<length){
					callback(object[name],count,name,object);
					count++;
				}
			}
		}
	}
}

/* 對象長度 */
function objectLength(){
	if(arguments.length==1){
		return returnValue(arguments[0])
	}else{
		return returnValue(this);
	}
	function returnValue(object) {
		var count=0;	
		for(name in object){
			if(object.hasOwnProperty(name)){
				count++;
			}
		}
		return count;
	}
}

/* join函數 */
function join(){
	if(typeof arguments[0]=='string'){
		return returnValue(this,arguments[0]);
	}else{
		return returnValue(arguments[0],arguments[1]);
	}
	function returnValue(object,string) {
		var newString='';
		var count=0;
		var length=object.length||objectLength(object);
		for(name in object){
			if(count<length){
				newString=newString+string+object[name];
				count++;
			}
		}
		newString.replace(string,'');
		return newString;
	}
}


/* 複製對象 */
function cloneObject(obj) {
	var newObj = {};
	for (name in obj) { newObj[name] = obj[name] };
	return newObj;
}

/* 刪除左右空格 */
function trim(string){return string.replace(/(^\s*)|(\s*$)/g,'');};

/* 刪除左側空格 */
function ltrim(string){return string.replace(/^\s+/,'');};

/* 刪除右側空格 */
function rtrim(string){return string.replace(/\s+$/, '');};

/* 刪除所有空格 */
function alltrim(string){return string.replace(/\s/g,'');};

/* 移除元素 */
function remove(ele){ele.parentElement.removeChild(ele)};

/* 獲取指定元素在父元素中的順序 */
function index(ele) {
	children = ele.parentNode.children;
	for (var index in children) {
		if (children[index] == ele) { return index }
	}
};

/* 獲取所有子節點集合 */
function offspringCollection(ele) {	
	var offspringCollection = [];	
	if (ele.children.length) {
		offspringCollection[0] = ele.children;
		for (var i = 0; i < offspringCollection.length; i++) {
			for (var j = 0; j < offspringCollection[i].length; j++) {
				if (offspringCollection[i][j].children.length) offspringCollection.push(offspringCollection[i][j].children);
			}
		}
	};
	return offspringCollection;
};

/* 獲取所有域內元素 */
function offspring(ele) {
	var els = [];
	if(!ele.__mic__)ele.__mic__={data:{},attributes:{}};
	els[0] = ele;
	var offsprings=offspringCollection(ele);	
	if(offsprings){
		offsprings.forEach(function (item, index) {
			for (var k = 0; k < offsprings[index].length; k++) {
				if(offsprings[index][k].__mic__){
					if(!offsprings[index][k].__mic__.data)offsprings[index][k].__mic__.data={};
					if(!offsprings[index][k].__mic__.attributes)offsprings[index][k].__mic__.attributes={};
				}else{
					offsprings[index][k].__mic__={data:{},attributes:{}};
				}
				for(var l=0;l< offsprings[index][k].attributes.length;l++){
					var name=offsprings[index][k].attributes[l].name;
					var value=offsprings[index][k].attributes[l].value;
					offsprings[index][k].__mic__.attributes[name]=value;
				}
				els.push(offsprings[index][k])
			}
		});
	};
	return els;
};


/* 獲取節點集合 */
function nodesCollection(els) {
	var nodesCollection={};
	var count=0;
	for(var i=0;i<els.length;i++){
		var nodes=els[i].childNodes;
		for (var l=0;l<nodes.length;l++){
				var data=nodes[l].data;			
				if(data&&(data.search('{{')>=0)&&(data.search('}}')>=0)){
				var pt=/{{.+}}/ig;
				var res=pt.exec(data);
				nodesCollection[count]={
					index:l,node:nodes[l],parent:els[i],string:data,data:res
				}
				count++;
			}
		}
	}	
	nodesCollection.length=count;
	return nodesCollection;
}

/* 獲取元素集合中指定屬性的屬性與元素的綜合集合函數 */
function collection(els,attr) {
	var elsCol=[],attCol=[],collection={};
	els.forEach(function(item,index){/* 遍歷DOM元素集 */
		for(var i=0;i<item.attributes.length;i++){/* 遍歷DOM元素集的屬性集 */
			var attrName=item.attributes[i].name;/* 獲取DOM元素的屬性名 */
			if(attr.length==1){/* 如果屬性是開頭標記 */
				if(attrName.substring(0,1)==attr){
					attCol.push(item.attributes[i]);
					elsCol.push(els[index]);
				}
			}else{
				if(attrName==attr){
					attCol.push(item.attributes[i]);
					elsCol.push(els[index]);
				}
			}
		}
	});
	collection.elsCol=elsCol;
	collection.attCol=attCol;
	return collection;
};

/* 獲取元素集合中指定屬性的屬性與元素的綜合集合函數 */
function syncCollection(els,attr) {
	var elsCol=[],valCol=[],attCol=[],collection={};
	els.forEach(function(item,index){/* 遍歷DOM元素集 */
		for(var i in item.__mic__.attributes){/* 遍歷DOM元素集的屬性集 */
			var attrName=i;/* 獲取DOM元素的屬性名 */
			if(attr.length==1){/* 如果屬性是開頭標記 */
				if(attrName.substring(0,1)==attr){
					attCol.push(i);
					valCol.push(item.__mic__.attributes[i]);
					elsCol.push(els[index]);
				}
			}else{
				if(attrName==attr){
					attCol.push(i);
					valCol.push(item.__mic__.attributes[i]);
					elsCol.push(els[index]);
				}
			}
		}
	});
	collection.elsCol=elsCol;
	collection.attCol=attCol;
	collection.valCol=valCol;
	return collection;
};

/* 移除屬性 */
function removeAttribute(els,attribute){
	if(attribute instanceof Object){/* 如果屬性是數組/對象 */
		if(!attribute.forEach)attribute.forEach=forEach;/* 如果是對象，則給建立forEach */
		attribute.forEach(function(attrItem,attrIndex){/* 遍歷屬性 */
			if(els.forEach){/* 如果els是個數組 */
				els.forEach(function(elsItem,elsIndex){/* 遍歷DOM元素數組 */
					if(attrItem.length==1){/* 如果屬性只有一個字長，則認為為開頭標記 */
						for (var i=0;i<elsItem.attributes.length; i++) {
							var attrName=elsItem.attributes[i].name;
							if(attrName.substring(0,1)==attrItem)elsItem.removeAttribute(attrName);
						}
					}else{
						elsItem.removeAttribute(attrItem);
					}
				});
			}else{
				if(attrItem.length==1){
					for (var i=0;i<els.attributes.length;i++) {
						var attrName=els.attributes[i].name;
						if (attrName.substring(0,1)==attrItem)els.removeAttribute(attrName);
					}
				}else{
					els.removeAttribute(attrItem);
				}				
			}
		});
	}else{
		if(els.forEach){/* 如果是數組 */
			els.forEach(function(elsItem,elsIndex){
				if(attribute.length==1){
					for (var i = 0; i < elsItem.attributes.length; i++) {
						var attrName=elsItem.attributes[i].name;
						if(attrName.substring(0,1)==attribute)elsItem.removeAttribute(attrName);
					}
				}else{
					elsItem.removeAttribute(attribute);
				}
			});
		}else{
			if(attribute.length==1){/* 如果是開頭標記 */
				for (var i=0;i<els.attributes.length;i++) {/* 遍歷元素的屬性 */
					var attrName=els.attributes[i].name;/* 獲取元素名稱 */
					if (attrName.substring(0,1)==attribute)els.removeAttribute(attrName);/* 如果元素名的第一個元素是開頭標記則移除屬性 */
				}
			}else{
				els.removeAttribute(attribute);/* 非開頭標記則直接移除屬性 */
			}
		}
	}
};

/* 分割值用於比較 */
function strCompare(string) {
	var operator=['===','==','!==','!=','>=','<=','>','<','!',' and ',' or ','&&','\\|\\|'];
	operator=operator.join('|');
	var self=string||join(this,'');
	var regExp=new RegExp('('+operator+')','ig')
	regExp.exec(self);
	var compareArray=[];
	if(RegExp.$1){
		compareArray=self.split(RegExp.$1);
		compareArray.push(RegExp.$1);
	}else{
		compareArray=[self,'','']
	}
	return compareArray;
}

/* 數組奇偶分組 */
/* Array odd and even grouping */
function arrOE(array){
	var odd=[],even=[];
	array.forEach(function(item,index) {
		if(index%2){even.push(item)}
		else{odd.push(item)}
	})
	return [odd,even];
}

/* 解析函數 */
function strEval(string,obj1,obj2) {
	if(!string)return '';
	if(Number(string)==string)return Number(string);
	var operator=['\\+','-','\\*','\/','%'];/* 設置操作符 */
	operator=operator.join('|');/* 整合操作符 */
	var self=string||join(this,'');/* 整合字符串 */
	var regExp=new RegExp('('+operator+')','ig');/* 定義搜索正則表達式 */
	var regArray=self.match(regExp);/* 搜索表達式并返回數組 */
	if(!regArray)regArray=[];/* 兼容IE8:防止無返回值報錯 */
	var splitArray=self.split(regExp);/* 用表達式分割字符串 */
	var evalArray=[];
	/* 兼容IE8 */
	if(isIE8){/* 因在IE8中splitArray不包含符合匹配的檢測值,故需要兼容 */
		splitArray.forEach(function(item,index) {
			evalArray.push(item,regArray[index]);
		})
		evalArray.pop();
	}else{
		evalArray=splitArray;
	}
	evalArray=arrOE(evalArray);/* 奇偶分割字符串 */
	var strArray=evalArray[0];/* 需要轉義的字符串 */
	var operatorArray=evalArray[1];/* 操作符數組 */
	strArray.forEach(function(item,index){
		if((typeof item=='string')&&(Number(item)!=item)&&(item.search(/^\'[\S\s]+\'$/)<0)){
			var pattern=/(\()|(\))/g;/* 對括號進行處理 */
			var text=trim(item);
			if(text.search(/^\([\S\s]+\)$/)>-1){text=trim(text.replace(/\(/g,'').replace(/\)/g,''))}/* 去除元素兩邊加括號的情況 */
			text.match(pattern)/* 檢索text中是否有括號 */
			var lre=RegExp.$1;
			var rre=RegExp.$2;
			text=trim(text.replace(/\(/g,'').replace(/\)/g,''));/* 去除括號 */
			var val='';
			/* 處理函數 */
			function innerEval(val,lre,rre,textArray){
				var variable='';
				if(textArray){
					for(var i=1;i<textArray.length;i++){
						val=val[textArray[i]];
					}
				}
				if(val instanceof Object){val=JSON.stringify(val)};/* 將Object轉化為JSON防止無法讀取 */
				if((typeof val=='string')&&(Number(val)!=val)&&(val.search(/^\'[\S\s]+\'$/)<0)){
					variable=lre+"'"+val+"'"+rre;/* 對結果為字符串的加上引號和括號 */
				}else{
					variable=lre+val+rre;
				}
				return variable;
			}
			/* 處理各類數據 */
			if(text.search(/\./)>=0){/* 處理帶. */
				var textArray=text.split('.');/* 用.分割數值 */
				var ta=textArray[0];/* 第一個數據代表查詢對象 */
				if(obj1[ta]!==undefined){
					val=obj1[ta];
					strArray[index]=innerEval(val,lre,rre,textArray);/* 獲取解析后的值 */
				}else if(obj2[ta]!==undefined){
					val=obj2[ta];
					strArray[index]=innerEval(val,lre,rre,textArray);
				}				
			}else if(text.search(/\[/)>=0){/* 處理帶[] */
				var textArray=text.split('[');
				for(var i=1;i<textArray.length;i++){
					if(textArray[i].search(/\]$/)>=0){/* 在尾部查找到] */
						textArray[i]=trim(textArray[i].replace(/\]$/,''));
					}else{
						throw new Error('請檢查你的m-text語句')
					}
				}
				var ta=trim(textArray[0]);
				if(obj1[ta]!==undefined){
					val=obj1[ta];
					strArray[index]=innerEval(val,lre,rre,textArray);
				}else if(obj2[ta]!==undefined){
					val=obj2[ta];
					strArray[index]=innerEval(val,lre,rre,textArray);
				}
			}else{/* 處理正常 */			
				if(obj1[text]!==undefined){/* 防止0/false/Null帶來的錯誤 */
					val=obj1[text];
					strArray[index]=innerEval(val,lre,rre);
				}else if(obj2[text]!==undefined){
					val=obj2[text];
					strArray[index]=innerEval(val,lre,rre);
				}
			}
		}
	})
	var tva=[],tvs='';/* tva:text eval array;tvs:text eval string */
	strArray.forEach(function(item,index){
		tva.push(item,operatorArray[index])
	})
	tva.pop();
	tvs=tva.join('');
	return tvs;
}

/**********************************************
********************解析函數********************
**********************************************/


/* m-for解析函數 */
function evalFor(i,forAttCol,forElsCol,root) {
	var forParam=forAttCol[i].value.split(' in ');	/* 將m-for的值用 in 分開 */
	var param=[],forEls={},forOS={};
	var forEle=forElsCol[i];/* 獲取m-for所在的DOM元素 */
	var forParent=forEle.parentNode;/* 獲取DOM元素的父元素，用於添加DOM元素 */
	var forObj=forEle.__mic__.data[trim(forParam[1])]?forEle.__mic__.data[trim(forParam[1])]:root[trim(forParam[1])];/* 判斷第二參數是否在__mic__.data中，如果在賦值，不存在則使用data中的數據 */
	var count=0;/* 定義計數器 */
	forParam[0]=alltrim(forParam[0].replace('(','').replace(')',''));/* 去除左右括號 */
	if(forParam[0].search(',')){param=forParam[0].split(',')}else{param[0]=forParam[0]};/* 若有逗號，則第一個參數用逗號分開后，存到指定數組param中，否則直接存到param中 */
	if(forObj instanceof  Array){/* 如果是數組型 */
		for (var j=0;j<forObj.length;j++){/* 遍歷數組 */
			forEls=forEle.cloneNode(true);/* 拷貝DOM對象 */
			removeAttribute(forEls,'m-for');/* 刪除m-for屬性，防止死循環 */
			forParent.insertBefore(forEls,forEle);/* 將拷貝的對象添加到前面 */
			forOS=collection(offspring(forEls),'m-for');/* 獲取DOM對象下的m-for集合 */
			forElsOS=forOS.elsCol;/* 獲取DOM對象下的帶m-for屬性的元素集合 */
			forAttOS=forOS.attCol;/* 獲取DOM對象下的帶m-for屬性的屬性集合 */
			forAttCol=forAttCol.concat(forAttOS);/* 將子元素中的m-for集合拼合到m-for大集合中 */
			forElsCol=forElsCol.concat(forElsOS);/* 將子元素中的帶m-for的元素集合拼合到帶m-for的元素大集合中 */
			onForOS=offspring(forEls);/* 獲取DOM元素的子孫集合 */
			onForOS.forEach(function(item,index){
				if(JSON.stringify(onForOS[index].parentNode.__mic__.data) !== "{}"){/* 如果父元素的__mic__.data有值 */
					onForOS[index].__mic__.data=cloneObject(onForOS[index].parentNode.__mic__.data);/* 拷貝父元素的__mic__.data屬性 */
				}
				onForOS[index].__mic__.data[param[0]]=forObj[j];/* 將值放到第一位置（必須） */
				if(param[1])onForOS[index].__mic__.data[param[1]]=j;/* 將順序值放到第二位置（非必須），只有設置才有 */
			})
		}
		forParent.removeChild(forEle);/* 移除被複製的元元素 */
	}else if(forObj instanceof  Object){/* 如果是對象型 */
		for(var name in forObj){
			forEls=forEle.cloneNode(true);
			removeAttribute(forEls,'m-for');/* 刪除m-for屬性，防止死循環 */
			forParent.insertBefore(forEls,forEle);/* 添加子元素 */
			forOS=collection(offspring(forEls),'m-for');/* 獲取DOM對象下的m-for集合 */
			forElsOS=forOS.elsCol;/* 獲取DOM對象下的帶m-for屬性的元素集合 */
			forAttOS=forOS.attCol;/* 獲取DOM對象下的帶m-for屬性的屬性集合 */
			forAttCol=forAttCol.concat(forAttOS);/* 將子元素中的m-for集合拼合到m-for大集合中 */
			forElsCol=forElsCol.concat(forElsOS);/* 將子元素中的帶m-for的元素集合拼合到帶m-for的元素大集合中 */
			onForOS=offspring(forEls);
			onForOS.forEach(function(item,index){
				if(onForOS[index].parentNode.__mic__.data){/* 如果父元素存在__mic__.data屬性 */
					onForOS[index].__mic__.data=cloneObject(onForOS[index].parentNode.__mic__.data);/* 拷貝父元素的__mic__.data屬性 */
				}
				onForOS[index].__mic__.data[param[0]]=forObj[name];/* 將值放到第一個位置 */
				if(param[1])onForOS[index].__mic__.data[param[1]]=count;/* 將順序值放到第二位置（非必須），只有設置才有 */
				if(param[2])onForOS[index].__mic__.data[param[2]]=name;/* 將名稱值放到第三位置（非必須），只有設置才有 */
			})
			count++;
		}
		forParent.removeChild(forEle);/* 移除被複製的元元素 */
	}else{
		console.warn('數據格式錯誤！如若不影響顯示，可不用理會，否則請檢查代碼！');
	}
}


/* {{}}解析函數 */
function evalBraces(braces,root){	
	var text="'"+braces.string.replace(/{{/g,'\'+').replace(/}}/g,'+\'')+"'";	
	var parentData=braces.parent.__mic__.data;		
	var tevn=strEval(text,parentData,root);
	tevn=tevn.replace(/\'\'\+/g,"").replace(/\+\'\'/g,"");	
	try {
		tevn=eval(tevn);
	} catch (error) {
		console.error('請檢查{{}}內語法錯誤！！！');				
		tevn="";
	}
	braces.node.data=tevn;
}

/* m-text解析函數 */
function evalText(i,textAttCol,textElsCol,root) {
	var textEle=textElsCol[i];/* 獲取m-text屬性的所在DOM元素 */		
	
	var textEleInfo=textEle.__mic__.data?textEle.__mic__.data:{};/* 獲取元素的__mic__.data值，即m-for中遍歷出來的值 */
	
	var textEleValue=textAttCol[i].value?textAttCol[i].value:textEle.__mic__.attributes['m-text'];/* 獲取m-text的值 */
	
	/* 解析數據 */
	var tevn=strEval(textEleValue,textEleInfo,root);
	tevn=tevn.replace(/\'\'\+/g,"").replace(/\+\'\'/g,"");
	try {
		tevn=eval(tevn);
	} catch (error) {
		console.error('請檢查m-text語法錯誤！！！');				
		tevn="";
	}
	textEle.innerText=tevn;
}

/* m-if解析函數 */
function evalIf(i,ifc,root) {
	var ifEle=ifc.elsCol[i];
	var comment=ifc.comments[i]
	var ifEleDate=ifEle.__mic__.data?ifEle.__mic__.data:{};
	/* 處理m-else */
	var nextEle=ifEle.nextElementSibling||ifEle.nextSibling;/* 兼容IE8 */
	var elseFlag=false;
	if(nextEle&&nextEle.attributes){
		for(var k=0;k<nextEle.attributes.length;k++){
			if(nextEle.attributes[k].name=='m-else'){elseFlag=true;}
		}
	}
	/* 將變量值分割成三個數組,數組一是左側數據，數組二是右側數據，數組三是對比操作符 */
	var sc=strCompare(ifc.attCol[i].value);
	/* 壓縮掉兩側的空格和() */
	var scv1=trim(sc[0]);
	var scv2=trim(sc[1]);
	/* 判斷有值，防止() */	
	var evalS0=strEval(scv1,ifEleDate,root);
	var evalS1=strEval(scv2,ifEleDate,root);
	var evalS2='';
	if(sc[2])evalS2=sc[2];
	var comExp=evalS0+evalS2+evalS1;
	try {
		comExp=eval(comExp);
	} catch (error) {
		console.error('請檢查m-if語法');
		comExp=false;
	}	
	root.$vdom.ifc=ifc;
	if(!comExp){
		ifEle.parent.insertBefore(comment,ifEle);
		ifEle.parent.removeChild(ifEle);
	}else{
		if(comment.parentElement){
			ifEle.parent.insertBefore(ifEle,comment);
			ifEle.parent.removeChild(comment);
		}
		if(elseFlag){
			ifEle.parentNode.removeChild(nextEle);
		}
	 }
}

/* 動態解析被model綁定的Text */
function modelTextEval(root,coll,value,pattern){
	root[value]=root[value].replace(/\\/g,"\\\\").replace(/\'/g,"\\\'");
	if (coll){
		for(var i=0;i<coll.attCol.length;i++){
			var collElement=coll.elsCol[i];/* 獲取m-text屬性的所在DOM元素 */
			if (collElement.__mic__.text.search(pattern)>=0){
				var tevn=strEval(collElement.__mic__.text,collElement.__mic__.data,root);
				tevn=tevn.replace(/\'\'\+/g,"").replace(/\+\'\'/g,"");
				if(tevn=="\'\+\\\'\\\'\'")tevn="''";
				try {
					tevn=eval(tevn);
				} catch (error) {
					console.error('請檢查m-text語法錯誤！！！');		
					tevn="";
				}
				collElement.innerText=tevn;
			}							
		}
	};
};

/* 動態解析被model綁定的Braces */
function modelBracesEval(root,coll,value,pattern) {
	root[value]=root[value].replace(/\\/g,"\\\\").replace(/\'/g,"\\\'");
	if (coll){
		for(var i=0;i<coll.length;i++){
			var collElement=coll[i].parent;/* 獲取braces屬性的所在DOM元素 */
			if (collElement.__mic__.attributes.braces.string.search(pattern)>=0){
				var tevn=strEval(collElement.__mic__.attributes.braces.string,collElement.__mic__.data,root);
				tevn=tevn.replace(/\'\'\+/g,"").replace(/\+\'\'/g,"");
				if(tevn=="\'\+\\\'\\\'\'")tevn="''";
				try {
					tevn=eval(tevn);
				} catch (error) {
					console.error('請檢查{{}}內語法錯誤！！！');		
					tevn="";
				}
				coll[i].node.data=tevn;
			}							
		}
	};
}