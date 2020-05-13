import EventHandler from './event-handler'

/**
 * Tab on the right side to switch between execution trace and function
 * corrections
 */
class DebugTab extends EventHandler {

  constructor (wrapperElem) {
    // Call EventHandler initialization code
    super();
    this.wrapperElem = wrapperElem
  }

  hide() {
      this.wrapperElem.hide()
  }

  show() {
      this.wrapperElem.show()
  }
}

export default DebugTab