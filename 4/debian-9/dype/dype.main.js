/////////////////////////////////
/////////    Select2    /////////
/////////////////////////////////
var updaterId = null;
function setSelect2(){
	$('#project_quick_jump_box:not([class^="select2"]),#issue_project_id:not([class^="select2"])').select2({
		width: '300px'
	}).maximizeSelect2Height();
}
$.getScript('/javascripts/dype/select2/js/select2.min.js', function(){
	$.getScript('/javascripts/dype/maximize-select2-height.js', function(){
		$('<link>')
			.appendTo('head')
			.attr({
			  type: 'text/css', 
			  rel: 'stylesheet',
			  href: '/javascripts/dype/select2/css/select2.min.css'
			});
		setSelect2();
		$(document).bind("DOMSubtreeModified", function(){
			window.clearInterval(updaterId);
			updaterId = window.setInterval( function(){
				setSelect2();
			}, 200);
		});	
	});
});
/////////////////////////////////
/////////  Agrupadora   /////////
/////////////////////////////////
var titles = ["Atendimento", "Planejamento", "Funcionalidade"];
for( var i in titles ) {
	// Título atual
	var ctitle = titles[i];
	// Ajustar pelo componente
	var title = $('#content h2:contains("'+ctitle+'"), a.issue.parent:contains("'+ctitle+'")');
	// Gerar os dados
	$.each(title, function(i, elem){
		var parentId = $(this).html().replace(ctitle+' #', '');
		//var linksBar = $(title).closest('#content').find('.contextual').first();
		$('<a/>').html( '&nbsp;' ).attr('class', 'icon icon-list icon-only').attr('target', '_blank').css('margin-left', '10px')
		.attr('href',  "/issues?utf8=✓&set_filter=1&f[]=parent_id&op[parent_id]==&v[parent_id][]="+parentId+"&f[]=&c[]=project&c[]=tracker&c[]=status&c[]=priority&c[]=subject&c[]=assigned_to&c[]=fixed_version&c[]=start_date&c[]=due_date&c[]=cf_2&c[]=estimated_hours&c[]=spent_hours&group_by=&t[]=estimated_hours&t[]=spent_hours&t[]=" )
		.appendTo( $(this) );
	});
}
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////    Múltiplas informações no campo FRESHDESK   /////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
var fld = jQuery('.label:contains("Freshdesk")').parent().find('.value');
if (fld !== undefined && fld.length > 0) {
	var value = fld.html();
	var fldLink = fld.find('a');
	if (fldLink.html() !== undefined) {
		value = fldLink.html();
	}
	var result = "";
	var popuplinks = "";
	if (value.match(/,/)) {
		var list = value.split(',');
		for(var i in list) {
			if (i>0) {
				result += ",";
			}
			var clink = "http://atendimento.dype.com.br/helpdesk/tickets/"+list[i].trim();
			if (isNaN(list[i])) {
				clink = list[i].trim();
			}
			popuplinks += "window.open('"+clink+"');";
			result += "<a href='"+clink+"' target='_blank'>"+list[i].trim()+"</a>";
		}
		if (result.length > 0)
			result += " <a href=\"javascript:;\" alt=\"Abrir todos\" onclick=\""+popuplinks+"\">[+]</a>";
		fld.html(result);
	}
}
var div = jQuery('<span />').attr('class','dype-actions').css({'padding':'0 5px 0 15px'});
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////    				Time Tracker   				////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////

function hasTaskRunning() {
	var result = 0;
	jQuery.ajax({
		url: '/issues.json', 
		dataType: 'json',
		data: { 'status_id':'2', 'assigned_to':'me' },
		async: false,
		success: function(data){
			if (data.total_count > 0) {
				result = data.issues[0].id;
			}
		}
	});
	return result;
}
function getDiffLastRunning() {
	var entries = jQuery(".journal:contains('to Em andamento'),.journal:contains('para Em andamento')");
	var max = 0;
	entries.each(function() {
		var idnum = this.id.replace('change-','');
		max = Math.max(idnum, max);
	});
	var hour = jQuery('#change-'+max+' h4 a[href*=activity]')[0];
	var parts = hour.title.split(' ');
	// Data
	var data = parts[0].split('/');
	data = data[1]+"/"+data[0]+"/"+data[2];
	// Hora
	var hora = parts[1];
	if (parts.length > 2 && (parts[2] == 'PM' || parts[2] == 'AM'))
		hora += " "+parts[2];
	hour = data + ' ' + hora;
	var date = new Date(hour);
	return Math.abs((new Date().getTime()) - date.getTime()) / 3600000;
}
function dypeStartTask() {
	var oldId = hasTaskRunning();
	if (oldId) {
		alert('A tarefa "#'+oldId+'" esta em andamento. Por favor, finalize a outra tarefa antes de iniciar esta.');
	} else {
		var id = jQuery('option:contains("Em andamento")').attr('value');
		jQuery('#issue_status_id').val(id);
		jQuery('#issue-form').submit();
	}
}
function dypeStopTask() {
	if (jQuery('.dype-timeentry_old').val()=='') {
		alert("Por favor selecione o tipo de atividade");
		return;
	}
	var diff = getDiffLastRunning();
	var id = jQuery('option:contains("Aberto")').attr('value');
	jQuery('#issue_status_id').val(id);
	if (diff >= 0.01) {
		jQuery('#time_entry_hours').val(diff);
	}
	jQuery('#issue-form').submit();
}
var cStatus = jQuery('.status.attribute .value').html();
if (cStatus != 'Em andamento') {
	var startBtn = jQuery('<a/>').addClass('icon icon-fav').attr('id','startTask').attr('href','javascript:;').attr('onclick','dypeStartTask()').html('Iniciar trabalho');
	div.append(startBtn);
} else if (cStatus == 'Em andamento') {
	var stopBtn = jQuery('<a/>').addClass('icon icon-time-add').attr('id','stopTask').attr('href','javascript:;').attr('onclick','dypeStopTask()').html('Parar trabalho');
	div.append(stopBtn);
	// Gerar o botão da lista de tipos de tempo
	div.css({'position':'relative', 'display':'inline-block'});
	var activityDiv = jQuery('<div/>').attr('id','dype-activity-container').css({'position':'absolute','left':'10px','top':'20px', 'background':'#FFF', 'padding':'5px 10px', 'max-width':'100px'});
	var activityInput = jQuery('#time_entry_activity_id').clone();
	activityInput.addClass('dype-timeentry_old').css({'width':'100%'}).removeAttr('id');
	activityInput.on('change', function(){
		var val = jQuery(this).val();
		activityInput.val(val);
		jQuery('#time_entry_activity_id').val(val).change();
	});
	activityInput.appendTo( activityDiv );
	div.append(activityDiv);
}
///////////////////////////////////////////
//////		Acessar Site (Eventos)	///////
///////////////////////////////////////////
if (jQuery('.breadcrumbs:contains("Eventos"),.breadcrumbs:contains("Release ")').length > 0) {
	var sigla = jQuery('body').attr('class').match(/project-(.*?)\s/);
	if (sigla[1] !== undefined) {
		var btn = jQuery('<a/>').attr('id','gotoProject').html('Ir para o site')
			.addClass('icon').css({'background-image':'url("../images/link.png"', 'margin-left':'10px'})
			.attr('href', 'https://intranet.dype.com.br/eventoedicao/buscaacessarurl?term='+sigla[1]).attr('target','_blank');
		div.append(btn);
		var btn2 = jQuery('<a/>').attr('id','gotoIntranetFilter').html('Buscar no intranet')
			.addClass('icon').css({'background-image':'url("../images/link.png"', 'margin-left':'10px'})
			.attr('href', 'https://intranet.dype.com.br/evento/buscageralinstitucional?__form_signature=2aba329b1319eb46e8922191660c75c8&TERMO='+sigla[1].replace(/-/g,'%25')).attr('target','_blank');
		div.append(btn2);
	}
}
///////////////////////////////////////////
//////////    Time Tracker  v2	///////////
///////////////////////////////////////////
$.getScript('/javascripts/dype/dype.timetrack.js', function(){
	var user_beta = $("a.user.active").attr("href");
	var id_beta = $("#content .contextual a.icon-del[data-method='delete']").attr("href");
	if (id_beta != undefined && user_beta != undefined) {
		user_beta = user_beta.replace('/users/','');
		id_beta = id_beta.replace('/issues/','');
		var container_beta = $('<div/>').addClass('dype-tracker_beta').css({'display':'inline-block','position':'relative','margin-left':'10px'});
		// Em homologação - adicionar após as ações existentes - Remover e deixar a linha de baixo quando estiver OK
		container_beta = container_beta.insertAfter('#content .contextual .dype-actions');
		//container = container.insertAfter('#content .contextual .icon.icon-edit:first-child');
		var span_beta = $('<span/>').appendTo(container_beta);
		// Combo de Tipo de tempo
		var activityDiv_beta = jQuery('<div/>').addClass('dype-activity-container_beta').css({'position':'absolute','left':'50%','top':'20px', 'margin-left':'-55px', 'background':'#FFF', 'padding':'5px 10px', 'width':'100px'});
		var activityInput_beta = jQuery('#time_entry_activity_id').clone().removeAttr('id').addClass('dype-timeentry_beta').css({'width':'100%'})
		activityInput_beta.on('change', function(){
			var val = jQuery(this).val();
			activityInput_beta.val(val);
			jQuery('#time_entry_activity_id').val(val);
		});
		activityInput_beta.appendTo( activityDiv_beta );
		activityDiv_beta.appendTo(container_beta);
		// Inicializar o objeto
		DypeTracker.links.start = {
			className : 'icon icon-fav',
			content: 'Iniciar trabalho (Beta)'
		};
		DypeTracker.links.stop = {
			className : 'icon icon-time-add',
			content: 'Parar trabalho (Beta)'
		};
		DypeTracker.onUpdate = function() {
			if (DypeTracker.state == TRACKER_STATE_STOPPED) {
				$('.dype-activity-container_beta').css({'display':'none'});
			} else {
				$('.dype-activity-container_beta').css({'display':'block'});
			}
		};
		DypeTracker.init({
			taskId: id_beta,
			userId: user_beta,
			timeTypeElement: '#time_entry_activity_id',
			container: span_beta
		});
	}
});
// Append das DypeActions
if (div.html() != '') {
	div.insertAfter('#content .contextual .icon.icon-edit:first-child');
}
// Dype actions geral na direita
// Listagem de links especiais
if (jQuery('body').hasClass('action-show') && jQuery('body').hasClass('controller-issues')) {
	var sigla = jQuery('body').attr('class').match(/project-(.*?)\s/);
	if (sigla[1] !== undefined) {
		var sidebar = jQuery('#sidebar');
		var titulo = jQuery('<h3/>').html('Dype');
		var lista = jQuery('<ul/>');
		// Lista dos itens
		jQuery('<a/>').html('Acessar o site').attr('href', 'https://intranet.dype.com.br/eventoedicao/buscaacessarurl?term='+sigla[1]).attr('target','_blank').appendTo(jQuery('<li/>').appendTo(lista));
		jQuery('<a/>').html('Buscar sigla no intranet').attr('href', 'https://intranet.dype.com.br/evento/buscageralinstitucional?__form_signature=2aba329b1319eb46e8922191660c75c8&TERMO='+sigla[1].replace(/-/g,'%25')).attr('target','_blank').appendTo(jQuery('<li/>').appendTo(lista));
		// Adicionar na barra
		lista.prependTo(sidebar);
		titulo.prependTo(sidebar);
	}	
}
