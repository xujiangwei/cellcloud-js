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

/**
 * 会话状态
 */
var SpeakerState = {
	/** 无对话。 */
	HANGUP:  1,

	/** 正在请求服务。 */
	CALLING: 2,

	/** 已经请求服务。 */
	CALLED:  3,

	/** 挂起状态。 */
	SUSPENDED: 4
};


/**
 * 会话器。
 *
 * @author Jiangwei Xu
 */
var Speaker = Class({
	ctor: function(tag, address, delegate, socketEnabled) {
		this.tag = tag;
		this.address = address;
		this.delegate = delegate;
		this.identifiers = [];

		// 是否使用 WebSocket
		this.wsEnabled = (socketEnabled !== undefined && socketEnabled) ? true : false;
		// WebSocket
		this.socket = null;

		// 状态
		this.state = SpeakerState.HANGUP;
		// 是否授权可访问
		this.authenticated = false;

		// Ajax 请求句柄
		this.request = null;
		// Cookie
		this.cookie = null;

		// 远程服务器 Tag
		this.remoteTag = null;

		// tick 时间戳
		this.tickTime = new Date();
		// 使用 Socket 的心跳间隔是 120 秒，使用 HTTP 的心跳间隔是 10 秒
		this.heartbeat = (this.wsEnabled && undefined !== window.WebSocket) ? 120 * 1000 : 10 * 1000;

		// 记录响应时长
		this.ping = 0;
		this.pong = 0;
		this.pingPong = 0;
	},

	call: function(identifiers) {
		if (this.state == SpeakerState.CALLING)
			return false;

		if (null != identifiers) {
			for (var i = 0; i < identifiers.length; ++i) {
				var identifier = identifiers[i];
				if (this.identifiers.indexOf(identifier) >= 0) {
					continue;
				}

				this.identifiers.push(identifier);
			}
		}

		if (this.identifiers.length == 0) {
			Logger.e("Speaker", "Can not find any cellets to call in param 'identifiers'.");
			return false;
		}

		this.state = SpeakerState.CALLING;

		if (this.wsEnabled) {
			if (null != this.socket) {
				if (this.socket.readyState == WebSocket.OPEN) {
					this.socket.close(1000, "Speaker#close");
				}
			}
			// WebSocket 的端口号，是 HTTP 服务端口号 +1
			this.socket = this._createSocket(this.address.getAddress(), this.address.getPort() + 1);
		}

		if (null == this.socket) {
			var self = this;
			this.request = Ajax.newCrossDomain(this.address.getAddress(), this.address.getPort())
				.uri("/talk/int")
				.method("GET")
				.error(self._fireFailed, self)
				.send(function(data, cookie) {
					self.cookie = cookie;
					self._processInterrogation(data);
				});
		}

		return true;
	},

	hangUp: function() {
		// TODO 发送 hang up 到服务器

		if (null != this.socket) {
			try {
				if (this.socket.readyState == WebSocket.OPEN) {
					this.socket.close(1000, "Speaker#close");
				}
			} catch (e) {
				Logger.e("Speaker", "Close socket has exception.");
			}
			this.socket = null;
		}

		this.state = SpeakerState.HANGUP;

		Logger.d("Speaker", "Hang up call.");
	},

	speak: function(identifier, primitive) {
		if (this.state != SpeakerState.CALLED) {
			return false;
		}

		if (this.identifiers.indexOf(identifier) < 0) {
			// 没有找到对应请求的 Cellet
			return false;
		}

		var self = this;
		// 原语 JSON
		var primJSON = {};
		// 将原语写入 JSON 对象
		PrimitiveSerializer.write(primJSON, primitive);
		var content = {
			"tag": self.tag,
			"identifier": identifier,
			"primitive": primJSON
		};

		if (null != this.socket) {
			var data = {
				"tpt": "dialogue",
				"packet": content
			};
			this.socket.send(JSON.stringify(data));

			if (this.ping == 0) {
				this.ping = Date.now();
			}
		}
		else {
			self.request = Ajax.newCrossDomain(self.address.getAddress(), self.address.getPort())
				.uri("/talk/dialogue")
				.method("POST")
				.cookie(self.cookie)
				.content(content)
				.error(self._fireFailed, self)
				.send(function(data) {
					// FIXME 2014/10/03 以下做法无法保证请求效率，进行修改。
					// 判断是否需要进行数据请求
					//if (parseInt(data["queue"]) > 0) {
						// 直接进行数据请求
						//self.tick();

						// FIXME 2014/09/18 判断心跳间隔，如在可控阀值区间，则补偿一次的 tick
						//var t = new Date();
						//if (self.tickTime != null
						//	&& (t.getTime() - self.tickTime.getTime()) >= self.heartbeat) {
						//		self.tick();
						//}
					//}

					/* 数据样本:
					{"primitives":
					   [
						 {
						   "primitive": {"stuffs":[{"value":"This is a test.","type":"sub","literal":"string"}], "version":"1.0"}
						   , "identifier": "DummeyCellet"
						 }
					   ]
					}
					*/
					var primitives = data.primitives;
					if (undefined !== primitives) {
						// 解析数据
						for (var i = 0; i < primitives.length; ++i) {
							var item = primitives[i];
							self._doDialogue(item.identifier, item.primitive);
						}
					}
					else if (parseInt(data.queue) > 0) {
						self.tick();
					}
				});

			if (self.ping == 0) {
				self.ping = Date.now();
			}
		}

		return true;
	},

	tick: function() {
		if (this.state != SpeakerState.CALLED) {
			return;
		}

		var self = this;

		var time = new Date();

		if (time.getTime() - self.tickTime.getTime() < self.heartbeat) {
			return;
		}

		// 重置 ping-pong
		if (this.ping > 0) {
			this.ping = 0;
			this.pong = 0;
		}

		self.tickTime = time;

		if (null != self.socket) {
			var data = {
				tpt: "hb"
			};
			Logger.i("Speaker", "Heartbeat to keep alive");
			self.socket.send(JSON.stringify(data));
		}
		else {
			// 请求心跳
			self.request = Ajax.newCrossDomain(self.address.getAddress(), self.address.getPort())
				.uri("/talk/hb")
				.method("GET")
				.cookie(self.cookie)
				.error(self._fireFailed, self)
				.send(function(data) {
					/* 数据样本:
					{"primitives":
					   [
						 {
						   "primitive": {"stuffs":[{"value":"This is a test.","type":"sub","literal":"string"}], "version":"1.0"}
						   , "identifier": "DummeyCellet"
						 }
					   ]
					}
					*/
					var primitives = data.primitives;
					if (undefined !== primitives) {
						// 解析数据
						for (var i = 0; i < primitives.length; ++i) {
							var item = primitives[i];
							self._doDialogue(item.identifier, item.primitive);
						}
					}
				});
		}
	},

	_createSocket: function(address, port) {
		if (undefined === window.WebSocket) {
			return null;
		}

		var self = this;
		var socket = new WebSocket("ws://" + address + ":" + port + "/ws", "cell");
		socket.onopen = function(event) { self._onSocketOpen(event); };
		socket.onclose = function(event) { self._onSocketClose(event); };
		socket.onmessage = function(event) { self._onSocketMessage(event); };
		socket.onerror = function(event) { self._onSocketError(event); };
		return socket;
	},

	_onSocketOpen: function(event) {
		Logger.d('Speaker', '_onSocketOpen');
	},
	_onSocketClose: function(event) {
		Logger.d('Speaker', '_onSocketClose');

		if (this.state == SpeakerState.CALLED) {
			for (var i = 0; i < this.identifiers.length; ++i) {
				this._fireQuitted(this.identifiers[i]);
			}
		}
		else {
			this._fireFailed(this.socket, HttpErrorCode.STATUS_ERROR);
		}

		this.state = SpeakerState.HANGUP;
	},
	_onSocketMessage: function(event) {
		//Logger.d('Speaker', '_onSocketMessage: ' + event.data);

		var data = JSON.parse(event.data);
		if (data.tpt == "dialogue") {
			// 记录 pong
			if (this.pong == 0) {
				this.pong = Date.now();
				if (this.ping > 0) {
					this.pingPong = this.pong - this.ping;
				}
			}

			if (undefined !== data.packet.primitive) {
				this._doDialogue(data.packet.identifier, data.packet.primitive);
			}
			else if (undefined !== data.packet.primitives) {
				// 解析数据
				for (var i = 0, size = data.packet.primitives.length; i < size; ++i) {
					var item = data.packet.primitives[i];
					this._doDialogue(item.identifier, item.primitive);
				}
			}
		}
		else if (data.tpt == "request") {
			this._doReply(data.packet);
		}
		else if (data.tpt == "check") {
			this.remoteTag = data.packet.tag;
			this._requestCellets();
		}
		else if (data.tpt == 'interrogate') {
			this._processInterrogation(data.packet);
		}
		else {
			Logger.e('Speaker', 'Unknown message received');
		}
	},
	_onSocketError: function(event) {
		Logger.d('Speaker', '_onSocketError');

		this._fireFailed(this.socket, HttpErrorCode.NETWORK_FAILED);
	},

	_processInterrogation: function(data) {
		var ciphertextBase64 = data.ciphertext;	// string
		var key = data.key;		// string
		var ciphertext = Base64.decode(ciphertextBase64);	// string - bytes

		// 请求 Check
		this._requestCheck(ciphertext, key);
	},

	_requestCheck: function(ciphertext, key) {
		// 解密
		var plaintext = Utils.simpleDecrypt(ciphertext, key);	// array - string
		// 将解密之后的数组转为字符串形式
		var text = [];
		for (var i = 0; i < plaintext.length; ++i) {
			text.push(String.fromCharCode(plaintext[i]));
		}
		text = text.join('');

		var tag = this.tag;
		var content = {"plaintext": text, "tag": tag};

		if (null != this.socket) {
			var data = {
				tpt: "check",
				packet: content
			};
			this.socket.send(JSON.stringify(data));
		}
		else {
			var self = this;
			self.request = Ajax.newCrossDomain(self.address.getAddress(), self.address.getPort())
				.uri("/talk/check")
				.method("POST")
				.cookie(self.cookie)
				.content(content)
				.error(self._fireFailed, self)
				.send(function(data) {
					// Tag
					self.remoteTag = data.tag;
					self._requestCellets();
				});
		}
	},

	_requestCellets: function() {
		var tag = this.tag.toString();
		for (var i = 0; i < this.identifiers.length; ++i) {
			var identifier = this.identifiers[i];
			var content = {
				"identifier": identifier.toString(),
				"tag": tag
			};

			if (null != this.socket) {
				var data = {
					tpt: "request",
					packet: content
				};
				this.socket.send(JSON.stringify(data));
			}
			else {
				var self = this;
				self.request = Ajax.newCrossDomain(self.address.getAddress(), self.address.getPort())
					.uri("/talk/request")
					.method("POST")
					.cookie(self.cookie)
					.content(content)
					.error(self._fireFailed, self)
					.send(function(data) {
						self._doReply(data);
					});
			}
		}
	},

	_doReply: function(data) {
		if (undefined !== data.error) {
			// 创建失败
			var failure = new TalkServiceFailure(TalkFailureCode.NOTFOUND_CELLET, "Speaker");
			failure.setSourceDescription("Can not find cellet '" + data.identifier + "'");
			failure.setSourceCelletIdentifiers(this.identifiers);

			this.state = SpeakerState.HANGUP;		// 更新状态

			// 回调失败
			this.delegate.onFailed(this, failure);
		}
		else {
			if (this.state == SpeakerState.HANGUP) {
				// 已经有失败的请求，则不再记录成功的请求
				return;
			}

			Logger.i("Speaker", "Cellet '" + data.identifier + "' has called at " +
					this.address.getAddress() + ":" + (this.address.getPort() + ((null != this.socket) ? 1 : 0)));

			// 更新状态
			this.state = SpeakerState.CALLED;

			// 回调事件
			this._fireContacted(data.identifier);
		}
	},

	_doDialogue: function(identifier, primitiveJson) {
		// 创建原语
		var primitive = new Primitive(this.remoteTag);
		primitive.setCelletIdentifier(identifier);

		// 读取数据
		PrimitiveSerializer.read(primitive, primitiveJson);

		this._fireDialogue(identifier, primitive);
	},

	_fireDialogue: function(identifier, primitive) {
		this.delegate.onDialogue(this, identifier, primitive);
	},
	_fireContacted: function(identifier) {
		this.delegate.onContacted(this, identifier);
	},
	_fireQuitted: function(identifier) {
		this.delegate.onQuitted(this, identifier);
	},
	_fireFailed: function(handler, code) {
		var failure = null;
		if (code == HttpErrorCode.NETWORK_FAILED) {
			if (this.state == SpeakerState.CALLING) {
				failure = new TalkServiceFailure(TalkFailureCode.CALL_FAILED, "Speaker");
				failure.setSourceDescription("Attempt to connect to host timed out");
			}
			else {
				failure = new TalkServiceFailure(TalkFailureCode.TALK_LOST, "Speaker");
				failure.setSourceDescription("Attempt to connect to host timed out");
			}

			// 更新状态
			this.state = SpeakerState.HANGUP;
		}
		else if (code == HttpErrorCode.STATUS_ERROR) {
			if (this.state == SpeakerState.CALLING) {
				failure = new TalkServiceFailure(TalkFailureCode.CALL_FAILED, "Speaker");
				failure.setSourceDescription("Http status error");
			}
			else {
				failure = new TalkServiceFailure(TalkFailureCode.TALK_LOST, "Speaker");
				failure.setSourceDescription("Http status error");
			}

			// 更新状态
			this.state = SpeakerState.HANGUP;
		}
		else {
			failure = new TalkServiceFailure(TalkFailureCode.UNKNOWN, "Speaker");
			failure.setSourceDescription("Unknown");

			// 更新状态
			this.state = SpeakerState.HANGUP;
		}

		// 设置 cellet identifier
		failure.setSourceCelletIdentifiers(this.identifiers);

		this.delegate.onFailed(this, failure);
	}
});
