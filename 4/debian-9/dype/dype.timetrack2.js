/*! js-cookie v2.2.1 | MIT */
!function(a){var b;if("function"==typeof define&&define.amd&&(define(a),b=!0),"object"==typeof exports&&(module.exports=a(),b=!0),!b){var c=window.Cookies,d=window.Cookies=a();d.noConflict=function(){return window.Cookies=c,d}}}(function(){function a(){for(var a=0,b={};a<arguments.length;a++){var c=arguments[a];for(var d in c)b[d]=c[d]}return b}function b(a){return a.replace(/(%[0-9A-Z]{2})+/g,decodeURIComponent)}function c(d){function e(){}function f(b,c,f){if("undefined"!=typeof document){f=a({path:"/"},e.defaults,f),"number"==typeof f.expires&&(f.expires=new Date(1*new Date+864e5*f.expires)),f.expires=f.expires?f.expires.toUTCString():"";try{var g=JSON.stringify(c);/^[\{\[]/.test(g)&&(c=g)}catch(j){}c=d.write?d.write(c,b):encodeURIComponent(c+"").replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g,decodeURIComponent),b=encodeURIComponent(b+"").replace(/%(23|24|26|2B|5E|60|7C)/g,decodeURIComponent).replace(/[\(\)]/g,escape);var h="";for(var i in f)f[i]&&(h+="; "+i,!0!==f[i]&&(h+="="+f[i].split(";")[0]));return document.cookie=b+"="+c+h}}function g(a,c){if("undefined"!=typeof document){for(var e={},f=document.cookie?document.cookie.split("; "):[],g=0;g<f.length;g++){var h=f[g].split("="),i=h.slice(1).join("=");c||'"'!==i.charAt(0)||(i=i.slice(1,-1));try{var j=b(h[0]);if(i=(d.read||d)(i,j)||b(i),c)try{i=JSON.parse(i)}catch(k){}if(e[j]=i,a===j)break}catch(k){}}return a?e[a]:e}}return e.set=f,e.get=function(a){return g(a,!1)},e.getJSON=function(a){return g(a,!0)},e.remove=function(b,c){f(b,"",a(c,{expires:-1}))},e.defaults={},e.withConverter=c,e}return c(function(){})});
/* Dype Time Tracker */
var TRACKER_STATE_STOPPED = 1;
var TRACKER_STATE_RUNNING = 2;
var POST_SAME_PAGE = false;
var DypeTracker = {
	taskId : null,
	userId: null,
	ticketId: null,
	userName: null,
	container : null,
	cookieName : null,
	state : TRACKER_STATE_STOPPED,
	timeType : null,
	timeTypeElement : null,
	onUpdate : function(){},
	links : {
		start : { className: null, content: "Iniciar" },
		stop : { className: null, content: "Parar" }
	},
	loggerUrl : 'https://tt.intranet.dype.com.br/timetracking.php',
	//loggerUrl : 'http://leo.test/trunk/eventos/201601/dypeintranet/timetracking.php',
	init : function(options) {
		this.taskId = options.taskId;
		this.userId = options.userId;
		this.ticketId = options.ticketId;
		this.userName = options.userName;
		this.timeTypeElement = options.timeTypeElement;
		this.container = jQuery(options.container);
		this.setCookieName();
		this.update();
		this.preventClose();
	},
	setCookieName : function() {
		this.cookieName = 'DYPE_TRACKING_TASK_'+this.taskId+"_TICKET_"+this.ticketId;
	},
	update : function() {
		this.setCurrentState();
		this.updateContainer();
		this.onUpdate.call();
	},
	setCurrentState : function() {
		if (Cookies.get(this.cookieName)) {
			this.state = TRACKER_STATE_RUNNING;
		} else {
			this.state = TRACKER_STATE_STOPPED;
		}
	},
	updateContainer : function() {
		this.container.html("");
		var link = jQuery('<a/>')
			.attr("href","javascript:;")
			.attr("class","dype-time-tracking ");
		if (this.state == TRACKER_STATE_RUNNING) {
			link.addClass('dype-track-stop')
			link.addClass(this.links.stop.className);
			link.attr("onclick","DypeTracker.stop(this)").html(this.links.stop.content);
		} else {
			link.addClass('dype-track-start')
			link.addClass(this.links.start.className);
			link.attr("onclick","DypeTracker.start(this)").html(this.links.start.content);
		}
		link.appendTo(this.container);
	},
	start : function(elem) {
		this.disableElem(elem);
		var dataAtual = new Date();
		var newDate = new Date((new Date()).setTime( dataAtual.getTime() + 9.5 * 3600000 ));
		Cookies.set( this.cookieName, dataAtual.toJSON(), { secure: true, sameSite: 'strict', expires: newDate } );
		this.update();
		this.enableElem(elem);
	},
	stop : function(elem) {
		this.setTimeType();
		this.disableElem(elem);
		var _self = this;
		var start = new Date(Cookies.get(this.cookieName).replace(/"/g,""));
		var horas = (( new Date() ) - start)/1000/3600;
		
		this.callLogger(horas, function(){
			Cookies.remove(_self.cookieName);
			_self.update();	
		}, function(){
			_self.enableElem(elem);
		});
	},
	callLogger : function(horas, callback, alwaysCallback) {
		var sep = this.loggerUrl.match(/\?/) ? "&" : "?";
		// Gerar os parâmetros
		var params = new Array();
		if (this.taskId) {
			params.push("taskId="+this.taskId);
		}
		if (this.ticketId) {
			params.push("ticketId="+this.ticketId);
		}
		if (this.userId) {
			params.push("userId="+this.userId);
		}
		if (this.userName) {
			params.push("userName="+this.userName);
		}
		params.push("timeType="+this.timeType);
		params.push("timeAmount="+horas);
		// Gerar a URL
		var url = this.loggerUrl + sep + params.join("&").replace("/","%2F");
		// Por enquanto usamos o PSDYPE, quando migrar pra HTTP, poderemos usar AJAX.
		jQuery.ajax({
			url: url,
			success : function(){
				callback();
			},
			error : function(res) {
				alert("Erro ao salvar o tempo.\n"+res.responseText);
			},
			
		}).always(function() {
			alwaysCallback()
		});
	},
	disableElem : function(elem) {
		jQuery(elem).attr("disabled","disabled").css("opacity","0.7");
	},
	enableElem : function(elem) {
		jQuery(elem).removeAttr("disabled").css("opacity","1");
	},
	setTimeType : function() {
		this.timeType = "(indefinido)";
		var elem = jQuery(this.timeTypeElement);
		if (elem.length > 0) {
			//this.timeType = elem.find('option:selected').html();
			this.timeType = elem.val();
		}
	},
	preventClose : function () {
		var _self = this;
		if (jQuery('form').length > 0) {
			jQuery('form').submit(function(){
				var frm = jQuery(this);
				if (frm.attr('action') == window.location.pathname) {
					POST_SAME_PAGE = true;
				}
			});
		}
		window.onbeforeunload = function() {
			if (_self.state == TRACKER_STATE_RUNNING && !POST_SAME_PAGE) {
				return "Time tracking is running, please shutdown it first!";
			}
		};
	}
};