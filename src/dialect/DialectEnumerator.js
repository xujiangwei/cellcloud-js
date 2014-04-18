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
 * 方言枚举器。
 * 
 * @author Jiangwei Xu
 */
var DialectEnumerator = Class({
	ctor: function() {
		this.factories = new HashMap();
	},

	createDialect: function(name, tracker) {
		var fact = this.factories.get(name);
		if (null != fact) {
			return fact.create(tracker);
		}
		return null;
	},

	addFactory: function(fact) {
		this.factories.put(fact.getMetaData().name, fact);
	},
	removeFactory: function(fact) {
		this.factories.remove(fact.getMetaData().name);
	},
	getFactory: function(name) {
		return this.factories.get(name);
	}
});


DialectEnumerator.instance = new DialectEnumerator();

DialectEnumerator.getInstance = function() {
	return DialectEnumerator.instance;
}
