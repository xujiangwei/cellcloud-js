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
 * 原语序列化器。
 *
 * @author Jiangwei Xu
 */
var PrimitiveSerializer = {
	STUFFTYPE_SUBJECT: "sub",
	STUFFTYPE_PREDICATE: "pre",
	STUFFTYPE_OBJECTIVE: "obj",
	STUFFTYPE_ADVERBIAL: "adv",
	STUFFTYPE_ATTRIBUTIVE: "att",
	STUFFTYPE_COMPLEMENT: "com",

	LITERALBASE_STRING: "string",
	LITERALBASE_INT: "int",
	LITERALBASE_UINT: "uint",
	LITERALBASE_LONG: "long",
	LITERALBASE_ULONG: "ulong",
	LITERALBASE_FLOAT: "float",
	LITERALBASE_BOOL: "bool",
	LITERALBASE_JSON: "json",
	LITERALBASE_XML: "xml",

	KEY_VERSION: "version",
	KEY_STUFFS: "stuffs",
	KEY_STUFFTYPE: "type",
	KEY_STUFFVALUE: "value",
	KEY_LITERALBASE: "literal",
	KEY_DIALECT: "dialect",
	KEY_NAME: "name",
	KEY_TRACKER: "tracker",

	read: function(output, json) {
		var stuffs = json[this.KEY_STUFFS];
		for (var i = 0; i < stuffs.length; ++i) {
			var stuffJSON = stuffs[i];
			var type = stuffJSON[this.KEY_STUFFTYPE];
			if (type == this.STUFFTYPE_SUBJECT) {
				var subject = new SubjectStuff();
				this._readValue(subject, stuffJSON);
				output.commit(subject);
			}
			else if (type == this.STUFFTYPE_PREDICATE) {
				var predicate = new PredicateStuff();
				this._readValue(predicate, stuffJSON);
				output.commit(predicate);
			}
			else if (type == this.STUFFTYPE_OBJECTIVE) {
				var objective = new ObjectiveStuff();
				this._readValue(objective, stuffJSON);
				output.commit(objective);
			}
			else if (type == this.STUFFTYPE_ADVERBIAL) {
				var adverbial = new AdverbialStuff();
				this._readValue(adverbial, stuffJSON);
				output.commit(adverbial);
			}
			else if (type == this.STUFFTYPE_ATTRIBUTIVE) {
				var attributive = new AttributiveStuff();
				this._readValue(attributive, stuffJSON);
				output.commit(attributive);
			}
			else if (type == this.STUFFTYPE_COMPLEMENT) {
				var complement = new ComplementStuff();
				this._readValue(complement, stuffJSON);
				output.commit(complement);
			}
		}

		// 解析方言
		var dialect = json[this.KEY_DIALECT];
		if (dialect !== undefined) {
			var dialectName = dialect[this.KEY_NAME];
			var tracker = dialect[this.KEY_TRACKER];

			// 创建方言
			var dialect = DialectEnumerator.getInstance().createDialect(dialectName, tracker);
			if (null != dialect) {
				// 关联
				output.capture(dialect);

				// 构建数据
				dialect.build(output);
			}
			else {
				Logger.w("PrimitiveSerializer", "Can't create '" +  dialectName + "' dialect.");
			}
		}
	},

	write: function(output, primitive) {
		output[this.KEY_VERSION] = "1.0";

		var stuffs = [];

		var subjects = primitive.subjects();
		if (null != subjects) {
			for (var i = 0; i < subjects.length; ++i) {
				var s = {};
				s[this.KEY_STUFFTYPE] = this.STUFFTYPE_SUBJECT;
				// 写入值
				this._writeValue(s, subjects[i]);
				stuffs.push(s);
			}
		}
		var predicates = primitive.predicates();
		if (null != predicates) {
			for (var i = 0; i < predicates.length; ++i) {
				var p = {};
				p[this.KEY_STUFFTYPE] = this.STUFFTYPE_PREDICATE;
				// 写入值
				this._writeValue(p, predicates[i]);
				stuffs.push(p);
			}
		}
		var objectives = primitive.objectives();
		if (null != objectives) {
			for (var i = 0; i < objectives.length; ++i) {
				var o = {};
				o[this.KEY_STUFFTYPE] = this.STUFFTYPE_OBJECTIVE;
				// 写入值
				this._writeValue(o, objectives[i]);
				stuffs.push(o);
			}
		}
		var adverbials = primitive.adverbials();
		if (null != adverbials) {
			for (var i = 0; i < adverbials.length; ++i) {
				var a = {};
				a[this.KEY_STUFFTYPE] = this.STUFFTYPE_ADVERBIAL;
				// 写入值
				this._writeValue(a, adverbials[i]);
				stuffs.push(a);
			}
		}
		var attributives = primitive.attributives();
		if (null != attributives) {
			for (var i = 0; i < attributives.length; ++i) {
				var a = {};
				a[this.KEY_STUFFTYPE] = this.STUFFTYPE_ATTRIBUTIVE;
				// 写入值
				this._writeValue(a, attributives[i]);
				stuffs.push(a);
			}
		}
		var complements = primitive.complements();
		if (null != complements) {
			for (var i = 0; i < complements.length; ++i) {
				var c = {};
				c[this.KEY_STUFFTYPE] = this.STUFFTYPE_COMPLEMENT;
				// 写入值
				this._writeValue(c, complements[i]);
				stuffs.push(c);
			}
		}

		// 输出语素数组
		output[this.KEY_STUFFS] = stuffs;

		// 方言
		var dialect = primitive.getDialect();
		if (null != dialect) {
			var obj = {};
			obj[this.KEY_NAME] = dialect.getName();
			obj[this.KEY_TRACKER] = dialect.getTracker();
			// 添加方言数据
			output[this.KEY_DIALECT] = obj;
		}
	},

	_readValue: function(output, json) {
		output.setValue(json[this.KEY_STUFFVALUE]);

		var literal = json[this.KEY_LITERALBASE];
		if (literal == this.LITERALBASE_STRING) {
			output.setLiteralBase(LiteralBase.STRING);
		}
		else if (literal == this.LITERALBASE_INT
			|| literal == this.LITERALBASE_UINT) {
			output.setLiteralBase(LiteralBase.INT);
		}
		else if (literal == this.LITERALBASE_LONG
			|| literal == this.LITERALBASE_ULONG) {
			output.setLiteralBase(LiteralBase.LONG);
		}
		else if (literal == this.LITERALBASE_BOOL) {
			output.setLiteralBase(LiteralBase.BOOL);
		}
		else if (literal == this.LITERALBASE_FLOAT) {
			output.setLiteralBase(LiteralBase.FLOAT);
		}
		else if (literal == this.LITERALBASE_JSON) {
			output.setLiteralBase(LiteralBase.JSON);
		}
		else if (literal == this.LITERALBASE_XML) {
			output.setLiteralBase(LiteralBase.XML);
		}
	},

	_writeValue: function(output, stuff) {
		// 值
		output[this.KEY_STUFFVALUE] = stuff.value;

		// 字面义
		switch (stuff.literalBase) {
		case LiteralBase.STRING:
			output[this.KEY_LITERALBASE] = this.LITERALBASE_STRING;
			break;
		case LiteralBase.INT:
			output[this.KEY_LITERALBASE] = this.LITERALBASE_INT;
			break;
		case LiteralBase.LONG:
			output[this.KEY_LITERALBASE] = this.LITERALBASE_LONG;
			break;
		case LiteralBase.FLOAT:
			output[this.KEY_LITERALBASE] = this.LITERALBASE_FLOAT;
			break;
		case LiteralBase.BOOL:
			output[this.KEY_LITERALBASE] = this.LITERALBASE_BOOL;
			break;
		case LiteralBase.JSON:
			output[this.KEY_LITERALBASE] = this.LITERALBASE_JSON;
			break;
		case LiteralBase.XML:
			output[this.KEY_LITERALBASE] = this.LITERALBASE_XML;
			break;
		default:
			break;
		}
	}
};
