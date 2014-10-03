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
	ctor: function(tag, identifier, delegate) {
		this.tag = tag;
		this.identifier = identifier;
		this.delegate = delegate;
		// 状态
		this.state = SpeakerState.HANGUP;
		// 是否授权可访问
		this.authenticated = false;
		// 地址
		this.address = null;
		// Ajax 请求句柄
		this.request = null;
		// Cookie
		this.cookie = null;

		// 远程服务器 Tag
		this.remoteTag = null;

		// tick 时间戳
		this.tickTime = null;
		this.heartbeat = 5000;
	},

	call: function(address) {
		if (this.state == SpeakerState.CALLING)
			return false;

		var self = this;
		this.address = address;
		this.state = SpeakerState.CALLING;

		this.request = Ajax.newCrossDomain(address.getAddress(), address.getPort())
			.uri("/talk/int")
			.method("GET")
			.error(self._fireFailed, self)
			.send(function(data, cookie) {
				self.cookie = cookie;
				self._processInterrogation(data);
			});

		return true;
	},

	hangUp: function() {
		this.state = SpeakerState.HANGUP;
		// TODO
	},

	speak: function(primitive) {
		if (this.state != SpeakerState.CALLED) {
			return false;
		}

		var self = this;
		// 原语 JSON
		var primJSON = {};
		// 将原语写入 JSON 对象
		PrimitiveSerializer.write(primJSON, primitive);
		var content = {
			"tag": self.tag,
			"primitive": primJSON
		};

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

				// 数据样本: "{"primitives":[{"stuffs":[{"value":"This is a test.","type":"sub","literal":"string"}],"version":"1.0"}]}"
				var primitives = data["primitives"];
				if (undefined !== primitives) {
					// 解析数据
					for (var i = 0; i < primitives.length; ++i) {
						self._doDialogue(primitives[i]);
					}
				}
				else if (parseInt(data["queue"]) > 0) {
					self.tick();
				}
			});
	},

	tick: function() {
		if (this.state != SpeakerState.CALLED) {
			return;
		}

		var self = this;

		//self.tickTime = new Date();

		// 请求心跳
		self.request = Ajax.newCrossDomain(self.address.getAddress(), self.address.getPort())
			.uri("/talk/hb")
			.method("GET")
			.cookie(self.cookie)
			.error(self._fireFailed, self)
			.send(function(data) {
				// 数据样本: "{"primitives":[{"stuffs":[{"value":"This is a test.","type":"sub","literal":"string"}],"version":"1.0"}]}"
				var primitives = data["primitives"];
				if (undefined !== primitives) {
					//console.log(JSON.stringify(data));
					// 解析数据
					for (var i = 0; i < primitives.length; ++i) {
						self._doDialogue(primitives[i]);
					}
				}
			});
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

		var self = this;
		var content = {"plaintext" : text};
		self.request = Ajax.newCrossDomain(self.address.getAddress(), self.address.getPort())
			.uri("/talk/check")
			.method("POST")
			.cookie(self.cookie)
			.content(content)
			.error(self._fireFailed, self)
			.send(function(data) {
				// Tag
				self.remoteTag = data.tag;
				self._requestCellet();
			});
	},

	_requestCellet: function() {
		var self = this;
		var content = {
			"identifier": self.identifier,
			"tag": self.tag
		};
		self.request = Ajax.newCrossDomain(self.address.getAddress(), self.address.getPort())
			.uri("/talk/request")
			.method("POST")
			.cookie(self.cookie)
			.content(content)
			.error(self._fireFailed, self)
			.send(function(data) {
				Logger.i("Speaker", "Cellet '" + self.identifier + "' has called at " + self.address.getAddress() + ":" + self.address.getPort());

				// 更新状态
				self.state = SpeakerState.CALLED;

				// 回调事件
				self._fireContacted();
			});
	},

	_doDialogue: function(json) {
		// 创建原语
		var primitive = new Primitive(this.remoteTag);
		primitive.setCelletIdentifier(this.identifier);

		// 读取数据
		PrimitiveSerializer.read(primitive, json);

		this._fireDialogue(primitive);
	},

	_fireDialogue: function(primitive) {
		this.delegate.onDialogue(this, primitive);
	},
	_fireContacted: function() {
		this.delegate.onContacted(this);
	},
	_fireQuitted: function() {
		this.delegate.onQuitted(this);
	},
	_fireFailed: function(request, code) {
		var failure = null;
		if (code == HttpErrorCode.NETWORK_FAILED) {
			if (this.state == SpeakerState.CALLING) {
				failure = new TalkServiceFailure(TalkFailureCode.CALL_FAILED, "Speaker");
				failure.setSourceDescription("Attempt to connect to host timed out");

				// 更新状态
				this.state = SpeakerState.HANGUP;
			}
			else {
				failure = new TalkServiceFailure(TalkFailureCode.TALK_LOST, "Speaker");
				failure.setSourceDescription("Attempt to connect to host timed out");
			}
		}
		else if (code == HttpErrorCode.STATUS_ERROR) {
			if (this.state == SpeakerState.CALLING) {
				failure = new TalkServiceFailure(TalkFailureCode.CALL_FAILED, "Speaker");
				failure.setSourceDescription("Http status error");

				// 更新状态
				this.state = SpeakerState.HANGUP;
			}
			else {
				failure = new TalkServiceFailure(TalkFailureCode.TALK_LOST, "Speaker");
				failure.setSourceDescription("Http status error");
			}
		}
		else {
			failure = new TalkServiceFailure(TalkFailureCode.UNKNOWN, "Speaker");
			failure.setSourceDescription("Unknown");
		}
		// 设置 cellet identifier
		failure.setSourceCelletIdentifier(this.identifier);

		this.delegate.onFailed(this, failure);
	}
});
