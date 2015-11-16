/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2015 Cell Cloud Team (www.cellcloud.net)

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

	onDialogue: function(speaker, celletIdentifier, primitive) {
		var listeners = this.service.listeners;
		for (var i = 0; i < listeners.length; ++i) {
			listeners[i].dialogue(celletIdentifier, primitive);
		}
	},

	onContacted: function(speaker, celletIdentifier) {
		var listeners = this.service.listeners;
		for (var i = 0; i < listeners.length; ++i) {
			listeners[i].contacted(celletIdentifier, speaker.remoteTag);
		}
	},

	onQuitted: function(speaker, celletIdentifier) {
		var listeners = this.service.listeners;
		for (var i = 0; i < listeners.length; ++i) {
			listeners[i].quitted(celletIdentifier, speaker.remoteTag);
		}
	},

	onFailed: function(speaker, failure) {
		var listeners = this.service.listeners;
		for (var i = 0; i < listeners.length; ++i) {
			listeners[i].failed(speaker.remoteTag, failure);
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
		this.recallTimer = 0;
		this.listeners = new Array();
		this.speakers = new Array();
		this.speakerMap = new HashMap();
		this.delegateProxy = new _DelegateProxy(this);

		// 默认 10 秒一次 tick
		this.tickTime = 10000;
	},

	startup: function() {
		// 添加方言工厂
		var adf = new ActionDialectFactory();
		DialectEnumerator.getInstance().addFactory(adf);

		// 启动定时任务
		Logger.i("TalkService", "Tick period is " + this.tickTime + " ms");
		this._tickFunction();

		return true;
	},

	shutdown: function() {
		if (this.daemonTimer > 0) {
			clearTimeout(this.daemonTimer);
			this.daemonTimer = 0;
		}

		if (this.recallTimer > 0) {
			clearTimeout(this.recallTimer);
			this.recallTimer = 0;
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

	isWebSocketSupported: function() {
		return (undefined !== window.WebSocket);
	},

	/** 重置心跳周期。
	 */
	resetHeartbeat: function(identifier, heartbeat) {
		if (heartbeat < 2000) {
			Logger.w("TalkService", "Reset '"+ identifier +"' heartbeat Failed.");
			return false;
		}
//		if (this.isWebSocketSupported() && heartbeat < 10000) {
//			Logger.w("TalkService", "Reset '"+ identifier +"' heartbeat Failed.");
//			return false;
//		}

		// 如果心跳小于 5 秒，则缩短 tick 间隔
		if (heartbeat <= 5000) {
			this.tickTime = 5000;
		}
		else {
			this.tickTime = 10000;
		}

		clearTimeout(this.daemonTimer);
		this.daemonTimer = 0;

		// 重置 Speaker 心跳
		var speaker = this.speakerMap.get(identifier);
		if (null != speaker) {
			speaker.heartbeat = heartbeat;
		}
		else {
			Logger.e("TalkService", "Reset '"+ identifier +"' heartbeat Failed. Retrying after 5 seconds ...");
			var self = this;
			setTimeout(function() {
				var speaker = self.speakerMap.get(identifier);
				if (null != speaker) {
					speaker.heartbeat = heartbeat;
				}
			}, 5000);
		}

		Logger.i("TalkService", "Reset '" + identifier + "' heartbeat period is " + heartbeat + " ms");

		// 启动执行
		this._tickFunction();

		return true;
	},

	call: function(identifiers, address, socketEnabled) {
		for (var i = 0; i < identifiers.length; ++i) {
			var identifier = identifiers[i];
			if (this.speakerMap.containsKey(identifier)) {
				return false;
			}
		}

		// 创建新的 Speaker
		var speaker = new Speaker(window.nucleus.tag, address, this.delegateProxy, socketEnabled);
		this.speakers.push(speaker);

		for (var i = 0; i < identifiers.length; ++i) {
			var identifier = identifiers[i];
			this.speakerMap.put(identifier, speaker);
		}

		return speaker.call(identifiers);
	},

	recall: function() {
		if (this.speakers.length == 0) {
			return false;
		}

		if (this.recallTimer > 0) {
			return;
		}

		for (var i = 0; i < this.speakers.length; ++i) {
			var speaker = this.speakers[i];
			if (speaker.state != SpeakerState.CALLED) {
				// hang up old speaker
				speaker.hangUp();
			}
		}

		var self = this;
		this.recallTimer = setTimeout(function() {
			clearTimeout(self.recallTimer);
			self.recallTimer = 0;

			for (var i = 0; i < self.speakers.length; ++i) {
				var speaker = self.speakers[i];
				if (speaker.state != SpeakerState.CALLED) {
					// call without ids
					speaker.call(null);
				}
			}
		}, 5000);

		return true;
	},

	hangUp: function(identifier) {
		var speaker = this.speakerMap.get(identifier);
		if (null != speaker) {
			for (var i = 0, size = speaker.identifiers.length; i < size; ++i) {
				var id = speaker.identifiers[i];
				this.speakerMap.remove(id);
			}

			// 执行 hang up
			speaker.hangUp();

			var index = -1;
			if ((index = this.speakers.indexOf(speaker)) >= 0) {
				this.speakers.splice(index, 1);
			}
		}
	},

	talk: function(identifier, mix) {
		var speaker = this.speakerMap.get(identifier);
		if (null != speaker) {
			if (undefined !== mix.translate) {
				// 方言转原语
				var primitive = mix.translate();
				if (null != primitive) {
					return speaker.speak(identifier, primitive);
				}
				else {
					Logger.e("TalkService", "Failed translates dialect to primitive.");
					return false;
				}
			}
			else {
				// 直接操作原语
				return speaker.speak(identifier, mix);
			}
		}
		else {
			Logger.w("TalkService", "Can not find '" + identifier + "' cellet in speaker.");
		}

		return false;
	},

	isCalled: function(identifier) {
		var speaker = this.speakerMap.get(identifier);
		if (null != speaker) {
			return (speaker.state == SpeakerState.CALLED);
		}
		return false;
	},

	getPingPongTime: function(identifier) {
		var speaker = this.speakerMap.get(identifier);
		if (null != speaker) {
			return speaker.pingPong;
		}
		return -1;
	},

	_tickFunction: function() {
		var self = this;

		if (self.daemonTimer > 0) {
			clearTimeout(self.daemonTimer);
		}

		self.daemonTimer = setTimeout(function() {
			clearTimeout(self.daemonTimer);
			self.daemonTimer = 0;

			// 执行任务
			self._exeDaemonTask();

			// 循环执行
			self._tickFunction();
		}, self.tickTime);
	},

	_exeDaemonTask: function() {
		// 驱动 Speaker 进行心跳
		if (this.speakers.length > 0) {
			for (var i = 0; i < this.speakers.length; ++i) {
				this.speakers[i].tick();
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
