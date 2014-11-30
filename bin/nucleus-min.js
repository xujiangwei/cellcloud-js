(function(){var g=this;var n;if(typeof(g.require)=="function"){try{var k=g.require("crypto").randomBytes;n=k&&function(){return k(16)}}catch(v){}}if(!n&&g.crypto&&crypto.getRandomValues){var o=new Uint8Array(16);n=function w(){crypto.getRandomValues(o);return o}}if(!n){var b=new Array(16);n=function(){for(var e=0,y;e<16;e++){if((e&3)===0){y=Math.random()*4294967296}b[e]=y>>>((e&3)<<3)&255}return b}}var s=typeof(g.Buffer)=="function"?g.Buffer:Array;var l=[];var m={};for(var t=0;t<256;t++){l[t]=(t+256).toString(16).substr(1);m[l[t]]=t}function q(A,e,B){var y=(e&&B)||0,z=0;e=e||[];A.toLowerCase().replace(/[0-9a-f]{2}/g,function(i){if(z<16){e[y+z++]=m[i]}});while(z<16){e[y+z++]=0}return e}function p(e,z){var y=z||0,A=l;return A[e[y++]]+A[e[y++]]+A[e[y++]]+A[e[y++]]+"-"+A[e[y++]]+A[e[y++]]+"-"+A[e[y++]]+A[e[y++]]+"-"+A[e[y++]]+A[e[y++]]+"-"+A[e[y++]]+A[e[y++]]+A[e[y++]]+A[e[y++]]+A[e[y++]]+A[e[y++]]}var j=n();var u=[j[0]|1,j[1],j[2],j[3],j[4],j[5]];var x=(j[6]<<8|j[7])&16383;var d=0,r=0;function h(J,z,D){var E=z&&D||0;var F=z||[];J=J||{};var C=J.clockseq!=null?J.clockseq:x;var e=J.msecs!=null?J.msecs:new Date().getTime();var I=J.nsecs!=null?J.nsecs:r+1;var y=(e-d)+(I-r)/10000;if(y<0&&J.clockseq==null){C=C+1&16383}if((y<0||e>d)&&J.nsecs==null){I=0}if(I>=10000){throw new Error("UUID.v1(): Can't create more than 10M uuids/sec")}d=e;r=I;x=C;e+=12219292800000;var H=((e&268435455)*10000+I)%4294967296;F[E++]=H>>>24&255;F[E++]=H>>>16&255;F[E++]=H>>>8&255;F[E++]=H&255;var G=(e/4294967296*10000)&268435455;F[E++]=G>>>8&255;F[E++]=G&255;F[E++]=G>>>24&15|16;F[E++]=G>>>16&255;F[E++]=C>>>8|128;F[E++]=C&255;var B=J.node||u;for(var A=0;A<6;A++){F[E+A]=B[A]}return z?z:p(F)}function c(y,e,C){var z=e&&C||0;if(typeof(y)=="string"){e=y=="binary"?new s(16):null;y=null}y=y||{};var B=y.random||(y.rng||n)();B[6]=(B[6]&15)|64;B[8]=(B[8]&63)|128;if(e){for(var A=0;A<16;A++){e[z+A]=B[A]}}return e||p(B)}var f=c;f.v1=h;f.v4=c;f.parse=q;f.unparse=p;f.BufferClass=s;if(typeof define==="function"&&define.amd){define(function(){return f})}else{if(typeof(module)!="undefined"&&module.exports){module.exports=f}else{var a=g.UUID;f.noConflict=function(){g.UUID=a;return f};g.UUID=f}}}).call(this);(function(q){var i=q.Base64;var e="2.1.4";var r;if(typeof module!=="undefined"&&module.exports){r=require("buffer").Buffer}var o="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";var c=function(B){var A={};for(var z=0,y=B.length;z<y;z++){A[B.charAt(z)]=z}return A}(o);var u=String.fromCharCode;var w=function(z){if(z.length<2){var y=z.charCodeAt(0);return y<128?z:y<2048?(u(192|(y>>>6))+u(128|(y&63))):(u(224|((y>>>12)&15))+u(128|((y>>>6)&63))+u(128|(y&63)))}else{var y=65536+(z.charCodeAt(0)-55296)*1024+(z.charCodeAt(1)-56320);return(u(240|((y>>>18)&7))+u(128|((y>>>12)&63))+u(128|((y>>>6)&63))+u(128|(y&63)))}};var j=/[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;var g=function(y){return y.replace(j,w)};var p=function(B){var A=[0,2,1][B.length%3],y=B.charCodeAt(0)<<16|((B.length>1?B.charCodeAt(1):0)<<8)|((B.length>2?B.charCodeAt(2):0)),z=[o.charAt(y>>>18),o.charAt((y>>>12)&63),A>=2?"=":o.charAt((y>>>6)&63),A>=1?"=":o.charAt(y&63)];return z.join("")};var k=q.btoa?function(y){return q.btoa(y)}:function(y){return y.replace(/[\s\S]{1,3}/g,p)};var n=r?function(y){return(new r(y)).toString("base64")}:function(y){return k(g(y))};var f=function(y,z){return !z?n(y):n(y).replace(/[+\/]/g,function(A){return A=="+"?"-":"_"}).replace(/=/g,"")};var t=function(y){return f(y,true)};var d=new RegExp(["[\xC0-\xDF][\x80-\xBF]","[\xE0-\xEF][\x80-\xBF]{2}","[\xF0-\xF7][\x80-\xBF]{3}"].join("|"),"g");var s=function(A){switch(A.length){case 4:var y=((7&A.charCodeAt(0))<<18)|((63&A.charCodeAt(1))<<12)|((63&A.charCodeAt(2))<<6)|(63&A.charCodeAt(3)),z=y-65536;return(u((z>>>10)+55296)+u((z&1023)+56320));case 3:return u(((15&A.charCodeAt(0))<<12)|((63&A.charCodeAt(1))<<6)|(63&A.charCodeAt(2)));default:return u(((31&A.charCodeAt(0))<<6)|(63&A.charCodeAt(1)))}};var b=function(y){return y.replace(d,s)};var a=function(C){var y=C.length,A=y%4,B=(y>0?c[C.charAt(0)]<<18:0)|(y>1?c[C.charAt(1)]<<12:0)|(y>2?c[C.charAt(2)]<<6:0)|(y>3?c[C.charAt(3)]:0),z=[u(B>>>16),u((B>>>8)&255),u(B&255)];z.length-=[0,0,2,1][A];return z.join("")};var h=q.atob?function(y){return q.atob(y)}:function(y){return y.replace(/[\s\S]{1,4}/g,a)};var v=r?function(y){return(new r(y,"base64")).toString()}:function(y){return b(h(y))};var l=function(y){return v(y.replace(/[-_]/g,function(z){return z=="-"?"+":"/"}).replace(/[^A-Za-z0-9\+\/]/g,""))};var x=function(){var y=q.Base64;q.Base64=i;return y};q.Base64={VERSION:e,atob:h,btoa:k,fromBase64:l,toBase64:f,utob:g,encode:f,encodeURI:t,btou:b,decode:l,noConflict:x};if(typeof Object.defineProperty==="function"){var m=function(y){return{value:y,enumerable:false,writable:true,configurable:true}};q.Base64.extendString=function(){Object.defineProperty(String.prototype,"fromBase64",m(function(){return l(this)}));Object.defineProperty(String.prototype,"toBase64",m(function(y){return f(this,y)}));Object.defineProperty(String.prototype,"toBase64URI",m(function(){return f(this,true)}))}}})(this);function argumentNames(a){var b=a.toString().match(/^[\s\(]*function[^(]*\(([^\)]*)\)/)[1].replace(/\s+/g,"").split(",");return b.length==1&&!b[0]?[]:b}function Class(c,e){if(typeof(c)==="object"){e=c;c=null}function d(){if(c){this.baseprototype=c.prototype}this.ctor.apply(this,arguments)}if(c){var a=function(){};a.prototype=c.prototype;d.prototype=new a();d.prototype.constructor=d}for(var b in e){if(e.hasOwnProperty(b)){if(c&&typeof(e[b])==="function"&&argumentNames(e[b])[0]==="$super"){d.prototype[b]=(function(f,g){return function(){var h=this;$super=function(){return c.prototype[f].apply(h,arguments)};return g.apply(this,Array.prototype.concat.apply($super,arguments))}})(b,e[b])}else{d.prototype[b]=e[b]}}}return d}function HashMap(){var a=0;var b=new Object();this.isEmpty=function(){return a==0};this.containsKey=function(c){return(c in b)};this.containsValue=function(d){for(var c in b){if(b[c]==d){return true}}return false};this.put=function(c,d){if(!this.containsKey(c)){a++}b[c]=d};this.get=function(c){return this.containsKey(c)?b[c]:null};this.remove=function(c){if(this.containsKey(c)&&(delete b[c])){a--}};this.values=function(){var d=new Array();for(var c in b){d.push(b[c])}return d};this.keySet=function(){var d=new Array();for(var c in b){d.push(c)}return d};this.size=function(){return a};this.clear=function(){a=0;b=new Object()}}var Utils={simpleDecrypt:function(k,h){var d=[];for(var g=0;g<k.length;++g){d.push(k.charCodeAt(g)-256)}var m=[];for(var g=0;g<h.length;++g){m.push(h.charCodeAt(g)-256)}if(m.length!=8){return null}var n=11+m[0];n-=m[1];n+=m[2];n-=m[3];n+=m[4];n-=m[5];n+=m[6];n-=m[7];var b=(n%8);var f=(((n%2)==0)?2:1);var a=d.length;var e=new Array();for(var g=0;g<a;++g){var j=(d[g]^b);var l=(j^f);if(l<0){l+=256}e[g]=l}return e}};var HttpMethod={GET:"GET",POST:"POST"};var HttpErrorCode={NETWORK_FAILED:10101,STATUS_ERROR:10201};var AjaxResponse=Class({ctor:function(a,b){this.status=a;this.data=b},getStatus:function(){return this.status},getData:function(){return this.data}});var AjaxRequest=Class({ctor:function(b,a){this._xmlhttp=b;this._url=a;this._method="GET";this._headers=null;this._content=null},method:function(a){this._method=a;return this},header:function(a,b){if(null==this._headers){this._headers=new HashMap()}this._headers.put(a,b);return this},content:function(a){this._content=a;return this},send:function(d){this._xmlhttp.open(this._method,this._url,true);if(null!=this._headers){var a=this._headers.keySet();for(var c=0;c<a.length;++c){var b=a[c];var e=this._headers.get(b);this._xmlhttp.setRequestHeader(b,e)}}this._xmlhttp.setRequestHeader("Content-Type","application/json");if(undefined!==d){var f=this._xmlhttp;f.onreadystatechange=function(){if(f.readyState==4){var g=new AjaxResponse(f.status,f.responseText);d.call(null,g)}}}this._xmlhttp.send()}});var AjaxCrossDomainRequest=Class({ctor:function(a,b){this._address=a;this._port=b;this._uri="";this._method="GET";this._cookie=null;this._headers=null;this._content=null;this._error=null;this._errorContext=null;this._completed=false;this._timestamp=new Date()},uri:function(a){this._uri=a;return this},method:function(a){this._method=a;return this},content:function(a){this._content=a;return this},cookie:function(a){this._cookie=a;return this},error:function(b,a){this._error=b;this._errorContext=(a!==undefined)?a:null;return this},send:function(a){AjaxController.execute(this,a);return this},_execute:function(d){var e=this._timestamp.getTime();var g=["?u=",this._uri,"&m=",this._method,"&c=_cc_ajax_cb","&t=",e];if(this._content!=null){var c=null;if(typeof this._content=="string"){c=this._content}else{c=JSON.stringify(this._content)}g.push("&b=",escape(c))}if(this._cookie!=null){g.push("&_cookie=",escape(this._cookie))}var f="http://"+this._address+":"+this._port+"/cccd.js"+g.join("");var a=this;if(undefined!==d){_cc_ajax_map.put(e,{request:a,callback:d})}var b=document.getElementById("cccd");if(b!=null){document.body.removeChild(b);b=null}if(null==b){b=document.createElement("script");b.setAttribute("type","text/javascript");b.setAttribute("id","cccd");if(b.addEventListener){b.addEventListener("error",function(h){a._onError(h)},false);b.addEventListener("load",function(h){a._onLoad(h)},false)}else{if(b.attachEvent){b.attachEvent("onerror",function(h){a._onError(h)});b.attachEvent("onload",function(h){a._onLoad(h)})}}b.src=f;document.body.appendChild(b)}return this},_onLoad:function(a){AjaxController.notifyCompleted(this)},_onError:function(a){if(null!=this._error){if(a!==undefined){this._error.call(this._errorContext,this,HttpErrorCode.NETWORK_FAILED)}else{this._error.call(this._errorContext,this,HttpErrorCode.STATUS_ERROR)}}this._completed=true;_cc_ajax_map.remove(this._timestamp.getTime());AjaxController.notifyCompleted(this)}});var _cc_ajax_map=new HashMap();var _cc_ajax_cb=function(f,b,c){if(undefined!==c){console.log("default ajax callback, cookie: "+c)}else{}var e=_cc_ajax_map.get(f);if(null!=e){var d=e.request;var a=e.callback;a.call(null,b,c);_cc_ajax_map.remove(f);d._completed=true;AjaxController.notifyCompleted(d)}};var AjaxController={timer:0,lastRequest:null,requestQueue:[],callbackQueue:[],notifyCompleted:function(a){},execute:function(b,a){this.requestQueue.push(b);this.callbackQueue.push(a)}};AjaxController.timer=setInterval(function(){var d=AjaxController.requestQueue;if(d.length>0){var c=AjaxController.callbackQueue;if(null!=AjaxController.lastRequest){if(AjaxController.lastRequest._completed){var b=d.shift();var a=c.shift();AjaxController.lastRequest=b;b._execute(a)}}else{var b=d.shift();var a=c.shift();AjaxController.lastRequest=b;b._execute(a)}}},500);var Ajax={newRequest:function(a){var b=null;if(window.XMLHttpRequest){b=new XMLHttpRequest()}else{b=new ActiveXObject("Microsoft.XMLHTTP")}var c=new AjaxRequest(b,a);return c},newCrossDomain:function(a,b){var c=new AjaxCrossDomainRequest(a,b);return c}};var InetAddress=Class({ctor:function(a,b){this.address=a;this.port=b},getAddress:function(){return this.address},getPort:function(){return this.port}});if(undefined===window.console){window.console={error:function(){},warn:function(){},info:function(){},log:function(){}}}else{if(undefined===window.console.error){window.console.error=window.console.log}if(undefined===window.console.warn){window.console.warn=window.console.log}if(undefined===window.console.info){window.console.info=window.console.log}}var Logger={d:function(a,b){console.log(Logger._printTime()+" [DEBUG] "+a+" - "+b)},i:function(a,b){console.info(Logger._printTime()+" [INFO]  "+a+" - "+b)},w:function(a,b){console.warn(Logger._printTime()+" [WARN]  "+a+" - "+b)},e:function(a,b){console.error(Logger._printTime()+" [ERROR] "+a+" - "+b)},_printTime:function(){var b=new Date();var a=[b.getHours(),":",b.getMinutes(),":",b.getSeconds(),".",b.getMilliseconds()];b=null;return a.join("")}};var Service=Class({ctor:function(){},startup:function(){return false},shutdown:function(){}});var StuffType={SUBJECT:1,PREDICATE:2,OBJECTIVE:3,ATTRIBUTIVE:4,ADVERBIAL:5,COMPLEMENT:6};var LiteralBase={STRING:1,INT:2,LONG:3,FLOAT:4,BOOL:5,JSON:6,XML:7};var Stuff=Class({ctor:function(b,d,c){this.type=b;this.value=null;this.literalBase=null;if(d!==undefined){this.value=d;if(c===undefined){var e=(typeof d);if(e=="string"){this.literalBase=LiteralBase.STRING}else{if(e=="number"){var a=/^-?\d+$/;if(a.test(d.toString())){this.literalBase=LiteralBase.LONG}else{this.literalBase=LiteralBase.FLOAT}}else{if(e=="boolean"){this.literalBase=LiteralBase.BOOL}else{if(e=="object"){this.literalBase=LiteralBase.JSON}}}}}}if(c!==undefined){this.literalBase=c}},clone:function(a){},getType:function(){return this.type},getValue:function(){return this.value},getValueAsString:function(){if(typeof(this.value)=="string"){return this.value}else{return this.value.toString()}},getValueAsNumber:function(){return Number(this.value)},getValueAsBool:function(){return Boolean(this.value)},getLiteralBase:function(){return this.literalBase},setValue:function(a){this.value=a},setLiteralBase:function(a){this.literalBase=a}});var SubjectStuff=Class(Stuff,{ctor:function(b,a){Stuff.prototype.ctor.call(this,StuffType.SUBJECT,b,a)},clone:function(a){if(a.type==StuffType.SUBJECT){a.value=this.value;a.literalBase=this.literalBase}}});var PredicateStuff=Class(Stuff,{ctor:function(b,a){Stuff.prototype.ctor.call(this,StuffType.PREDICATE,b,a)},clone:function(a){if(a.type==StuffType.PREDICATE){a.value=this.value;a.literalBase=this.literalBase}}});var ObjectiveStuff=Class(Stuff,{ctor:function(b,a){Stuff.prototype.ctor.call(this,StuffType.OBJECTIVE,b,a)},clone:function(a){if(a.type==StuffType.OBJECTIVE){a.value=this.value;a.literalBase=this.literalBase}}});var AttributiveStuff=Class(Stuff,{ctor:function(b,a){Stuff.prototype.ctor.call(this,StuffType.ATTRIBUTIVE,b,a)},clone:function(a){if(a.type==StuffType.ATTRIBUTIVE){a.value=this.value;a.literalBase=this.literalBase}}});var AdverbialStuff=Class(Stuff,{ctor:function(b,a){Stuff.prototype.ctor.call(this,StuffType.ADVERBIAL,b,a)},clone:function(a){if(a.type==StuffType.ADVERBIAL){a.value=this.value;a.literalBase=this.literalBase}}});var ComplementStuff=Class(Stuff,{ctor:function(b,a){Stuff.prototype.ctor.call(this,StuffType.COMPLEMENT,b,a)},clone:function(a){if(a.type==StuffType.COMPLEMENT){a.value=this.value;a.literalBase=this.literalBase}}});var Primitive=Class({ctor:function(a){if(typeof a=="string"){this.ownerTag=a;this.dialect=null}else{this.dialect=a;this.ownerTag=null}this.celletIdentifier=null;this.subjectList=null;this.predicateList=null;this.objectiveList=null;this.attributiveList=null;this.adverbialList=null;this.complementList=null},getOwnerTag:function(){return this.ownerTag},setCelletIdentifier:function(a){this.celletIdentifier=a;if(null!=this.dialect){this.dialect.setCelletIdentifier(a)}},getCelletIdentifier:function(){return this.celletIdentifier},isDialectal:function(){return(null!=this.dialect)},getDialect:function(){return this.dialect},capture:function(a){this.dialect=a;this.dialect.setOwnerTag(this.ownerTag);this.dialect.setCelletIdentifier(this.celletIdentifier)},commit:function(a){switch(a.type){case StuffType.SUBJECT:if(null==this.subjectList){this.subjectList=[a]}else{this.subjectList.push(a)}break;case StuffType.PREDICATE:if(null==this.predicateList){this.predicateList=[a]}else{this.predicateList.push(a)}break;case StuffType.OBJECTIVE:if(null==this.objectiveList){this.objectiveList=[a]}else{this.objectiveList.push(a)}break;case StuffType.ATTRIBUTIVE:if(null==this.attributiveList){this.attributiveList=[a]}else{this.attributiveList.push(a)}break;case StuffType.ADVERBIAL:if(null==this.adverbialList){this.adverbialList=[a]}else{this.adverbialList.push(a)}break;case StuffType.COMPLEMENT:if(null==this.complementList){this.complementList=[a]}else{this.complementList.push(a)}break;default:break}},subjects:function(){return this.subjectList},predicates:function(){return this.predicateList},objectives:function(){return this.objectiveList},attributives:function(){return this.attributiveList},adverbials:function(){return this.adverbialList},complements:function(){return this.complementList}});var Dialect=Class({ctor:function(a,b){this.name=a;if(b!==undefined){this.tracker=b}else{this.tracker="none"}this.tag=null;this.celletIdentifier=null},getName:function(){return this.name},getTracker:function(){return this.tracker},setOwnerTag:function(a){this.tag=a},getOwnerTag:function(){return this.tag},setCelletIdentifier:function(a){this.celletIdentifier=a},getCelletIdentifier:function(){return this.celletIdentifier},translate:function(){return null},build:function(a){}});var DialectMetaData=Class({ctor:function(a,b){this.name=a;this.description=b}});var DialectFactory=Class({ctor:function(){},getMetaData:function(){return null},create:function(a){return null}});var DialectEnumerator=Class({ctor:function(){this.factories=new HashMap()},createDialect:function(b,c){var a=this.factories.get(b);if(null!=a){return a.create(c)}return null},addFactory:function(a){this.factories.put(a.getMetaData().name,a)},removeFactory:function(a){this.factories.remove(a.getMetaData().name)},getFactory:function(a){return this.factories.get(a)}});DialectEnumerator.instance=new DialectEnumerator();DialectEnumerator.getInstance=function(){return DialectEnumerator.instance};var ActionDialect=Class(Dialect,{ctor:function(a,b){Dialect.prototype.ctor.call(this,ActionDialect.DIALECT_NAME,a);if(b!==undefined){this.action=b}else{this.action=null}this.params=new HashMap()},setAction:function(a){this.action=a},getAction:function(){return this.action},translate:function(){if(null==this.action){return null}var b=new Primitive(this);var g=this.params.keySet();for(var e=0;e<g.length;e++){var d=g[e];var f=this.params.get(d);var a=new SubjectStuff(d);var c=new ObjectiveStuff(f);b.commit(a);b.commit(c)}var h=new PredicateStuff(this.action);b.commit(h);return b},build:function(a){this.action=a.predicates()[0].getValueAsString();var c=a.subjects();if(null!=c){var e=c;var b=a.objectives();for(var d=0;d<e.length;d++){this.params.put(e[d].getValueAsString(),b[d].getValue())}}},appendParam:function(a,b){this.params.put(a,b)},getParam:function(a){return this.params.get(a)},existParam:function(a){return this.params.containsKey(a)},act:function(b){var a=this;var c=setTimeout(function(){clearTimeout(c);b.call(null,a)},0)}});ActionDialect.DIALECT_NAME="ActionDialect";var ActionDialectFactory=Class(DialectFactory,{ctor:function(){DialectFactory.prototype.ctor.call(this);this.metaData=new DialectMetaData(ActionDialect.DIALECT_NAME,"Action Dialect")},getMetaData:function(){return this.metaData},create:function(a){return new ActionDialect(a)}});var PrimitiveSerializer={STUFFTYPE_SUBJECT:"sub",STUFFTYPE_PREDICATE:"pre",STUFFTYPE_OBJECTIVE:"obj",STUFFTYPE_ADVERBIAL:"adv",STUFFTYPE_ATTRIBUTIVE:"att",STUFFTYPE_COMPLEMENT:"com",LITERALBASE_STRING:"string",LITERALBASE_INT:"int",LITERALBASE_UINT:"uint",LITERALBASE_LONG:"long",LITERALBASE_ULONG:"ulong",LITERALBASE_FLOAT:"float",LITERALBASE_BOOL:"bool",LITERALBASE_JSON:"json",LITERALBASE_XML:"xml",KEY_VERSION:"version",KEY_STUFFS:"stuffs",KEY_STUFFTYPE:"type",KEY_STUFFVALUE:"value",KEY_LITERALBASE:"literal",KEY_DIALECT:"dialect",KEY_NAME:"name",KEY_TRACKER:"tracker",read:function(a,p){var c=p[this.KEY_STUFFS];for(var e=0;e<c.length;++e){var j=c[e];var g=j[this.KEY_STUFFTYPE];if(g==this.STUFFTYPE_SUBJECT){var h=new SubjectStuff();this._readValue(h,j);a.commit(h)}else{if(g==this.STUFFTYPE_PREDICATE){var n=new PredicateStuff();this._readValue(n,j);a.commit(n)}else{if(g==this.STUFFTYPE_OBJECTIVE){var f=new ObjectiveStuff();this._readValue(f,j);a.commit(f)}else{if(g==this.STUFFTYPE_ADVERBIAL){var m=new AdverbialStuff();this._readValue(m,j);a.commit(m)}else{if(g==this.STUFFTYPE_ATTRIBUTIVE){var l=new AttributiveStuff();this._readValue(l,j);a.commit(l)}else{if(g==this.STUFFTYPE_COMPLEMENT){var d=new ComplementStuff();this._readValue(d,j);a.commit(d)}}}}}}}var b=p[this.KEY_DIALECT];if(b!==undefined){var o=b[this.KEY_NAME];var k=b[this.KEY_TRACKER];var b=DialectEnumerator.getInstance().createDialect(o,k);if(null!=b){a.capture(b);b.build(a)}else{Logger.w("PrimitiveSerializer","Can't create '"+o+"' dialect.")}}},write:function(g,n){g[this.KEY_VERSION]="1.0";var j=[];var q=n.subjects();if(null!=q){for(var m=0;m<q.length;++m){var w={};w[this.KEY_STUFFTYPE]=this.STUFFTYPE_SUBJECT;this._writeValue(w,q[m]);j.push(w)}}var v=n.predicates();if(null!=v){for(var m=0;m<v.length;++m){var d={};d[this.KEY_STUFFTYPE]=this.STUFFTYPE_PREDICATE;this._writeValue(d,v[m]);j.push(d)}}var f=n.objectives();if(null!=f){for(var m=0;m<f.length;++m){var e={};e[this.KEY_STUFFTYPE]=this.STUFFTYPE_OBJECTIVE;this._writeValue(e,f[m]);j.push(e)}}var l=n.adverbials();if(null!=l){for(var m=0;m<l.length;++m){var u={};u[this.KEY_STUFFTYPE]=this.STUFFTYPE_ADVERBIAL;this._writeValue(u,l[m]);j.push(u)}}var t=n.attributives();if(null!=t){for(var m=0;m<t.length;++m){var u={};u[this.KEY_STUFFTYPE]=this.STUFFTYPE_ATTRIBUTIVE;this._writeValue(u,t[m]);j.push(u)}}var b=n.complements();if(null!=b){for(var m=0;m<b.length;++m){var r={};r[this.KEY_STUFFTYPE]=this.STUFFTYPE_COMPLEMENT;this._writeValue(r,b[m]);j.push(r)}}g[this.KEY_STUFFS]=j;var h=n.getDialect();if(null!=h){var k={};k[this.KEY_NAME]=h.getName();k[this.KEY_TRACKER]=h.getTracker();g[this.KEY_DIALECT]=k}},_readValue:function(a,b){a.setValue(b[this.KEY_STUFFVALUE]);var c=b[this.KEY_LITERALBASE];if(c==this.LITERALBASE_STRING){a.setLiteralBase(LiteralBase.STRING)}else{if(c==this.LITERALBASE_INT||c==this.LITERALBASE_UINT){a.setLiteralBase(LiteralBase.INT)}else{if(c==this.LITERALBASE_LONG||c==this.LITERALBASE_ULONG){a.setLiteralBase(LiteralBase.LONG)}else{if(c==this.LITERALBASE_BOOL){a.setLiteralBase(LiteralBase.BOOL)}else{if(c==this.LITERALBASE_FLOAT){a.setLiteralBase(LiteralBase.FLOAT)}else{if(c==this.LITERALBASE_JSON){a.setLiteralBase(LiteralBase.JSON)}else{if(c==this.LITERALBASE_XML){a.setLiteralBase(LiteralBase.XML)}}}}}}}},_writeValue:function(a,b){a[this.KEY_STUFFVALUE]=b.value;switch(b.literalBase){case LiteralBase.STRING:a[this.KEY_LITERALBASE]=this.LITERALBASE_STRING;break;case LiteralBase.INT:a[this.KEY_LITERALBASE]=this.LITERALBASE_INT;break;case LiteralBase.LONG:a[this.KEY_LITERALBASE]=this.LITERALBASE_LONG;break;case LiteralBase.FLOAT:a[this.KEY_LITERALBASE]=this.LITERALBASE_FLOAT;break;case LiteralBase.BOOL:a[this.KEY_LITERALBASE]=this.LITERALBASE_BOOL;break;case LiteralBase.JSON:a[this.KEY_LITERALBASE]=this.LITERALBASE_JSON;break;case LiteralBase.XML:a[this.KEY_LITERALBASE]=this.LITERALBASE_XML;break;default:break}}};var TalkListener=Class({ctor:function(){},dialogue:function(b,a){},contacted:function(b,a){},quitted:function(b,a){},failed:function(a,b){}});var TalkFailureCode={NOTFOUND_CELLET:100,CALL_FAILED:200,TALK_LOST:300,UNKNOWN:900};var TalkServiceFailure=Class({ctor:function(b,a){this.code=b;this.reason="Error in "+a;this.description="Unknown";switch(b){case TalkFailureCode.NOTFOUND_CELLET:this.description="Server can not find specified cellet";break;case TalkFailureCode.CALL_FAILED:this.description="Network connecting timeout";break;case TalkFailureCode.TALK_LOST:this.description="Lost talk connection";break;default:break}this.sourceDescription="";this.sourceCelletIdentifiers=null},getCode:function(){return this.code},getReason:function(){return this.reason},getDescription:function(){return this.description},getSourceDescription:function(){return this.sourceDescription},setSourceDescription:function(a){this.sourceDescription=a},getSourceCelletIdentifiers:function(){return this.sourceCelletIdentifiers},setSourceCelletIdentifiers:function(a){this.sourceCelletIdentifiers=a}});var SpeakerDelegate=Class({ctor:function(){},onDialogue:function(c,b,a){},onContacted:function(b,a){},onQuitted:function(b,a){},onFailed:function(b,a){}});var SpeakerState={HANGUP:1,CALLING:2,CALLED:3,SUSPENDED:4};var Speaker=Class({ctor:function(a,b,c,d){this.tag=a;this.address=b;this.delegate=c;this.identifiers=[];this.wsEnabled=(d!==undefined&&d)?true:false;this.socket=null;this.state=SpeakerState.HANGUP;this.authenticated=false;this.request=null;this.cookie=null;this.remoteTag=null;this.tickTime=new Date();this.heartbeat=(d!==undefined&&d)?2*60*1000:5000},call:function(a){if(this.state==SpeakerState.CALLING){return false}if(null!=a){for(var d=0;d<a.length;++d){var c=a[d];if(this.identifiers.indexOf(c)>=0){continue}this.identifiers.push(c)}}if(this.identifiers.length==0){Logger.e("Speaker","Can not find any cellets to call in param 'identifiers'.");return false}this.state=SpeakerState.CALLING;if(this.wsEnabled&&null==this.socket){this._startSocket(this.address.getAddress(),this.address.getPort()+1)}var b=this;if(null!=this.socket){if(this.socket.readyState==1){var e={cell:"interrogate"};this.socket.send(JSON.stringify(e))}}else{this.request=Ajax.newCrossDomain(this.address.getAddress(),this.address.getPort()).uri("/talk/int").method("GET").error(b._fireFailed,b).send(function(g,f){b.cookie=f;b._processInterrogation(g)})}return true},hangUp:function(){this.state=SpeakerState.HANGUP},speak:function(c,a){if(this.state!=SpeakerState.CALLED){return false}if(this.identifiers.indexOf(c)<0){return false}var b=this;var d={};PrimitiveSerializer.write(d,a);var e={tag:b.tag,identifier:c,primitive:d};b.request=Ajax.newCrossDomain(b.address.getAddress(),b.address.getPort()).uri("/talk/dialogue").method("POST").cookie(b.cookie).content(e).error(b._fireFailed,b).send(function(h){var j=h.primitives;if(undefined!==j){for(var f=0;f<j.length;++f){var g=j[f];b._doDialogue(g.identifier,g.primitive)}}else{if(parseInt(h.queue)>0){b.tick()}}});return true},tick:function(){if(this.state!=SpeakerState.CALLED){return}var a=this;var b=new Date();if(b.getTime()-a.tickTime.getTime()<this.heartbeat){return}a.tickTime=b;a.request=Ajax.newCrossDomain(a.address.getAddress(),a.address.getPort()).uri("/talk/hb").method("GET").cookie(a.cookie).error(a._fireFailed,a).send(function(e){var f=e.primitives;if(undefined!==f){for(var c=0;c<f.length;++c){var d=f[c];a._doDialogue(d.identifier,d.primitive)}}})},_startSocket:function(a,c){var b=this;this.socket=new WebSocket("ws://"+a+":"+c+"/ws","cell");this.socket.onopen=function(d){b._onSocketOpen(d)};this.socket.onclose=function(d){b._onSocketClose(d)};this.socket.onmessage=function(d){b._onSocketMessage(d)};this.socket.onerror=function(d){b._onSocketError(d)}},_onSocketOpen:function(a){console.log("_onSocketOpen");var b={cell:"interrogate"};this.socket.send(JSON.stringify(b))},_onSocketClose:function(a){console.log("_onSocketClose")},_onSocketMessage:function(a){console.log("_onSocketMessage: "+a.data)},_onSocketError:function(a){console.log("_onSocketError")},_processInterrogation:function(d){var b=d.ciphertext;var a=d.key;var c=Base64.decode(b);this._requestCheck(c,a)},_requestCheck:function(f,c){var e=Utils.simpleDecrypt(f,c);var g=[];for(var b=0;b<e.length;++b){g.push(String.fromCharCode(e[b]))}g=g.join("");var a=this;var d={plaintext:g,tag:a.tag};a.request=Ajax.newCrossDomain(a.address.getAddress(),a.address.getPort()).uri("/talk/check").method("POST").cookie(a.cookie).content(d).error(a._fireFailed,a).send(function(h){a.remoteTag=h.tag;a._requestCellets()})},_requestCellets:function(){var a=this;for(var c=0;c<a.identifiers.length;++c){var b=a.identifiers[c];var d={identifier:b.toString(),tag:a.tag};a.request=Ajax.newCrossDomain(a.address.getAddress(),a.address.getPort()).uri("/talk/request").method("POST").cookie(a.cookie).content(d).error(a._fireFailed,a).send(function(f){if(undefined!==f.error){var e=new TalkServiceFailure(TalkFailureCode.NOTFOUND_CELLET,"Speaker");e.setSourceDescription("Can not find cellet '"+f.identifier+"'");e.setSourceCelletIdentifiers(a.identifiers);a.state=SpeakerState.HANGUP;a.delegate.onFailed(a,e)}else{if(a.state==SpeakerState.HANGUP){return}Logger.i("Speaker","Cellet '"+f.identifier+"' has called at "+a.address.getAddress()+":"+a.address.getPort());a.state=SpeakerState.CALLED;a._fireContacted(f.identifier)}})}},_doDialogue:function(c,b){var a=new Primitive(this.remoteTag);a.setCelletIdentifier(c);PrimitiveSerializer.read(a,b);this._fireDialogue(c,a)},_fireDialogue:function(b,a){this.delegate.onDialogue(this,b,a)},_fireContacted:function(a){this.delegate.onContacted(this,a)},_fireQuitted:function(a){this.delegate.onQuitted(this,a)},_fireFailed:function(c,b){var a=null;if(b==HttpErrorCode.NETWORK_FAILED){if(this.state==SpeakerState.CALLING){a=new TalkServiceFailure(TalkFailureCode.CALL_FAILED,"Speaker");a.setSourceDescription("Attempt to connect to host timed out")}else{a=new TalkServiceFailure(TalkFailureCode.TALK_LOST,"Speaker");a.setSourceDescription("Attempt to connect to host timed out")}this.state=SpeakerState.HANGUP}else{if(b==HttpErrorCode.STATUS_ERROR){if(this.state==SpeakerState.CALLING){a=new TalkServiceFailure(TalkFailureCode.CALL_FAILED,"Speaker");a.setSourceDescription("Http status error")}else{a=new TalkServiceFailure(TalkFailureCode.TALK_LOST,"Speaker");a.setSourceDescription("Http status error")}this.state=SpeakerState.HANGUP}else{a=new TalkServiceFailure(TalkFailureCode.UNKNOWN,"Speaker");a.setSourceDescription("Unknown");this.state=SpeakerState.HANGUP}}a.setSourceCelletIdentifiers(this.identifiers);this.delegate.onFailed(this,a)}});var _DelegateProxy=Class(SpeakerDelegate,{ctor:function(a){this.service=a},onDialogue:function(b,e,a){var d=this.service.listeners;for(var c=0;c<d.length;++c){d[c].dialogue(e,a)}},onContacted:function(a,d){var c=this.service.listeners;for(var b=0;b<c.length;++b){c[b].contacted(d,a.remoteTag)}},onQuitted:function(a,d){var c=this.service.listeners;for(var b=0;b<c.length;++b){c[b].quitted(d,a.remoteTag)}},onFailed:function(b,a){var d=this.service.listeners;for(var c=0;c<d.length;++c){d[c].failed(b.remoteTag,a)}}});var TalkService=Class(Service,{ctor:function(){TalkService.instance=this;this.daemonTimer=0;this.listeners=new Array();this.speakers=new Array();this.speakerMap=new HashMap();this.delegateProxy=new _DelegateProxy(this);this.tickTime=5000},startup:function(){var a=new ActionDialectFactory();DialectEnumerator.getInstance().addFactory(a);Logger.i("TalkService","Heartbeat period is "+this.heartbeat+" ms");this._tickFunction();return true},shutdown:function(){if(this.daemonTimer>0){clearTimeout(this.daemonTimer);this.daemonTimer=0}},addListener:function(b){var a=this.listeners.indexOf(b);if(a>=0){return}this.listeners.push(b)},removeListener:function(b){var a=this.listeners.indexOf(b);if(a>=0){this.listeners.splice(a,1)}},hasListener:function(a){return(this.listeners.indexOf(a)>=0)},resetHeartbeat:function(b,c){if(c<2000){Logger.w("TalkService","Reset '"+b+"' heartbeat Failed.");return false}if(c<5000){this.tickTime=2000}else{this.tickTime=5000}clearTimeout(this.daemonTimer);this.daemonTimer=0;var a=this.speakerMap.get(b);if(null!=a){a.heartbeat=c}else{Logger.e("TalkService","Reset '"+b+"' heartbeat Failed")}Logger.i("TalkService","Reset '"+b+"' heartbeat period is "+c+" ms");this._tickFunction();return true},call:function(a,b,f){for(var e=0;e<a.length;++e){var d=a[e];if(this.speakerMap.containsKey(d)){return false}}var c=new Speaker(window.nucleus.tag,b,this.delegateProxy,f);this.speakers.push(c);for(var e=0;e<a.length;++e){var d=a[e];this.speakerMap.put(d,c)}return c.call(a)},recall:function(){if(this.speakers.length==0){return false}for(var b=0;b<this.speakers.length;++b){var a=this.speakers[b];if(a.state!=SpeakerState.CALLED){a.call(null)}}return true},hangUp:function(c){var b=this.speakerMap.get(c);if(null!=b){b.hangUp();for(var e=0,d=b.identifiers.length;e<d;++e){var f=b.identifiers[e];this.speakerMap.remove(f)}var a=-1;if((a=this.speakers.indexOf(b))>=0){this.speakers.splice(a,1)}}},talk:function(c,d){var b=this.speakerMap.get(c);if(null!=b){if(undefined!==d.translate){var a=d.translate();if(null!=a){return b.speak(c,a)}else{Logger.e("TalkService","Failed translates dialect to primitive.");return false}}else{return b.speak(c,d)}}else{Logger.w("TalkService","Can not find '"+c+"' cellet in speaker.")}return false},isCalled:function(b){var a=this.speakerMap.get(b);if(null!=a){return(a.state==SpeakerState.CALLED)}return false},_tickFunction:function(){var a=this;if(a.daemonTimer>0){clearTimeout(a.daemonTimer)}a.daemonTimer=setTimeout(function(){clearTimeout(a.daemonTimer);a.daemonTimer=0;a._exeDaemonTask();a._tickFunction()},a.tickTime)},_exeDaemonTask:function(){if(this.speakers.length>0){for(var a=0;a<this.speakers.length;++a){this.speakers[a].tick()}}}});TalkService.instance=null;TalkService.getInstance=function(){return TalkService.instance};var Nucleus=Class(Service,{version:{major:1,minor:1,revision:0,name:"Journey"},ctor:function(){this.tag=UUID.v4();this.talkService=null;this.ts=null;if(undefined!==window.console){window.console.log("Cell Cloud "+this.version.major+"."+this.version.minor+"."+this.version.revision+" (Build JavaScript/Web - "+this.version.name+")")}},startup:function(){Logger.i("Nucleus","Cell Initializing");if(null==this.talkService){this.talkService=new TalkService();this.ts=this.talkService}this.talkService.startup();window.service=this.talkService;return true},shutdown:function(){if(null!=this.talkService){this.talkService.shutdown();this.talkService=null;this.ts=null}}});(function(){window.nucleus=new Nucleus()})();