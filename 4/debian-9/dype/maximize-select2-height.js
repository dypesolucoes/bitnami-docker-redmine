// maximize-select2-height v1.0.2
// (c) Panorama Education 2015
// MIT License
!function(t){"use strict"
var e=t(window),n=t(document),i=function(i,o){return t.extend({cushion:o&&n.width()>e.width()?30:10},i)},o=function(n,o,r,c,s){var u,h,a
return s?u=window.innerHeight+e.scrollTop()-o.offset().top:(a=t("#select2-"+n+"-container").parent().parent().parent().offset().top,h=r.height()-o.height(),u=a-e.scrollTop()-h),u-i(c,s).cushion}
t.fn.maximizeSelect2Height=function(e){return this.each(function(n,i){t(i).on("select2:open",function(){setTimeout(function(){var n=t("#select2-"+i.id+"-results"),r=n.parent(),c=r.parent(),s=c.hasClass("select2-dropdown--below"),u=o(i.id,n,c,e,s)
r.css("max-height",u),n.css("max-height",u),t(document).trigger("scroll")})})})}}(jQuery)