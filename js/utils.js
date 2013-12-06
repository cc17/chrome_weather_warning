(function(){
	var root = this;
	//top namespace
	var LBWeather = root.LBWeather = {};
	var ArrayProto = Array.prototype,
		hasOwn = Object.prototype.hasOwnProperty,
		nativeForEach = ArrayProto.forEach,
		breaker = {},
		jsonp_prefix = 'lbExt_';


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
		},
		create:function(tagName,props){
			var el = document.createElement(tagName);
			extend(el,props);
			return el
		}
	});	

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
                		//坑爹的毒霸接口不能给我返回json，只能多做个判断了
                        var data = xhr.responseText.indexOf(jsonp_prefix) > -1 ? xhr.responseText : JSON.parse( xhr.responseText );
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
	
	var jsonp = function(url,fn){
		var timestamp = Math.floor((Date.now())/1000);
		var _callbackName = jsonp_prefix + timestamp;
		window[_callbackName] = (function(res){
			return function(){
				fn(res);
			};
		})();
		var script = Dom.create('script',{
			src:url + "?callback=" + _callbackName + '&t=' + timestamp,
			type:'text/javascript'
		});
		document.body.appendChild(script);
	};
	//proxyJsonp2Json
	var jsonp2Json = function(url,fn){
		var timestamp = Math.floor((Date.now())/1000);
		var _callbackName = jsonp_prefix + timestamp;
		Ajax.get(url + "?callback=" + _callbackName + '&t=' + timestamp,function(res){
			var start = res.indexOf('(');
			res = JSON.parse(res.substring(start + 1,res.length -1));
			fn(res);
		});
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
	//toArray
	var makeArray = function(obj){
		var arr = [];
		each(obj,function(item){
			arr.push(item);
		});
		return arr;
	};
	
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
				this._callbacks[i].apply(this.result, arguments);
			}
			this._callbacks = [];
		}
	};
	Promise.when = function(){
		var AllPromises = [].slice.call(arguments,0)[0];
		var p = new Promise();
		var promiseLen = AllPromises.length;
		
		var doneParams = {};
		AllPromises.forEach(function(item,index){
			item.__promise__name = index;
			doneParams[index] = {};
			item.then(checkAllPromiseDone,item);
		});
		var donePromiseCount = 0;
		
		function checkAllPromiseDone(data){
			donePromiseCount ++;
			doneParams[this.__promise__name] = data;
			if(donePromiseCount == promiseLen){
				doneParams = makeArray(doneParams);
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
		when:Promise.when,
		jsonp : jsonp,
		//坑爹的接口不支持不传callback时，返回json,代理一下
		jsonp2Json:jsonp2Json
	});




}).call(this);