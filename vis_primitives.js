!function(e){var t={};function i(s){if(t[s])return t[s].exports;var l=t[s]={i:s,l:!1,exports:{}};return e[s].call(l.exports,l,l.exports,i),l.l=!0,l.exports}i.m=e,i.c=t,i.d=function(e,t,s){i.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:s})},i.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},i.t=function(e,t){if(1&t&&(e=i(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var s=Object.create(null);if(i.r(s),Object.defineProperty(s,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var l in e)i.d(s,l,function(t){return e[t]}.bind(null,l));return s},i.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return i.d(t,"a",t),t},i.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},i.p="",i(i.s=0)}([function(e,t){class i{constructor({vis:e,queryResponseField:t}){this.vis=e,this.name=t.name,this.view=t.view_label||"",this.label=t.field_group_variant||t.label_short||t.label,this.is_numeric=void 0!==t.is_numeric&&t.is_numeric,this.is_array=["list","number_list","location","tier"].includes(t.type),this.value_format=t.value_format?t.value_format:"",this.geo_type="",("location"===t.type||t.map_layer)&&(this.geo_type="location"===t.type?"location":t.map_layer.name),this.hide=!1,void 0!==this.vis.config["hide|"+this.name]&&this.vis.config["hide|"+this.name]&&(this.hide=!0),this.style="";var i=this.vis.config["style|"+this.name];void 0!==i&&("hide"===i?this.hide=!0:this.style=i),this.heading="",this.short_name="",this.unit="",void 0!==t.tags&&t.tags.forEach(e=>{var t=e.split(":");if("vis-tools"===t[0])switch(t[1]){case"heading":this.heading=t[2];break;case"short_name":this.short_name=t[2];break;case"unit":this.unit=t[2];break;case"style":this.style=t[2]}})}}class s{constructor({keys:e,values:t,types:i=[]}){if(e.length===t.length){this.keys=e,this.values=t,this.types=i;var s=[],l=[];this.values.forEach((e,t)=>{this.types[t]=void 0!==i[t]?i[t]:"line_item","line_item"===this.types[t]?(s.push(e),l.push(e)):"subtotal"===this.types[t]&&l.push(e)}),this.min_for_display=Math.min(...l),this.max_for_display=Math.max(...l),this.min=Math.min(...s),this.max=Math.max(...s),this.sum=s.reduce((e,t)=>e+t,0),this.count=s.length,this.avg=s.length>0?this.sum/s.length:null}else console.log("Could not construct series, arrays were of different length.")}}t.newArray=function(e,t){for(var i=[],s=0;s<e;s++)i.push(t);return i},t.ModelDimension=class extends i{constructor({vis:e,queryResponseField:t}){super({vis:e,queryResponseField:t}),this.type="dimension",this.align="left"}},t.ModelPivot=class extends i{constructor({vis:e,queryResponseField:t}){super({vis:e,queryResponseField:t}),this.type="pivot",this.align="center"}},t.ModelMeasure=class extends i{constructor({vis:e,queryResponseField:t,can_pivot:i}){super({vis:e,queryResponseField:t}),this.type="measure",this.align="right",this.is_table_calculation=void 0!==t.is_table_calculation&&t.is_table_calculation,this.calculation_type=t.type,this.is_turtle=void 0!==t.is_turtle&&t.is_turtle,this.can_pivot=i}},t.CellSeries=class{constructor({column:e,row:t,sort_value:i,series:l}){this.column=e,this.row=t,this.sort_value=i,this.series=new s(l)}toString(){var e="";return this.series.keys.forEach((t,i)=>{e+=t+":";var s=""===this.column.modelField.value_format?this.series.values[i].toString():SSF.format(this.column.modelField.value_format,this.series.values[i]);e+=s+" "}),e}},t.ColumnSeries=class{constructor({column:e,is_numeric:t,series:i}){this.column=e,this.is_numeric=t,this.series=new s(i)}},t.HeaderCell=class{constructor({column:e,type:t,label:i=null,align:s="center",modelField:l={name:"",label:"",view:""},pivotData:a={}}={column:e,type:t,label:i,align:s,modelField:l,pivotData:a}){this.id=[e.id,t].join("."),this.column=e,this.type=t,this.colspan=1,this.headerRow=!0,this.cell_style=["headerCell"],this.label=i,"dimension"===this.column.modelField.type?this.align="pivot"===t?"right":"heading"===t?"center":l.align||"left":"measure"===this.column.modelField.type?"field"!==t||0!==e.vis.pivot_fields.length&&"getSortByPivots"!==e.vis.sortColsBy?this.align="center":this.align=l.align||"right":this.align=s,this.modelField=l,this.pivotData=a,l.type&&this.cell_style.push(l.type),l.is_table_calculation&&this.cell_style.push("calculation")}},t.DataCell=class{constructor({value:e,rendered:t=null,html:i=null,links:s=[],cell_style:l=[],align:a="right",rowid:r="",colid:n="",rowspan:o=1,colspan:h=1}={}){this.value=e,this.rendered=t,this.html=i,this.links=s,this.cell_style=l,this.align=a,this.rowid=r,this.colid=n,this.rowspan=o,this.colspan=h}},t.Row=class{constructor(e="line_item"){this.id="",this.hide=!1,this.type=e,this.sort=[],this.data={}}},t.Column=class{constructor(e,t,i){this.id=e,this.vis=t,this.modelField=i,this.transposed=!1,this.idx=0,this.pos=0,this.levels=[],this.pivot_key="",this.unit=i.unit||"",this.hide=i.hide||!1,this.isVariance=!1,this.variance_type=null,this.pivoted=!1,this.isRowTotal=!1,this.super=!1,this.subtotal=!1,this.subtotal_data={},this.series=null,this.sort=[],this.colspans=[];var s={};this.vis.headers.forEach(e=>{s[e.type]=1}),this.vis.colspan_values[this.id]=s}getHeaderCellLabel(e){var t=this.levels[e];if(null!==t.label)var i=t.label;else{i=t.modelField.label;var s=this.vis.config["heading|"+t.modelField.name],l=this.vis.config["label|"+t.modelField.name];if("heading"===t.type)return i=void 0!==s&&s||t.modelField.heading;"field"===t.type&&(i=this.vis.useShortName&&t.modelField.short_name||t.modelField.label,void 0!==l&&l!==this.modelField.label&&(i=l||i),this.isVariance&&(i=this.vis.groupVarianceColumns?2===this.vis.pivot_values.length?"absolute"===this.variance_type?i+" #":i+" %":"absolute"===this.variance_type?i+" Var #":i+" Var %":"absolute"===this.variance_type?"Var #":"Var %"),void 0!==this.vis.useViewName&&this.vis.useViewName&&(i=[this.modelField.view,i].join(" "))),"pivot"===t.type&&this.isVariance&&this.vis.groupVarianceColumns&&(i=2===this.vis.pivot_values.length?"Variance":"Var "+i)}return i}getHeaderCellLabelByType(e){for(var t=0;t<this.vis.headers.length;t++)if(e===this.vis.headers[t].type)return this.getHeaderCellLabel(t);return null}setHeaderCellLabels(){this.levels.forEach((e,t)=>{e.label=null===e.label?this.getHeaderCellLabel(t):e.label})}getHeaderData(){var e={};return this.modelField.vis.headers.forEach((t,i)=>{e[t.type]=this.levels[i]}),e}}}]);
//# sourceMappingURL=vis_primitives.js.map