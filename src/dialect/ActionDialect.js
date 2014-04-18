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

/** 动作方言。
 * 
 * @author Jiangwei Xu
 */
var ActionDialect = Class(Dialect, {
	ctor: function(tracker, action) {
		Dialect.prototype.ctor.call(this, ActionDialect.DIALECT_NAME, tracker);
		if (action !== undefined)
			this.action = action;
		else
			this.action = null;
		this.params = new HashMap();
	},

	setAction: function(value) {
		this.action = value;
	},
	getAction: function() {
		return this.action;
	},

	translate: function() {
		if (null == this.action) {
			return null;
		}

		var primitive = new Primitive(this);
		var list = this.params.keySet();
		for (var i = 0; i < list.length; i++) {
			var name = list[i];
			var value = this.params.get(name);

			var nameStuff = new SubjectStuff(name);
			var valueStuff = new ObjectiveStuff(value);
			primitive.commit(nameStuff);
			primitive.commit(valueStuff);
		}

		var actionStuff = new PredicateStuff(this.action);
		primitive.commit(actionStuff);

		return primitive;
	},

	build: function(primitive) {
		this.action = primitive.predicates()[0].getValueAsString();

		var subjects = primitive.subjects();
		if (null != subjects) {
			var names = subjects;
			var values = primitive.objectives();
			for (var i = 0; i < names.length; i++) {
				this.params.put(names[i].getValueAsString(), values[i].getValue());
			}
		}
	},

	/**
	 * 添加动作参数键值对。
	 */
	appendParam: function(name, value) {
		this.params.put(name, value);
	},

	getParam: function(name) {
		return this.params.get(name);
	},

	existParam: function(name) {
		return this.params.containsKey(name);
	},

	act: function(delegate) {
		var self = this;
		var tid = setTimeout(function() {
			clearTimeout(tid);
			delegate.call(null, self);
		}, 0);
	}
});

// 方言名称
ActionDialect.DIALECT_NAME = "ActionDialect";
