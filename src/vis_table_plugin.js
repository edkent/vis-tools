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
      { 'Pivots': 'getSortByPivots' },
      { 'Measures': 'getSortByMeasures' }
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
    label: "Group Variance Columns",
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
    this.sortColsBy = config.sortColumnsBy || 'getSortByPivots' // matches to Column methods: getSortByPivots(), getSortByMeasures)
    this.fieldLevel = 0 // set in addPivotsAndHeaders()
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

    console.log('Table in progress:', this)
    return

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
      this.headers.push({ type: 'pivot' + i, modelField: pivot_field })
    })

    var measureHeaders = this.useHeadings 
      ? [{ type: 'heading', modelField: { label: '(will be replaced by header for column)s' } }] 
      : []
    
    measureHeaders.push({ type: 'field', modelField: { label: '(will be replaced by field for column)' } })

    if (this.sortColsBy === 'getSortByPivots') {
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
      var newDimension = new ModelDimension({
        vis: this,
        queryResponseField: dimension
      })
      newDimension.hide = this.useIndexColumn ? true : newDimension.hide
      this.dimensions.push(newDimension)

      var column = new Column(newDimension.name, this, newDimension) 
      column.idx = col_idx
      column.sort.push(0)
      this.headers.forEach(header => {
        switch (header.type) {
          case 'pivot0':
          case 'pivot1':
            var pivotField = new ModelPivot({ vis: this, queryResponseField: header.modelField })
            var headerCell = new HeaderCell({ column: column, type: 'pivot', modelField: pivotField })
            if (this.sortColsBy === 'getSortByMeasures') { headerCell.label = '' }
            column.levels.push(headerCell)
            column.sort.push(0)
            break
          case 'heading':
            column.levels.push(new HeaderCell({ column: column, type: 'heading', modelField: newDimension }))
            break
          case 'field':
            column.levels.push(new HeaderCell({ column: column, type: 'field', modelField: newDimension }))
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
        var isRowTotal = pivot_value.key === '$$$_row_total_$$$'
        this.measures.forEach((measure, m) => {
          // for pivoted measures, skip table calcs for row totals 
          // if user wants a row total of a table calc, it must be defined as another table calc (in which case, it will be a supermeasure)
          var include_measure = !isRowTotal || ( isRowTotal && !measure.is_table_calculation )
          
          if (include_measure) {
            var column = new Column([pivot_value.key, measure.name].join('.'), this, measure)
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
                  if (isRowTotal && header.type === 'pivot' + (this.pivot_fields.length - 1)) {
                    label = 'Row Total'
                  }
                  column.levels.push(new HeaderCell({ 
                    column: column, 
                    type: 'pivot', 
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
                  column.levels.push(new HeaderCell({ column: column, type: 'heading', modelField: measure}))
                  break

                case 'field':
                  column.levels.push(new HeaderCell({ column: column, type: 'field', modelField: measure}))
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
        var column = new Column(measure.name, this, measure)
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
              column.levels.push(new HeaderCell({ column: column, type: 'heading', modelField: measure}))
              break

            case 'field':
              column.levels.push(new HeaderCell({ column: column, type: 'field', modelField: measure}))
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
        var meas = new ModelMeasure({
          vis: this,
          queryResponseField: supermeasure,
          can_pivot: false,
        })
        this.measures.push(meas) 

        var column = new Column(meas.name, this, meas)
        column.sort.push(2)
        this.headers.forEach(header => {
          switch (header.type) {
            case 'pivot0':
            case 'pivot1':
              column.levels.push(new HeaderCell({ column: column, type: 'pivot', modelField: { label: '' } }))
              column.sort.push(1)
              break
            case 'heading':
              column.levels.push(new HeaderCell({ column: column, type: 'heading', modelField: meas }))
              break
            case 'field':
              column.levels.push(new HeaderCell({ column: column, type: 'field', modelField: meas }))
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
    var dim_config_setting = this.config['hide|' + dimension.name]
    var column = new Column('$$$_index_$$$', this, dimension)
    column.sort.push(-1)
    column.hide = dim_config_setting === true ? dim_config_setting : false

    this.headers.forEach(header => {
      switch (header.type) {
        case 'pivot0':
        case 'pivot1':
          var pivotField = new ModelPivot({ vis: this, queryResponseField: header.modelField })
          var headerCell = new HeaderCell({ column: column, type: 'pivot', modelField: pivotField })
          if (this.sortColsBy === 'getSortByMeasures') { headerCell.label = '' }
          column.levels.push(headerCell)
          column.sort.push(0)
          break
        case 'heading':
          column.levels.push(new HeaderCell({ column: column, type: 'heading', modelField: dimension }))
          break
        case 'field':
          column.levels.push(new HeaderCell({ column: column, type: 'field', modelField: dimension }))
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
        var visSubtotal = new Row('subtotal')

        visSubtotal['$$$__grouping__$$$'] = lookerSubtotal['$$$__grouping__$$$']
        var groups = ['Subtotal']
        visSubtotal['$$$__grouping__$$$'].forEach(group => {
          groups.push(lookerSubtotal[group].value)
        })
        visSubtotal.id = groups.join('|')

        this.columns.forEach(column => {
          visSubtotal.data[column.id] = (column.pivoted || column.isRowTotal) ? lookerSubtotal[column.modelField.name][column.pivot_key] : lookerSubtotal[column.id]

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
        var cellValue = (column.pivoted || column.isRowTotal)? lookerRow[column.modelField.name][column.pivot_key] : lookerRow[column.id]
        var cell = new DataCell(cellValue)

        cell.rowid = row.id
        cell.colid = column.id

        if (column.modelField.type === 'dimension') {
          cell.align = 'left'
        }

        if (column.modelField.type === 'measure') {
          cell.cell_style.push('measure')
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

      if (this.useIndexColumn) {
        var last_dim = this.dimensions[this.dimensions.length - 1].name
        last_dim = row.data[last_dim]

        row.data['$$$_index_$$$'] = new DataCell({
          value: last_dim.value,
          rendered: last_dim.rendered,
          html: last_dim.html,
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

      if (column.modelField.type === 'dimension') {
        if ([this.firstVisibleDimension, '$$$_index_$$$'].includes(column.id)) {
          var rowspan = 1
          var colspan = this.useIndexColumn ? 1 : this.dimensions.filter(d => !d.hide).length
        } else {
          var rowspan = -1
          var colspan = -1
        }
      } else {
        var rowspan = 1
        var colspan = 1
      }
      totalsRow.data[column.id] = new DataCell({ value: '', cell_style: ['total'], rowspan: rowspan, colspan: colspan })
      
      if (column.modelField.type === 'measure') {
        var cellValue = (column.pivoted || column.isRowTotal) ? totals_[column.modelField.name][column.pivot_key] : totals_[column.id]
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
      var othersRow = new Row('line_item')
      othersRow.id = 'Others'
      this.columns.forEach(column => {
        var othersValue = null
        var othersStyle = []
        var totalValue = (column.pivoted || column.isRowTotal) ? totals_[column.modelField.name][column.pivot_key] : totals_[column.id]
        
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
        othersRow.data['$$$_index_$$$'].align = 'left'
        othersRow.data['$$$_index_$$$'].cell_style.push('indent')
      } else {
        if (this.firstVisibleDimension) {
          othersRow.data[this.firstVisibleDimension].value = 'Others'
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
    var span_values = this.rowspan_values
    var span_tracker = {}

    // 1)
    leaves = this.data

    // 2)
    tiers = this.dimensions.filter(d => !d.hide)
    tiers.forEach(tier => {
      span_tracker[tier.id] = 1
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
      
      if (row.id === 'Others' && row.type === 'line_item') {
        row.hide = true
      }
    })

    // GENERATE DATA ROWS FOR SUBTOTALS
    subTotalGroups.forEach((subTotalGroup, s) => {
      var subtotalRow = new Row('subtotal')
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
          var cell = new DataCell({ 'cell_style': ['total', 'subtotal'], align: 'left', rowspan: rowspan, colspan: colspan })
          if (column.id === '$$$_index_$$$' || column.id === this.firstVisibleDimension ) {
            cell.value = subTotalGroup.join(' | ') ? subTotalGroup.join(' | ') : 'Others'
            cell.rendered = cell.value
          }
          subtotalRow.data[column.id] = cell
        }

        if (column.modelField.type == 'measure') {
          if (Object.entries(this.subtotals_data).length > 0 && subtotalRow.id !== 'Subtotal|Others') { // if subtotals already provided in Looker's queryResponse
            var cell = new DataCell({ ...subtotalRow.data[column.id], ...this.subtotals_data[subtotalRow.id].data[column.id] })
            cell.cell_style = ['subtotal', 'total']
            subtotalRow.data[column.id] = cell
          } else {
            // var cellKey = column.pivoted ? [column.pivot_key, column.modelField.name].join('.') : column.id
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
              rendered = column.modelField.value_format === '' ? subtotal_value.toString() : SSF.format(column.modelField.value_format, subtotal_value)
            }
            if (column.modelField.calculation_type === 'string') {
              subtotal_value = ''
              rendered = ''
            } 

            var cell = new DataCell({
              value: subtotal_value,
              rendered: rendered,
              cell_style: ['subtotal', 'total']
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
          var subtotalColumn = new Column(['$$$_subtotal_$$$', pivot, measure.name].join('.'), this, measure)
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
              if (column.levels[i].type === 'pivot') {
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
            subtotalColumn.levels.push(new HeaderCell({ column: subtotalColumn, type: 'pivot', modelField: {
              name: this.pivot_fields[0].name,
              label: subtotalColumn.subtotal_data.pivot,
            }}))
            subtotalColumn.sort.push(sort_value_from_column)
            break

          case 'pivot1':
            subtotalColumn.levels.push(new HeaderCell({ column: subtotalColumn, type: 'pivot', modelField: {
              name: 'subtotal',
              label: 'Subtotal',
            }}))
            subtotalColumn.sort.push(9999)
            break

          case 'heading':
            subtotalColumn.levels.push(new HeaderCell({ column: subtotalColumn, type: 'heading', modelField: subtotalColumn.modelField}))
            break

          case 'field':
            subtotalColumn.levels.push(new HeaderCell({ column: subtotalColumn, type: 'field', modelField: subtotalColumn.modelField}))
            if (this.sortColsBy === 'getSortByPivots') {
              subtotalColumn.sort.push(subtotalColumn.subtotal_data.measure_idx)
            } else {
              subtotalColumn.sort.push(10000 + s)
            }
            break
        }
      })
      this.columns.push(subtotalColumn)
    })

    // CALCULATE COLUMN SUB TOTAL VALUES
    this.data.forEach(row => {
      subtotalColumns.forEach(subtotalColumn => {
        var subtotal_value = 0
        subtotalColumn.subtotal_data.columns.forEach(column => { // subtotalColumn.columns i.e. the individual columns that are aggregated into a single subtotal columns
          subtotal_value += row.data[column.id].value
        })
        row.data[subtotalColumn.id] = new DataCell({
          value: subtotal_value,
          rendered: subtotalColumn.modelField.value_format === '' ? subtotal_value.toString() : SSF.format(subtotalColumn.modelField.value_format, subtotal_value),
          cell_style: ['subtotal']
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
        var cell = new DataCell({
          value: baseline_value - comparison_value,
          rendered: value_format === '' ? (baseline_value - comparison_value).toString() : SSF.format(value_format, (baseline_value - comparison_value)),
          cell_style: []
        })
      } else {
        var value = (baseline_value - comparison_value) / Math.abs(comparison_value)
        if (!isFinite(value)) {
          var cell = new DataCell({
            value: null,
            rendered: '∞',
            cell_style: []
          })
        } else {
          var cell = new DataCell({
            value: value,
            rendered: SSF.format('#0.00%', value),
            cell_style: []
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
        cell.cell_style.push('red')
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
    var column = new Column(id, this, baseline.modelField)
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
    column.pivot_key = ''

    if (this.groupVarianceColumns) {    
        column.sort[0] = 1.5
    }

    this.headers.forEach((header, i) => {
      switch (header.type) {
        case 'pivot0':
        case 'pivot1':
          var label = baseline.getHeaderCellLabelByType(header.type)
          var headerCell = new HeaderCell({ column: column, type: 'pivot', modelField: { label: label } })
          column.levels[i] = headerCell
          break
        case 'heading':
          var headerCell = new HeaderCell({ column: column, type: 'heading', modelField: baseline.modelField })
          column.levels[i] = headerCell
          break
        case 'field':
          var headerCell = new HeaderCell({ column: column, type: 'field', modelField: baseline.modelField })
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

    // 2)
    tiers = this.headers
    tiers.forEach(tier => {
      span_tracker[tier.type] = 1
    })

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
    // col spans are set against the Column object (can only be a few headers)
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

  transposeDimensionsIntoHeaders () {
    this.transposed_headers = this.columns
      .filter(c => c.modelField.type !== 'measure')
      .filter(c => !c.hide)
      .map(c => { return { type: 'field', modelField: c.modelField } })

    console.log('transposed_headers', this.transposed_headers)
  }

  /**
   * For rendering a transposed table i.e. with the list of measures on the left hand side
   * 1. Add an index column per header
   * 2. Add a transposed column for every data row
   */
  transposeRowsIntoColumns () {
    var default_colspan = this.transposed_headers
      .map(header => {
        var colspans = {}
        colspans[header.modelField.name] = 1
      })
    console.log('default_colspan', default_colspan)

    var index_parent = {
      align: 'left',
      type: 'transposed_table_index',
      is_table_calculation: false
    }

    // One "index column" per header row from original table
    this.headers.forEach(header => {
      var column = new Column(header.type, this, index_parent)

      this.transposed_headers.forEach(header => {
        var headerCell = new HeaderCell({ column: column, type: header.type, label: header.modelField.label, modelField: header.modelField })
        column.levels.push(headerCell)
      })
      // transposed_column.levels[0] = new HeaderCell({ column: transposed_column, queryResponseField: { name: pivot_field.name, label: pivot_field.label } })
      this.transposed_columns.push(column)
    })

    console.log('this.transposed_columns, index cols only so far', this.transposed_columns)
    
    var measure_parent = {
      align: 'right',
      type: 'transposed_table_measure',
      is_table_calculation: false
    }
  
    // One column per data row (line items, subtotals, totals)
    for (var h = 0; h < this.data.length; h++) {
      var sourceRow = this.data[h]
      var transposedColumn = new Column(sourceRow.id, this, measure_parent)

      if (sourceRow.type === 'line_item') {
        var colspan_values = {}
        var levels = []
        this.transposed_headers.forEach(header => {
          colspan_values = this.rowspan_values[sourceRow.id]
          levels.push(sourceRow.data[header.modelField.name].value)
        })
      } else if (sourceRow.type === 'subtotal') {
        var colspan_values = default_colspan
        var levels = newArray(this.transposed_headers.length, new HeaderCell({ column: transposedColumn, type: 'total', modelField: {} }))
      } else if (sourceRow.type === 'total') {
        var colspan_values = default_colspan
        var levels = newArray(this.transposed_headers.length, new HeaderCell({ column: transposedColumn, type: 'total', modelField: {} }))
      }

      transposedColumn.transposed = true
      transposedColumn.colspan_values = colspan_values
      transposedColumn.levels = levels
      this.transposed_columns.push(transposedColumn)
    }
  }

  transposeColumnsIntoRows () { 
    this.columns.filter(c => c.modelField.type === 'measure').forEach(column => {
      var transposed_data = {}

      // MEASURE FIELDS // every measure column in original table is converted to a data row
      this.data.forEach(row => {
        if (typeof row.data[column.id] !== 'undefined') {
          transposed_data[row.id] = row.data[column.id]
          transposed_data[row.id]['align'] = column.modelField.align
          transposed_data[row.id]['cell_style'].push('transposed')
        } else {
          console.log('row data does not exist for', column.id)
        }
      })

      // INDEX FIELDS // every index/dimension column in origianl table must be represented as a data cell in the new transposed rows

      this.headers.forEach((header, i) => {
        switch (header.type) {
          case 'pivot0':
            var cell = new DataCell({ value: column.levels[i].label, rendered: column.levels[i].label })
            if (column.subtotal) { cell.cell_style.push('subtotal') }
            transposed_data['pivot0'] = cell
            break
          case 'pivot1':
            var cell = new DataCell({ value: column.levels[i].label, rendered: column.levels[i].label })
            if (column.subtotal) { cell.cell_style.push('subtotal') }
            transposed_data['pivot1'] = cell
            break
          case 'heading':
            var cell = new DataCell({ value: column.levels[i].label, rendered: column.levels[i].label })
            if (column.subtotal) { cell.cell_style.push('subtotal') }
            transposed_data['heading'] = cell
            break
          case 'field':
            var cell = new DataCell({ value: column.levels[i].label, rendered: column.levels[i].label })
            if (column.subtotal) { cell.cell_style.push('subtotal') }
            if (column.modelField.style.includes('subtotal')) { cell.cell_style.push('subtotal') }
            transposed_data['field'] = cell
            break
        }
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
    return !this.transposeTable
      ? this.headers
      : this.transposed_headers 
  }

  /**
   * Used to support rendering of data table as vis. 
   * Builds list of columns out of data set that should be displayed
   * @param {*} i 
   */
  getTableHeaderCells (i) {
    return !this.transposeTable
      ? this.columns
          .filter(c => !c.hide)
          .filter(c => this.colspan_values[c.id][this.headers[i].type] > 0)
      : this.transposed_columns
          .filter(c => c.levels[i].colspan > 0)
  }

  getDataRows () {
    return !this.transposeTable
      ? this.data.filter(row => !row.hide)
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
        .filter(cell => cell.rowspan > 0)

      // cells.forEach((cell, idx) => {
      //   if (cell.modelField.type === 'transposed_table_index') {
      //     cell.rowspan = this.colspan_values[row.id][this.headers[idx].name]
      //   }
      // })

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
}

exports.VisPluginTableModel = VisPluginTableModel
