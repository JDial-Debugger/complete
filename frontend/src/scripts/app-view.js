import ControlSurface from './control-surface'
import EditorView from './editor-view'
import Network from './network'
import NotificationView from './notification-view'
import DebugView from './debug-view'
import Storage from './storage'
import TracePayload from './trace-payload'
import DevtoolsView from './devtools-view'
import { extractAssertLinesFromCode } from './util';
import FunctionCorrectionView from './function-corrections-view'

class AppView {
  constructor () {
    this.edv = new EditorView(jQuery('.mp-editor'), '')
    this.fcv = new FunctionCorrectionView(jQuery('mp-corrections'));
    this.dv = new DebugView(jQuery('.mp-debug'))
    this.mcs = new ControlSurface(jQuery('.mp-controls'))

    // Properties for coordinating HTTP requests
    this.requestPending = true
    this.requestCancelled = false

    this._init()

    // Attaches clipboard event listeners to relavent Jdial devtools buttons
    DevtoolsView.initializeClipboard()
  }

  _init () {
    const traceAction = () => {
      this.mcs.disableCommands(['trace'])
      this.mcs.startSpinning('trace')
      this.mcs.enableCommands(['halt'])
      this.dv.setPending()

      // Clear any pending notifications under the assumption that they
      // were meant for a previous program
      NotificationView.flush()
      const [assertions, codeMinusAsserts] = extractAssertLinesFromCode(this.edv.getProgram());
      this.assertions = assertions;
      const payload = new TracePayload(this.edv.getProgram())

      //Compiler err: Displays a message to user informing about the line number and nature of the error
      const traceFail = (msg, lineNum, charNum) => {
        const errString = `
          Line: ${lineNum}\n
          Char: ${charNum}\n
          > ${msg}
        `;
        let notif = NotificationView.send('fatal', 'Uncaught Compiler Error', {
          large: true,
          details: errString,
        })
        notif.open()
      };
      axios.post('trace', { source: this.edv.getProgram() })
      .then(res => {
        console.log(res.data)
        this.mcs.stopSpinning('trace')
        DevtoolsView.setWholeTrace(res.data)
        this.dv.render(res.data)

      })
      .catch(err => {
        this.mcs.stopSpinning('trace')
        console.error(err);
        //send popup notification
        traceFail(err.msg, err.lineNum, err.charNum);
        //highlight text where error occurs
        const marking = this.edv.editor.markText(
          {line: err.lineNum - 1, ch: err.charNum - 1},
          {line: err.lineNum - 1, ch: err.charNum},
          {className: 'CodeDiffRemove'})

      })
      /*
      const getTrace = (err, whole) => {
        this.requestPending = false

        // If the "requestCancelled" field has been set between when the
        // request was dispatched and when the request was returned, cancel
        // any logic that would have been run with the request response. This
        // property was most likely set by the user clicking the "Halt" button
        // between when they clicked the "Run" button and when the trace was
        // returned from the server
        if (this.requestCancelled === true) {
          this.requestCancelled = false
          return
        }

        this.mcs.stopSpinning('trace')

        let trace = whole.trace

        DevtoolsView.setWholeTrace(whole)


        //Compiler err: Displays a message to user informing about the line number and nature of the error
        const traceFail = (msg, lineNum, charNum) => {
          const errString = `
            Line: ${lineNum}\n
            Char: ${charNum}\n
            > ${msg}
          `;
          let notif = NotificationView.send('fatal', 'Uncaught Compiler Error', {
            large: true,
            details: errString,
          })
          notif.open()
        };
        // Display appropriate notifications if there was an error or
        // the given trace was well-formed but contains a runtime error
        if (err !== null) {
          console.log(err);
          //send popup notification
          traceFail(err.msg, err.lineNum, err.charNum);
          //highlight text where error occurs
          const marking = this.edv.editor.markText(
            {line: err.lineNum - 1, ch: err.charNum - 1},
            {line: err.lineNum - 1, ch: err.charNum},
            {className: 'CodeDiffRemove'}
        );
        } else if (trace[trace.length - 1]['event'] === 'instruction_limit_reached') {
          let notif = NotificationView.send('fatal', 'Error generating trace', {
            large: true,
            code: trace[0]['exception_msg'],
            details: 'Trying again in a moment will likely fix this issue.',
            actions: [
              { name: 'Try Again', command: 'retry' }
            ]
          })

          notif.on('retry', () => {
            this.mcs.startSpinning('trace')
            Network.getTrace(payload, getTrace)
          })

          notif.on('dismiss', () => {
            throw new Error(trace[0]['exception_msg'])
          })

          notif.open()
        } else {
          this.dv.render(whole)
        }
      }*/

      // Reset the "requestCancelled" property before the request is issued so that
      // if the property is set between now and when the request response is received
      // the resonse can be ignored because the user no long wants it
      this.requestCancelled = false
      this.requestPending = true

      //Network.getTrace(payload, getTrace)
    }

    const suggestionAction = (payload) => {
      this.mcs.disableCommands(['trace']);
      this.mcs.startSpinning('trace');
      this.mcs.enableCommands(['halt']);

      payload.setAssertions(this.assertions);
      payload.focusedLines = this.edv.getFocusedLines();

      // Clear any pending notifications
      NotificationView.flush();

      const getSuggestion = (err, raw) => {
        this.requestPending = false

        // If the "requestCancelled" field has been set between when the
        // request was dispatched and when the request was returned, cancel
        // any logic that would have been run with the request response. This
        // property was most likely set by the user clicking the "Halt" button
        // between when they clicked the "Run" button and when the trace was
        // returned from the server
        if (this.requestCancelled === true) {
          this.requestCancelled = false
          return
        }

        this.mcs.stopSpinning('trace')

        if (err !== null) {
          // TODO
          NotificationView.send('fatal', 'Error getting suggestion').open()
        } else {
          try {
            this.edv.makeSuggestion(raw)
          } catch (err) {
            if (err.message === 'no suggestion') {
              NotificationView.send('alert', 'Could not make suggestion').open()
            } else {
              NotificationView.send('fatal', 'Unknown error analyzing suggestion response', {
                code: err.message,
                large: true
              }).open()
            }
          }
        }
      }

      this.requestCancelled = false
      this.requestPending = true

      Network.getSuggestion(payload, getSuggestion)
    }

    const haltAction = () => {
      this.mcs.enableCommands(['trace'])
      this.mcs.disableCommands(['halt'])
      this.dv.clear()
      this.edv.unfreeze()
      this.requestCancelled = true
      this.mcs.stopSpinning('trace')
      DevtoolsView.clearTraceData()
    }

    const debugAction = () => {
      DevtoolsView.showPanel()
    }

    const resetAction = () => {
      let [err, dropdownValue] = this.mcs.get('dropdown')

      if (err !== null) {
        console.error(err)
        return
      }

      Storage.setWorkingCopyFromBuiltin(dropdownValue, (err, value) => {
        if (err !== null) {
          console.error(err)
        } else {
          console.log(`loaded builtin program "${dropdownValue}"`)
          this.edv.setProgram(value)
          this.mcs.trigger('halt', [])
        }
      })
    }

    const suggestFuncAction = data => {
      const arraySuggest = Object.keys(data).map(lineNum => ({ lineNum, code: data[lineNum]}))
      this.edv.makeSuggestion(arraySuggest)
    }

    const dropdownAction = (dropdownValue) => {
      Storage.setWorkingCopyFromBuiltin(dropdownValue, (err, value) => {
        if (err !== null) {
          console.error(err)
        } else {
          console.log(`loaded builtin program "${dropdownValue}"`)
          this.edv.setProgram(value)
          this.mcs.trigger('halt', [])
        }
      })
    }

    this.mcs.on('trace', traceAction)
    this.mcs.on('halt', haltAction)
    this.mcs.on('debug', debugAction)
    this.mcs.on('reset', resetAction)
    this.mcs.on('dropdown', dropdownAction)

    this.edv.on('apply-suggestion', traceAction)

    this.dv.onRuntime('set-trace-point', (line) => {
      this.edv.freeze()
      this.edv.highlightLine(line)
    })

    this.dv.onRuntime('get-suggestion', suggestionAction)
    this.dv.onCorrection('new-suggestion', suggestFuncAction)

    // Handle loading either a default program or a saved program
    // the user has already been editing
    Storage.workingCopyExists((err, exists) => {
      if (err !== null) {
        console.error(err)
        return
      }

      if (exists) {
        // Use existing program from local storage
        Storage.getWorkingCopy((err, value) => {
          if (err !== null) {
            console.error(err)
          } else {
            console.log('loaded working copy from local storage')

            let matchingBuiltin = Storage.workingCopyMatchesBuiltin(value)

            if (typeof matchingBuiltin === 'string') {
              // Checks if a working copy is a perfect match for one of the
              // simple builtin programs. This gracefully handles the situation where
              // a builtin is loaded, not edited and the page reloads. The un-edited
              // program was stored in local storage but the selector should still
              // be set to the name of the builtin program
              try {
                this.mcs.set('dropdown', matchingBuiltin)
              } catch (err) {
                console.error(err)
              }
            } else {
              try {
                // If there exists a program in memory, set the control surface
                // dropdown to "custom". This will avoid the situation where a previously
                // edited program is loaded into the editor but the builtin program select
                // still displays the name of some builtin program
                this.mcs.set('dropdown', 'custom')
              } catch (err) {
                console.error(err)
              }
            }

            this.edv.setProgram(value, true)
          }
        })
      } else {
        // Use some default program built-in as a starting program
        Storage.setWorkingCopyFromBuiltin('tests', (err, value) => {
          if (err !== null) {
            console.error(err)
          } else {
            console.log('loaded default program as working copy')

            try {
              // Set the control surface dropdown to "tests" since the default
              // program being loaded is the "tests" program. Then any clicks on
              // the "Reset" button will reset the editor with the correct program
              this.mcs.set('dropdown', 'tests')
            } catch (err) {
              console.error(err)
            }

            this.edv.setProgram(value, true)
          }
        })
      }
    })

    // Set event listener so that before a user refreshes or closes the page,
    // the working copy of the edited program source code will be saved
    // inside the browser's local storage
    window.onbeforeunload = () => {
      Storage.setWorkingCopy(this.edv.getProgram(), (err, value) => {
        if (err !== null) {
          console.error(err)
        } else {
          console.log('saved working copy to local storage')
        }
      })
    }
  }
}

let app = new AppView()
window.app = app
