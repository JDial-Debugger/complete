import EventHandler from './event-handler'

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