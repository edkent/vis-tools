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
    this.value_format = queryResponseField.value_format

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

class HeaderField {
  constructor({ vis, type, modelField = { name: '', label: '', view: '' }, pivotData = {} } = { vis, type, modelField, pivotData }) {
    this.vis = vis
    this.type = type
    
    this.modelField = modelField
    // this.name = modelField.name
    // this.view = modelField.view

    this.pivotData = pivotData
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

      this.min_for_display = Math.min(with_subtotals)
      this.max_for_display = Math.max(with_subtotals)
      this.min = Math.min(line_items_only)
      this.max = Math.max(line_items_only)
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

/**
 * Represents a row in the dataset that populates the vis.
 * This may be an addtional row (e.g. subtotal) not in the original query
 * @class
 */
class Row {
  constructor(type = 'line_item') {
    this.id = ''
    this.modelField = null
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
    this.variance_type = '' // empty | absolute | percentage
    this.pivoted = false
    this.subtotal = false
    this.super = false

    this.series = null
    
    this.sort_by_measure_values = [] // [index -1|dimension 0|measure 1|row totals & supermeasures 2, column number, [measure values]  ]
    this.sort_by_pivot_values = []   // [index -1|dimension 0|measure 1|row totals & supermeasures 2, [pivot values], column number    ]

    this.colspans = []

    var colspan_values = {}
    this.vis.headers.forEach(header => {
      colspan_values[header.type] = 1
    })
    this.vis.colspan_values[this.id] = colspan_values
  }

  /**
   * Returns a header label for a column, to display in table vis
   * @param {*} level
   */
  getLabel (level) {
    var headerField = this.levels[level]

    var label = headerField.modelField.label

    var header_setting = this.vis.config['heading|' + headerField.modelField.name]
    var label_setting = this.vis.config['label|' + headerField.modelField.name]

    if (headerField.type === 'heading') {
      if (typeof header_setting !== 'undefined') {
        label = header_setting ? header_setting : headerField.modelField.heading
      } else {
        label = headerField.modelField.heading
      }
      return label
    }

    if (headerField.type === 'field') {
      if (typeof this.vis.visId !== 'undefined' && this.vis.visId === 'report_table') {
        switch (this.variance_type) {
          case 'absolute':
            label = 'Var #'
            break;
          case 'percentage':
            label = 'Var %'
            break;
          default:
            label = this.vis.useShortName
             ? headerField.modelField.short_name || headerField.modelField.label 
             : headerField.modelField.label
        }
      } 
      
      if (typeof label_setting !== 'undefined' && label_setting !== this.modelField.label) {
        label = label_setting ? label_setting : label
      }
  
      if (typeof this.vis.useViewName !== 'undefined' && this.vis.useViewName) {
        label = [this.modelField.view, label].join(' ') 
      }
    }
    
    return label
  }

  /***
   * Returns array of all header fields per column
   * 1. Combine pivot values with measure label, in order set by sortColsBy option
   * 2. Add headings if used (option chosen, flat tables only)
   */
  getHeaderLevels () {
    if (this.modelField.vis.sortColsBy === 'getSortByPivots') {
      var header_levels = [...this.levels, this.getLabel(this.levels.length)]
    } else {
      var header_levels = [this.getLabel(0), ...this.levels]
    }

    if (this.modelField.vis.useHeadings && !this.modelField.vis.has_pivots) {
      var column_heading = this.modelField.heading
      var config_setting = this.modelField.vis.config['heading|' + this.modelField.name]
      if (typeof config_setting !== 'undefined') {
        column_heading = config_setting ? config_setting : column_heading
      } 
      header_levels.unshift(column_heading)
    }

    return header_levels
  }

  getHeaderData () {
    var headerData = {}
    this.modelField.vis.headers.forEach((header, i) => {
      headerData[header.type] = this.levels[i]
    })

    return headerData
  }

  updateSortByMeasures (idx) {
    if (this.sort_by_measure_values[0] == 1) {
      if (!this.pivoted && !this.subtotal) {
        this.sort_by_measure_values = [1, idx]
      }
    }
  }

  getSortByMeasures () {
    return this.sort_by_measure_values
  }

  getSortByPivots () {
    return this.sort_by_pivot_values
  }
}

exports.newArray = newArray
exports.ModelDimension = ModelDimension
exports.ModelPivot = ModelPivot
exports.ModelMeasure = ModelMeasure
exports.CellSeries = CellSeries
exports.ColumnSeries = ColumnSeries
exports.HeaderField = HeaderField
exports.Row = Row
exports.Column = Column
