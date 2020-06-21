import SSF from "ssf"

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
  indexColumn: {
    section: "Dimensions",
    type: "boolean",
    label: "Use Last Field Only",
    default: "false",
    order: 0,
  },
}

class ModelDimension {
  constructor({ table, name, type, view, label, heading = '', short_name = '', unit = '', value_format = ''}) {
    this.table = table
    this.name = name
    this.type = type
    this.view = view
    this.label = label
    this.value_format = value_format
    this.heading = heading
    this.short_name = short_name
    this.unit = unit
    
    if (this.type === 'dimension') {
      this.align = 'left'
    } else {
      this.align = 'right'
    }

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
  constructor(name, type, label, heading, short_name, unit, value_format, align, hide) {
    super(name, type, label, heading, short_name, unit, value_format, align, hide)
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
    this.type = type
    this.sort = [] // [total before|total after, subtotal group, row number]
    this.data = {}
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
    
    this.sort_by_measure_values = [] // [index -1|dimension 0|measure 1|row totals & supermeasures 2, column number, [measure values]  ]
    this.sort_by_pivot_values = []   // [index -1|dimension 0|measure 1|row totals & supermeasures 2, [pivot values], column number    ]
    // this.sort_by_group_values = []  // [index -1|dimension 0| [header values], column number    ]
  }

  /**
   * Returns a header label for a column, to display in table vis
   * @param {*} label_with_view - full field name including label e.g. "Users Name"
   * @param {*} label_with_pivots - adds all pivot values "Total Users Q1 Male"
   */
  getLabel (params) {
    var defaultParams = {
      hasPivots: false,
      level: 0,
    }
    params = Object.assign(defaultParams, params)

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
        if (params.level < this.levels.length) {
          label = this.levels[params.level]
        } else {
          // label already set
        }
      } else { // params.config.sortColumnsBy === 'getSortByMeasures'
        if (params.level >= 1) {
          label = this.levels[params.level - 1]
        } else {
          // label already set
        }
      } 
    } else { // flat table
      if (this.table.useHeadings && params.level === 0) {
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

    this.columns = []
    this.dimensions = []
    this.measures = []
    this.data = []
    this.pivot_fields = []
    this.pivot_values = []

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

    this.variances = []

    var col_idx = 0
    this.checkPivotsAndSupermeasures(queryResponse)
    this.checkVarianceCalculations(config)
    this.addDimensions(config, queryResponse, col_idx)
    this.addMeasures(config, queryResponse, col_idx)
    this.buildIndexColumn(queryResponse)
    this.buildRows(lookerData)
    this.buildTotals(queryResponse)
    console.log('table during construction', this) // REMOVE WHEN FINISHED
    this.updateRowSpanValues()
    if (config.rowSubtotals) {
      this.addSubTotals(config.subtotalDepth)
    }
    if (config.colSubtotals && this.pivot_fields.length == 2) {
      this.addColumnSubTotals()
    }
    this.addVarianceColumns(config)
    this.sortColumns()
    this.applyFormatting(config)

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
      
      // TODO: pivoted measures (i.e. PoP for the same measure)
      //    Assuming it's easier in first version for modelled measures rather than users
      //    knowing the pivot pattern
      //
      // if (this.measures[i].can_pivot) {
      //   var pivotComparisons = []
      //   for (var p = 0; p < this.pivot_fields.length; p++) {
      //     var option = {}
      //     option['By ' + this.pivot_fields[p]] = this.pivot_fields[p]
      //     pivotComparisons.push(option)
      //   }
      //   comparisonOptions = comparisonOptions.concat(pivotComparisons)
      // }

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
    }

    if (typeof queryResponse.pivots !== 'undefined') {
      this.pivot_values = queryResponse.pivots
      this.has_pivots = true
    }

    if (typeof queryResponse.fields.supermeasure_like !== 'undefined') {
      this.has_supers = true
    }
  }

  checkVarianceCalculations(config) {
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

  addDimensions(config, queryResponse, col_idx) {
    for (var d = 0; d < queryResponse.fields.dimension_like.length; d++) {
      var dim = new ModelDimension({
        table: this,
        name: queryResponse.fields.dimension_like[d].name,
        type: 'dimension',
        view: queryResponse.fields.dimension_like[d].view_label || '',
        label: queryResponse.fields.dimension_like[d].label_short || queryResponse.fields.dimension_like[d].label,       
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

  addMeasures(config, queryResponse, col_idx) {
    // add measures, list of ids
    for (var m = 0; m < queryResponse.fields.measure_like.length; m++) {
      var newMeasure = {
        type: 'measure',
        align: 'right',
        name: queryResponse.fields.measure_like[m].name,
        label: queryResponse.fields.measure_like[m].label_short || queryResponse.fields.measure_like[m].label,
        view: queryResponse.fields.measure_like[m].view_label || '',
        is_table_calculation: typeof queryResponse.fields.measure_like[m].is_table_calculation !== 'undefined',
        can_pivot: true,
        calculation_type: queryResponse.fields.measure_like[m].type,
        value_format: queryResponse.fields.measure_like[m].value_format || ''
      }
      if (typeof config['style|' + newMeasure.name] !== 'undefined') {
        if (config['style|' + newMeasure.name] === 'hide') {
          newMeasure.hide = true
        }
      }
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
        var id = queryResponse.fields.supermeasure_like[s].name
        var newSuperMeasure = {
          name: id,
          type: 'measure',
          label: queryResponse.fields.supermeasure_like[s].label,
          view: '',
          heading: '',
          short_name: '',
          unit: '',
          can_pivot: false,
          hide: false
        }
        if (typeof config['style|' + id] !== 'undefined') {
          if (config['style|' + id] === 'hide') {
            newSuperMeasure.hide = true
          }
        }
        this.applyVisToolsTags(queryResponse.fields.supermeasure_like[s], newSuperMeasure)
        this.measures.push(newSuperMeasure) 

        var column = new Column(id, this, newSuperMeasure)
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

  buildTotals(queryResponse) {
    if (typeof queryResponse.totals_data !== 'undefined') {
      var totals_ = queryResponse.totals_data

      var totals_row = new Row('total')

      for (var c = 0; c < this.columns.length; c++) {
        var column = this.columns[c]
        totals_row.data[column.id] = { 'value': '' } // set a default on all columns

        if (column.id == this.dimensions[this.dimensions.length-1].name) {
          totals_row.data[column.id] = { 'value': 'TOTAL', 'cell_style': ['total'] }
        } 

        if (column.parent.type == 'measure') {
          if (column.pivoted == true) {
            var cellKey = [column.pivot_key, column.parent.name].join('.')
            var cellValue = totals_[column.parent.name][column.pivot_key]
            cellValue.cell_style = ['total']
            if (typeof cellValue.rendered == 'undefined' && typeof cellValue.html !== 'undefined' ){ // totals data may include html but not rendered value
              cellValue.rendered = this.getRenderedFromHtml(cellValue)
            }
            totals_row.data[cellKey] = cellValue
          } else {
            var cellValue = totals_[column.id]
            cellValue.cell_style = ['total']
            if (typeof cellValue.rendered == 'undefined' && typeof cellValue.html !== 'undefined' ){ // totals data may include html but not rendered value
              cellValue.rendered = this.getRenderedFromHtml(cellValue)
            }
            totals_row.data[column.id] = cellValue
          }            
          totals_row.data[column.id].cell_style = ['total']
        }
      } 
      totals_row.sort = [1, 0, 0]
      totals_row.data['$$$_index_$$$'] = { 'value': 'TOTAL', cell_style: ['total'] }

      this.data.push(totals_row)
      this.has_totals = true
    }
  }

  /**
   * Applies conditional formatting (red if negative) to all measure columns set to use it 
   */
  applyFormatting(config) {
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
   * Sorts columns by config option (based on measure order or pivot heading sort order)
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
   * 1. Build groupings / sort values
   * 2. Generate data rows
   */
  addSubTotals () { 
    var depth = this.addSubtotalDepth

    // BUILD GROUPINGS / SORT VALUES
    var subTotals = []
    var latest_grouping = []
    for (var r = 0; r < this.data.length; r++) {    
      var row = this.data[r]
      if (row.type !== 'total') {
        var grouping = []
        for (var g = 0; g < depth; g++) {
          var dim = this.dimensions[g].name
          grouping.push(row.data[dim].value)
        }
        if (grouping.join('|') !== latest_grouping.join('|')) {
          subTotals.push(grouping)
          latest_grouping = grouping
        }
        row.sort = [0, subTotals.length-1, r]
      }
    }

    // GENERATE DATA ROWS FOR SUBTOTALS
    for (var s = 0; s < subTotals.length; s++) {
      var subtotal = new Row('subtotal')

      for (var d = 0; d < this.columns.length; d++) {
        var column = this.columns[d]
        subtotal.data[column.id] = {} // set default

        if (this.columns[d].id === '$$$_index_$$$' || d === this.dimensions.length ) {
          var subtotal_label = subTotals[s].join(' | ')
          subtotal.data[this.columns[d]['id']] = {'value':  subtotal_label, 'cell_style': ['total']}
        } 

        if (column.parent.type == 'measure') {
          var subtotal_value = 0
          var subtotal_items = 0
          if (column.pivoted) {
            var cellKey = [column.pivot_key, column.parent.name].join('.') 
          } else {
            var cellKey = column.id
          }
          for (var mr = 0; mr < this.data.length; mr++) {
            var data_row = this.data[mr]
            if (data_row.type == 'line_item' && data_row.sort[1] == s) {
              subtotal_value += data_row.data[cellKey].value
              if (data_row.data[cellKey].value || data_row.data[cellKey].value === 0) {
                subtotal_items++
              }
            } 
          }

          if (column.parent.calculation_type === 'average' && subtotal_items > 0) {
            subtotal_value = subtotal_value / subtotal_items
          }
          var cellValue = {
            value: subtotal_value,
            rendered: column.parent.value_format === '' ? subtotal_value.toString() : SSF.format(column.parent.value_format, subtotal_value),
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
   * Generates new column subtotals, where 2 pivot levels have been used, or 1 pivot level sorted by measure values.
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

    // UPDATE THIS.COLUMNS WITH NEW SUBTOTAL COLUMNS
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

    // CALCULATE COLUMN SUB TOTALS
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
        var cell_value = {
          value: value,
          rendered: SSF.format('#0.00%', value),
          cell_style: []
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

  createVarianceColumn (colpair, config) {
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

    if (baseline.sort_by_measure_values.length < column.sort_by_measure_values.length) {
      baseline.sort_by_measure_values.push(0)
    }
    if (baseline.sort_by_pivot_values.length < column.sort_by_pivot_values.length) {
      baseline.sort_by_pivot_values.push(0)
    }
    // idea to test when vs_pivot variance is added
    // if (config.sortColumnsBy === 'getSortByPivots') {
    //   column.sort_by_pivot_values[0] = 1.5
    // }

    if (typeof config.columnOrder[column.id] !== 'undefined') {
      column.pos = config.columnOrder[column.id]
    } 

    column.field = {
      name: id
    }
    column.pivoted = baseline.pivoted
    column.super = baseline.super
    column.levels = baseline.levels
    column.pivot_key = ''

    this.columns.push(column)
    if (colpair.variance.reverse) {
      this.calculateVariance(baseline.parent.value_format, id, colpair.calc, comparison, baseline)
    } else {
      this.calculateVariance(baseline.parent.value_format, id, colpair.calc, baseline, comparison)
    }
  }

  /**
   * Function to add variance columns directly within table vis rather than requiring a table calc
   */
  addVarianceColumns (config) {
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
          } else { // variance.type === 'by_pivot'
            this.pivot_values.forEach(pivot_value => {
              if (!pivot_value.is_total) {
                calcs.forEach(calc => {
                  variance_colpairs.push({
                    variance: {
                      baseline: [pivot_value.key, variance.baseline].join('.'),
                      comparison: [pivot_value.key, variance.comparison].join('.'),
                      reverse: variance.reverse,
                      type: variance.type
                    },
                    calc: calc
                  })
                })
              }
            })
          }
        } else { // TODO: Variance across pivot columns not yet implemented
          // by_pivot
        }
      }
    })
    
    variance_colpairs.forEach(colpair => {
      this.createVarianceColumn(colpair, config)
    })
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

  getLevels () {
    var num_levels =  this.pivot_fields.length + 1
    if (this.useHeadings && !this.has_pivots) { num_levels++ }
    
    return newArray(num_levels, 0)
  }

  /**
   * Performs horizontal cell merge of header values by calculating required colspan values
   * @param {*} columns 
   */
  setColSpans (config, columns) {
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
   * Builds list of columns out of data set that should be displayed
   * @param {*} i 
   */
  getColumnsToDisplay (config, i) {
    if (this.useIndexColumn) {
      var columns = this.columns.filter(c => c.parent.type == 'measure' || c.id == '$$$_index_$$$').filter(c => !c.hide)
    } else {
      var columns =  this.columns.filter(c => c.id !== '$$$_index_$$$').filter(c => !c.hide)
    }

    columns = this.setColSpans(config, columns).filter(c => c.colspans[i] > 0)

    return columns
  }

  getRow (row) {
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
  }

  moveColumns(config, from, to, callback) {
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
