import { newArray, ModelDimension, ModelMeasure, PivotField, Row, Column } from './vis_primitives'

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
        var pivot_field = new PivotField({
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
      var dim = new ModelDimension({
        vis: this,
        name: dimension.name,
        label: dimension.label_short || dimension.label,
        view: dimension.view_label || '',
        is_numeric: dimension.is_numeric
      })
      this.dimensions.push(dim)
      this.ranges[dim.name] = {
        set: [],
      }

      var column = new Column(dim.name, this, dim) 
      column.levels = newArray(queryResponse.fields.pivots.length, '') // populate empty levels when pivoted

      if (typeof this.config['hide|' + column.id] !== 'undefined') {
        if (this.config['hide|' + column.id]) {
          column.hide = true
        }
      }

      this.columns.push(column)
    })
  }

  addMeasures(queryResponse) {
    // add measures, list of ids
    queryResponse.fields.measure_like.forEach(measure => {
      var mea = new ModelMeasure({
        vis: this,
        name: measure.name,
        label: measure.label_short || measure.label,
        view: measure.view_label || '',
        is_table_calculation: typeof measure.is_table_calculation !== 'undefined',
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

            var column = new Column(columnId, this, measure)
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
        var column = new Column(measure.name, vis, measure)

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
        var mea = new ModelMeasure({
          name: supermeasure.name,
          label: supermeasure.label,
          view: '',
        })
        this.measures.push(mea) 

        var column = new Column(mea.name, this, mea)
        column.levels = newArray(queryResponse.fields.pivots.length, '')
        column.super = true

        if (typeof this.config['style|' + column.id] !== 'undefined') {
          if (this.config['style|' + column.id] === 'hide') {
            column.hide = true
          }
        }
        this.columns.push(column)
      })
    }
  }

  buildRows(lookerData) {
    lookerData.forEach(lookerRow => {
      var row = new Row() // TODO: consider creating the row object once all required field values identified
      
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

    // this.dimensions.forEach(dimension => {
    //   tiptext += "<p><em>" + dimension.label + ":</em> " + row[dimension.name].rendered + "</p>"
    // })

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
