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

/** 原语方言。
 * 
 * @author Jiangwei Xu
 */
var Dialect = Class({
	ctor: function(name, tracker) {
		this.name = name;
		if (tracker !== undefined)
			this.tracker = tracker;
		else
			this.tracker = "none";
		this.tag = null;
		this.celletIdentifier = null;
	},

	getName: function() {
		return this.name;
	},

	getTracker: function() {
		return this.tracker;
	},

	setOwnerTag: function(tag) {
		this.tag = tag;
	},
	getOwnerTag: function() {
		return this.tag;
	},

	setCelletIdentifier: function(identifier) {
		this.celletIdentifier = identifier;
	},
	getCelletIdentifier: function() {
		return this.celletIdentifier;
	},

	/**
	 * 翻译原语为方言。
	 */
	translate: function() {
		// Nothing
		return null;
	},

	/**
	 * 从原语构建方言。
	 */
	build: function(primitive) {
		// Nothing
	}
});
