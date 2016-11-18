'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HL_LINE_CLASS = 'active-line';

var EditorView = function () {
  function EditorView(wrapperElem) {
    var initialProgram = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

    _classCallCheck(this, EditorView);

    if (wrapperElem instanceof jQuery === false) {
      throw new Error('expected argument to new EditorView() to be a jQuery object');
    }

    // HTML element that the CodeMirror instance is embedded within
    this.wrapperElem = wrapperElem;

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
    });

    // Line number of the line currently highlighted. Set to -1 if no line highlighted
    this.highlightedLine = -1; // NOTE: 0-based line count

    this.frozen = false;
  }

  _createClass(EditorView, [{
    key: 'getProgram',
    value: function getProgram() {
      return this.editor.getValue();
    }
  }, {
    key: 'setProgram',
    value: function setProgram(newValue) {
      var clearHistory = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      if (typeof newValue !== 'string') {
        throw new Error('expected 1st arg. of EditorView.setProgram() to be a string');
      }

      this.editor.setValue(newValue);

      // If "clearHistory" is set, this will reset the editor's undo history
      // so that it won't be possible to use the undo command to reverse
      // changes made by "setValue"
      if (clearHistory === true) {
        this.editor.clearHistory();
      }
    }
  }, {
    key: 'freeze',
    value: function freeze() {
      this.frozen = true;
      this.editor.setOption('readOnly', 'nocursor');
    }
  }, {
    key: 'unfreeze',
    value: function unfreeze() {
      this.frozen = false;
      this.editor.setOption('readOnly', false);
      this.clearHighlightedLine();
    }
  }, {
    key: 'highlightLine',
    value: function highlightLine(lineNum) {
      if (this.frozen === false) {
        throw new Error('cannot highlight line until editor is frozen');
      }

      // Convert lineNum from 1-based to 0-based
      lineNum--;

      if (this.highlightedLine >= 0) {
        this.clearHighlightedLine();
      }

      var PADDING = 20; // pixels that should be in-view above & below the line

      this.editor.addLineClass(lineNum, 'gutter', HL_LINE_CLASS);
      this.editor.addLineClass(lineNum, 'background', HL_LINE_CLASS);
      this.editor.scrollIntoView({ line: lineNum, ch: 0 }, PADDING);
      this.highlightedLine = lineNum;
    }
  }, {
    key: 'clearHighlightedLine',
    value: function clearHighlightedLine() {
      if (this.highlightedLine === -1) {
        return;
      }

      this.editor.removeLineClass(this.highlightedLine, 'gutter', HL_LINE_CLASS);
      this.editor.removeLineClass(this.highlightedLine, 'background', HL_LINE_CLASS);
      this.highlightedLine = -1;
    }

    /*
    showSuggestion (range: Range, message: string, snippet: string, acceptFn, declineFn) {
      window.ConstantSuggestion(
        range,
        message.toString(),
        snippet.toString(),
        acceptFn,
        declineFn)
    }
    */

  }]);

  return EditorView;
}();

exports.default = EditorView;