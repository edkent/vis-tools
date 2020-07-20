import SSF from "ssf"

import { newArray, ModelDimension, ModelPivot, ModelMeasure, HeaderCell, CellSeries, ColumnSeries, Row, Column, DataCell } from './vis_primitives'

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

    this.colspan_values = {}
    this.rowspan_values = {}

    this.useIndexColumn = config.indexColumn || false
    this.useHeadings = config.useHeadings || false
    this.useShortName = config.useShortName || false
    this.useViewName = config.useViewName || false
    this.addRowSubtotals = config.rowSubtotals || false
    this.addSubtotalDepth = parseInt(config.subtotalDepth)|| this.dimensions.length - 1
    this.addColSubtotals = config.colSubtotals || false
    this.spanRows = false || config.spanRows
    this.spanCols = false || config.spanCols
    this.sortColsBy = config.sortColumnsBy || 'pivots'
    this.groupVarianceColumns = config.groupVarianceColumns || false

    this.hasTotals = typeof queryResponse.totals_data !== 'undefined' ? true : false
    this.calculateOthers = typeof queryResponse.truncated !== 'undefined' ? queryResponse.truncated : false 
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
    console.log('Table in progress:', this)
    return
    this.addColumnSeries()

    if (this.hasTotals) { this.buildTotals(queryResponse) }
    if (this.spanRows) { this.setRowSpans() }
    if (this.addRowSubtotals) { this.addSubTotals() }
    if (this.addColSubtotals && this.pivot_fields.length === 2) { this.addColumnSubTotals() }
    if (this.variances) { this.addVarianceColumns() }

    // this.addColumnSeries()    // TODO: add column series for generated columns (eg column subtotals)
    this.sortColumns()
    if (this.spanCols) { this.setColSpans() }
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
   * - this.pivot_fields
   * - this.headers
   * @param {*} queryResponse 
   */
  addPivotsAndHeaders(queryResponse) {
    queryResponse.fields.pivots.forEach((pivot, i) => {
      var pivot_field = new ModelPivot({ vis: this, queryResponseField: pivot })
      this.pivot_fields.push(pivot_field)
      this.headers.push(new HeaderCell({ vis: this, type: 'pivot' + i, modelField: pivot_field }))
    })

    var measureHeaders = this.useHeadings 
      ? [new HeaderCell({ vis: this, type: 'heading', modelField: { label: '(will be replaced by header for column)s' } })] 
      : []
    
    measureHeaders.push(new HeaderCell({ vis: this, type: 'field', modelField: { label: '(will be replaced by field for column)' } }))

    if (this.sortColsBy === 'pivots') {
      this.headers.push(...measureHeaders)
    } else {
      this.headers.unshift(...measureHeaders)
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
      var newDimension = new ModelDimension({
        vis: this,
        queryResponseField: dimension
      })
      newDimension.hide = this.useIndexColumn ? true : newDimension.hide
      this.dimensions.push(newDimension)

      var column = new Column(newDimension.name, this, newDimension) 
      column.idx = col_idx
      this.headers.forEach(header => {
        switch (header.type) {
          case 'pivot0':
          case 'pivot1':
            var pivot_field = new ModelPivot({ vis: this, queryResponseField: header.modelField })
            column.levels.push(new HeaderCell({ vis: this, type: 'pivot', modelField: pivot_field }))
            break
          case 'heading':
            column.levels.push(new HeaderCell({ vis: this, type: 'heading', modelField: newDimension }))
            break
          case 'field':
            column.levels.push(new HeaderCell({ vis: this, type: 'field', modelField: newDimension }))
            break
        }
      })
      column.sort_by_measure_values = [0, col_idx, ...newArray(this.pivot_fields.length, 0)]
      column.sort_by_pivot_values = [0, ...newArray(this.pivot_fields.length, 0), col_idx]

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
      var newMeasure = new ModelMeasure({
        vis: this,
        queryResponseField: measure,
        can_pivot: true
      })
      this.measures.push(newMeasure) 
    })
    
    // add measures, list of full objects
    if (this.hasPivots) {
      this.pivot_values.forEach(pivot_value => {
        this.measures.forEach((measure, m) => {
          var include_measure = (                         // for pivoted measures, skip table calcs for row totals
            pivot_value.key != '$$$_row_total_$$$'        // if user wants a row total for table calc, must define separately
          ) || (
            pivot_value.key == '$$$_row_total_$$$' 
            && measure.is_table_calculation == false
          )

          if (include_measure) {
            var column = new Column([pivot_value.key, measure.name].join('.'), this, measure)
            column.pivoted = true
            column.pivot_key = pivot_value.key
            column.idx = col_idx

            var level_sort_values = []
            this.headers.forEach(header => {
              switch (header.type) {
                case 'pivot0':
                case 'pivot1':
                  // column.levels.push(new HeaderCell({ vis: this, type: 'pivot' }))
                  var label = pivot_value.key === '$$$_row_total_$$$' ? '(row total)' : pivot_value['data'][header.modelField.name]
                  column.levels.push(new HeaderCell({ 
                    vis: this, 
                    type: 'pivot', 
                    modelField: { label: label },
                    pivotData: pivot_value
                  }))
                  level_sort_values.push(pivot_value['sort_values'][header.name])
                  break

                case 'heading':
                  column.levels.push(new HeaderCell({ vis: this, type: 'heading', modelField: measure}))
                  break

                case 'field':
                  column.levels.push(new HeaderCell({ vis: this, type: 'field', modelField: measure}))
                  break;
              }
            })

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

        this.headers.forEach(header => {
          switch (header.type) {
            case 'heading':
              column.levels.push(new HeaderCell({ vis: this, type: 'heading', modelField: measure}))
              break

            case 'field':
              column.levels.push(new HeaderCell({ vis: this, type: 'field', modelField: measure}))
              break;
          }
        })

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
        this.headers.forEach(header => {
          switch (header.type) {
            case 'pivot0':
            case 'pivot1':
              column.levels.push(new HeaderCell({ vis: this, type: 'pivot', modelField: { label: '(supermeasure)' } }))
              break
            case 'heading':
              column.levels.push(new HeaderCell({ vis: this, type: 'heading', modelField: meas }))
              break
            case 'field':
              column.levels.push(new HeaderCell({ vis: this, type: 'field', modelField: meas }))
              break
          }
        })
        column.idx = col_idx
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
   * 
   *  option is either 'no_variance' or a measure.name
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
    var index_column = new Column('$$$_index_$$$', this, dimension)
    var dim_config_setting = this.config['hide|' + dimension.name]
    index_column.hide = dim_config_setting === true ? dim_config_setting : false

    this.headers.forEach(header => {
      switch (header.type) {
        case 'pivot0':
        case 'pivot1':
          var pivot_field = new ModelPivot({ vis: this, queryResponseField: header.modelField })
          index_column.levels.push(new HeaderCell({ vis: this, type: 'pivot', modelField: pivot_field }))
          break
        case 'heading':
          index_column.levels.push(new HeaderCell({ vis: this, type: 'heading', modelField: dimension }))
          break
        case 'field':
          index_column.levels.push(new HeaderCell({ vis: this, type: 'field', modelField: dimension }))
          break
      }
    })

    index_column.sort_by_measure_values = [-1, 0, ...newArray(this.pivot_fields.length, 0)]
    index_column.sort_by_pivot_values = [-1, ...newArray(this.pivot_fields.length, 0), 0]
    
    this.columns.push(index_column)
  }

  /**
   * this.subtotals_data
   * @param {*} queryResponse 
   */
  checkSubtotalsData(queryResponse) {
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
          visSubtotal.data[column.id] = column.pivoted ? lookerSubtotal[column.modelField.name][column.pivot_key] : lookerSubtotal[column.id]

          if (typeof visSubtotal.data[column.id] !== 'undefined') {
            if (typeof visSubtotal.data[column.id].cell_style === 'undefined') {
              visSubtotal.data[column.id].cell_style = ['total', 'subtotal']
            } else {
              visSubtotal.data[column.id].cell_style.concat(['total', 'subtotal'])
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

  /**
   * Populates this.data with Rows of data
   * @param {*} lookerData 
   */
  addRows(lookerData) {
    lookerData.forEach((lookerRow, i) => {
      var row = new Row('line_item')
      row.id = this.dimensions.map(dimension => lookerRow[dimension.name].value).join('|')

      this.columns.forEach(column => {
        var cellValue = column.pivoted ? lookerRow[column.modelField.name][column.pivot_key] : lookerRow[column.id]
        var cell = new DataCell(cellValue)

        cell.rowid = row.id
        cell.colid = column.id

        if (column.modelField.type === 'dimension') {
          cell.align = 'left'
        }

        if (typeof column.modelField.style !== 'undefined') {
          cell.cell_style = cell.cell_style.concat(column.modelField.style)
        }

        if (cell.value === null) {
          cell.rendered = ''
        }

        if (column.modelField.is_turtle) {
          var cell_series = new CellSeries({
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

      // set an index value (note: this is an index purely for display purposes; row.id remains the unique reference value)
      var last_dim = this.dimensions[this.dimensions.length - 1].name

      if (this.useIndexColumn) {
        row.data['$$$_index_$$$'] = new DataCell({
          value: row.data[last_dim].value,
          rendered: this.getRenderedFromHtml(row.data[last_dim]),
          html: row.data[last_dim].html,
          cell_style: ['indent'],
          align: 'left',
          rowspan: 1
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
    var totals_ = queryResponse.totals_data
    var totalsRow = new Row('total')

    this.columns.forEach(column => {
      totalsRow.id = 'Total'
      totalsRow.data[column.id] = new DataCell({ value: '', cell_style: ['total'] })
      
      if (column.modelField.type === 'measure') {
        var cellValue = column.pivoted ? totals_[column.modelField.name][column.pivot_key] : totals_[column.id]
        cellValue = new DataCell(cellValue)

        if (typeof cellValue.rendered === 'undefined' && typeof cellValue.html !== 'undefined' ){ // totals data may include html but not rendered value
          cellValue.rendered = this.getRenderedFromHtml(cellValue)
        }
        
        cellValue.cell_style = ['total']
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
    } else {
      if (this.firstVisibleDimension) {
        totalsRow.data[this.firstVisibleDimension].value = 'TOTAL'
      }
    }
    totalsRow.sort = [1, 0, 0]
    this.data.push(totalsRow)

    // Including an Others row: note the huge assumption in calculating a very simple average!
    // This will prevent a data gap distracting users, and may indicate whether the Others data
    // is "higher or lower" than the top x items. But it is not an accurate number.
    if (this.calculateOthers) {
      var othersRow = new Row('line_item')
      othersRow.id = 'Others'
      this.columns.forEach(column => {
        var othersValue = null
        var othersStyle = []
        var totalValue = column.pivoted ? totals_[column.modelField.name][column.pivot_key] : totals_[column.id]
        
        if (column.modelField.type === 'measure') {
          if (othersValue = ['sum', 'count'].includes(column.modelField.calculation_type)) {
            othersValue = totalValue.value - column.series.series.sum
          } else {
            othersValue = (totalValue.value + column.series.series.avg) / 2
            othersStyle.push('estimate')
            if (['count', 'count_distinct'].includes(column.modelField.calculation_type)) {
              othersValue = Math.round(othersValue)
            }
          }
        }

        if (othersValue) {
          var formatted_value = column.modelField.value_format === '' 
                ? othersValue.toString() 
                : SSF.format(column.modelField.value_format, othersValue)
          othersRow.data[column.id] = new DataCell({ value: othersValue, rendered: formatted_value, cell_style: othersStyle })
        } else {
          othersRow.data[column.id] = new DataCell()
        }
      })

      if (this.useIndexColumn) {
        othersRow.data['$$$_index_$$$'].value = 'Others'
      } else {
        if (this.firstVisibleDimension) {
          othersRow.data[this.firstVisibleDimension].value = 'Others'
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
    var span_values = this.rowspan_values
    var span_tracker = {}

    // 1)
    leaves = this.data

    // 2)
    tiers = this.dimensions.filter(d => !d.hide)
    tiers.forEach(tier => {
      span_tracker[tier.id] = 1
    })

    // Loop backwards through data rows
    for (var l = leaves.length - 1; l >= 0 ; l--) {
      var leaf = leaves[l]

      // Totals/subtotals rows: full reset and continue
      if (leaf.type !== 'line_item' ) {
        tiers.forEach(tier => {
          span_tracker[tier.name] = 1
        })
        continue;
      }

      // Loop fowards through the dimensions
      span_values[leaf.id] = {}
      for (var t = 0; t < tiers.length; t++) {
        var tier = tiers[t]
        var this_tier_value = leaf.data[tier.name].value
        var neighbour_value = l > 0 ? leaves[l - 1].data[tier.name].value : null

        // Match: mark invisible (span_value = -1). Increment the span_tracker.
        if (l > 0 && this_tier_value === neighbour_value) {
          span_values[leaf.id][tier.name] = -1
          leaf.data[tier.name].rowspan = -1
          span_tracker[tier.name] += 1
        } else {
        // Different: set span_value from span_tracker. Partial reset and continue
          for (var t_ = t; t_ < tiers.length; t_++) {
            var tier_ = tiers[t_]
            span_values[leaf.id][tier_.name] = span_tracker[tier_.name]
            leaf.data[tier_.name].rowspan = span_tracker[tier_.name]
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
    })

    // GENERATE DATA ROWS FOR SUBTOTALS
    subTotalGroups.forEach((subTotalGroup, s) => {
      var subtotal = new Row('subtotal')
      subtotal.id = 'Subtotal|' + subTotalGroup.join('|')

      this.columns.forEach(column => {
        subtotal.data[column.id] = { 'cell_style': ['total', 'subtotal'] } // set default

        if (column.id === '$$$_index_$$$' || column.id === this.firstVisibleDimension ) {
          var subtotal_label = subTotalGroup.join(' | ')
          subtotal.data[column.id].value = subtotal_label
        } 

        if (column.modelField.type == 'measure') {
          if (Object.entries(this.subtotals_data).length > 0) {
            subtotal.data[column.id] = { ...subtotal.data[column.id], ...this.subtotals_data[subtotal.id].data[column.id] }
          } else {
            var cellKey = column.pivoted ? [column.pivot_key, column.modelField.name].join('.') : column.id
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
    var last_pivot_key = ''
    var last_pivot_col = {}
    var subtotals = []

    var pivots = []
    var pivot_dimension = this.pivot_fields[0].name
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
      column.pivoted = true
      column.subtotal = true
      column.pivot_key = [subtotal.pivot, '$$$_subtotal_$$$'].join('|')

      this.headers.forEach(header => {
        switch (header.type) {
          case 'pivot0':
            column.levels.push(new HeaderCell({ vis: this, type: 'pivot', modelField: {
              name: this.pivot_fields[0].name,
              label: subtotal.pivot,
            }}))
            break
          case 'pivot1':
            column.levels.push(new HeaderCell({ vis: this, type: 'pivot', modelField: {
              name: 'subtotal',
              label: 'Subtotal',
            }}))
            break
          case 'heading':
            column.levels.push(new HeaderCell({ vis: this, type: 'heading', modelField: modelField}))
            break
          case 'field':
            column.levels.push(new HeaderCell({ vis: this, type: 'field', modelField: modelField}))
            break;
        }
      })

      var pivot_values = column.levels.map(level => level.label)
      column.sort_by_measure_values = [1, subtotal.measure_idx, ...pivot_values]
      pivot_values[pivot_values.length-1] = typeof pivot_values[pivot_values.length-1] == 'string'
        ? pivot_values[pivot_values.length-1] = 'ZZZZ'
        : pivot_values[pivot_values.length-1] = 9999
      column.sort_by_pivot_values = [1, ...pivot_values, 10000 + s]

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
    if (this.groupVarianceColumns) {
      if (this.config.sortColumnsBy === 'pivots') {
        column.sort_by_pivot_values[0] = 1.5
      }
      this.headers.forEach(header => {
        switch (header.type) {
          case 'pivot0':
            column.levels.push(new HeaderCell({ vis: this, type: 'pivot', modelField: { 
              name: 'variance', 
              label: 'Variance' 
            }}))
            break
          case 'pivot1':
            column.levels.push(new HeaderCell({ vis: this, type: 'pivot', modelField: {
              name: baseline.id,
              label: baseline.levels[1],
            }}))
            break
          case 'heading':
            column.levels.push(new HeaderCell({ vis: this, type: 'heading', modelField: modelField}))
            break
          case 'field':
            column.levels.push(new HeaderCell({ vis: this, type: 'field', modelField: modelField}))
            break;
        }
      })
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
      for(var i = 0; i < depth; i++) {
          if (a[param]()[i] > b[param]()[i]) { return 1 }
          if (a[param]()[i] < b[param]()[i]) { return -1 }
      }
      return -1
    }
    this.columns.sort(compareColSortValues)
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
    var span_values = this.colspan_values
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
    console.log('leaves', leaves)

    // 2)
    tiers = this.headers
    tiers.forEach(tier => {
      span_tracker[tier.type] = 1
    })
    console.log('tiers', tiers)

    // 3)
    for (var l = leaves.length - 1; l >= 0; l--) {
      var leaf = leaves[l]
      span_values[leaf.id] = {}

      // 5)
      for (var t = 0; t < tiers.length; t++) {
        var tier = tiers[t]
        var this_tier_value = leaf.data[tier.type].label
        var neighbour_value = l > 0 ? leaves[l - 1].data[tier.type].label : null

        // 6) 
        if (l > 0 && this_tier_value === neighbour_value) {
          span_values[leaf.id][tier.type] = -1;
          span_tracker[tier.type] += 1;
        } else {
        // 7) 
          for (var t_ = t; t_ < tiers.length; t_++) {
            var tier_ = tiers[t_]
            span_values[leaf.id][tier_.type] = span_tracker[tier_.type];
            span_tracker[tier_.type] = 1
          }
          break;
        }
      }
    }

    // row spans are set against the cell values (can be many individual cells)
    // col spacs are set against the Column object (can only be a few headers)
    this.columns.forEach(column => {
      if (typeof span_values[column.id] !== 'undefined') {
        column.colspans = span_values[column.id]
      }
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
    this.transposed_headers = this.columns
      .filter(c => c.modelField.type !== 'measure')
      .filter(c => !c.hide)
      .map(c => new HeaderCell({ vis: this, queryResponseField: c.modelField }))
    
    var default_colspan = this.transposed_headers
      .map(header => {
        var colspans = {}
        colspans[header.name] = 1
      })

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

    // Single header column, if useHeadings
    if (this.useHeadings && !this.hasPivots) {
      var transposed_column = new Column('header', this, index_parent)
      transposed_column.levels = newArray(this.transposed_headers.length, new HeaderCell({ vis: this, queryResponseField: {} }))
      transposed_column.levels[0] = new HeaderCell({ vis: this, queryResponseField: { name: 'header', label: 'Header' } })
      transposed_column.colspans = default_colspan
      transposed_column.type = 'dimension'
      this.transposed_columns.push(transposed_column)
    }

    if (this.sortColsBy === 'pivots') {
      this.pivot_fields.forEach(pivot_field => {
        var transposed_column = new Column(pivot_field.name, this, index_parent)
        transposed_column.levels = newArray(this.transposed_headers.length, new HeaderCell({ vis: this, queryResponseField: {} }))
        transposed_column.levels[0] = new HeaderCell({ vis: this, queryResponseField: { name: pivot_field.name, label: pivot_field.label } })
        transposed_column.colspans = default_colspan
        this.transposed_columns.push(transposed_column)
      })

      var transposed_column = new Column('measure', this, index_parent)
      transposed_column.levels = newArray(this.transposed_headers.length, new HeaderCell({ vis: this, queryResponseField: {} }))
      transposed_column.levels[0] = new HeaderCell({ vis: this, queryResponseField: { name: 'measure', label: 'Measure' } })
      transposed_column.colspans = default_colspan
      this.transposed_columns.push(transposed_column)
    } else {
      var transposed_column = new Column('measure', this, index_parent)
      transposed_column.levels = newArray(this.transposed_headers.length, new HeaderCell({ vis: this, queryResponseField: {} }))
      transposed_column.levels[0] = new HeaderCell({ vis: this, queryResponseField: { name: 'measure', label: 'Measure' } })
      transposed_column.colspans = default_colspan
      this.transposed_columns.push(transposed_column)

      this.pivot_fields.forEach(pivot_field => {
        var transposed_column = new Column(pivot_field.name, this, index_parent)
        transposed_column.levels = newArray(this.transposed_headers.length, new HeaderCell({ vis: this, queryResponseField: {} }))
        transposed_column.levels[0] = new HeaderCell({ vis: this, queryResponseField: { name: pivot_field.name, label: pivot_field.label } })
        transposed_column.colspans = default_colspan
        this.transposed_columns.push(transposed_column)
      })
    }
    
    for (var h = 0; h < this.data.length; h++) {
      var sourceRow = this.data[h]
      if (sourceRow.type === 'line_item') {
        var colspan_values = {}
        var levels = []
        this.transposed_headers.forEach(header => {
          colspan_values = this.rowspan_values[sourceRow.id]
          levels.push(sourceRow.data[header.name].value)
        })
      } else if (sourceRow.type === 'subtotal') {
        var colspan_values = default_colspan
        var levels = newArray(this.transposed_headers.length, new HeaderCell({ vis: this, queryResponseField: {} }))
        levels[0] = new HeaderCell({ vis: this, queryResponseField: {
          name: 'subtotal',
          label: 'Subtotal'
        }})
      } else if (sourceRow.type === 'total') {
        var colspan_values = default_colspan
        var levels = newArray(this.transposed_headers.length, new HeaderCell({ vis: this, queryResponseField: {} }))
        levels[0] = new HeaderCell({ vis: this, queryResponseField: {
          name: 'total',
          label: 'Total'
        }})
      }

      var transposed_column = new Column(sourceRow.id, this, measure_parent)
      transposed_column.transposed = true
      transposed_column.colspan_values = colspan_values
      transposed_column.levels = levels
      this.transposed_columns.push(transposed_column)
    }
  }

  transposeRows () {
    this.columns.filter(c => c.modelField.type === 'measure').forEach(column => {
      var transposed_data = {}

      // MEASURE FIELDS
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

      var measure_level = this.sortColsBy === 'pivots' ? this.pivot_fields.length : 0
      if (this.useHeadings && !this.hasPivots) { measure_level++ } 

      transposed_data.measure = { value: column.getLabel(measure_level), cell_style: [] }
      if (column.subtotal) { transposed_data.measure.cell_style.push('subtotal') }
      if (column.modelField.style.includes('subtotal')) { transposed_data.measure.cell_style.push('subtotal') }
      
      this.pivot_fields.forEach((pivot_field, idx) => {
        transposed_data[pivot_field.name] = { value: column.levels[idx], cell_style: [] }
        if (column.subtotal) { transposed_data[pivot_field.name].cell_style.push('subtotal') }
      })

      var transposed_row = new Row('line_item')
      transposed_row.id = column.id
      transposed_row.modelField = column.modelField
      transposed_row.hide = column.hide
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
    if (this.spanRows) { this.setRowSpans() }
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
    return this.transposeTable
      ? this.dimensions.filter(d => !d.hide) 
      : this.headers
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
  getTableHeaderColumns (i) {
    return !this.transposeTable
      ? this.columns
          .filter(c => !c.hide)
          .filter(c => this.colspan_values[c.id][this.headers[i].type] > 0)
      : this.transposed_columns
          .filter(c => c.colspans[i] > 0)
  }

  getDataRows () {
    return !this.transposeTable
      ? this.data
      : this.transposed_data.filter(row => !row.hide)
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
      cells.forEach((cell, idx) => {
        if (cell.modelField.type === 'transposed_table_index') {
          cell.rowspan = this.colspan_values[row.id][this.headers[idx].name]
        }
      })

      cells = cells
        .filter(cell => cell.rowspan > 0)
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