import EventHandler from './event-handler'

const SPINNER_ON_CLASS = 'show-spinner'
const SPINNING_CLASS = 'icon-spinning'

class ControlSurface extends EventHandler {
  constructor (wrapperElem) {
    // Call EventHandler initialization code
    super()

    if ((wrapperElem instanceof jQuery) === false ||
        jQuery(wrapperElem).hasClass('control-surface') === false) {
      throw new Error('expected arg. to be a jQuery object with class "control-surface"')
    }

    // Gather all the button elements within the control surface
    let buttonElems = jQuery(wrapperElem).find('.mp-control-button')
    this.commands = jQuery(buttonElems).toArray().reduce((hash, buttonElem) => {
      let command = jQuery(buttonElem).attr('data-command')
      super.declareEvent(command)
      hash[command] = buttonElem

      jQuery(buttonElem).on('click', () => {
        super.trigger(command, [])
      })

      return hash
    }, {})

    if (jQuery(wrapperElem).find('.spinner-wrapper').length !== 0) {
      this.spinner = jQuery(wrapperElem).find('.spinner-wrapper')
      this.spinnerOff()
    } else {
      this.spinner = null
    }

    if (jQuery(wrapperElem).find('.dropdown').length !== 0) {
      this.dropdown = jQuery(wrapperElem).find('.dropdown')
    } else {
      this.dropdown = null
    }
  }

  on (name, listener) {
    if (name === 'dropdown' && this.dropdown !== null) {
      jQuery(this.dropdown).on('change', () => {
        listener.apply({}, [null, jQuery(this).val()])
      })
    } else {
      super.on(name, listener)
    }
  }

  get (command) {
    if (command === 'dropdown') {
      if (this.dropdown !== null) {
        let dropdownValue = jQuery(this.dropdown).val()
        return [null, dropdownValue]
      }

      let err = new Error(`control surface lacks <select> to support "${command}"`)
      return [err, '']
    }

    let err = new Error(`command "${command}" is not available from this control surface`)
    return [err, '']
  }

  set (command, value) {
    switch (command) {
      case 'dropdown':
        if (this.dropdown === null) {
          throw new Error(`control surface lacks <select> to support "${command}"`)
        }

        // Check that the <select> has an <option> with a matching value
        if (jQuery(this.dropdown).find(`option[value="${value}"]`).length > 0) {
          jQuery(this.dropdown).val(value)
        } else {
          throw new Error(`<select> has no option with the value ${value}`)
        }

        break
      default:
        throw new Error(`command "${command}" is not available from this control surface`)
    }
  }

  startSpinning (command) {
    if (Object.keys(this.commands).includes(command) === false) {
      throw new Error(`command "${command}" is not availalbe from this control surface`)
    }

    jQuery(this.commands[command]).addClass(SPINNING_CLASS)
  }

  stopSpinning (command) {
    if (Object.keys(this.commands).includes(command) === false) {
      throw new Error(`command "${command}" is not availalbe from this control surface`)
    }

    jQuery(this.commands[command]).removeClass(SPINNING_CLASS)
  }

  disableCommands (commands) {
    if (Array.isArray(commands) === false) {
      throw new Error('1st argument of ControlSurface.disableActions must be an array')
    }

    commands.forEach((command) => {
      if (Object.keys(this.commands).includes(command) === false) {
        throw new Error(`command "${command}" is not available from this control surface`)
      }

      // Disable the button
      jQuery(this.commands[command])
        .attr('disabled', true)
    })
  }

  enableCommands (commands) {
    if (Array.isArray(commands) === false) {
      throw new Error('1st argument of ControlSurface.enableCommands must be an array')
    }

    commands.forEach((command) => {
      if (Object.keys(this.commands).includes(command) === false) {
        throw new Error(`command "${command}" is not available from this control surface`)
      }

      // Enable the button
      jQuery(this.commands[command])
        .attr('disabled', false)
    })
  }

  spinnerOn () {
    if (this.spinner !== null) {
      jQuery(this.spinner).addClass(SPINNER_ON_CLASS)
    }
  }

  spinnerOff () {
    if (this.spinner !== null) {
      jQuery(this.spinner).removeClass(SPINNER_ON_CLASS)
    }
  }
}

export default ControlSurface
