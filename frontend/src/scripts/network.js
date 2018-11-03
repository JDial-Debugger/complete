import NotificationView from './notification-view'

class Network {
  static getTrace (payload, cb) {
    const ajaxDone = (res) => {
      return void cb(null, res)
    }

    const ajaxFail = (err) => {
      let notif = NotificationView.send('fatal', 'Network error getting trace2', {
        large: true,
        details: 'Trying again in a moment will likely fix this issue.',
        actions: [
          { name: 'Try Again', command: 'retry' }
        ]
      })

      notif.on('retry', () => {
        // Call "getTrace" again with same arguments
        Network.getTrace(payload, cb)
      })

      notif.on('dismiss', () => {
        // Notification has been dismissed without using the "Try Again" action
        cb(err, [])
      })

      notif.open()
    }

    superagent
    .post('/trace')
    .send(payload.stringify())
    .end((err, res) => {
      if (err || res.ok !== true) {
        ajaxFail(err)
      } else {
        let parsedTrace = {}

        try {
          parsedTrace = JSON.parse(res.text)
        } catch (err) {
          ajaxFail()
        }

        ajaxDone(parsedTrace)
      }
    })
  }

  static getSuggestion (payload, cb) {
    const ajaxDone = (res) => {
      return void cb(null, res)
    }

    const ajaxFail = (err) => {
      let notif = NotificationView.send('fatal', 'Network error getting trace1', {
        large: true,
        details: 'Trying again in a moment will likely fix this issue.',
        actions: [
          { name: 'Try Again', command: 'retry' }
        ]
      })

      notif.on('retry', () => {
        // Cal "getSuggestion" again with same arguments
        Network.getSuggestion(payload, cb)
      })

      notif.on('dismiss', () => {
        // Notification has been dismissed without using the "Try Again" action
        cb(err, [])
      })

      notif.open()
    }
  //  console.log('payload:', payload.stringify())
    superagent
    .post('/suggest')
    .send(payload.stringify())
    .end((err, res) => {
      if (err || res.ok !== true) {
        ajaxFail(err)
      } else {
        ajaxDone(res.text)
      }
    })
  }
}

export default Network
