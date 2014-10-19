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
//
// Copyright (c) 2010-2012 Robert Kieffer
// MIT License - http://opensource.org/licenses/mit-license.php

(function() {
  var _global = this;

  // Unique ID creation requires a high quality random # generator. We feature
  // detect to determine the best RNG source, normalizing to a function that
  // returns 128-bits of randomness, since that's what's usually required
  var _rng;

  // Node.js crypto-based RNG - http://nodejs.org/docs/v0.6.2/api/crypto.html
  //
  // Moderately fast, high quality
  if (typeof(_global.require) == 'function') {
    try {
      var _rb = _global.require('crypto').randomBytes;
      _rng = _rb && function() {return _rb(16);};
    } catch(e) {}
  }

  if (!_rng && _global.crypto && crypto.getRandomValues) {
    // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
    //
    // Moderately fast, high quality
    var _rnds8 = new Uint8Array(16);
    _rng = function whatwgRNG() {
      crypto.getRandomValues(_rnds8);
      return _rnds8;
    };
  }

  if (!_rng) {
    // Math.random()-based (RNG)
    //
    // If all else fails, use Math.random(). It's fast, but is of unspecified
    // quality.
    var _rnds = new Array(16);
    _rng = function() {
      for (var i = 0, r; i < 16; i++) {
        if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
        _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
      }

      return _rnds;
    };
  }

  // Buffer class to use
  var BufferClass = typeof(_global.Buffer) == 'function' ? _global.Buffer : Array;

  // Maps for number <-> hex string conversion
  var _byteToHex = [];
  var _hexToByte = {};
  for (var i = 0; i < 256; i++) {
    _byteToHex[i] = (i + 0x100).toString(16).substr(1);
    _hexToByte[_byteToHex[i]] = i;
  }

  // **`parse()` - Parse a UUID into it's component bytes**
  function parse(s, buf, offset) {
    var i = (buf && offset) || 0, ii = 0;

    buf = buf || [];
    s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
      if (ii < 16) { // Don't overflow!
        buf[i + ii++] = _hexToByte[oct];
      }
    });

    // Zero out remaining bytes if string was short
    while (ii < 16) {
      buf[i + ii++] = 0;
    }

    return buf;
  }

  // **`unparse()` - Convert UUID byte array (ala parse()) into a string**
  function unparse(buf, offset) {
    var i = offset || 0, bth = _byteToHex;
    return bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]];
  }

  // **`v1()` - Generate time-based UUID**
  //
  // Inspired by https://github.com/LiosK/UUID.js
  // and http://docs.python.org/library/uuid.html

  // random #'s we need to init node and clockseq
  var _seedBytes = _rng();

  // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
  var _nodeId = [
    _seedBytes[0] | 0x01,
    _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
  ];

  // Per 4.2.2, randomize (14 bit) clockseq
  var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

  // Previous uuid creation time
  var _lastMSecs = 0, _lastNSecs = 0;

  // See https://github.com/broofa/node-uuid for API details
  function v1(options, buf, offset) {
    var i = buf && offset || 0;
    var b = buf || [];

    options = options || {};

    var clockseq = options.clockseq != null ? options.clockseq : _clockseq;

    // UUID timestamps are 100 nano-second units since the Gregorian epoch,
    // (1582-10-15 00:00). JSNumbers aren't precise enough for this, so
    // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
    // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
    var msecs = options.msecs != null ? options.msecs : new Date().getTime();

    // Per 4.2.1.2, use count of uuid's generated during the current clock
    // cycle to simulate higher resolution clock
    var nsecs = options.nsecs != null ? options.nsecs : _lastNSecs + 1;

    // Time since last uuid creation (in msecs)
    var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

    // Per 4.2.1.2, Bump clockseq on clock regression
    if (dt < 0 && options.clockseq == null) {
      clockseq = clockseq + 1 & 0x3fff;
    }

    // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
    // time interval
    if ((dt < 0 || msecs > _lastMSecs) && options.nsecs == null) {
      nsecs = 0;
    }

    // Per 4.2.1.2 Throw error if too many uuids are requested
    if (nsecs >= 10000) {
      throw new Error('UUID.v1(): Can\'t create more than 10M uuids/sec');
    }

    _lastMSecs = msecs;
    _lastNSecs = nsecs;
    _clockseq = clockseq;

    // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
    msecs += 12219292800000;

    // `time_low`
    var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
    b[i++] = tl >>> 24 & 0xff;
    b[i++] = tl >>> 16 & 0xff;
    b[i++] = tl >>> 8 & 0xff;
    b[i++] = tl & 0xff;

    // `time_mid`
    var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
    b[i++] = tmh >>> 8 & 0xff;
    b[i++] = tmh & 0xff;

    // `time_high_and_version`
    b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
    b[i++] = tmh >>> 16 & 0xff;

    // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
    b[i++] = clockseq >>> 8 | 0x80;

    // `clock_seq_low`
    b[i++] = clockseq & 0xff;

    // `node`
    var node = options.node || _nodeId;
    for (var n = 0; n < 6; n++) {
      b[i + n] = node[n];
    }

    return buf ? buf : unparse(b);
  }

  // **`v4()` - Generate random UUID**

  // See https://github.com/broofa/node-uuid for API details
  function v4(options, buf, offset) {
    // Deprecated - 'format' argument, as supported in v1.2
    var i = buf && offset || 0;

    if (typeof(options) == 'string') {
      buf = options == 'binary' ? new BufferClass(16) : null;
      options = null;
    }
    options = options || {};

    var rnds = options.random || (options.rng || _rng)();

    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;

    // Copy bytes to buffer, if provided
    if (buf) {
      for (var ii = 0; ii < 16; ii++) {
        buf[i + ii] = rnds[ii];
      }
    }

    return buf || unparse(rnds);
  }

  // Export public API
  var UUID = v4;
  UUID.v1 = v1;
  UUID.v4 = v4;
  UUID.parse = parse;
  UUID.unparse = unparse;
  UUID.BufferClass = BufferClass;

  if (typeof define === 'function' && define.amd) {
    // Publish as AMD module
    define(function() {return UUID;});
  } else if (typeof(module) != 'undefined' && module.exports) {
    // Publish as node.js module
    module.exports = UUID;
  } else {
    // Publish as global (in browsers)
    var _previousRoot = _global.UUID;

    // **`noConflict()` - (browser only) to reset global 'uuid' var**
    UUID.noConflict = function() {
      _global.UUID = _previousRoot;
      return UUID;
    };

    _global.UUID = UUID;
  }
}).call(this);
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
/*
 * $Id: base64.js,v 2.12 2013/05/06 07:54:20 dankogai Exp dankogai $
 *
 *  Licensed under the MIT license.
 *    http://opensource.org/licenses/mit-license
 *
 *  References:
 *    http://en.wikipedia.org/wiki/Base64
 */

(function(global) {
    'use strict';
    // existing version for noConflict()
    var _Base64 = global.Base64;
    var version = "2.1.4";
    // if node.js, we use Buffer
    var buffer;
    if (typeof module !== 'undefined' && module.exports) {
        buffer = require('buffer').Buffer;
    }
    // constants
    var b64chars
        = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var b64tab = function(bin) {
        var t = {};
        for (var i = 0, l = bin.length; i < l; i++) t[bin.charAt(i)] = i;
        return t;
    }(b64chars);
    var fromCharCode = String.fromCharCode;
    // encoder stuff
    var cb_utob = function(c) {
        if (c.length < 2) {
            var cc = c.charCodeAt(0);
            return cc < 0x80 ? c
                : cc < 0x800 ? (fromCharCode(0xc0 | (cc >>> 6))
                                + fromCharCode(0x80 | (cc & 0x3f)))
                : (fromCharCode(0xe0 | ((cc >>> 12) & 0x0f))
                   + fromCharCode(0x80 | ((cc >>>  6) & 0x3f))
                   + fromCharCode(0x80 | ( cc         & 0x3f)));
        } else {
            var cc = 0x10000
                + (c.charCodeAt(0) - 0xD800) * 0x400
                + (c.charCodeAt(1) - 0xDC00);
            return (fromCharCode(0xf0 | ((cc >>> 18) & 0x07))
                    + fromCharCode(0x80 | ((cc >>> 12) & 0x3f))
                    + fromCharCode(0x80 | ((cc >>>  6) & 0x3f))
                    + fromCharCode(0x80 | ( cc         & 0x3f)));
        }
    };
    var re_utob = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;
    var utob = function(u) {
        return u.replace(re_utob, cb_utob);
    };
    var cb_encode = function(ccc) {
        var padlen = [0, 2, 1][ccc.length % 3],
        ord = ccc.charCodeAt(0) << 16
            | ((ccc.length > 1 ? ccc.charCodeAt(1) : 0) << 8)
            | ((ccc.length > 2 ? ccc.charCodeAt(2) : 0)),
        chars = [
            b64chars.charAt( ord >>> 18),
            b64chars.charAt((ord >>> 12) & 63),
            padlen >= 2 ? '=' : b64chars.charAt((ord >>> 6) & 63),
            padlen >= 1 ? '=' : b64chars.charAt(ord & 63)
        ];
        return chars.join('');
    };
    var btoa = global.btoa ? function(b) {
        return global.btoa(b);
    } : function(b) {
        return b.replace(/[\s\S]{1,3}/g, cb_encode);
    };
    var _encode = buffer
        ? function (u) { return (new buffer(u)).toString('base64') } 
    : function (u) { return btoa(utob(u)) }
    ;
    var encode = function(u, urisafe) {
        return !urisafe 
            ? _encode(u)
            : _encode(u).replace(/[+\/]/g, function(m0) {
                return m0 == '+' ? '-' : '_';
            }).replace(/=/g, '');
    };
    var encodeURI = function(u) { return encode(u, true) };
    // decoder stuff
    var re_btou = new RegExp([
        '[\xC0-\xDF][\x80-\xBF]',
        '[\xE0-\xEF][\x80-\xBF]{2}',
        '[\xF0-\xF7][\x80-\xBF]{3}'
    ].join('|'), 'g');
    var cb_btou = function(cccc) {
        switch(cccc.length) {
        case 4:
            var cp = ((0x07 & cccc.charCodeAt(0)) << 18)
                |    ((0x3f & cccc.charCodeAt(1)) << 12)
                |    ((0x3f & cccc.charCodeAt(2)) <<  6)
                |     (0x3f & cccc.charCodeAt(3)),
            offset = cp - 0x10000;
            return (fromCharCode((offset  >>> 10) + 0xD800)
                    + fromCharCode((offset & 0x3FF) + 0xDC00));
        case 3:
            return fromCharCode(
                ((0x0f & cccc.charCodeAt(0)) << 12)
                    | ((0x3f & cccc.charCodeAt(1)) << 6)
                    |  (0x3f & cccc.charCodeAt(2))
            );
        default:
            return  fromCharCode(
                ((0x1f & cccc.charCodeAt(0)) << 6)
                    |  (0x3f & cccc.charCodeAt(1))
            );
        }
    };
    var btou = function(b) {
        return b.replace(re_btou, cb_btou);
    };
    var cb_decode = function(cccc) {
        var len = cccc.length,
        padlen = len % 4,
        n = (len > 0 ? b64tab[cccc.charAt(0)] << 18 : 0)
            | (len > 1 ? b64tab[cccc.charAt(1)] << 12 : 0)
            | (len > 2 ? b64tab[cccc.charAt(2)] <<  6 : 0)
            | (len > 3 ? b64tab[cccc.charAt(3)]       : 0),
        chars = [
            fromCharCode( n >>> 16),
            fromCharCode((n >>>  8) & 0xff),
            fromCharCode( n         & 0xff)
        ];
        chars.length -= [0, 0, 2, 1][padlen];
        return chars.join('');
    };
    var atob = global.atob ? function(a) {
        return global.atob(a);
    } : function(a){
        return a.replace(/[\s\S]{1,4}/g, cb_decode);
    };
    var _decode = buffer
        ? function(a) { return (new buffer(a, 'base64')).toString() }
    : function(a) { return btou(atob(a)) };
    var decode = function(a){
        return _decode(
            a.replace(/[-_]/g, function(m0) { return m0 == '-' ? '+' : '/' })
                .replace(/[^A-Za-z0-9\+\/]/g, '')
        );
    };
    var noConflict = function() {
        var Base64 = global.Base64;
        global.Base64 = _Base64;
        return Base64;
    };
    // export Base64
    global.Base64 = {
        VERSION: version,
        atob: atob,
        btoa: btoa,
        fromBase64: decode,
        toBase64: encode,
        utob: utob,
        encode: encode,
        encodeURI: encodeURI,
        btou: btou,
        decode: decode,
        noConflict: noConflict
    };
    // if ES5 is available, make Base64.extendString() available
    if (typeof Object.defineProperty === 'function') {
        var noEnum = function(v){
            return {value:v,enumerable:false,writable:true,configurable:true};
        };
        global.Base64.extendString = function () {
            Object.defineProperty(
                String.prototype, 'fromBase64', noEnum(function () {
                    return decode(this)
                }));
            Object.defineProperty(
                String.prototype, 'toBase64', noEnum(function (urisafe) {
                    return encode(this, urisafe)
                }));
            Object.defineProperty(
                String.prototype, 'toBase64URI', noEnum(function () {
                    return encode(this, true)
                }));
        };
    }
    // that's it!
})(this);
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

function argumentNames(fn) {
	var names = fn.toString().match(/^[\s\(]*function[^(]*\(([^\)]*)\)/)[1].replace(/\s+/g, '').split(',');
	return names.length == 1 && !names[0] ? [] : names;
}

/**
 * 对象类实用函数。
 */
function Class(baseClass, prop) {
	// 只接受一个参数的情况 - Class(prop)
	if (typeof (baseClass) === "object") {
		prop = baseClass;
		baseClass = null;
	}

	// 本次调用所创建的类（构造函数）
	function F() {
		// 如果父类存在，则实例对象的baseprototype指向父类的原型
		// 这里提供了在实例对象中调用父类方法的途径
		if (baseClass) {
			this.baseprototype = baseClass.prototype;
		}
		this.ctor.apply(this, arguments);
	}

	// 如果此类需要从其它类扩展
	if (baseClass) {
		var middleClass = function() {};
		middleClass.prototype = baseClass.prototype;
		F.prototype = new middleClass();
		F.prototype.constructor = F;
	}

	// 覆盖父类的同名函数
	for (var name in prop) {
		if (prop.hasOwnProperty(name)) {
			// 如果此类继承自父类baseClass并且父类原型中存在同名函数name
			if (baseClass
				&& typeof (prop[name]) === "function"
				&& argumentNames(prop[name])[0] === "$super") {
				// 重定义子类的原型方法prop[name]
				// - 比如$super封装了父类方法的调用，但是调用时的上下文指针要指向当前子类的实例对象
				// - 将$super作为方法调用的第一个参数
				F.prototype[name] = (function(name, fn) {
					return function() {
						var that = this;
						$super = function() {
							return baseClass.prototype[name].apply(that, arguments);
						};
						return fn.apply(this, Array.prototype.concat.apply($super, arguments));
					};
				})(name, prop[name]);
			}
			else {
				F.prototype[name] = prop[name];
			}
		}
	}

	return F;
};
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
 * HashMap 封装。
 */
function HashMap() {
	// 定义长度
	var length = 0;
	// 创建一个对象
	var obj = new Object();

	/**
	 * 判断 Map 是否为空
	 */
	this.isEmpty = function() {
		 return length == 0;
	};
	
	/**
	 * 判断对象中是否包含给定 Key
	 */
	this.containsKey = function(key) {
		return (key in obj);
	};

	/**
	 * 判断对象中是否包含给定的 Value
	 */
	this.containsValue = function(value) {
		for (var key in obj) {
			if (obj[key] == value) {
				return true;
			}
		}
		return false;
	};

	/**
	 * 向 Map 中添加数据
	 */
	this.put = function(key, value) {
		if (!this.containsKey(key)) {
			length++;
		}
		obj[key] = value;
	};

	/**
	 * 根据给定的 Key 获得 Value
	 */
	this.get = function(key) {
		return this.containsKey(key) ? obj[key] : null;
	};

	/**
	 * 根据给定的 Key 删除一个值
	 */
	this.remove = function(key) {
		if (this.containsKey(key) && (delete obj[key])) {
			length--;
		}
	};

	/**
	 * 获得 Map 中的所有 Value
	 */
	this.values = function() {
		var _values = new Array();
		for (var key in obj) {
			_values.push(obj[key]);
		}
		return _values;
	};

	/**
	 * 获得 Map 中的所有 Key
	 */
	this.keySet = function() {
		var _keys = new Array();
		for (var key in obj) {
			_keys.push(key);
		}
		return _keys;
	};

	/**
	 * 获得 Map 的长度
	 */
	this.size = function() {
		return length;
	};

	/**
	 * 清空 Map
	 */
	this.clear = function() {
		length = 0;
		obj = new Object();
	};
}
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
	/** 简单解密。
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
	},

	
};
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
 * HTTP 方法
 */
var HttpMethod = {
	// GET
	GET: "GET",

	// POST
	POST: "POST"
};

var HttpErrorCode = {
	// 网络错误
	NETWORK_FAILED: 10101,
	// 访问状态错误
	STATUS_ERROR: 10201
};

/**
 * AJAX 响应数据封装。
 * @author Jiangwei Xu
 */
var AjaxResponse = Class({
	ctor: function(status, data) {
		this.status = status;
		this.data = data;
	},

	getStatus: function() {
		return this.status;
	},

	getData: function() {
		return this.data;
	}
});

/**
 * AJAX 请求操作封装。
 * @author Jiangwei Xu
 */
var AjaxRequest = Class({
	ctor: function(xmlhttp, url) {
		this._xmlhttp = xmlhttp;
		this._url = url;
		this._method = "GET";
		this._headers = null;
		this._content = null;
	},

	method: function(value) {
		this._method = value;
		return this;
	},

	header: function(name, value) {
		if (null == this._headers)
			this._headers = new HashMap();

		this._headers.put(name, value);
		return this;
	},

	content: function(value) {
		this._content = value;
		return this;
	},

	send: function(responseCallback) {
		// 打开 AJAX 请求
		this._xmlhttp.open(this._method, this._url, true);

		// 处理请求头数据
		if (null != this._headers) {
			var keySet = this._headers.keySet();
			for (var i = 0; i < keySet.length; ++i) {
				var key = keySet[i];
				var value = this._headers.get(key);
				// 设置请求头
				this._xmlhttp.setRequestHeader(key, value);
			}
		}

		this._xmlhttp.setRequestHeader("Content-Type", "application/json");

		if (undefined !== responseCallback) {
			var _xh = this._xmlhttp;
			_xh.onreadystatechange = function() {
				if (_xh.readyState == 4) {
					var reponse = new AjaxResponse(_xh.status, _xh.responseText);
					responseCallback.call(null, reponse);
				}
			};
		}

		// 发送请求
		this._xmlhttp.send();
	}
});


/**
 * AJAX 跨域访问。
 */
var AjaxCrossDomainRequest = Class({
	ctor: function(address, port) {
		this._address = address;
		this._port = port;
		this._uri = "";
		this._method = "GET";
		this._cookie = null;
		this._headers = null;
		this._content = null;
		this._error = null;
		this._errorContext = null;

		// 请求数据是否完成
		this._completed = false;

		// 时间戳
		this._timestamp = new Date();
	},

	uri: function(value) {
		this._uri = value;
		return this;
	},

	method: function(value) {
		this._method = value;
		return this;
	},

	content: function(value) {
		this._content = value;
		return this;
	},

	cookie: function(value) {
		this._cookie = value;
		return this;
	},

	error: function(value, ctx) {
		this._error = value;
		this._errorContext = (ctx !== undefined) ? ctx : null;
		return this;
	},

	send: function(responseCallback) {
		AjaxController.execute(this, responseCallback);
		return this;
	},

	_execute: function(responseCallback) {
		var time = this._timestamp.getTime();
		var param = ["?u=", this._uri, "&m=", this._method, "&c=_cc_ajax_cb"
			, "&t=", time];

		// 添加 Content
		if (this._content != null) {
			var jsonstr = null;
			if (typeof this._content == "string") {
				jsonstr = this._content;
			}
			else {
				jsonstr = JSON.stringify(this._content);
			}
			// 添加 Body 数据
			param.push("&b=", escape(jsonstr));
		}

		// 添加 Cookie
		if (this._cookie != null) {
			param.push("&_cookie=", escape(this._cookie));
		}
		// URL
		var src = "http://" + this._address + ":" + this._port + "/cccd.js" + param.join("");

		var self = this;

		if (undefined !== responseCallback) {
			_cc_ajax_map.put(time, {request:self, callback:responseCallback});
		}

		var scriptDom = document.getElementById("cccd");
		if (scriptDom != null) {
			document.body.removeChild(scriptDom);
			scriptDom = null;
		}
		if (null == scriptDom) {
			scriptDom = document.createElement("script");
			scriptDom.setAttribute("type", "text/javascript");
			scriptDom.setAttribute("id", "cccd");

			if (scriptDom.addEventListener) {
				scriptDom.addEventListener("error", function(e) { self._onError(e); }, false);
				scriptDom.addEventListener("load", function(e) { self._onLoad(e); }, false);
			}
			else if (scriptDom.attachEvent) {
				scriptDom.attachEvent("onerror", function(e) { self._onError(e); });
				scriptDom.attachEvent("onload", function(e) { self._onLoad(e); });
			}

			scriptDom.src = src;
			document.body.appendChild(scriptDom);
		}

		return this;
	},

	_onLoad: function(e) {
		AjaxController.notifyCompleted(this);
	},
	_onError: function(e) {
		if (null != this._error) {
			if (e !== undefined) {
				this._error.call(this._errorContext, this, HttpErrorCode.NETWORK_FAILED);
			}
			else {
				this._error.call(this._errorContext, this, HttpErrorCode.STATUS_ERROR);
			}
		}

		// 标记为完成
		this._completed = true;
		// 清理 Map
		_cc_ajax_map.remove(this._timestamp.getTime());

		AjaxController.notifyCompleted(this);
	}
});

// Key : timestamp, Value : {request, callback}
var _cc_ajax_map = new HashMap();
var _cc_ajax_cb = function(time, response, cookie) {
	if (undefined !== cookie) {
		// 新 Cookie
		console.log("default ajax callback, cookie: " + cookie);
	}
	else {
		// 没有新 Cookie
		//console.log("default ajax callback, no cookie");
	}

	var obj = _cc_ajax_map.get(time);
	if (null != obj) {
		var r = obj.request;
		var cb = obj.callback;

		cb.call(null, response, cookie);
		_cc_ajax_map.remove(time);

		// 标记为完成
		r._completed = true;

		AjaxController.notifyCompleted(r);
	}
};

/**
 * 跨域请求数据中心。
 */
var AjaxController = {
	timer: 0,
	lastRequest: null,
	requestQueue: [],
	callbackQueue: [],

	// 浏览器完成事件调用的“完成”通知
	notifyCompleted: function(request) {
		// TODO
	},

	execute: function(request, responseCallback) {
		this.requestQueue.push(request);
		this.callbackQueue.push(responseCallback);
	}
};
// 启动定时器
AjaxController.timer = setInterval(function() {
	var requestQueue = AjaxController.requestQueue;
	if (requestQueue.length > 0) {
		var callbackQueue = AjaxController.callbackQueue;

		// 根据上一次请求判断
		if (null != AjaxController.lastRequest) {
			// 判断是否完成
			if (AjaxController.lastRequest._completed) {
				// 出队
				var r = requestQueue.shift();
				var cb = callbackQueue.shift();

				AjaxController.lastRequest = r;

				// 执行
				r._execute(cb);
			}
		}
		else {
			// 出队
			var r = requestQueue.shift();
			var cb = callbackQueue.shift();

			AjaxController.lastRequest = r;

			// 执行
			r._execute(cb);
		}
	}
}, 500);

/**
 * AJAX
 */
var Ajax = {
	newRequest: function(url) {
		var xmlhttp = null;
		if (window.XMLHttpRequest) {
			// code for IE7+, Firefox, Chrome, Opera, Safari
			xmlhttp = new XMLHttpRequest();
		}
		else {
			// code for IE6, IE5
			xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
		}

		var request = new AjaxRequest(xmlhttp, url);
		return request;
	},

	newCrossDomain: function(address, port) {
		var request = new AjaxCrossDomainRequest(address, port);
		return request;
	}
};
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
 * 网络地址描述类。
 * 
 * @author Jiangwei Xu
 */
var InetAddress = Class({
	ctor: function(address, port) {
		this.address = address;
		this.port = port;
	},

	getAddress: function() {
		return this.address;
	},

	getPort: function() {
		return this.port;
	}
});
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

if (undefined === window.console) {
	window.console = {
		error: function() {
		},
		warn: function() {
		},
		info: function() {
		},
		log: function() {
		}
	};
}
else {
	if (undefined === window.console.error) {
		window.console.error = window.console.log;
	}
	if (undefined === window.console.warn) {
		window.console.warn = window.console.log;
	}
	if (undefined === window.console.info) {
		window.console.info = window.console.log;
	}
}

var Logger = {
	d: function(tag, text) {
		console.log(Logger._printTime() + " [DEBUG] " + tag + " - " + text);
	},

	i: function(tag, text) {
		console.info(Logger._printTime() + " [INFO]  " + tag + " - " + text);
	},

	w: function(tag, text) {
		console.warn(Logger._printTime() + " [WARN]  " + tag + " - " + text);
	},

	e: function(tag, text) {
		console.error(Logger._printTime() + " [ERROR] " + tag + " - " + text);
	},

	_printTime: function() {
		var date = new Date();
		var ret = [date.getHours(), ":", date.getMinutes(), ":", date.getSeconds(), ".", date.getMilliseconds()];
		date = null;
		return ret.join('');
	}
};
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
 * 系统服务定义。
 * @author Jiangwei Xu
 */
var Service = Class({
	ctor: function() {
	},

	startup: function() {
		return false;
	},

	shutdown: function() {
	}
});
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
 * 主语语素。
 * @author Jiangwei Xu
 */
var SubjectStuff = Class(Stuff, {
	ctor: function(value, literalBase) {
		Stuff.prototype.ctor.call(this, StuffType.SUBJECT, value, literalBase);
	},

	clone: function(target) {
		if (target.type == StuffType.SUBJECT) {
			target.value = this.value;
			target.literalBase = this.literalBase;
		}
	}
});
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
 * 谓语语素。
 * @author Jiangwei Xu
 */
var PredicateStuff = Class(Stuff, {
	ctor: function(value, literalBase) {
		Stuff.prototype.ctor.call(this, StuffType.PREDICATE, value, literalBase);
	},

	clone: function(target) {
		if (target.type == StuffType.PREDICATE) {
			target.value = this.value;
			target.literalBase = this.literalBase;
		}
	}
});
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
 * 宾语语素。
 * @author Jiangwei Xu
 */
var ObjectiveStuff = Class(Stuff, {
	ctor: function(value, literalBase) {
		Stuff.prototype.ctor.call(this, StuffType.OBJECTIVE, value, literalBase);
	},

	clone: function(target) {
		if (target.type == StuffType.OBJECTIVE) {
			target.value = this.value;
			target.literalBase = this.literalBase;
		}
	}
});
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
 * 定语语素。
 * @author Jiangwei Xu
 */
var AttributiveStuff = Class(Stuff, {
	ctor: function(value, literalBase) {
		Stuff.prototype.ctor.call(this, StuffType.ATTRIBUTIVE, value, literalBase);
	},

	clone: function(target) {
		if (target.type == StuffType.ATTRIBUTIVE) {
			target.value = this.value;
			target.literalBase = this.literalBase;
		}
	}
});
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
 * 状语语素。
 * @author Jiangwei Xu
 */
var AdverbialStuff = Class(Stuff, {
	ctor: function(value, literalBase) {
		Stuff.prototype.ctor.call(this, StuffType.ADVERBIAL, value, literalBase);
	},

	clone: function(target) {
		if (target.type == StuffType.ADVERBIAL) {
			target.value = this.value;
			target.literalBase = this.literalBase;
		}
	}
});/*
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
 * 补语语素。
 * @author Jiangwei Xu
 */
var ComplementStuff = Class(Stuff, {
	ctor: function(value, literalBase) {
		Stuff.prototype.ctor.call(this, StuffType.COMPLEMENT, value, literalBase);
	},

	clone: function(target) {
		if (target.type == StuffType.COMPLEMENT) {
			target.value = this.value;
			target.literalBase = this.literalBase;
		}
	}
});
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
 * 方言元数据。
 *
 * @author Jiangwei Xu
 */
var DialectMetaData = Class({
	ctor: function(name, description) {
		this.name = name;
		this.description = description;
	}
});


/**
 * 方言工厂。
 * 
 * @author Jiangwei Xu
 */
var DialectFactory = Class({
	ctor: function() {
	},

	getMetaData: function() {
		return null;
	},

	create: function(tracker) {
		return null;
	}
});
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
 * 动作方言工厂。
 * 
 * @author Jiangwei Xu
 */
var ActionDialectFactory = Class(DialectFactory, {
	ctor: function() {
		DialectFactory.prototype.ctor.call(this);
		this.metaData = new DialectMetaData(ActionDialect.DIALECT_NAME, "Action Dialect");
	},

	getMetaData: function() {
		return this.metaData;
	},

	create: function(tracker) {
		return new ActionDialect(tracker);
	}
});
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
 * 会话监听器。
 *
 * @author Jiangwei Xu
 */
var TalkListener = Class({
	ctor: function() {
	},

	/** 与内核进行会话。
	 */
	dialogue: function(identifier, primitive) {
	},

	/** 与对端内核建立会话。
	 */
	contacted: function(identifier, tag) {
	},

	/** 与对端内核断开会话。
	 */
	quitted: function(identifier, tag) {
	},

	/** 发生错误。
	 */
	failed: function(identifier, tag, failure) {
	}
});
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
		this.sourceCelletIdentifier = "";
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

	getSourceCelletIdentifier: function() {
		return this.sourceCelletIdentifier;
	},

	setSourceCelletIdentifier: function(celletIdentifier) {
		this.sourceCelletIdentifier = celletIdentifier;
	}
});
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
 * Speaker 事件委派。
 *
 * @author Jiangwei Xu
 */
var SpeakerDelegate = Class({
	ctor: function() {
	},

	onDialogue: function(speaker, primitive) {
		// Nothing
	},

	onContacted: function(speaker) {
		// Nothing
	},

	onQuitted: function(speaker) {
		// Nothing
	},

	onFailed: function(speaker, failure) {
		// Nothing
	}
});
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

/** 委派的代理
 */
var _DelegateProxy = Class(SpeakerDelegate, {
	ctor: function(service) {
		this.service = service;
	},

	onDialogue: function(speaker, primitive) {
		var listeners = this.service.listeners;
		for (var i = 0; i < listeners.length; ++i) {
			listeners[i].dialogue(speaker.identifier, primitive);
		}
	},

	onContacted: function(speaker) {
		var listeners = this.service.listeners;
		for (var i = 0; i < listeners.length; ++i) {
			listeners[i].contacted(speaker.identifier, speaker.remoteTag);
		}
	},

	onQuitted: function(speaker) {
		var listeners = this.service.listeners;
		for (var i = 0; i < listeners.length; ++i) {
			listeners[i].quitted(speaker.identifier, speaker.remoteTag);
		}
	},

	onFailed: function(speaker, failure) {
		var listeners = this.service.listeners;
		for (var i = 0; i < listeners.length; ++i) {
			listeners[i].failed(speaker.identifier, speaker.remoteTag, failure);
		}
	}
});

/**
 * 会话服务。
 *
 * @author Jiangwei Xu
 */
var TalkService = Class(Service, {
	ctor: function() {
		TalkService.instance = this;

		this.daemonTimer = 0;
		this.listeners = new Array();
		this.speakers = new HashMap();
		this.delegateProxy = new _DelegateProxy(this);

		// 默认 5 秒心跳
		this.heartbeat = 5000;
	},

	startup: function() {
		// 添加方言工厂
		var adf = new ActionDialectFactory();
		DialectEnumerator.getInstance().addFactory(adf);

		var self = this;

		// 启动定时任务
		Logger.i("TalkService", "Heartbeat period is " + self.heartbeat + " ms");
		self.daemonTimer = setInterval(function() {
				self._exeDaemonTask();
			}, self.heartbeat);
		return true;
	},

	shutdown: function() {
		if (this.daemonTimer > 0) {
			clearInterval(this.daemonTimer);
			this.daemonTimer = 0;
		}
	},

	addListener: function(listener) {
		var index = this.listeners.indexOf(listener);
		if (index >= 0)
			return;

		this.listeners.push(listener);
	},

	removeListener: function(listener) {
		var index = this.listeners.indexOf(listener);
		if (index >= 0) {
			this.listeners.splice(index, 1);
		}
	},

	hasListener: function(listener) {
		return (this.listeners.indexOf(listener) >= 0);
	},

	/** 重置心跳周期。
	 */
	resetHeartbeat: function(heartbeat) {
		if (this.heartbeat == heartbeat || heartbeat < 2000) {
			return false;
		}

		var self = this;

		clearInterval(self.daemonTimer);

		// 重置心跳周期
		self.heartbeat = heartbeat;

		// 重置 Speaker
		var list = self.speakers.values();
		for (var i = 0; i < list.length; ++i) {
			list[i].heartbeat = heartbeat;
		}

		Logger.i("TalkService", "Reset heartbeat period is " + self.heartbeat + " ms");
		self.daemonTimer = setInterval(function() {
				self._exeDaemonTask();
			}, self.heartbeat);
		return true;
	},

	call: function(identifier, address) {
		var speaker = null;
		if (this.speakers.containsKey(identifier)) {
			speaker = this.speakers.get(identifier);
		}
		else {
			speaker = new Speaker(window.nucleus.tag, identifier, this.delegateProxy);
			speaker.heartbeat = this.heartbeat;
			this.speakers.put(identifier, speaker);
		}

		return speaker.call(address);
	},

	hangUp: function(identifier) {
		var speaker = this.speakers.get(identifier);
		if (null != speaker) {
			speaker.hangUp();

			this.speakers.remove(identifier);
		}
	},

	talk: function(identifier, mix) {
		var speaker = this.speakers.get(identifier);
		if (null != speaker) {
			if (undefined !== mix.translate) {
				// 方言转原语
				var primitive = mix.translate();
				if (null != primitive) {
					return speaker.speak(primitive);
				}
				else {
					Logger.e("TalkService", "Failed translates dialect to primitive.");
					return false;
				}
			}
			else {
				// 直接操作原语
				return speaker.speak(mix);
			}
		}

		return false;
	},

	isCalled: function(identifier) {
		var speaker = this.speakers.get(identifier);
		if (null != speaker) {
			return (speaker.state == SpeakerState.CALLED);
		}
		return false;
	},

	_exeDaemonTask: function() {
		// 驱动 Speaker 进行心跳
		if (this.speakers.size() > 0) {
			var list = this.speakers.values();
			for (var i = 0; i < list.length; ++i) {
				list[i].tick();
			}
		}
	}
});

// 实例
TalkService.instance = null;

// 返回单例
TalkService.getInstance = function() {
	return TalkService.instance;
}
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
 * 核心类。
 */
var Nucleus = Class(Service, {
	ctor: function() {
		this.tag = UUID.v4();
		this.talkService = null;
		this.ts = null;
	},

	startup: function() {
		Logger.i("Nucleus", "Cell Initializing");

		if (null == this.talkService) {
			this.talkService = new TalkService();
			this.ts = this.talkService;
		}

		this.talkService.startup();
		window.service = this.talkService;

		return true;
	},

	shutdown: function() {
		if (null != this.talkService) {
			this.talkService.shutdown();
			this.talkService = null;
			this.ts = null;
		}
	}
});

// 创建 Nucleus 单例
(function(){
	window.nucleus = new Nucleus();
})();
