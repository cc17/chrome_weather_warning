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
		},
		addEventListener:function(elem,eventName,fn){
			if(document.addEventListener){
				elem.addEventListener(eventName,fn,false);
			}else{
				elem['on' + eventName] = fn;
			}
		},
		removeEventListener:function(elem,eventName,fn){
			if(document.removeEventListener){
				elem.removeEventListener(eventName,fn,false);
			}else{
				elem['on' + eventName] = null;
			}
		},
		trigger:function(elem,eventName){
			var _evt = new Event(eventName);
			elem.dispatchEvent(_evt);
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
				_localStorage.setItem('lbExt_' + name,JSON.stringify(value) );
			}
		},
		get:function(name){
			if(_localStorage){
				var value = _localStorage.getItem('lbExt_' + name);
				return value ? JSON.parse(value) : {};
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
	var isEmptyObject = function( obj ){
        // null and undefined are "empty"
	    if (obj == null) return true;

	    // Assume if it has a length property with a non-zero value
	    // that that property is correct.
	    if (obj.length && obj.length > 0)    return false;
	    if (obj.length === 0)  return true;

	    // Otherwise, does it have any properties of its own?
	    // Note that this doesn't handle
	    // toString and toValue enumeration bugs in IE < 9
	    for (var key in obj) {
	        if (hasOwn.call(obj, key)) return false;
	    }

	    return true;
		};
	//tmplate engine( support if ele for)
	var tpl_cache = {};
	var template = function(str, data) {
		// Figure out if we're getting a template, or if we need to
		// load the template - and be sure to cache the result.
		var fn = !/\W/.test(str) ?
			tpl_cache[str] = tpl_cache[str] ||
			tmpl(document.getElementById(str).innerHTML) :

		// Generate a reusable function that will serve as a template
		// generator (and which will be cached).
		new Function("obj",
			"var p=[],print=function(){p.push.apply(p,arguments);};" +

			// Introduce the data as local variables using with(){}
			"with(obj){p.push('" +

			// Convert the template into pure JavaScript
			str
			.replace(/[\r\t\n]/g, " ")
			.split("<%").join("\t")
			.replace(/((^|%>)[^\t]*)'/g, "$1\r")
			.replace(/\t=(.*?)%>/g, "',$1,'")
			.split("\t").join("');")
			.split("%>").join("p.push('")
			.split("\r").join("\\'") + "');}return p.join('');");
		// Provide some basic currying to the user
		return data ? fn(data) : fn;
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
		isEmptyObject: isEmptyObject,
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