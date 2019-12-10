/*! js-cookie v2.1.4 | MIT */
!function(a){var b=!1;if("function"==typeof define&&define.amd&&(define(a),b=!0),"object"==typeof exports&&(module.exports=a(),b=!0),!b){var c=window.Cookies,d=window.Cookies=a();d.noConflict=function(){return window.Cookies=c,d}}}(function(){function a(){for(var a=0,b={};a<arguments.length;a++){var c=arguments[a];for(var d in c)b[d]=c[d]}return b}function b(c){function d(b,e,f){var g;if("undefined"!=typeof document){if(arguments.length>1){if(f=a({path:"/"},d.defaults,f),"number"==typeof f.expires){var h=new Date;h.setMilliseconds(h.getMilliseconds()+864e5*f.expires),f.expires=h}f.expires=f.expires?f.expires.toUTCString():"";try{g=JSON.stringify(e),/^[\{\[]/.test(g)&&(e=g)}catch(p){}e=c.write?c.write(e,b):encodeURIComponent(e+"").replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g,decodeURIComponent),b=encodeURIComponent(b+""),b=b.replace(/%(23|24|26|2B|5E|60|7C)/g,decodeURIComponent),b=b.replace(/[\(\)]/g,escape);var i="";for(var j in f)f[j]&&(i+="; "+j,!0!==f[j]&&(i+="="+f[j]));return document.cookie=b+"="+e+i}b||(g={});for(var k=document.cookie?document.cookie.split("; "):[],l=0;l<k.length;l++){var m=k[l].split("="),n=m.slice(1).join("=");'"'===n.charAt(0)&&(n=n.slice(1,-1));try{var o=m[0].replace(/(%[0-9A-Z]{2})+/g,decodeURIComponent);if(n=c.read?c.read(n,o):c(n,o)||n.replace(/(%[0-9A-Z]{2})+/g,decodeURIComponent),this.json)try{n=JSON.parse(n)}catch(p){}if(b===o){g=n;break}b||(g[o]=n)}catch(p){}}return g}}return d.set=d,d.get=function(a){return d.call(d,a)},d.getJSON=function(){return d.apply({json:!0},[].slice.call(arguments))},d.defaults={},d.remove=function(b,c){d(b,"",a(c,{expires:-1}))},d.withConverter=b,d}return b(function(){})});
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
		Cookies.set( this.cookieName, dataAtual.toJSON(), { expires: newDate } );
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