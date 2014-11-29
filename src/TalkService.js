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
		this.listeners = new Array();
		this.speakers = new HashMap();
		this.delegateProxy = new _DelegateProxy(this);

		// 默认 30 秒心跳
		this.heartbeat = 30000;
	},

	startup: function() {
		// 添加方言工厂
		var adf = new ActionDialectFactory();
		DialectEnumerator.getInstance().addFactory(adf);

		// 启动定时任务
		Logger.i("TalkService", "Heartbeat period is " + this.heartbeat + " ms");
		this._hbFunction();

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

		clearTimeout(this.daemonTimer);

		// 重置心跳周期
		this.heartbeat = heartbeat;

		// 重置 Speaker
		var list = this.speakers.values();
		for (var i = 0; i < list.length; ++i) {
			list[i].heartbeat = heartbeat;
		}

		Logger.i("TalkService", "Reset heartbeat period is " + this.heartbeat + " ms");

		// 启动执行
		this._hbFunction();

		return true;
	},

	call: function(identifiers, address, socketEnabled) {
		for (var i = 0; i < identifiers.length; ++i) {
			var identifier = identifiers[i];
			if (this.speakers.containsKey(identifier)) {
				return false;
			}
		}

		var speaker = new Speaker(window.nucleus.tag, address, this.delegateProxy, socketEnabled);
		speaker.heartbeat = this.heartbeat;

		for (var i = 0; i < identifiers.length; ++i) {
			var identifier = identifiers[i];
			this.speakers.put(identifier, speaker);
		}

		return speaker.call(identifiers);
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
		var speaker = this.speakers.get(identifier);
		if (null != speaker) {
			return (speaker.state == SpeakerState.CALLED);
		}
		return false;
	},

	_hbFunction: function() {
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
			self._hbFunction();
		}, self.heartbeat);
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
