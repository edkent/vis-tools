import SSF from "ssf"

const use_column_series = true

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

const lookerDataTableCoreOptions = {
  theme: {
    section: "Theme",
    type: "string",
    display: "select",
    label: "Theme",
    values: [
      { 'Traditional': 'traditional' },
      { 'Looker': 'looker' },
      { 'Contemporary': 'contemporary' }
    ],
    default: "traditional",
    order: 1,
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
    order: 2,
  },
  columnOrder: {},
  rowSubtotals: {
    section: "Table",
    type: "boolean",
    label: "Row Subtotals",
    display_size: 'half',
    default: "false",
    order: 1,
  },
  colSubtotals: {
    section: "Table",
    type: "boolean",
    label: "Col Subtotals",
    display_size: 'half',
    default: "false",
    order: 2,
  },
  spanRows: {
    section: "Table",
    type: "boolean",
    label: "Merge Dims",
    display_size: 'half',
    default: "true",
    order: 3,
  },
  spanCols: {
    section: "Table",
    type: "boolean",
    label: "Merge Headers",
    display_size: 'half',
    default: "true",
    order: 4,
  },
  subtotalDepth: {
    section: "Table",
    type: "number",
    label: "Sub Total Depth",
    default: 1,
    order: 5,
  },
  sortColumnsBy: {
    section: "Table",
    type: "string",
    display: "select",
    label: "Sort Columns By",
    values: [
      { 'Pivots': 'getSortByPivots' },
      { 'Measures': 'getSortByMeasures' }
    ],
    default: "getSortByPivots",
    order: 6,
  },
  useViewName: {
    section: "Table",
    type: "boolean",
    label: "Include View Name",
    default: "false",
    order: 7,
  },
  useHeadings: {
    section: "Table",
    type: "boolean",
    label: "Use Headings (non-pivots only)",
    default: "false",
    order: 8,
  },
  useShortName: {
    section: "Table",
    type: "boolean",
    label: "Use Short Name (from model)",
    default: "false",
    order: 9,
  },
  groupVarianceColumns: {
    section: "Table",
    type: "boolean",
    label: "Group Variance Columns After Pivots",
    default: "false",
    order: 10,
  },
  indexColumn: {
    section: "Dimensions",
    type: "boolean",
    label: "Use Last Field Only",
    default: "false",
    order: 0,
  },
  tranposeTable: {
    section: "Table",
    type: "boolean",
    label: "Transpose",
    default: "false",
    order: 100,
  },
}

class ModelField {
  constructor({ table, name, view, label, is_numeric, value_format = '', heading = '', short_name = '', unit = ''}) {
    this.table = table
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
    table, name, view, label, is_numeric,
    value_format = '', heading = '', short_name = '', unit = ''
  }) {
    super({ table, name, view, label, is_numeric, value_format, heading, short_name, unit })

    this.type = 'dimension'    
    this.align = 'left'
    this.hide = false

    if (typeof this.table.config['hide|' + this.name] !== 'undefined') {
      if (this.table.config['hide|' + this.name]) {
        this.hide = true
      } else {
        this.hide = false
      }
    }
  }
}

class ModelMeasure extends ModelDimension {
  constructor({ 
    table, name, view, label, is_numeric,
    is_table_calculation, calculation_type, can_pivot, is_turtle = false,
    heading = '', short_name = '', unit = '', value_format = ''
  }) {
    super({ table, name, view, label, is_numeric, value_format, heading, short_name, unit })

    this.type = 'measure'
    this.is_table_calculation = is_table_calculation
    this.calculation_type = calculation_type
    this.can_pivot = can_pivot
    this.is_turtle = is_turtle
    this.align = 'right'

    if (typeof this.table.config['style|' + this.name] !== 'undefined') {
      if (this.table.config['style|' + this.name] === 'hide') {
        this.hide = true
      } else {
        this.hide = false
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
      var formatted_value = this.column.parent.value_format === '' 
                            ? this.series.values[i].toString() 
                            : SSF.format(this.column.parent.value_format, this.series.values[i])
      rendered += formatted_value + ' '
    }
    return rendered
  }
}

class ColumnSeries{
  constructor({ column, is_numeric, series }) {
    this.column = column
    this.is_numeric = is_numeric
    this.series = new Series(series)
  }
}

/**
 * Represents a row in the dataset that populates the table.
 * This may be an addtional row (e.g. subtotal) not in the original query
 * @class
 */
class Row {
  constructor(type) {
    this.id = ''
    this.type = type  // line_item | subtotal | total
    this.sort = []    // [ section, subtotal group, row number ]
    this.data = {}    // Indexed by Column.id
                      // { value: any, rendered: string, html?: string, links?: array }
  }
}

/**
 * Represents a column in the dataset that populates the table.
 * This may be an additional columns (e.g. subtotal, variance) not in the original query
 * 
 * Ensures all key vis properties (e.g. 'label') are consistent across different field types
 * 
 * @class
 */
class Column {
  constructor(id, table, parent) {
    this.id = id
    this.table = table
    this.parent = parent
    this.field = {} // Looker field definition

    this.idx = 0
    this.pos = 0
    this.levels = []
    this.pivot_key = '' 

    this.unit = parent.unit || ''
    this.hide = parent.hide || false
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
    // var defaultParams = {
    //   hasPivots: false,
    //   level: 0,
    // }
    // params = Object.assign(defaultParams, params)

    switch (this.variance_type) {
      case 'absolute':
        var label = 'Var #'
        break;
      case 'percentage':
        var label = 'Var %'
        break;
      default:
        var label = this.table.useShortName ? this.parent.short_name || this.parent.label : this.parent.label
    }

    var key = 'label|' + this.parent.name
    if (typeof this.table.config[key] !== 'undefined' && this.table.config[key] !== this.parent.label) {
      label = this.table.config[key] ? this.table.config[key] : label
    }

    if (this.table.useViewName) { 
      label = [this.parent.view, label].join(' ') 
    }

    if (this.table.has_pivots) { 
      // if (params.withPivots) {
      //   var pivots = this.levels.join(' ')
      //   label = [label, pivots].join(' ') 
      // }
      if (this.table.sortColsBy === 'getSortByPivots') {
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
      if (this.table.useHeadings && level === 0) {
        var key = 'heading|' + this.parent.name
        if (typeof this.table.config[key] !== 'undefined') {
          label = this.table.config[key] ? this.table.config[key] : this.parent.heading
        } else {
          label = this.parent.heading
        }
      } else {
        // label already set
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

/**
 * Represents an "enriched data object" with additional methods and properties for data vis
 * Takes the data, config and queryResponse objects as inputs to the constructor
 */
class LookerDataTable {
  /**
   * Build the LookerData object
   * @constructor
   * 
   * 1. Check for pivots and supermeasures
   * 2. Check for variance calculations
   * 3. Build index column
   * 4.   Index all original columns to preserve order later
   * 5.   Add dimensions, list of ids, list of full objects
   * 6.   Add measures, list of ids, list of full objects
   * 7. Build rows
   * 8. Build totals
   * 9. Build row spans
   * 
   * @param {*} lookerData 
   * @param {*} queryResponse 
   * @param {*} config 
   */
  constructor(lookerData, queryResponse, config) {
    this.config = config

    this.dimensions = []
    this.measures = []
    this.columns = []
    this.data = []

    this.transposed_columns = []
    this.transposed_data = []

    this.pivot_fields = []
    this.pivots = []
    this.pivot_values = []
    this.variances = []
    this.column_series = []

    this.rowspan_values = {}

    this.useIndexColumn = config.indexColumn || false
    this.useHeadings = config.useHeadings || false
    this.useShortName = config.useShortName || false
    this.useViewName = config.useViewName || false
    this.addRowSubtotals = config.rowSubtotals || false
    this.addSubtotalDepth = config.subtotalDepth || this.dimensions.length - 1
    this.spanRows = false || config.spanRows
    this.spanCols = false || config.spanCols
    this.sortColsBy = config.sortColumnsBy || 'getSortByPivots'

    this.has_totals = false
    this.has_subtotals = false
    this.has_row_totals = queryResponse.has_row_totals || false
    this.has_pivots = false
    this.has_supers = false

    this.transposeTable = config.tranposeTable

    var col_idx = 0
    this.checkPivotsAndSupermeasures(queryResponse)
    this.checkVarianceCalculations()
    this.addDimensions(queryResponse, col_idx)
    this.addMeasures(queryResponse, col_idx)
    this.buildIndexColumn(queryResponse)
    this.buildRows(lookerData)
    if (use_column_series) { this.addColumnSeries() }
    this.buildTotals(queryResponse)
    this.updateRowSpanValues()
    if (this.config.rowSubtotals) { this.addSubTotals(config.subtotalDepth) }
    if (this.config.colSubtotals && this.pivot_fields.length == 2) { this.addColumnSubTotals() }
    this.addVarianceColumns()
    // if (use_column_series) { this.addColumnSeries() }    // for new columns
    this.sortColumns()
    this.applyFormatting()
    if (this.transposeTable) { this.transposeColumns() }
    this.validateConfig()
    this.getTableColumnGroups() // during testing only .. this function will be called by vis code

    // TODO: more formatting options
    // addSpacerColumns
    // addUnitHeaders
    // addRowNumbers // to Index Column only?
  }

  static getCoreConfigOptions() {
    return lookerDataTableCoreOptions
  }

  /**
   * Builds new config object based on available dimensions and measures
   * @param {*} table 
   */
  getConfigOptions() {
    var newOptions = lookerDataTableCoreOptions

    for (var i = 0; i < this.dimensions.length; i++) {
      newOptions['label|' + this.dimensions[i].name] = {
        section: 'Dimensions',
        type: 'string',
        label: this.dimensions[i].label,
        default: this.dimensions[i].label,
        order: i * 10 + 1,
      }

      newOptions['heading|' + this.dimensions[i].name] = {
        section: 'Dimensions',
        type: 'string',
        label: 'Heading',
        default: '',
        order: i * 10 + 2,
      }

      newOptions['hide|' + this.dimensions[i].name] = {
        section: 'Dimensions',
        type: 'boolean',
        label: 'Hide',
        display_size: 'third',
        order: i * 10 + 3,
      }
    }

    for (var i = 0; i < this.measures.length; i++) {
      newOptions['label|' + this.measures[i].name] = {
        section: 'Measures',
        type: 'string',
        label: this.measures[i].label_short || this.measures[i].label,
        default: this.measures[i].label_short || this.measures[i].label,
        order: 100 + i * 10 + 1,
      }

      newOptions['heading|' + this.measures[i].name] = {
        section: 'Measures',
        type: 'string',
        label: 'Heading for ' + ( this.measures[i].label_short || this.measures[i].label ),
        default: '',
        order: 100 + i * 10 + 2,
      }

      newOptions['style|' + this.measures[i].name] = {
        section: 'Measures',
        type: 'string',
        label: 'Style',
        display: 'select',
        values: [
          {'Normal': 'normal'},
          {'Black/Red': 'black_red'},
          {'Hide': 'hide'}
        ],
        order: 100 + i * 10 + 3
      }

      var comparisonOptions = []
      
      if (this.measures[i].can_pivot) {
        var pivotComparisons = []
        for (var p = 0; p < this.pivot_fields.length; p++) {
          if (p === 0 || this.config.colSubtotals ) {
            var option = {}
            option['By ' + this.pivot_fields[p]] = this.pivot_fields[p]
            pivotComparisons.push(option)
          }
        }
        comparisonOptions = comparisonOptions.concat(pivotComparisons)
      }

      // measures, row totals and supermeasures
      for (var j = 0; j < this.measures.length; j++) {
        var includeMeasure = this.measures[i].can_pivot === this.measures[j].can_pivot
                              || 
                            this.has_row_totals && !this.measures[j].is_table_calculation         
        if (i != j && includeMeasure) {
          var option = {}
          option['vs. ' + this.measures[j].label] = this.measures[j].name
          comparisonOptions.push(option)
        }
      }
      comparisonOptions.unshift({ '(none)': 'no_variance'})

      newOptions['comparison|' + this.measures[i].name] = {
        section: 'Measures',
        type: 'string',
        label: 'Comparison',
        display: 'select',
        values: comparisonOptions,
        order: 100 + i * 10 + 5
      }

      newOptions['switch|' + this.measures[i].name] = {
        section: 'Measures',
        type: 'boolean',
        label: 'Switch',
        display_size: 'third',
        order: 100 + i * 10 + 6,
      }

      newOptions['var_num|' + this.measures[i].name] = {
        section: 'Measures',
        type: 'boolean',
        label: 'Var #',
        display_size: 'third',
        order: 100 + i * 10 + 7,
      }

      newOptions['var_pct|' + this.measures[i].name] = {
        section: 'Measures',
        type: 'boolean',
        label: 'Var %',
        display_size: 'third',
        order: 100 + i * 10 + 8,
      }
    }
    return newOptions
  }

  checkPivotsAndSupermeasures(queryResponse) {
    for (var p = 0; p < queryResponse.fields.pivots.length; p++) { 
      var name = queryResponse.fields.pivots[p].name
      this.pivot_fields.push(name) 
      this.pivots.push(queryResponse.fields.pivots[p])
    }

    if (typeof queryResponse.pivots !== 'undefined') {
      this.pivot_values = queryResponse.pivots
      this.has_pivots = true
    }

    if (typeof queryResponse.fields.supermeasure_like !== 'undefined') {
      this.has_supers = true
    }
  }

  checkVarianceCalculations() {
    var config = this.config
    Object.keys(config).forEach(option => {
      if (option.startsWith('comparison')) {
        var baseline = option.split('|')[1]

        if (this.pivot_fields.includes(config[option])) {
          var type = 'by_pivot'
        } else {
          var type = 'vs_measure'
        }

        if (typeof config['switch|' + baseline] !== 'undefined') {
          if (config['switch|' + baseline]) {
            var reverse = true
          } else {
            var reverse = false
          }
        }

        this.variances.push({
          baseline: baseline,
          comparison: config[option],
          type: type,
          reverse: reverse
        })
      }
    })
  }

  applyVisToolsTags(lookmlField, visModelField) {
    if (typeof lookmlField.tags !== 'undefined') {
      for (var t = 0; t < lookmlField.tags.length; t++) {
        var tags = lookmlField.tags[t].split(':')
        if (tags[0] === 'vis-tools') {
          if (tags[1] === 'heading') {
            visModelField.heading = tags[2]
          } else if (tags[1] === 'short_name') {
            visModelField.short_name = tags[2]
          } else if (tags[1] === 'unit') {
            visModelField.unit = tags[2]
          }
        }
      }
    }
  }

  addDimensions(queryResponse, col_idx) {
    for (var d = 0; d < queryResponse.fields.dimension_like.length; d++) {
      var dim = new ModelDimension({
        table: this,
        name: queryResponse.fields.dimension_like[d].name,
        type: 'dimension',
        view: queryResponse.fields.dimension_like[d].view_label || '',
        label: queryResponse.fields.dimension_like[d].label_short || queryResponse.fields.dimension_like[d].label,
        is_numeric: queryResponse.fields.dimension_like[d].is_numeric,
      })
      this.applyVisToolsTags(queryResponse.fields.dimension_like[d], dim)
      this.dimensions.push(dim)

      var column = new Column(dim.name, this, dim) 
      column.idx = col_idx
      column.levels = newArray(queryResponse.fields.pivots.length, '')
      column.field = queryResponse.fields.dimension_like[d]
      column.pivoted = false
      column.super = false
      column.sort_by_measure_values = [0, col_idx, ...newArray(this.pivot_fields.length, 0)]
      column.sort_by_pivot_values = [0, ...newArray(this.pivot_fields.length, 0), col_idx]

      // TODO: Fix issue with new constructor pattern breaking hide
      if (typeof this.config['style|' + dim.name] !== 'undefined') {
        if (this.config['style|' + dim.name] === 'hide') {
          this.hide = true
        } else {
          this.hide = false
        }
      }

      this.columns.push(column)
      col_idx += 10
    }
  }

  addMeasures(queryResponse, col_idx) {
    var config = this.config
    // add measures, list of ids
    for (var m = 0; m < queryResponse.fields.measure_like.length; m++) {
      var newMeasure = new ModelMeasure({
        table: this,
        name: queryResponse.fields.measure_like[m].name,
        view: queryResponse.fields.measure_like[m].view_label || '',
        label: queryResponse.fields.measure_like[m].label_short || queryResponse.fields.measure_like[m].label,
        is_numeric: queryResponse.fields.measure_like[m].is_numeric,
        value_format: queryResponse.fields.measure_like[m].value_format || '',
        is_table_calculation: typeof queryResponse.fields.measure_like[m].is_table_calculation !== 'undefined',
        can_pivot: true,
        is_turtle: queryResponse.fields.measure_like[m].is_turtle,
        calculation_type: queryResponse.fields.measure_like[m].type,
      })

      this.applyVisToolsTags(queryResponse.fields.measure_like[m], newMeasure)
      this.measures.push(newMeasure) 
    }
    
    // add measures, list of full objects
    if (this.has_pivots) {
      for (var p = 0; p < this.pivot_values.length; p++) {
        for (var m = 0; m < this.measures.length; m++) {
          var include_measure = (                                     // for pivoted measures, skip table calcs for row totals
            this.pivot_values[p]['key'] != '$$$_row_total_$$$'        // if user wants a row total for table calc, must define separately
          ) || (
            this.pivot_values[p]['key'] == '$$$_row_total_$$$' 
            && this.measures[m].is_table_calculation == false
          )

          if (include_measure) {
            var pivotKey = this.pivot_values[p]['key']
            var measureName = this.measures[m].name
            var columnId = pivotKey + '.' + measureName

            var levels = [] // will contain a list of all the pivot values for this column
            var level_sort_values = []
            for (var pf = 0; pf < queryResponse.fields.pivots.length; pf++) { 
              var pf_name = queryResponse.fields.pivots[pf].name
              levels.push(this.pivot_values[p]['data'][pf_name])
              level_sort_values.push(this.pivot_values[p]['sort_values'][pf_name]) 
            }

            var parent = this.measures[m]
            var column = new Column(columnId, this, parent)
            column.idx = col_idx
            column.levels = levels
            column.field = queryResponse.fields.measure_like[m]
            column.pivoted = true
            column.super = false
            column.pivot_key = pivotKey

            if (this.pivot_values[p]['key'] !== '$$$_row_total_$$$') {
              column.sort_by_measure_values = [1, m, ...level_sort_values]
              column.sort_by_pivot_values = [1, ...level_sort_values, col_idx]
            } else {
              column.sort_by_measure_values = [2, m, ...newArray(this.pivot_fields.length, 0)]
              column.sort_by_pivot_values = [2, ...newArray(this.pivot_fields.length, 0), col_idx]
            }

            this.columns.push(column)
            col_idx += 10
          }
        }
      }
    } else {
      // noticeably simpler for flat tables!
      for (var m = 0; m < this.measures.length; m++) {
        var column = new Column(this.measures[m].name, this, this.measures[m])
        column.idx = col_idx
        try {
          if (typeof config.columnOrder[column.id] !== 'undefined') {
            column.pos = config.columnOrder[column.id]
          } else {
            column.pos = col_idx
          }
        }
        catch {
          column.pos = col_idx
        }
        column.field = queryResponse.fields.measure_like[m]
        column.pivoted = false
        column.super = false
        column.sort_by_measure_values = [1, column.pos]
        column.sort_by_pivot_values = [1, column.pos]
        this.columns.push(column)

        col_idx += 10
      }
    }
    
    // add supermeasures, if present
    if (typeof queryResponse.fields.supermeasure_like !== 'undefined') {
      for (var s = 0; s < queryResponse.fields.supermeasure_like.length; s++) {
        var meas = new ModelMeasure({
          table: this,
          name: queryResponse.fields.supermeasure_like[s].name,
          view: '',
          label: queryResponse.fields.supermeasure_like[s].label,
          is_numeric: queryResponse.fields.supermeasure_like[s].is_numeric,
          value_format: queryResponse.fields.supermeasure_like[s].value_format,
          is_table_calculation: queryResponse.fields.supermeasure_like[s].is_table_calculation,
          calculation_type: queryResponse.fields.supermeasure_like[s].type,
          can_pivot: false,
        })
        this.applyVisToolsTags(queryResponse.fields.supermeasure_like[s], meas)
        this.measures.push(meas) 

        var column = new Column(meas.name, this, meas)
        column.idx = col_idx
        column.levels = newArray(queryResponse.fields.pivots.length, '')
        column.field = queryResponse.fields.supermeasure_like[s]
        column.pivoted = false
        column.super = true
        column.sort_by_measure_values = [2, col_idx, ...newArray(this.pivot_fields.length, 1)]
        column.sort_by_pivot_values = [2, ...newArray(this.pivot_fields.length, 1), col_idx]

        this.columns.push(column)
        col_idx += 10
      }
    }
  }

  buildIndexColumn(queryResponse) {
    var index_column = new Column('$$$_index_$$$', this, this.dimensions[this.dimensions.length - 1])

    index_column.levels = newArray(queryResponse.fields.pivots.length, '')
    index_column.sort_by_measure_values = [-1, 0, ...newArray(this.pivot_fields.length, 0)]
    index_column.sort_by_pivot_values = [-1, ...newArray(this.pivot_fields.length, 0), 0]
    
    this.columns.push(index_column)
  }

  buildRows(lookerData) {
    for (var i = 0; i < lookerData.length; i++) {
      var row = new Row('line_item') // TODO: consider creating the row object once all required field values identified
      
      // flatten data, if pivoted. Looker's data structure is nested for pivots (to a single level, no matter how many pivots)
      for (var c = 0; c < this.columns.length; c++) {
        var column = this.columns[c]
        
        if (column.pivoted) {
          row.data[column.id] = lookerData[i][column.parent.name][column.pivot_key]
        } else {
          row.data[column.id] = lookerData[i][column.id]
        }

        if (typeof row.data[column.id] !== 'undefined') {
          if (typeof row.data[column.id].cell_style === 'undefined') {
            row.data[column.id].cell_style = []
          }
          if (row.data[column.id].value === null) {
            row.data[column.id].rendered = ''
          }
          if (column.parent.is_turtle) {
            var cell_series = new CellSeries({
              column: column,
              row: row,
              sort_value: row.data[column.id].sort_value,
              series: {
                keys: row.data[column.id]._parsed.keys,
                values: row.data[column.id]._parsed.values
              }
            })
            row.data[column.id].value = cell_series
            row.data[column.id].rendered = cell_series.to_string()
          }
        }
      }

      // set a unique id for the row
      var all_dims = []
      for (var d = 0; d < this.dimensions.length; d++) {
        all_dims.push(lookerData[i][this.dimensions[d].name].value)
      }
      row.id = all_dims.join('|')

      // set an index value (note: this is an index purely for display purposes; row.id remains the unique reference value)
      var last_dim = this.dimensions[this.dimensions.length - 1].name
      var last_dim_value = lookerData[i][last_dim].value
      row.data['$$$_index_$$$'] = { 'value': last_dim_value, 'cell_style': ['indent'] }

      row.sort = [0, 0, i]
      this.data.push(row)
    }
  }

  /**
   * Applies conditional formatting (red if negative) to all measure columns set to use it 
   */
  applyFormatting() {
    var config = this.config
    for (var c = 0; c < this.columns.length; c++) {
      var col = this.columns[c]
      if (typeof config['style|' + col.id] !== 'undefined') {
        if (config['style|' + col.id] == 'black_red') {
          for (var r = 0; r < this.data.length; r++) {
            var row = this.data[r]
            if (row.data[col.id].value < 0) {
              row.data[col.id].cell_style.push('red')
            }
          }
        }
      }
    }
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

  getMeasureByName (name) {
    var measure = {}
    this.measures.forEach(m => {
      if (name === m.name) { 
        measure = m 
      }
    })
    return measure
  }

  /**
   * Performs vertical cell merge, by calculating required rowspan values
   * Works backwards through the data rows.
   */
  updateRowSpanValues () {
    var span_tracker = {}
    for (d = 0; d < this.dimensions.length; d++) {
      span_tracker[this.dimensions[d].name] = 1
    }

    // loop backwards through data rows
    for (var r = this.data.length-1; r >= 0 ; r--) {
      var row = this.data[r]

      // full reset and continue for totals
      if (row.type !== 'line_item' ) {
        for (d = 0; d < this.dimensions.length; d++) {
          span_tracker[this.dimensions[d].name] = 1
        }
        continue;
      }

      // loop fowards through the dimensions
      this.rowspan_values[row.id] = {}
      for (var d = 0; d < this.dimensions.length; d++) {
        var dim = this.dimensions[d].name
        var this_cell_value = this.data[r].data[dim].value
        if (r > 0) {
          var cell_above_value = this.data[r-1].data[dim].value
        }

        // increment the span_tracker if dimensions match
        if (r > 0 && this_cell_value == cell_above_value) {
          this.rowspan_values[row.id][this.dimensions[d].name] = -1;
          span_tracker[dim] += 1;
        } else {
        // partial reset and continue if dimensions different
          for (var d_ = d; d_ < this.dimensions.length; d_++) {
            var dim_ = this.dimensions[d_].name
            this.rowspan_values[row.id][dim_] = span_tracker[dim_];
            span_tracker[dim_] = 1
          }
          break;
        }
      }
    }
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
    var compareRowSortValues = (a, b) => {
      var depth = a.sort.length
      for(var i=0; i<depth; i++) {
          if (a.sort[i] > b.sort[i]) { return 1 }
          if (a.sort[i] < b.sort[i]) { return -1 }
      }
      return -1
    }
    this.data.sort(compareRowSortValues)
    this.updateRowSpanValues()
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
    var compareColSortValues = (a, b) => {
      var param = this.sortColsBy
      var depth = a[param]().length
      for(var i=0; i<depth; i++) {
          if (a[param]()[i] > b[param]()[i]) { return 1 }
          if (a[param]()[i] < b[param]()[i]) { return -1 }
      }
      return -1
    }
    this.columns.sort(compareColSortValues)
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
    for (var r = 0; r < this.data.length; r++) {    
      var row = this.data[r]
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
        row.sort = [0, subTotalGroups.length-1, r]
      }
    }

    var firstVisibleDimension = this.dimensions[0].name
    for (var d = 0; d < this.dimensions.length; d++) {
      if (!this.dimensions[d].hide) {
        firstVisibleDimension = this.dimensions[d].name
        break
      }
    }

    // GENERATE DATA ROWS FOR SUBTOTALS
    for (var s = 0; s < subTotalGroups.length; s++) {
      var subtotal = new Row('subtotal')
      subtotal.id = 'Subtotal|' + subTotalGroups[s].join('|')

      for (var d = 0; d < this.columns.length; d++) {
        var column = this.columns[d]
        subtotal.data[column.id] = { 'cell_style': ['total'] } // set default

        if (column.id === '$$$_index_$$$' || column.id === firstVisibleDimension ) {
          var subtotal_label = subTotalGroups[s].join(' | ')
          subtotal.data[column.id].value = subtotal_label
        } 

        if (column.parent.type == 'measure') {
          if (column.pivoted) {
            var cellKey = [column.pivot_key, column.parent.name].join('.') 
          } else {
            var cellKey = column.id
          }

          var subtotal_value = 0
          var subtotal_items = 0
          var rendered = ''
          for (var mr = 0; mr < this.data.length; mr++) {
            var data_row = this.data[mr]
            if (data_row.type == 'line_item' && data_row.sort[1] == s) { // data_row.sort[1] == s checks whether its part of the subtotal group
              var value = data_row.data[cellKey].value
              if (Number.isFinite(value)) {
                subtotal_value += value
                subtotal_items++
              }
            } 
          }
          
          if (column.parent.calculation_type === 'average' && subtotal_items > 0) {
            subtotal_value = subtotal_value / subtotal_items
          }
          if (subtotal_value) {
            rendered = column.parent.value_format === '' ? subtotal_value.toString() : SSF.format(column.parent.value_format, subtotal_value)
          }
          if (column.parent.calculation_type === 'string') {
            subtotal_value = ''
            rendered = ''
          } 

          var cellValue = {
            value: subtotal_value,
            rendered: rendered,
            cell_style: ['total']
          }
          subtotal.data[cellKey] = cellValue
        }
      }
      subtotal.sort = [0, s, 9999]
      this.data.push(subtotal)
    }
    this.sortData()
    this.has_subtotals = true
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
    var last_pivot_key = ''
    var last_pivot_col = {}
    var subtotals = []

    var pivots = []
    var pivot_dimension = this.pivot_fields[0]
    for (var p = 0; p < this.pivot_values.length; p++) {
      var p_value = this.pivot_values[p]['data'][pivot_dimension]
      if (p_value !== null) { pivots.push(p_value) }
    }
    pivots = [...new Set(pivots)]

    // DERIVE THE NEW COLUMN DEFINITIONS
    for (var p = 0; p < pivots.length; p++) {
      var pivot = pivots[p]
      var highest_pivot_col = [0, '']
      var previous_subtotal = null

      for (var m = 0; m < this.measures.length; m++) {
        if (this.measures[m].can_pivot) {
          var measure = this.measures[m].name
          var subtotal_col = {
            parent: this.measures[m],
            field: measure,
            pivot: pivot,
            measure_idx: m,
            pivot_idx: p,
            columns: [],
            id: ['$$$_subtotal_$$$', pivot, measure].join('.'),
            after: ''
          }
  
          for (var c = 0; c < this.columns.length; c++) {
            var column = this.columns[c]
  
            if (column.pivoted && column.levels[0] == pivot) {
              if (column.parent.name == measure) {
                subtotal_col.columns.push(column.id)
              }
              if (column.levels[0] == pivot) {
                if (c > highest_pivot_col[0]) {
                  highest_pivot_col = [c, column.id]
                }
              }
            }
          }
  
          if (pivot != last_pivot_key) {
            last_pivot_col[pivot] = highest_pivot_col[1]
            previous_subtotal = null
          }
  
          subtotal_col.after = previous_subtotal || last_pivot_col[pivot]
          last_pivot_key = pivot
          previous_subtotal = subtotal_col.id
          subtotals.push(subtotal_col)
        }
      }
    }

    // USE THE NEW DEFINITIONS TO ADD SUBTOTAL COLUMNS TO TABLE.COLUMNS
    for (var s = 0; s < subtotals.length; s++) {
      var subtotal = subtotals[s]
      var parent = this.measures[subtotal.measure_idx]
      var column = new Column(subtotal.id, this, parent)

      column.levels = [subtotal.pivot, 'Subtotal']
      column.field = { name: subtotal.field }
      column.sort_by_measure_values = [1, subtotal.measure_idx, ...column.levels]

      var pivot_values = [...column.levels]
      if (typeof pivot_values[pivot_values.length-1] == 'string') {
        pivot_values[pivot_values.length-1] = 'ZZZZ'
      } else {
        pivot_values[pivot_values.length-1] = 9999
      }
      column.sort_by_pivot_values = [1, ...pivot_values, 10000 + s]
      column.pivoted = true
      column.subtotal = true
      column.pivot_key = [subtotal.pivot, '$$$_subtotal_$$$'].join('|')
      this.columns.push(column)
    }
    this.sortColumns()

    // CALCULATE COLUMN SUB TOTAL VALUES
    for  (var r = 0; r < this.data.length; r++) {
      var row = this.data[r]
      for (var s = 0; s < subtotals.length; s++) {
        var subtotal = subtotals[s]
        var subtotal_value = 0
        for (var f = 0; f < subtotal.columns.length; f++) {
          var field = subtotal.columns[f]
          subtotal_value += row.data[field].value
        }
        row.data[subtotal.id] = {
          value: subtotal_value,
          rendered: column.value_format === '' ? subtotal_value.toString() : SSF.format(column.parent.value_format, subtotal_value),
          align: 'right'
        }
        if (['total', 'subtotal'].includes(row.type)) { row.data[subtotal.id].cell_style = ['total'] }
      }
    }

    return subtotals
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
    for  (var r = 0; r < this.data.length; r++) {
      var row = this.data[r]
      var baseline_value = row.data[baseline.id].value
      var comparison_value = row.data[comparison.id].value
      if (calc === 'absolute') {
        var cell_value = {
          value: baseline_value - comparison_value,
          rendered: value_format === '' ? (baseline_value - comparison_value).toString() : SSF.format(value_format, (baseline_value - comparison_value)),
          cell_style: []
        }
      } else {
        var value = (baseline_value - comparison_value) / Math.abs(comparison_value)
        if (!isFinite(value)) {
          var cell_value = {
            value: null,
            rendered: '∞',
            cell_style: []
          }
        } else {
          var cell_value = {
            value: value,
            rendered: SSF.format('#0.00%', value),
            cell_style: []
          }
        }
      }
      if (row.type == 'total' || row.type == 'subtotal') {
        cell_value.cell_style.push('total')
      }
      if (cell_value.value < 0) {
        cell_value.cell_style.push('red')
      }
      row.data[id] = cell_value
    }
  }

  createVarianceColumn (colpair) {
    var config = this.config
    if (!this.colSubtotals && colpair.variance.baseline.startsWith('$$$_subtotal_$$$')) {
      console.log('Cannot calculate variance of column subtotals if subtotals disabled.')
      return
    }
    var id = ['$$$_variance_$$$', colpair.calc, colpair.variance.baseline, colpair.variance.comparison].join('|')
    var baseline = this.getColumnById(colpair.variance.baseline)
    var comparison = this.getColumnById(colpair.variance.comparison)
    var column = new Column(id, this, baseline.parent)

    if (colpair.calc === 'absolute') {
      column.variance_type = 'absolute'
      column.idx = baseline.idx + 1
      column.pos = baseline.pos + 1
      column.sort_by_measure_values = baseline.sort_by_measure_values.concat(1)
      column.sort_by_pivot_values = baseline.sort_by_pivot_values.concat(1)
      column.hide = !config['var_num|' + baseline.parent.name]
    } else {
      column.variance_type = 'percentage'
      column.idx = baseline.idx + 2
      column.pos = baseline.pos + 2
      column.sort_by_measure_values = baseline.sort_by_measure_values.concat(2)
      column.sort_by_pivot_values = baseline.sort_by_pivot_values.concat(2)
      column.unit = '%'
      column.hide = !config['var_pct|' + baseline.parent.name]
    }

    // TODO: Review sort values / algorithms
    if (baseline.sort_by_measure_values.length < column.sort_by_measure_values.length) {
      baseline.sort_by_measure_values.push(0)
    }
    if (baseline.sort_by_pivot_values.length < column.sort_by_pivot_values.length) {
      baseline.sort_by_pivot_values.push(0)
    }

    if (typeof config.columnOrder[column.id] !== 'undefined') {
      column.pos = config.columnOrder[column.id]
    } 

    column.field = {
      name: id
    }
    column.pivoted = baseline.pivoted
    column.super = baseline.super
    column.pivot_key = ''

    column.levels = baseline.levels
    if (config.groupVarianceColumns) {
      if (config.sortColumnsBy === 'getSortByPivots') {
        column.sort_by_pivot_values[0] = 1.5
      }
      if (baseline.levels.length === 1) {
        column.levels = ['Variance']
      } else {
        column.levels = ['Variance', baseline.levels[1]]
      }
    }

    this.columns.push(column)
    if (colpair.variance.reverse) {
      this.calculateVariance(baseline.parent.value_format, id, colpair.calc, comparison, baseline)
    } else {
      this.calculateVariance(baseline.parent.value_format, id, colpair.calc, baseline, comparison)
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
          if (!this.has_pivots) {
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
          if (this.pivot_fields.length === 1 || this.pivot_fields[1] === variance.comparison) {
            this.pivot_values.slice(1).forEach((pivot_value, index) => {
              calcs.forEach(calc => {
                if (!pivot_value.is_total) {
                  variance_colpairs.push({
                    calc: calc,
                    variance: {
                      baseline: [pivot_value.key, variance.baseline].join('.'),
                      comparison: [this.pivot_values[index].key, variance.baseline].join('.'),
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
                var value = pivot_value.data[this.pivot_fields[0]]
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

      var new_series = new ColumnSeries({
        column: column,
        is_numeric: column.parent.is_numeric,
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
    if (typeof queryResponse.totals_data !== 'undefined') {
      if (typeof queryResponse.truncated !== 'undefined') {
        var calculate_others = true
      } else {
        var calculate_others = false
      }

      var totals_ = queryResponse.totals_data

      var firstVisibleDimension = this.dimensions[0].name
      for (var d = 0; d < this.dimensions.length; d++) {
        if (!this.dimensions[d].hide) {
          firstVisibleDimension = this.dimensions[d].name
          break
        }
      }

      var totals_row = new Row('total')
      var others_row = new Row('line_item')

      for (var c = 0; c < this.columns.length; c++) {
        var column = this.columns[c]
        var other_value = null
        totals_row.id = 'Total'
        others_row.id = 'Others'
        totals_row.data[column.id] = { value: '', cell_style: ['total'] } // set a default on all columns
        others_row.data[column.id] = { value: '', cell_style: [] } // set a default on all columns
        
        if (column.parent.type == 'measure') {
          if (column.pivoted == true) {
            var cellValue = totals_[column.parent.name][column.pivot_key]       
          } else {
            var cellValue = totals_[column.id]  
          }
          if (typeof cellValue.rendered == 'undefined' && typeof cellValue.html !== 'undefined' ){ // totals data may include html but not rendered value
            cellValue.rendered = this.getRenderedFromHtml(cellValue)
          }
          if (calculate_others) {
            if (['sum', 'count_distinct', 'count'].includes(column.parent.calculation_type)) {
              other_value = cellValue.value - column.series.series.sum
            } else if (column.parent.calculation_type === 'average') {
              other_value = (cellValue.value + column.series.series.avg) / 2
            }  
          }
          cellValue.cell_style = ['total']
          totals_row.data[column.id] = cellValue

          if (calculate_others && other_value) {
            var formatted_value = column.parent.value_format === '' 
                  ? other_value.toString() 
                  : SSF.format(column.parent.value_format, other_value)
                  others_row.data[column.id] = { value: other_value, rendered: formatted_value } 
          }
                    
        }
      } 
      totals_row.data['$$$_index_$$$'].value = 'TOTAL'
      totals_row.data[firstVisibleDimension].value = 'TOTAL' 
      totals_row.sort = [1, 0, 0]

      if (calculate_others) {
        others_row.data['$$$_index_$$$'].value = 'Others'
        others_row.data[firstVisibleDimension].value = 'Others'
        others_row.sort = [1, -1, -1] 
      }
      
      this.data.push(totals_row)
      calculate_others && this.data.push(others_row)

      this.has_totals = true
      this.sortData()
    }
  }

  /**
   * Extracts the formatted value of the field from the html: value
   * There are cases (totals data) where the formatted value isn't available as usual rendered_value
   * @param {*} cellValue 
   */
  getRenderedFromHtml (cellValue) {
    var parser = new DOMParser()
    if (cellValue.html !== '') {
      try {
        var rendered = parser.parseFromString(cellValue.html, 'text/html')
        rendered = rendered.getElementsByTagName('a')[0].innerText
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
   * For rendering a transposed table i.e. with the list of measures on the left hand side
   * 1. If used, add the 'header' column
   * 2. Depending on column sort order, add pivot fields then a measure column (or vice versa) 
   * 3. Add a transposed column for every data row
   */
  transposeColumns () {
    this.transposed_columns = []
    var default_colspan = newArray(this.dimensions.length, 1)
    var index_parent = {
      align: 'left',
      type: 'transposed_table_index',
      is_table_calculation: false
    }
    var measure_parent = {
      align: 'right',
      type: 'transposed_table_measure',
      is_table_calculation: false
    }

    if (this.useHeadings && !this.has_pivots) {
      this.transposed_columns.push({
        id: 'header',
        getLabel: (i) => i === 0 ? 'Header' : '',
        colspans: default_colspan,
        parent: index_parent,
        type: 'measure',
        is_table_calculation: false
      })
    }

    if (this.sortColsBy === 'getSortByPivots') {
      console.log('pivot fields first')
      this.pivots.forEach(pivot => {
        this.transposed_columns.push({
          id: pivot.name,
          colspans: default_colspan,
          parent: index_parent,
          getLabel: (i) => i === 0 ? pivot.label_short : '',
          type: 'dimension',
          align: 'left',
          is_table_calculation: false
        })
      })
      this.transposed_columns.push({
        id: 'measure',
        colspans: default_colspan,
        parent: index_parent,
        getLabel: (i) => i === 0 ? 'Measure' : '',
        type: 'measure',
        align: 'left',
        is_table_calculation: false
      })
    } else {
      console.log('measure names first')
      this.transposed_columns.push({
        id: 'measure',
        colspans: default_colspan,
        parent: index_parent,
        getLabel: (i) => i === 0 ? 'Measure' : '',
        type: 'measure',
        align: 'left',
        is_table_calculation: false
      })
      this.pivots.forEach(pivot => {
        this.transposed_columns.push({
          id: pivot.name,
          colspans: default_colspan,
          parent: index_parent,
          getLabel: (i) => i === 0 ? pivot.label_short : '',
          type: 'dimension',
          align: 'left',
          is_table_calculation: false
        })
      })
    }
    
    for (var h = 0; h < this.data.length; h++) {
      var sourceRow = this.data[h]
      if (sourceRow.type === 'line_item') {
        var colspan = []
        var labels = []
        this.dimensions.forEach(dim => {
          colspan.push(this.rowspan_values[sourceRow.id][dim.name])
          labels.push(sourceRow.data[dim.name].value)
        })
      } else if (sourceRow.type === 'subtotal') {
        var colspan = default_colspan
        var labels = ['Subtotal'].concat(newArray(this.dimensions.length-1, ''))
      } else if (sourceRow.type === 'total') {
        var colspan = default_colspan
        var labels = ['TOTAL'].concat(newArray(this.dimensions.length-1, ''))
      }

      this.transposed_columns.push({
        id: sourceRow.id,
        colspans: colspan,
        parent: measure_parent,
        labels: labels,
        align: 'right',
        is_table_calculation: false
      })
    }
    console.log('transposed columns', this.transposed_columns)
  }

  /**
   * Used to support rendering of table as vis. 
   * Returns an array of 0s, of length to match the required number of header rows
   */
  getLevels () {
    if (!this.transposeTable) {
      var num_levels =  this.pivot_fields.length + 1
      if (this.useHeadings && !this.has_pivots) { num_levels++ }      
      return newArray(num_levels, 0)
    } else {
      return this.dimensions
    }
  }

  /**
   * Performs horizontal cell merge of header values by calculating required colspan values
   * @param {*} columns 
   */
  setColSpans (columns) {
    var config = this.config
    var header_levels = []
    var span_values = []
    var span_tracker = []
    
    // init header_levels and span_values arrays
    for (var c = columns.length-1; c >= 0; c--) {
      var idx = columns.length - 1 - c

      if (this.sortColsBy === 'getSortByPivots') {
        header_levels[idx] = [...columns[c].levels, columns[c].field.name]
      } else {
        header_levels[idx] = [columns[c].field.name, ...columns[c].levels]
      }

      if (this.useHeadings && !this.has_pivots) {
        var column_heading = columns[c].parent.heading
        var key = 'heading|' + columns[c].parent.name
        if (typeof config[key] !== 'undefined') {
          column_heading = config[key] ? config[key] : column_heading
        } 
        header_levels[idx].unshift(column_heading)
      }

      span_values[c] = newArray(header_levels[idx].length, 1)
    }

    if (this.spanCols) {
      span_tracker = newArray(header_levels[0].length, 1)

      // FIRST PASS: loop through the pivot headers
      for (var h = 0; h < header_levels.length; h++) {
        var header = header_levels[h]
        
        // loop through the levels for the pivot headers
        var start = 0
        var end = header.length - 1

        for (var l = start; l < end; l++) {
          var this_value = header_levels[h][l]
          if (h < header_levels.length-1) {
            var above_value = header_levels[h+1][l]
          }

          // increment the tracker if values match
          if (h < header_levels.length-1 && this_value == above_value) {
            span_values[h][l] = -1;
            span_tracker[l] += 1;
          } else {
          // partial reset if the value differs
            for (var l_ = l; l_ < end; l_++) {
              span_values[h][l_] = span_tracker[l_];
              span_tracker[l_] = 1
            }
            break;
          }
        }
      }

      if (this.sortColsBy === 'getSortByPivots') {
        var label_level = this.pivot_fields.length + 1
      } else {
        var label_level = 0
      }

      // SECOND PASS: loop backwards through the levels for the column labels
      for (var h = header_levels.length-1; h >= 0; h--) {
        var this_value = header_levels[h][label_level]
        if (h > 0) {
          var next_value =header_levels[h-1][label_level] 
        }
        // increment the span_tracker if dimensions match
        if (h > 0 && this_value == next_value) {
          span_values[h][label_level] = -1;
          span_tracker[label_level] += 1;
        } else {
        // partial reset and continue if dimensions different
          span_values[h][label_level] = span_tracker[label_level];
          span_tracker[label_level] = 1
        }
      }

      span_values.reverse()
    }

    for (var c = 0; c < columns.length; c++) {
      columns[c].colspans = span_values[c]
    }
    return columns
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
    var index_columns = []
    var measure_columns = []
    var total_columns = []

    if (!this.transposeTable) {
      this.columns.forEach(column => {
        if (column.parent.type === 'dimension' && !this.useIndexColumn && column.id !== '$$$_index_$$$' && !column.hide) {
          index_columns.push({ id: column.id })
        } else if (column.parent.type === 'dimension' && this.useIndexColumn && column.id === '$$$_index_$$$') {
          index_columns.push({ id: column.id })
        } else if (column.parent.type === 'measure' && !column.super && !column.hide) {
          measure_columns.push({ id: column.id })
        } else if (column.parent.type === 'measure' && column.super && !column.hide) {
          total_columns.push({ id: column.id })
        }
      })
    } else {
      this.transposed_columns.forEach(column => {
        if (column.parent.type === 'transposed_table_index') {
          index_columns.push({ id: column.id})
        } else if (column.parent.type === 'transposed_table_measure' && column.id !== 'Total') {
          measure_columns.push({ id: column.id })
        } else if (column.parent.type === 'transposed_table_measure' && column.id === 'Total') {
          total_columns.push({ id: column.id })
        }
      })
    }

    console.log('Column Groups', [index_columns, measure_columns, total_columns])
  }

  /**
   * Used to support rendering of data table as vis. 
   * Builds list of columns out of data set that should be displayed
   * @param {*} i 
   */
  getTableHeaders (i) {
    if (!this.transposeTable) {
      if (this.useIndexColumn) {
        var columns = this.columns.filter(c => c.parent.type == 'measure' || c.id == '$$$_index_$$$').filter(c => !c.hide)
      } else {
        var columns =  this.columns.filter(c => c.id !== '$$$_index_$$$').filter(c => !c.hide)
      }

      columns = this.setColSpans(columns).filter(c => c.colspans[i] > 0)

      return columns

    } else {
      // return this.transposed_columns
      return this.transposed_columns.filter(c => c.colspans[i] > 0)
    }

  }

  getDataRows () {
    if (!this.transposeTable) {
      return this.data
    } else {
      this.columns.filter(c => c.parent.type === 'measure').forEach(column => {
        var transposed_data = {}
        this.data.forEach(row => {
          if (typeof row.data[column.id] !== 'undefined') {
            transposed_data[row.id] = row.data[column.id]
            transposed_data[row.id]['align'] = 'right'
            transposed_data[row.id]['cell_style'].push('transposed')
          } else {
            console.log('row data does not exist for', column.id)
          }
        })
        transposed_data.header = {value: 'Header TBD'}
        if (this.sortColsBy === 'getSortByPivots') {
          var measure_label = column.getLabel(this.pivots.length)
        } else {
          var measure_label = column.getLabel(0)
        }
        transposed_data.measure = { value: measure_label }
        this.pivot_fields.forEach((pivot_field, idx) => {
          transposed_data[pivot_field] = { value: column.levels[idx] }
        })
        var transposed_row = {
          id: column.id,
          hide: column.hide,
          data: transposed_data
        }

        this.transposed_data.push(transposed_row)
      })
      console.log('transposed rows', this.transposed_data)

      return this.transposed_data.filter(row => !row.hide)
    }
  }

  /**
   * Used to support rendering of data table as vis.
   * For a given row of data, returns filtered array of cells – only those cells that are to be displayed.
   * @param {*} row 
   */
  getTableColumns (row) {
    if (!this.transposeTable) {
      // filter out unwanted dimensions based on index_column setting
      if (this.useIndexColumn) {
        var cells = this.columns.filter(c => c.parent.type == 'measure' || c.id == '$$$_index_$$$').filter(c => !c.hide)
      } else {
        var cells =  this.columns.filter(c => c.id !== '$$$_index_$$$').filter(c => !c.hide)
      }
      
      // if we're using all dimensions, and we've got span_rows on, need to update the row
      if (!this.useIndexColumn && this.spanRows) {
      // set row spans, for dimension cells that should appear
        for (var cell = 0; cell < cells.length; cell++) {
          cells[cell].rowspan = 1 // set default
          if (row.type === 'line_item' && this.rowspan_values[row.id][cells[cell].id] > 0) {
            cells[cell].rowspan = this.rowspan_values[row.id][cells[cell].id]
          } 
        }
        // filter out dimension cells that a hidden / merged into a cell above
        if (row.type === 'line_item') {
          cells = cells.filter(c => c.parent.type == 'measure' || this.rowspan_values[row.id][c.id] > 0)
        }
      }
      return cells
    } else {
      return this.transposed_columns
    }
    
  }

  /**
   * Used to support column drag'n'drop when rendering data table as vis.
   * Updates the table.config with the new pos values.
   * Accepts a callback function for interaction with the vis.
   * @param {*} from 
   * @param {*} to 
   * @param {*} callback 
   */
  moveColumns(from, to, callback) {
    var config = this.config
    if (from != to) {
      var shift = to - from
      var col_order = config.columnOrder
      for (var c = 0; c < this.columns.length; c++) {
        var col = this.columns[c]
        if (col.parent.type == 'measure' && !col.super) {
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
      }
      callback(col_order)
    }
  }

  validateConfig() {
    if (!['traditional', 'looker', 'contemporary'].includes(this.config.theme)) {
      this.config.theme = 'traditional'
    }

    if (!['fixed', 'auto'].includes(this.config.layout)) {
      this.config.layout = 'fixed'
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
}

exports.LookerDataTable = LookerDataTable

// MUST
// TODO: Style for transposed totals
// TODO: Investigate replacing all this.pivot_fields references with this.pivots
// TODO: update validateConfig to enforce ALL defaults

// SHOULD
// TODO: Investigate use Row and Column classes for this.transposed_* objects
// TODO: Cell merge in transposed index cells
// TODO: tooltip for data cells
// TODO: tooltip for index cells

// NICE TO HAVE
// TODO: option for reporting in 000s or 000000s
// TODO: option to load in your own css