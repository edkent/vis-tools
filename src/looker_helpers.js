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
  constructor({ vis, name, view, label, is_numeric, value_format = '', heading = '', short_name = '', unit = ''}) {
    this.vis = vis
    this.name = name
    this.view = view
    this.label = label
    this.is_numeric = is_numeric
    this.value_format = value_format
    this.heading = heading
    this.short_name = short_name
    this.unit = unit
  }
}

class ModelDimension extends ModelField {
  constructor({ 
    vis, name, view, label, is_numeric,
    value_format = '', heading = '', short_name = '', unit = ''
  }) {
    super({ vis, name, view, label, is_numeric, value_format, heading, short_name, unit })

    this.type = 'dimension'    
    this.align = 'left'
    this.hide = false

    if (typeof this.vis.config['hide|' + this.name] !== 'undefined') {
      if (this.vis.config['hide|' + this.name]) {
        this.hide = true
      } 
    }
  }
}

class ModelMeasure extends ModelDimension {
  constructor({ 
    vis, name, view, label, is_numeric,
    is_table_calculation, calculation_type, can_pivot, is_turtle = false,
    heading = '', short_name = '', unit = '', value_format = ''
  }) {
    super({ vis, name, view, label, is_numeric, value_format, heading, short_name, unit })

    this.type = 'measure'
    this.is_table_calculation = is_table_calculation
    this.calculation_type = calculation_type
    this.can_pivot = can_pivot
    this.is_turtle = is_turtle
    this.align = 'right'
    this.hide = false
    this.style = []

    if (typeof this.vis.config['style|' + this.name] !== 'undefined') {
      if (this.vis.config['style|' + this.name] === 'hide') {
        this.hide = true
      } else {
        this.style.push(this.vis.config['style|' + this.name])
      }
    }
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
      this.types = []

      var line_items_only = []
      var with_subtotals = []
      for (var i = 0; i < keys.length; i++) {
        this.types[i] = typeof types[i] !== 'undefined' ? types[i] : 'line_item'
        if (this.types[i] === 'line_item') {
          line_items_only.push(this.values[i])
          with_subtotals.push(this.values[i])
        } else if (this.types[i] === 'subtotal') {
          with_subtotals.push(this.values[i])
        }
      }

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

  to_string() {
    var rendered = ''
    for (var i = 0; i < this.series.keys.length; i++) {
      rendered += this.series.keys[i] + ':'
      var formatted_value = this.column.modelField.value_format === '' 
                            ? this.series.values[i].toString() 
                            : SSF.format(this.column.modelField.value_format, this.series.values[i])
      rendered += formatted_value + ' '
    }
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

class PivotField {
  constructor({ name, label, view }) {
    this.name = name,
    this.label = label,
    this.view = view
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
    this.colspans = []

    this.unit = modelField.unit || ''
    this.hide = modelField.hide || false
    this.variance_type = '' // empty | absolute | percentage
    this.pivoted = false
    this.subtotal = false
    this.super = false

    this.series = null
    
    this.sort_by_measure_values = [] // [index -1|dimension 0|measure 1|row totals & supermeasures 2, column number, [measure values]  ]
    this.sort_by_pivot_values = []   // [index -1|dimension 0|measure 1|row totals & supermeasures 2, [pivot values], column number    ]
  }

  /**
   * Returns a header label for a column, to display in table vis
   * @param {*} label_with_view - full field name including label e.g. "Users Name"
   * @param {*} label_with_pivots - adds all pivot values "Total Users Q1 Male"
   */
  getLabel (level) {
    if (this.transposed) {
      return this.labels[level]
    }

    if (typeof this.vis.useShortName !== 'undefined') {
      switch (this.variance_type) {
        case 'absolute':
          var label = 'Var #'
          break;
        case 'percentage':
          var label = 'Var %'
          break;
        default:
          var label = this.vis.useShortName ? this.modelField.short_name || this.modelField.label : this.modelField.label
      }
    } else {
      var label = this.modelField.label
    }
    

    var key = 'label|' + this.modelField.name
    if (typeof this.vis.config[key] !== 'undefined' && this.vis.config[key] !== this.modelField.label) {
      label = this.vis.config[key] ? this.vis.config[key] : label
    }

    if (typeof this.vis.useViewName !== 'undefined') {
      if (this.vis.useViewName) { 
        label = [this.modelField.view, label].join(' ') 
      }
    }
    
    if (typeof this.vis.has_pivots !== 'undefined') {
      if (this.vis.has_pivots) { 
        if (this.vis.sortColsBy === 'getSortByPivots') {
          if (level < this.levels.length) {
            label = this.levels[level]
          } else {
            // label already set
          }
        } else { // params.config.sortColumnsBy === 'getSortByMeasures'
          if (level >= 1) {
            label = this.levels[level - 1]
          } else {
            // label already set
          }
        } 
      } else { // flat table
        if (this.vis.useHeadings && level === 0) {
          var key = 'heading|' + this.modelField.name
          if (typeof this.vis.config[key] !== 'undefined') {
            label = this.vis.config[key] ? this.vis.config[key] : this.modelField.heading
          } else {
            label = this.modelField.heading
          }
        } else {
          // label already set
        }
      }
    }

    return label
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
exports.ModelMeasure = ModelMeasure
exports.CellSeries = CellSeries
exports.ColumnSeries = ColumnSeries
exports.PivotField = PivotField
exports.Row = Row
exports.Column = Column
