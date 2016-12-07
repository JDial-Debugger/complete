import NotificationView from './notification-view'
import EventHandler from './event-handler'

const HL_LINE_CLASS = 'active-line'

class EditorView extends EventHandler {
  constructor (wrapperElem, initialProgram = '') {
    super()

    super.declareEvent('apply-suggestion')

    if ((wrapperElem instanceof jQuery) === false) {
      throw new Error('expected argument to new EditorView() to be a jQuery object')
    }

    // HTML element that the CodeMirror instance is embedded within
    this.wrapperElem = wrapperElem

    // Create a new CodeMirror instance inside of the given wrapper
    this.editor = CodeMirror(this.wrapperElem[0], {
      mode: 'text/x-java',
      theme: 'neat',
      value: initialProgram,
      lineNumbers: true,
      indentUnit: 4,
      smartIndent: false,
      tabSize: 4,
      indentWithTabs: true,
      electricChars: false
    })

    // Line number of the line currently highlighted. Set to -1 if no line highlighted
    this.highlightedLine = -1 // NOTE: 0-based line count

    this.frozen = false
  }

  getProgram () {
    return this.editor.getValue()
  }

  setProgram (newValue, clearHistory = false) {
    if (typeof newValue !== 'string') {
      throw new Error('expected 1st arg. of EditorView.setProgram() to be a string')
    }

    this.editor.setValue(newValue)

    // If "clearHistory" is set, this will reset the editor's undo history
    // so that it won't be possible to use the undo command to reverse
    // changes made by "setValue"
    if (clearHistory === true) {
      this.editor.clearHistory()
    }
  }

  freeze () {
    this.frozen = true
    this.editor.setOption('readOnly', 'nocursor')
  }

  unfreeze () {
    this.frozen = false
    this.editor.setOption('readOnly', false)
    this.clearHighlightedLine()
    this.editor.focus()
  }

  highlightLine (lineNum) {
    if (this.frozen === false) {
      throw new Error('cannot highlight line until editor is frozen')
    }

    // Convert lineNum from 1-based to 0-based
    lineNum--

    if (this.highlightedLine >= 0) {
      this.clearHighlightedLine()
    }

    const PADDING = 20 // pixels that should be in-view above & below the line

    this.editor.addLineClass(lineNum, 'gutter', HL_LINE_CLASS)
    this.editor.addLineClass(lineNum, 'background', HL_LINE_CLASS)
    this.editor.scrollIntoView({line: lineNum, ch: 0}, PADDING)
    this.highlightedLine = lineNum
  }

  clearHighlightedLine () {
    if (this.highlightedLine === -1) {
      return
    }

    this.editor.removeLineClass(this.highlightedLine, 'gutter', HL_LINE_CLASS)
    this.editor.removeLineClass(this.highlightedLine, 'background', HL_LINE_CLASS)
    this.highlightedLine = -1
  }

  makeSuggestion (raw) {
    let matches = raw.match(/\{([^\n]*)\}/)

    if (matches === null || (matches[1] && matches[1].length === 0)) {
      console.error(`RAW SUGGESTION: ${raw}`)
      throw new Error('no suggestion')
    }

    let match = matches[1]

    // TODO: only looks at first suggestion currently
    match.split(',')
    .filter((p, i) => i === 0)
    .forEach((rawPair) => {
      let pair = rawPair.split('=')

      if (pair.length !== 2) {
        throw new Error(`no pairs: ${match}`)
      }

      let line = parseInt(pair[0], 10)
      let value = parseInt(pair[1], 10)

      if (isNaN(line)) {
        throw new Error(`line is NaN: ${match}`)
      }

      if (isNaN(value)) {
        throw new Error(`value is NaN: ${match}`)
      }

      let notif = NotificationView.send('success', 'Possible change', {
        code: `add ${value} on line #${line}?`,
        large: true,
        actions: [
          { name: 'Change', command: 'apply-suggestion' },
          { name: 'Try again', command: 'different-suggestion' }
        ]
      })

      notif.on('apply-suggestion', () => {
        let originalLine = this.editor.getLine(line - 1)
        let modifiedLine = originalLine.replace(/\b\d+\b/, value.toString())
        this.editor.replaceRange(
          modifiedLine,
          {line: line - 1, ch: 0},
          {line: line - 1, ch: originalLine.length}
        )

        this.trigger('apply-suggestion', [])
      })

      notif.on('different-suggestion', () => {
        NotificationView.send('info', 'Make different suggestion').open()
      })

      notif.on('dismiss', () => {
        NotificationView.send('info', 'Suggestion ignored').open()
      })

      notif.open()
    })
  }
}

export default EditorView
