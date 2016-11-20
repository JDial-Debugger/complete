import ControlSurface from './control-surface'
import EditorView from './editor-view'
import Network from './network'
import NotificationView from './notification-view'
import RuntimeView from './runtime-view'
import Storage from './storage'
import TracePayload from './trace-payload'

class AppView {
  constructor () {
    this.edv = new EditorView(jQuery('.mp-editor'), '')
    this.rtv = new RuntimeView(jQuery('.mp-runtime'))
    this.mcs = new ControlSurface(jQuery('.mp-controls'))

    // Properties for coordinating HTTP requests
    this.requestPending = true
    this.requestCancelled = false

    this._init()
  }

  _init () {
    const traceAction = () => {
      this.mcs.disableCommands(['trace'])
      this.mcs.startSpinning('trace')
      this.mcs.enableCommands(['halt'])
      this.rtv.showPendingMessage()

      // Clear any pending notifications under the assumption that they
      // were meant for a previous program
      NotificationView.flush()

      const payload = new TracePayload(this.edv.getProgram(), '')

      const getTrace = (err, trace) => {
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
        this.mcs.enableCommands(['debug'])

        // Display appropriate notifications if there was an error or
        // the given trace was well-formed but contains a runtime error
        if (err !== null) {
          // TODO
          NotificationView.send('fatal', 'Bad trace!').open()
          throw err
        } else if (trace[0]['event'] === 'instruction_limit_reached') {
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
          this.rtv.render(trace)
        }
      }

      // Reset the "requestCancelled" property before the request is issued so that
      // if the property is set between now and when the request response is received
      // the resonse can be ignored because the user no long wants it
      this.requestCancelled = false
      this.requestPending = true

      Network.getTrace(payload, getTrace)
    }

    const haltAction = () => {
      this.mcs.enableCommands(['trace'])
      this.mcs.disableCommands(['halt', 'debug'])
      this.rtv.clear()
      this.edv.unfreeze()
      this.requestCancelled = true
      this.mcs.stopSpinning('trace')
    }

    const debugAction = () => {
      let popup = jQuery('<div id="debug-popup"></div>')
      jQuery('body').append(popup)

      let textarea1 = jQuery(`<textarea>${JSON.stringify(window.parsedTrace, null, '  ')}</textarea>`)
      let textarea2 = jQuery(`<textarea>${JSON.stringify(window.moddedPoint, null, '  ')}</textarea>`)

      popup.append(textarea1)
      popup.append(textarea2)
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
        }
      })
    }

    const dropdownAction = (dropdownValue) => {
      Storage.setWorkingCopyFromBuiltin(dropdownValue, (err, value) => {
        if (err !== null) {
          console.error(err)
        } else {
          console.log(`loaded builtin program "${dropdownValue}"`)
          this.edv.setProgram(value)
        }
      })
    }

    this.mcs.on('trace', traceAction)
    this.mcs.on('halt', haltAction)
    this.mcs.on('debug', debugAction)
    this.mcs.on('reset', resetAction)
    this.mcs.on('dropdown', dropdownAction)

    this.rtv.on('set-trace-point', (line) => {
      this.edv.freeze()
      this.edv.highlightLine(line)
    })

    this.rtv.on('get-advice', () => {
      traceAction()
    })

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
