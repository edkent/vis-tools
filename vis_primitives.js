!function(e){var s={};function t(i){if(s[i])return s[i].exports;var l=s[i]={i:i,l:!1,exports:{}};return e[i].call(l.exports,l,l.exports,t),l.l=!0,l.exports}t.m=e,t.c=s,t.d=function(e,s,i){t.o(e,s)||Object.defineProperty(e,s,{enumerable:!0,get:i})},t.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},t.t=function(e,s){if(1&s&&(e=t(e)),8&s)return e;if(4&s&&"object"==typeof e&&e&&e.__esModule)return e;var i=Object.create(null);if(t.r(i),Object.defineProperty(i,"default",{enumerable:!0,value:e}),2&s&&"string"!=typeof e)for(var l in e)t.d(i,l,function(s){return e[s]}.bind(null,l));return i},t.n=function(e){var s=e&&e.__esModule?function(){return e.default}:function(){return e};return t.d(s,"a",s),s},t.o=function(e,s){return Object.prototype.hasOwnProperty.call(e,s)},t.p="",t(t.s=0)}([function(e,s){class t{constructor({vis:e,queryResponseField:s}){this.vis=e,this.name=s.name,this.view=s.view_label||"",this.label=s.label_short||s.label,this.is_numeric=s.is_numeric,this.is_array=["list","location","tier"].includes(s.type),this.value_format=s.value_format,this.geo_type="",("location"===s.type||s.map_layer)&&(this.geo_type="location"===s.type?"location":s.map_layer.name),this.hide=!1,void 0!==this.vis.config["hide|"+this.name]&&this.vis.config["hide|"+this.name]&&(this.hide=!0),this.style="";var t=this.vis.config["style|"+this.name];void 0!==t&&("hide"===t?this.hide=!0:this.style=t),this.heading="",this.short_name="",this.unit="",void 0!==s.tags&&s.tags.forEach(e=>{var s=e.split(":");if("vis-tools"===s[0])switch(s[1]){case"heading":this.heading=s[2];break;case"short_name":this.short_name=s[2];break;case"unit":this.unit=s[2];break;case"style":this.style=s[2]}})}}class i{constructor({keys:e,values:s,types:t=[]}){if(e.length===s.length){this.keys=e,this.values=s,this.types=t;var i=[],l=[];this.values.forEach((e,s)=>{this.types[s]=void 0!==t[s]?t[s]:"line_item","line_item"===this.types[s]?(i.push(e),l.push(e)):"subtotal"===this.types[s]&&l.push(e)}),this.min_for_display=Math.min(l),this.max_for_display=Math.max(l),this.min=Math.min(i),this.max=Math.max(i),this.sum=i.reduce((e,s)=>e+s,0),this.count=i.length,this.avg=i.length>0?this.sum/i.length:null}else console.log("Could not construct series, arrays were of different length.")}}s.newArray=function(e,s){for(var t=[],i=0;i<e;i++)t.push(s);return t},s.ModelDimension=class extends t{constructor({vis:e,queryResponseField:s}){super({vis:e,queryResponseField:s}),this.type="dimension",this.align="left"}},s.ModelMeasure=class extends t{constructor({vis:e,queryResponseField:s,can_pivot:t}){super({vis:e,queryResponseField:s}),this.type="measure",this.align="right",this.is_table_calculation=void 0!==s.is_table_calculation&&s.is_table_calculation,this.calculation_type=s.type,this.is_turtle=s.is_turtle,this.can_pivot=t}},s.CellSeries=class{constructor({column:e,row:s,sort_value:t,series:l}){this.column=e,this.row=s,this.sort_value=t,this.series=new i(l)}to_string(){var e="";return this.series.keys.forEach((s,t)=>{e+=s+":";var i=""===this.column.modelField.value_format?this.series.values[t].toString():SSF.format(this.column.modelField.value_format,this.series.values[t]);e+=i+" "}),e}},s.ColumnSeries=class{constructor({column:e,is_numeric:s,series:t}){this.column=e,this.is_numeric=s,this.series=new i(t)}},s.PivotField=class{constructor({queryResponseField:e}){this.name=e.name,this.label=e.label_short||e.label,this.view=e.view_label||""}},s.Row=class{constructor(e="line_item"){this.id="",this.modelField=null,this.type=e,this.sort=[],this.data={}}},s.Column=class{constructor(e,s,t){this.id=e,this.vis=s,this.modelField=t,this.transposed=!1,this.idx=0,this.pos=0,this.levels=[],this.pivot_key="",this.colspans=[],this.unit=t.unit||"",this.hide=t.hide||!1,this.variance_type="",this.pivoted=!1,this.subtotal=!1,this.super=!1,this.series=null,this.sort_by_measure_values=[],this.sort_by_pivot_values=[]}getLabel(e){if(this.transposed)return this.labels[e];if(void 0!==this.vis.visId&&"report_table"===this.vis.visId){var s=this.vis.useShortName&&this.modelField.short_name||this.modelField.label;switch(this.variance_type){case"absolute":s="Var #";break;case"percentage":s="Var %"}}else s=this.modelField.label;var t;(void 0!==(t=this.vis.config["label|"+this.modelField.name])&&t!==this.modelField.label&&(s=t||s),void 0!==this.vis.useViewName&&this.vis.useViewName&&(s=[this.modelField.view,s].join(" ")),void 0!==this.vis.has_pivots)&&(this.vis.has_pivots?"getSortByPivots"===this.vis.sortColsBy?e<this.levels.length&&(s=this.levels[e]):e>=1&&(s=this.levels[e-1]):this.vis.useHeadings&&0===e&&(s=void 0!==(t=this.vis.config["heading|"+this.modelField.name])&&t||this.modelField.heading));return s}updateSortByMeasures(e){1==this.sort_by_measure_values[0]&&(this.pivoted||this.subtotal||(this.sort_by_measure_values=[1,e]))}getSortByMeasures(){return this.sort_by_measure_values}getSortByPivots(){return this.sort_by_pivot_values}}}]);
//# sourceMappingURL=vis_primitives.js.map