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

  /*
   * @author - Matt Kramer (matthewthekramer)
   * @summary Adds preceeding whitespace to the suggestion code to match the original line
   * @param originalLineText {string} - the full line of code that the suggestion is targeting
   * @param suggestionText {string} - the suggestion code (no leading whitespace)
  */
  getSuggestionLine(originalLineText, suggestionText) {
    const originalLineWhitespace = originalLineText.slice(0, originalLineText.search(/\S/));
    return `${originalLineWhitespace}${suggestionText}`;

  }
  
  /*
  * @author - Matt Kramer (matthewthekramer)
   * @summary adds red/green highlighting to parts of the code that differ similar to github diffs
   * @param diff {Array<Array<integer, string>>} In format of Google's diff_match_patch output, read
   *        here https://github.com/google/diff-match-patch/wiki/API#diff_maintext1-text2--diffs
   * @param originalLineNum {integer} - Line number of the original code
   * @param suggestionLineNum {integer} - Line number of the newly inserted suggestion code
   * @return {Array<marking>} - a list of the markings made to the editor (can use this to clear them later)
   * read here about markings https://codemirror.net/doc/manual.html#api_marker
  */
  styleSuggestionDiff(diff, originalLineNum, suggestionLineNum) {
    let oriStrIdx = 0;
    let suggestStrIdx = 0;
    const markings = [];

    for (let i = 0; i < diff.length; ++i) {
      if (diff[i][0] === -1) {
        const marking = this.editor.markText(
          {line: originalLineNum, ch: oriStrIdx},
          {line: originalLineNum, ch: oriStrIdx + diff[i][1].length},
          {className: 'CodeDiffRemove'}
        );
        markings.push(marking);
        oriStrIdx += diff[i][1].length;

      } else if (diff[i][0] === 1) {
        const marking = this.editor.markText(
          {line: suggestionLineNum, ch: suggestStrIdx},
          {line: suggestionLineNum, ch: suggestStrIdx + diff[i][1].length},
          {className: 'CodeDiffAdd'}
        );
        markings.push(marking);
        suggestStrIdx += diff[i][1].length;

      } else if (diff[i][0] === 0) {
        oriStrIdx += diff[i][1].length;
        suggestStrIdx += diff[i][1].length;
      }
    }
    return markings;

  }
  /*
   * @author - Matt Kramer (matthewthekramer)
   * @param raw {string} - raw string suggestions in the form: <line number>||||<repair>\n <next pair></next>
   * @return {Array<LineSuggestion>} - Each element is an object with a lineNum and code property specifying which
   *          lines need to have the updated code for the suggestion to be correct
   */
  getLineSuggestionsFromRaw (raw)  {
    const lineSuggestionsRaw = raw.split('\n');
    return lineSuggestionsRaw.map(rawLine => {
      if (!rawLine || rawLine === '') {
        return;
      }
      const rawSplit = rawLine.split('||||');
      if (!rawSplit) {
        return;
      }
      return {
        lineNum: rawSplit[0],
        code: rawSplit[1],
      };
    });

  }
  
  /*
   * @summary - Displays a suggestion to the user in a git diff style, asking for confirmation before applying this to the code
   * @param raw {string} - raw string suggestions in the form: <line number>||||<repair>\n <next pair></next>
    */
  makeSuggestion (raw) {
    const lineSuggestions = this.getLineSuggestionsFromRaw(raw);
    if (!lineSuggestions || lineSuggestions.length === 0) {
      return;
    }
    //Each element is array of size 2 where the first elem is the original line handle, and the 2nd elem is the suggestion line handle
    const lineHandles = [];
    //Keeps track of highlights on the diffs so we can clear later
    let markings = [];
    //for each suggestion, add a git diff view with the original line
    for (const lineSuggestion of lineSuggestions) {
      if (!lineSuggestion 
            || lineSuggestion.lineNum < 0 
            || lineSuggestion.code === ''){
        continue;
      }

      const originalLineText = this.editor.getLine(lineSuggestion.lineNum - 1);
      const suggestionLineText = this.getSuggestionLine(originalLineText, lineSuggestion.code);

      //insert the suggestion line
      this.editor.replaceRange(
        `${originalLineText}\n${suggestionLineText}`,
        {line: lineSuggestion.lineNum - 1, ch: 0},
        {line: lineSuggestion.lineNum - 1, ch: originalLineText.length}
      );

      const originalLineHandle = this.editor.getLineHandle(lineSuggestion.lineNum - 1);
      const suggestionLineHandle = this.editor.getLineHandle(lineSuggestion.lineNum);
      lineHandles.push([originalLineHandle, suggestionLineHandle]);

      //get diff between original and suggestion
      const dmp = new diff_match_patch();
      const diff = dmp.diff_main(originalLineText, suggestionLineText);
      
      this.editor.addLineClass(originalLineHandle, 'background', 'LineDiffRemove');
      this.editor.addLineClass(suggestionLineHandle, 'background', 'LineDiffAdd');

      markings = this.styleSuggestionDiff(diff, lineSuggestion.lineNum - 1, lineSuggestion.lineNum);
    };

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
        this.editor.removeLineClass(lineNum, 'background', 'LineDiffRemove');
        this.editor.removeLineClass(lineNum + 1, 'background', 'LineDiffAdd');
        //delete original line
        this.editor.replaceRange(
          '',
          {line: lineNum, ch: 0},
          {line: lineNum + 1, ch: 0}
        );
      }
      this.trigger('apply-suggestion', [])
    });

    const deleteSuggestionLine = () => {
      for (const marking of markings){ 
        marking.clear();
      }
      for (const lineHandle of lineHandles) {
        const lineNum = this.editor.getLineNumber(lineHandle[0]);
        //remove highlight
        this.editor.removeLineClass(lineNum, 'background', 'LineDiffRemove');
        this.editor.removeLineClass(lineNum + 1, 'background', 'LineDiffAdd');
        //delete original line
        this.editor.replaceRange(
          '',
          {line: lineNum + 1, ch: 0},
          {line: lineNum + 2, ch: 0}
        );
      }
      NotificationView.send('info', 'Suggestion ignored').open()
    }
    notif.on('cancel-suggestion', deleteSuggestionLine);

    notif.on('dismiss', deleteSuggestionLine);
    notif.open();

  }
}

export default EditorView
