import NotificationView from './notification-view'
import EventHandler from './event-handler'
import { diff_match_patch } from './external/diff-match-patch';

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
    let lineSuggestions = raw.split('\n');
    //Each element is array of size 2 where the first elem is the original line handle, and the 2nd elem is the suggestion line handle
    const lineHandles = [];
    //holds all text markings to allowing clearing later
    const markings = [];
    //for each suggestion, add a git diff view with the original line
    lineSuggestions.forEach((pair) => {
      if(pair == undefined || pair === ''){
        return;
      }
      const splitPair = pair.split('||||'); //potential vulnerability if code contains a ||||
      if(splitPair == undefined){
        return;
      }
      //TODO if no suggestions
      const suggestLineNum = splitPair[0];
      if (!suggestLineNum || !splitPair[1]) {
        return;
      }
      const originalLine = this.editor.getLine(suggestLineNum - 1);
      const originalLineWhitespace = originalLine.slice(0, originalLine.search(/\S/));
      const suggestion = `${originalLineWhitespace}${splitPair[1]}`;

      const dmp = new diff_match_patch();
      const diff = dmp.diff_main(originalLine, suggestion);
      dmp.diff_cleanupSemantic(diff);
      this.editor.replaceRange(
        `${originalLine}\n${suggestion}`,
        {line: suggestLineNum - 1, ch: 0},
        {line: suggestLineNum - 1, ch: originalLine.length}
      );
      const oriLine = this.editor.getLineHandle(suggestLineNum - 1);
      const suggestLine = this.editor.getLineHandle(suggestLineNum);
      lineHandles.push([oriLine, suggestLine]);
      this.editor.addLineClass(oriLine, 'background', 'LineDiffRemove');
      this.editor.addLineClass(suggestLine, 'background', 'LineDiffAdd');
      let oriStrIdx = 0;
      let suggestStrIdx = 0;
      for (let i = 0; i < diff.length; ++i) {
        if (diff[i][0] === -1) {
          const marking = this.editor.markText(
            {line: suggestLineNum - 1, ch: oriStrIdx},
            {line: suggestLineNum - 1, ch: oriStrIdx + diff[i][1].length},
            {className: 'CodeDiffRemove'}
          );
          markings.push(marking);
          oriStrIdx += diff[i][1].length;
        } else if (diff[i][0] === 1) {
          const marking = this.editor.markText(
            {line: suggestLineNum, ch: suggestStrIdx},
            {line: suggestLineNum, ch: suggestStrIdx + diff[i][1].length},
            {className: 'CodeDiffAdd'}
          );
          markings.push(marking);
          suggestStrIdx += diff[i][1].length;
        } else if (diff[i][0] === 0) {
          oriStrIdx += diff[i][1].length;
          suggestStrIdx += diff[i][1].length;
        }
      }
    });

    let notif = NotificationView.send('success', 'Apply Suggestion?', {
      code: '',
      large: true,
      actions: [
        { name: 'Apply', command: 'apply-suggestion' },
        { name: 'Cancel', command: 'cancel-suggestion' }
      ]
    });

    notif.on('apply-suggestion', () => {
      for (const marking of markings){ 
        marking.clear();
      }
      for (const lineHandle of lineHandles) {
        const lineNum = this.editor.getLineNumber(lineHandle[0]);
        //remove highlight
        this.editor.removeLineClass(lineNum);
        this.editor.removeLineClass(lineNum + 1);
        //delete original line
        this.editor.replaceRange(
          '',
          {line: lineNum, ch: 0},
          {line: lineNum + 1, ch: 0}
        );
      }
      this.trigger('apply-suggestion', [])
    });

    notif.on('cancel-suggestion', () => {
      NotificationView.send('info', 'Suggestion ignored').open()
    });

    notif.on('dismiss', () => {
      NotificationView.send('info', 'Suggestion ignored').open()
    });

    notif.open();

  }
}

export default EditorView
