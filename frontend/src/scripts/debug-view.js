import RuntimeView from "./runtime-view";
import FunctionCorrectionView from "./function-corrections-view";
import ControlSurface from "./control-surface";
import EventHandler from './event-handler'

export const RUNTIME_TAB = 'runtime';
export const CORRECTION_TAB = 'correction';

class DebugView extends EventHandler {

  constructor (wrapperElem) {
    // Call EventHandler initialization code
    super();

    this.wrapperElem = wrapperElem
    this.cs = new ControlSurface(wrapperElem.find('.control-surface'))
    this.cs.disableCommands([ 'show-runtime', 'show-corrections' ])
    this.rtv = new RuntimeView(wrapperElem.find('.mp-runtime'))
    this.fcv = new FunctionCorrectionView(wrapperElem.find('.mp-corrections'))
    this.toggleTab(RUNTIME_TAB)
    this.cs.on('show-runtime', () => this.toggleTab(RUNTIME_TAB))
    this.cs.on('show-corrections', () => this.toggleTab(CORRECTION_TAB))
  }

  /**
   * Toggle either the runtime view or the function correction view
   * @param {string} tabName - the name of the view, either {@link RUNTIME_TAB}
   * or {@link CORRECTION_TAB}
   */
  toggleTab(tabName) {
    if (tabName === CORRECTION_TAB) {
        this.fcv.show()
        this.rtv.hide()
    } else {
        this.rtv.show()
        this.fcv.hide()
    }
  }

  onRuntime(name, listener) {
      this.rtv.on(name, listener)
  }

  onCorrection(name, listener) {
      this.fcv.on(name, listener)
  }

  /**
   * If this view is waiting for trace data
   */
  setPending() {
      this.toggleTab(RUNTIME_TAB)
      this.rtv.showPendingMessage()
  }

  /**
   * Clears both views and toggles to the runtime view
   */
  clear() {
      this.rtv.clear()
      this.fcv.clear()
      this.toggleTab(RUNTIME_TAB)
  }

  enableTabs() {
    this.cs.enableCommands([ 'show-runtime', 'show-corrections' ])
  }

  /**
   * Renders both the runtime view and function correction view (currently
   * selected tab will only be visible)
   * @param {Object} traceData - execution trace data
   */
  render(traceData) {
      this.rtv.render(traceData)
      this.fcv.setTrace(traceData)
      this.enableTabs()
  }
}

export default DebugView 