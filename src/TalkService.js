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

/** 委派的代理
 */
var _DelegateProxy = Class(SpeakerDelegate, {
	ctor: function(service) {
		this.service = service;
	},

	onDialogue: function(speaker, primitive) {
		var listeners = this.service.listeners;
		for (var i = 0; i < listeners.length; ++i) {
			listeners[i].dialogue(speaker.identifier, primitive);
		}
	},

	onContacted: function(speaker) {
		var listeners = this.service.listeners;
		for (var i = 0; i < listeners.length; ++i) {
			listeners[i].contacted(speaker.identifier, speaker.remoteTag);
		}
	},

	onQuitted: function(speaker) {
		var listeners = this.service.listeners;
		for (var i = 0; i < listeners.length; ++i) {
			listeners[i].quitted(speaker.identifier, speaker.remoteTag);
		}
	},

	onFailed: function(speaker, failure) {
		var listeners = this.service.listeners;
		for (var i = 0; i < listeners.length; ++i) {
			listeners[i].failed(speaker.identifier, speaker.remoteTag, failure);
		}
	}
});

/**
 * 会话服务。
 *
 * @author Jiangwei Xu
 */
var TalkService = Class(Service, {
	ctor: function() {
		TalkService.instance = this;

		this.daemonTimer = 0;
		this.listeners = new Array();
		this.speakers = new HashMap();
		this.delegateProxy = new _DelegateProxy(this);

		// 默认 5 秒心跳
		this.heartbeat = 5000;
	},

	startup: function() {
		// 添加方言工厂
		var adf = new ActionDialectFactory();
		DialectEnumerator.getInstance().addFactory(adf);

		var self = this;

		// 启动定时任务
		Logger.i("TalkService", "Heartbeat period is " + self.heartbeat + " ms");
		self.daemonTimer = setInterval(function() {
				self._exeDaemonTask();
			}, self.heartbeat);
		return true;
	},

	shutdown: function() {
		if (this.daemonTimer > 0) {
			clearInterval(this.daemonTimer);
			this.daemonTimer = 0;
		}
	},

	addListener: function(listener) {
		var index = this.listeners.indexOf(listener);
		if (index >= 0)
			return;

		this.listeners.push(listener);
	},

	removeListener: function(listener) {
		var index = this.listeners.indexOf(listener);
		if (index >= 0) {
			this.listeners.splice(index, 1);
		}
	},

	hasListener: function(listener) {
		return (this.listeners.indexOf(listener) >= 0);
	},

	/** 重置心跳周期。
	 */
	resetHeartbeat: function(heartbeat) {
		if (this.heartbeat == heartbeat || heartbeat < 2000) {
			return false;
		}

		var self = this;

		clearInterval(self.daemonTimer);

		// 重置心跳周期
		self.heartbeat = heartbeat;

		// 重置 Speaker
		var list = self.speakers.values();
		for (var i = 0; i < list.length; ++i) {
			list[i].heartbeat = heartbeat;
		}

		Logger.i("TalkService", "Reset heartbeat period is " + self.heartbeat + " ms");
		self.daemonTimer = setInterval(function() {
				self._exeDaemonTask();
			}, self.heartbeat);
		return true;
	},

	call: function(identifier, address) {
		var speaker = null;
		if (this.speakers.containsKey(identifier)) {
			speaker = this.speakers.get(identifier);
		}
		else {
			speaker = new Speaker(window.nucleus.tag, identifier, this.delegateProxy);
			speaker.heartbeat = this.heartbeat;
			this.speakers.put(identifier, speaker);
		}

		return speaker.call(address);
	},

	hangUp: function(identifier) {
		var speaker = this.speakers.get(identifier);
		if (null != speaker) {
			speaker.hangUp();

			this.speakers.remove(identifier);
		}
	},

	talk: function(identifier, mix) {
		var speaker = this.speakers.get(identifier);
		if (null != speaker) {
			if (undefined !== mix.translate) {
				// 方言转原语
				var primitive = mix.translate();
				if (null != primitive) {
					return speaker.speak(primitive);
				}
				else {
					Logger.e("TalkService", "Failed translates dialect to primitive.");
					return false;
				}
			}
			else {
				// 直接操作原语
				return speaker.speak(mix);
			}
		}

		return false;
	},

	isCalled: function(identifier) {
		var speaker = this.speakers.get(identifier);
		if (null != speaker) {
			return (speaker.state == SpeakerState.CALLED);
		}
		return false;
	},

	_exeDaemonTask: function() {
		// 驱动 Speaker 进行心跳
		if (this.speakers.size() > 0) {
			var list = this.speakers.values();
			for (var i = 0; i < list.length; ++i) {
				list[i].tick();
			}
		}
	}
});

// 实例
TalkService.instance = null;

// 返回单例
TalkService.getInstance = function() {
	return TalkService.instance;
}
