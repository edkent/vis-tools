/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

/**
 * Returns an array of given length, all populated with same value
 * Convenience function e.g. to initialise arrays of zeroes or nulls
 * @param {*} length 
 * @param {*} value 
 */
const newArray = function(length, value) {
  var arr = []
  for (var l = 0; l < length; l++) {
    arr.push(value)
  }
  return arr
}

class ModelField {
  constructor({ vis, queryResponseField }) {
    this.vis = vis
    this.name = queryResponseField.name
    this.view = queryResponseField.view_label || ''
    this.label = queryResponseField.field_group_variant || queryResponseField.label_short || queryResponseField.label
    this.is_numeric = typeof queryResponseField.is_numeric !== 'undefined' ? queryResponseField.is_numeric : false
    this.is_array = ['list', 'number_list', 'location', 'tier'].includes(queryResponseField.type)
    this.value_format = queryResponseField.value_format ? queryResponseField.value_format : ''

    this.geo_type = ''
    if (queryResponseField.type === 'location' || queryResponseField.map_layer) {
      this.geo_type = queryResponseField.type === 'location' ? 'location' : queryResponseField.map_layer.name
    } 

    this.hide = false
    if (typeof this.vis.config['hide|' + this.name] !== 'undefined') {
      if (this.vis.config['hide|' + this.name]) {
        this.hide = true
      } 
    }

    this.style = ''
    var style_setting = this.vis.config['style|' + this.name]
    if (typeof style_setting !== 'undefined') {
      if (style_setting === 'hide') {
        this.hide = true
      } else {
        this.style = style_setting
      }
    }

    this.heading = ''
    this.short_name = ''
    this.unit = ''
    if (typeof queryResponseField.tags !== 'undefined') {
      queryResponseField.tags.forEach(tag => {
        var tags = tag.split(':')
        if (tags[0] === 'vis-tools') {
          switch (tags[1]) {
            case 'heading':
              this.heading = tags[2] ; break
            case 'short_name':
              this.short_name = tags[2] ; break
            case 'unit':
              this.unit = tags[2] ; break
            case 'style':
              this.style = tags[2] ; break
          }
        }
      })
    }
  }
}

class ModelDimension extends ModelField {
  constructor({ vis, queryResponseField }) {
    super({ vis, queryResponseField })

    this.type = 'dimension'    
    this.align = 'left'
  }
}

class ModelPivot extends ModelField {
  constructor({ vis, queryResponseField }) {
    super({ vis, queryResponseField })

    this.type = 'pivot'    
    this.align = 'center'
  }
}

class ModelMeasure extends ModelField {
  constructor({ vis, queryResponseField, can_pivot }) {
    super({ vis, queryResponseField })

    this.type = 'measure'
    this.align = 'right'

    this.is_table_calculation = typeof queryResponseField.is_table_calculation !== 'undefined' ? queryResponseField.is_table_calculation : false
    this.calculation_type = queryResponseField.type
    this.is_turtle = typeof queryResponseField.is_turtle !== 'undefined' ? queryResponseField.is_turtle : false
    this.can_pivot = can_pivot
  }
}

class HeaderCell {
  constructor({ column, type, label = null, align = '', cell_style = [], modelField = { name: '', label: '', view: '' }, pivotData = {} } = { column, type, label, align, cell_style, modelField, pivotData }) {
    this.id = [column.id, type].join('.')
    this.column = column
    this.type = type
    this.colspan = 1
    this.rowspan = 1
    this.headerRow = true
    this.cell_style = ['headerCell'].concat(cell_style)
    this.label = label

    this.align = align ? align : this.column.modelField.is_numeric ? 'right' : 'left'

    // if (column.vis.sortColsBy === 'pivots') {
    //   if (type.startsWith 'pivot') {
    //     this.align = 'center'
    //   }
    // } else {

    // }

    // if (this.column.modelField.type === 'dimension') {
    //   if (type === 'pivot') {
    //     this.align = 'right'
    //   } else if (type === 'heading') {
    //     this.align = 'center'
    //   } else {
    //     this.align = modelField.align || 'left'
    //   }
    // } else if (this.column.modelField.type === 'measure') {
    //   if (type === 'field' && (column.vis.pivot_fields.length === 0 || column.vis.sortColsBy === 'getSortByPivots' )) {
    //     this.align = modelField.align || 'right'
    //   } else {
    //     this.align = 'center'
    //   }
    // } else {
    //   this.align = align
    // }

    this.modelField = modelField
    this.pivotData = pivotData

    if (modelField.type) { this.cell_style.push(modelField.type)}
    if (modelField.is_table_calculation) { this.cell_style.push('calculation')}
  }
}

/**
 * types: dimension | line_item | subtotal | total
 */
class Series {
  constructor({ keys, values, types = [] }) {
    if (keys.length === values.length ) {
      this.keys = keys
      this.values = values
      this.types = types

      var line_items_only = []
      var with_subtotals = []

      this.values.forEach((value, i) => {
        this.types[i] = typeof types[i] !== 'undefined' ? types[i] : 'line_item'
        if (this.types[i] === 'line_item') {
          line_items_only.push(value)
          with_subtotals.push(value)
        } else if (this.types[i] === 'subtotal') {
          with_subtotals.push(value)
        }
      })

      this.min_for_display = Math.min(...with_subtotals)
      this.max_for_display = Math.max(...with_subtotals)
      this.min = Math.min(...line_items_only)
      this.max = Math.max(...line_items_only)
      this.sum = line_items_only.reduce((a, b) => a + b, 0)
      this.count = line_items_only.length
      this.avg = line_items_only.length > 0 ? this.sum / line_items_only.length : null
    } else {
      console.log('Could not construct series, arrays were of different length.')
    }
  }
}

class CellSeries {
  constructor({ column, row, sort_value, series}) {
    this.column = column
    this.row = row
    this.sort_value = sort_value
    this.series = new Series(series)
  }

  toString() {
    var rendered = ''
    this.series.keys.forEach((key, i) => {
      rendered += key + ':'
      var formatted_value = this.column.modelField.value_format === '' 
                            ? this.series.values[i].toString() 
                            : SSF.format(this.column.modelField.value_format, this.series.values[i])
      rendered += formatted_value + ' '
    })
    return rendered
  }
}

class ColumnSeries {
  constructor({ column, is_numeric, series }) {
    this.column = column
    this.is_numeric = is_numeric
    this.series = new Series(series)
  }
}

class DataCell {
  constructor({ value, rendered = null, html = null, links = [], cell_style = [], align = 'right', rowspan = 1, colspan = 1, rowid = '', colid = '' } = {})
    {
      this.value = value
      this.rendered = rendered
      this.html = html
      this.links = links
      this.cell_style = ['rowCell'].concat(cell_style)
      this.align = align
      this.rowspan = rowspan
      this.colspan = colspan

      this.colid = colid
      this.rowid = rowid
      this.id = colid && rowid ? [colid, rowid].join('.') : null

      if (this.value === null && this.rendered !== '∞') {
        this.rendered = '∅'
      }
    }
}

/**
 * Represents a row in the dataset that populates the vis.
 * This may be an addtional row (e.g. subtotal) not in the original query
 * @class
 */
class Row {
  constructor(type = 'line_item') {
    this.id = ''
    // this.modelField = null
    this.hide = false
    this.type = type  // line_item | subtotal | total
    this.sort = []    // [ section, subtotal group, row number ]
    this.data = {}    // Indexed by Column.id
                      // { value: any, rendered: string, html?: string, links?: array }
  }
}

/**
 * Represents a column in the dataset that populates the vis.
 * This may be an additional columns (e.g. subtotal, variance) not in the original query
 * 
 * Ensures all key vis properties (e.g. 'label') are consistent across different field types
 * 
 * @class
 */
class Column {
  constructor(id, vis, modelField) {
    this.id = id
    this.vis = vis
    this.modelField = modelField
    this.transposed = false

    this.idx = 0
    this.pos = 0
    this.levels = []
    this.pivot_key = '' 

    this.unit = modelField.unit || ''
    this.hide = modelField.hide || false
    this.isVariance = false
    this.variance_type = null
    this.pivoted = false
    this.isRowTotal = false
    this.super = false
    this.subtotal = false
    this.subtotal_data = {}
    
    this.series = null

    this.sort = []
    this.colspans = []
  }

  /**
   * Returns a header label for a column, to display in table vis
   * @param {*} level
   */
  getHeaderCellLabel (level) {
    var headerCell = this.levels[level]

    if (headerCell.label !== null) {
      var label = headerCell.label
    } else {
      var label = headerCell.modelField.label
      var header_setting = this.vis.config['heading|' + headerCell.modelField.name]
      var label_setting = this.vis.config['label|' + headerCell.modelField.name]

      if (headerCell.type === 'heading') {
        if (typeof header_setting !== 'undefined') {
          label = header_setting ? header_setting : headerCell.modelField.heading
        } else {
          label = headerCell.modelField.heading
        }
        return label
      }

      if (headerCell.type === 'field') {
        label = this.vis.useShortName
          ? headerCell.modelField.short_name || headerCell.modelField.label 
          : headerCell.modelField.label
        
        if (typeof label_setting !== 'undefined' && label_setting !== this.modelField.label) {
          label = label_setting ? label_setting : label
        }

        if (this.isVariance) {
          if (this.vis.groupVarianceColumns) {
            if (this.vis.pivot_values.length === 2) {
              label = this.variance_type === 'absolute' ? label + ' #' : label + ' %'
            } else {
              label = this.variance_type === 'absolute' ? label + ' Var #' : label + ' Var %'
            }
          } else {
            label = this.variance_type === 'absolute' ? 'Var #' : 'Var %'
          }
        }
    
        if (typeof this.vis.useViewName !== 'undefined' && this.vis.useViewName) {
          label = [this.modelField.view, label].join(' ') 
        }
      }

      if (headerCell.type === 'pivot') {
        if (this.isVariance && this.vis.groupVarianceColumns) {
          if (this.vis.pivot_values.length === 2) {
            label = 'Variance'
          } else {
            label = 'Var ' + label
          }
        }
      }
    }

    return label
  }

  getHeaderCellLabelByType (type) {
    for (var i = 0; i < this.vis.headers.length; i++) {
      if (type === this.vis.headers[i].type) {
        return this.getHeaderCellLabel(i)
      }
    }
    return null
  }

  setHeaderCellLabels () {
    this.levels.forEach((level, i) => {
      level.label = level.label === null ? this.getHeaderCellLabel(i) : level.label
    })
  }

  getHeaderData () {
    var headerData = {}
    this.modelField.vis.headers.forEach((header, i) => {
      headerData[header.type] = this.levels[i]
    })

    return headerData
  }
}

exports.newArray = newArray
exports.ModelDimension = ModelDimension
exports.ModelPivot = ModelPivot
exports.ModelMeasure = ModelMeasure
exports.CellSeries = CellSeries
exports.ColumnSeries = ColumnSeries
exports.HeaderCell = HeaderCell
exports.DataCell = DataCell
exports.Row = Row
exports.Column = Column


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

/* ssf.js (C) 2013-present SheetJS -- http://sheetjs.com */
/* vim: set ts=2: */
/*jshint -W041 */
var SSF = ({});
var make_ssf = function make_ssf(SSF){
SSF.version = '0.11.0';
function _strrev(x) { var o = "", i = x.length-1; while(i>=0) o += x.charAt(i--); return o; }
function fill(c,l) { var o = ""; while(o.length < l) o+=c; return o; }
function pad0(v,d){var t=""+v; return t.length>=d?t:fill('0',d-t.length)+t;}
function pad_(v,d){var t=""+v;return t.length>=d?t:fill(' ',d-t.length)+t;}
function rpad_(v,d){var t=""+v; return t.length>=d?t:t+fill(' ',d-t.length);}
function pad0r1(v,d){var t=""+Math.round(v); return t.length>=d?t:fill('0',d-t.length)+t;}
function pad0r2(v,d){var t=""+v; return t.length>=d?t:fill('0',d-t.length)+t;}
var p2_32 = Math.pow(2,32);
function pad0r(v,d){if(v>p2_32||v<-p2_32) return pad0r1(v,d); var i = Math.round(v); return pad0r2(i,d); }
function isgeneral(s, i) { i = i || 0; return s.length >= 7 + i && (s.charCodeAt(i)|32) === 103 && (s.charCodeAt(i+1)|32) === 101 && (s.charCodeAt(i+2)|32) === 110 && (s.charCodeAt(i+3)|32) === 101 && (s.charCodeAt(i+4)|32) === 114 && (s.charCodeAt(i+5)|32) === 97 && (s.charCodeAt(i+6)|32) === 108; }
var days = [
	['Sun', 'Sunday'],
	['Mon', 'Monday'],
	['Tue', 'Tuesday'],
	['Wed', 'Wednesday'],
	['Thu', 'Thursday'],
	['Fri', 'Friday'],
	['Sat', 'Saturday']
];
var months = [
	['J', 'Jan', 'January'],
	['F', 'Feb', 'February'],
	['M', 'Mar', 'March'],
	['A', 'Apr', 'April'],
	['M', 'May', 'May'],
	['J', 'Jun', 'June'],
	['J', 'Jul', 'July'],
	['A', 'Aug', 'August'],
	['S', 'Sep', 'September'],
	['O', 'Oct', 'October'],
	['N', 'Nov', 'November'],
	['D', 'Dec', 'December']
];
function init_table(t) {
	t[0]=  'General';
	t[1]=  '0';
	t[2]=  '0.00';
	t[3]=  '#,##0';
	t[4]=  '#,##0.00';
	t[9]=  '0%';
	t[10]= '0.00%';
	t[11]= '0.00E+00';
	t[12]= '# ?/?';
	t[13]= '# ??/??';
	t[14]= 'm/d/yy';
	t[15]= 'd-mmm-yy';
	t[16]= 'd-mmm';
	t[17]= 'mmm-yy';
	t[18]= 'h:mm AM/PM';
	t[19]= 'h:mm:ss AM/PM';
	t[20]= 'h:mm';
	t[21]= 'h:mm:ss';
	t[22]= 'm/d/yy h:mm';
	t[37]= '#,##0 ;(#,##0)';
	t[38]= '#,##0 ;[Red](#,##0)';
	t[39]= '#,##0.00;(#,##0.00)';
	t[40]= '#,##0.00;[Red](#,##0.00)';
	t[45]= 'mm:ss';
	t[46]= '[h]:mm:ss';
	t[47]= 'mmss.0';
	t[48]= '##0.0E+0';
	t[49]= '@';
	t[56]= '"上午/下午 "hh"時"mm"分"ss"秒 "';
	t[65535]= 'General';
}

var table_fmt = {};
init_table(table_fmt);
function frac(x, D, mixed) {
	var sgn = x < 0 ? -1 : 1;
	var B = x * sgn;
	var P_2 = 0, P_1 = 1, P = 0;
	var Q_2 = 1, Q_1 = 0, Q = 0;
	var A = Math.floor(B);
	while(Q_1 < D) {
		A = Math.floor(B);
		P = A * P_1 + P_2;
		Q = A * Q_1 + Q_2;
		if((B - A) < 0.00000005) break;
		B = 1 / (B - A);
		P_2 = P_1; P_1 = P;
		Q_2 = Q_1; Q_1 = Q;
	}
	if(Q > D) { if(Q_1 > D) { Q = Q_2; P = P_2; } else { Q = Q_1; P = P_1; } }
	if(!mixed) return [0, sgn * P, Q];
	var q = Math.floor(sgn * P/Q);
	return [q, sgn*P - q*Q, Q];
}
function parse_date_code(v,opts,b2) {
	if(v > 2958465 || v < 0) return null;
	var date = (v|0), time = Math.floor(86400 * (v - date)), dow=0;
	var dout=[];
	var out={D:date, T:time, u:86400*(v-date)-time,y:0,m:0,d:0,H:0,M:0,S:0,q:0};
	if(Math.abs(out.u) < 1e-6) out.u = 0;
	if(opts && opts.date1904) date += 1462;
	if(out.u > 0.9999) {
		out.u = 0;
		if(++time == 86400) { out.T = time = 0; ++date; ++out.D; }
	}
	if(date === 60) {dout = b2 ? [1317,10,29] : [1900,2,29]; dow=3;}
	else if(date === 0) {dout = b2 ? [1317,8,29] : [1900,1,0]; dow=6;}
	else {
		if(date > 60) --date;
		/* 1 = Jan 1 1900 in Gregorian */
		var d = new Date(1900, 0, 1);
		d.setDate(d.getDate() + date - 1);
		dout = [d.getFullYear(), d.getMonth()+1,d.getDate()];
		dow = d.getDay();
		if(date < 60) dow = (dow + 6) % 7;
		if(b2) dow = fix_hijri(d, dout);
	}
	out.y = dout[0]; out.m = dout[1]; out.d = dout[2];
	out.S = time % 60; time = Math.floor(time / 60);
	out.M = time % 60; time = Math.floor(time / 60);
	out.H = time;
	out.q = dow;
	return out;
}
SSF.parse_date_code = parse_date_code;
var basedate = new Date(1899, 11, 31, 0, 0, 0);
var dnthresh = basedate.getTime();
var base1904 = new Date(1900, 2, 1, 0, 0, 0);
function datenum_local(v, date1904) {
	var epoch = v.getTime();
	if(date1904) epoch -= 1461*24*60*60*1000;
	else if(v >= base1904) epoch += 24*60*60*1000;
	return (epoch - (dnthresh + (v.getTimezoneOffset() - basedate.getTimezoneOffset()) * 60000)) / (24 * 60 * 60 * 1000);
}
function general_fmt_int(v) { return v.toString(10); }
SSF._general_int = general_fmt_int;
var general_fmt_num = (function make_general_fmt_num() {
var gnr1 = /\.(\d*[1-9])0+$/, gnr2 = /\.0*$/, gnr4 = /\.(\d*[1-9])0+/, gnr5 = /\.0*[Ee]/, gnr6 = /(E[+-])(\d)$/;
function gfn2(v) {
	var w = (v<0?12:11);
	var o = gfn5(v.toFixed(12)); if(o.length <= w) return o;
	o = v.toPrecision(10); if(o.length <= w) return o;
	return v.toExponential(5);
}
function gfn3(v) {
	var o = v.toFixed(11).replace(gnr1,".$1");
	if(o.length > (v<0?12:11)) o = v.toPrecision(6);
	return o;
}
function gfn4(o) {
	for(var i = 0; i != o.length; ++i) if((o.charCodeAt(i) | 0x20) === 101) return o.replace(gnr4,".$1").replace(gnr5,"E").replace("e","E").replace(gnr6,"$10$2");
	return o;
}
function gfn5(o) {
	return o.indexOf(".") > -1 ? o.replace(gnr2,"").replace(gnr1,".$1") : o;
}
return function general_fmt_num(v) {
	var V = Math.floor(Math.log(Math.abs(v))*Math.LOG10E), o;
	if(V >= -4 && V <= -1) o = v.toPrecision(10+V);
	else if(Math.abs(V) <= 9) o = gfn2(v);
	else if(V === 10) o = v.toFixed(10).substr(0,12);
	else o = gfn3(v);
	return gfn5(gfn4(o));
};})();
SSF._general_num = general_fmt_num;
function general_fmt(v, opts) {
	switch(typeof v) {
		case 'string': return v;
		case 'boolean': return v ? "TRUE" : "FALSE";
		case 'number': return (v|0) === v ? v.toString(10) : general_fmt_num(v);
		case 'undefined': return "";
		case 'object':
			if(v == null) return "";
			if(v instanceof Date) return format(14, datenum_local(v, opts && opts.date1904), opts);
	}
	throw new Error("unsupported value in General format: " + v);
}
SSF._general = general_fmt;
function fix_hijri() { return 0; }
/*jshint -W086 */
function write_date(type, fmt, val, ss0) {
	var o="", ss=0, tt=0, y = val.y, out, outl = 0;
	switch(type) {
		case 98: /* 'b' buddhist year */
			y = val.y + 543;
			/* falls through */
		case 121: /* 'y' year */
		switch(fmt.length) {
			case 1: case 2: out = y % 100; outl = 2; break;
			default: out = y % 10000; outl = 4; break;
		} break;
		case 109: /* 'm' month */
		switch(fmt.length) {
			case 1: case 2: out = val.m; outl = fmt.length; break;
			case 3: return months[val.m-1][1];
			case 5: return months[val.m-1][0];
			default: return months[val.m-1][2];
		} break;
		case 100: /* 'd' day */
		switch(fmt.length) {
			case 1: case 2: out = val.d; outl = fmt.length; break;
			case 3: return days[val.q][0];
			default: return days[val.q][1];
		} break;
		case 104: /* 'h' 12-hour */
		switch(fmt.length) {
			case 1: case 2: out = 1+(val.H+11)%12; outl = fmt.length; break;
			default: throw 'bad hour format: ' + fmt;
		} break;
		case 72: /* 'H' 24-hour */
		switch(fmt.length) {
			case 1: case 2: out = val.H; outl = fmt.length; break;
			default: throw 'bad hour format: ' + fmt;
		} break;
		case 77: /* 'M' minutes */
		switch(fmt.length) {
			case 1: case 2: out = val.M; outl = fmt.length; break;
			default: throw 'bad minute format: ' + fmt;
		} break;
		case 115: /* 's' seconds */
			if(fmt != 's' && fmt != 'ss' && fmt != '.0' && fmt != '.00' && fmt != '.000') throw 'bad second format: ' + fmt;
			if(val.u === 0 && (fmt == "s" || fmt == "ss")) return pad0(val.S, fmt.length);
if(ss0 >= 2) tt = ss0 === 3 ? 1000 : 100;
			else tt = ss0 === 1 ? 10 : 1;
			ss = Math.round((tt)*(val.S + val.u));
			if(ss >= 60*tt) ss = 0;
			if(fmt === 's') return ss === 0 ? "0" : ""+ss/tt;
			o = pad0(ss,2 + ss0);
			if(fmt === 'ss') return o.substr(0,2);
			return "." + o.substr(2,fmt.length-1);
		case 90: /* 'Z' absolute time */
		switch(fmt) {
			case '[h]': case '[hh]': out = val.D*24+val.H; break;
			case '[m]': case '[mm]': out = (val.D*24+val.H)*60+val.M; break;
			case '[s]': case '[ss]': out = ((val.D*24+val.H)*60+val.M)*60+Math.round(val.S+val.u); break;
			default: throw 'bad abstime format: ' + fmt;
		} outl = fmt.length === 3 ? 1 : 2; break;
		case 101: /* 'e' era */
			out = y; outl = 1;
	}
	if(outl > 0) return pad0(out, outl); else return "";
}
/*jshint +W086 */
function commaify(s) {
	var w = 3;
	if(s.length <= w) return s;
	var j = (s.length % w), o = s.substr(0,j);
	for(; j!=s.length; j+=w) o+=(o.length > 0 ? "," : "") + s.substr(j,w);
	return o;
}
var write_num = (function make_write_num(){
var pct1 = /%/g;
function write_num_pct(type, fmt, val){
	var sfmt = fmt.replace(pct1,""), mul = fmt.length - sfmt.length;
	return write_num(type, sfmt, val * Math.pow(10,2*mul)) + fill("%",mul);
}
function write_num_cm(type, fmt, val){
	var idx = fmt.length - 1;
	while(fmt.charCodeAt(idx-1) === 44) --idx;
	return write_num(type, fmt.substr(0,idx), val / Math.pow(10,3*(fmt.length-idx)));
}
function write_num_exp(fmt, val){
	var o;
	var idx = fmt.indexOf("E") - fmt.indexOf(".") - 1;
	if(fmt.match(/^#+0.0E\+0$/)) {
		if(val == 0) return "0.0E+0";
		else if(val < 0) return "-" + write_num_exp(fmt, -val);
		var period = fmt.indexOf("."); if(period === -1) period=fmt.indexOf('E');
		var ee = Math.floor(Math.log(val)*Math.LOG10E)%period;
		if(ee < 0) ee += period;
		o = (val/Math.pow(10,ee)).toPrecision(idx+1+(period+ee)%period);
		if(o.indexOf("e") === -1) {
			var fakee = Math.floor(Math.log(val)*Math.LOG10E);
			if(o.indexOf(".") === -1) o = o.charAt(0) + "." + o.substr(1) + "E+" + (fakee - o.length+ee);
			else o += "E+" + (fakee - ee);
			while(o.substr(0,2) === "0.") {
				o = o.charAt(0) + o.substr(2,period) + "." + o.substr(2+period);
				o = o.replace(/^0+([1-9])/,"$1").replace(/^0+\./,"0.");
			}
			o = o.replace(/\+-/,"-");
		}
		o = o.replace(/^([+-]?)(\d*)\.(\d*)[Ee]/,function($$,$1,$2,$3) { return $1 + $2 + $3.substr(0,(period+ee)%period) + "." + $3.substr(ee) + "E"; });
	} else o = val.toExponential(idx);
	if(fmt.match(/E\+00$/) && o.match(/e[+-]\d$/)) o = o.substr(0,o.length-1) + "0" + o.charAt(o.length-1);
	if(fmt.match(/E\-/) && o.match(/e\+/)) o = o.replace(/e\+/,"e");
	return o.replace("e","E");
}
var frac1 = /# (\?+)( ?)\/( ?)(\d+)/;
function write_num_f1(r, aval, sign) {
	var den = parseInt(r[4],10), rr = Math.round(aval * den), base = Math.floor(rr/den);
	var myn = (rr - base*den), myd = den;
	return sign + (base === 0 ? "" : ""+base) + " " + (myn === 0 ? fill(" ", r[1].length + 1 + r[4].length) : pad_(myn,r[1].length) + r[2] + "/" + r[3] + pad0(myd,r[4].length));
}
function write_num_f2(r, aval, sign) {
	return sign + (aval === 0 ? "" : ""+aval) + fill(" ", r[1].length + 2 + r[4].length);
}
var dec1 = /^#*0*\.([0#]+)/;
var closeparen = /\).*[0#]/;
var phone = /\(###\) ###\\?-####/;
function hashq(str) {
	var o = "", cc;
	for(var i = 0; i != str.length; ++i) switch((cc=str.charCodeAt(i))) {
		case 35: break;
		case 63: o+= " "; break;
		case 48: o+= "0"; break;
		default: o+= String.fromCharCode(cc);
	}
	return o;
}
function rnd(val, d) { var dd = Math.pow(10,d); return ""+(Math.round(val * dd)/dd); }
function dec(val, d) {
	if (d < ('' + Math.round((val-Math.floor(val))*Math.pow(10,d))).length) {
		return 0;
	}
	return Math.round((val-Math.floor(val))*Math.pow(10,d));
}
function carry(val, d) {
	if (d < ('' + Math.round((val-Math.floor(val))*Math.pow(10,d))).length) {
		return 1;
	}
	return 0;
}
function flr(val) { if(val < 2147483647 && val > -2147483648) return ""+(val >= 0 ? (val|0) : (val-1|0)); return ""+Math.floor(val); }
function write_num_flt(type, fmt, val) {
	if(type.charCodeAt(0) === 40 && !fmt.match(closeparen)) {
		var ffmt = fmt.replace(/\( */,"").replace(/ \)/,"").replace(/\)/,"");
		if(val >= 0) return write_num_flt('n', ffmt, val);
		return '(' + write_num_flt('n', ffmt, -val) + ')';
	}
	if(fmt.charCodeAt(fmt.length - 1) === 44) return write_num_cm(type, fmt, val);
	if(fmt.indexOf('%') !== -1) return write_num_pct(type, fmt, val);
	if(fmt.indexOf('E') !== -1) return write_num_exp(fmt, val);
	if(fmt.charCodeAt(0) === 36) return "$"+write_num_flt(type,fmt.substr(fmt.charAt(1)==' '?2:1),val);
	var o;
	var r, ri, ff, aval = Math.abs(val), sign = val < 0 ? "-" : "";
	if(fmt.match(/^00+$/)) return sign + pad0r(aval,fmt.length);
	if(fmt.match(/^[#?]+$/)) {
		o = pad0r(val,0); if(o === "0") o = "";
		return o.length > fmt.length ? o : hashq(fmt.substr(0,fmt.length-o.length)) + o;
	}
	if((r = fmt.match(frac1))) return write_num_f1(r, aval, sign);
	if(fmt.match(/^#+0+$/)) return sign + pad0r(aval,fmt.length - fmt.indexOf("0"));
	if((r = fmt.match(dec1))) {
		o = rnd(val, r[1].length).replace(/^([^\.]+)$/,"$1."+hashq(r[1])).replace(/\.$/,"."+hashq(r[1])).replace(/\.(\d*)$/,function($$, $1) { return "." + $1 + fill("0", hashq(r[1]).length-$1.length); });
		return fmt.indexOf("0.") !== -1 ? o : o.replace(/^0\./,".");
	}
	fmt = fmt.replace(/^#+([0.])/, "$1");
	if((r = fmt.match(/^(0*)\.(#*)$/))) {
		return sign + rnd(aval, r[2].length).replace(/\.(\d*[1-9])0*$/,".$1").replace(/^(-?\d*)$/,"$1.").replace(/^0\./,r[1].length?"0.":".");
	}
	if((r = fmt.match(/^#{1,3},##0(\.?)$/))) return sign + commaify(pad0r(aval,0));
	if((r = fmt.match(/^#,##0\.([#0]*0)$/))) {
		return val < 0 ? "-" + write_num_flt(type, fmt, -val) : commaify(""+(Math.floor(val) + carry(val, r[1].length))) + "." + pad0(dec(val, r[1].length),r[1].length);
	}
	if((r = fmt.match(/^#,#*,#0/))) return write_num_flt(type,fmt.replace(/^#,#*,/,""),val);
	if((r = fmt.match(/^([0#]+)(\\?-([0#]+))+$/))) {
		o = _strrev(write_num_flt(type, fmt.replace(/[\\-]/g,""), val));
		ri = 0;
		return _strrev(_strrev(fmt.replace(/\\/g,"")).replace(/[0#]/g,function(x){return ri<o.length?o.charAt(ri++):x==='0'?'0':"";}));
	}
	if(fmt.match(phone)) {
		o = write_num_flt(type, "##########", val);
		return "(" + o.substr(0,3) + ") " + o.substr(3, 3) + "-" + o.substr(6);
	}
	var oa = "";
	if((r = fmt.match(/^([#0?]+)( ?)\/( ?)([#0?]+)/))) {
		ri = Math.min(r[4].length,7);
		ff = frac(aval, Math.pow(10,ri)-1, false);
		o = "" + sign;
		oa = write_num("n", r[1], ff[1]);
		if(oa.charAt(oa.length-1) == " ") oa = oa.substr(0,oa.length-1) + "0";
		o += oa + r[2] + "/" + r[3];
		oa = rpad_(ff[2],ri);
		if(oa.length < r[4].length) oa = hashq(r[4].substr(r[4].length-oa.length)) + oa;
		o += oa;
		return o;
	}
	if((r = fmt.match(/^# ([#0?]+)( ?)\/( ?)([#0?]+)/))) {
		ri = Math.min(Math.max(r[1].length, r[4].length),7);
		ff = frac(aval, Math.pow(10,ri)-1, true);
		return sign + (ff[0]||(ff[1] ? "" : "0")) + " " + (ff[1] ? pad_(ff[1],ri) + r[2] + "/" + r[3] + rpad_(ff[2],ri): fill(" ", 2*ri+1 + r[2].length + r[3].length));
	}
	if((r = fmt.match(/^[#0?]+$/))) {
		o = pad0r(val, 0);
		if(fmt.length <= o.length) return o;
		return hashq(fmt.substr(0,fmt.length-o.length)) + o;
	}
	if((r = fmt.match(/^([#0?]+)\.([#0]+)$/))) {
		o = "" + val.toFixed(Math.min(r[2].length,10)).replace(/([^0])0+$/,"$1");
		ri = o.indexOf(".");
		var lres = fmt.indexOf(".") - ri, rres = fmt.length - o.length - lres;
		return hashq(fmt.substr(0,lres) + o + fmt.substr(fmt.length-rres));
	}
	if((r = fmt.match(/^00,000\.([#0]*0)$/))) {
		ri = dec(val, r[1].length);
		return val < 0 ? "-" + write_num_flt(type, fmt, -val) : commaify(flr(val)).replace(/^\d,\d{3}$/,"0$&").replace(/^\d*$/,function($$) { return "00," + ($$.length < 3 ? pad0(0,3-$$.length) : "") + $$; }) + "." + pad0(ri,r[1].length);
	}
	switch(fmt) {
		case "###,##0.00": return write_num_flt(type, "#,##0.00", val);
		case "###,###":
		case "##,###":
		case "#,###": var x = commaify(pad0r(aval,0)); return x !== "0" ? sign + x : "";
		case "###,###.00": return write_num_flt(type, "###,##0.00",val).replace(/^0\./,".");
		case "#,###.00": return write_num_flt(type, "#,##0.00",val).replace(/^0\./,".");
		default:
	}
	throw new Error("unsupported format |" + fmt + "|");
}
function write_num_cm2(type, fmt, val){
	var idx = fmt.length - 1;
	while(fmt.charCodeAt(idx-1) === 44) --idx;
	return write_num(type, fmt.substr(0,idx), val / Math.pow(10,3*(fmt.length-idx)));
}
function write_num_pct2(type, fmt, val){
	var sfmt = fmt.replace(pct1,""), mul = fmt.length - sfmt.length;
	return write_num(type, sfmt, val * Math.pow(10,2*mul)) + fill("%",mul);
}
function write_num_exp2(fmt, val){
	var o;
	var idx = fmt.indexOf("E") - fmt.indexOf(".") - 1;
	if(fmt.match(/^#+0.0E\+0$/)) {
		if(val == 0) return "0.0E+0";
		else if(val < 0) return "-" + write_num_exp2(fmt, -val);
		var period = fmt.indexOf("."); if(period === -1) period=fmt.indexOf('E');
		var ee = Math.floor(Math.log(val)*Math.LOG10E)%period;
		if(ee < 0) ee += period;
		o = (val/Math.pow(10,ee)).toPrecision(idx+1+(period+ee)%period);
		if(!o.match(/[Ee]/)) {
			var fakee = Math.floor(Math.log(val)*Math.LOG10E);
			if(o.indexOf(".") === -1) o = o.charAt(0) + "." + o.substr(1) + "E+" + (fakee - o.length+ee);
			else o += "E+" + (fakee - ee);
			o = o.replace(/\+-/,"-");
		}
		o = o.replace(/^([+-]?)(\d*)\.(\d*)[Ee]/,function($$,$1,$2,$3) { return $1 + $2 + $3.substr(0,(period+ee)%period) + "." + $3.substr(ee) + "E"; });
	} else o = val.toExponential(idx);
	if(fmt.match(/E\+00$/) && o.match(/e[+-]\d$/)) o = o.substr(0,o.length-1) + "0" + o.charAt(o.length-1);
	if(fmt.match(/E\-/) && o.match(/e\+/)) o = o.replace(/e\+/,"e");
	return o.replace("e","E");
}
function write_num_int(type, fmt, val) {
	if(type.charCodeAt(0) === 40 && !fmt.match(closeparen)) {
		var ffmt = fmt.replace(/\( */,"").replace(/ \)/,"").replace(/\)/,"");
		if(val >= 0) return write_num_int('n', ffmt, val);
		return '(' + write_num_int('n', ffmt, -val) + ')';
	}
	if(fmt.charCodeAt(fmt.length - 1) === 44) return write_num_cm2(type, fmt, val);
	if(fmt.indexOf('%') !== -1) return write_num_pct2(type, fmt, val);
	if(fmt.indexOf('E') !== -1) return write_num_exp2(fmt, val);
	if(fmt.charCodeAt(0) === 36) return "$"+write_num_int(type,fmt.substr(fmt.charAt(1)==' '?2:1),val);
	var o;
	var r, ri, ff, aval = Math.abs(val), sign = val < 0 ? "-" : "";
	if(fmt.match(/^00+$/)) return sign + pad0(aval,fmt.length);
	if(fmt.match(/^[#?]+$/)) {
		o = (""+val); if(val === 0) o = "";
		return o.length > fmt.length ? o : hashq(fmt.substr(0,fmt.length-o.length)) + o;
	}
	if((r = fmt.match(frac1))) return write_num_f2(r, aval, sign);
	if(fmt.match(/^#+0+$/)) return sign + pad0(aval,fmt.length - fmt.indexOf("0"));
	if((r = fmt.match(dec1))) {
o = (""+val).replace(/^([^\.]+)$/,"$1."+hashq(r[1])).replace(/\.$/,"."+hashq(r[1]));
		o = o.replace(/\.(\d*)$/,function($$, $1) {
return "." + $1 + fill("0", hashq(r[1]).length-$1.length); });
		return fmt.indexOf("0.") !== -1 ? o : o.replace(/^0\./,".");
	}
	fmt = fmt.replace(/^#+([0.])/, "$1");
	if((r = fmt.match(/^(0*)\.(#*)$/))) {
		return sign + (""+aval).replace(/\.(\d*[1-9])0*$/,".$1").replace(/^(-?\d*)$/,"$1.").replace(/^0\./,r[1].length?"0.":".");
	}
	if((r = fmt.match(/^#{1,3},##0(\.?)$/))) return sign + commaify((""+aval));
	if((r = fmt.match(/^#,##0\.([#0]*0)$/))) {
		return val < 0 ? "-" + write_num_int(type, fmt, -val) : commaify((""+val)) + "." + fill('0',r[1].length);
	}
	if((r = fmt.match(/^#,#*,#0/))) return write_num_int(type,fmt.replace(/^#,#*,/,""),val);
	if((r = fmt.match(/^([0#]+)(\\?-([0#]+))+$/))) {
		o = _strrev(write_num_int(type, fmt.replace(/[\\-]/g,""), val));
		ri = 0;
		return _strrev(_strrev(fmt.replace(/\\/g,"")).replace(/[0#]/g,function(x){return ri<o.length?o.charAt(ri++):x==='0'?'0':"";}));
	}
	if(fmt.match(phone)) {
		o = write_num_int(type, "##########", val);
		return "(" + o.substr(0,3) + ") " + o.substr(3, 3) + "-" + o.substr(6);
	}
	var oa = "";
	if((r = fmt.match(/^([#0?]+)( ?)\/( ?)([#0?]+)/))) {
		ri = Math.min(r[4].length,7);
		ff = frac(aval, Math.pow(10,ri)-1, false);
		o = "" + sign;
		oa = write_num("n", r[1], ff[1]);
		if(oa.charAt(oa.length-1) == " ") oa = oa.substr(0,oa.length-1) + "0";
		o += oa + r[2] + "/" + r[3];
		oa = rpad_(ff[2],ri);
		if(oa.length < r[4].length) oa = hashq(r[4].substr(r[4].length-oa.length)) + oa;
		o += oa;
		return o;
	}
	if((r = fmt.match(/^# ([#0?]+)( ?)\/( ?)([#0?]+)/))) {
		ri = Math.min(Math.max(r[1].length, r[4].length),7);
		ff = frac(aval, Math.pow(10,ri)-1, true);
		return sign + (ff[0]||(ff[1] ? "" : "0")) + " " + (ff[1] ? pad_(ff[1],ri) + r[2] + "/" + r[3] + rpad_(ff[2],ri): fill(" ", 2*ri+1 + r[2].length + r[3].length));
	}
	if((r = fmt.match(/^[#0?]+$/))) {
		o = "" + val;
		if(fmt.length <= o.length) return o;
		return hashq(fmt.substr(0,fmt.length-o.length)) + o;
	}
	if((r = fmt.match(/^([#0]+)\.([#0]+)$/))) {
		o = "" + val.toFixed(Math.min(r[2].length,10)).replace(/([^0])0+$/,"$1");
		ri = o.indexOf(".");
		var lres = fmt.indexOf(".") - ri, rres = fmt.length - o.length - lres;
		return hashq(fmt.substr(0,lres) + o + fmt.substr(fmt.length-rres));
	}
	if((r = fmt.match(/^00,000\.([#0]*0)$/))) {
		return val < 0 ? "-" + write_num_int(type, fmt, -val) : commaify(""+val).replace(/^\d,\d{3}$/,"0$&").replace(/^\d*$/,function($$) { return "00," + ($$.length < 3 ? pad0(0,3-$$.length) : "") + $$; }) + "." + pad0(0,r[1].length);
	}
	switch(fmt) {
		case "###,###":
		case "##,###":
		case "#,###": var x = commaify(""+aval); return x !== "0" ? sign + x : "";
		default:
			if(fmt.match(/\.[0#?]*$/)) return write_num_int(type, fmt.slice(0,fmt.lastIndexOf(".")), val) + hashq(fmt.slice(fmt.lastIndexOf(".")));
	}
	throw new Error("unsupported format |" + fmt + "|");
}
return function write_num(type, fmt, val) {
	return (val|0) === val ? write_num_int(type, fmt, val) : write_num_flt(type, fmt, val);
};})();
function split_fmt(fmt) {
	var out = [];
	var in_str = false/*, cc*/;
	for(var i = 0, j = 0; i < fmt.length; ++i) switch((/*cc=*/fmt.charCodeAt(i))) {
		case 34: /* '"' */
			in_str = !in_str; break;
		case 95: case 42: case 92: /* '_' '*' '\\' */
			++i; break;
		case 59: /* ';' */
			out[out.length] = fmt.substr(j,i-j);
			j = i+1;
	}
	out[out.length] = fmt.substr(j);
	if(in_str === true) throw new Error("Format |" + fmt + "| unterminated string ");
	return out;
}
SSF._split = split_fmt;
var abstime = /\[[HhMmSs]*\]/;
function fmt_is_date(fmt) {
	var i = 0, /*cc = 0,*/ c = "", o = "";
	while(i < fmt.length) {
		switch((c = fmt.charAt(i))) {
			case 'G': if(isgeneral(fmt, i)) i+= 6; i++; break;
			case '"': for(;(/*cc=*/fmt.charCodeAt(++i)) !== 34 && i < fmt.length;){/*empty*/} ++i; break;
			case '\\': i+=2; break;
			case '_': i+=2; break;
			case '@': ++i; break;
			case 'B': case 'b':
				if(fmt.charAt(i+1) === "1" || fmt.charAt(i+1) === "2") return true;
				/* falls through */
			case 'M': case 'D': case 'Y': case 'H': case 'S': case 'E':
				/* falls through */
			case 'm': case 'd': case 'y': case 'h': case 's': case 'e': case 'g': return true;
			case 'A': case 'a':
				if(fmt.substr(i, 3).toUpperCase() === "A/P") return true;
				if(fmt.substr(i, 5).toUpperCase() === "AM/PM") return true;
				++i; break;
			case '[':
				o = c;
				while(fmt.charAt(i++) !== ']' && i < fmt.length) o += fmt.charAt(i);
				if(o.match(abstime)) return true;
				break;
			case '.':
				/* falls through */
			case '0': case '#':
				while(i < fmt.length && ("0#?.,E+-%".indexOf(c=fmt.charAt(++i)) > -1 || (c=='\\' && fmt.charAt(i+1) == "-" && "0#".indexOf(fmt.charAt(i+2))>-1))){/* empty */}
				break;
			case '?': while(fmt.charAt(++i) === c){/* empty */} break;
			case '*': ++i; if(fmt.charAt(i) == ' ' || fmt.charAt(i) == '*') ++i; break;
			case '(': case ')': ++i; break;
			case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
				while(i < fmt.length && "0123456789".indexOf(fmt.charAt(++i)) > -1){/* empty */} break;
			case ' ': ++i; break;
			default: ++i; break;
		}
	}
	return false;
}
SSF.is_date = fmt_is_date;
function eval_fmt(fmt, v, opts, flen) {
	var out = [], o = "", i = 0, c = "", lst='t', dt, j, cc;
	var hr='H';
	/* Tokenize */
	while(i < fmt.length) {
		switch((c = fmt.charAt(i))) {
			case 'G': /* General */
				if(!isgeneral(fmt, i)) throw new Error('unrecognized character ' + c + ' in ' +fmt);
				out[out.length] = {t:'G', v:'General'}; i+=7; break;
			case '"': /* Literal text */
				for(o="";(cc=fmt.charCodeAt(++i)) !== 34 && i < fmt.length;) o += String.fromCharCode(cc);
				out[out.length] = {t:'t', v:o}; ++i; break;
			case '\\': var w = fmt.charAt(++i), t = (w === "(" || w === ")") ? w : 't';
				out[out.length] = {t:t, v:w}; ++i; break;
			case '_': out[out.length] = {t:'t', v:" "}; i+=2; break;
			case '@': /* Text Placeholder */
				out[out.length] = {t:'T', v:v}; ++i; break;
			case 'B': case 'b':
				if(fmt.charAt(i+1) === "1" || fmt.charAt(i+1) === "2") {
					if(dt==null) { dt=parse_date_code(v, opts, fmt.charAt(i+1) === "2"); if(dt==null) return ""; }
					out[out.length] = {t:'X', v:fmt.substr(i,2)}; lst = c; i+=2; break;
				}
				/* falls through */
			case 'M': case 'D': case 'Y': case 'H': case 'S': case 'E':
				c = c.toLowerCase();
				/* falls through */
			case 'm': case 'd': case 'y': case 'h': case 's': case 'e': case 'g':
				if(v < 0) return "";
				if(dt==null) { dt=parse_date_code(v, opts); if(dt==null) return ""; }
				o = c; while(++i < fmt.length && fmt.charAt(i).toLowerCase() === c) o+=c;
				if(c === 'm' && lst.toLowerCase() === 'h') c = 'M';
				if(c === 'h') c = hr;
				out[out.length] = {t:c, v:o}; lst = c; break;
			case 'A': case 'a':
				var q={t:c, v:c};
				if(dt==null) dt=parse_date_code(v, opts);
				if(fmt.substr(i, 3).toUpperCase() === "A/P") { if(dt!=null) q.v = dt.H >= 12 ? "P" : "A"; q.t = 'T'; hr='h';i+=3;}
				else if(fmt.substr(i,5).toUpperCase() === "AM/PM") { if(dt!=null) q.v = dt.H >= 12 ? "PM" : "AM"; q.t = 'T'; i+=5; hr='h'; }
				else { q.t = "t"; ++i; }
				if(dt==null && q.t === 'T') return "";
				out[out.length] = q; lst = c; break;
			case '[':
				o = c;
				while(fmt.charAt(i++) !== ']' && i < fmt.length) o += fmt.charAt(i);
				if(o.slice(-1) !== ']') throw 'unterminated "[" block: |' + o + '|';
				if(o.match(abstime)) {
					if(dt==null) { dt=parse_date_code(v, opts); if(dt==null) return ""; }
					out[out.length] = {t:'Z', v:o.toLowerCase()};
					lst = o.charAt(1);
				} else if(o.indexOf("$") > -1) {
					o = (o.match(/\$([^-\[\]]*)/)||[])[1]||"$";
					if(!fmt_is_date(fmt)) out[out.length] = {t:'t',v:o};
				}
				break;
			/* Numbers */
			case '.':
				if(dt != null) {
					o = c; while(++i < fmt.length && (c=fmt.charAt(i)) === "0") o += c;
					out[out.length] = {t:'s', v:o}; break;
				}
				/* falls through */
			case '0': case '#':
				o = c; while(++i < fmt.length && "0#?.,E+-%".indexOf(c=fmt.charAt(i)) > -1) o += c;
				out[out.length] = {t:'n', v:o}; break;
			case '?':
				o = c; while(fmt.charAt(++i) === c) o+=c;
				out[out.length] = {t:c, v:o}; lst = c; break;
			case '*': ++i; if(fmt.charAt(i) == ' ' || fmt.charAt(i) == '*') ++i; break; // **
			case '(': case ')': out[out.length] = {t:(flen===1?'t':c), v:c}; ++i; break;
			case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
				o = c; while(i < fmt.length && "0123456789".indexOf(fmt.charAt(++i)) > -1) o+=fmt.charAt(i);
				out[out.length] = {t:'D', v:o}; break;
			case ' ': out[out.length] = {t:c, v:c}; ++i; break;
			case "$": out[out.length] = {t:'t', v:'$'}; ++i; break;
			default:
				if(",$-+/():!^&'~{}<>=€acfijklopqrtuvwxzP".indexOf(c) === -1) throw new Error('unrecognized character ' + c + ' in ' + fmt);
				out[out.length] = {t:'t', v:c}; ++i; break;
		}
	}
	var bt = 0, ss0 = 0, ssm;
	for(i=out.length-1, lst='t'; i >= 0; --i) {
		switch(out[i].t) {
			case 'h': case 'H': out[i].t = hr; lst='h'; if(bt < 1) bt = 1; break;
			case 's':
				if((ssm=out[i].v.match(/\.0+$/))) ss0=Math.max(ss0,ssm[0].length-1);
				if(bt < 3) bt = 3;
			/* falls through */
			case 'd': case 'y': case 'M': case 'e': lst=out[i].t; break;
			case 'm': if(lst === 's') { out[i].t = 'M'; if(bt < 2) bt = 2; } break;
			case 'X': /*if(out[i].v === "B2");*/
				break;
			case 'Z':
				if(bt < 1 && out[i].v.match(/[Hh]/)) bt = 1;
				if(bt < 2 && out[i].v.match(/[Mm]/)) bt = 2;
				if(bt < 3 && out[i].v.match(/[Ss]/)) bt = 3;
		}
	}
	switch(bt) {
		case 0: break;
		case 1:
if(dt.u >= 0.5) { dt.u = 0; ++dt.S; }
			if(dt.S >=  60) { dt.S = 0; ++dt.M; }
			if(dt.M >=  60) { dt.M = 0; ++dt.H; }
			break;
		case 2:
if(dt.u >= 0.5) { dt.u = 0; ++dt.S; }
			if(dt.S >=  60) { dt.S = 0; ++dt.M; }
			break;
	}
	/* replace fields */
	var nstr = "", jj;
	for(i=0; i < out.length; ++i) {
		switch(out[i].t) {
			case 't': case 'T': case ' ': case 'D': break;
			case 'X': out[i].v = ""; out[i].t = ";"; break;
			case 'd': case 'm': case 'y': case 'h': case 'H': case 'M': case 's': case 'e': case 'b': case 'Z':
out[i].v = write_date(out[i].t.charCodeAt(0), out[i].v, dt, ss0);
				out[i].t = 't'; break;
			case 'n': case '?':
				jj = i+1;
				while(out[jj] != null && (
					(c=out[jj].t) === "?" || c === "D" ||
					((c === " " || c === "t") && out[jj+1] != null && (out[jj+1].t === '?' || out[jj+1].t === "t" && out[jj+1].v === '/')) ||
					(out[i].t === '(' && (c === ' ' || c === 'n' || c === ')')) ||
					(c === 't' && (out[jj].v === '/' || out[jj].v === ' ' && out[jj+1] != null && out[jj+1].t == '?'))
				)) {
					out[i].v += out[jj].v;
					out[jj] = {v:"", t:";"}; ++jj;
				}
				nstr += out[i].v;
				i = jj-1; break;
			case 'G': out[i].t = 't'; out[i].v = general_fmt(v,opts); break;
		}
	}
	var vv = "", myv, ostr;
	if(nstr.length > 0) {
		if(nstr.charCodeAt(0) == 40) /* '(' */ {
			myv = (v<0&&nstr.charCodeAt(0) === 45 ? -v : v);
			ostr = write_num('n', nstr, myv);
		} else {
			myv = (v<0 && flen > 1 ? -v : v);
			ostr = write_num('n', nstr, myv);
			if(myv < 0 && out[0] && out[0].t == 't') {
				ostr = ostr.substr(1);
				out[0].v = "-" + out[0].v;
			}
		}
		jj=ostr.length-1;
		var decpt = out.length;
		for(i=0; i < out.length; ++i) if(out[i] != null && out[i].t != 't' && out[i].v.indexOf(".") > -1) { decpt = i; break; }
		var lasti=out.length;
		if(decpt === out.length && ostr.indexOf("E") === -1) {
			for(i=out.length-1; i>= 0;--i) {
				if(out[i] == null || 'n?'.indexOf(out[i].t) === -1) continue;
				if(jj>=out[i].v.length-1) { jj -= out[i].v.length; out[i].v = ostr.substr(jj+1, out[i].v.length); }
				else if(jj < 0) out[i].v = "";
				else { out[i].v = ostr.substr(0, jj+1); jj = -1; }
				out[i].t = 't';
				lasti = i;
			}
			if(jj>=0 && lasti<out.length) out[lasti].v = ostr.substr(0,jj+1) + out[lasti].v;
		}
		else if(decpt !== out.length && ostr.indexOf("E") === -1) {
			jj = ostr.indexOf(".")-1;
			for(i=decpt; i>= 0; --i) {
				if(out[i] == null || 'n?'.indexOf(out[i].t) === -1) continue;
				j=out[i].v.indexOf(".")>-1&&i===decpt?out[i].v.indexOf(".")-1:out[i].v.length-1;
				vv = out[i].v.substr(j+1);
				for(; j>=0; --j) {
					if(jj>=0 && (out[i].v.charAt(j) === "0" || out[i].v.charAt(j) === "#")) vv = ostr.charAt(jj--) + vv;
				}
				out[i].v = vv;
				out[i].t = 't';
				lasti = i;
			}
			if(jj>=0 && lasti<out.length) out[lasti].v = ostr.substr(0,jj+1) + out[lasti].v;
			jj = ostr.indexOf(".")+1;
			for(i=decpt; i<out.length; ++i) {
				if(out[i] == null || ('n?('.indexOf(out[i].t) === -1 && i !== decpt)) continue;
				j=out[i].v.indexOf(".")>-1&&i===decpt?out[i].v.indexOf(".")+1:0;
				vv = out[i].v.substr(0,j);
				for(; j<out[i].v.length; ++j) {
					if(jj<ostr.length) vv += ostr.charAt(jj++);
				}
				out[i].v = vv;
				out[i].t = 't';
				lasti = i;
			}
		}
	}
	for(i=0; i<out.length; ++i) if(out[i] != null && 'n?'.indexOf(out[i].t)>-1) {
		myv = (flen >1 && v < 0 && i>0 && out[i-1].v === "-" ? -v:v);
		out[i].v = write_num(out[i].t, out[i].v, myv);
		out[i].t = 't';
	}
	var retval = "";
	for(i=0; i !== out.length; ++i) if(out[i] != null) retval += out[i].v;
	return retval;
}
SSF._eval = eval_fmt;
var cfregex = /\[[=<>]/;
var cfregex2 = /\[(=|>[=]?|<[>=]?)(-?\d+(?:\.\d*)?)\]/;
function chkcond(v, rr) {
	if(rr == null) return false;
	var thresh = parseFloat(rr[2]);
	switch(rr[1]) {
		case "=":  if(v == thresh) return true; break;
		case ">":  if(v >  thresh) return true; break;
		case "<":  if(v <  thresh) return true; break;
		case "<>": if(v != thresh) return true; break;
		case ">=": if(v >= thresh) return true; break;
		case "<=": if(v <= thresh) return true; break;
	}
	return false;
}
function choose_fmt(f, v) {
	var fmt = split_fmt(f);
	var l = fmt.length, lat = fmt[l-1].indexOf("@");
	if(l<4 && lat>-1) --l;
	if(fmt.length > 4) throw new Error("cannot find right format for |" + fmt.join("|") + "|");
	if(typeof v !== "number") return [4, fmt.length === 4 || lat>-1?fmt[fmt.length-1]:"@"];
	switch(fmt.length) {
		case 1: fmt = lat>-1 ? ["General", "General", "General", fmt[0]] : [fmt[0], fmt[0], fmt[0], "@"]; break;
		case 2: fmt = lat>-1 ? [fmt[0], fmt[0], fmt[0], fmt[1]] : [fmt[0], fmt[1], fmt[0], "@"]; break;
		case 3: fmt = lat>-1 ? [fmt[0], fmt[1], fmt[0], fmt[2]] : [fmt[0], fmt[1], fmt[2], "@"]; break;
		case 4: break;
	}
	var ff = v > 0 ? fmt[0] : v < 0 ? fmt[1] : fmt[2];
	if(fmt[0].indexOf("[") === -1 && fmt[1].indexOf("[") === -1) return [l, ff];
	if(fmt[0].match(cfregex) != null || fmt[1].match(cfregex) != null) {
		var m1 = fmt[0].match(cfregex2);
		var m2 = fmt[1].match(cfregex2);
		return chkcond(v, m1) ? [l, fmt[0]] : chkcond(v, m2) ? [l, fmt[1]] : [l, fmt[m1 != null && m2 != null ? 2 : 1]];
	}
	return [l, ff];
}
function format(fmt,v,o) {
	if(o == null) o = {};
	var sfmt = "";
	switch(typeof fmt) {
		case "string":
			if(fmt == "m/d/yy" && o.dateNF) sfmt = o.dateNF;
			else sfmt = fmt;
			break;
		case "number":
			if(fmt == 14 && o.dateNF) sfmt = o.dateNF;
			else sfmt = (o.table != null ? (o.table) : table_fmt)[fmt];
			break;
	}
	if(isgeneral(sfmt,0)) return general_fmt(v, o);
	if(v instanceof Date) v = datenum_local(v, o.date1904);
	var f = choose_fmt(sfmt, v);
	if(isgeneral(f[1])) return general_fmt(v, o);
	if(v === true) v = "TRUE"; else if(v === false) v = "FALSE";
	else if(v === "" || v == null) return "";
	return eval_fmt(f[1], v, o, f[0]);
}
function load_entry(fmt, idx) {
	if(typeof idx != 'number') {
		idx = +idx || -1;
for(var i = 0; i < 0x0188; ++i) {
if(table_fmt[i] == undefined) { if(idx < 0) idx = i; continue; }
			if(table_fmt[i] == fmt) { idx = i; break; }
		}
if(idx < 0) idx = 0x187;
	}
table_fmt[idx] = fmt;
	return idx;
}
SSF.load = load_entry;
SSF._table = table_fmt;
SSF.get_table = function get_table() { return table_fmt; };
SSF.load_table = function load_table(tbl) {
	for(var i=0; i!=0x0188; ++i)
		if(tbl[i] !== undefined) load_entry(tbl[i], i);
};
SSF.init_table = init_table;
SSF.format = format;
};
make_ssf(SSF);
/*global module */
if( true && typeof DO_NOT_EXPORT_SSF === 'undefined') module.exports = SSF;


/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var ssf__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);
/* harmony import */ var ssf__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(ssf__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _vis_primitives__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(0);
/* harmony import */ var _vis_primitives__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_vis_primitives__WEBPACK_IMPORTED_MODULE_1__);




const tableModelCoreOptions = {
  theme: {
    section: "Theme",
    type: "string",
    display: "select",
    label: "Theme",
    values: [
      { 'Traditional': 'traditional' },
      { 'Looker': 'looker' },
      { 'Contemporary': 'contemporary' },
      { 'Use custom theme': 'custom'}
    ],
    default: "traditional",
    order: 1,
  },
  customTheme: {
    section: "Theme",
    type: "string",
    label: "Load custom CSS from:",
    default: "",
    order: 2,
  },
  layout: {
    section: "Theme",
    type: "string",
    display: "select",
    label: "Layout",
    values: [
      { 'Even': 'fixed' },
      { 'Auto': 'auto' }
    ],
    default: "fixed",
    order: 3,
  },
  minWidthForIndexColumns: {
    section: 'Theme',
    type: 'boolean',
    label: "Automatic column width on index",
    default: true,
    order: 3.5
  },
  headerFontSize: {
    section: 'Theme',
    type: 'number',
    display_size: 'half',
    label: 'Header Size',
    default: 12,
    order: 4,
  },
  bodyFontSize: {
    section: 'Theme',
    type: 'number',
    display_size: 'half',
    label: 'Body Size',
    default: 12,
    order: 5,
  },
  showTooltip: {
    section: 'Theme',
    type: 'boolean',
    display_size: 'half',
    label: "Show tooltip",
    default: true,
    order: 6
  },
  showHighlight: {
    section: 'Theme',
    type: 'boolean',
    display_size: 'half',
    label: "Show highlight",
    default: true,
    order: 7
  },

  columnOrder: {},
  
  rowSubtotals: {
    section: "Table",
    type: "boolean",
    label: "Row Subtotals",
    display_size: 'half',
    default: false,
    order: 1,
  },
  colSubtotals: {
    section: "Table",
    type: "boolean",
    label: "Col Subtotals",
    display_size: 'half',
    default: false,
    order: 2,
  },
  spanRows: {
    section: "Table",
    type: "boolean",
    label: "Merge Dims",
    display_size: 'half',
    default: true,
    order: 3,
  },
  spanCols: {
    section: "Table",
    type: "boolean",
    label: "Merge Headers",
    display_size: 'half',
    default: true,
    order: 4,
  },
  calculateOthers: {
    section: "Table",
    type: "boolean",
    label: "Calculate Others Row",
    default: true,
    order: 4.5
  },
  sortColumnsBy: {
    section: "Table",
    type: "string",
    display: "select",
    label: "Sort Columns By",
    values: [
      { 'Pivots': 'pivots' },
      { 'Measures': 'measures' }
    ],
    default: "pivots",
    order: 6,
  },
  useViewName: {
    section: "Table",
    type: "boolean",
    label: "Include View Name",
    default: false,
    order: 7,
  },
  useHeadings: {
    section: "Table",
    type: "boolean",
    label: "Use Headings",
    default: false,
    order: 8,
  },
  useShortName: {
    section: "Table",
    type: "boolean",
    label: "Use Short Name (from model tags)",
    default: false,
    order: 9,
  },
  useUnit: {
    section: "Table",
    type: "boolean",
    label: "Use Unit (when reporting in 000s)",
    default: false,
    order: 9.5,
  },
  groupVarianceColumns: {
    section: "Table",
    type: "boolean",
    label: "Group Variance Columns",
    default: false,
    order: 10,
  },
  varianceForLastPivotColumnOnly: {
    section: "Table",
    type: "boolean",
    label: "Show Variance columns for last pivot column only",
    default: false,
    order: 10,
  },
  genericLabelForSubtotals: {
    section: 'Table',
    type: 'boolean',
    label: "Label all subtotal rows as 'Subtotal'",
    default: false,
    order: 11
  },
  indexColumn: {
    section: "Dimensions",
    type: "boolean",
    label: "Use Last Field Only",
    default: false,
    order: 0,
  },
  transposeTable: {
    section: "Table",
    type: "boolean",
    label: "Transpose Table",
    default: false,
    order: 100,
  },
}
/**
 * Represents an "enriched data object" with additional methods and properties for data vis
 * Takes the data, config and queryResponse objects as inputs to the constructor
 */
class VisPluginTableModel {
  /**
   * Build the LookerData object
   * @constructor
   * 
   * - TODO: add new column series
   * - TODO: Get table column groups
   * 
   * @param {*} lookerData 
   * @param {*} queryResponse 
   * @param {*} config 
   */
  constructor(lookerData, queryResponse, config) {
    this.visId = 'report_table'
    this.config = config

    this.headers = []
    this.dimensions = []
    this.measures = []
    this.columns = []
    this.data = []
    this.subtotals_data = {}

    this.transposed_headers = []
    this.transposed_columns = []
    this.transposed_data = []

    this.pivot_fields = []
    this.pivot_values = typeof queryResponse.pivots !== 'undefined' ? queryResponse.pivots : []
    this.variances = []
    this.column_series = []

    this.firstVisibleDimension = ''

    this.useIndexColumn = config.indexColumn || false
    this.useHeadings = config.useHeadings || false
    this.useShortName = config.useShortName || false
    this.useViewName = config.useViewName || false
    this.addRowSubtotals = config.rowSubtotals || false
    this.addSubtotalDepth = parseInt(config.subtotalDepth)|| this.dimensions.length - 1
    this.addColSubtotals = config.colSubtotals || false
    this.spanRows =  false || config.spanRows
    this.spanCols =  false || config.spanCols
    this.sortColsBy = config.sortColumnsBy || 'pivots' // matches to Column methods: pivots(), measures)
    this.fieldLevel = 0 // set in addPivotsAndHeaders()
    this.groupVarianceColumns = config.groupVarianceColumns || false
    this.varianceForLastPivotColumnOnly = config.varianceForLastPivotColumnOnly || false
    this.minWidthForIndexColumns = config.minWidthForIndexColumns || false
    this.showTooltip = config.showTooltip || false
    this.showHighlight = config.showHighlight || false
    this.genericLabelForSubtotals = config.genericLabelForSubtotals || false

    this.hasTotals = typeof queryResponse.totals_data !== 'undefined' ? true : false
    this.calculateOthers = typeof queryResponse.truncated !== 'undefined' ? queryResponse.truncated && config.calculateOthers : false 
    this.hasSubtotals = typeof queryResponse.subtotals_data !== 'undefined' ? true : false
    this.hasRowTotals = queryResponse.has_row_totals || false
    this.hasPivots = typeof queryResponse.pivots !== 'undefined' ? true : false
    this.hasSupers = typeof queryResponse.fields.supermeasure_like !== 'undefined' ? Boolean(queryResponse.fields.supermeasure_like.length) : false

    this.transposeTable = config.transposeTable || false

    var col_idx = 0
    this.addPivotsAndHeaders(queryResponse)
    this.addDimensions(queryResponse, col_idx)
    this.addMeasures(queryResponse, col_idx)

    this.checkVarianceCalculations()
    if (this.useIndexColumn) { this.addIndexColumn(queryResponse) }
    if (this.hasSubtotals) { this.checkSubtotalsData(queryResponse) }

    this.addRows(lookerData)
    this.addColumnSeries()

    if (this.hasTotals) { this.buildTotals(queryResponse) }
    if (this.spanRows) { this.setRowSpans() }
    if (this.addRowSubtotals) { this.addSubTotals() }
    if (this.addColSubtotals && this.pivot_fields.length === 2) { this.addColumnSubTotals() }
    if (this.variances) { this.addVarianceColumns() }

    // this.addColumnSeries()    // TODO: add column series for generated columns (eg column subtotals)
    this.sortColumns()
    this.columns.forEach(column => column.setHeaderCellLabels())
    if (this.spanCols) { this.setColSpans() }
    this.applyFormatting()

    if (this.transposeTable) { 
      this.transposeDimensionsIntoHeaders()
      this.transposeRowsIntoColumns() 
      this.transposeColumnsIntoRows()
    }

    this.validateConfig()
    this.getTableColumnGroups() 
  }

  static getCoreConfigOptions() {
    return tableModelCoreOptions
  }

  /**
   * Hook to be called by a Looker custom vis, for example:
   *    this.trigger('registerOptions', VisPluginTableModel.getConfigOptions())
   * 
   * Returns a new config object, combining the core options with dynamic options based on available dimensions and measures
   */
  getConfigOptions() {
    var newOptions = tableModelCoreOptions

    var subtotal_options = []
    this.dimensions.forEach((dimension, i) => {
      newOptions['label|' + dimension.name] = {
        section: 'Dimensions',
        type: 'string',
        label: dimension.label,
        default: dimension.label,
        order: i * 10 + 1,
      }

      newOptions['heading|' + dimension.name] = {
        section: 'Dimensions',
        type: 'string',
        label: 'Heading',
        default: '',
        order: i * 10 + 2,
      }

      newOptions['hide|' + dimension.name] = {
        section: 'Dimensions',
        type: 'boolean',
        label: 'Hide',
        display_size: 'third',
        default: false,
        order: i * 10 + 3,
      }

      if (i < this.dimensions.length - 1) {
        var subtotal_option = {}
        subtotal_option[dimension.label] = (i + 1).toString()
        subtotal_options.push(subtotal_option)
      }
    })

    newOptions['subtotalDepth'] = {
      section: "Table",
      type: "string",
      label: "Sub Total Depth",
      display: 'select',
      values: subtotal_options,
      default: "1",
      order: 5,
    }

    this.measures.forEach((measure, i) => {
      newOptions['label|' + measure.name] = {
        section: 'Measures',
        type: 'string',
        label: measure.label,
        default: measure.label,
        order: 100 + i * 10 + 1,
      }

      newOptions['heading|' + measure.name] = {
        section: 'Measures',
        type: 'string',
        label: 'Heading for ' + measure.label,
        default: '',
        order: 100 + i * 10 + 2,
      }

      newOptions['style|' + measure.name] = {
        section: 'Measures',
        type: 'string',
        label: 'Style',
        display: 'select',
        display_size: 'third',
        values: [
          {'Normal': 'normal'},
          {'Black/Red': 'black_red'},
          {'Subtotal': 'subtotal'},
          {'Hidden': 'hide'}
        ],
        default: 'normal',
        order: 100 + i * 10 + 3
      }

      newOptions['reportIn|' + measure.name] = {
        section: 'Measures',
        type: 'string',
        label: 'Report In',
        display: 'select',
        display_size: 'third',
        values: [
          {'Absolute Figures': '1'},
          {'Thousands': '1000'},
          {'Millions': '1000000'},
          {'Billions': '1000000000'}
        ],
        default: '1',
        order: 100 + i * 10 + 3.5
      }

      newOptions['unit|' + measure.name] = {
        section: 'Measures',
        type: 'string',
        label: 'Unit',
        // display: 'select',
        display_size: 'third',
        default: '',
        order: 100 + i * 10 + 3.7
      }

      var comparisonOptions = []
      
      if (measure.can_pivot) {
        var pivotComparisons = []
        this.pivot_fields.forEach((pivot_field, p) => {
          if (this.pivot_fields.length === 1 || p === 1 || this.config.colSubtotals ) {
            var option = {}
            option['By ' + pivot_field.label] = pivot_field.name
            pivotComparisons.push(option)
          }
        })
        comparisonOptions = comparisonOptions.concat(pivotComparisons)
      }

      // measures, row totals and supermeasures
      this.measures.forEach((comparisonMeasure, j) => {
        var includeMeasure = measure.can_pivot === comparisonMeasure.can_pivot
                              || 
                            this.hasRowTotals && !comparisonMeasure.is_table_calculation         
        if (i != j && includeMeasure) {
          var option = {}
          option['Vs. ' + comparisonMeasure.label] = comparisonMeasure.name
          comparisonOptions.push(option)
        }
      })
      comparisonOptions.unshift({ '(none)': 'no_variance'})

      newOptions['comparison|' + measure.name] = {
        section: 'Measures',
        type: 'string',
        label: 'Comparison',
        display: 'select',
        values: comparisonOptions,
        default: 'no_variance',
        order: 100 + i * 10 + 5
      }

      newOptions['switch|' + measure.name] = {
        section: 'Measures',
        type: 'boolean',
        label: 'Switch',
        display_size: 'third',
        default: false,
        order: 100 + i * 10 + 6,
      }

      newOptions['var_num|' + measure.name] = {
        section: 'Measures',
        type: 'boolean',
        label: 'Var #',
        display_size: 'third',
        default: true,
        order: 100 + i * 10 + 7,
      }

      newOptions['var_pct|' + measure.name] = {
        section: 'Measures',
        type: 'boolean',
        label: 'Var %',
        display_size: 'third',
        default: false,
        order: 100 + i * 10 + 8,
      }

      newOptions['var_num_title|' + measure.name] = {
        section: 'Measures',
        type: 'string',
        label: 'Var %',
        display_size: 'third',
        default: false,
        order: 100 + i * 10 + 9,
      }

      newOptions['var_num_format|' + measure.name] = {
        section: 'Measures',
        type: 'string',
        label: 'Var %',
        display_size: 'third',
        default: false,
        order: 100 + i * 10 + 9.5,
      }

      newOptions['var_pct_title|' + measure.name] = {
        section: 'Measures',
        type: 'string',
        label: 'Var %',
        display_size: 'third',
        default: false,
        order: 100 + i * 10 + 10,
      }
      newOptions['var_pct_format|' + measure.name] = {
        section: 'Measures',
        type: 'string',
        label: 'Var %',
        display_size: 'third',
        default: false,
        order: 100 + i * 10 + 10.5,
      }


    })
    return newOptions
  }

  /**
   * - this.pivot_fields
   * - this.headers
   * @param {*} queryResponse 
   */
  addPivotsAndHeaders(queryResponse) {
    queryResponse.fields.pivots.forEach((pivot, i) => {
      var pivot_field = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["ModelPivot"]({ vis: this, queryResponseField: pivot })
      this.pivot_fields.push(pivot_field)
      this.headers.push({ type: 'pivot' + i, modelField: pivot_field })
    })

    var measureHeaders = this.useHeadings 
      ? [{ type: 'heading', modelField: { label: '(will be replaced by header for column)s' } }] 
      : []
    
    measureHeaders.push({ type: 'field', modelField: { label: '(will be replaced by field for column)' } })

    if (this.sortColsBy === 'pivots') {
      this.headers.push(...measureHeaders)
    } else {
      this.headers.unshift(...measureHeaders)
    }

    for (var i = 0; i < this.headers.length; i++) {
      if (!this.headers[i] === 'field') {
        this.fieldLevel = i
        break
      }
    }
  }

  /**
   * - this.dimensions
   * - this.columns
   * @param {*} queryResponse 
   * @param {*} col_idx 
   */
  addDimensions(queryResponse, col_idx) {
    queryResponse.fields.dimension_like.forEach(dimension => {
      var newDimension = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["ModelDimension"]({
        vis: this,
        queryResponseField: dimension
      })
      newDimension.hide = this.useIndexColumn ? true : newDimension.hide
      this.dimensions.push(newDimension)

      var column = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["Column"](newDimension.name, this, newDimension) 
      column.idx = col_idx
      column.sort.push(0)
      this.headers.forEach(header => {
        switch (header.type) {
          case 'pivot0':
          case 'pivot1':
            var pivotField = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["ModelPivot"]({ vis: this, queryResponseField: header.modelField })
            var headerCell = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["HeaderCell"]({ column: column, type: header.type, modelField: pivotField })
            headerCell.label = '' // TODO: Decide how (if) it makes sense to add pivot labels at top of dimension columns
            column.levels.push(headerCell)
            column.sort.push(0)
            break
          case 'heading':
            column.levels.push(new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["HeaderCell"]({ column: column, type: 'heading', modelField: newDimension }))
            break
          case 'field':
            column.levels.push(new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["HeaderCell"]({ column: column, type: 'field', modelField: newDimension }))
            column.sort.push(col_idx)
            break
        }
      })

      this.columns.push(column)
      col_idx += 10
    })

    for (var i = 0; i < this.dimensions.length; i++) {
      var dimension = this.dimensions[i]
      if (!dimension.hide) {
        this.firstVisibleDimension = dimension.name
        break
      }
    }
  }

  /**
   * Registers measures with the VisPluginTableModel
   * - this.measures
   * - this.columns
   * 
   * Uses this.applyVisToolsTags() to enrich column information
   * 
   * @param {*} queryResponse 
   * @param {*} col_idx 
   */
  addMeasures(queryResponse, col_idx) {
    // add measures, list of ids
    queryResponse.fields.measure_like.forEach(measure => {
      var newMeasure = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["ModelMeasure"]({
        vis: this,
        queryResponseField: measure,
        can_pivot: true
      })

      var reportInSetting = this.config['reportIn|' + measure.name]
      var unitSetting = this.config['unit|' + measure.name]
      if (typeof reportInSetting !== 'undefined'  && reportInSetting !== '1') {
        newMeasure.value_format = '#,##0'
        if (typeof unitSetting !== 'undefined' && unitSetting !== '') {
           newMeasure.unit = unitSetting
        }
      }
      this.measures.push(newMeasure) 
    })
    
    // add measures, list of full objects
    if (this.hasPivots) {
      this.pivot_values.forEach(pivot_value => {
        var isRowTotal = pivot_value.key === '$$$_row_total_$$$'
        this.measures.forEach((measure, m) => {
          // for pivoted measures, skip table calcs for row totals 
          // if user wants a row total of a table calc, it must be defined as another table calc (in which case, it will be a supermeasure)
          var include_measure = !isRowTotal || ( isRowTotal && !measure.is_table_calculation )
          
          if (include_measure) {
            var column = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["Column"]([pivot_value.key, measure.name].join('.'), this, measure)
            column.pivoted = isRowTotal ? false : true
            column.isRowTotal = isRowTotal
            column.pivot_key = pivot_value.key
            column.idx = col_idx
            column.sort.push(isRowTotal ? 2 : 1)

            var level_sort_values = []
            this.headers.forEach(header => {
              switch (header.type) {
                case 'pivot0':
                case 'pivot1':
                  var label = isRowTotal ? '' : pivot_value.data[header.modelField.name]
                  if (isRowTotal && header.type.startsWith('pivot') && header.type === 'pivot' + (this.pivot_fields.length - 1)) {
                    label = 'Row Total'
                  }
                  column.levels.push(new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["HeaderCell"]({ 
                    column: column, 
                    type: header.type, 
                    modelField: { label: label },
                    pivotData: pivot_value
                  }))
                  level_sort_values.push(pivot_value.sort_values[header.modelField.name])
                  if (column.pivoted) {
                    column.sort.push(pivot_value.sort_values[header.modelField.name])
                  } else {
                    column.sort.push(0)
                  }
                  break

                case 'heading':
                  column.levels.push(new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["HeaderCell"]({ column: column, type: 'heading', modelField: measure}))
                  break

                case 'field':
                  column.levels.push(new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["HeaderCell"]({ column: column, type: 'field', modelField: measure}))
                  column.sort.push(m)
                  break;
              }
            })

            this.columns.push(column)
            col_idx += 10
          }
        })
      })
    } else {
      // noticeably simpler for flat tables!
      this.measures.forEach(measure => {
        var column = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["Column"](measure.name, this, measure)
        column.sort.push(1)
        column.idx = col_idx

        try {
          if (typeof this.config.columnOrder[column.id] !== 'undefined') {
            column.pos = this.config.columnOrder[column.id]
          } else {
            column.pos = col_idx
          }
        }
        catch {
          column.pos = col_idx
        }

        this.headers.forEach(header => {
          switch (header.type) {
            case 'heading':
              column.levels.push(new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["HeaderCell"]({ column: column, type: 'heading', modelField: measure}))
              break

            case 'field':
              column.levels.push(new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["HeaderCell"]({ column: column, type: 'field', modelField: measure}))
              column.sort.push(column.pos)
              break;
          }
        })

        this.columns.push(column)
        col_idx += 10
      })
    }
    
    // add supermeasures, if present
    if (typeof queryResponse.fields.supermeasure_like !== 'undefined') {
      queryResponse.fields.supermeasure_like.forEach(supermeasure => {
        var meas = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["ModelMeasure"]({
          vis: this,
          queryResponseField: supermeasure,
          can_pivot: false,
        })
        var reportInSetting = this.config['reportIn|' + supermeasure.name]
        var unitSetting = this.config['unit|' + supermeasure.name]
        if (typeof reportInSetting !== 'undefined'  && reportInSetting !== '1') {
          meas.value_format = '#,##0'
          if (typeof unitSetting !== 'undefined' && unitSetting !== '') {
            meas.unit = unitSetting
          }
        }
        this.measures.push(meas) 

        var column = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["Column"](meas.name, this, meas)
        column.sort.push(2)
        this.headers.forEach(header => {
          switch (header.type) {
            case 'pivot0':
            case 'pivot1':
              column.levels.push(new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["HeaderCell"]({ column: column, type: header.type, modelField: { label: '' } }))
              column.sort.push(1)
              break
            case 'heading':
              column.levels.push(new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["HeaderCell"]({ column: column, type: 'heading', modelField: meas }))
              break
            case 'field':
              column.levels.push(new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["HeaderCell"]({ column: column, type: 'field', modelField: meas }))
              column.sort.push(col_idx)
              break
          }
        })
        column.idx = col_idx
        column.super = true

        this.columns.push(column)
        col_idx += 10
      })
    }
  }

   /**
   * Update the VisPluginTableModel instace
   * - this.variances
   * 
   *  option is either 'no_variance' or a measure.name
   */
  checkVarianceCalculations() {
    Object.keys(this.config).forEach(option => {
      if (option.startsWith('comparison')) {
        var baseline = option.split('|')[1]
        var comparison = this.config[option]

        var baseline_in_measures = false
        this.measures.forEach(measure => {
          if (baseline === measure.name) {
            baseline_in_measures = true
          }
        })

        var comparison_available = false

        var comparison_options = [...this.measures.map(measure => measure.name), ...this.pivot_fields.map(pivot_field => pivot_field.name)]
        comparison_options.forEach(comparitor => {
          if (comparison === comparitor) {
            comparison_available = true
          }
        })

        if (baseline_in_measures && comparison_available) {
          if (this.pivot_fields.map(pivot_field => pivot_field.name).includes(this.config[option])) {
            var type = 'by_pivot'
          } else {
            var type = this.config[option] === 'no_variance' ? 'no_variance' : 'vs_measure'
          }
  
          if (typeof this.config['switch|' + baseline] !== 'undefined') {
            if (this.config['switch|' + baseline]) {
              var reverse = true
            } else {
              var reverse = false
            }
          }
  
          this.variances.push({
            baseline: baseline,
            comparison: this.config[option],
            type: type,
            reverse: reverse
          })
        } else if (baseline_in_measures) {
          this.config[option] = 'no_variance'
        } else {
          delete this.config[option]
        }
      }
    })
  }

  /**
   * Creates the index column, a "for display only" column when the set of dimensions is reduced to
   * a single column for reporting purposes.
   */
  addIndexColumn() {
    var dimension = this.dimensions[this.dimensions.length - 1]
    var dim_config_setting = this.config['hide|' + dimension.name]
    var column = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["Column"]('$$$_index_$$$', this, dimension)
    column.sort.push(-1)
    column.hide = dim_config_setting === true ? dim_config_setting : false

    this.headers.forEach(header => {
      switch (header.type) {
        case 'pivot0':
        case 'pivot1':
          var pivotField = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["ModelPivot"]({ vis: this, queryResponseField: header.modelField })
          var headerCell = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["HeaderCell"]({ column: column, type: header.type, modelField: pivotField })
          headerCell.label = ''  // TODO: Decide how (if) it makes sense to add pivot labels at top of dimension columns
          column.levels.push(headerCell)
          column.sort.push(0)
          break
        case 'heading':
          column.levels.push(new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["HeaderCell"]({ column: column, type: 'heading', modelField: dimension }))
          break
        case 'field':
          column.levels.push(new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["HeaderCell"]({ column: column, type: 'field', modelField: dimension }))
          column.sort.push(0)
          break
      }
    })
    
    this.columns.push(column)
  }

  /**
   * this.subtotals_data
   * @param {*} queryResponse 
   */
  checkSubtotalsData(queryResponse) {
    if (typeof queryResponse.subtotals_data[this.addSubtotalDepth] !== 'undefined') {
      queryResponse.subtotals_data[this.addSubtotalDepth].forEach(lookerSubtotal => {
        var visSubtotal = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["Row"]('subtotal')

        visSubtotal['$$$__grouping__$$$'] = lookerSubtotal['$$$__grouping__$$$']
        var groups = ['Subtotal']
        visSubtotal['$$$__grouping__$$$'].forEach(group => {
          groups.push(lookerSubtotal[group].value)
        })
        visSubtotal.id = groups.join('|')

        this.columns.forEach(column => {
          visSubtotal.data[column.id] = (column.pivoted || column.isRowTotal) ? lookerSubtotal[column.modelField.name][column.pivot_key] : lookerSubtotal[column.id]
          var cell = visSubtotal.data[column.id]

          if (typeof cell !== 'undefined') {
            if (typeof cell.cell_style === 'undefined') {
              cell.cell_style = ['total', 'subtotal']
            } else {
              cell.cell_style = cell.cell_style.concat(['total', 'subtotal'])
            }
            if (typeof column.modelField.style !== 'undefined') {
              cell.cell_style = cell.cell_style.concat(column.modelField.style)
            }
            if (cell.value === null) {
              cell.rendered = ''
            }

            var reportInSetting = this.config['reportIn|' + column.modelField.name]
            if (typeof reportInSetting !== 'undefined' && reportInSetting !== '1') {
              var unit = this.config.useUnit && column.modelField.unit !== '#' ? column.modelField.unit : ''
              cell.html = null
              cell.value = Math.round(cell.value / parseInt(reportInSetting))
              cell.rendered = column.modelField.value_format === '' ? cell.value.toString() : unit + ssf__WEBPACK_IMPORTED_MODULE_0___default.a.format(column.modelField.value_format, cell.value)
            }
          }            
        })
        this.subtotals_data[visSubtotal.id] = visSubtotal
      })
    }
  }

  /**
   * Populates this.data with Rows of data
   * @param {*} lookerData 
   */
  addRows(lookerData) {
    lookerData.forEach((lookerRow, i) => {
      var row = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["Row"]('line_item')
      row.id = this.dimensions.map(dimension => lookerRow[dimension.name].value).join('|')

      this.columns.forEach(column => {
        var cellValue = (column.pivoted || column.isRowTotal)? lookerRow[column.modelField.name][column.pivot_key] : lookerRow[column.id]
        var cell = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["DataCell"]({ 
          ...cellValue, 
          ...{ 
            cell_style: [column.modelField.type], 
            colid: column.id, 
            rowid: row.id } 
        })

        if (column.modelField.is_numeric) {
          cell.cell_style.push('numeric')
          cell.align = 'right'
        } else {
          cell.cell_style.push('nonNumeric')
          cell.align = 'left'
        }

        if (typeof column.modelField.style !== 'undefined') {
          cell.cell_style = cell.cell_style.concat(column.modelField.style)
        }

        var reportInSetting = this.config['reportIn|' + column.modelField.name]
        if (typeof reportInSetting !== 'undefined'  && reportInSetting !== '1') {
          var unit = this.config.useUnit && column.modelField.unit !== '#'  ? column.modelField.unit : ''
          cell.html = null
          cell.value = Math.round(cell.value / parseInt(reportInSetting))
          cell.rendered = column.modelField.value_format === '' ? cell.value.toString() : unit + ssf__WEBPACK_IMPORTED_MODULE_0___default.a.format(column.modelField.value_format, cell.value)
        }

        if (column.modelField.is_turtle) {
          var cell_series = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["CellSeries"]({
            column: column,
            row: row,
            sort_value: cell.sort_value,
            series: {
              keys: row.data[column.id]._parsed.keys,
              values: row.data[column.id]._parsed.values
            }
          })
          cell.value = cell_series
          cell.rendered = cell_series.toString()
        }

        row.data[column.id] = cell
      })

      if (this.useIndexColumn) {
        var last_dim = this.dimensions[this.dimensions.length - 1].name
        var sourceCell = row.data[last_dim]

        row.data['$$$_index_$$$'] = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["DataCell"]({
          value: sourceCell.value,
          rendered: sourceCell.rendered,
          html: sourceCell.html,
          cell_style: ['singleIndex', 'dimension'],
          align: this.dimensions[this.dimensions.length - 1].is_numeric ? 'right' : 'left',
          colid: '$$$_index_$$$',
          rowid: sourceCell.rowid
        })
      }

      row.sort = [0, 0, i]
      this.data.push(row)
    })
  }

  /**
   * Generate data series to support transposition
   */
  addColumnSeries() {
    this.columns.forEach(column => {
      var keys = []
      var values = []
      var types = []

      this.data.forEach(row => {
        keys.push(row.id)
        values.push(row.data[column.id].value)
        types.push(row.type)
      })

      var new_series = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["ColumnSeries"]({
        column: column,
        is_numeric: column.modelField.is_numeric,
        series: {
          keys: keys,
          values: values,
          types: types
        }
      })
      
      column.series = new_series
      this.column_series.push(new_series)
    })
  }

  buildTotals(queryResponse) {
    var totals_ = queryResponse.totals_data
    var totalsRow = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["Row"]('total')

    this.columns.forEach(column => {
      totalsRow.id = 'Total'

      if (column.modelField.type === 'dimension') {
        if ([this.firstVisibleDimension, '$$$_index_$$$'].includes(column.id)) {
          var rowspan = 1
          var colspan = this.useIndexColumn ? 1 : this.dimensions.filter(d => !d.hide).length
        } else {
          var rowspan = -1
          var colspan = -1
        }
        totalsRow.data[column.id] = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["DataCell"]({ 
          value: '', 
          cell_style: ['total', 'dimension'],
          rowspan: rowspan, 
          colspan: colspan,
          colid: column.id,
          align: column.modelField.is_numeric ? 'right' : 'left',
          rowid: 'Total' 
        })
      } else {
        var rowspan = 1
        var colspan = 1
      }
      
      
      if (column.modelField.type === 'measure') {
        var cell_style = column.modelField.is_numeric ? ['total', 'numeric', 'measure'] : ['total', 'nonNumeric', 'measure']
        var cellValue = (column.pivoted || column.isRowTotal) ? totals_[column.modelField.name][column.pivot_key] : totals_[column.id]

        cellValue = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["DataCell"]({ 
          ...cellValue, 
          ...{ 
            cell_style: cell_style,
            rowspan: rowspan, 
            colspan: colspan, 
            colid: column.id, 
            align: column.modelField.is_numeric ? 'right' : 'left',
            rowid: 'Total'} 
        })

        if (typeof cellValue.rendered === 'undefined' && typeof cellValue.html !== 'undefined' ) { // totals data may include html but not rendered value
          cellValue.rendered = this.getRenderedFromHtml(cellValue)
        }

        var reportInSetting = this.config['reportIn|' + column.modelField.name]
        if (typeof reportInSetting !== 'undefined'  && reportInSetting !== '1') {
          var unit = this.config.useUnit && column.modelField.unit !== '#'  ? column.modelField.unit : ''
          cellValue.html = undefined
          cellValue.value = Math.round(cellValue.value / parseInt(reportInSetting))
          cellValue.rendered = column.modelField.value_format === '' ? cellValue.value.toString() : unit + ssf__WEBPACK_IMPORTED_MODULE_0___default.a.format(column.modelField.value_format, cellValue.value)
        }
        
        totalsRow.data[column.id] = cellValue
        if (typeof totalsRow.data[column.id].links !== 'undefined') {
          totalsRow.data[column.id].links.forEach(link => {
            link.type = "measure_default"
          })
        }       
      }
    })

    if (this.useIndexColumn) {
      totalsRow.data['$$$_index_$$$'].value = 'TOTAL'
      totalsRow.data['$$$_index_$$$'].align = 'left'
      totalsRow.data['$$$_index_$$$'].colspan = this.dimensions.filter(d => !d.hide).length
    } else {
      if (this.firstVisibleDimension) {
        totalsRow.data[this.firstVisibleDimension].value = 'TOTAL'
        totalsRow.data[this.firstVisibleDimension].align = 'left'
      }
    }
    totalsRow.sort = [1, 0, 0]
    this.data.push(totalsRow)

    // Including an Others row: note the huge assumption in calculating a very simple average!
    // This will prevent a data gap distracting users, and may indicate whether the Others data
    // is "higher or lower" than the top x items. But it is not an accurate number.
    if (this.calculateOthers) {
      var othersRow = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["Row"]('line_item')
      othersRow.id = 'Others'
      this.columns.forEach(column => {
        var othersValue = null
        var othersStyle = column.modelField.is_numeric ? ['numeric'] : ['nonNumeric']
        var totalValue = totalsRow.data[column.id]
        
        if (column.modelField.type === 'measure') {
          if (othersValue = ['sum', 'count'].includes(column.modelField.calculation_type)) {
            othersValue = totalValue.value - column.series.series.sum
            othersStyle.push('measure')
          } else {
            othersValue = (totalValue.value + column.series.series.avg) / 2
            othersStyle = othersStyle.concat(['estimate', 'measure'])
            if (['count', 'count_distinct'].includes(column.modelField.calculation_type)) {
              othersValue = Math.round(othersValue)
            }
          }
        } else {
          othersStyle.push('dimension')
        }

        if (othersValue) {
          var formatted_value = column.modelField.value_format === '' 
                ? othersValue.toString() 
                : ssf__WEBPACK_IMPORTED_MODULE_0___default.a.format(column.modelField.value_format, othersValue)
          othersRow.data[column.id] = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["DataCell"]({ 
            value: othersValue, 
            rendered: formatted_value, 
            cell_style: othersStyle,
            align: column.modelField.is_numeric ? 'right' : 'left',
            colid: column.id,
            rowid: 'Others'
          })
        } else {
          othersRow.data[column.id] = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["DataCell"]({ 
            rendered: '',
            cell_style: othersStyle, 
            colid: column.id, 
            rowid: 'Others'
          })
        }
      })

      if (this.useIndexColumn) {
        othersRow.data['$$$_index_$$$'].value = 'Others'
        othersRow.data['$$$_index_$$$'].rendered = 'Others'
        othersRow.data['$$$_index_$$$'].align = 'left'
        othersRow.data['$$$_index_$$$'].cell_style.push('singleIndex')
      } else {
        if (this.firstVisibleDimension) {
          othersRow.data[this.firstVisibleDimension].value = 'Others'
          othersRow.data[this.firstVisibleDimension].rendered = 'Others'
          othersRow.data[this.firstVisibleDimension].align = 'left'
        }
      }
      othersRow.sort = [1, -1, -1] 
      this.data.push(othersRow)
    }
    
    this.sortData()
  }

  /**
   * 1. Build list of leaves
   * 2. Build list of tiers (and initialise span_tracker)
   * 3. Backwards <--- leaves
   *    4. Check for resets (n/a for colspans)
   *    5. Forwards ---> tiers
   *        6. Match: mark invisible (span_value = -1). Increment the span_tracker.
   *        7. Diff: set span_value from span_tracker. Partial reset and continue.
   */
  setRowSpans () {
    var leaves = []
    var tiers = []
    var span_tracker = {}

    // 1)
    leaves = this.data

    // 2)
    tiers = this.dimensions.filter(d => !d.hide)
    tiers.forEach(tier => {
      span_tracker[tier.name] = 1
    })

    // Loop backwards through leaves
    for (var l = leaves.length - 1; l >= 0 ; l--) {
      var leaf = leaves[l]

      // Totals/subtotals rows: full reset and continue
      if (leaf.type !== 'line_item' ) {
        tiers.forEach(tier => {
          span_tracker[tier.name] = 1
        })
        continue;
      }

      // Loop fowards through the tiers
      for (var t = 0; t < tiers.length; t++) {
        var tier = tiers[t]
        var this_tier_value = leaf.data[tier.name].value
        var neighbour_value = l > 0 ? leaves[l - 1].data[tier.name].value : null

        // Match: mark invisible (span_value = -1). Increment the span_tracker.
        if (l > 0 && this_tier_value === neighbour_value) {
          leaf.data[tier.name].rowspan = -1
          leaf.data[tier.name].colspan = -1
          span_tracker[tier.name] += 1
        } else {
        // Different: set span_value from span_tracker. Partial reset and continue
          for (var t_ = t; t_ < tiers.length; t_++) {
            var tier_ = tiers[t_]
            leaf.data[tier_.name].rowspan = span_tracker[tier_.name]
            if (leaf.data[tier_.name].rowspan > 1) {
              leaf.data[tier_.name].cell_style.push('merged')
            }
            span_tracker[tier_.name] = 1
          }
          break;
        }
      }
    }
  }

  /**
   * Generates subtotals values
   * 
   * 1. Build array of subtotal groups
   *    - Based on the joined values of each row's dimensions (up to the configured subtotal depth)
   *    - Update each row's sort value with its subtotal group number
   * 2. Generate data rows
   *    - For each subtotal group, create a new Row
   *      - For each Column
   *        - Set the style
   *        - In the index dimension and the firstVisibleDimension, put the subtotal label
   *        - If it's a measure 
   *          - Count & total all rows of type 'line_item'
   *          - Use total or average value based on calculation type
   *          - Set as blank if it's a string type
   *            // This is a gap in functionality. Ideally subtotal would replicate the logic that generated
   *            // the string values in the line items.
   */
  addSubTotals () { 
    var depth = this.addSubtotalDepth

    // BUILD GROUPINGS / SORT VALUES
    var subTotalGroups = []
    var latest_group = []
    this.data.forEach((row, i) => {    
      if (row.type !== 'total') {
        var group = []
        for (var g = 0; g < depth; g++) {
          var dim = this.dimensions[g].name
          group.push(row.data[dim].value)
        }
        if (group.join('|') !== latest_group.join('|')) {
          subTotalGroups.push(group)
          latest_group = group
        }
        row.sort = [0, subTotalGroups.length-1, i]
      }
      
      if (row.id === 'Others' && row.type === 'line_item') {
        row.hide = true
      }
    })

    // GENERATE DATA ROWS FOR SUBTOTALS
    subTotalGroups.forEach((subTotalGroup, s) => {
      var subtotalRow = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["Row"]('subtotal')
      var dims = subTotalGroup.join('|') ? subTotalGroup.join('|') : 'Others'
      subtotalRow.id = ['Subtotal', dims].join('|')

      this.columns.forEach(column => {
        if (column.modelField.type === 'dimension') {
          if ([this.firstVisibleDimension, '$$$_index_$$$'].includes(column.id)) {
            var rowspan = 1
            var colspan = this.useIndexColumn ? 1 : this.dimensions.filter(d => !d.hide).length
          } else {
            var rowspan = -1
            var colspan = -1
          }
          var cell_style = column.modelField.is_numeric ? ['total', 'subtotal', 'numeric', 'dimension'] : ['total', 'subtotal', 'nonNumeric', 'dimension']
          var cell = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["DataCell"]({ 
            'cell_style': cell_style, 
            align: column.modelField.is_numeric ? 'right' : 'left', 
            rowspan: rowspan, 
            colspan: colspan,
            colid: column.id,
            rowid: subtotalRow.id
          })
          if (column.id === '$$$_index_$$$' || column.id === this.firstVisibleDimension ) {
            if (this.genericLabelForSubtotals) {
              cell.value = 'Subtotal'
              cell.rendered = 'Subtotal'
            } else {
              cell.value = subTotalGroup.join(' | ') ? subTotalGroup.join(' | ') : 'Others'
              cell.rendered = cell.value
            }
          }
          subtotalRow.data[column.id] = cell
        }

        if (column.modelField.type == 'measure') {
          var cell_style = column.modelField.is_numeric ? ['total', 'subtotal', 'numeric', 'measure'] : ['total', 'subtotal', 'nonNumeric', 'measure']
          var align = column.modelField.is_numeric ? 'right' : 'left'
          if (Object.entries(this.subtotals_data).length > 0 && !subtotalRow.id.startsWith('Subtotal|Others')) { // if subtotals already provided in Looker's queryResponse
            var cell = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["DataCell"]({ 
              ...subtotalRow.data[column.id], 
              ...this.subtotals_data[subtotalRow.id].data[column.id],
              ...{ cell_style: cell_style, align: align, colid: column.id, rowid: subtotalRow.id }
            })
            subtotalRow.data[column.id] = cell
          } else {
            var subtotal_value = 0
            var subtotal_items = 0
            var rendered = ''
            this.data.forEach(data_row => {
              if (data_row.type == 'line_item' && data_row.sort[1] == s) { // data_row.sort[1] == s checks whether its part of the current subtotal group
                var value = data_row.data[column.id].value
                if (Number.isFinite(value)) {
                  subtotal_value += value
                  subtotal_items++
                }
              } 
            })
            
            if (column.modelField.calculation_type === 'average' && subtotal_items > 0) {
              subtotal_value = subtotal_value / subtotal_items
            }
            if (subtotal_value) {
              var unit = this.config.useUnit && column.modelField.unit !== '#'  ? column.modelField.unit : ''
              rendered = column.modelField.value_format === '' ? subtotal_value.toString() : unit + ssf__WEBPACK_IMPORTED_MODULE_0___default.a.format(column.modelField.value_format, subtotal_value)
            }
            if (column.modelField.calculation_type === 'string') {
              subtotal_value = ''
              rendered = ''
            } 

            var cell = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["DataCell"]({
              value: subtotal_value,
              rendered: rendered,
              cell_style: cell_style,
              align: align,
              colid: column.id,
              rowid: subtotalRow.id
            })
            subtotalRow.data[column.id] = cell
          }
        }
      })
      subtotalRow.sort = [0, s, 9999]
      this.data.push(subtotalRow)
    })
    this.sortData()
    this.hasSubtotals = true
  }

  /**
   * Generates new column subtotals, where 2 pivot levels have been used
   * // TODO: Could also have subtotals for 1 pivot tables sorted by measure
   * 
   * 1. Derive the new column definitions
   * 2. Use the new definitions to add subtotal columns to table.columns
   * 3. Calculate the column subtotal values
   */
  addColumnSubTotals () {
    var subtotalColumns = []

    // Get a list of unique top-level pivot values in the pivot_values object
    var pivots = []
    var pivot_dimension = this.pivot_fields[0].name
    this.pivot_values.forEach(pivot_value => {
      var p_value = pivot_value['data'][pivot_dimension]
      if (p_value !== null) { pivots.push(p_value) }
    })
    pivots = [...new Set(pivots)]


    // DERIVE THE NEW COLUMN DEFINITIONS
    pivots.forEach(pivot => {
      this.measures.forEach((measure, m) => {
        if (measure.can_pivot) {
          var subtotalColumn = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["Column"](['$$$_subtotal_$$$', pivot, measure.name].join('.'), this, measure)
          subtotalColumn.pivoted = true
          subtotalColumn.subtotal = true
          subtotalColumn.pivot_key = [pivot, '$$$_subtotal_$$$'].join('|')
          subtotalColumn.subtotal_data = {
            pivot: pivot,
            measure_idx: m,
            columns: [],
          }
  
          this.columns.forEach((column, i) => {  
            var columnPivotValue = null
            for (var i = 0; i < column.levels.length; i++) {
              if (column.levels[i].type.startsWith('pivot')) {
                columnPivotValue = column.levels[i].modelField.label
                break
              }
            }

            if (column.pivoted && columnPivotValue === pivot) {
              if (column.modelField.name === measure.name) {
                subtotalColumn.subtotal_data.columns.push(column)
              }
            }
          })
          subtotalColumns.push(subtotalColumn)
        }
      })
    })

    // USE THE NEW DEFINITIONS TO ADD SUBTOTAL COLUMNS TO TABLE.COLUMNS
    subtotalColumns.forEach((subtotalColumn, s) => {
      subtotalColumn.sort.push(1)

      this.headers.forEach((header, i) => {
        switch (header.type) {
          case 'pivot0':
            var sort_value_from_column = subtotalColumn.subtotal_data.columns[0].levels[i].pivotData.sort_values[header.modelField.name]
            subtotalColumn.levels.push(new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["HeaderCell"]({ 
              column: subtotalColumn, 
              type: header.type, 
              modelField: {
                name: this.pivot_fields[0].name,
                label: subtotalColumn.subtotal_data.pivot,
              }
            }))
            subtotalColumn.sort.push(sort_value_from_column)
            break

          case 'pivot1':
            subtotalColumn.levels.push(new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["HeaderCell"]({ column: subtotalColumn, type: header.type, modelField: {
              name: 'subtotal',
              label: 'Subtotal',
            }}))
            var subtotalSortValue = typeof this.pivot_values[0].sort_values[header.modelField.name] === 'string' ? 'ZZZZ' : 99999999
            subtotalColumn.sort.push(subtotalSortValue)
            break

          case 'heading':
            subtotalColumn.levels.push(new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["HeaderCell"]({ column: subtotalColumn, type: 'heading', modelField: subtotalColumn.modelField}))
            break

          case 'field':
            subtotalColumn.levels.push(new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["HeaderCell"]({ column: subtotalColumn, type: 'field', modelField: subtotalColumn.modelField}))
            subtotalColumn.sort.push(subtotalColumn.subtotal_data.measure_idx)
            break
        }
      })
      this.columns.push(subtotalColumn)
    })

    // CALCULATE COLUMN SUB TOTAL VALUES
    this.data.forEach(row => {
      subtotalColumns.forEach(subtotalColumn => {
        var cell_style = subtotalColumn.modelField.is_numeric ? ['subtotal', 'numeric', 'measure'] : ['subtotal', 'nonNumeric', 'measure']
        var subtotal_value = 0
        subtotalColumn.subtotal_data.columns.forEach(column => { // subtotalColumn.columns i.e. the individual columns that are aggregated into a single subtotal columns
          subtotal_value += row.data[column.id].value
        })
        row.data[subtotalColumn.id] = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["DataCell"]({
          value: subtotal_value,
          rendered: subtotalColumn.modelField.value_format === '' ? subtotal_value.toString() : ssf__WEBPACK_IMPORTED_MODULE_0___default.a.format(subtotalColumn.modelField.value_format, subtotal_value),
          cell_style: cell_style,
          colid: subtotalColumn.id,
          rowid: row.id
        })
        if (['subtotal', 'total'].includes(row.type)) { 
          row.data[subtotalColumn.id].cell_style.push('total') 
        }
      })
    })

    // return subtotals
  }

  /**
   * Variance calculation function to enable addVariance()
   * @param {*} value_format 
   * @param {*} id 
   * @param {*} calc 
   * @param {*} baseline 
   * @param {*} comparison 
   */
  calculateVariance (value_format, id, calc, baseline, comparison) {
    this.data.forEach(row => {
      var baseline_value = row.data[baseline.id].value
      var comparison_value = row.data[comparison.id].value
      if (calc === 'absolute') {
        var cell = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["DataCell"]({
          value: baseline_value - comparison_value,
          rendered: value_format === '' ? (baseline_value - comparison_value).toString() : ssf__WEBPACK_IMPORTED_MODULE_0___default.a.format(value_format, (baseline_value - comparison_value)),
          cell_style: ['numeric', 'measure', 'variance', 'varianceAbsolute'],
          colid: id,
          rowid: row.id
        })
      } else {
        var value = (baseline_value - comparison_value) / Math.abs(comparison_value)
        if (!isFinite(value)) {
          var cell = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["DataCell"]({
            value: null,
            rendered: '∞',
            cell_style: ['numeric', 'measure', 'variance', 'variancePercent'],
            colid: id,
            rowid: row.id
          })
        } else {
          var cell = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["DataCell"]({
            value: value,
            rendered: ssf__WEBPACK_IMPORTED_MODULE_0___default.a.format('#0.00%', value),
            cell_style: ['numeric', 'measure', 'variance', 'variancePercent'],
            colid: id,
            rowid: row.id
          })
        }
      }
      if (row.type == 'total' || row.type == 'subtotal') {
        cell.cell_style.push('total')
      }
      if (row.type === 'subtotal') {
        cell.cell_style.push('subtotal')
      }
      if (cell.value < 0) {
        cell.cell_style.push('negative')
      }
      row.data[id] = cell
    })
  }

  createVarianceColumn (colpair) {
    if (!this.config.colSubtotals && colpair.variance.baseline.startsWith('$$$_subtotal_$$$')) {
      console.log('Cannot calculate variance of column subtotals if subtotals disabled.')
      return
    }
    var id = ['$$$_variance_$$$', colpair.calc, colpair.variance.baseline, colpair.variance.comparison].join('|')
    var baseline = this.getColumnById(colpair.variance.baseline)
    var comparison = this.getColumnById(colpair.variance.comparison)
    var column = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["Column"](id, this, baseline.modelField)
    column.isVariance = true

    if (colpair.calc === 'absolute') {
      column.variance_type = 'absolute'
      column.idx = baseline.idx + 1
      column.pos = baseline.pos + 1
      column.sort = [...baseline.sort, 1]
      column.hide = !this.config['var_num|' + baseline.modelField.name]
    } else {
      column.variance_type = 'percentage'
      column.idx = baseline.idx + 2
      column.pos = baseline.pos + 2
      column.sort = [...baseline.sort, 2]
      column.unit = '%'
      column.hide = !this.config['var_pct|' + baseline.modelField.name]
    }

    if (typeof this.config.columnOrder[column.id] !== 'undefined') {
      column.pos = this.config.columnOrder[column.id]
    } 

    column.pivoted = baseline.pivoted
    column.super = baseline.super
    column.pivot_key = baseline.pivot_key

    if (this.groupVarianceColumns) {    
        column.sort[0] = 1.5
    }

    this.headers.forEach((header, i) => {
      switch (header.type) {
        case 'pivot0':
        case 'pivot1':
          var label = baseline.getHeaderCellLabelByType(header.type)
          if (this.groupVarianceColumns && header.type === 'pivot0') {
            var label = this.pivot_values.length === 2 ? 'Variance' : 'Variance: ' + label
          }
          var headerCell = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["HeaderCell"]({ column: column, type: header.type, modelField: { label: label } })
          column.levels[i] = headerCell
          break
        case 'heading':
          var headerCell = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["HeaderCell"]({ column: column, type: 'heading', modelField: baseline.modelField })
          column.levels[i] = headerCell
          break
        case 'field':
          var headerCell = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["HeaderCell"]({ column: column, type: 'field', modelField: baseline.modelField })
          column.levels[i] = headerCell
          break;
      }
    })

    this.columns.push(column)
    if (colpair.variance.reverse) {
      this.calculateVariance(baseline.modelField.value_format, id, colpair.calc, comparison, baseline)
    } else {
      this.calculateVariance(baseline.modelField.value_format, id, colpair.calc, baseline, comparison)
    }
  }

  /**
   * Function to add variance columns directly within table vis rather than requiring a table calc
   * 
   * Takes list of variances configured by the user, and generates a list of column-pairs necessary
   * to calculate those variances. There is at least one baseline-comparison pair per variance.
   * Comparing different measures in a pivoted table will calculate a variance pair per pivot value.
   * Comparing the same measure across pivots will calculate one pair less than there are pivots e.g.
   * if comparing this year to last year, there are two "Reporting Period" values but only one variance.
   */
  addVarianceColumns () {
    var variance_colpairs = []
    var calcs = ['absolute', 'percent']
    
    Object.keys(this.variances).forEach(v => {
      var variance = this.variances[v]

      if (variance.comparison !== 'no_variance') {          
        if (variance.type === 'vs_measure') {
          if (!this.hasPivots) {
            calcs.forEach(calc => {
              variance_colpairs.push({
                variance: variance,
                calc: calc
              })
            })
          } else {
            this.pivot_values.forEach(pivot_value => {
              if (!pivot_value.is_total) {
                calcs.forEach(calc => {
                  variance_colpairs.push({
                    calc: calc,
                    variance: {
                      baseline: [pivot_value.key, variance.baseline].join('.'),
                      comparison: [pivot_value.key, variance.comparison].join('.'),
                      reverse: variance.reverse,
                      type: variance.type
                    }
                  })
                })
              }
            })
          }
        } else if (variance.type === 'by_pivot') { 
          if (this.pivot_fields.length === 1 || this.pivot_fields[1].name === variance.comparison) {
            var pivot_values = this.varianceForLastPivotColumnOnly ? this.pivot_values.slice(1).slice(-1) : this.pivot_values.slice(1)
            var comparisons = this.varianceForLastPivotColumnOnly ? this.pivot_values.slice(-2,-1) : this.pivot_values
            pivot_values.forEach((pivot_value, index) => {
              calcs.forEach(calc => {
                if (!pivot_value.is_total) {
                  variance_colpairs.push({
                    calc: calc,
                    variance: {
                      baseline: [pivot_value.key, variance.baseline].join('.'),
                      comparison: [comparisons[index].key, variance.baseline].join('.'),
                      reverse: variance.reverse,
                      type: variance.type
                    }
                  })
                }
              })
            })
          } else { // top pivot value - variance by subtotal
            var top_level_pivots = []
            this.pivot_values.forEach(pivot_value => {
              if (!pivot_value.is_total) {
                var value = pivot_value.data[this.pivot_fields[0].name]
                if (!top_level_pivots.includes(value)) {
                  top_level_pivots.push(value)
                }
              }
            })
            top_level_pivots.slice(1).forEach((pivot_value, index) => {
              calcs.forEach(calc => {
                variance_colpairs.push({
                  calc: calc,
                  variance: {
                    baseline: ['$$$_subtotal_$$$', pivot_value, variance.baseline].join('.'),
                    comparison: ['$$$_subtotal_$$$', top_level_pivots[index], variance.baseline].join('.'),
                    reverse: variance.reverse,
                    type: variance.type
                  }
                })
              })
            })
          } 
        }
      }
    })

    variance_colpairs.forEach(colpair => {
        this.createVarianceColumn(colpair)
      })

  }

  compareSortArrays (a, b) {
    var depth = Math.max(a.sort.length, b.sort.length)
    for(var i = 0; i < depth; i++) {
        var a_value = typeof a.sort[i] !== 'undefined' ? a.sort[i] : 0
        var b_value = typeof b.sort[i] !== 'undefined' ? b.sort[i] : 0
        if (a_value > b_value) { return 1 }
        if (a_value < b_value) { return -1 }
    }
    return -1
  }
  /**
   * Sorts the rows of data, then updates vertical cell merge 
   * 
   * Rows are sorted by three values:
   * 1. Section
   * 2. Subtotal Group
   * 3. Row Value (currently based only on original row index from the Looker data object)
   */
  sortData () {
    this.data.sort(this.compareSortArrays)
    if (this.spanRows) { this.setRowSpans() }
  }

  /**
   * Sorts columns by config option
   * 
   * Depending on the colsSortBy option, columns are sorted by either:
   * 
   * Sort by Pivots (default)
   * 1. Section: Index, Dimensions, Measures, or Supermeasures
   * 2. Pivot sort values
   * 3. Original column number for the Looker data obect [last item in sort value array]
   * 
   * Sort by Measures
   * 1. Section: Index, Dimensions, Measures, or Supermeasures
   * 2. Original Column Number
   * 3. Measure sort values [remainder of sort value array]
   * 
   * Note that column sort values can be over-riden by manual drag'n'drop 
   */
  sortColumns () {
    this.columns.sort(this.compareSortArrays)
  }

  /**
   * 1. Build list of leaves
   * 2. Build list of tiers (and initialise span_tracker)
   * 3. Backwards <--- leaves
   *    4. Check for resets (n/a for colspans)
   *    5. Forwards ---> tiers
   *        6. Match: mark invisible (span_value = -1). Increment the span_tracker.
   *        7. Diff: set span_value from span_tracker. Partial reset and continue.
   */
  setColSpans () {
    var leaves = []
    var tiers = []
    var span_tracker = {}
    
    // 1)
    var columns = this.columns.filter(c => !c.hide)

    columns.forEach(column => {
      var leaf = {
        id: column.id,
        data: column.getHeaderData()
      }
      leaves.push(leaf)
    })

    // 2)
    tiers = this.headers
    tiers.forEach(tier => {
      span_tracker[tier.type] = 1
    })

    // 3)
    for (var l = leaves.length - 1; l >= 0; l--) {
      var leaf = leaves[l]

      // 5)
      for (var t = 0; t < tiers.length; t++) {
        var tier = tiers[t]
        var this_tier_value = leaf.data[tier.type].label
        var neighbour_value = l > 0 ? leaves[l - 1].data[tier.type].label : null

        // 6) 
        if (l > 0 && this_tier_value === neighbour_value) {
          leaf.data[tier.type].colspan = -1
          leaf.data[tier.type].rowspan = -1
          span_tracker[tier.type] += 1;
        } else {
        // 7) 
          for (var t_ = t; t_ < tiers.length; t_++) {
            var tier_ = tiers[t_]
            leaf.data[tier_.type].colspan = span_tracker[tier_.type]
            if (leaf.data[tier_.type].colspan > 1) {
              leaf.data[tier_.type].align = 'center'
              leaf.data[tier_.type].cell_style.push('merged')
            }
            span_tracker[tier_.type] = 1
          }
          break;
        }
      }
    }
  }

  /**
   * Applies conditional formatting (red if negative) to all measure columns set to use it 
   */
  applyFormatting() {
    this.columns.forEach(column => {
      var config_setting = this.config['style|' + column.modelField.name]
      if (typeof config_setting !== 'undefined') {
        switch (config_setting) {
          case 'black_red':
            this.data.forEach(row => {
              if (row.data[column.id].value < 0) {
                row.data[column.id].cell_style.push('negative')
              }
            })
            break
        }
      }
    })
  }

  transposeDimensionsIntoHeaders () {
    this.transposed_headers = this.columns
      .filter(c => c.modelField.type === 'dimension')
      .filter(c => !c.hide)
      .map(c => { return { type: 'field', modelField: c.modelField } })
  }

  /**
   * For rendering a transposed table i.e. with the list of measures on the left hand side
   * 1. Add an index column per header
   * 2. Add a transposed column for every data row
   */
  transposeRowsIntoColumns () {
    // TODO: review logic for cell.align
    var index_parent = {
      align: 'left',
      type: 'transposed_table_index',
      is_table_calculation: false
    }

    // One "index column" per header row from original table
    this.headers.forEach((indexColumn, i) => {
      var transposedColumn = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["Column"](indexColumn.type, this, index_parent)

      this.transposed_headers.forEach((header, h) => {
        var sourceCell = this.columns[h].levels[i]
        var headerCell = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["HeaderCell"]({
          column: transposedColumn,
          type: sourceCell.type,
          label: sourceCell.label,
          cell_style: sourceCell.cell_style,
          align: sourceCell.align,
          modelField: sourceCell.modelField
        })
        headerCell.rowspan = sourceCell.colspan
        headerCell.colspan = sourceCell.rowspan
        headerCell.id = [sourceCell.modelField.name, sourceCell.type].join('.')
        headerCell.cell_style.push('transposed')

        if (headerCell.colspan > 0) {
          headerCell.cell_style.push('merged')
        }

        transposedColumn.levels.push(headerCell)
      })

      this.transposed_columns.push(transposedColumn)
    })
    
    var measure_parent = {
      align: 'right',
      type: 'transposed_table_measure',
      is_table_calculation: false
    }
  
    // One column per data row (line items, subtotals, totals)
    this.data.forEach(sourceRow => {
      var transposedColumn = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["Column"](sourceRow.id, this, measure_parent)

      this.transposed_headers.forEach(header => {
        var cellRef = this.useIndexColumn && ['subtotal', 'total'].includes(sourceRow.type) ? '$$$_index_$$$' : header.modelField.name
        var sourceCell = sourceRow.data[cellRef]
        var headerCell = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["HeaderCell"]({ 
          column: transposedColumn, 
          type: header.type, 
          label: sourceCell.rendered === '' ? sourceCell.rendered : sourceCell.rendered || sourceCell.value, 
          align: 'center',
          cell_style: sourceCell.cell_style,
        })
        headerCell.colspan = sourceCell.rowspan
        headerCell.rowspan = sourceCell.colspan
        headerCell.id = [sourceCell.colid, sourceCell.rowid].join('.')
        headerCell.cell_style.push('transposed')

        transposedColumn.levels.push(headerCell)
      })

      this.transposed_columns.push(transposedColumn)
    })
  }

  transposeColumnsIntoRows () { 
    console.log('transposeColumnsIntoRows()...')
    this.columns.filter(c => c.modelField.type === 'measure').forEach(column => {
      var transposedData = {}

      // INDEX FIELDS // every index/dimension column in original table must be represented as a data cell in the new transposed rows
      column.levels.forEach((level, i) => {        
        var cell = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["DataCell"]({
          value: level.label,
          rendered: level.label,
          rowspan: level.colspan,
          colspan: level.rowspan,
          cell_style: ['indexCell', 'transposed'],
          align: 'left',
          colid: column.id,
          rowid: level.type
        })

        switch (level.type) {
          case 'pivot0':
          case 'pivot1':
            cell.cell_style.push('pivot')
            break
          case 'heading':
          case 'field':
            var style = column.modelField.is_table_calculation ? 'calculation' : 'measure'
            cell.cell_style.push(style)
            break
        }

        if (cell.rowspan > 1) {
          cell.cell_style.push('merged')
        }

        transposedData[level.type] = cell
      })

      // MEASURE FIELDS // every measure column in original table is converted to a data row
      this.data.forEach(row => {
        if (typeof row.data[column.id] !== 'undefined') {
          var sourceCell = row.data[column.id]
          transposedData[row.id] = row.data[column.id]
          transposedData[row.id].id = [sourceCell.colid, sourceCell.rowid].join('.')
          transposedData[row.id]['cell_style'].push('transposed')
        } else {
          console.log('row data does not exist for', column.id)
        }
      })

      var transposed_row = new _vis_primitives__WEBPACK_IMPORTED_MODULE_1__["Row"]('line_item')
      transposed_row.id = column.id
      transposed_row.modelField = column.modelField
      transposed_row.hide = column.hide
      transposed_row.data = transposedData

      this.transposed_data.push(transposed_row)

    })
  }

  validateConfig() {
    if (!['traditional', 'looker', 'contemporary', 'custom'].includes(this.config.theme)) {
      this.config.theme = 'traditional'
    }

    if (!['fixed', 'auto'].includes(this.config.layout)) {
      this.config.layout = 'fixed'
    }

    if (typeof this.config.transposeTable === 'undefined') {
      this.config.transposeTable = false
    }

    Object.entries(this.config).forEach(option => {
      if (option[1] === 'false') {
        option[1] = false
      } else if (option[1] === 'true') {
        option[1] = true
      }

      if (option[0].split('|').length === 2) {
        var [field_option, field_name] = option[0].split('|')
        if (['label', 'heading', 'hide', 'style', 'switch', 'var_num', 'var_pct', 'comparison'].includes(field_option)) {
          var keep_option = false
          this.dimensions.forEach(dimension => {
            if (dimension.name === field_name) { keep_option = true }
          })
          this.measures.forEach(measure => {
            if (measure.name === field_name) { keep_option = true }
          })
          if (!keep_option) {
            delete this.config[option[0]]
          } 
        }
      }
    })
  }

  /**
   * Returns column that matches ID provided
   * @param {*} id 
   */
  getColumnById (id) {
    var column = {}
    this.columns.forEach(c => {
      if (id === c.id) { 
        column = c 
      }
    })
    return column
  }

  /**
   * Returns row that matches ID provided
   * @param {*} id 
   */
  getRowById (id) {
    var row = {}
    this.data.forEach(r => {
      if (id === r.id) {
        row = r
      }
    })
    return row
  }

  getMeasureByName (name) {
    var measure = ''
    this.measures.forEach(m => {
      if (name === m.name) { 
        measure = m
      }
    })
    return measure
  }


  /**
   * Extracts the formatted value of the field from the html: value
   * There are cases (totals data) where the formatted value isn't available as usual rendered_value
   * @param {*} cellValue 
   */
  getRenderedFromHtml (cellValue) {
    var parser = new DOMParser()
    if (typeof cellValue.html !== 'undefined' && !['undefined', ''].includes(cellValue.html)) {
      try {
        var parsed_html = parser.parseFromString(cellValue.html, 'text/html')
        var rendered = parsed_html.documentElement.textContent
      }
      catch(TypeError) {
        var rendered = cellValue.html
      }
    } else {
      var rendered = cellValue.value
    }

    return rendered
  }

  /**
   * Used to support rendering of table as vis. 
   * Returns an array of 0s, of length to match the required number of header rows
   */
  getHeaderTiers () {    
    if (!this.transposeTable) {
      return this.headers
    } else {
      return this.transposed_headers
    }
  }

  /**
   * Used to support rendering of data table as vis. 
   * Builds list of columns out of data set that should be displayed
   * @param {*} i 
   */
  getTableHeaderCells (i) {
    if (!this.transposeTable) {
      return this.columns
        .filter(c => !c.hide)
        .filter(c => c.levels[i].colspan > 0)
    } else {
      return this.transposed_columns
        .filter(c => c.levels[i].colspan > 0)
    }
  }

  getDataRows () {
    if (!this.transposeTable) {
      var dataRows = this.data.filter(row => !row.hide)
    } else {
      var dataRows = this.transposed_data.filter(row => !row.hide)
    }
    return dataRows
  }

  /**
   * Used to support rendering of data table as vis.
   * For a given row of data, returns filtered array of cells – only those cells that are to be displayed.
   * @param {*} row 
   */
  getTableRowColumns (row) {
    if (!this.transposeTable) {
      var cells = this.columns
        .filter(column => !column.hide)
        .filter(column => row.data[column.id].rowspan > 0)
    } else {
      var cells = this.transposed_columns
      .filter(column => !column.hide)
      .filter(column => row.data[column.id].rowspan > 0)
    }
    return cells    
  }

  /**
   * Used to support column drag'n'drop when rendering data table as vis.
   * Updates the table.config with the new pos values.
   * Accepts a callback function for interaction with the vis.
   * @param {*} from 
   * @param {*} to 
   * @param {*} callback 
   */
  moveColumns(from, to, updateColumnOrder) {
    var config = this.config
    if (from != to) {
      var shift = to - from
      var col_order = config.columnOrder
      this.columns.forEach(col => {
        if (col.modelField.type == 'measure' && !col.super) {
          if (col.pos >= from && col.pos < from + 10) {
            // console.log('MOVING COLUMN', col.id, col.pos, '->', col.pos + shift)
            col.pos += shift
          } else if (col.pos >= to && col.pos < from) {
            // console.log('NUDGING COLUMN', col.id, col.pos, '->', col.pos + 10)
            col.pos += 10
          } else if (col.pos >= from + 10 && col.pos < to + 10) {
            // console.log('NUDGING COLUMN', col.id, col.pos, '->', col.pos - 10)
            col.pos -= 10
          }
          col_order[col.id] = col.pos
        } 
      })
      updateColumnOrder(col_order)
    }
  }

  /**
   * Returns dataset as a simple json object
   * Includes line_items only (e.g. no row subtotals)
   * 
   * Convenience function when using LookerData as an object to support e.g. Vega Lite visualisations
   */
  getSimpleJson() {
    var raw_values = []
    this.data.forEach(r => {
      if (r.type === 'line_item') {
        var row = {}
        this.columns.forEach(c => {
          row[c.id] = r.data[c.id].value
        })
        raw_values.push(row)
      }
    })
    return raw_values
  }


  /**
   * Builds array of arrays, used at by table vis to build column groups
   * Three column groups: 
   * - index (dimensions)
   * - measures (standard measures)
   * - totals (supermeasures: row totals and some table calcs)
   * 
   * For transposed tables:
   * - index (headers, pivot value, measures)
   * - measures (Includes subtotals. Cells contain measure values, header rows contain dimension values)
   * - totals (totals)
   */
  getTableColumnGroups () {
    var indexColumns = []
    var measureColumns = []
    var totalColumns = []

    if (!this.transposeTable) {
      this.columns.forEach(column => {
        if (column.modelField.type === 'dimension' && !column.hide) {
          indexColumns.push({ id: column.id, type: 'index' })
        } else if (column.modelField.type === 'measure' && !column.isRowTotal && !column.super && !column.hide) {
          measureColumns.push({ id: column.id, type: 'dataCell' })
        } else if (column.modelField.type === 'measure' && (column.isRowTotal || column.super) && !column.hide) {
          totalColumns.push({ id: column.id, type: 'dataCell' })
        }
      })
    } else {
      this.transposed_columns.forEach(column => {
        if (column.modelField.type === 'transposed_table_index') {
          indexColumns.push({ id: column.id, type: 'index' })
        } else if (column.modelField.type === 'transposed_table_measure' && column.id !== 'Total') {
          measureColumns.push({ id: column.id, type: 'dataCell' })
        } else if (column.modelField.type === 'transposed_table_measure' && column.id === 'Total') {
          totalColumns.push({ id: column.id, type: 'dataCell' })
        }
      })
    }

    var columnGroups = []
    if (indexColumns.length > 0) {
      columnGroups.push(indexColumns)
    }
    if (measureColumns.length > 0) {
      columnGroups.push(measureColumns)
    }
    if (totalColumns.length > 0) {
      columnGroups.push(totalColumns)
    }

    return columnGroups
  }

  getCellToolTip (rowid, colid) {
    var tipHTML = '<table><tbody>'

    var row = this.getRowById(rowid)
    var focusColumn = this.getColumnById(colid) 
    var field = focusColumn.modelField 

    if (row.type === 'total') {
      var label = 'TOTAL'
      var value = ''
      var rowClass = 'focus'
      tipHTML += ['<tr class="', rowClass, '"><td><span style="float:left"><em>', label, ':</em></td><td></span><span style="float:left"> ', value, '</span></td></tr>'].join('')
    } else if (row.id.startsWith('Others')) {
      var label = 'Others'
      var value = ''
      var rowClass = 'focus'
      tipHTML += ['<tr class="', rowClass, '"><td><span style="float:left"><em>', label, ':</em></td><td></span><span style="float:left"> ', value, '</span></td></tr>'].join('')      
    } else if (row.type === 'subtotal') {
      var label = 'SUBTOTAL'
      var rowClass = 'focus'
      var subtotalColumn = this.columns.filter(c => !c.hide).filter(c => c.modelField.type === 'dimension')[0]
      var value = row.data[subtotalColumn.id].render || row.data[subtotalColumn.id].value
      tipHTML += ['<tr class="', rowClass, '"><td><span style="float:left"><em>', label, ':</em></td><td></span><span style="float:left"> ', value, '</span></td></tr>'].join('')
    } else {
      var dimensionColumns = this.columns
      .filter(c => c.id !== '$$$_index_$$$')
      .filter(c => c.modelField.type === 'dimension')

      dimensionColumns.forEach(column => {
        var label = column.getHeaderCellLabelByType('field')
        var value = row.data[column.id].rendered || row.data[column.id].value
        var rowClass = column.id === focusColumn.id ? 'focus' : ''
        tipHTML += ['<tr class="', rowClass, '"><td><span style="float:left"><em>', label, ':</em></td><td></span><span style="float:left"> ', value, '</span></td></tr>'].join('')
      })
    }
  
    tipHTML += '<tr style="height:10px"></tr>' // spacer row

    var isEstimate = false
    var measureLabel = ''
    var measureColumns = this.columns
      .filter(c => c.modelField.type === 'measure')
      .filter(c => c.modelField === field)
    
    measureColumns.forEach(column => {
      if (!column.isVariance) {
        measureLabel = column.getHeaderCellLabelByType('field')
      }

      if ((!column.pivoted && !column.isRowTotal) || (column.pivot_key === focusColumn.pivot_key)) {
        var label = column.getHeaderCellLabelByType('field')
        var rowClass = column.id === focusColumn.id ? 'focus' : ''
        
        var cell = row.data[column.id]
        var value = cell.rendered || cell.value
        if (cell.html) { 
          var parser = new DOMParser()
          var parsed_html = parser.parseFromString(cell.html, 'text/html')
          value = parsed_html.documentElement.textContent
        }

        if (cell.cell_style.includes('estimate')) {
          isEstimate = true
        }

        tipHTML += ['<tr class="', rowClass, '"><td><span style="float:left"><em>', label, ':</em></td><td></span><span style="float:right"> ', value, '</span></td></tr>'].join('')
      }
    })

    var isReportedIn = null
    var reportInSetting = this.config['reportIn|' + focusColumn.modelField.name]
    var reportInLabels = {
      1000: '000s',
      1000000: 'Millions',
      1000000000: 'Billions'
    }
    if (typeof reportInSetting !== 'undefined'  && reportInSetting !== '1') {
      isReportedIn = measureLabel + ' reported in ' + reportInLabels[reportInSetting]
    }

    if (isReportedIn || isEstimate) {
      tipHTML += '<tr style="height:10px"></tr>' // spacer row
    }

    if (isReportedIn) {
      tipHTML += '<tr><td colspan=2><span style="color:darkgrey">' + isReportedIn + '.</span></td></tr>'
    }

    if (isEstimate) {
      tipHTML += '<tr><td colspan=2><span style="color:red">Estimated figure due to query exceeding row limit.</span></td></tr>'
      tipHTML += '<tr><td colspan=2><span style="color:red">Consider increasing the row limit or using an alternative measure.</span></td></tr>'
    }

    tipHTML += '</tbody><table>'

    return tipHTML
  }
}

exports.VisPluginTableModel = VisPluginTableModel


/***/ })
/******/ ]);
//# sourceMappingURL=vis_table_plugin.js.map