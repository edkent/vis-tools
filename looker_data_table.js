!function(e){var t={};function a(r){if(t[r])return t[r].exports;var s=t[r]={i:r,l:!1,exports:{}};return e[r].call(s.exports,s,s.exports,a),s.l=!0,s.exports}a.m=e,a.c=t,a.d=function(e,t,r){a.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},a.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},a.t=function(e,t){if(1&t&&(e=a(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(a.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var s in e)a.d(r,s,function(t){return e[t]}.bind(null,s));return r},a.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return a.d(t,"a",t),t},a.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},a.p="",a(a.s=1)}([function(e,t,a){var r={};!function(e){function t(e){for(var t="",a=e.length-1;a>=0;)t+=e.charAt(a--);return t}function a(e,t){for(var a="";a.length<t;)a+=e;return a}function r(e,t){var r=""+e;return r.length>=t?r:a("0",t-r.length)+r}function s(e,t){var r=""+e;return r.length>=t?r:a(" ",t-r.length)+r}function n(e,t){var r=""+e;return r.length>=t?r:r+a(" ",t-r.length)}e.version="0.11.0";var l=Math.pow(2,32);function i(e,t){return e>l||e<-l?function(e,t){var r=""+Math.round(e);return r.length>=t?r:a("0",t-r.length)+r}(e,t):function(e,t){var r=""+e;return r.length>=t?r:a("0",t-r.length)+r}(Math.round(e),t)}function o(e,t){return t=t||0,e.length>=7+t&&103==(32|e.charCodeAt(t))&&101==(32|e.charCodeAt(t+1))&&110==(32|e.charCodeAt(t+2))&&101==(32|e.charCodeAt(t+3))&&114==(32|e.charCodeAt(t+4))&&97==(32|e.charCodeAt(t+5))&&108==(32|e.charCodeAt(t+6))}var h=[["Sun","Sunday"],["Mon","Monday"],["Tue","Tuesday"],["Wed","Wednesday"],["Thu","Thursday"],["Fri","Friday"],["Sat","Saturday"]],u=[["J","Jan","January"],["F","Feb","February"],["M","Mar","March"],["A","Apr","April"],["M","May","May"],["J","Jun","June"],["J","Jul","July"],["A","Aug","August"],["S","Sep","September"],["O","Oct","October"],["N","Nov","November"],["D","Dec","December"]];function c(e){e[0]="General",e[1]="0",e[2]="0.00",e[3]="#,##0",e[4]="#,##0.00",e[9]="0%",e[10]="0.00%",e[11]="0.00E+00",e[12]="# ?/?",e[13]="# ??/??",e[14]="m/d/yy",e[15]="d-mmm-yy",e[16]="d-mmm",e[17]="mmm-yy",e[18]="h:mm AM/PM",e[19]="h:mm:ss AM/PM",e[20]="h:mm",e[21]="h:mm:ss",e[22]="m/d/yy h:mm",e[37]="#,##0 ;(#,##0)",e[38]="#,##0 ;[Red](#,##0)",e[39]="#,##0.00;(#,##0.00)",e[40]="#,##0.00;[Red](#,##0.00)",e[45]="mm:ss",e[46]="[h]:mm:ss",e[47]="mmss.0",e[48]="##0.0E+0",e[49]="@",e[56]='"上午/下午 "hh"時"mm"分"ss"秒 "',e[65535]="General"}var d={};function f(e,t,a){for(var r=e<0?-1:1,s=e*r,n=0,l=1,i=0,o=1,h=0,u=0,c=Math.floor(s);h<t&&(i=(c=Math.floor(s))*l+n,u=c*h+o,!(s-c<5e-8));)s=1/(s-c),n=l,l=i,o=h,h=u;if(u>t&&(h>t?(u=o,i=n):(u=h,i=l)),!a)return[0,r*i,u];var d=Math.floor(r*i/u);return[d,r*i-d*u,u]}function v(e,t,a){if(e>2958465||e<0)return null;var r=0|e,s=Math.floor(86400*(e-r)),n=0,l=[],i={D:r,T:s,u:86400*(e-r)-s,y:0,m:0,d:0,H:0,M:0,S:0,q:0};if(Math.abs(i.u)<1e-6&&(i.u=0),t&&t.date1904&&(r+=1462),i.u>.9999&&(i.u=0,86400==++s&&(i.T=s=0,++r,++i.D)),60===r)l=a?[1317,10,29]:[1900,2,29],n=3;else if(0===r)l=a?[1317,8,29]:[1900,1,0],n=6;else{r>60&&--r;var o=new Date(1900,0,1);o.setDate(o.getDate()+r-1),l=[o.getFullYear(),o.getMonth()+1,o.getDate()],n=o.getDay(),r<60&&(n=(n+6)%7),a&&(n=0)}return i.y=l[0],i.m=l[1],i.d=l[2],i.S=s%60,s=Math.floor(s/60),i.M=s%60,s=Math.floor(s/60),i.H=s,i.q=n,i}c(d),e.parse_date_code=v;var m=new Date(1899,11,31,0,0,0),g=m.getTime(),p=new Date(1900,2,1,0,0,0);function _(e,t){var a=e.getTime();return t?a-=1262304e5:e>=p&&(a+=864e5),(a-(g+6e4*(e.getTimezoneOffset()-m.getTimezoneOffset())))/864e5}e._general_int=function(e){return e.toString(10)};var b=function(){var e=/\.(\d*[1-9])0+$/,t=/\.0*$/,a=/\.(\d*[1-9])0+/,r=/\.0*[Ee]/,s=/(E[+-])(\d)$/;function n(a){return a.indexOf(".")>-1?a.replace(t,"").replace(e,".$1"):a}return function(t){var l,i=Math.floor(Math.log(Math.abs(t))*Math.LOG10E);return l=i>=-4&&i<=-1?t.toPrecision(10+i):Math.abs(i)<=9?function(e){var t=e<0?12:11,a=n(e.toFixed(12));return a.length<=t||(a=e.toPrecision(10)).length<=t?a:e.toExponential(5)}(t):10===i?t.toFixed(10).substr(0,12):function(t){var a=t.toFixed(11).replace(e,".$1");return a.length>(t<0?12:11)&&(a=t.toPrecision(6)),a}(t),n(function(e){for(var t=0;t!=e.length;++t)if(101==(32|e.charCodeAt(t)))return e.replace(a,".$1").replace(r,"E").replace("e","E").replace(s,"$10$2");return e}(l))}}();function y(e,t){switch(typeof e){case"string":return e;case"boolean":return e?"TRUE":"FALSE";case"number":return(0|e)===e?e.toString(10):b(e);case"undefined":return"";case"object":if(null==e)return"";if(e instanceof Date)return T(14,_(e,t&&t.date1904),t)}throw new Error("unsupported value in General format: "+e)}function $(e,t,a,s){var n,l="",i=0,o=0,c=a.y,d=0;switch(e){case 98:c=a.y+543;case 121:switch(t.length){case 1:case 2:n=c%100,d=2;break;default:n=c%1e4,d=4}break;case 109:switch(t.length){case 1:case 2:n=a.m,d=t.length;break;case 3:return u[a.m-1][1];case 5:return u[a.m-1][0];default:return u[a.m-1][2]}break;case 100:switch(t.length){case 1:case 2:n=a.d,d=t.length;break;case 3:return h[a.q][0];default:return h[a.q][1]}break;case 104:switch(t.length){case 1:case 2:n=1+(a.H+11)%12,d=t.length;break;default:throw"bad hour format: "+t}break;case 72:switch(t.length){case 1:case 2:n=a.H,d=t.length;break;default:throw"bad hour format: "+t}break;case 77:switch(t.length){case 1:case 2:n=a.M,d=t.length;break;default:throw"bad minute format: "+t}break;case 115:if("s"!=t&&"ss"!=t&&".0"!=t&&".00"!=t&&".000"!=t)throw"bad second format: "+t;return 0!==a.u||"s"!=t&&"ss"!=t?(o=s>=2?3===s?1e3:100:1===s?10:1,(i=Math.round(o*(a.S+a.u)))>=60*o&&(i=0),"s"===t?0===i?"0":""+i/o:(l=r(i,2+s),"ss"===t?l.substr(0,2):"."+l.substr(2,t.length-1))):r(a.S,t.length);case 90:switch(t){case"[h]":case"[hh]":n=24*a.D+a.H;break;case"[m]":case"[mm]":n=60*(24*a.D+a.H)+a.M;break;case"[s]":case"[ss]":n=60*(60*(24*a.D+a.H)+a.M)+Math.round(a.S+a.u);break;default:throw"bad abstime format: "+t}d=3===t.length?1:2;break;case 101:n=c,d=1}return d>0?r(n,d):""}function w(e){if(e.length<=3)return e;for(var t=e.length%3,a=e.substr(0,t);t!=e.length;t+=3)a+=(a.length>0?",":"")+e.substr(t,3);return a}e._general_num=b,e._general=y;var k=function(){var e=/%/g;var l=/# (\?+)( ?)\/( ?)(\d+)/;var o=/^#*0*\.([0#]+)/,h=/\).*[0#]/,u=/\(###\) ###\\?-####/;function c(e){for(var t,a="",r=0;r!=e.length;++r)switch(t=e.charCodeAt(r)){case 35:break;case 63:a+=" ";break;case 48:a+="0";break;default:a+=String.fromCharCode(t)}return a}function d(e,t){var a=Math.pow(10,t);return""+Math.round(e*a)/a}function v(e,t){return t<(""+Math.round((e-Math.floor(e))*Math.pow(10,t))).length?0:Math.round((e-Math.floor(e))*Math.pow(10,t))}function m(g,p,_){if(40===g.charCodeAt(0)&&!p.match(h)){var b=p.replace(/\( */,"").replace(/ \)/,"").replace(/\)/,"");return _>=0?m("n",b,_):"("+m("n",b,-_)+")"}if(44===p.charCodeAt(p.length-1))return function(e,t,a){for(var r=t.length-1;44===t.charCodeAt(r-1);)--r;return k(e,t.substr(0,r),a/Math.pow(10,3*(t.length-r)))}(g,p,_);if(-1!==p.indexOf("%"))return function(t,r,s){var n=r.replace(e,""),l=r.length-n.length;return k(t,n,s*Math.pow(10,2*l))+a("%",l)}(g,p,_);if(-1!==p.indexOf("E"))return function e(t,a){var r,s=t.indexOf("E")-t.indexOf(".")-1;if(t.match(/^#+0.0E\+0$/)){if(0==a)return"0.0E+0";if(a<0)return"-"+e(t,-a);var n=t.indexOf(".");-1===n&&(n=t.indexOf("E"));var l=Math.floor(Math.log(a)*Math.LOG10E)%n;if(l<0&&(l+=n),-1===(r=(a/Math.pow(10,l)).toPrecision(s+1+(n+l)%n)).indexOf("e")){var i=Math.floor(Math.log(a)*Math.LOG10E);for(-1===r.indexOf(".")?r=r.charAt(0)+"."+r.substr(1)+"E+"+(i-r.length+l):r+="E+"+(i-l);"0."===r.substr(0,2);)r=(r=r.charAt(0)+r.substr(2,n)+"."+r.substr(2+n)).replace(/^0+([1-9])/,"$1").replace(/^0+\./,"0.");r=r.replace(/\+-/,"-")}r=r.replace(/^([+-]?)(\d*)\.(\d*)[Ee]/,(function(e,t,a,r){return t+a+r.substr(0,(n+l)%n)+"."+r.substr(l)+"E"}))}else r=a.toExponential(s);return t.match(/E\+00$/)&&r.match(/e[+-]\d$/)&&(r=r.substr(0,r.length-1)+"0"+r.charAt(r.length-1)),t.match(/E\-/)&&r.match(/e\+/)&&(r=r.replace(/e\+/,"e")),r.replace("e","E")}(p,_);if(36===p.charCodeAt(0))return"$"+m(g,p.substr(" "==p.charAt(1)?2:1),_);var y,$,M,x,A=Math.abs(_),O=_<0?"-":"";if(p.match(/^00+$/))return O+i(A,p.length);if(p.match(/^[#?]+$/))return"0"===(y=i(_,0))&&(y=""),y.length>p.length?y:c(p.substr(0,p.length-y.length))+y;if($=p.match(l))return function(e,t,n){var l=parseInt(e[4],10),i=Math.round(t*l),o=Math.floor(i/l),h=i-o*l,u=l;return n+(0===o?"":""+o)+" "+(0===h?a(" ",e[1].length+1+e[4].length):s(h,e[1].length)+e[2]+"/"+e[3]+r(u,e[4].length))}($,A,O);if(p.match(/^#+0+$/))return O+i(A,p.length-p.indexOf("0"));if($=p.match(o))return y=d(_,$[1].length).replace(/^([^\.]+)$/,"$1."+c($[1])).replace(/\.$/,"."+c($[1])).replace(/\.(\d*)$/,(function(e,t){return"."+t+a("0",c($[1]).length-t.length)})),-1!==p.indexOf("0.")?y:y.replace(/^0\./,".");if(p=p.replace(/^#+([0.])/,"$1"),$=p.match(/^(0*)\.(#*)$/))return O+d(A,$[2].length).replace(/\.(\d*[1-9])0*$/,".$1").replace(/^(-?\d*)$/,"$1.").replace(/^0\./,$[1].length?"0.":".");if($=p.match(/^#{1,3},##0(\.?)$/))return O+w(i(A,0));if($=p.match(/^#,##0\.([#0]*0)$/))return _<0?"-"+m(g,p,-_):w(""+(Math.floor(_)+function(e,t){return t<(""+Math.round((e-Math.floor(e))*Math.pow(10,t))).length?1:0}(_,$[1].length)))+"."+r(v(_,$[1].length),$[1].length);if($=p.match(/^#,#*,#0/))return m(g,p.replace(/^#,#*,/,""),_);if($=p.match(/^([0#]+)(\\?-([0#]+))+$/))return y=t(m(g,p.replace(/[\\-]/g,""),_)),M=0,t(t(p.replace(/\\/g,"")).replace(/[0#]/g,(function(e){return M<y.length?y.charAt(M++):"0"===e?"0":""})));if(p.match(u))return"("+(y=m(g,"##########",_)).substr(0,3)+") "+y.substr(3,3)+"-"+y.substr(6);var C="";if($=p.match(/^([#0?]+)( ?)\/( ?)([#0?]+)/))return M=Math.min($[4].length,7),x=f(A,Math.pow(10,M)-1,!1),y=""+O," "==(C=k("n",$[1],x[1])).charAt(C.length-1)&&(C=C.substr(0,C.length-1)+"0"),y+=C+$[2]+"/"+$[3],(C=n(x[2],M)).length<$[4].length&&(C=c($[4].substr($[4].length-C.length))+C),y+=C;if($=p.match(/^# ([#0?]+)( ?)\/( ?)([#0?]+)/))return M=Math.min(Math.max($[1].length,$[4].length),7),O+((x=f(A,Math.pow(10,M)-1,!0))[0]||(x[1]?"":"0"))+" "+(x[1]?s(x[1],M)+$[2]+"/"+$[3]+n(x[2],M):a(" ",2*M+1+$[2].length+$[3].length));if($=p.match(/^[#0?]+$/))return y=i(_,0),p.length<=y.length?y:c(p.substr(0,p.length-y.length))+y;if($=p.match(/^([#0?]+)\.([#0]+)$/)){y=""+_.toFixed(Math.min($[2].length,10)).replace(/([^0])0+$/,"$1"),M=y.indexOf(".");var S=p.indexOf(".")-M,E=p.length-y.length-S;return c(p.substr(0,S)+y+p.substr(p.length-E))}if($=p.match(/^00,000\.([#0]*0)$/))return M=v(_,$[1].length),_<0?"-"+m(g,p,-_):w(function(e){return e<2147483647&&e>-2147483648?""+(e>=0?0|e:e-1|0):""+Math.floor(e)}(_)).replace(/^\d,\d{3}$/,"0$&").replace(/^\d*$/,(function(e){return"00,"+(e.length<3?r(0,3-e.length):"")+e}))+"."+r(M,$[1].length);switch(p){case"###,##0.00":return m(g,"#,##0.00",_);case"###,###":case"##,###":case"#,###":var T=w(i(A,0));return"0"!==T?O+T:"";case"###,###.00":return m(g,"###,##0.00",_).replace(/^0\./,".");case"#,###.00":return m(g,"#,##0.00",_).replace(/^0\./,".")}throw new Error("unsupported format |"+p+"|")}function g(i,d,v){if(40===i.charCodeAt(0)&&!d.match(h)){var m=d.replace(/\( */,"").replace(/ \)/,"").replace(/\)/,"");return v>=0?g("n",m,v):"("+g("n",m,-v)+")"}if(44===d.charCodeAt(d.length-1))return function(e,t,a){for(var r=t.length-1;44===t.charCodeAt(r-1);)--r;return k(e,t.substr(0,r),a/Math.pow(10,3*(t.length-r)))}(i,d,v);if(-1!==d.indexOf("%"))return function(t,r,s){var n=r.replace(e,""),l=r.length-n.length;return k(t,n,s*Math.pow(10,2*l))+a("%",l)}(i,d,v);if(-1!==d.indexOf("E"))return function e(t,a){var r,s=t.indexOf("E")-t.indexOf(".")-1;if(t.match(/^#+0.0E\+0$/)){if(0==a)return"0.0E+0";if(a<0)return"-"+e(t,-a);var n=t.indexOf(".");-1===n&&(n=t.indexOf("E"));var l=Math.floor(Math.log(a)*Math.LOG10E)%n;if(l<0&&(l+=n),!(r=(a/Math.pow(10,l)).toPrecision(s+1+(n+l)%n)).match(/[Ee]/)){var i=Math.floor(Math.log(a)*Math.LOG10E);-1===r.indexOf(".")?r=r.charAt(0)+"."+r.substr(1)+"E+"+(i-r.length+l):r+="E+"+(i-l),r=r.replace(/\+-/,"-")}r=r.replace(/^([+-]?)(\d*)\.(\d*)[Ee]/,(function(e,t,a,r){return t+a+r.substr(0,(n+l)%n)+"."+r.substr(l)+"E"}))}else r=a.toExponential(s);return t.match(/E\+00$/)&&r.match(/e[+-]\d$/)&&(r=r.substr(0,r.length-1)+"0"+r.charAt(r.length-1)),t.match(/E\-/)&&r.match(/e\+/)&&(r=r.replace(/e\+/,"e")),r.replace("e","E")}(d,v);if(36===d.charCodeAt(0))return"$"+g(i,d.substr(" "==d.charAt(1)?2:1),v);var p,_,b,y,$=Math.abs(v),M=v<0?"-":"";if(d.match(/^00+$/))return M+r($,d.length);if(d.match(/^[#?]+$/))return p=""+v,0===v&&(p=""),p.length>d.length?p:c(d.substr(0,d.length-p.length))+p;if(_=d.match(l))return function(e,t,r){return r+(0===t?"":""+t)+a(" ",e[1].length+2+e[4].length)}(_,$,M);if(d.match(/^#+0+$/))return M+r($,d.length-d.indexOf("0"));if(_=d.match(o))return p=(p=(""+v).replace(/^([^\.]+)$/,"$1."+c(_[1])).replace(/\.$/,"."+c(_[1]))).replace(/\.(\d*)$/,(function(e,t){return"."+t+a("0",c(_[1]).length-t.length)})),-1!==d.indexOf("0.")?p:p.replace(/^0\./,".");if(d=d.replace(/^#+([0.])/,"$1"),_=d.match(/^(0*)\.(#*)$/))return M+(""+$).replace(/\.(\d*[1-9])0*$/,".$1").replace(/^(-?\d*)$/,"$1.").replace(/^0\./,_[1].length?"0.":".");if(_=d.match(/^#{1,3},##0(\.?)$/))return M+w(""+$);if(_=d.match(/^#,##0\.([#0]*0)$/))return v<0?"-"+g(i,d,-v):w(""+v)+"."+a("0",_[1].length);if(_=d.match(/^#,#*,#0/))return g(i,d.replace(/^#,#*,/,""),v);if(_=d.match(/^([0#]+)(\\?-([0#]+))+$/))return p=t(g(i,d.replace(/[\\-]/g,""),v)),b=0,t(t(d.replace(/\\/g,"")).replace(/[0#]/g,(function(e){return b<p.length?p.charAt(b++):"0"===e?"0":""})));if(d.match(u))return"("+(p=g(i,"##########",v)).substr(0,3)+") "+p.substr(3,3)+"-"+p.substr(6);var x="";if(_=d.match(/^([#0?]+)( ?)\/( ?)([#0?]+)/))return b=Math.min(_[4].length,7),y=f($,Math.pow(10,b)-1,!1),p=""+M," "==(x=k("n",_[1],y[1])).charAt(x.length-1)&&(x=x.substr(0,x.length-1)+"0"),p+=x+_[2]+"/"+_[3],(x=n(y[2],b)).length<_[4].length&&(x=c(_[4].substr(_[4].length-x.length))+x),p+=x;if(_=d.match(/^# ([#0?]+)( ?)\/( ?)([#0?]+)/))return b=Math.min(Math.max(_[1].length,_[4].length),7),M+((y=f($,Math.pow(10,b)-1,!0))[0]||(y[1]?"":"0"))+" "+(y[1]?s(y[1],b)+_[2]+"/"+_[3]+n(y[2],b):a(" ",2*b+1+_[2].length+_[3].length));if(_=d.match(/^[#0?]+$/))return p=""+v,d.length<=p.length?p:c(d.substr(0,d.length-p.length))+p;if(_=d.match(/^([#0]+)\.([#0]+)$/)){p=""+v.toFixed(Math.min(_[2].length,10)).replace(/([^0])0+$/,"$1"),b=p.indexOf(".");var A=d.indexOf(".")-b,O=d.length-p.length-A;return c(d.substr(0,A)+p+d.substr(d.length-O))}if(_=d.match(/^00,000\.([#0]*0)$/))return v<0?"-"+g(i,d,-v):w(""+v).replace(/^\d,\d{3}$/,"0$&").replace(/^\d*$/,(function(e){return"00,"+(e.length<3?r(0,3-e.length):"")+e}))+"."+r(0,_[1].length);switch(d){case"###,###":case"##,###":case"#,###":var C=w(""+$);return"0"!==C?M+C:"";default:if(d.match(/\.[0#?]*$/))return g(i,d.slice(0,d.lastIndexOf(".")),v)+c(d.slice(d.lastIndexOf(".")))}throw new Error("unsupported format |"+d+"|")}return function(e,t,a){return(0|a)===a?g(e,t,a):m(e,t,a)}}();function M(e){for(var t=[],a=!1,r=0,s=0;r<e.length;++r)switch(e.charCodeAt(r)){case 34:a=!a;break;case 95:case 42:case 92:++r;break;case 59:t[t.length]=e.substr(s,r-s),s=r+1}if(t[t.length]=e.substr(s),!0===a)throw new Error("Format |"+e+"| unterminated string ");return t}e._split=M;var x=/\[[HhMmSs]*\]/;function A(e){for(var t=0,a="",r="";t<e.length;)switch(a=e.charAt(t)){case"G":o(e,t)&&(t+=6),t++;break;case'"':for(;34!==e.charCodeAt(++t)&&t<e.length;);++t;break;case"\\":case"_":t+=2;break;case"@":++t;break;case"B":case"b":if("1"===e.charAt(t+1)||"2"===e.charAt(t+1))return!0;case"M":case"D":case"Y":case"H":case"S":case"E":case"m":case"d":case"y":case"h":case"s":case"e":case"g":return!0;case"A":case"a":if("A/P"===e.substr(t,3).toUpperCase())return!0;if("AM/PM"===e.substr(t,5).toUpperCase())return!0;++t;break;case"[":for(r=a;"]"!==e.charAt(t++)&&t<e.length;)r+=e.charAt(t);if(r.match(x))return!0;break;case".":case"0":case"#":for(;t<e.length&&("0#?.,E+-%".indexOf(a=e.charAt(++t))>-1||"\\"==a&&"-"==e.charAt(t+1)&&"0#".indexOf(e.charAt(t+2))>-1););break;case"?":for(;e.charAt(++t)===a;);break;case"*":++t," "!=e.charAt(t)&&"*"!=e.charAt(t)||++t;break;case"(":case")":++t;break;case"1":case"2":case"3":case"4":case"5":case"6":case"7":case"8":case"9":for(;t<e.length&&"0123456789".indexOf(e.charAt(++t))>-1;);break;case" ":default:++t}return!1}function O(e,t,a,r){for(var s,n,l,i=[],h="",u=0,c="",d="t",f="H";u<e.length;)switch(c=e.charAt(u)){case"G":if(!o(e,u))throw new Error("unrecognized character "+c+" in "+e);i[i.length]={t:"G",v:"General"},u+=7;break;case'"':for(h="";34!==(l=e.charCodeAt(++u))&&u<e.length;)h+=String.fromCharCode(l);i[i.length]={t:"t",v:h},++u;break;case"\\":var m=e.charAt(++u),g="("===m||")"===m?m:"t";i[i.length]={t:g,v:m},++u;break;case"_":i[i.length]={t:"t",v:" "},u+=2;break;case"@":i[i.length]={t:"T",v:t},++u;break;case"B":case"b":if("1"===e.charAt(u+1)||"2"===e.charAt(u+1)){if(null==s&&null==(s=v(t,a,"2"===e.charAt(u+1))))return"";i[i.length]={t:"X",v:e.substr(u,2)},d=c,u+=2;break}case"M":case"D":case"Y":case"H":case"S":case"E":c=c.toLowerCase();case"m":case"d":case"y":case"h":case"s":case"e":case"g":if(t<0)return"";if(null==s&&null==(s=v(t,a)))return"";for(h=c;++u<e.length&&e.charAt(u).toLowerCase()===c;)h+=c;"m"===c&&"h"===d.toLowerCase()&&(c="M"),"h"===c&&(c=f),i[i.length]={t:c,v:h},d=c;break;case"A":case"a":var p={t:c,v:c};if(null==s&&(s=v(t,a)),"A/P"===e.substr(u,3).toUpperCase()?(null!=s&&(p.v=s.H>=12?"P":"A"),p.t="T",f="h",u+=3):"AM/PM"===e.substr(u,5).toUpperCase()?(null!=s&&(p.v=s.H>=12?"PM":"AM"),p.t="T",u+=5,f="h"):(p.t="t",++u),null==s&&"T"===p.t)return"";i[i.length]=p,d=c;break;case"[":for(h=c;"]"!==e.charAt(u++)&&u<e.length;)h+=e.charAt(u);if("]"!==h.slice(-1))throw'unterminated "[" block: |'+h+"|";if(h.match(x)){if(null==s&&null==(s=v(t,a)))return"";i[i.length]={t:"Z",v:h.toLowerCase()},d=h.charAt(1)}else h.indexOf("$")>-1&&(h=(h.match(/\$([^-\[\]]*)/)||[])[1]||"$",A(e)||(i[i.length]={t:"t",v:h}));break;case".":if(null!=s){for(h=c;++u<e.length&&"0"===(c=e.charAt(u));)h+=c;i[i.length]={t:"s",v:h};break}case"0":case"#":for(h=c;++u<e.length&&"0#?.,E+-%".indexOf(c=e.charAt(u))>-1;)h+=c;i[i.length]={t:"n",v:h};break;case"?":for(h=c;e.charAt(++u)===c;)h+=c;i[i.length]={t:c,v:h},d=c;break;case"*":++u," "!=e.charAt(u)&&"*"!=e.charAt(u)||++u;break;case"(":case")":i[i.length]={t:1===r?"t":c,v:c},++u;break;case"1":case"2":case"3":case"4":case"5":case"6":case"7":case"8":case"9":for(h=c;u<e.length&&"0123456789".indexOf(e.charAt(++u))>-1;)h+=e.charAt(u);i[i.length]={t:"D",v:h};break;case" ":i[i.length]={t:c,v:c},++u;break;case"$":i[i.length]={t:"t",v:"$"},++u;break;default:if(-1===",$-+/():!^&'~{}<>=€acfijklopqrtuvwxzP".indexOf(c))throw new Error("unrecognized character "+c+" in "+e);i[i.length]={t:"t",v:c},++u}var _,b=0,w=0;for(u=i.length-1,d="t";u>=0;--u)switch(i[u].t){case"h":case"H":i[u].t=f,d="h",b<1&&(b=1);break;case"s":(_=i[u].v.match(/\.0+$/))&&(w=Math.max(w,_[0].length-1)),b<3&&(b=3);case"d":case"y":case"M":case"e":d=i[u].t;break;case"m":"s"===d&&(i[u].t="M",b<2&&(b=2));break;case"X":break;case"Z":b<1&&i[u].v.match(/[Hh]/)&&(b=1),b<2&&i[u].v.match(/[Mm]/)&&(b=2),b<3&&i[u].v.match(/[Ss]/)&&(b=3)}switch(b){case 0:break;case 1:s.u>=.5&&(s.u=0,++s.S),s.S>=60&&(s.S=0,++s.M),s.M>=60&&(s.M=0,++s.H);break;case 2:s.u>=.5&&(s.u=0,++s.S),s.S>=60&&(s.S=0,++s.M)}var M,O="";for(u=0;u<i.length;++u)switch(i[u].t){case"t":case"T":case" ":case"D":break;case"X":i[u].v="",i[u].t=";";break;case"d":case"m":case"y":case"h":case"H":case"M":case"s":case"e":case"b":case"Z":i[u].v=$(i[u].t.charCodeAt(0),i[u].v,s,w),i[u].t="t";break;case"n":case"?":for(M=u+1;null!=i[M]&&("?"===(c=i[M].t)||"D"===c||(" "===c||"t"===c)&&null!=i[M+1]&&("?"===i[M+1].t||"t"===i[M+1].t&&"/"===i[M+1].v)||"("===i[u].t&&(" "===c||"n"===c||")"===c)||"t"===c&&("/"===i[M].v||" "===i[M].v&&null!=i[M+1]&&"?"==i[M+1].t));)i[u].v+=i[M].v,i[M]={v:"",t:";"},++M;O+=i[u].v,u=M-1;break;case"G":i[u].t="t",i[u].v=y(t,a)}var C,S,E="";if(O.length>0){40==O.charCodeAt(0)?(C=t<0&&45===O.charCodeAt(0)?-t:t,S=k("n",O,C)):(S=k("n",O,C=t<0&&r>1?-t:t),C<0&&i[0]&&"t"==i[0].t&&(S=S.substr(1),i[0].v="-"+i[0].v)),M=S.length-1;var T=i.length;for(u=0;u<i.length;++u)if(null!=i[u]&&"t"!=i[u].t&&i[u].v.indexOf(".")>-1){T=u;break}var D=i.length;if(T===i.length&&-1===S.indexOf("E")){for(u=i.length-1;u>=0;--u)null!=i[u]&&-1!=="n?".indexOf(i[u].t)&&(M>=i[u].v.length-1?(M-=i[u].v.length,i[u].v=S.substr(M+1,i[u].v.length)):M<0?i[u].v="":(i[u].v=S.substr(0,M+1),M=-1),i[u].t="t",D=u);M>=0&&D<i.length&&(i[D].v=S.substr(0,M+1)+i[D].v)}else if(T!==i.length&&-1===S.indexOf("E")){for(M=S.indexOf(".")-1,u=T;u>=0;--u)if(null!=i[u]&&-1!=="n?".indexOf(i[u].t)){for(n=i[u].v.indexOf(".")>-1&&u===T?i[u].v.indexOf(".")-1:i[u].v.length-1,E=i[u].v.substr(n+1);n>=0;--n)M>=0&&("0"===i[u].v.charAt(n)||"#"===i[u].v.charAt(n))&&(E=S.charAt(M--)+E);i[u].v=E,i[u].t="t",D=u}for(M>=0&&D<i.length&&(i[D].v=S.substr(0,M+1)+i[D].v),M=S.indexOf(".")+1,u=T;u<i.length;++u)if(null!=i[u]&&(-1!=="n?(".indexOf(i[u].t)||u===T)){for(n=i[u].v.indexOf(".")>-1&&u===T?i[u].v.indexOf(".")+1:0,E=i[u].v.substr(0,n);n<i[u].v.length;++n)M<S.length&&(E+=S.charAt(M++));i[u].v=E,i[u].t="t",D=u}}}for(u=0;u<i.length;++u)null!=i[u]&&"n?".indexOf(i[u].t)>-1&&(C=r>1&&t<0&&u>0&&"-"===i[u-1].v?-t:t,i[u].v=k(i[u].t,i[u].v,C),i[u].t="t");var P="";for(u=0;u!==i.length;++u)null!=i[u]&&(P+=i[u].v);return P}e.is_date=A,e._eval=O;var C=/\[[=<>]/,S=/\[(=|>[=]?|<[>=]?)(-?\d+(?:\.\d*)?)\]/;function E(e,t){if(null==t)return!1;var a=parseFloat(t[2]);switch(t[1]){case"=":if(e==a)return!0;break;case">":if(e>a)return!0;break;case"<":if(e<a)return!0;break;case"<>":if(e!=a)return!0;break;case">=":if(e>=a)return!0;break;case"<=":if(e<=a)return!0}return!1}function T(e,t,a){null==a&&(a={});var r="";switch(typeof e){case"string":r="m/d/yy"==e&&a.dateNF?a.dateNF:e;break;case"number":r=14==e&&a.dateNF?a.dateNF:(null!=a.table?a.table:d)[e]}if(o(r,0))return y(t,a);t instanceof Date&&(t=_(t,a.date1904));var s=function(e,t){var a=M(e),r=a.length,s=a[r-1].indexOf("@");if(r<4&&s>-1&&--r,a.length>4)throw new Error("cannot find right format for |"+a.join("|")+"|");if("number"!=typeof t)return[4,4===a.length||s>-1?a[a.length-1]:"@"];switch(a.length){case 1:a=s>-1?["General","General","General",a[0]]:[a[0],a[0],a[0],"@"];break;case 2:a=s>-1?[a[0],a[0],a[0],a[1]]:[a[0],a[1],a[0],"@"];break;case 3:a=s>-1?[a[0],a[1],a[0],a[2]]:[a[0],a[1],a[2],"@"]}var n=t>0?a[0]:t<0?a[1]:a[2];if(-1===a[0].indexOf("[")&&-1===a[1].indexOf("["))return[r,n];if(null!=a[0].match(C)||null!=a[1].match(C)){var l=a[0].match(S),i=a[1].match(S);return E(t,l)?[r,a[0]]:E(t,i)?[r,a[1]]:[r,a[null!=l&&null!=i?2:1]]}return[r,n]}(r,t);if(o(s[1]))return y(t,a);if(!0===t)t="TRUE";else if(!1===t)t="FALSE";else if(""===t||null==t)return"";return O(s[1],t,a,s[0])}function D(e,t){if("number"!=typeof t){t=+t||-1;for(var a=0;a<392;++a)if(null!=d[a]){if(d[a]==e){t=a;break}}else t<0&&(t=a);t<0&&(t=391)}return d[t]=e,t}e.load=D,e._table=d,e.get_table=function(){return d},e.load_table=function(e){for(var t=0;392!=t;++t)void 0!==e[t]&&D(e[t],t)},e.init_table=c,e.format=T}(r),"undefined"==typeof DO_NOT_EXPORT_SSF&&(e.exports=r)},function(e,t,a){"use strict";a.r(t);var r=a(0),s=a.n(r);const n=function(e,t){for(var a=[],r=0;r<e;r++)a.push(t);return a};class l{constructor(e){this.id="",this.type=e,this.sort=[],this.data={}}}class i{constructor(e){this.id=e,this.idx=0,this.pos=0,this.heading="",this.short_name="",this.unit="",this.label="",this.view="",this.levels=[],this.field={},this.field_name="",this.type="",this.pivoted=!1,this.subtotal=!1,this.super=!1,this.pivot_key="",this.align="",this.value_format="",this.hide=!1,this.sort_by_measure_values=[],this.sort_by_pivot_values=[]}getLabel(e=!1,t=!1){var a=this.label;(e&&(a=[this.view,a].join(" ")),t)&&(a=[a,this.levels.join(" ")].join(" "));return a}updateSortByMeasures(e){1==this.sort_by_measure_values[0]&&(this.pivoted||this.subtotal||(this.sort_by_measure_values=[1,e]))}getSortByMeasures(){return this.sort_by_measure_values}getSortByPivots(){return this.sort_by_pivot_values}}exports.LookerDataTable=class{constructor(e,t,a){this.columns=[],this.dimensions=[],this.measures=[],this.data=[],this.pivot_fields=[],this.pivot_values=[],this.rowspan_values={},this.useIndexColumn=a.indexColumn||!1,this.addRowSubtotals=a.rowSubtotals||!1,this.addSubtotalDepth=a.subtotalDepth||this.dimensions.length-1,this.spanRows=a.spanRows,this.spanCols=a.spanCols,this.sortColsBy=a.sortColumnsBy||"getSortByPivots",this.has_totals=!1,this.has_subtotals=!1,this.has_row_totals=t.has_row_totals||!1,this.has_pivots=!1,this.has_supers=!1,this.variances=[];this.checkPivotsAndSupermeasures(t),this.checkVarianceCalculations(a),this.buildIndexColumn(t),this.addDimensions(a,t,0),this.addMeasures(a,t,0),this.buildRows(e),this.buildTotals(t),this.updateRowSpanValues(),a.rowSubtotals&&this.addSubTotals(a.subtotalDepth),a.colSubtotals&&2==this.pivot_fields.length&&this.addColumnSubTotals(),this.addVarianceColumns(a),this.sortColumns(),this.applyFormatting(a)}checkPivotsAndSupermeasures(e){for(var t=0;t<e.fields.pivots.length;t++){var a=e.fields.pivots[t].name;this.pivot_fields.push(a)}void 0!==e.pivots&&(this.pivot_values=e.pivots,this.has_pivots=!0),void 0!==e.fields.supermeasure_like&&(this.has_supers=!0)}checkVarianceCalculations(e){Object.keys(e).forEach(t=>{if(t.startsWith("comparison")){var a=t.split("|")[1];if(this.pivot_fields.includes(e[t]))var r="by_pivot";else r="vs_measure";if(void 0!==e["switch|"+a])if(e["switch|"+a])var s=!0;else s=!1;this.variances.push({baseline:a,comparison:e[t],type:r,reverse:s})}})}applyVisToolsTags(e){if(void 0!==e.field.tags)for(var t=0;t<e.field.tags.length;t++){var a=e.field.tags[t].split(":");"vis-tools"===a[0]&&("heading"===a[1]?e.heading=a[2]:"short_name"===a[1]?e.short_name=a[2]:"unit"===a[1]&&(e.unit=a[2]))}}addDimensions(e,t,a){for(var r=0;r<t.fields.dimension_like.length;r++){this.dimensions.push({name:t.fields.dimension_like[r].name,label:t.fields.dimension_like[r].label_short||t.fields.dimension_like[r].label,view:t.fields.dimension_like[r].view_label||""});var s=new i(t.fields.dimension_like[r].name);s.idx=a,s.levels=n(t.fields.pivots.length,""),s.field=t.fields.dimension_like[r],s.field_name=s.field.name,this.applyVisToolsTags(s),s.label=s.field.label_short||s.field.label,s.view=s.field.view_label,s.type="dimension",s.align="left",s.value_format=s.field.value_format,s.pivoted=!1,s.super=!1,s.sort_by_measure_values=[0,a,...n(this.pivot_fields.length,0)],s.sort_by_pivot_values=[0,...n(this.pivot_fields.length,0),a],void 0!==e["hide|"+s.id]&&e["hide|"+s.id]&&(s.hide=!0),this.columns.push(s),a+=10}}addMeasures(e,t,a){for(var r=0;r<t.fields.measure_like.length;r++)this.measures.push({name:t.fields.measure_like[r].name,label:t.fields.measure_like[r].label_short||t.fields.measure_like[r].label,view:t.fields.measure_like[r].view_label||"",is_table_calculation:void 0!==t.fields.measure_like[r].is_table_calculation,can_pivot:!0,value_format:t.fields.measure_like[r].value_format||""});if(this.has_pivots)for(var s=0;s<this.pivot_values.length;s++)for(r=0;r<this.measures.length;r++){if("$$$_row_total_$$$"!=this.pivot_values[s].key||"$$$_row_total_$$$"==this.pivot_values[s].key&&0==this.measures[r].is_table_calculation){for(var l=this.pivot_values[s].key,o=this.measures[r].name,h=l+"."+o,u=[],c=[],d=0;d<t.fields.pivots.length;d++){var f=t.fields.pivots[d].name;u.push(this.pivot_values[s].data[f]),c.push(this.pivot_values[s].sort_values[f])}(m=new i(h)).idx=a,m.levels=u,m.field=t.fields.measure_like[r],this.applyVisToolsTags(m),m.label=m.field.label_short||m.field.label,m.view=m.field.view_label,m.type="measure",m.align="right",m.value_format=m.field.value_format,m.pivoted=!0,m.super=!1,m.pivot_key=l,m.field_name=o,"$$$_row_total_$$$"!==this.pivot_values[s].key?(m.sort_by_measure_values=[1,r,...c],m.sort_by_pivot_values=[1,...c,a]):(m.sort_by_measure_values=[2,r,...n(this.pivot_fields.length,0)],m.sort_by_pivot_values=[2,...n(this.pivot_fields.length,0),a]),this.columns.push(m),a+=10}}else for(r=0;r<this.measures.length;r++){(m=new i(this.measures[r].name)).idx=a;try{void 0!==e.columnOrder[m.id]?m.pos=e.columnOrder[m.id]:m.pos=a}catch{m.pos=a}m.field=t.fields.measure_like[r],this.applyVisToolsTags(m),m.label=m.field.label_short||m.field.label,m.view=m.field.view_label,m.type="measure",m.align="right",m.value_format=m.field.value_format,m.pivoted=!1,m.super=!1,m.sort_by_measure_values=[1,m.pos],m.sort_by_pivot_values=[1,m.pos],this.columns.push(m),void 0!==e["style|"+m.id]&&"hide"===e["style|"+m.id]&&(m.hide=!0),a+=10}if(void 0!==t.fields.supermeasure_like)for(var v=0;v<t.fields.supermeasure_like.length;v++){var m,g=t.fields.supermeasure_like[v].name;this.measures.push({name:t.fields.supermeasure_like[v].name,label:t.fields.supermeasure_like[v].label,view:"",can_pivot:!1}),(m=new i(g)).idx=a,m.levels=n(t.fields.pivots.length,""),m.field=t.fields.supermeasure_like[v],m.label=m.field.label_short||m.field.label,m.view=m.field.view_label,m.type="measure",m.value_format=m.field.value_format,m.pivoted=!1,m.super=!0,m.sort_by_measure_values=[2,a,...n(this.pivot_fields.length,1)],m.sort_by_pivot_values=[2,...n(this.pivot_fields.length,1),a],void 0!==e["style|"+m.id]&&"hide"===e["style|"+m.id]&&(m.hide=!0),this.columns.push(m),a+=10}}buildIndexColumn(e){var t=new i("$$$_index_$$$");t.align="left",t.levels=n(e.fields.pivots.length,""),t.sort_by_measure_values=[-1,0,...n(this.pivot_fields.length,0)],t.sort_by_pivot_values=[-1,...n(this.pivot_fields.length,0),0],this.columns.push(t)}buildRows(e){for(var t=0;t<e.length;t++){for(var a=new l("line_item"),r=0;r<this.columns.length;r++){var s=this.columns[r];s.pivoted?a.data[s.id]=e[t][s.field_name][s.pivot_key]:a.data[s.id]=e[t][s.id],void 0!==a.data[s.id]&&void 0===a.data[s.id].cell_style&&(a.data[s.id].cell_style=[])}for(var n=[],i=0;i<this.dimensions.length;i++)n.push(e[t][this.dimensions[i].name].value);a.id=n.join("|");var o=this.dimensions[this.dimensions.length-1].name,h=e[t][o].value;a.data.$$$_index_$$$={value:h,cell_style:["indent"]},a.sort=[0,0,t],this.data.push(a)}}buildTotals(e){if(void 0!==e.totals_data){for(var t=e.totals_data,a=new l("total"),r=0;r<this.columns.length;r++){var s=this.columns[r];if(a.data[s.id]={value:""},s.id==this.dimensions[this.dimensions.length-1].name&&(a.data[s.id]={value:"TOTAL",cell_style:["total"]}),"measure"==s.type){if(1==s.pivoted){var n=[s.pivot_key,s.field_name].join(".");(i=t[s.field_name][s.pivot_key]).cell_style=["total"],void 0===i.rendered&&void 0!==i.html&&(i.rendered=this.getRenderedFromHtml(i)),a.data[n]=i}else{var i;(i=t[s.id]).cell_style=["total"],void 0===i.rendered&&void 0!==i.html&&(i.rendered=this.getRenderedFromHtml(i)),a.data[s.id]=i}a.data[s.id].cell_style=["total"]}}a.sort=[1,0,0],a.data.$$$_index_$$$={value:"TOTAL",cell_style:["total"]},this.data.push(a),this.has_totals=!0}}applyFormatting(e){for(var t=0;t<this.columns.length;t++){var a=this.columns[t];if(void 0!==e["style|"+a.id]&&"black_red"==e["style|"+a.id])for(var r=0;r<this.data.length;r++){var s=this.data[r];s.data[a.id].value<0&&s.data[a.id].cell_style.push("red")}}}getColumnById(e){var t={};return this.columns.forEach(a=>{e===a.id&&(t=a)}),t}updateRowSpanValues(){for(var e={},t=this.data.length-1;t>=0;t--){var a=this.data[t];if("line_item"===a.type){this.rowspan_values[a.id]={};for(var r=0;r<this.dimensions.length;r++){var s=this.dimensions[r].name,n=this.data[t].data[s].value;if(t>0)var l=this.data[t-1].data[s].value;if(!(t>0&&n==l)){for(var i=r;i<this.dimensions.length;i++){var o=this.dimensions[i].name;this.rowspan_values[a.id][o]=e[o],e[o]=1}break}this.rowspan_values[a.id][this.dimensions[r].name]=-1,e[s]+=1}}else for(r=0;r<this.dimensions.length;r++)e[this.dimensions[r].name]=1}}sortData(){this.data.sort((e,t)=>{for(var a=e.sort.length,r=0;r<a;r++){if(e.sort[r]>t.sort[r])return 1;if(e.sort[r]<t.sort[r])return-1}return-1}),this.updateRowSpanValues()}sortColumns(){this.columns.sort((e,t)=>{for(var a=this.sortColsBy,r=e[a]().length,s=0;s<r;s++){if(e[a]()[s]>t[a]()[s])return 1;if(e[a]()[s]<t[a]()[s])return-1}return-1})}addSubTotals(){for(var e=this.addSubtotalDepth,t=[],a=[],r=0;r<this.data.length;r++){var n=this.data[r];if("total"!==n.type){for(var i=[],o=0;o<e;o++){var h=this.dimensions[o].name;i.push(n.data[h].value)}i.join("|")!==a.join("|")&&(t.push(i),a=i),n.sort=[0,t.length-1,r]}}for(var u=0;u<t.length;u++){for(var c=new l("subtotal"),d=0;d<this.columns.length;d++){var f=this.columns[d];if(c.data[f.id]={},"$$$_index_$$$"===this.columns[d].id||d===this.dimensions.length){var v=t[u].join(" | ");c.data[this.columns[d].id]={value:v,cell_style:["total"]}}if("measure"==f.type){var m=0;if(f.pivoted)var g=[f.pivot_key,f.field_name].join(".");else g=f.id;for(var p=0;p<this.data.length;p++){var _=this.data[p];"line_item"==_.type&&_.sort[1]==u&&(m+=_.data[g].value)}var b={value:m,rendered:""===f.value_format?m.toString():s.a.format(f.value_format,m),cell_style:["total"]};c.data[g]=b}}c.sort=[0,u,9999],this.data.push(c)}this.sortData(),this.has_subtotals=!0}addColumnSubTotals(){for(var e="",t={},a=[],r=[],n=this.pivot_fields[0],l=0;l<this.pivot_values.length;l++){var o=this.pivot_values[l].data[n];null!==o&&r.push(o)}r=[...new Set(r)];for(l=0;l<r.length;l++)for(var h=r[l],u=[0,""],c=null,d=0;d<this.measures.length;d++)if(this.measures[d].can_pivot){for(var f=this.measures[d].name,v={field:f,label:this.measures[d].label,view:this.measures[d].view,value_format:this.measures[d].value_format,pivot:h,measure_idx:d,pivot_idx:l,columns:[],id:["$$$_subtotal_$$$",h,f].join("."),after:""},m=0;m<this.columns.length;m++){(p=this.columns[m]).pivoted&&p.levels[0]==h&&(p.field_name==f&&v.columns.push(p.id),p.levels[0]==h&&m>u[0]&&(u=[m,p.id]))}h!=e&&(t[h]=u[1],c=null),v.after=c||t[h],e=h,c=v.id,a.push(v)}for(var g=0;g<a.length;g++){var p,_=a[g];(p=new i(_.id)).levels=[_.pivot,"Subtotal"],p.label=_.label,p.view=_.view||"",p.field={name:_.field},p.value_format=_.value_format||"",p.type="measure",p.sort_by_measure_values=[1,_.measure_idx,...p.levels];var b=[...p.levels];"string"==typeof b[b.length-1]?b[b.length-1]="ZZZZ":b[b.length-1]=9999,p.sort_by_pivot_values=[1,...b,1e4+g],p.pivoted=!0,p.subtotal=!0,p.pivot_key=[_.pivot,"$$$_subtotal_$$$"].join("|"),p.field_name=_.field,p.align="right",this.columns.push(p)}this.sortColumns();for(var y=0;y<this.data.length;y++){var $=this.data[y];for(g=0;g<a.length;g++){_=a[g];for(var w=0,k=0;k<_.columns.length;k++){var M=_.columns[k];w+=$.data[M].value}$.data[_.id]={value:w,rendered:""===p.value_format?w.toString():s.a.format(p.value_format,w),align:"right"},["total","subtotal"].includes($.type)&&($.data[_.id].cell_style=["total"])}}return a}calculateVariance(e,t,a,r,n){for(var l=0;l<this.data.length;l++){var i=this.data[l],o=i.data[r.id].value,h=i.data[n.id].value;if("absolute"===a)var u={value:o-h,rendered:""===e?(o-h).toString():s.a.format(e,o-h),cell_style:[]};else{var c=(o-h)/Math.abs(h);u={value:c,rendered:s.a.format("#0.00%",100*c),cell_style:[]}}"total"!=i.type&&"subtotal"!=i.type||u.cell_style.push("total"),u.value<0&&u.cell_style.push("red"),i.data[t]=u}}addVarianceColumns(e){["absolute","percent"].forEach(t=>{Object.keys(this.variances).forEach(a=>{var r=this.variances[a];if("no_variance"!==r.comparison&&"vs_measure"===r.type&&!this.has_pivots){var s=["$$$_variance_$$$",t,r.baseline,r.comparison].join("|"),n=new i(s),l=this.getColumnById(r.baseline),o=this.getColumnById(r.comparison);"absolute"===t?(n.idx=l.idx+1,n.label="Var #"):(n.idx=l.idx+2,n.label="Var %");try{void 0!==e.columnOrder[n.id]?n.pos=e.columnOrder[n.id]:n.pos=n.idx}catch{console.log("addVarianceColumns() catch config.columnOrder undefined"),n.pos=n.idx}n.field={name:s},n.type="measure",n.pivoted=l.pivoted,n.super_=l.super,n.levels=[],n.pivot_key="",n.align="right",n.sort_by_measure_values=[1,n.pos],n.sort_by_pivot_values=[1,n.pos],this.columns.push(n),r.reverse?this.calculateVariance(l.value_format,s,t,o,l):this.calculateVariance(l.value_format,s,t,l,o)}})})}getRenderedFromHtml(e){var t=new DOMParser;if(""!==e.html)try{a=(a=t.parseFromString(e.html,"text/html")).getElementsByTagName("a")[0].innerText}catch(t){var a=e.html}else a=e.value;return a}getLevels(){return n(this.pivot_fields.length+1,0)}setColSpans(e){for(var t=[],a=[],r=[],s=e.length-1;s>=0;s--){var l=e.length-1-s;"getSortByPivots"===this.sortColsBy?t[l]=[...e[s].levels,e[s].field.name]:t[l]=[e[s].field.name,...e[s].levels],a[s]=n(t[l].length,1)}if(this.spanCols){r=n(t[0].length,1);for(var i=0;i<t.length;i++)for(var o=t[i].length-1,h=0;h<o;h++){var u=t[i][h];if(i<t.length-1)var c=t[i+1][h];if(!(i<t.length-1&&u==c)){for(var d=h;d<o;d++)a[i][d]=r[d],r[d]=1;break}a[i][h]=-1,r[h]+=1}if("getSortByPivots"===this.sortColsBy)var f=this.pivot_fields.length+1;else f=0;for(i=t.length-1;i>=0;i--){u=t[i][f];if(i>0)var v=t[i-1][f];i>0&&u==v?(a[i][f]=-1,r[f]+=1):(a[i][f]=r[f],r[f]=1)}a.reverse()}for(s=0;s<e.length;s++)e[s].colspans=a[s];return e}getColumnsToDisplay(e){if(this.useIndexColumn)var t=this.columns.filter(e=>"measure"==e.type||"$$$_index_$$$"==e.id).filter(e=>!e.hide);else t=this.columns.filter(e=>"$$$_index_$$$"!==e.id).filter(e=>!e.hide);return t=this.setColSpans(t).filter(t=>t.colspans[e]>0)}getRow(e){if(this.useIndexColumn)var t=this.columns.filter(e=>"measure"==e.type||"$$$_index_$$$"==e.id).filter(e=>!e.hide);else t=this.columns.filter(e=>"$$$_index_$$$"!==e.id).filter(e=>!e.hide);if(!this.useIndexColumn&&this.spanRows){for(var a=0;a<t.length;a++)t[a].rowspan=1,"line_item"===e.type&&this.rowspan_values[e.id][t[a].id]>0&&(t[a].rowspan=this.rowspan_values[e.id][t[a].id]);"line_item"===e.type&&(t=t.filter(t=>"measure"==t.type||this.rowspan_values[e.id][t.id]>0))}return t}moveColumns(e,t,a,r){if(t!=a){for(var s=a-t,n=e.columnOrder,l=0;l<this.columns.length;l++){var i=this.columns[l];"measure"!=i.type||i.super||(i.pos>=t&&i.pos<t+10?(console.log("MOVING COLUMN",i.id,i.pos,"->",i.pos+s),i.pos+=s):i.pos>=a&&i.pos<t?(console.log("NUDGING COLUMN",i.id,i.pos,"->",i.pos+10),i.pos+=10):i.pos>=t+10&&i.pos<a+10&&(console.log("NUDGING COLUMN",i.id,i.pos,"->",i.pos-10),i.pos-=10),n[i.id]=i.pos)}r(n)}}getSimpleJson(){var e=[];return this.data.forEach(t=>{if("line_item"===t.type){var a={};this.columns.forEach(e=>{a[e.id]=t.data[e.id].value}),e.push(a)}}),e}}}]);
//# sourceMappingURL=looker_data_table.js.map