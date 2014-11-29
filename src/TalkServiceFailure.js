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
 * 会话故障码。
 *
 * @author Jiangwei Xu
 */
var TalkFailureCode = {
	/** 未找到指定的 Cellet 。 */
	NOTFOUND_CELLET: 100,

	/** Call 一般性失败。 */
	CALL_FAILED: 200,

	/** 连接超时，丢失会话。 */
	TALK_LOST: 300,

	/** 未知故障。 */
	UNKNOWN: 900
};


/**
 * 服务故障描述类。
 * 
 * @author Jiangwei Xu
 */
var TalkServiceFailure = Class({
	ctor: function(code, clazz) {
		this.code = code;
		this.reason = "Error in " + clazz;

		// 描述错误
		this.description = "Unknown";
		switch (code) {
		case TalkFailureCode.NOTFOUND_CELLET:
			this.description = "Server can not find specified cellet";
			break;
		case TalkFailureCode.CALL_FAILED:
			this.description = "Network connecting timeout";
			break;
		case TalkFailureCode.TALK_LOST:
			this.description = "Lost talk connection";
			break;
		default:
			break;
		}

		this.sourceDescription = "";
		this.sourceCelletIdentifiers = null;
	},

	getCode: function() {
		return this.code;
	},

	getReason: function() {
		return this.reason;
	},

	getDescription: function() {
		return this.description;
	},

	getSourceDescription: function() {
		return this.sourceDescription;
	},

	setSourceDescription: function(desc) {
		this.sourceDescription = desc;
	},

	getSourceCelletIdentifiers: function() {
		return this.sourceCelletIdentifiers;
	},

	setSourceCelletIdentifiers: function(celletIdentifierList) {
		this.sourceCelletIdentifiers = celletIdentifierList;
	}
});
