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
 * 实用函数库。
 *
 * @author Xu Jiangwei
 */
var Utils = {
	/** 简单加密操作。密钥长度为 8 位。
	 */
	simpleEncrypt: function(aPlaintext, aKey) {
		var plaintext = [];
		for (var i = 0; i < aPlaintext.length; ++i) {
			plaintext.push(aPlaintext.charCodeAt(i) - 256);
		}
		var key = [];
		for (var i = 0; i < aKey.length; ++i) {
			key.push(aKey.charCodeAt(i) - 256);
		}

		if (key.length != 8)
			return null;

		// 运算密钥
		var keyCode = 11 + key[0];
		keyCode -= key[1];
		keyCode += key[2];
		keyCode -= key[3];
		keyCode += key[4];
		keyCode -= key[5];
		keyCode += key[6];
		keyCode -= key[7];

		// 评价
		var cc = (keyCode % 8);
		var parity = (((keyCode % 2) == 0) ? 2 : 1);

		var length = plaintext.length;
		var out = new Array();

		for (var i = 0; i < length; ++i) {
			var c = (plaintext[i] ^ parity);
			var v = (c ^ cc);
			if (v < 0) {
				v += 256;
			}
			out[i] = v;
		}

		return out;
	},

	/** 简单解密操作。密钥长度为 8 位。
	 */
	simpleDecrypt: function(aCiphertext, aKey) {
		var ciphertext = [];
		for (var i = 0; i < aCiphertext.length; ++i) {
			ciphertext.push(aCiphertext.charCodeAt(i) - 256);
		}
		var key = [];
		for (var i = 0; i < aKey.length; ++i) {
			key.push(aKey.charCodeAt(i) - 256);
		}

		if (key.length != 8)
			return null;

		// 运算密钥
		var keyCode = 11 + key[0];
		keyCode -= key[1];
		keyCode += key[2];
		keyCode -= key[3];
		keyCode += key[4];
		keyCode -= key[5];
		keyCode += key[6];
		keyCode -= key[7];

		// 评价
		var cc = (keyCode % 8);
		var parity = (((keyCode % 2) == 0) ? 2 : 1);

		var length = ciphertext.length;
		var out = new Array();

		for (var i = 0; i < length; ++i) {
			var c = (ciphertext[i] ^ cc);
			var v = (c ^ parity);
			if (v < 0) {
				v += 256;
			}
			out[i] = v;
		}

		return out;
	}
};
