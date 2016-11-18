class EventHandler {
  constructor () {
    this.events = {}
  }

  declareEvent (name) {
    // Create a new property in the "events" object if it
    // doesn't exist already
    if (this.events.hasOwnProperty(name) === false || Array.isArray(this.events[name]) === false) {
      this.events[name] = []
    }
  }

  on (name, listener) {
    if (typeof listener !== 'function') {
      throw new Error('expected 2nd arg. to be of type "function"')
    }

    if (this.events.hasOwnProperty(name) === false) {
      throw new Error(`"${name}" is not a recognized event`)
    }

    // Add the event listening function to the list
    this.events[name].push(listener)
  }

  off (name, listener) {
    if (typeof listener !== 'function') {
      throw new Error('expected 2nd arg. to be of type "function"')
    }

    if (this.events[name].hasOwnProperty(name) === false) {
      throw new Error(`"${name}" is not a recognized event`)
    }

    if (this.events[name].includes(listener) === false) {
      throw new Error('event listener has not been attached yet')
    }

    // Get the index of the listener in the list of registered event listeners
    let index = this.events[name].indexOf(listener)

    // Remove that event listener function from the list
    this.events[name].splice(index, 1)
  }

  trigger (name, payload) {
    if (this.events.hasOwnProperty(name) === false && Array.isArray(this.events[name]) === false) {
      throw new Error(`"${name}" is not a recognized event`)
    }

    // Call each event listener with the given payload
    this.events[name].forEach((listener) => {
      listener.apply({}, payload)
    })
  }
}

export default EventHandler
