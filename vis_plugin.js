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
/******/ 	return __webpack_require__(__webpack_require__.s = 3);
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
/* 1 */,
/* 2 */,
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _vis_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(0);
/* harmony import */ var _vis_primitives__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_vis_primitives__WEBPACK_IMPORTED_MODULE_0__);


const pluginDefaults = {
  dimensionLabels: true,
  dimensionHide: false,
  measureLabels: true,
  measureStyles: [],
  colorBy: false,
  groupBy: false,
  sizeBy: false,
}

/**
 * Represents an "enriched data object" with additional methods and properties for data vis
 * Takes the data, config and queryResponse objects as inputs to the constructor
 */
class VisPluginModel {
  /**
   * Build the lookerData object
   * @constructor
   * 
   * 1. Check for pivots and supermeasures
   * 2. Add dimensions, list of ids, list of full objects
   * 3. Add measures, list of ids, list of full objects
   * 4. Build rows
   * 
   * @param {*} lookerData 
   * @param {*} config 
   * @param {*} queryResponse 
   */
  constructor(lookerData, config, queryResponse) {
    this.visId = 'vis_plugin'
    this.config = config

    this.dimensions = []
    this.measures = []
    this.columns = []
    this.data = []
    

    this.ranges = {}
    
    this.pivot_fields = []
    this.pivot_values = []
    this.has_pivots = false
    
    if (typeof queryResponse.fields.supermeasure_like !== 'undefined') {
      this.has_supers = true
    } else {
      this.has_supers = false
    }

    this.addPivots(queryResponse)
    this.addDimensions(queryResponse)
    this.addMeasures(queryResponse)
    this.buildRows(lookerData)
  }

  addPivots(queryResponse) {
    if (typeof queryResponse.pivots !== 'undefined') {
      queryResponse.fields.pivots.forEach(pivot => { 
        var pivot_field = new _vis_primitives__WEBPACK_IMPORTED_MODULE_0__["PivotField"]({
          name: pivot.name,
          label: pivot.label_short || pivot.label,
          view: pivot.view_label || '',
        })
        this.pivot_fields.push(pivot_field) 
        this.ranges[pivot_field.name] = {set : []}
      })
      
      this.pivot_values = queryResponse.pivots
      this.ranges['lookerPivotKey'] = {set: []}

      this.pivot_values.forEach(pivot_value => {
        this.ranges['lookerPivotKey'].set.push(pivot_value.key)
        
        for (var key in pivot_value.data) {
          var current_set = this.ranges[key].set
          var row_value = pivot_value.data[key]
          if (current_set.indexOf(row_value) === -1) {
            current_set.push(row_value)
          }
        }
      })
      this.has_pivots = true
    }
  }

  addDimensions(queryResponse) {
    queryResponse.fields.dimension_like.forEach(dimension => {
      var dim = new _vis_primitives__WEBPACK_IMPORTED_MODULE_0__["ModelDimension"]({
        vis: this,
        modelField: dimension
      })
      this.dimensions.push(dim)
      this.ranges[dim.name] = {
        set: [],
      }

      var column = new _vis_primitives__WEBPACK_IMPORTED_MODULE_0__["Column"](dim.name, this, dim) 
      column.levels = Object(_vis_primitives__WEBPACK_IMPORTED_MODULE_0__["newArray"])(queryResponse.fields.pivots.length, '') // populate empty levels when pivoted

      this.columns.push(column)
    })
  }

  addMeasures(queryResponse) {
    // add measures, list of ids
    queryResponse.fields.measure_like.forEach(measure => {
      var mea = new _vis_primitives__WEBPACK_IMPORTED_MODULE_0__["ModelMeasure"]({
        vis: this,
        modelField: measure
      })
      this.measures.push(mea) 
      this.ranges[mea.name] = {
        min: 100000000,
        max: 0,
      }
    })
    
    // add measures, list of full objects
    if (this.has_pivots) {
      this.pivot_values.forEach(pivot_value => {
        this.measures.length.forEach((measure, m) => {
          var include_measure = (                                     // for pivoted measures, skip table calcs for row totals
            pivot_value.key != '$$$_row_total_$$$'                    // if user wants a row total for table calc, must define separately
          ) || (
            pivot_value.key == '$$$_row_total_$$$' 
            && measure.is_table_calculation == false
          )

          if (include_measure) {
            var pivotKey = pivot_value.key
            var measureName = measure.name
            var columnId = pivotKey + '.' + measureName

            var levels = [] // will contain a list of all the pivot values for this column
            var level_sort_values = []
            this.pivot_fields.forEach(pivot => { 
              levels.push(pivot_value[pivot.name])
              level_sort_values.push(pivot_value.sort_values[pivot.name]) 
            })

            var column = new _vis_primitives__WEBPACK_IMPORTED_MODULE_0__["Column"](columnId, this, measure)
            column.levels = levels
            column.pivoted = true
            column.pivot_key = pivotKey

            // TODO: Hide function

            this.columns.push(column)
          }
        })
      })
    } else {
      // noticeably simpler for flat tables!
      this.measures.forEach(measure => {
        var column = new _vis_primitives__WEBPACK_IMPORTED_MODULE_0__["Column"](measure.name, vis, measure)

        this.columns.push(column)

        if (typeof this.config['style|' + column.id] !== 'undefined') {
          if (this.config['style|' + column.id] === 'hide') {
            column.hide = true
          }
        }
      })
    }
    
    // add supermeasures, if present
    if (typeof queryResponse.fields.supermeasure_like !== 'undefined') {
      queryResponse.fields.supermeasure_like.forEach(supermeasure => {
        var mea = new _vis_primitives__WEBPACK_IMPORTED_MODULE_0__["ModelMeasure"]({
          vis: this,
          modelField: supermeasure
        })
        this.measures.push(mea) 

        var column = new _vis_primitives__WEBPACK_IMPORTED_MODULE_0__["Column"](mea.name, this, mea)
        column.levels = Object(_vis_primitives__WEBPACK_IMPORTED_MODULE_0__["newArray"])(queryResponse.fields.pivots.length, '')
        column.super = true

        this.columns.push(column)
      })
    }
  }

  buildRows(lookerData) {
    lookerData.forEach(lookerRow => {
      var row = new _vis_primitives__WEBPACK_IMPORTED_MODULE_0__["Row"]() // TODO: consider creating the row object once all required field values identified
      
      this.columns.forEach(column => {
        var name = column.modelField.name

        // flatten data, if pivoted. Looker's data structure is nested for pivots (to a single level, no matter how many pivots)
        if (column.pivoted) {
          row.data[column.id] = lookerRow[name][column.pivot_key]
        } else {
          row.data[column.id] = lookerRow[column.id]
        }

        if (typeof row.data[column.id] !== 'undefined') {
          if (column.modelField.type === 'measure') {
            var current_min = this.ranges[name].min
            var current_max = this.ranges[name].max
            var row_value = row.data[column.id].value

            this.ranges[name].min = Math.min(current_min, row_value)
            this.ranges[name].max = Math.max(current_max, row_value)
          } else if (column.modelField.type === 'dimension') {
            var current_set = this.ranges[name].set
            var row_value = row.data[column.id].value

            if (current_set.indexOf(row_value) === -1) {
              current_set.push(row_value)
            }
          }

          if (typeof row.data[column.id].cell_style === 'undefined') {
            row.data[column.id].cell_style = []
          }
        }
      })

      // set a unique id for the row
      var all_dims = []
      this.dimensions.forEach(dimension => {
        all_dims.push(lookerRow[dimension.name].value)
      })
      row.id = all_dims.join('|')

      this.data.push(row)
    })
  }

  getDimensionByName(name) {
    this.dimensions.forEach(d => {
      if (d.name === name) {
        return d
      }
    })
  }

  getMeasureByName(name) {
    this.measures.forEach(m => {
      if (m.name === name) {
        return m
      }
    })
  }

  /**
   * Returns dataset as a simple json object
   * Includes line_items only (e.g. no row subtotals)
   * 
   * @param {boolean} includeRowId - adds a unique lookerId value to each row
   * @param {boolean} melt - if dataset is pivoted, will 'melt' back to flat data
   */
  getJson(includeRowId=true, melt=false) {
    var jsonData = []
    if (!this.has_pivots || !melt) {
      this.data.forEach(r => {
        var row = {}
        this.columns
          .filter(c => !c.hide).forEach(c => {
            row[c.id] = r.data[c.id].value
          })
        if (includeRowId) {
          row.lookerId = r.id
        }
        jsonData.push(row)
      })
    } else {
      this.pivot_values.forEach(p => {
        this.data.forEach(r => {
          var row = {}
          for (var pivot_value in p.data) {
            row[pivot_value] = p.data[pivot_value]
          }
          this.columns // 'flat fields' i.e. dimensions and supermeasures
            .filter(c => !c.hide)
            .filter(c => c.type === 'dimension' || c.super)
            .forEach(c => {
              row[c.id] = r.data[c.id].value
            })
          this.columns // 'pivoted fields' i.e. measures
            .filter(c => !c.hide)
            .filter(c => c.pivoted)
            .forEach(c => {
              var valueRef = p.key + '.' + c.modelField.name
              row[c.modelField.name] = r.data[valueRef].value
            })
          if (includeRowId) {
            row.lookerId = p.key + '|' + r.id
          }
          row.lookerPivotKey = p.key
          jsonData.push(row)
        })
      })
    }

    return jsonData
  }

  getTooltipFromD3(d) {
    var tipText = ''

    Object.entries(d).forEach(entry => {
      tipText += "<p><em>" + entry[0] + ":</em> " + entry[1] + "</p>"
    })
    
    return tipText;
  }
}

const getConfigOptions = (visModel, pluginSettings=pluginDefaults, baseOptions={}) => {
  var pluginSettings = {...pluginDefaults, ...pluginSettings} 
  var newOptions = baseOptions

  visModel.dimensions.forEach((dimension, i) => {
    if (pluginSettings.dimensionLabels) {
      newOptions['label|' + dimension.name] = {
        section: 'Dimensions',
        type: 'string',
        label: dimension.label,
        default: dimension.label,
        order: i * 10 + 1,
      }
    }

    if (pluginSettings.dimensionHide) {
      newOptions['hide|' + dimension.name] = {
        section: 'Dimensions',
        type: 'boolean',
        label: 'Hide',
        display_size: 'third',
        order: i * 10 + 2,
      }
    }
  })

  visModel.measures.forEach((measure, i) => {
    if (pluginSettings.measureLabels) {
      newOptions['label|' + measure.name] = {
        section: 'Measures',
        type: 'string',
        label: measure.label_short || measure.label,
        default: measure.label_short || measure.label,
        order: 100 + i * 10 + 1,
      }
    }

    if (pluginSettings.measureStyles.length > 0) {
      newOptions['style|' + visModel.measures[i].name] = {
        section: 'Measures',
        type: 'string',
        label: 'Style',
        display: 'select',
        values: optionChoices.measureStyles,
        order: 100 + i * 10 + 2
      }
    }
  })

  if (pluginSettings.sizeBy) {
    var sizeByOptions = [];
    visModel.measures.forEach(measure => {
        var option = {};
        option[measure.label] = measure.name;
        sizeByOptions.push(option);
    })
  
    newOptions["sizeBy"] = {
        section: " Visualization",
        type: "string",
        label: "Size By",
        display: "select",
        values: sizeByOptions,
        default: "0",
        order: 300,
    }
  }

  // colorByOptions include:
  // - by dimension
  // - by pivot key (which are also dimensions)
  // - by pivot series (one color per column)
  var colorByOptions = [];
  visModel.dimensions.forEach(dimension => {
      var option = {};
      option[dimension.label] = dimension.name;
      colorByOptions.push(option)
  })

  visModel.pivot_fields.forEach(pivot_field => {
    var option = {};
    option[pivot_field.label] = pivot_field.name;
    colorByOptions.push(option)
  })

  if (visModel.pivot_fields.length > 1 ) {
    colorByOptions.push({'Pivot Series': 'lookerPivotKey'})
  }
  
  if (pluginSettings.colorBy) {
    newOptions["colorBy"] = {
      section: " Visualization",
      type: "string",
      label: "Color By",
      display: "select",
      values: colorByOptions,
      default: "0",
      order: 100,
    } 
  }

  if (pluginSettings.groupBy) {
    newOptions["groupBy"] = {
      section: " Visualization",
      type: "string",
      label: "Group By",
      display: "select",
      values: colorByOptions,
      default: "0",
      order: 200,
    } 
  }

  return newOptions
}

exports.VisPluginModel = VisPluginModel
exports.getConfigOptions = getConfigOptions


/***/ })
/******/ ]);
//# sourceMappingURL=vis_plugin.js.map