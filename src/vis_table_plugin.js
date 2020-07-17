import SSF from "ssf"

import { newArray, ModelDimension, ModelMeasure, PivotField, CellSeries, ColumnSeries, Row, Column } from './vis_primitives'

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
    default: false,
    order: 7,
  },
  useHeadings: {
    section: "Table",
    type: "boolean",
    label: "Use Headings (non-pivots only)",
    default: false,
    order: 8,
  },
  useShortName: {
    section: "Table",
    type: "boolean",
    label: "Use Short Name (from model)",
    default: false,
    order: 9,
  },
  groupVarianceColumns: {
    section: "Table",
    type: "boolean",
    label: "Group Variance Columns After Pivots",
    default: false,
    order: 10,
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
    label: "Transpose",
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
   * - Check for pivots and supermeasures
   * - Check for variance calculations
   * - Add dimensions
   * - Add measures
   * - Build index column
   *   - Index all original columns to preserve order later
   *   - Add dimensions, list of ids, list of full objects
   *   - Add measures, list of ids, list of full objects
   * - TODO: CHECK FOR SUBTOTALS
   *   – SET this.has_row_totals
   *   - IF this.has_pivots, FLATTEN SUBTOTALS DATA
   *   – SET this.subtotals
   * - Build rows
   * - Add column series
   * - Build totals
   * - Build row spans
   * - If configured: Add row subtotals
   * - If configured and 2 pivots: Add column subtotals
   * - Add variances
   * - TODO: add new column series
   * - Sort columns
   * - Apply formatting
   * - If configured: transpose table
   *   - add transposed_columns
   *   - add transposed_rows
   * - Validate config
   * - TODO: Get table column groups
   * 
   * @param {*} lookerData 
   * @param {*} queryResponse 
   * @param {*} config 
   */
  constructor(lookerData, queryResponse, config) {
    this.visId = 'report_table'
    this.config = config

    this.dimensions = []
    this.measures = []
    this.columns = []
    this.data = []
    this.subtotals_data = {}

    this.transposed_columns = []
    this.transposed_data = []

    this.pivot_fields = []
    this.pivots = []
    this.pivot_values = []
    this.variances = []
    this.column_series = []

    this.colspan_values = {}
    this.rowspan_values = {}

    this.useIndexColumn = config.indexColumn || false
    this.useHeadings = config.useHeadings || false
    this.useShortName = config.useShortName || false
    this.useViewName = config.useViewName || false
    this.addRowSubtotals = config.rowSubtotals || false
    this.addSubtotalDepth = parseInt(config.subtotalDepth)|| this.dimensions.length - 1
    this.spanRows = false || config.spanRows
    this.spanCols = false || config.spanCols
    this.sortColsBy = config.sortColumnsBy || 'getSortByPivots'

    this.has_totals = false
    this.has_subtotals = false
    this.has_row_totals = queryResponse.has_row_totals || false
    this.has_pivots = false
    this.has_supers = false

    this.transposeTable = config.transposeTable

    var col_idx = 0
    this.checkPivotsAndSupermeasures(queryResponse)
    this.addDimensions(queryResponse, col_idx)
    this.addMeasures(queryResponse, col_idx)
    this.checkVarianceCalculations()
    this.buildIndexColumn(queryResponse)
    this.checkSubtotalsData(queryResponse)
    this.buildRows(lookerData)
    this.addColumnSeries()
    this.buildTotals(queryResponse)
    this.updateRowSpanValues()
    if (this.config.rowSubtotals) { this.addSubTotals() }
    if (this.config.colSubtotals && this.pivot_fields.length == 2) { this.addColumnSubTotals() }
    this.addVarianceColumns()
    // this.addColumnSeries()    // TODO: add column series for generated columns (eg column subtotals)
    this.sortColumns()
    this.setColSpans()
    this.applyFormatting()
    if (this.transposeTable) { 
      this.transposeColumns() 
      this.transposeRows()
    }
    this.validateConfig()
    // this.getTableColumnGroups() 
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
        values: [
          {'Normal': 'normal'},
          {'Black/Red': 'black_red'},
          {'Subtotal': 'subtotal'},
          {'Hidden': 'hide'}
        ],
        order: 100 + i * 10 + 3
      }

      var comparisonOptions = []
      
      if (measure.can_pivot) {
        var pivotComparisons = []
        this.pivots.forEach((pivot, p) => {
          if (this.pivots.length === 1 || p === 1 || this.config.colSubtotals ) {
            var option = {}
            option['By ' + pivot.label] = pivot.name
            pivotComparisons.push(option)
          }
        })
        comparisonOptions = comparisonOptions.concat(pivotComparisons)
      }

      // measures, row totals and supermeasures
      this.measures.forEach((comparisonMeasure, j) => {
        var includeMeasure = measure.can_pivot === comparisonMeasure.can_pivot
                              || 
                            this.has_row_totals && !comparisonMeasure.is_table_calculation         
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
    })
    return newOptions
  }

  /**
   * Update the VisPluginTableModel instance
   * - this.pivots
   * - this.pivot_fields
   * - this.has_pivots
   * - this.has_supers
   * @param {*} queryResponse 
   */
  checkPivotsAndSupermeasures(queryResponse) {
    queryResponse.fields.pivots.forEach(pivot_field => { 
      this.pivot_fields.push(pivot_field.name) 
      this.pivots.push(new PivotField({
        queryResponseField: pivot_field
      }))
    })

    if (typeof queryResponse.pivots !== 'undefined') {
      this.pivot_values = queryResponse.pivots
      this.has_pivots = true
    }

    if (typeof queryResponse.fields.supermeasure_like !== 'undefined') {
      this.has_supers = true
    }

    this.number_of_levels = this.has_pivots ? this.pivots.length + 1 : 1
    if (this.useHeadings && !this.has_pivots) {
      this.number_of_levels++
    }
  }

  /**
   * Registers dimensions with the VisPluginTableModel
   * - this.dimensions
   * - this.columns
   * 
   * Uses this.applyVisToolsTags() to enrich column information
   * 
   * @param {*} queryResponse 
   * @param {*} col_idx 
   */
  addDimensions(queryResponse, col_idx) {
    queryResponse.fields.dimension_like.forEach(dimension => {
      var dim = new ModelDimension({
        vis: this,
        queryResponseField: dimension
      })
      this.dimensions.push(dim)

      var column = new Column(dim.name, this, dim) 
      column.idx = col_idx
      column.levels = newArray(queryResponse.fields.pivots.length, '')
      column.sort_by_measure_values = [0, col_idx, ...newArray(this.pivot_fields.length, 0)]
      column.sort_by_pivot_values = [0, ...newArray(this.pivot_fields.length, 0), col_idx]

      this.columns.push(column)
      col_idx += 10
    })
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
    var config = this.config
    // add measures, list of ids
    queryResponse.fields.measure_like.forEach(measure => {
      var newMeasure = new ModelMeasure({
        vis: this,
        queryResponseField: measure,
        can_pivot: true
      })
      this.measures.push(newMeasure) 
    })
    
    // add measures, list of full objects
    if (this.has_pivots) {
      this.pivot_values.forEach(pivot_value => {
        this.measures.forEach((measure, m) => {
          var include_measure = (                         // for pivoted measures, skip table calcs for row totals
            pivot_value.key != '$$$_row_total_$$$'        // if user wants a row total for table calc, must define separately
          ) || (
            pivot_value.key == '$$$_row_total_$$$' 
            && measure.is_table_calculation == false
          )

          if (include_measure) {
            var columnId = pivot_value.key + '.' + measure.name

            var levels = [] // will contain a list of all the pivot values for this column
            var level_sort_values = []
            queryResponse.fields.pivots.forEach(pivot_field => { 
              levels.push(pivot_value['data'][pivot_field.name])
              level_sort_values.push(pivot_value['sort_values'][pivot_field.name]) 
            })

            var modelField = measure
            var column = new Column(columnId, this, modelField)
            column.idx = col_idx
            column.levels = levels
            column.pivoted = true
            column.pivot_key = pivot_value.key

            if (pivot_value.key !== '$$$_row_total_$$$') {
              column.sort_by_measure_values = [1, m, ...level_sort_values]
              column.sort_by_pivot_values = [1, ...level_sort_values, col_idx]
            } else {
              column.super = true
              column.sort_by_measure_values = [2, m, ...newArray(this.pivot_fields.length, 0)]
              column.sort_by_pivot_values = [2, ...newArray(this.pivot_fields.length, 0), col_idx]
            }

            this.columns.push(column)
            col_idx += 10
          }
        })
      })
    } else {
      // noticeably simpler for flat tables!
      this.measures.forEach(measure => {
        var column = new Column(measure.name, this, measure)
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
        column.sort_by_measure_values = [1, column.pos]
        column.sort_by_pivot_values = [1, column.pos]
        this.columns.push(column)

        col_idx += 10
      })
    }
    
    // add supermeasures, if present
    if (typeof queryResponse.fields.supermeasure_like !== 'undefined') {
      queryResponse.fields.supermeasure_like.forEach(supermeasure => {
        var meas = new ModelMeasure({
          vis: this,
          queryResponseField: supermeasure,
          can_pivot: false,
        })
        this.measures.push(meas) 

        var column = new Column(meas.name, this, meas)
        column.idx = col_idx
        column.levels = newArray(queryResponse.fields.pivots.length, '')
        column.super = true
        column.sort_by_measure_values = [2, col_idx, ...newArray(this.pivot_fields.length, 1)]
        column.sort_by_pivot_values = [2, ...newArray(this.pivot_fields.length, 1), col_idx]

        this.columns.push(column)
        col_idx += 10
      })
    }
  }

   /**
   * Update the VisPluginTableModel instace
   * - this.variances
   */
  checkVarianceCalculations() {
    Object.keys(this.config).forEach(option => {
      if (option.startsWith('comparison')) {
        var baseline = option.split('|')[1]

        var baseline_in_measures = false
        this.measures.forEach(measure => {
          if (baseline === measure.name) {
            baseline_in_measures = true
          }
        })

        if (baseline_in_measures) {
          if (this.pivot_fields.includes(this.config[option])) {
            var type = 'by_pivot'
          } else {
            var type = 'vs_measure'
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
        }
      }
    })
  }

  /**
   * Creates the index column, a "for display only" column when the set of dimensions is reduced to
   * a single column for reporting purposes.
   */
  buildIndexColumn() {
    var index_column = new Column('$$$_index_$$$', this, this.dimensions[this.dimensions.length - 1])

    index_column.levels = newArray(this.number_of_levels, '')
    index_column.sort_by_measure_values = [-1, 0, ...newArray(this.pivot_fields.length, 0)]
    index_column.sort_by_pivot_values = [-1, ...newArray(this.pivot_fields.length, 0), 0]
    
    this.columns.push(index_column)
  }

  checkSubtotalsData(queryResponse) {
    if (typeof queryResponse.subtotals_data !== 'undefined') {
      this.has_subtotals = true

      if (typeof queryResponse.subtotals_data[this.addSubtotalDepth] !== 'undefined') {
        queryResponse.subtotals_data[this.addSubtotalDepth].forEach(lookerSubtotal => {
          var visSubtotal = new Row('subtotal')
  
          visSubtotal['$$$__grouping__$$$'] = lookerSubtotal['$$$__grouping__$$$']
          var groups = ['Subtotal']
          visSubtotal['$$$__grouping__$$$'].forEach(group => {
            groups.push(lookerSubtotal[group].value)
          })
          visSubtotal.id = groups.join('|')
  
          this.columns.forEach(column => {
            if (column.pivoted) {
              visSubtotal.data[column.id] = lookerSubtotal[column.modelField.name][column.pivot_key]
            } else {
              visSubtotal.data[column.id] = lookerSubtotal[column.id]
            }
  
            if (typeof visSubtotal.data[column.id] !== 'undefined') {
              if (typeof visSubtotal.data[column.id].cell_style === 'undefined') {
                visSubtotal.data[column.id].cell_style = ['total', 'subtotal']
              } else {
                isSubtotal.data[column.id].cell_style.concat(['total', 'subtotal'])
              }
              if (typeof column.modelField.style !== 'undefined') {
                visSubtotal.data[column.id].cell_style = visSubtotal.data[column.id].cell_style.concat(column.modelField.style)
              }
              if (visSubtotal.data[column.id].value === null) {
                visSubtotal.data[column.id].rendered = ''
              }
            }            
          })
          this.subtotals_data[visSubtotal.id] = visSubtotal
        })
      }
    }
  }

  /**
   * Populates this.data with Rows of data
   * @param {*} lookerData 
   */
  buildRows(lookerData) {
    lookerData.forEach((lookerRow, i) => {
      var row = new Row('line_item') // TODO: consider creating the row object once all required field values identified
      
      // flatten data, if pivoted. Looker's data structure is nested for pivots (to a single level, no matter how many pivots)
      this.columns.forEach(column => {
        
        if (column.pivoted) {
          row.data[column.id] = lookerRow[column.modelField.name][column.pivot_key]
        } else {
          row.data[column.id] = lookerRow[column.id]
        }

        if (typeof row.data[column.id] !== 'undefined') {
          if (typeof row.data[column.id].cell_style === 'undefined') {
            row.data[column.id].cell_style = []
          }
          if (typeof column.modelField.style !== 'undefined') {
            row.data[column.id].cell_style = row.data[column.id].cell_style.concat(column.modelField.style)
          }
          if (row.data[column.id].value === null) {
            row.data[column.id].rendered = ''
          }
          if (column.modelField.is_turtle) {
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
      })

      // set a unique id for the row
      var all_dims = []
      this.dimensions.forEach(dimension => {
        all_dims.push(row.data[dimension.name].value)
      })
      row.id = all_dims.join('|')

      // set an index value (note: this is an index purely for display purposes; row.id remains the unique reference value)
      var last_dim = this.dimensions[this.dimensions.length - 1].name

      row.data['$$$_index_$$$'] = {
        value: row.data[last_dim].value,
        rendered: this.getRenderedFromHtml(row.data[last_dim]),
        html: row.data[last_dim].html,
        cell_style: ['indent']
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

      var new_series = new ColumnSeries({
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
    if (typeof queryResponse.totals_data !== 'undefined') {
      if (typeof queryResponse.truncated !== 'undefined') {
        var calculate_others = true
      } else {
        var calculate_others = false
      }

      var totals_ = queryResponse.totals_data

      var firstVisibleDimension = this.dimensions[0].name
      for (var i = 0; i > this.dimensions.length; i++) {
        var dimension = this.dimensions[i]
        if (!dimension.hide) {
          firstVisibleDimension = dimension.name
          break
        }
      }

      var totals_row = new Row('total')
      var others_row = new Row('line_item')

      this.columns.forEach(column => {
        var other_value = null
        totals_row.id = 'Total'
        others_row.id = 'Others'
        totals_row.data[column.id] = { value: '', cell_style: ['total'] } // set a default on all columns
        others_row.data[column.id] = { value: '', cell_style: [] } // set a default on all columns
        
        if (column.modelField.type == 'measure') {
          if (column.pivoted == true) {
            var cellValue = totals_[column.modelField.name][column.pivot_key]       
          } else {
            var cellValue = totals_[column.id]  
          }
          if (typeof cellValue.rendered == 'undefined' && typeof cellValue.html !== 'undefined' ){ // totals data may include html but not rendered value
            cellValue.rendered = this.getRenderedFromHtml(cellValue)
          }
          if (calculate_others) {
            if (['sum', 'count_distinct', 'count'].includes(column.modelField.calculation_type)) {
              other_value = cellValue.value - column.series.series.sum
            } else if (column.modelField.calculation_type === 'average') {
              other_value = (cellValue.value + column.series.series.avg) / 2
            }  
          }
          cellValue.cell_style = ['total']
          totals_row.data[column.id] = cellValue
          if (typeof totals_row.data[column.id].links !== 'undefined') {
            totals_row.data[column.id].links.forEach(link => {
              link.type = "measure_default"
            })
          }

          if (calculate_others && other_value) {
            var formatted_value = column.modelField.value_format === '' 
                  ? other_value.toString() 
                  : SSF.format(column.modelField.value_format, other_value)
                  others_row.data[column.id] = { value: other_value, rendered: formatted_value } 
          }
                    
        }
      })
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
   * Performs vertical cell merge, by calculating required rowspan values
   * Works backwards through the data rows.
   */
  updateRowSpanValues () {
    var span_tracker = {}
    this.dimensions.forEach(dimension => {
      span_tracker[dimension.name] = 1
    })

    // loop backwards through data rows
    for (var r = this.data.length - 1; r >= 0 ; r--) {
      var row = this.data[r]

      // Totals/subtotals rows: full reset and continue
      if (row.type !== 'line_item' ) {
        this.dimensions.forEach(dimension => {
          span_tracker[dimension.name] = 1
        })
        continue;
      }

      // loop fowards through the dimensions
      this.rowspan_values[row.id] = {}
      for (var i = 0; i < this.dimensions.length; i++) {
        var dimension = this.dimensions[i]
        var this_cell_value = this.data[r].data[dimension.name].value
        if (r > 0) {
          var cell_above_value = this.data[r - 1].data[dimension.name].value
        }

        // Match: mark invisible (span_value = -1). Increment the span_tracker.
        if (r > 0 && this_cell_value == cell_above_value) {
          this.rowspan_values[row.id][dimension.name] = -1;
          span_tracker[dimension.name] += 1;
        } else {
        // Different: set span_value from span_tracker. Partial reset and continue
          for (var d_ = i; d_ < this.dimensions.length; d_++) {
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
    })

    var firstVisibleDimension = this.dimensions[0].name
    for (var i = 0; i < this.dimensions.length; i++) {
      var dimension = this.dimensions[i]
      if (!dimension.hide) {
        firstVisibleDimension = dimension.name
        break
      }
    }

    // GENERATE DATA ROWS FOR SUBTOTALS
    subTotalGroups.forEach((subTotalGroup, s) => {
      var subtotal = new Row('subtotal')
      subtotal.id = 'Subtotal|' + subTotalGroup.join('|')

      this.columns.forEach(column => {
        subtotal.data[column.id] = { 'cell_style': ['total', 'subtotal'] } // set default

        if (column.id === '$$$_index_$$$' || column.id === firstVisibleDimension ) {
          var subtotal_label = subTotalGroup.join(' | ')
          subtotal.data[column.id].value = subtotal_label
        } 

        if (column.modelField.type == 'measure') {
          if (Object.entries(this.subtotals_data).length > 0) {
            subtotal.data[column.id] = { ...subtotal.data[column.id], ...this.subtotals_data[subtotal.id].data[column.id] }
          } else {
            if (column.pivoted) {
              var cellKey = [column.pivot_key, column.modelField.name].join('.') 
            } else {
              var cellKey = column.id
            }

            var subtotal_value = 0
            var subtotal_items = 0
            var rendered = ''
            this.data.forEach(data_row => {
              if (data_row.type == 'line_item' && data_row.sort[1] == s) { // data_row.sort[1] == s checks whether its part of the subtotal group
                var value = data_row.data[cellKey].value
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
              rendered = column.modelField.value_format === '' ? subtotal_value.toString() : SSF.format(column.modelField.value_format, subtotal_value)
            }
            if (column.modelField.calculation_type === 'string') {
              subtotal_value = ''
              rendered = ''
            } 

            var cellValue = {
              value: subtotal_value,
              rendered: rendered,
              cell_style: ['subtotal', 'total']
            }
            subtotal.data[cellKey] = cellValue
          }
        }
      })
      subtotal.sort = [0, s, 9999]
      this.data.push(subtotal)
    })
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
    this.pivot_values.forEach(pivot_value => {
      var p_value = pivot_value['data'][pivot_dimension]
      if (p_value !== null) { pivots.push(p_value) }
    })
    pivots = [...new Set(pivots)]

    // DERIVE THE NEW COLUMN DEFINITIONS
    pivots.forEach((pivot, p) => {
      var highest_pivot_col = [0, '']
      var previous_subtotal = null

      this.measures.forEach((measure, m) => {
        if (measure.can_pivot) {
          var subtotal_col = {
            modelField: measure,
            pivot: pivot,
            measure_idx: m,
            pivot_idx: p,
            columns: [],
            id: ['$$$_subtotal_$$$', pivot, measure.name].join('.'),
            after: ''
          }
  
          this.columns.forEach((column, i) => {  
            if (column.pivoted && column.levels[0] == pivot) {
              if (column.modelField.name == measure.name) {
                subtotal_col.columns.push(column.id)
              }
              if (column.levels[0] == pivot) {
                if (i > highest_pivot_col[0]) {
                  highest_pivot_col = [i, column.id]
                }
              }
            }
          })
  
          if (pivot != last_pivot_key) {
            last_pivot_col[pivot] = highest_pivot_col[1]
            previous_subtotal = null
          }
  
          subtotal_col.after = previous_subtotal || last_pivot_col[pivot]
          last_pivot_key = pivot
          previous_subtotal = subtotal_col.id
          subtotals.push(subtotal_col)
        }
      })
    })

    // USE THE NEW DEFINITIONS TO ADD SUBTOTAL COLUMNS TO TABLE.COLUMNS
    subtotals.forEach((subtotal, s) => {
      var modelField = this.measures[subtotal.measure_idx]
      var column = new Column(subtotal.id, this, modelField)

      column.levels = [subtotal.pivot, 'Subtotal']
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
    })
    this.sortColumns()

    // CALCULATE COLUMN SUB TOTAL VALUES
    this.data.forEach(row => {
      subtotals.forEach(subtotal => {
        var subtotal_value = 0
        subtotal.columns.forEach(field => {
          subtotal_value += row.data[field].value
        })
        row.data[subtotal.id] = {
          value: subtotal_value,
          rendered: subtotal.modelField.value_format === '' ? subtotal_value.toString() : SSF.format(subtotal.modelField.value_format, subtotal_value),
          align: 'right',
          cell_style: ['subtotal']
        }
        if (['subtotal', 'total'].includes(row.type)) { row.data[subtotal.id].cell_style.push('total') }
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
      if (row.type === 'subtotal') {
        cell_value.cell_style.push('subtotal')
      }
      if (cell_value.value < 0) {
        cell_value.cell_style.push('red')
      }
      row.data[id] = cell_value
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
    var column = new Column(id, this, baseline.modelField)

    if (colpair.calc === 'absolute') {
      column.variance_type = 'absolute'
      column.idx = baseline.idx + 1
      column.pos = baseline.pos + 1
      column.sort_by_measure_values = baseline.sort_by_measure_values.concat(1)
      column.sort_by_pivot_values = baseline.sort_by_pivot_values.concat(1)
      column.hide = !this.config['var_num|' + baseline.modelField.name]
    } else {
      column.variance_type = 'percentage'
      column.idx = baseline.idx + 2
      column.pos = baseline.pos + 2
      column.sort_by_measure_values = baseline.sort_by_measure_values.concat(2)
      column.sort_by_pivot_values = baseline.sort_by_pivot_values.concat(2)
      column.unit = '%'
      column.hide = !this.config['var_pct|' + baseline.modelField.name]
    }

    // TODO: Review sort values / algorithms
    if (baseline.sort_by_measure_values.length < column.sort_by_measure_values.length) {
      baseline.sort_by_measure_values.push(0)
    }
    if (baseline.sort_by_pivot_values.length < column.sort_by_pivot_values.length) {
      baseline.sort_by_pivot_values.push(0)
    }

    if (typeof this.config.columnOrder[column.id] !== 'undefined') {
      column.pos = this.config.columnOrder[column.id]
    } 

    column.pivoted = baseline.pivoted
    column.super = baseline.super
    column.pivot_key = ''

    column.levels = baseline.levels
    if (this.config.groupVarianceColumns) {
      if (this.config.sortColumnsBy === 'getSortByPivots') {
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

    if (this.useIndexColumn) {
      var columns = this.columns.filter(c => c.modelField.type == 'measure' || c.id === '$$$_index_$$$').filter(c => !c.hide)
    } else {
      var columns =  this.columns.filter(c => c.id !== '$$$_index_$$$').filter(c => !c.hide)
    }
  }

    /**
   * Performs horizontal cell merge of header values by calculating required colspan values
   * @param {*} columns 
   */
  setColSpans () {
    if (this.useIndexColumn) {
      var columns = this.columns
                      .filter(c => c.modelField.type === 'measure' || c.id === '$$$_index_$$$')
                      .filter(c => !c.hide)
    } else {
      var columns = this.columns
                      .filter(c => c.id !== '$$$_index_$$$')
                      .filter(c => !c.hide)
    }

    var header_levels = []
    var span_values = []
    var span_tracker = []
    
    // init header_levels and span_values arrays
    for (var c = columns.length - 1; c >= 0; c--) {
      var column = columns[c]
      var idx = columns.length - 1 - c

      // if (this.sortColsBy === 'getSortByPivots') {
      //   header_levels[idx] = [...column.levels, column.getLabel(column.levels.length)]
      // } else {
      //   header_levels[idx] = [column.getLabel(0), ...column.levels]
      // }
      header_levels[idx] = column.getHeaderLevels()

      if (this.useHeadings && !this.has_pivots) {
        var column_heading = column.modelField.heading
        var config_setting = this.config['heading|' + column.modelField.name]
        if (typeof config_setting !== 'undefined') {
          column_heading = config_setting ? config_setting : column_heading
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
          if (h < header_levels.length - 1) {
            var above_value = header_levels[h + 1][l]
          }

          // Match: mark invisible (span_value = -1). Increment the span_tracker.
          if (h < header_levels.length - 1 && this_value == above_value) {
            span_values[h][l] = -1;
            span_tracker[l] += 1;
          } else {
          // Different: set span_value from span_tracker. Partial reset and continue
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
      for (var h = header_levels.length - 1; h >= 0; h--) {
        var this_value = header_levels[h][label_level]
        
        if (h > 0) {
          var next_value = header_levels[h - 1][label_level] 
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
    
    columns.forEach((column, idx) => {
      column.colspans = span_values[idx]
      this.colspan_values[column.id] = span_values[idx]
    })
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
                row.data[column.id].cell_style.push('red')
              }
            })
            break
        }
      }
    })
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
      var transposed_column = new Column('header', this, index_parent)
      transposed_column.labels = ['Header', '', '']
      transposed_column.colspans = default_colspan
      transposed_column.type = 'measure'
      this.transposed_columns.push(transposed_column)
    }

    if (this.sortColsBy === 'getSortByPivots') {
      this.pivots.forEach(pivot => {
        var transposed_column = new Column(pivot.name, this, index_parent)
        transposed_column.labels = [pivot.label_short, '', '']
        transposed_column.colspans = default_colspan
        transposed_column.type = 'dimension'
        transposed_column.align = 'left'
        this.transposed_columns.push(transposed_column)
      })

      var transposed_column = new Column('measure', this, index_parent)
      transposed_column.labels = ['Meaure', '', '']
      transposed_column.colspans = default_colspan
      transposed_column.type = 'measure'
      transposed_column.align = 'left'
      this.transposed_columns.push(transposed_column)
    } else {
      var transposed_column = new Column('measure', this, index_parent)
      transposed_column.labels = ['Meaure', '', '']
      transposed_column.colspans = default_colspan
      transposed_column.type = 'measure'
      transposed_column.align = 'left'
      this.transposed_columns.push(transposed_column)

      this.pivots.forEach(pivot => {
        var transposed_column = new Column(pivot.name, this, index_parent)
        transposed_column.labels = [pivot.label_short, '', '']
        transposed_column.colspans = default_colspan
        transposed_column.type = 'dimension'
        transposed_column.align = 'left'
        this.transposed_columns.push(transposed_column)
      })
    }
    
    for (var h = 0; h < this.data.length; h++) {
      var sourceRow = this.data[h]
      if (sourceRow.type === 'line_item') {
        var colspan = []
        var labels = []
        this.dimensions.forEach(dim => {
          if (this.spanRows) {
            colspan.push(this.rowspan_values[sourceRow.id][dim.name])
          } else {
            colspan.push(1)
          }
          labels.push(sourceRow.data[dim.name].value)
        })
      } else if (sourceRow.type === 'subtotal') {
        var colspan = default_colspan
        var labels = ['Subtotal'].concat(newArray(this.dimensions.length-1, ''))
      } else if (sourceRow.type === 'total') {
        var colspan = default_colspan
        var labels = ['TOTAL'].concat(newArray(this.dimensions.length-1, ''))
      }

      var transposed_column = new Column(sourceRow.id, this, measure_parent)
      transposed_column.transposed = true
      transposed_column.colspans = colspan
      transposed_column.labels = labels
      transposed_column.align = 'right'
      this.transposed_columns.push(transposed_column)
    }
  }

  transposeRows () {
    this.columns.filter(c => c.modelField.type === 'measure').forEach(column => {
      var transposed_data = {}
      this.data.forEach(row => {
        if (typeof row.data[column.id] !== 'undefined') {
          transposed_data[row.id] = row.data[column.id]
          transposed_data[row.id]['align'] = 'right'
          if (typeof transposed_data[row.id]['cell_style'] !== 'undefined') {
            transposed_data[row.id]['cell_style'].push('transposed')
          } else {
            transposed_data[row.id]['cell_style'] = ['transposed']
          }
        } else {
          console.log('row data does not exist for', column.id)
        }
      })

      // INDEX FIELDS (header, pivot values, measure name)
      var column_heading = column.modelField.heading
      var config_setting = this.config['heading|' + column.modelField.name]
      if (typeof config_setting !== 'undefined') {
        column_heading = config_setting ? config_setting : column_heading
      } 
      transposed_data.header = { value: column_heading, cell_style: [] }
      if (column.subtotal) { transposed_data.header.cell_style.push('subtotal') }

      if (this.sortColsBy === 'getSortByPivots') {
        var measure_level = this.pivots.length
      } else {
        var measure_level = 0
      }
      if (this.useHeadings && !this.has_pivots) { measure_level++ } // should this.useHeadings be combined with !has_pivots?

      transposed_data.measure = { value: column.getLabel(measure_level), cell_style: [] }
      if (column.subtotal) { transposed_data.measure.cell_style.push('subtotal') }
      if (column.modelField.style.includes('subtotal')) { transposed_data.measure.cell_style.push('subtotal') }
      
      this.pivot_fields.forEach((pivot_field, idx) => {
        transposed_data[pivot_field] = { value: column.levels[idx], cell_style: [] }
        if (column.subtotal) { transposed_data[pivot_field].cell_style.push('subtotal') }
      })

      var transposed_row = new Row('line_item')
      transposed_row.id = column.id
      transposed_row.modelField = column.modelField
      transposed_row.hide = column.hide
      transposed_row.rowspans = column.colspans                  // does this need to be filtered, as per get headings?
      transposed_row.data = transposed_data

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
  getLevels () {
    var levels = []
    if (!this.transposeTable) {
      if (this.useHeadings && !this.has_pivots) { levels.push('headers level') }

      if (this.sortColsBy === 'getSortByPivots') {
        this.pivots.forEach(pivot => {
          levels.push(pivot.name)
        })
        levels.push('measures level')
      } else {
        levels.push('measures level')
        this.pivots.forEach(pivot => {
          levels.push(pivot.name)
        })
      }
    } else {
      levels = this.dimensions
    }

    return levels
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
        if (column.modelField.type === 'dimension' && !this.useIndexColumn && column.id !== '$$$_index_$$$' && !column.hide) {
          index_columns.push({ id: column.id })
        } else if (column.modelField.type === 'dimension' && this.useIndexColumn && column.id === '$$$_index_$$$') {
          index_columns.push({ id: column.id })
        } else if (column.modelField.type === 'measure' && !column.super && !column.hide) {
          measure_columns.push({ id: column.id })
        } else if (column.modelField.type === 'measure' && column.super && !column.hide) {
          total_columns.push({ id: column.id })
        }
      })
    } else {
      this.transposed_columns.forEach(column => {
        if (column.modelField.type === 'transposed_table_index') {
          index_columns.push({ id: column.id})
        } else if (column.modelField.type === 'transposed_table_measure' && column.id !== 'Total') {
          measure_columns.push({ id: column.id })
        } else if (column.modelField.type === 'transposed_table_measure' && column.id === 'Total') {
          total_columns.push({ id: column.id })
        }
      })
    }
  }

  /**
   * Used to support rendering of data table as vis. 
   * Builds list of columns out of data set that should be displayed
   * @param {*} i 
   */
  getTableHeaders (i) {
    if (!this.transposeTable) {
      return this.columns.filter(c => this.colspan_values[c.id][i] > 0)
    } else {
      return this.transposed_columns.filter(c => c.colspans[i] > 0)
    }
  }

  getDataRows () {
    if (!this.transposeTable) {
      return this.data
    } else {
      return this.transposed_data
                        .filter(row => !row.hide)
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
        var cells = this.columns.filter(c => c.modelField.type == 'measure' || c.id === '$$$_index_$$$').filter(c => !c.hide)
      } else {
        var cells =  this.columns.filter(c => c.id !== '$$$_index_$$$').filter(c => !c.hide)
      }

      // if we're using all dimensions, and we've got span_rows on, need to update the row
      if (!this.useIndexColumn && this.spanRows) {
      // set row spans, for dimension cells that should appear
        cells.forEach(cell => {
          cell.rowspan = 1 // set default
          if (row.type === 'line_item' && this.rowspan_values[row.id][cell.id] > 0) {
            cell.rowspan = this.rowspan_values[row.id][cell.id]
          } 
        })
        // filter out dimension cells that a hidden / merged into a cell above
        if (row.type === 'line_item') {
          cells = cells.filter(c => c.modelField.type == 'measure' || this.rowspan_values[row.id][c.id] > 0)
        }
      }
    } else {
      var cells = this.transposed_columns
      cells.forEach((cell, idx) => {
        cell.rowspan = 1
        if (cell.modelField.type === 'transposed_table_index' && typeof row.rowspans[idx] !== 'undefined') {
          cell.rowspan = this.colspan_values[row.id][idx]
        }
      })
      cells = cells.filter(cell => cell.rowspan > 0)
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
}

exports.VisPluginTableModel = VisPluginTableModel

// MUST
// TODO: update validateConfig to enforce ALL defaults (OR: while dimensions and measures are created, set defaults in config)
// TODO: fix bug where Series extents be calculated as NaNs

// SHOULD
// TODO: tooltip for data cells
// TODO: tooltip for index cells

// NICE TO HAVE
// TODO: row & cell highlight on mouseover
// TODO: Investigate replacing all this.pivot_fields references with this.pivots
// TODO: option for reporting in 000s or 000000s
// TODO: more formatting options
// TODO: addSpacerColumns
// TODO: addUnitHeaders
// TODO: addRowNumbers // to Index Column only?
// TODO: build an explore URL (eg new table calcs) so user can save their variances as a query?
//        - users would want to preserve column order, could that be done in vis_config?

// FRs
//
// Ability to "expand rows" for print
// Config widget to provide checklist display for arrays (e.g. apply multiple styles)
// Additional info in queryResponse
//  - filters set on the query
//  - context (are we in a dashboard or an explore e.g. so that additional info & warnings can be shown in explore)
// Additional info in details
//  - Is this the "final" updateAsync call?
// Pass through custom theme information
// Ability to not just update filters, but also
//  - Send table_calc expressions back to the explore (eg for variance analysis)
//  - Send custom field definitions back to the explore
//  - Request new fields be added to the explore (e.g. add "hierarchies" based on drill_fields:)
// Ability to add horizontal lines to a config section (to split apart field-based options)