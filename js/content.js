(function() {
	var Promise = LBWeather.Promise,
		when = LBWeather.when;
	function WeatherPop() {
	};
	LBWeather.extend(WeatherPop.prototype, {
		render: function(data) {
			var div = document.createElement('div');
			div.id = 'lb-w-ext00-popWrap';
			div.innerHTML = '测试S';
			document.body.appendChild(div);
		},
		fetchData:function(status){
			var me = this;
			when([me.getDubaWeatherCityId(),me.getWarningApi()]).then(done);
			function done(city_id,warnings){
				//根据cityid过滤过需要判断的信息
				var popWarnings = warnings.filter(function(item) {
					return item.cityid == city_id;
				});
				if(popWarnings.length == 0){
					return;
				}
				me.render(popWarnings[0]);
			};
			//测试必现途径
			this.render();
			/*setTimeout(function(){
				me.proxySendMes({lastPop:{
					type:'aqi',
					time: Date.now()
				}});
			},2000);*/
		},
		getDubaWeatherCityId:function(){
			var p = new Promise();
			setTimeout(function(){
				p.resolve(101010100);
			},30);
			/*LBWeather.Ajax.get('http://weather.123.duba.net/weatherinfo/?callback=getDuBaData?t=' + Date.now()/(1000*60),function(res){
				p.resolve(res);
			});*/
			return p;
		},
		getWarningApi:function(){
			var p = new Promise();
			LBWeather.Ajax.get('http://i.liebao.cn/bucenter/calendar/weatherWarning?t=' + Date.now()/(1000*60),function(res){
				p.resolve(res);
			});
			return p;
		},
		proxySendMes: function(param) {
			var me = this;
			param = param || {};
			chrome.runtime.sendMessage(param,function (response) {
		        me.fetchData(response);
		    });
		}
	});
	function init() {
		var instance = new WeatherPop();
		instance.proxySendMes();
	};
	init();
})();