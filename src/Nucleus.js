/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2016 Cell Cloud Team (www.cellcloud.net)

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
 * 核心类。
 */
var Nucleus = Class(Service, {
	// 版本信息
	version: { major: 1, minor: 3, revision: 10, name: "Journey" },

	ctor: function() {
		this.tag = UUID.v4().toString();

		this.talkService = {
			isCalled: function() { return false; }
		};

		this.ts = this.talkService;
	},

	_resetTag: function() {
		this.tag = UUID.v4().toString();
	},

	startup: function() {
		Logger.i("Nucleus", "Cell Cloud "+ this.version.major
				+ "." + this.version.minor + "." + this.version.revision
				+ " (Build JavaScript/Web - " + this.version.name + ")");

		Logger.i("Nucleus", "Cell Initializing");

		this.talkService = new TalkService();
		this.ts = this.talkService;

		this.talkService.startup();
		window.service = this.talkService;

		return true;
	},

	shutdown: function() {
		if (null != this.talkService) {
			this.talkService.shutdown();
			this.talkService = null;
			this.ts = null;
		}
	},

	activateWSPlugin: function(path, callback) {
		var swfjs = document.createElement("script");

		swfjs.onload = function() {
			var wsjs = document.createElement("script");
			wsjs.onload = function() {
				if (callback) {
					setTimeout(callback, 30);
				}
			};
			wsjs.setAttribute("src", path + "/websocket.js");
			document.body.appendChild(wsjs);
		};

		swfjs.setAttribute("src", path + "/swfobject.js");
		document.body.appendChild(swfjs);

		WEB_SOCKET_SWF_LOCATION = path + "/WebSocketMain.swf";
	}
});

// 创建 Nucleus 单例
(function(){
	window.nucleus = new Nucleus();
})();
