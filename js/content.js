(function() {
	var Promise = LBWeather.Promise,
		when = LBWeather.when;
	function WeatherPop() {
		this.tpl = '<a href="<%= link %>" target="_blank"><%= title %></a><div id="lb-w-ext00-popWrap-close" class="lb-w-ext00-popWrap-close">x</div>';
	};
	LBWeather.extend(WeatherPop.prototype, {
		render: function(data) {
			var str = LBWeather.template(this.tpl,data);
			var div = this.wrap = LBWeather.Dom.create('div',{
				id:'lb-w-ext00-popWrap'
			});
			div.innerHTML = str;
			document.body.appendChild(div);
			this.bindEvt();
		},
		bindEvt:function(){
			var close = LBWeather.Dom.$('lb-w-ext00-popWrap-close');
			LBWeather.Dom.addEventListener(close,'click',handleClick.bind(this));
			function handleClick(){
				document.body.removeChild(this.wrap);
				this.proxySendMes({lastPop:{
					type:'aqi',
					time: Date.now()
				}});
			};
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
			//this.render();
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
			/*LBWeather.Ajax.get('http://i.liebao.cn/bucenter/calendar/weatherWarning?t=' + Date.now()/(1000*60),function(res){
				p.resolve(res);
			});*/
			setTimeout(function(){
				p.resolve({ 
					data:[{
						title:"爆表测试",
						link:'http://www.baidu.com',
						cityid:101100601
					}]
				});
			},1000);
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