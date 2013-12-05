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
		proxyPostMessage: function(status) {
			chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
				if(!LBWeather.isPlainObject(request)){
					
				}
				sendResponse();
			});
		}
	});
	var cache = new CachePopTime();

})();