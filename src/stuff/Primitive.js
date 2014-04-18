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
 * 原语。
 * @author Jiangwei Xu
 */
var Primitive = Class({
	ctor: function(param) {
		if (typeof param == 'string') {
			this.ownerTag = param;
			this.dialect = null;
		}
		else {
			this.dialect = param;
			this.ownerTag = null;
		}

		this.celletIdentifier = null;
		this.subjectList = null;
		this.predicateList = null;
		this.objectiveList = null;
		this.attributiveList = null;
		this.adverbialList = null;
		this.complementList = null;
	},

	getOwnerTag: function() {
		return this.ownerTag;
	},

	setCelletIdentifier: function(celletIdentifier) {
		this.celletIdentifier = celletIdentifier;
		if (null != this.dialect) {
			this.dialect.setCelletIdentifier(celletIdentifier);
		}
	},

	getCelletIdentifier: function() {
		return this.celletIdentifier;
	},

	isDialectal: function() {
		return (null != this.dialect);
	},
	getDialect: function() {
		return this.dialect;
	},

	/**
	 * 设置关联方言。
	 */
	capture: function(dialect) {
		this.dialect = dialect;
		this.dialect.setOwnerTag(this.ownerTag);
		this.dialect.setCelletIdentifier(this.celletIdentifier);
	},

	/**
	 * 提交语素。
	 */
	commit: function(stuff) {
		switch (stuff.type) {
		case StuffType.SUBJECT:
			if (null == this.subjectList)
				this.subjectList = [stuff];
			else
				this.subjectList.push(stuff);
			break;
		case StuffType.PREDICATE:
			if (null == this.predicateList)
				this.predicateList = [stuff];
			else
				this.predicateList.push(stuff);
			break;
		case StuffType.OBJECTIVE:
			if (null == this.objectiveList)
				this.objectiveList = [stuff];
			else
				this.objectiveList.push(stuff);
			break;
		case StuffType.ATTRIBUTIVE:
			if (null == this.attributiveList)
				this.attributiveList = [stuff];
			else
				this.attributiveList.push(stuff);
			break;
		case StuffType.ADVERBIAL:
			if (null == this.adverbialList)
				this.adverbialList = [stuff];
			else
				this.adverbialList.push(stuff);
			break;
		case StuffType.COMPLEMENT:
			if (null == this.complementList)
				this.complementList = [stuff];
			else
				this.complementList.push(stuff);
			break;
		default:
			break;
		}
	},

	subjects: function() {
		return this.subjectList;
	},
	predicates: function() {
		return this.predicateList;
	},
	objectives: function() {
		return this.objectiveList;
	},
	attributives: function() {
		return this.attributiveList;
	},
	adverbials: function() {
		return this.adverbialList;
	},
	complements: function() {
		return this.complementList;
	}
});
