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
 * 语素类型。
 * @author Jiangwei Xu
 */
var StuffType = {
	/** 主语 */
	SUBJECT: 1,
	/** 谓语 */
	PREDICATE: 2,
	/** 宾语 */
	OBJECTIVE: 3,
	/** 定语 */
	ATTRIBUTIVE: 4,
	/** 状语 */
	ADVERBIAL: 5,
	/** 补语 */
	COMPLEMENT: 6
};


/**
 * 变量字面意义。
 * @author Jiangwei Xu
 */
var LiteralBase = {
	/** 字符串型。*/
	STRING: 1,
	/** 整数型。*/
	INT: 2,
	/** 长整数型。*/
	LONG: 3,
	/** 浮点类型。*/
	FLOAT: 4,
	/** 布尔型。*/
	BOOL: 5,
	/** JSON 类型。*/
	JSON: 6,
	/** XML 类型。*/
	XML: 7
};


/**
 */
var Stuff = Class({
	ctor: function(type, value, literalBase) {
		this.type = type;
		this.value = null;
		this.literalBase = null;

		if (value !== undefined) {
			this.value = value;

			if (literalBase === undefined) {
				var vt = (typeof value);

				if (vt == 'string') {
					this.literalBase = LiteralBase.STRING;
				}
				else if (vt == 'number') {
					var reg = /^-?\d+$/;
					if (reg.test(value.toString())) {
						this.literalBase = LiteralBase.LONG;
					}
					else {
						this.literalBase = LiteralBase.FLOAT;
					}
				}
				else if (vt == 'boolean') {
					this.literalBase = LiteralBase.BOOL;
				}
				else if (vt == 'object') {
					this.literalBase = LiteralBase.JSON;
				}
			}
		}

		if (literalBase !== undefined) {
			this.literalBase = literalBase;
		}
	},

	// 抽象方法，子类必须覆盖
	clone: function(target) {
		// Nothing
	},

	getType: function() {
		return this.type;
	},

	getValue: function() {
		return this.value;
	},

	getValueAsString: function() {
		if (typeof(this.value) == 'string') {
			return this.value;
		}
		else {
			return this.value.toString();
		}
	},

	getValueAsNumber: function() {
		return Number(this.value);
	},

	getValueAsBool: function() {
		return Boolean(this.value);
	},

	getLiteralBase: function() {
		return this.literalBase;
	},

	setValue: function(value) {
		this.value = value;
	},

	setLiteralBase: function(literalBase) {
		this.literalBase = literalBase;
	}
});
