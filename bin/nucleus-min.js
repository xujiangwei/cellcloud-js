var UUID={v4:function(){var e="0123456789abcdef".split("");var c=[],b=Math.random,d;c[8]=c[13]=c[18]=c[23]="-";c[14]="4";for(var a=0;a<36;a++){if(!c[a]){d=0|b()*16;c[a]=e[(a==19)?(d&3)|8:d&15]}}return c.join("")}};(function(q){var i=q.Base64;var e="2.1.4";var r;if(typeof module!=="undefined"&&module.exports){r=require("buffer").Buffer}var o="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";var c=function(B){var A={};for(var z=0,y=B.length;z<y;z++){A[B.charAt(z)]=z}return A}(o);var u=String.fromCharCode;var w=function(z){if(z.length<2){var y=z.charCodeAt(0);return y<128?z:y<2048?(u(192|(y>>>6))+u(128|(y&63))):(u(224|((y>>>12)&15))+u(128|((y>>>6)&63))+u(128|(y&63)))}else{var y=65536+(z.charCodeAt(0)-55296)*1024+(z.charCodeAt(1)-56320);return(u(240|((y>>>18)&7))+u(128|((y>>>12)&63))+u(128|((y>>>6)&63))+u(128|(y&63)))}};var j=/[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;var g=function(y){return y.replace(j,w)};var p=function(B){var A=[0,2,1][B.length%3],y=B.charCodeAt(0)<<16|((B.length>1?B.charCodeAt(1):0)<<8)|((B.length>2?B.charCodeAt(2):0)),z=[o.charAt(y>>>18),o.charAt((y>>>12)&63),A>=2?"=":o.charAt((y>>>6)&63),A>=1?"=":o.charAt(y&63)];return z.join("")};var k=q.btoa?function(y){return q.btoa(y)}:function(y){return y.replace(/[\s\S]{1,3}/g,p)};var n=r?function(y){return(new r(y)).toString("base64")}:function(y){return k(g(y))};var f=function(y,z){return !z?n(y):n(y).replace(/[+\/]/g,function(A){return A=="+"?"-":"_"}).replace(/=/g,"")};var t=function(y){return f(y,true)};var d=new RegExp(["[\xC0-\xDF][\x80-\xBF]","[\xE0-\xEF][\x80-\xBF]{2}","[\xF0-\xF7][\x80-\xBF]{3}"].join("|"),"g");var s=function(A){switch(A.length){case 4:var y=((7&A.charCodeAt(0))<<18)|((63&A.charCodeAt(1))<<12)|((63&A.charCodeAt(2))<<6)|(63&A.charCodeAt(3)),z=y-65536;return(u((z>>>10)+55296)+u((z&1023)+56320));case 3:return u(((15&A.charCodeAt(0))<<12)|((63&A.charCodeAt(1))<<6)|(63&A.charCodeAt(2)));default:return u(((31&A.charCodeAt(0))<<6)|(63&A.charCodeAt(1)))}};var b=function(y){return y.replace(d,s)};var a=function(C){var y=C.length,A=y%4,B=(y>0?c[C.charAt(0)]<<18:0)|(y>1?c[C.charAt(1)]<<12:0)|(y>2?c[C.charAt(2)]<<6:0)|(y>3?c[C.charAt(3)]:0),z=[u(B>>>16),u((B>>>8)&255),u(B&255)];z.length-=[0,0,2,1][A];return z.join("")};var h=q.atob?function(y){return q.atob(y)}:function(y){return y.replace(/[\s\S]{1,4}/g,a)};var v=r?function(y){return(new r(y,"base64")).toString()}:function(y){return b(h(y))};var l=function(y){return v(y.replace(/[-_]/g,function(z){return z=="-"?"+":"/"}).replace(/[^A-Za-z0-9\+\/]/g,""))};var x=function(){var y=q.Base64;q.Base64=i;return y};q.Base64={VERSION:e,atob:h,btoa:k,fromBase64:l,toBase64:f,utob:g,encode:f,encodeURI:t,btou:b,decode:l,noConflict:x};if(typeof Object.defineProperty==="function"){var m=function(y){return{value:y,enumerable:false,writable:true,configurable:true}};q.Base64.extendString=function(){Object.defineProperty(String.prototype,"fromBase64",m(function(){return l(this)}));Object.defineProperty(String.prototype,"toBase64",m(function(y){return f(this,y)}));Object.defineProperty(String.prototype,"toBase64URI",m(function(){return f(this,true)}))}}})(this);function argumentNames(a){var b=a.toString().match(/^[\s\(]*function[^(]*\(([^\)]*)\)/)[1].replace(/\s+/g,"").split(",");return b.length==1&&!b[0]?[]:b}function Class(c,e){if(typeof(c)==="object"){e=c;c=null}function d(){if(c){this.baseprototype=c.prototype}this.ctor.apply(this,arguments)}if(c){var a=function(){};a.prototype=c.prototype;d.prototype=new a();d.prototype.constructor=d}for(var b in e){if(e.hasOwnProperty(b)){if(c&&typeof(e[b])==="function"&&argumentNames(e[b])[0]==="$super"){d.prototype[b]=(function(f,g){return function(){var h=this;$super=function(){return c.prototype[f].apply(h,arguments)};return g.apply(this,Array.prototype.concat.apply($super,arguments))}})(b,e[b])}else{d.prototype[b]=e[b]}}}return d}function HashMap(){var a=0;var b=new Object();this.isEmpty=function(){return a==0};this.containsKey=function(c){return(c in b)};this.containsValue=function(d){for(var c in b){if(b[c]==d){return true}}return false};this.put=function(c,d){if(!this.containsKey(c)){a++}b[c]=d};this.get=function(c){return this.containsKey(c)?b[c]:null};this.remove=function(c){if(this.containsKey(c)&&(delete b[c])){a--}};this.values=function(){var d=new Array();for(var c in b){d.push(b[c])}return d};this.keySet=function(){var d=new Array();for(var c in b){d.push(c)}return d};this.size=function(){return a};this.clear=function(){a=0;b=new Object()}}var Utils={simpleEncrypt:function(a,j){var b=[];for(var h=0;h<a.length;++h){b.push(a.charCodeAt(h)-256)}var m=[];for(var h=0;h<j.length;++h){m.push(j.charCodeAt(h)-256)}if(m.length!=8){return null}var n=11+m[0];n-=m[1];n+=m[2];n-=m[3];n+=m[4];n-=m[5];n+=m[6];n-=m[7];var e=(n%8);var g=(((n%2)==0)?2:1);var d=b.length;var f=new Array();for(var h=0;h<d;++h){var k=(b[h]^g);var l=(k^e);if(l<0){l+=256}f[h]=l}return f},simpleDecrypt:function(k,h){var d=[];for(var g=0;g<k.length;++g){d.push(k.charCodeAt(g)-256)}var m=[];for(var g=0;g<h.length;++g){m.push(h.charCodeAt(g)-256)}if(m.length!=8){return null}var n=11+m[0];n-=m[1];n+=m[2];n-=m[3];n+=m[4];n-=m[5];n+=m[6];n-=m[7];var b=(n%8);var f=(((n%2)==0)?2:1);var a=d.length;var e=new Array();for(var g=0;g<a;++g){var j=(d[g]^b);var l=(j^f);if(l<0){l+=256}e[g]=l}return e}};var HttpMethod={GET:"GET",POST:"POST"};var HttpErrorCode={NETWORK_FAILED:1000,STATUS_ERROR:1100};var AjaxResponse=Class({ctor:function(a,b){this.status=a;this.data=b},getStatus:function(){return this.status},getData:function(){return this.data}});var AjaxRequest=Class({ctor:function(b,a){this._xmlhttp=b;this._url=a;this._method="GET";this._headers=null;this._content=null},method:function(a){this._method=a;return this},header:function(a,b){if(null==this._headers){this._headers=new HashMap()}this._headers.put(a,b);return this},content:function(a){this._content=a;return this},send:function(d){this._xmlhttp.open(this._method,this._url,true);var h;if(null!=this._content&&typeof this._content=="object"){for(var e in this._content){if(h==null){h=e+"="+encodeURIComponent(this._content[e])}else{h+="&"+e+"="+encodeURIComponent(this._content[e])}}this._xmlhttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded; charset=UTF-8")}else{h=this._content;this._xmlhttp.setRequestHeader("Content-Type","application/json")}if(null!=this._headers){var a=this._headers.keySet();for(var c=0;c<a.length;++c){var b=a[c];var f=this._headers.get(b);this._xmlhttp.setRequestHeader(b,f)}}if(undefined!==d){var g=this._xmlhttp;g.onreadystatechange=function(){if(g.readyState==4){var i=new AjaxResponse(g.status,g.responseText);d.call(null,i)}}}if(null==h){this._xmlhttp.send()}else{this._xmlhttp.send(h)}}});var AjaxCrossDomainRequest=Class({ctor:function(a,b){this._address=a;this._port=b;this._uri="";this._method="GET";this._cookie=null;this._headers=null;this._content=null;this._error=null;this._errorContext=null;this._protocol=(window.location.protocol.toLowerCase().indexOf("https")>=0)?"https://":"http://";this._completed=false;this._timestamp=new Date()},uri:function(a){this._uri=a;return this},method:function(a){this._method=a;return this},content:function(a){this._content=a;return this},cookie:function(a){this._cookie=a;return this},error:function(b,a){this._error=b;this._errorContext=(a!==undefined)?a:null;return this},send:function(a){AjaxController.execute(this,a);return this},_execute:function(d){var e=this._timestamp.getTime();var g=["?u=",this._uri,"&m=",this._method,"&c=_cc_ajax_cb","&t=",e];if(this._content!=null){var c=null;if(typeof this._content=="string"){c=this._content}else{c=JSON.stringify(this._content)}g.push("&b=",escape(c))}if(this._cookie!=null){g.push("&_cookie=",escape(this._cookie))}var f=this._protocol+this._address+":"+this._port+"/cccd.js"+g.join("");var a=this;if(undefined!==d){_cc_ajax_map.put(e,{request:a,callback:d})}var b=document.getElementById("cccd");if(b!=null){document.body.removeChild(b);b=null}if(null==b){b=document.createElement("script");b.setAttribute("type","text/javascript");b.setAttribute("id","cccd");if(b.addEventListener){b.addEventListener("error",function(h){a._onError(h)},false);b.addEventListener("load",function(h){a._onLoad(h)},false)}else{if(b.attachEvent){b.attachEvent("onerror",function(h){a._onError(h)});b.attachEvent("onload",function(h){a._onLoad(h)})}}b.src=f;document.body.appendChild(b)}return this},_onLoad:function(a){AjaxController.notifyCompleted(this)},_onError:function(a){if(null!=this._error){if(a!==undefined){this._error.call(this._errorContext,this,HttpErrorCode.NETWORK_FAILED)}else{this._error.call(this._errorContext,this,HttpErrorCode.STATUS_ERROR)}}this._completed=true;_cc_ajax_map.remove(this._timestamp.getTime());AjaxController.notifyCompleted(this)}});var _cc_ajax_map=new HashMap();var _cc_ajax_cb=function(f,b,c){if(undefined!==c){Logger.i("Ajax","default ajax callback, cookie: "+c)}else{}var e=_cc_ajax_map.get(f);if(null!=e){var d=e.request;var a=e.callback;a.call(null,b,c);_cc_ajax_map.remove(f);d._completed=true;AjaxController.notifyCompleted(d)}};var AjaxController={timer:0,lastRequest:null,requestQueue:[],callbackQueue:[],notifyCompleted:function(a){},execute:function(b,a){this.requestQueue.push(b);this.callbackQueue.push(a)}};AjaxController.timer=setInterval(function(){var d=AjaxController.requestQueue;if(d.length>0){var c=AjaxController.callbackQueue;if(null!=AjaxController.lastRequest){if(AjaxController.lastRequest._completed){var b=d.shift();var a=c.shift();AjaxController.lastRequest=b;b._execute(a)}}else{var b=d.shift();var a=c.shift();AjaxController.lastRequest=b;b._execute(a)}}},500);var Ajax={newRequest:function(a){var b=null;if(window.XMLHttpRequest){b=new XMLHttpRequest()}else{b=new ActiveXObject("Microsoft.XMLHTTP")}var c=new AjaxRequest(b,a);return c},newCrossDomain:function(a,b){var c=new AjaxCrossDomainRequest(a,b);return c}};var InetAddress=Class({ctor:function(a,b){this.address=a;this.port=b},getAddress:function(){return this.address},getPort:function(){return this.port}});if(undefined===window.console){window.console={error:function(){},warn:function(){},info:function(){},log:function(){}}}else{if(undefined===window.console.error){window.console.error=window.console.log}if(undefined===window.console.warn){window.console.warn=window.console.log}if(undefined===window.console.info){window.console.info=window.console.log}}var Logger={enabled:true,d:function(a,b){if(!Logger.enabled){return}window.console.log(Logger._printTime()+" [DEBUG] "+a+" - "+b)},i:function(a,b){if(!Logger.enabled){return}window.console.info(Logger._printTime()+" [INFO]  "+a+" - "+b)},w:function(a,b){if(!Logger.enabled){return}window.console.warn(Logger._printTime()+" [WARN]  "+a+" - "+b)},e:function(a,b){if(!Logger.enabled){return}window.console.error(Logger._printTime()+" [ERROR] "+a+" - "+b)},_printTime:function(){var b=new Date();var a=[b.getHours(),":",b.getMinutes(),":",b.getSeconds(),".",b.getMilliseconds()];b=null;return a.join("")}};var Service=Class({ctor:function(){},startup:function(){return false},shutdown:function(){}});var StuffType={SUBJECT:1,PREDICATE:2,OBJECTIVE:3,ATTRIBUTIVE:4,ADVERBIAL:5,COMPLEMENT:6};var LiteralBase={STRING:1,INT:2,LONG:3,FLOAT:4,BOOL:5,JSON:6,XML:7};var Stuff=Class({ctor:function(b,d,c){this.type=b;this.value=null;this.literalBase=null;if(d!==undefined){this.value=d;if(c===undefined){var e=(typeof d);if(e=="string"){this.literalBase=LiteralBase.STRING}else{if(e=="number"){var a=/^-?\d+$/;if(a.test(d.toString())){this.literalBase=LiteralBase.LONG}else{this.literalBase=LiteralBase.FLOAT}}else{if(e=="boolean"){this.literalBase=LiteralBase.BOOL}else{if(e=="object"){this.literalBase=LiteralBase.JSON}}}}}}if(c!==undefined){this.literalBase=c}},clone:function(a){},getType:function(){return this.type},getValue:function(){return this.value},getValueAsString:function(){if(typeof(this.value)=="string"){return this.value}else{return this.value.toString()}},getValueAsNumber:function(){return Number(this.value)},getValueAsBool:function(){return Boolean(this.value)},getLiteralBase:function(){return this.literalBase},setValue:function(a){this.value=a},setLiteralBase:function(a){this.literalBase=a}});var SubjectStuff=Class(Stuff,{ctor:function(b,a){Stuff.prototype.ctor.call(this,StuffType.SUBJECT,b,a)},clone:function(a){if(a.type==StuffType.SUBJECT){a.value=this.value;a.literalBase=this.literalBase}}});var PredicateStuff=Class(Stuff,{ctor:function(b,a){Stuff.prototype.ctor.call(this,StuffType.PREDICATE,b,a)},clone:function(a){if(a.type==StuffType.PREDICATE){a.value=this.value;a.literalBase=this.literalBase}}});var ObjectiveStuff=Class(Stuff,{ctor:function(b,a){Stuff.prototype.ctor.call(this,StuffType.OBJECTIVE,b,a)},clone:function(a){if(a.type==StuffType.OBJECTIVE){a.value=this.value;a.literalBase=this.literalBase}}});var AttributiveStuff=Class(Stuff,{ctor:function(b,a){Stuff.prototype.ctor.call(this,StuffType.ATTRIBUTIVE,b,a)},clone:function(a){if(a.type==StuffType.ATTRIBUTIVE){a.value=this.value;a.literalBase=this.literalBase}}});var AdverbialStuff=Class(Stuff,{ctor:function(b,a){Stuff.prototype.ctor.call(this,StuffType.ADVERBIAL,b,a)},clone:function(a){if(a.type==StuffType.ADVERBIAL){a.value=this.value;a.literalBase=this.literalBase}}});var ComplementStuff=Class(Stuff,{ctor:function(b,a){Stuff.prototype.ctor.call(this,StuffType.COMPLEMENT,b,a)},clone:function(a){if(a.type==StuffType.COMPLEMENT){a.value=this.value;a.literalBase=this.literalBase}}});var Primitive=Class({ctor:function(a){if(typeof a=="string"){this.ownerTag=a;this.dialect=null}else{this.dialect=a;this.ownerTag=null}this.celletIdentifier=null;this.subjectList=null;this.predicateList=null;this.objectiveList=null;this.attributiveList=null;this.adverbialList=null;this.complementList=null},getOwnerTag:function(){return this.ownerTag},setCelletIdentifier:function(a){this.celletIdentifier=a;if(null!=this.dialect){this.dialect.setCelletIdentifier(a)}},getCelletIdentifier:function(){return this.celletIdentifier},isDialectal:function(){return(null!=this.dialect)},getDialect:function(){return this.dialect},capture:function(a){this.dialect=a;this.dialect.setOwnerTag(this.ownerTag);this.dialect.setCelletIdentifier(this.celletIdentifier)},commit:function(a){switch(a.type){case StuffType.SUBJECT:if(null==this.subjectList){this.subjectList=[a]}else{this.subjectList.push(a)}break;case StuffType.PREDICATE:if(null==this.predicateList){this.predicateList=[a]}else{this.predicateList.push(a)}break;case StuffType.OBJECTIVE:if(null==this.objectiveList){this.objectiveList=[a]}else{this.objectiveList.push(a)}break;case StuffType.ATTRIBUTIVE:if(null==this.attributiveList){this.attributiveList=[a]}else{this.attributiveList.push(a)}break;case StuffType.ADVERBIAL:if(null==this.adverbialList){this.adverbialList=[a]}else{this.adverbialList.push(a)}break;case StuffType.COMPLEMENT:if(null==this.complementList){this.complementList=[a]}else{this.complementList.push(a)}break;default:break}},subjects:function(){return this.subjectList},predicates:function(){return this.predicateList},objectives:function(){return this.objectiveList},attributives:function(){return this.attributiveList},adverbials:function(){return this.adverbialList},complements:function(){return this.complementList}});var Dialect=Class({ctor:function(a,b){this.name=a;if(b!==undefined){this.tracker=b}else{this.tracker="none"}this.tag=null;this.celletIdentifier=null},getName:function(){return this.name},getTracker:function(){return this.tracker},setOwnerTag:function(a){this.tag=a},getOwnerTag:function(){return this.tag},setCelletIdentifier:function(a){this.celletIdentifier=a},getCelletIdentifier:function(){return this.celletIdentifier},translate:function(){return null},build:function(a){}});var DialectMetaData=Class({ctor:function(a,b){this.name=a;this.description=b}});var DialectFactory=Class({ctor:function(){},getMetaData:function(){return null},create:function(a){return null}});var DialectEnumerator=Class({ctor:function(){this.factories=new HashMap()},createDialect:function(b,c){var a=this.factories.get(b);if(null!=a){return a.create(c)}return null},addFactory:function(a){this.factories.put(a.getMetaData().name,a)},removeFactory:function(a){this.factories.remove(a.getMetaData().name)},getFactory:function(a){return this.factories.get(a)}});DialectEnumerator.instance=new DialectEnumerator();DialectEnumerator.getInstance=function(){return DialectEnumerator.instance};var ActionDialect=Class(Dialect,{ctor:function(a,b){Dialect.prototype.ctor.call(this,ActionDialect.DIALECT_NAME,a);if(b!==undefined){this.action=b}else{this.action=null}this.params=new HashMap()},setAction:function(a){this.action=a},getAction:function(){return this.action},translate:function(){if(null==this.action){return null}var b=new Primitive(this);var g=this.params.keySet();for(var e=0;e<g.length;e++){var d=g[e];var f=this.params.get(d);var a=new SubjectStuff(d);var c=new ObjectiveStuff(f);b.commit(a);b.commit(c)}var h=new PredicateStuff(this.action);b.commit(h);return b},build:function(a){this.action=a.predicates()[0].getValueAsString();var c=a.subjects();if(null!=c){var e=c;var b=a.objectives();for(var d=0;d<e.length;d++){this.params.put(e[d].getValueAsString(),b[d].getValue())}}},appendParam:function(a,b){this.params.put(a,b)},getParam:function(a){return this.params.get(a)},existParam:function(a){return this.params.containsKey(a)},act:function(b){var a=this;var c=setTimeout(function(){clearTimeout(c);b.call(null,a)},0)}});ActionDialect.DIALECT_NAME="ActionDialect";var ActionDialectFactory=Class(DialectFactory,{ctor:function(){DialectFactory.prototype.ctor.call(this);this.metaData=new DialectMetaData(ActionDialect.DIALECT_NAME,"Action Dialect")},getMetaData:function(){return this.metaData},create:function(a){return new ActionDialect(a)}});var PrimitiveSerializer={STUFFTYPE_SUBJECT:"sub",STUFFTYPE_PREDICATE:"pre",STUFFTYPE_OBJECTIVE:"obj",STUFFTYPE_ADVERBIAL:"adv",STUFFTYPE_ATTRIBUTIVE:"att",STUFFTYPE_COMPLEMENT:"com",LITERALBASE_STRING:"string",LITERALBASE_INT:"int",LITERALBASE_UINT:"uint",LITERALBASE_LONG:"long",LITERALBASE_ULONG:"ulong",LITERALBASE_FLOAT:"float",LITERALBASE_BOOL:"bool",LITERALBASE_JSON:"json",LITERALBASE_XML:"xml",KEY_VERSION:"version",KEY_STUFFS:"stuffs",KEY_STUFFTYPE:"type",KEY_STUFFVALUE:"value",KEY_LITERALBASE:"literal",KEY_DIALECT:"dialect",KEY_NAME:"name",KEY_TRACKER:"tracker",read:function(a,p){var c=p[this.KEY_STUFFS];for(var e=0;e<c.length;++e){var j=c[e];var g=j[this.KEY_STUFFTYPE];if(g==this.STUFFTYPE_SUBJECT){var h=new SubjectStuff();this._readValue(h,j);a.commit(h)}else{if(g==this.STUFFTYPE_PREDICATE){var n=new PredicateStuff();this._readValue(n,j);a.commit(n)}else{if(g==this.STUFFTYPE_OBJECTIVE){var f=new ObjectiveStuff();this._readValue(f,j);a.commit(f)}else{if(g==this.STUFFTYPE_ADVERBIAL){var m=new AdverbialStuff();this._readValue(m,j);a.commit(m)}else{if(g==this.STUFFTYPE_ATTRIBUTIVE){var l=new AttributiveStuff();this._readValue(l,j);a.commit(l)}else{if(g==this.STUFFTYPE_COMPLEMENT){var d=new ComplementStuff();this._readValue(d,j);a.commit(d)}}}}}}}var b=p[this.KEY_DIALECT];if(b!==undefined){var o=b[this.KEY_NAME];var k=b[this.KEY_TRACKER];var b=DialectEnumerator.getInstance().createDialect(o,k);if(null!=b){a.capture(b);b.build(a)}else{Logger.w("PrimitiveSerializer","Can't create '"+o+"' dialect.")}}},write:function(g,n){g[this.KEY_VERSION]="1.0";var j=[];var q=n.subjects();if(null!=q){for(var m=0;m<q.length;++m){var w={};w[this.KEY_STUFFTYPE]=this.STUFFTYPE_SUBJECT;this._writeValue(w,q[m]);j.push(w)}}var v=n.predicates();if(null!=v){for(var m=0;m<v.length;++m){var d={};d[this.KEY_STUFFTYPE]=this.STUFFTYPE_PREDICATE;this._writeValue(d,v[m]);j.push(d)}}var f=n.objectives();if(null!=f){for(var m=0;m<f.length;++m){var e={};e[this.KEY_STUFFTYPE]=this.STUFFTYPE_OBJECTIVE;this._writeValue(e,f[m]);j.push(e)}}var l=n.adverbials();if(null!=l){for(var m=0;m<l.length;++m){var u={};u[this.KEY_STUFFTYPE]=this.STUFFTYPE_ADVERBIAL;this._writeValue(u,l[m]);j.push(u)}}var t=n.attributives();if(null!=t){for(var m=0;m<t.length;++m){var u={};u[this.KEY_STUFFTYPE]=this.STUFFTYPE_ATTRIBUTIVE;this._writeValue(u,t[m]);j.push(u)}}var b=n.complements();if(null!=b){for(var m=0;m<b.length;++m){var r={};r[this.KEY_STUFFTYPE]=this.STUFFTYPE_COMPLEMENT;this._writeValue(r,b[m]);j.push(r)}}g[this.KEY_STUFFS]=j;var h=n.getDialect();if(null!=h){var k={};k[this.KEY_NAME]=h.getName();k[this.KEY_TRACKER]=h.getTracker();g[this.KEY_DIALECT]=k}},_readValue:function(a,b){a.setValue(b[this.KEY_STUFFVALUE]);var c=b[this.KEY_LITERALBASE];if(c==this.LITERALBASE_STRING){a.setLiteralBase(LiteralBase.STRING)}else{if(c==this.LITERALBASE_INT||c==this.LITERALBASE_UINT){a.setLiteralBase(LiteralBase.INT)}else{if(c==this.LITERALBASE_LONG||c==this.LITERALBASE_ULONG){a.setLiteralBase(LiteralBase.LONG)}else{if(c==this.LITERALBASE_BOOL){a.setLiteralBase(LiteralBase.BOOL)}else{if(c==this.LITERALBASE_FLOAT){a.setLiteralBase(LiteralBase.FLOAT)}else{if(c==this.LITERALBASE_JSON){a.setLiteralBase(LiteralBase.JSON)}else{if(c==this.LITERALBASE_XML){a.setLiteralBase(LiteralBase.XML)}}}}}}}},_writeValue:function(a,b){a[this.KEY_STUFFVALUE]=b.value;switch(b.literalBase){case LiteralBase.STRING:a[this.KEY_LITERALBASE]=this.LITERALBASE_STRING;break;case LiteralBase.INT:a[this.KEY_LITERALBASE]=this.LITERALBASE_INT;break;case LiteralBase.LONG:a[this.KEY_LITERALBASE]=this.LITERALBASE_LONG;break;case LiteralBase.FLOAT:a[this.KEY_LITERALBASE]=this.LITERALBASE_FLOAT;break;case LiteralBase.BOOL:a[this.KEY_LITERALBASE]=this.LITERALBASE_BOOL;break;case LiteralBase.JSON:a[this.KEY_LITERALBASE]=this.LITERALBASE_JSON;break;case LiteralBase.XML:a[this.KEY_LITERALBASE]=this.LITERALBASE_XML;break;default:break}}};var TalkListener=Class({ctor:function(){},dialogue:function(b,a){},contacted:function(b,a){},quitted:function(b,a){},failed:function(a,b){}});var TalkFailureCode={NOTFOUND_CELLET:100,CALL_FAILED:200,TALK_LOST:300,UNKNOWN:900};var TalkServiceFailure=Class({ctor:function(b,a){this.code=b;this.reason="Error in "+a;this.description="Unknown";switch(b){case TalkFailureCode.NOTFOUND_CELLET:this.description="Server can not find specified cellet";break;case TalkFailureCode.CALL_FAILED:this.description="Network connecting timeout";break;case TalkFailureCode.TALK_LOST:this.description="Lost talk connection";break;default:break}this.sourceDescription="";this.sourceCelletIdentifiers=null},getCode:function(){return this.code},getReason:function(){return this.reason},getDescription:function(){return this.description},getSourceDescription:function(){return this.sourceDescription},setSourceDescription:function(a){this.sourceDescription=a},getSourceCelletIdentifiers:function(){return this.sourceCelletIdentifiers},setSourceCelletIdentifiers:function(a){this.sourceCelletIdentifiers=a}});var SpeakerDelegate=Class({ctor:function(){},onDialogue:function(c,b,a){},onContacted:function(b,a){},onQuitted:function(b,a){},onFailed:function(b,a){}});var SpeakerState={HANGUP:1,CALLING:2,CALLED:3};var Speaker=Class({ctor:function(a,b,c){this.address=a;this.delegate=b;this.identifiers=[];this.wsEnabled=(c!==undefined&&c)?true:false;this.socket=null;this.state=SpeakerState.HANGUP;this.authenticated=false;this.request=null;this.cookie=null;this.secure=(window.location.protocol.toLowerCase().indexOf("https")>=0);this.secretKey=null;this.remoteTag=null;this.tickTime=new Date();this.heartbeat=(this.wsEnabled&&undefined!==window.WebSocket)?120*1000:10*1000;this.ping=0;this.pong=0;this.pingPong=0},call:function(a){if(this.state==SpeakerState.CALLING){return false}if(null!=a){for(var d=0;d<a.length;++d){var c=a[d];if(this.identifiers.indexOf(c)>=0){continue}this.identifiers.push(c)}}if(this.identifiers.length==0){Logger.e("Speaker","Can not find any cellets to call in param 'identifiers'.");return false}this.state=SpeakerState.CALLING;if(this.wsEnabled){if(null!=this.socket){this.socket.close(1000,"Speaker#close")}this.socket=this._createSocket(this.address.getAddress(),this.address.getPort()+1)}if(null==this.socket){var b=this;this.request=Ajax.newCrossDomain(this.address.getAddress(),this.address.getPort()).uri("/talk/int").method("GET").error(b._fireFailed,b).send(function(f,e){b.cookie=e;if(undefined!==f.ver&&f.ver=="1.1"){b._requestQuick(f)}else{b._processInterrogation(f)}})}return true},hangUp:function(){if(null!=this.socket){try{this.socket.close(1000,"Speaker#close")}catch(a){Logger.e("Speaker","Close socket has exception.")}this.socket=null}this.state=SpeakerState.HANGUP;this.remoteTag=null;Logger.d("Speaker","Hang up call.")},speak:function(c,a){if(this.state!=SpeakerState.CALLED){return false}if(this.identifiers.indexOf(c)<0){return false}var b=this;var d={};PrimitiveSerializer.write(d,a);var e={tag:window.nucleus.tag.toString(),identifier:c,primitive:d};if(null!=this.socket){var f={tpt:"dialogue",packet:e};this.socket.send(JSON.stringify(f));if(this.ping==0){this.ping=Date.now()}}else{b.request=Ajax.newCrossDomain(b.address.getAddress(),b.address.getPort()).uri("/talk/dialogue").method("POST").cookie(b.cookie).content(e).error(b._fireFailed,b).send(function(j){var k=j.primitives;if(undefined!==k){for(var g=0;g<k.length;++g){var h=k[g];b._doDialogue(h.identifier,h.primitive)}}else{if(parseInt(j.queue)>0){b.tick()}}if(b.pong==0){b.pong=Date.now();if(b.ping>0){b.pingPong=b.pong-b.ping}}});if(b.ping==0){b.ping=Date.now()}}return true},tick:function(){if(this.state!=SpeakerState.CALLED){return}var a=this;var c=new Date();if(c.getTime()-a.tickTime.getTime()<a.heartbeat){return}if(this.ping>0){this.ping=0;this.pong=0}a.tickTime=c;if(null!=a.socket){var b={tpt:"hb"};Logger.i("Speaker","Heartbeat to keep alive");a.socket.send(JSON.stringify(b))}else{a.request=Ajax.newCrossDomain(a.address.getAddress(),a.address.getPort()).uri("/talk/hb").method("GET").cookie(a.cookie).error(a._fireFailed,a).send(function(f){var g=f.primitives;if(undefined!==g){for(var d=0;d<g.length;++d){var e=g[d];a._doDialogue(e.identifier,e.primitive)}}})}},_createSocket:function(b,d){if(undefined===window.WebSocket){return null}var c=this;var a=null;if(c.secure){a=new WebSocket("wss://"+b+":"+d+"/wss","cell")}else{a=new WebSocket("ws://"+b+":"+d+"/ws","cell")}a.onopen=function(e){c._onSocketOpen(a,e)};a.onclose=function(e){c._onSocketClose(a,e)};a.onmessage=function(e){c._onSocketMessage(a,e)};a.onerror=function(e){c._onSocketError(a,e)};return a},_onSocketOpen:function(a,b){if(a!=this.socket){return}Logger.d("Speaker","_onSocketOpen")},_onSocketClose:function(a,c){if(a!=this.socket){return}Logger.d("Speaker","_onSocketClose");if(this.state==SpeakerState.CALLED){for(var b=0;b<this.identifiers.length;++b){this._fireQuitted(this.identifiers[b])}}else{this._fireFailed(this.socket,HttpErrorCode.STATUS_ERROR)}this.state=SpeakerState.HANGUP;this.remoteTag=null},_onSocketMessage:function(a,e){if(a!=this.socket){return}var f=JSON.parse(e.data);if(f.tpt=="dialogue"){if(this.pong==0){this.pong=Date.now();if(this.ping>0){this.pingPong=this.pong-this.ping}}if(undefined!==f.packet.primitive){this._doDialogue(f.packet.identifier,f.packet.primitive)}else{if(undefined!==f.packet.primitives){for(var c=0,b=f.packet.primitives.length;c<b;++c){var d=f.packet.primitives[c];this._doDialogue(d.identifier,d.primitive)}}}}else{if(f.tpt=="quick"){this._doQuick(f.packet)}else{if(f.tpt=="request"){this._doRequest(f.packet)}else{if(f.tpt=="check"){this.remoteTag=f.packet.tag;this._requestCellets()}else{if(f.tpt=="interrogate"){if(undefined!==f.ver&&f.ver=="1.1"){this._requestQuick(f.packet)}else{this._processInterrogation(f.packet)}}else{Logger.e("Speaker","Unknown message received")}}}}}},_onSocketError:function(a,b){if(a!=this.socket){return}Logger.d("Speaker","_onSocketError");this._fireFailed(this.socket,HttpErrorCode.NETWORK_FAILED)},_processInterrogation:function(d){var b=d.ciphertext;var a=d.key;var c=Base64.decode(b);this.secretKey=a;this._requestCheck(c,a)},_requestCheck:function(b,f){var a=Utils.simpleDecrypt(b,f);var g=[];for(var d=0;d<a.length;++d){g.push(String.fromCharCode(a[d]))}g=g.join("");var j=window.nucleus.tag;var e={plaintext:g,tag:j};if(null!=this.socket){var c={tpt:"check",packet:e};this.socket.send(JSON.stringify(c))}else{var h=this;h.request=Ajax.newCrossDomain(h.address.getAddress(),h.address.getPort()).uri("/talk/check").method("POST").cookie(h.cookie).content(e).error(h._fireFailed,h).send(function(i){h.remoteTag=i.tag;h._requestCellets()})}},_requestQuick:function(c){Logger.d("Speaker","Use 'QUICK' handshake");var l=c.ciphertext;var g=c.key;var b=Base64.decode(l);this.secretKey=g;var a=Utils.simpleDecrypt(b,g);var h=[];for(var d=0;d<a.length;++d){h.push(String.fromCharCode(a[d]))}h=h.join("");var m=window.nucleus.tag.toString();var k=[];for(var d=0;d<this.identifiers.length;++d){var f=this.identifiers[d];k.push(f.toString())}var e={plaintext:h,tag:m,identifiers:k};if(null!=this.socket){var c={tpt:"quick",packet:e};this.socket.send(JSON.stringify(c))}else{var j=this;j.request=Ajax.newCrossDomain(j.address.getAddress(),j.address.getPort()).uri("/talk/quick").method("POST").cookie(j.cookie).content(e).error(j._fireFailed,j).send(function(i){j._doQuick(i)})}},_requestCellets:function(){var a=window.nucleus.tag.toString();for(var d=0;d<this.identifiers.length;++d){var c=this.identifiers[d];var e={identifier:c.toString(),tag:a};if(null!=this.socket){var f={tpt:"request",packet:e};this.socket.send(JSON.stringify(f))}else{var b=this;b.request=Ajax.newCrossDomain(b.address.getAddress(),b.address.getPort()).uri("/talk/request").method("POST").cookie(b.cookie).content(e).error(b._fireFailed,b).send(function(g){b._doRequest(g)})}}},_doRequest:function(b){if(undefined!==b.error){var a=new TalkServiceFailure(TalkFailureCode.NOTFOUND_CELLET,"Speaker");a.setSourceDescription("Can not find cellet '"+b.identifier+"'");a.setSourceCelletIdentifiers(this.identifiers);this.state=SpeakerState.HANGUP;this.delegate.onFailed(this,a)}else{if(this.state==SpeakerState.HANGUP){return}Logger.i("Speaker","Cellet '"+b.identifier+"' has called at "+this.address.getAddress()+":"+(this.address.getPort()+((null!=this.socket)?(this.secure?7:1):0)));this.state=SpeakerState.CALLED;this._fireContacted(b.identifier)}},_doQuick:function(f){if(this.state==SpeakerState.HANGUP){return}var b=f.tag;var a=f.identifiers;if(undefined===f.error){this.remoteTag=b.toString();this.state=SpeakerState.CALLED;for(var e=0;e<a.length;++e){var d=a[e];Logger.i("Speaker","Cellet '"+d+"' has called at "+this.address.getAddress()+":"+(this.address.getPort()+((null!=this.socket)?(this.secure?7:1):0)));this._fireContacted(d)}}else{var c=new TalkServiceFailure(TalkFailureCode.NOTFOUND_CELLET,"Speaker");c.setSourceDescription("Can not find cellet '"+a.toString()+"'");c.setSourceCelletIdentifiers(this.identifiers);this.state=SpeakerState.HANGUP;this.delegate.onFailed(this,c)}},_doDialogue:function(c,b){var a=new Primitive(this.remoteTag);a.setCelletIdentifier(c);PrimitiveSerializer.read(a,b);this._fireDialogue(c,a)},_fireDialogue:function(b,a){this.delegate.onDialogue(this,b,a)},_fireContacted:function(b){var a=this;var d=b.toString();var c=setTimeout(function(){clearTimeout(c);a.delegate.onContacted(a,d)},60)},_fireQuitted:function(a){this.delegate.onQuitted(this,a)},_fireFailed:function(b,c){var a=null;if(c==HttpErrorCode.NETWORK_FAILED){if(this.state==SpeakerState.CALLING){a=new TalkServiceFailure(TalkFailureCode.CALL_FAILED,"Speaker");a.setSourceDescription("Attempt to connect to host timed out")}else{a=new TalkServiceFailure(TalkFailureCode.TALK_LOST,"Speaker");a.setSourceDescription("Attempt to connect to host timed out")}this.state=SpeakerState.HANGUP}else{if(c==HttpErrorCode.STATUS_ERROR){if(this.state==SpeakerState.CALLING){a=new TalkServiceFailure(TalkFailureCode.CALL_FAILED,"Speaker");a.setSourceDescription("Http status error")}else{a=new TalkServiceFailure(TalkFailureCode.TALK_LOST,"Speaker");a.setSourceDescription("Http status error")}this.state=SpeakerState.HANGUP}else{a=new TalkServiceFailure(TalkFailureCode.UNKNOWN,"Speaker");a.setSourceDescription("Unknown");this.state=SpeakerState.HANGUP}}a.setSourceCelletIdentifiers(this.identifiers);this.delegate.onFailed(this,a)}});var _DelegateProxy=Class(SpeakerDelegate,{ctor:function(a){this.service=a},onDialogue:function(b,e,a){var d=this.service.listeners;for(var c=0;c<d.length;++c){d[c].dialogue(e,a)}},onContacted:function(a,d){var c=this.service.listeners;for(var b=0;b<c.length;++b){c[b].contacted(d,a.remoteTag)}},onQuitted:function(a,d){var c=this.service.listeners;for(var b=0;b<c.length;++b){c[b].quitted(d,a.remoteTag)}},onFailed:function(b,a){var d=this.service.listeners;for(var c=0;c<d.length;++c){d[c].failed(b.remoteTag,a)}}});var TalkService=Class(Service,{ctor:function(){TalkService.instance=this;this.daemonTimer=0;this.recallTimer=0;this.listeners=new Array();this.speakers=new Array();this.speakerMap=new HashMap();this.delegateProxy=new _DelegateProxy(this);this.tickTime=10000},startup:function(){var a=new ActionDialectFactory();DialectEnumerator.getInstance().addFactory(a);Logger.i("TalkService","Tick period is "+this.tickTime+" ms");this._tickFunction();return true},shutdown:function(){if(this.daemonTimer>0){clearTimeout(this.daemonTimer);this.daemonTimer=0}if(this.recallTimer>0){clearTimeout(this.recallTimer);this.recallTimer=0}},addListener:function(b){var a=this.listeners.indexOf(b);if(a>=0){return}this.listeners.push(b)},removeListener:function(b){var a=this.listeners.indexOf(b);if(a>=0){this.listeners.splice(a,1)}},hasListener:function(a){return(this.listeners.indexOf(a)>=0)},isWebSocketSupported:function(){return(undefined!==window.WebSocket)},resetHeartbeat:function(c,d){if(d<2000){Logger.w("TalkService","Reset '"+c+"' heartbeat Failed.");return false}if(d<=5000){this.tickTime=5000}else{this.tickTime=10000}clearTimeout(this.daemonTimer);this.daemonTimer=0;var b=this.speakerMap.get(c);if(null!=b){b.heartbeat=d}else{Logger.e("TalkService","Reset '"+c+"' heartbeat Failed. Retrying after 5 seconds ...");var a=this;setTimeout(function(){var e=a.speakerMap.get(c);if(null!=e){e.heartbeat=d}},5000)}Logger.i("TalkService","Reset '"+c+"' heartbeat period is "+d+" ms");this._tickFunction();return true},call:function(a,b,f){for(var e=0;e<a.length;++e){var d=a[e];if(this.speakerMap.containsKey(d)){return false}}var c=new Speaker(b,this.delegateProxy,f);this.speakers.push(c);for(var e=0;e<a.length;++e){var d=a[e];this.speakerMap.put(d,c)}if(!f){this.resetHeartbeat(a[0],5000)}return c.call(a)},tryRecall:function(){if(this.speakers.length==0){return false}var d=[];for(var c=0;c<this.speakers.length;++c){var b=this.speakers[c];if(b.state!=SpeakerState.HANGUP){continue}d.push(b)}if(d.length==0){return false}if(this.recallTimer>0){clearTimeout(this.recallTimer);this.recallTimer=0}var a=this;this.recallTimer=setTimeout(function(){clearTimeout(a.recallTimer);a.recallTimer=0;if(d.length==a.speakers.length){window.nucleus._resetTag()}for(var f=0;f<d.length;++f){var e=d[f];if(e.state!=SpeakerState.CALLED){e.call(null)}}},5000);return true},recall:function(){if(this.speakers.length==0){return false}if(this.recallTimer>0){clearTimeout(this.recallTimer);this.recallTimer=0}for(var c=0;c<this.speakers.length;++c){var b=this.speakers[c];if(b.state!=SpeakerState.CALLED){b.hangUp()}}var a=this;this.recallTimer=setTimeout(function(){clearTimeout(a.recallTimer);a.recallTimer=0;window.nucleus._resetTag();for(var e=0;e<a.speakers.length;++e){var d=a.speakers[e];if(d.state!=SpeakerState.CALLED){d.call(null)}}},5000);return true},hangUp:function(c){var b=this.speakerMap.get(c);if(null!=b){for(var e=0,d=b.identifiers.length;e<d;++e){var f=b.identifiers[e];this.speakerMap.remove(f)}b.hangUp();var a=-1;if((a=this.speakers.indexOf(b))>=0){this.speakers.splice(a,1)}}},talk:function(c,d){var b=this.speakerMap.get(c);if(null!=b){if(undefined!==d.translate){var a=d.translate();if(null!=a){return b.speak(c,a)}else{Logger.e("TalkService","Failed translates dialect to primitive.");return false}}else{return b.speak(c,d)}}else{Logger.w("TalkService","Can not find '"+c+"' cellet in speaker.")}return false},isCalled:function(b){var a=this.speakerMap.get(b);if(null!=a){return(a.state==SpeakerState.CALLED)}return false},getPingPongTime:function(b){var a=this.speakerMap.get(b);if(null!=a){return a.pingPong}return -1},_tickFunction:function(){var a=this;if(a.daemonTimer>0){clearTimeout(a.daemonTimer)}a.daemonTimer=setTimeout(function(){clearTimeout(a.daemonTimer);a.daemonTimer=0;a._exeDaemonTask();a._tickFunction()},a.tickTime)},_exeDaemonTask:function(){if(this.speakers.length>0){for(var a=0;a<this.speakers.length;++a){this.speakers[a].tick()}}}});TalkService.instance=null;TalkService.getInstance=function(){return TalkService.instance};var Nucleus=Class(Service,{version:{major:1,minor:5,revision:1,name:"Journey"},ctor:function(){this.tag=UUID.v4().toString();this.talkService={isCalled:function(){return false}};this.ts=this.talkService},_resetTag:function(){this.tag=UUID.v4().toString()},startup:function(){Logger.i("Nucleus","Cell Cloud "+this.version.major+"."+this.version.minor+"."+this.version.revision+" (Build JavaScript/Web - "+this.version.name+")");Logger.i("Nucleus","Cell Initializing");this.talkService=new TalkService();this.ts=this.talkService;this.talkService.startup();window.service=this.talkService;return true},shutdown:function(){if(null!=this.talkService){this.talkService.shutdown();this.talkService=null;this.ts=null}},activateWSPlugin:function(a,c){var b=document.createElement("script");b.onload=function(){var d=document.createElement("script");d.onload=function(){if(c){setTimeout(c,30)}};d.setAttribute("src",a+"/websocket.js");document.body.appendChild(d)};b.setAttribute("src",a+"/swfobject.js");document.body.appendChild(b);WEB_SOCKET_SWF_LOCATION=a+"/WebSocketMain.swf"}});(function(){window.nucleus=new Nucleus()})();