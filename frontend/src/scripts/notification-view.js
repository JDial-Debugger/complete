import EventHandler from './event-handler'
import { htmlBuilder, sanitize } from './util'

const NOTIF_TYPES = [
  'fatal',
  'alert',
  'info',
  'success'
]

class Notification extends EventHandler {
  constructor (parentElem, type, title, opts) {
    super()

    // Triggered when the notification is resolved with no actions
    super.declareEvent('dismiss')

    // Triggered WHENEVER a notification is resolved
    super.declareEvent('close')

    if (NOTIF_TYPES.includes(type) === false) {
      throw new Error(`"${type}" is an invlaid notification type`)
    }

    this.parent = parentElem
    this.type = type
    this.title = sanitize(title)
    this.large = opts.large === true

    if (typeof opts.code === 'string') {
      this.hasCode = true
      this.code = sanitize(opts.code).replace('\n', '<br>')
    } else {
      this.hasCode = false
      this.code = ''
    }

    if (typeof opts.details === 'string') {
      this.hasDetails = true
      this.details = sanitize(opts.details)
    } else {
      this.hasDetails = false
    }

    this.actions = []

    if (Array.isArray(opts.actions)) {
      this.actions = opts.actions.reduce((actions, action) => {
        if (action.hasOwnProperty('name') && action.hasOwnProperty('command') &&
          typeof action.name === 'string' && typeof action.command === 'string') {
          // Add just the action "name" and "command" to the list of notification actions
          actions = actions.concat({
            name: action.name,
            command: action.command
          })

          // Add the command to the list of accepted event commands
          super.declareEvent(action.command)
        }

        return actions
      }, [])
    }

    this.expired = false
  }

  on (name, listener) {
    if (this.expired === true) {
      throw new Error('notification has expired')
    }

    super.on(name, listener)
  }

  trigger (name, payload) {
    if (this.expired === true) {
      throw new Error('notification has expired')
    }

    super.trigger(name, payload)
  }

  open () {
    if (this.expired === true) {
      throw new Error('notification has expired')
    }

    if ((this.parent instanceof jQuery) === false) {
      throw new Error('notification has not parent element')
    }

    let html = ''

    html += htmlBuilder.div({
      classes: ['notif', this.type, this.large ? 'large' : ''],
      children: [
        htmlBuilder.div('tag'),

        this.large ? htmlBuilder.button({
          classes: 'dismiss',
          title: 'Dismiss',
          children: ''
        }) : '',

        htmlBuilder.div({
          classes: 'content',
          children: [
            htmlBuilder.p('title', this.title),

            this.hasCode ? htmlBuilder.code({children: this.code}) : '',

            this.hasDetails ? htmlBuilder.p('details', this.details) : '',

            this.actions.length > 0 ? this.actions.reduce((html, action, index) => {
              return html + htmlBuilder.button({
                classes: 'action',
                'data-command': action.command,
                children: action.name
              })
            }, '') : ''
          ]
        })
      ]
    })

    let elem = jQuery(html)

    elem.find('button.dismiss').on('click', () => {
      try {
        // Ensure that even if an error within the trigger method
        // throws an error, the notification will still close
        this.trigger('dismiss', [])
      } finally {
        this.close()
      }
    })

    elem.find('button[data-command]').on('click', (event) => {
      let btn = jQuery(event.currentTarget)

      let command = btn.attr('data-command')

      if (typeof command === 'string') {
        try {
          // Ensure that even if an error within the trigger method
          // throws an error, the notification will still close
          this.trigger(command, [])
        } finally {
          this.close()
        }
      }
    })

    this.elem = elem
    jQuery(this.parent).append(elem)

    if (this.large === false) {
      setTimeout(() => {
        this.close()
      }, 4000)
    }
  }

  close () {
    if ((this.elem instanceof jQuery) === false) {
      return false
    }

    // The addition of the "close" class triggers the
    // notification's exit animation
    this.elem.addClass('close')

    // Run the tear-down code when the notification's
    // exit animation has finished running
    setTimeout(() => {
      if (this.elem !== null) {
        this.elem.remove()
      }

      this.elem = null
      this.parent = null
      this.expired = true
    }, 300)
  }
}

const NOTIF_VIEW_SELECTOR = '.notif-bucket'

let pendingNotifications = []

class NotificationView {
  static getElem () {
    return jQuery(NOTIF_VIEW_SELECTOR)
  }

  static send (type, title, opts = {}) {
    let elem = NotificationView.getElem()
    let notif = new Notification(elem, type, title, opts)

    pendingNotifications.push(notif)
    notif.on('close', () => {
      let index = pendingNotifications.indexOf(notif)
      pendingNotifications.splice(index, 1)
    })

    return notif
  }

  static flush () {
    pendingNotifications.forEach((notif) => {
      notif.close()
    })
  }
}

export default NotificationView
