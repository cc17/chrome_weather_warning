(function(){
	var root = this;
	//top namespace
	var LBWeather = root.LBWeather = {};
	var ArrayProto = Array.prototype,
		hasOwn = Object.prototype.hasOwnProperty,
		nativeForEach = ArrayProto.forEach,
		breaker = {};

	/*ajax*/
	var Ajax = (function (){
		function getXhr(){
			return new XMLHttpRequest();
		};
		function get(url,callback){
			var xhr = getXhr();
			xhr.open('GET',url,true);
			xhr.onreadystatechange = function(){
				if ( xhr.readyState !== 4 ) return;
                if ( ( xhr.status >= 200 && xhr.status < 300 ) || xhr.status === 304 || xhr.status === 1223 || xhr.status === 0 ){
                        var data = JSON.parse( xhr.responseText );
                        callback.call( window, data );
                }
                xhr = null;
			};
			xhr.send();
		};
		return {
			get:get
		}
	})();
	//extend
	var extend = function(parent, child, isoveride) {
		isoveride = isoveride == void 0 ? true : isoveride;
		for (var key in child) {
			if (!parent[key] || isoveride) {
				parent[key] = child[key];
			}
		}
		return parent;
	};


	//escape
	var escapeEntries = {
        '&': '&amp;',
        '"': '&quot;',
        "'": '&apos;',
        '<': '&lt;',
        '>': '&gt;'
    };
    var escapeReg = /([&"'\<\>])/g;
    //escape
    var escape = function (str){
    	return str.replace(escapeReg,function(match,s1){
    		return escapeEntries[s1];		
    	});
    };
	var _localStorage = window.localStorage; 
	//proxy localstorage
	var local = {
		set:function(name,value){
			if(_localStorage){
				_localStorage.setItem('lbExt_' + name,value);
			}
		},
		get:function(name){
			if(_localStorage){
				_localStorage.getItem('lbExt_' + name);
			}
		}
	};
	//trim
	var trim = function(str){
		return str.replace(/(^\s*)|(\s*$)/g,"");
	};
	//each

	var each = function(obj, iterator, context) {
		if (obj == null) return;
		if (nativeForEach && obj.forEach === nativeForEach) {
			obj.forEach(iterator, context);
		}else { //hash map
			var keys = Object.keys(obj);
			for (var i = 0, length = keys.length; i < length; i++) {
				if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
			}
		}
	};

	//Dom
	var Dom = LBWeather.Dom = {};
	extend(Dom,{
		$:function(id){
			return document.getElementById(id);
		},
		query:function(str){
			return document.querySelector(str);
		},
		hasClass:function(el,className){
			var _class = trim(el.className);
			return _class.indexOf(className) > -1;
		},
		addClass:function(el,className){
			el.className += " " + className;
		}
	});
	var isWindow = function( obj ) {
		return obj != null && obj === obj.window;
	};
	var isPlainObject = function( obj ){
        if ( !obj || typeof obj !== "object" || obj.nodeType ) {
                return false;
        }

        try {
            // Not own constructor property must be Object
            if ( obj.constructor &&
                !hasOwn.call(obj, "constructor") &&
                !hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
                return false;
            }
        } catch ( e ) {
            // IE8,9 Will throw exceptions on certain host objects #9897
            return false;
        }
        // Own properties are enumerated firstly, so to speed up,
        // if last one is own, then all properties are own.
        var key;
        for ( key in obj ) {}
        return key === undefined || hasOwn.call( obj, key );
	};

	//tmplate engine( support if ele for)
	var template = function(str, data) {
		//str可以是element id
		var element = document.getElementById(str);
		if (element) {
			var html = /^(textarea|input)$/i.test(element.nodeName) ? element.value : element.innerHTML;
			return tplEngine(html, data);
		} else {
			return tplEngine(str, data);
		}

		function tplEngine(tpl, data) {
			var reg = /<%([^%>]+)?%>/g,
				regOut = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g,
				code = 'var r=[];\n',
				cursor = 0;

			var add = function(line, js) {
					js ? (code += line.match(regOut) ? line + '\n' : 'r.push(' + line + ');\n') : (code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
					return add;
				}
			while (match = reg.exec(tpl)) {
				add(tpl.slice(cursor, match.index))(match[1], true);
				cursor = match.index + match[0].length;
			}
			add(tpl.substr(cursor, tpl.length - cursor));
			code += 'return r.join("");';
			console.log(code);
			return new Function(code.replace(/[\r\t\n]/g, '')).apply(data);
		};
	};
	/*
     * promise
	*/
	function Promise() {
		this._callbacks = [];
	};
	Promise.prototype = {
		then: function(func, context) {
			var p;
			if (this._isdone) {
				p = func.apply(context, this.result);
			} else {
				p = new Promise();
				this._callbacks.push(function() {
					//此时apply context很重要，否则，res中的实例获取不到this
					var res = func.apply(context, arguments);
					if (res && typeof res.then === 'function') res.then(p.resolve, p);
				});
			}
			return p;
		},
		resolve: function() {
			this.result = arguments;
			this._isdone = true;
			for (var i = 0; i < this._callbacks.length; i++) {
				this._callbacks[i].apply(null, arguments);
			}
			this._callbacks = [];
		}
	};
	Promise.when = function(){
		var args = [].slice.call(arguments,0);
		var p = new Promise();
		var promiseLen = args[0].length;
		args[0].forEach(function(item){
			item.then(checkAllPromiseDone);
		});
		var donePromiseCount = 0;
		var doneParams = [];
		function checkAllPromiseDone(data){
			donePromiseCount ++;
			doneParams.push(data);
			if(donePromiseCount == promiseLen){
				p.resolve(doneParams);
			}
		};
		return p;
	};

	//exports
	extend(LBWeather,{
		isWindow : isWindow,
		isPlainObject: isPlainObject,
		template : template,
		each : each,
		trim : trim,
		local : local,
		Ajax : Ajax,
		extend : extend,
		escape : escape,
		Promise:Promise,
		when:Promise.when
	});

}).call(this);