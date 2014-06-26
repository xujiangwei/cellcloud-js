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
 * 核心类。
 */
var Nucleus = Class(Service, {
	ctor: function() {
		this.tag = UUID.v4();
		this.talkService = null;
		this.heartbeat = 5000;
	},

	config: function(config) {
		this.heartbeat = config.heartbeat || 5000;
	},

	startup: function() {
		Logger.i("Nucleus", "Cell Initializing");

		if (null == this.talkService) {
			this.talkService = new TalkService(this.heartbeat);
		}

		this.talkService.startup();
		window.talkService = this.talkService;

		return true;
	},

	shutdown: function() {
		if (null != this.talkService) {
			this.talkService.shutdown();
		}
	}
});

// 创建 Nucleus 单例
(function(){
	window.nucleus = new Nucleus();
})();
