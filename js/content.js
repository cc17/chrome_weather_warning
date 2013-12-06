(function() {
	var Promise = LBWeather.Promise,
		when = LBWeather.when;
	function WeatherPop() {
		this.tpl = '<% title %><div class="">x</div>';
	};
	LBWeather.extend(WeatherPop.prototype, {
		render: function(data) {
			var str = LBWeather.template(this.tpl,data);
			var div = LBWeather.Dom.create(div,{
				id:'lb-w-ext00-popWrap'
			});
			document.body.appendChild(div);
		},
		fetchData:function(status){
			var me = this;
			when([me.getDubaWeatherCityId(),me.getWarningApi()]).then(done);
			function done(data){
				if(!(data && data.length >= 2) ){
					return;
				}
				var city_id = data[0],
					warnings = data[1],
					warningsData = warnings.data;
				if(!warningsData){
					return;
				}

				//test
				city_id = 101100601;

				//根据cityid过滤过需要判断的信息
				var popWarnings = warningsData.filter(function(item) {
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
			LBWeather.jsonp2Json('http://weather.123.duba.net/weatherinfo/',function(res){
				p.resolve(res.weatherinfo.cityid);
			});
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