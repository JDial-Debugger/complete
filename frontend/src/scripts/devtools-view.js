const devtoolsPanel = jQuery('#devtools-view')
const devtoolsOutputs = {
  fullTrace: devtoolsPanel.find('#devtools-trace-json'),
  point: devtoolsPanel.find('#devtools-mod-trace-json'),
  index: devtoolsPanel.find('#devtools-mod-trace-index')
}

devtoolsPanel.find('.close-devtools').on('click', () => {
  DevtoolsView.hidePanel()
})

// Used for consistent JSON styling
function stringifyJSON (json) {
  return JSON.stringify(json, null, '  ')
}

class DevtoolsView {
  static initializeClipboard () {
    new Clipboard('button[data-clipboard-target]') // eslint-disable-line no-new
  }

  static setWholeTrace (trace) {
    jQuery(devtoolsOutputs.fullTrace).val(stringifyJSON(trace))
  }

  static setModifiedTracePoint (point, index) {
    devtoolsOutputs.point.val(stringifyJSON(point))
    devtoolsOutputs.index.val(index)
  }

  static clearTraceData () {
    devtoolsOutputs.fullTrace.val('')
    devtoolsOutputs.point.val('')
    devtoolsOutputs.index.val('')
  }

  static showPanel () {
    devtoolsPanel.addClass('visible')
  }

  static hidePanel () {
    devtoolsPanel.removeClass('visible')
  }
}

export default DevtoolsView
