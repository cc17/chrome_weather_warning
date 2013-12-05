(function() {
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
    function escape(str){
    	return str.replace(escapeReg,function(match,s1){
    		return escapeEntries[s1];		
    	});
    };
	var _localStorage = window.localStorage; 
	var local = {
		set:function(name,value){
			if(_localStorage){
				_localStorage.setItem('lbExt-' + name,value);
			}
		},
		get:function(name){
			if(_localStorage){
				_localStorage.getItem('lbExt-' + name);
			}
		}
	};



	/*
	* 根据上一次弹泡确定是否需要获取数据
	*/
	function CachePopTime(opts) {
		this.defaults = extend({}, opts);
		this.status = 1; //0表示不显示，1显示
		this.init();
	};
	extend(FetchData.prototype, {
		init: function() {
			var flag = this.getPopStatus();
			if(!flag){
				this.status = 0;
				return;
			}
			this.proxyPostMessage(this.status);
			//this._fetch();
		},
		_fetch:function(){
			Ajax.get('',done.bind(this));
			function done(res){
				this.proxyPostMessage(res);
			};
		},
		getPopStatus:function(){
			var flag = false;
			if(!local.get('lastPop')){
				flag = true;
			}
			return flag;
		}
		proxyPostMessage: function(status) {
			chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
				console.log(request);
				sendResponse({status:status});
			});
		}
	});
	var cache = new CachePopTime();

})();