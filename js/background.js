(function() {
	/*
	* 根据上一次弹泡确定是否需要获取数据
	*/
	function CachePopTime(opts) {
		this.defaults = LBWeather.extend({}, opts);
		this.status = 1; //0表示不显示，1显示
		this.init();
	};
	LBWeather.extend(CachePopTime.prototype, {
		init: function() {
			this.proxyPostMessage();
		},
		checkNeedShow:function(){
			var flag = true;
			var now = Date.now();
			var lastPop = LBWeather.local.get('lastPop');
			if(lastPop && lastPop.time && (now -lastPop.time) < 1000*60*60*0.5 ){
				flag = false;
			}
			return flag;
		},
		proxyPostMessage: function(status) {
			var me = this;
			chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
				if(!LBWeather.isEmptyObject(request)){
					LBWeather.local.set('lastPop',request.lastPop );
					return;
				}
				var flag = me.checkNeedShow();
				flag && (sendResponse());
			});
		}
	});
	var cache = new CachePopTime();

})();