import NotificationView from './notification-view'
import EventHandler from './event-handler'

const EXECUTING_LINE_CLASS = 'active-line'
const FOCUS_LINE_CLASS = 'focus-line'

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
      electricChars: false,
      gutters: ['gutter-focus', 'CodeMirror-linenumbers']
    })

    this.focusedLines = []

    // Line number of the line currently highlighted. Set to -1 if no line highlighted
    this.highlightedLine = -1 // NOTE: 0-based line count

    this.frozen = false

    this.editor.on('gutterClick', (cm, lineNum) => {
      if (this.frozen === false) {
        this.toggleLineFocus(lineNum)
      }
    })
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

    this.editor.addLineClass(lineNum, 'gutter', EXECUTING_LINE_CLASS)
    this.editor.addLineClass(lineNum, 'background', EXECUTING_LINE_CLASS)
    this.editor.scrollIntoView({line: lineNum, ch: 0}, PADDING)
    this.highlightedLine = lineNum
  }

  clearHighlightedLine () {
    if (this.highlightedLine === -1) {
      return
    }

    this.editor.removeLineClass(this.highlightedLine, 'gutter', EXECUTING_LINE_CLASS)
    this.editor.removeLineClass(this.highlightedLine, 'background', EXECUTING_LINE_CLASS)
    this.highlightedLine = -1
  }

  toggleLineFocus (lineNum) {
    let lineInfo = this.editor.lineInfo(lineNum)
    let focusIndex = this.focusedLines.indexOf(lineNum)

    if (focusIndex > -1) {
      this.editor.removeLineClass(lineNum, 'gutter', FOCUS_LINE_CLASS)
      this.editor.removeLineClass(lineNum, 'background', FOCUS_LINE_CLASS)
      this.focusedLines.splice(focusIndex, 1)
    } else {
      this.editor.addLineClass(lineNum, 'gutter', FOCUS_LINE_CLASS)
      this.editor.addLineClass(lineNum, 'background', FOCUS_LINE_CLASS)
      this.focusedLines.push(lineNum)
    }
  }

  clearFocusedLines () {
    this.focusedLines.forEach((lineNum) => {
      this.toggleLineFocus(lineNum)
    })
  }

  getFocusedLines () {
    return this.focusedLines.map(lineNum => lineNum + 1)
  }
  //raw should be in the form: <line number>||||<repair>\n <next pair>
  makeSuggestion (raw) {
    let match = raw.split('\n');

    let lineSuggestions = raw.split('\n');
    let lineNums = [];
    let suggestions = [];
    let requestStr = '';
    //for each suggestion, add a prompt to ask the user to update the given line
    lineSuggestions.forEach(function(pair) {
      if(pair == undefined || pair === ''){
        return;
      }
      let splitPair = pair.split('||||'); //potential vulnerability if code contains a ||||
      if(splitPair == undefined){
        return;
      }
      lineNums.push(parseInt(splitPair[0]))
      suggestions.push(splitPair[1])
      requestStr += `Change line ${splitPair[0]} to ${splitPair[1]}?\n`
    });

    let notif = NotificationView.send('success', 'Possible change', {
      code: requestStr,
      large: true,
      actions: [
        { name: 'Change', command: 'apply-suggestion' },
        { name: 'Try again', command: 'different-suggestion' }
      ]
    });

    notif.on('apply-suggestion', () => {
      for(let i = 0; i < lineNums.length; ++i){
        let originalLine = this.editor.getLine(lineNums[i] - 1)
        let trimOriLine = originalLine.trim()
        let modifiedLine = originalLine.split(trimOriLine)[0] + suggestions[i]
        this.editor.replaceRange(
          modifiedLine,
          {line: lineNums[i] - 1, ch: 0},
          {line: lineNums[i] - 1, ch: originalLine.length}
        )
      }
      this.trigger('apply-suggestion', [])
    })

    notif.on('different-suggestion', () => {
      NotificationView.send('info', 'Make different suggestion').open()
    })

    notif.on('dismiss', () => {
      NotificationView.send('info', 'Suggestion ignored').open()
    })

    notif.open()

  }
}

export default EditorView
