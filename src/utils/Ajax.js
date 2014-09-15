/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2014 Cell Cloud Team (www.cellcloud.net)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
-----------------------------------------------------------------------------
*/

/**
 * HTTP 方法
 */
var HttpMethod = {
	// GET
	GET: "GET",

	// POST
	POST: "POST"
};

var HttpErrorCode = {
	// 网络错误
	NETWORK_FAILED: 10101,
	// 访问状态错误
	STATUS_ERROR: 10201
};

/**
 * AJAX 响应数据封装。
 * @author Jiangwei Xu
 */
var AjaxResponse = Class({
	ctor: function(status, data) {
		this.status = status;
		this.data = data;
	},

	getStatus: function() {
		return this.status;
	},

	getData: function() {
		return this.data;
	}
});

/**
 * AJAX 请求操作封装。
 * @author Jiangwei Xu
 */
var AjaxRequest = Class({
	ctor: function(xmlhttp, url) {
		this._xmlhttp = xmlhttp;
		this._url = url;
		this._method = "GET";
		this._headers = null;
		this._content = null;
	},

	method: function(value) {
		this._method = value;
		return this;
	},

	header: function(name, value) {
		if (null == this._headers)
			this._headers = new HashMap();

		this._headers.put(name, value);
		return this;
	},

	content: function(value) {
		this._content = value;
		return this;
	},

	send: function(responseCallback) {
		// 打开 AJAX 请求
		this._xmlhttp.open(this._method, this._url, true);

		// 处理请求头数据
		if (null != this._headers) {
			var keySet = this._headers.keySet();
			for (var i = 0; i < keySet.length; ++i) {
				var key = keySet[i];
				var value = this._headers.get(key);
				// 设置请求头
				this._xmlhttp.setRequestHeader(key, value);
			}
		}

		this._xmlhttp.setRequestHeader("Content-Type", "application/json");

		if (undefined !== responseCallback) {
			var _xh = this._xmlhttp;
			_xh.onreadystatechange = function() {
				if (_xh.readyState == 4) {
					var reponse = new AjaxResponse(_xh.status, _xh.responseText);
					responseCallback.call(null, reponse);
				}
			};
		}

		// 发送请求
		this._xmlhttp.send();
	}
});


/**
 * AJAX 跨域访问。
 */
var AjaxCrossDomainRequest = Class({
	ctor: function(address, port) {
		this._address = address;
		this._port = port;
		this._uri = "";
		this._method = "GET";
		this._cookie = null;
		this._headers = null;
		this._content = null;
		this._error = null;
		this._errorContext = null;

		// 请求数据是否完成
		this._completed = false;

		// 时间戳
		this._timestamp = new Date();
	},

	uri: function(value) {
		this._uri = value;
		return this;
	},

	method: function(value) {
		this._method = value;
		return this;
	},

	content: function(value) {
		this._content = value;
		return this;
	},

	cookie: function(value) {
		this._cookie = value;
		return this;
	},

	error: function(value, ctx) {
		this._error = value;
		this._errorContext = (ctx !== undefined) ? ctx : null;
		return this;
	},

	send: function(responseCallback) {
		AjaxController.execute(this, responseCallback);
		return this;
	},

	_execute: function(responseCallback) {
		var time = this._timestamp.getTime();
		var param = ["?u=", this._uri, "&m=", this._method, "&c=_cc_ajax_cb"
			, "&t=", time];

		// 添加 Content
		if (this._content != null) {
			var jsonstr = null;
			if (typeof this._content == "string") {
				jsonstr = this._content;
			}
			else {
				jsonstr = JSON.stringify(this._content);
			}
			// 添加 Body 数据
			param.push("&b=", escape(jsonstr));
		}

		// 添加 Cookie
		if (this._cookie != null) {
			param.push("&_cookie=", escape(this._cookie));
		}
		// URL
		var src = "http://" + this._address + ":" + this._port + "/cccd.js" + param.join("");

		var self = this;

		if (undefined !== responseCallback) {
			_cc_ajax_map.put(time, {request:self, callback:responseCallback});
		}

		var scriptDom = document.getElementById("cccd");
		if (scriptDom != null) {
			document.body.removeChild(scriptDom);
			scriptDom = null;
		}
		if (null == scriptDom) {
			scriptDom = document.createElement("script");
			scriptDom.setAttribute("type", "text/javascript");
			scriptDom.setAttribute("id", "cccd");

			if (scriptDom.addEventListener) {
				scriptDom.addEventListener("error", function(e) { self._onError(e); }, false);
				scriptDom.addEventListener("load", function(e) { self._onLoad(e); }, false);
			}
			else if (scriptDom.attachEvent) {
				scriptDom.attachEvent("onerror", function(e) { self._onError(e); });
				scriptDom.attachEvent("onload", function(e) { self._onLoad(e); });
			}

			scriptDom.src = src;
			document.body.appendChild(scriptDom);
		}

		return this;
	},

	_onLoad: function(e) {
		AjaxController.notifyCompleted(this);
	},
	_onError: function(e) {
		if (null != this._error) {
			if (e !== undefined) {
				this._error.call(this._errorContext, this, HttpErrorCode.NETWORK_FAILED);
			}
			else {
				this._error.call(this._errorContext, this, HttpErrorCode.STATUS_ERROR);
			}
		}

		// 标记为完成
		this._completed = true;
		// 清理 Map
		_cc_ajax_map.remove(this._timestamp.getTime());

		AjaxController.notifyCompleted(this);
	}
});

// Key : timestamp, Value : {request, callback}
var _cc_ajax_map = new HashMap();
var _cc_ajax_cb = function(time, response, cookie) {
	if (undefined !== cookie) {
		// 新 Cookie
		console.log("default ajax callback, cookie: " + cookie);
	}
	else {
		// 没有新 Cookie
		//console.log("default ajax callback, no cookie");
	}

	var obj = _cc_ajax_map.get(time);
	if (null != obj) {
		var r = obj.request;
		var cb = obj.callback;

		cb.call(null, response, cookie);
		_cc_ajax_map.remove(time);

		// 标记为完成
		r._completed = true;

		AjaxController.notifyCompleted(r);
	}
};

/**
 * 跨域请求数据中心。
 */
var AjaxController = {
	timer: 0,
	lastRequest: null,
	requestQueue: [],
	callbackQueue: [],

	// 浏览器完成事件调用的“完成”通知
	notifyCompleted: function(request) {
		// TODO
	},

	execute: function(request, responseCallback) {
		this.requestQueue.push(request);
		this.callbackQueue.push(responseCallback);
	}
};
// 启动定时器
AjaxController.timer = setInterval(function() {
	var requestQueue = AjaxController.requestQueue;
	if (requestQueue.length > 0) {
		var callbackQueue = AjaxController.callbackQueue;

		// 根据上一次请求判断
		if (null != AjaxController.lastRequest) {
			// 判断是否完成
			if (AjaxController.lastRequest._completed) {
				// 出队
				var r = requestQueue.shift();
				var cb = callbackQueue.shift();

				AjaxController.lastRequest = r;

				// 执行
				r._execute(cb);
			}
		}
		else {
			// 出队
			var r = requestQueue.shift();
			var cb = callbackQueue.shift();

			AjaxController.lastRequest = r;

			// 执行
			r._execute(cb);
		}
	}
}, 500);

/**
 * AJAX
 */
var Ajax = {
	newRequest: function(url) {
		var xmlhttp = null;
		if (window.XMLHttpRequest) {
			// code for IE7+, Firefox, Chrome, Opera, Safari
			xmlhttp = new XMLHttpRequest();
		}
		else {
			// code for IE6, IE5
			xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
		}

		var request = new AjaxRequest(xmlhttp, url);
		return request;
	},

	newCrossDomain: function(address, port) {
		var request = new AjaxCrossDomainRequest(address, port);
		return request;
	}
};
