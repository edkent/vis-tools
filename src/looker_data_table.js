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
  constructor(id) {
    this.id = id
    this.idx = 0
    this.pos = 0
    this.heading = ''
    this.short_name = ''
    this.unit = ''
    this.label = '' // queryResponse.fields.measures[n].label_short
    this.view = '' // queryResponse.fields.measures[n].view_label
    this.levels = []
    this.field = {} // Looker field definition
    this.field_name = ''
    this.type = '' // dimension | measure
    this.pivoted = false
    this.subtotal = false
    this.super = false
    this.pivot_key = '' // queryResponse.pivots[n].key // single string that concats all pivot values
    this.align = '' // left | center | right
    this.value_format = ''
    this.hide = false

    this.sort_by_measure_values = [] // [index -1|dimension 0|measure 1|row totals & supermeasures 2, column number, [measure values]  ]
    this.sort_by_pivot_values = []   // [index -1|dimension 0|measure 1|row totals & supermeasures 2, [pivot values], column number    ]
    // this.sort_by_group_values = []  // [index -1|dimension 0| [header values], column number    ]
  }

  /**
   * Returns a header label for a column, to display in table vis
   * @param {*} label_with_view - full field name including label e.g. "Users Name"
   * @param {*} label_with_pivots - adds all pivot values "Total Users Q1 Male"
   */
  getLabel (label_with_view=false, label_with_pivots=false) {
    var label = this.label
    if (label_with_view) { 
      label = [this.view, label].join(' ') 
    }
    if (label_with_pivots) {
      var pivots = this.levels.join(' ')
      label = [label, pivots].join(' ') 
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
    this.columns = []
    this.dimensions = []
    this.measures = []
    this.data = []
    this.pivot_fields = []
    this.pivot_values = []

    this.rowspan_values = {}

    this.useIndexColumn = config.indexColumn || false
    this.useHeadings = config.useHeadings || false
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
    this.buildIndexColumn(queryResponse)
    this.addDimensions(config, queryResponse, col_idx)
    this.addMeasures(config, queryResponse, col_idx)
    this.buildRows(lookerData)
    this.buildTotals(queryResponse)
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
    // addGroupHeaders
    // addUnitHeaders
    // addRowNumbers // to Index Column only?
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

  applyVisToolsTags(column) {
    if (typeof column.field.tags !== 'undefined') {
      for (var t = 0; t < column.field.tags.length; t++) {
        var tags = column.field.tags[t].split(':')
        if (tags[0] === 'vis-tools') {
          if (tags[1] === 'heading') {
            column.heading = tags[2]
          } else if (tags[1] === 'short_name') {
            column.short_name = tags[2]
          } else if (tags[1] === 'unit') {
            column.unit = tags[2]
          }
        }
      }
    }
  }

  addDimensions(config, queryResponse, col_idx) {
    for (var d = 0; d < queryResponse.fields.dimension_like.length; d++) {
      this.dimensions.push({
        name: queryResponse.fields.dimension_like[d].name,
        label: queryResponse.fields.dimension_like[d].label_short || queryResponse.fields.dimension_like[d].label,
        view: queryResponse.fields.dimension_like[d].view_label || '',
      })

      var column = new Column(queryResponse.fields.dimension_like[d].name) // TODO: consider creating the column object once all required field values identified
      column.idx = col_idx
      column.levels = newArray(queryResponse.fields.pivots.length, '') // populate empty levels when pivoted
      column.field = queryResponse.fields.dimension_like[d]
      column.field_name = column.field.name
      this.applyVisToolsTags(column)
      column.label = column.field.label_short || column.field.label
      column.view = column.field.view_label
      column.type = 'dimension'
      column.align = 'left'
      column.value_format = column.field.value_format
      column.pivoted = false
      column.super = false
      column.sort_by_measure_values = [0, col_idx, ...newArray(this.pivot_fields.length, 0)]
      column.sort_by_pivot_values = [0, ...newArray(this.pivot_fields.length, 0), col_idx]

      if (typeof config['hide|' + column.id] !== 'undefined') {
        if (config['hide|' + column.id]) {
          column.hide = true
        }
      }

      this.columns.push(column)
      col_idx += 10
    }
  }

  addMeasures(config, queryResponse, col_idx) {
    // add measures, list of ids
    for (var m = 0; m < queryResponse.fields.measure_like.length; m++) {
      this.measures.push({
        name: queryResponse.fields.measure_like[m].name,
        label: queryResponse.fields.measure_like[m].label_short || queryResponse.fields.measure_like[m].label,
        view: queryResponse.fields.measure_like[m].view_label || '',
        is_table_calculation: typeof queryResponse.fields.measure_like[m].is_table_calculation !== 'undefined',
        can_pivot: true,
        value_format: queryResponse.fields.measure_like[m].value_format || ''
      }) 
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

            var column = new Column(columnId)
            column.idx = col_idx
            column.levels = levels
            column.field = queryResponse.fields.measure_like[m]
            this.applyVisToolsTags(column)
            column.label = column.field.label_short || column.field.label
            column.view = column.field.view_label
            column.type = 'measure'
            column.align = 'right'
            column.value_format = column.field.value_format
            column.pivoted = true
            column.super = false
            column.pivot_key = pivotKey
            column.field_name = measureName

            if (this.pivot_values[p]['key'] !== '$$$_row_total_$$$') {
              column.sort_by_measure_values = [1, m, ...level_sort_values]
              column.sort_by_pivot_values = [1, ...level_sort_values, col_idx]
            } else {
              column.sort_by_measure_values = [2, m, ...newArray(this.pivot_fields.length, 0)]
              column.sort_by_pivot_values = [2, ...newArray(this.pivot_fields.length, 0), col_idx]
            }

            // TODO: Hide function

            this.columns.push(column)
            col_idx += 10
          }
        }
      }
    } else {
      // noticeably simpler for flat tables!
      for (var m = 0; m < this.measures.length; m++) {
        var column = new Column(this.measures[m].name)
        column.idx = col_idx
        // console.log('addMeasures() col.id', column.id)
        try {
          if (typeof config.columnOrder[column.id] !== 'undefined') {
            column.pos = config.columnOrder[column.id]
            // console.log('addMeasures() config found, pos', column.pos)
          } else {
            column.pos = col_idx
            // console.log('addMeasures() config undefined, pos', column.pos)
          }
        }
        catch {
          // console.log('addMeasures() catch config.columnOrder undefined')
          column.pos = col_idx
        }
        column.field = queryResponse.fields.measure_like[m]
        this.applyVisToolsTags(column)
        column.label = column.field.label_short || column.field.label
        column.view = column.field.view_label
        column.type = 'measure'
        column.align = 'right'
        column.value_format = column.field.value_format
        column.pivoted = false
        column.super = false
        column.sort_by_measure_values = [1, column.pos]
        column.sort_by_pivot_values = [1, column.pos]
        this.columns.push(column)

        if (typeof config['style|' + column.id] !== 'undefined') {
          if (config['style|' + column.id] === 'hide') {
            column.hide = true
          }
        }

        col_idx += 10
      }
    }
    
    // add supermeasures, if present
    if (typeof queryResponse.fields.supermeasure_like !== 'undefined') {
      for (var s = 0; s < queryResponse.fields.supermeasure_like.length; s++) {
        var column_name = queryResponse.fields.supermeasure_like[s].name
        this.measures.push({
          name: queryResponse.fields.supermeasure_like[s].name,
          label: queryResponse.fields.supermeasure_like[s].label,
          view: '',
          can_pivot: false
        }) 

        var column = new Column(column_name)
        column.idx = col_idx
        column.levels = newArray(queryResponse.fields.pivots.length, '')
        column.field = queryResponse.fields.supermeasure_like[s]
        column.label = column.field.label_short || column.field.label
        column.view = column.field.view_label
        column.type = 'measure'
        column.value_format = column.field.value_format
        column.pivoted = false
        column.super = true
        column.sort_by_measure_values = [2, col_idx, ...newArray(this.pivot_fields.length, 1)]
        column.sort_by_pivot_values = [2, ...newArray(this.pivot_fields.length, 1), col_idx]
        if (typeof config['style|' + column.id] !== 'undefined') {
          if (config['style|' + column.id] === 'hide') {
            column.hide = true
          }
        }
        this.columns.push(column)
        col_idx += 10
      }
    }
  }

  buildIndexColumn(queryResponse) {
    var index_column = new Column('$$$_index_$$$')
    index_column.align = 'left'
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
          row.data[column.id] = lookerData[i][column.field_name][column.pivot_key]
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

        if (column.type == 'measure') {
          if (column.pivoted == true) {
            var cellKey = [column.pivot_key, column.field_name].join('.')
            var cellValue = totals_[column.field_name][column.pivot_key]
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

  /**
   * Performs vertical cell merge, by calculating required rowspan values
   * Works backwards through the data rows.
   */
  updateRowSpanValues () {
    var span_tracker = {}
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

        if (column.type == 'measure') {
          var subtotal_value = 0
          if (column.pivoted) {
            var cellKey = [column.pivot_key, column.field_name].join('.') 
          } else {
            var cellKey = column.id
          }
          for (var mr = 0; mr < this.data.length; mr++) {
            var data_row = this.data[mr]
            if (data_row.type == 'line_item' && data_row.sort[1] == s) {
              subtotal_value += data_row.data[cellKey].value
            } 
          }
          var cellValue = {
            value: subtotal_value,
            rendered: column.value_format === '' ? subtotal_value.toString() : SSF.format(column.value_format, subtotal_value),
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
    // https://pebl.dev.looker.com/explore/pebl/trans?qid=Vm6kceDf5Xv51y3VugI71G&origin_space=6&toggle=pik,vis
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
    // console.log('addColumnSubTotals pivots', pivots)

    for (var p = 0; p < pivots.length; p++) {
      var pivot = pivots[p]
      var highest_pivot_col = [0, '']
      var previous_subtotal = null

      // console.log('Processing pivot', pivot)

      for (var m = 0; m < this.measures.length; m++) {
        if (this.measures[m].can_pivot) {
          var measure = this.measures[m].name
          // console.log('...measure', measure)
          // console.log('...pivot key', pivot)
          var subtotal_col = {
            field: measure,
            label: this.measures[m].label,
            view: this.measures[m].view,
            value_format: this.measures[m].value_format,
            pivot: pivot,
            measure_idx: m,
            pivot_idx: p,
            columns: [],
            id: ['$$$_subtotal_$$$', pivot, measure].join('.'),
            after: ''
          }
          // console.log('...subtotal_col init', subtotal_col)
  
          for (var c = 0; c < this.columns.length; c++) {
            var column = this.columns[c]
  
            // console.log('...column', column.id)
  
            if (column.pivoted && column.levels[0] == pivot) {
              if (column.field_name == measure) {
                // console.log('......pivoted, pivot, measure', column.pivoted, column.levels[0], column.field_name)
                // console.log('......VALID COLUMN')
                subtotal_col.columns.push(column.id)
              }
              if (column.levels[0] == pivot) {
                // console.log('......pivot', pivot)
                // console.log('......VALID PIVOT KEY')
                if (c > highest_pivot_col[0]) {
                  // console.log('......current highest_pivot_col', highest_pivot_col)
                  // console.log('......UPDATE highest_pivot_col')
                  highest_pivot_col = [c, column.id]
                }
              }
            }
          }
  
          if (pivot != last_pivot_key) {
            // console.log('......pivot, last_pivot_key', pivot, last_pivot_key)
            // console.log('......UPDATE last_pivot_col')
            last_pivot_col[pivot] = highest_pivot_col[1]
            previous_subtotal = null
          }
  
          subtotal_col.after = previous_subtotal || last_pivot_col[pivot]
          // console.log('......AFTER', subtotal_col.after)
          last_pivot_key = pivot
          previous_subtotal = subtotal_col.id
          subtotals.push(subtotal_col)
        }
      }
    }

    // UPDATE THIS.COLUMNS WITH NEW SUBTOTAL COLUMNS
    for (var s = 0; s < subtotals.length; s++) {
      var subtotal = subtotals[s]
      var column = new Column(subtotal.id)

      column.levels = [subtotal.pivot, 'Subtotal'] //, subtotal.field]
      column.label = subtotal.label
      column.view = subtotal.view || ''
      column.field = { name: subtotal.field } // Looker field definition. Name only, to calc colspans
      column.value_format = subtotal.value_format || ''
      column.type = 'measure' // dimension | measure
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
      column.field_name = subtotal.field
      column.align = 'right' // left | center | right

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
          rendered: column.value_format === '' ? subtotal_value.toString() : SSF.format(column.value_format, subtotal_value),
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

  /**
   * Function to add variance columns directly within table vis rather than requiring a table calc
   */
  addVarianceColumns (config) {
    var calcs = ['absolute', 'percent']
    calcs.forEach(calc => {
      Object.keys(this.variances).forEach(v => {
        var variance = this.variances[v]
        if (variance.comparison !== 'no_variance') {          
          if (variance.type === 'vs_measure') {
            if (!this.has_pivots) {
              var id = ['$$$_variance_$$$', calc, variance.baseline, variance.comparison].join('|')
              var column = new Column(id)
              var baseline = this.getColumnById(variance.baseline)
              var comparison = this.getColumnById(variance.comparison)

              if (calc === 'absolute') {
                column.idx = baseline.idx + 1
                column.pos = baseline.pos + 1
                column.label = 'Var #'
                column.unit = baseline.unit
                column.hide = !config['var_num|' + baseline.id]
              } else {
                column.idx = baseline.idx + 2
                column.pos = baseline.pos + 2
                column.label = 'Var %'
                column.unit = '%'
                column.hide = !config['var_pct|' + baseline.id]
              }

              if (typeof config.columnOrder[column.id] !== 'undefined') {
                column.pos = config.columnOrder[column.id]
              } 

              column.field = {
                name: id
              }
              column.heading = baseline.heading
              column.type = 'measure'
              column.pivoted = baseline.pivoted
              column.super_ = baseline.super
              column.levels = []
              column.pivot_key = ''
              column.align = 'right'
              column.sort_by_measure_values = [1, column.pos]
              column.sort_by_pivot_values = [1, column.pos]

              this.columns.push(column)
              if (variance.reverse) {
                this.calculateVariance(baseline.value_format, id, calc, comparison, baseline)
              } else {
                this.calculateVariance(baseline.value_format, id, calc, baseline, comparison)
              }
            } else {
              // pivoted measures
            }
          } else {
            // by_pivot
          }
        }
      })
    })
  }

  /**
   * Extracts the formatted value of the field from the html: value
   * There are cases (totals data) where the formatted value isn't available as usual rendered_value
   * @param {*} cellValue 
   */
  getRenderedFromHtml (cellValue) {
    var parser = new DOMParser()
    // console.log('cell to renderFromHtml', cellValue)
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
  setColSpans (columns) {
    // build single array of the header values
    // use column id for the label level
    var header_levels = []
    var span_values = []
    var span_tracker = []
    
    // init header_levels and span_values arrays
    for (var c = columns.length-1; c >= 0; c--) {
      var idx = columns.length - 1 - c

      if (this.sortColsBy === 'getSortByPivots') {
        header_levels[idx] = [...columns[c].levels, columns[c].field.name] // columns[c].levels.concat([columns[c].field.name])
      } else {
        header_levels[idx] = [columns[c].field.name, ...columns[c].levels]
      }

      if (this.useHeadings && !this.has_pivots) {
        header_levels[idx].unshift(columns[c].heading)
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
  getColumnsToDisplay (i) {
    // remove some dimension columns if we're just using a single index column
    if (this.useIndexColumn) {
      var columns = this.columns.filter(c => c.type == 'measure' || c.id == '$$$_index_$$$').filter(c => !c.hide)
    } else {
      var columns =  this.columns.filter(c => c.id !== '$$$_index_$$$').filter(c => !c.hide)
    }

    // update list with colspans
    columns = this.setColSpans(columns).filter(c => c.colspans[i] > 0)

    // console.log('getColumnsToDisplay i ->', i, headers)
    return columns
  }

  getRow (row) {
    // filter out unwanted dimensions based on index_column setting
    if (this.useIndexColumn) {
      var cells = this.columns.filter(c => c.type == 'measure' || c.id == '$$$_index_$$$').filter(c => !c.hide)
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
        cells = cells.filter(c => c.type == 'measure' || this.rowspan_values[row.id][c.id] > 0)
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
        if (col.type == 'measure' && !col.super) {
          if (col.pos >= from && col.pos < from + 10) {
            console.log('MOVING COLUMN', col.id, col.pos, '->', col.pos + shift)
            col.pos += shift
          } else if (col.pos >= to && col.pos < from) {
            console.log('NUDGING COLUMN', col.id, col.pos, '->', col.pos + 10)
            col.pos += 10
          } else if (col.pos >= from + 10 && col.pos < to + 10) {
            console.log('NUDGING COLUMN', col.id, col.pos, '->', col.pos - 10)
            col.pos -= 10
          }
          col_order[col.id] = col.pos
        } 
      }
      callback(col_order)
    }
  }

  // TODO: getColumnOrder() {}

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
