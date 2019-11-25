import NotificationView from './notification-view'

class Network {
  /*
   * @summary - Checks for errors in the trace (e.g. a compile error in the code)
   * @param traceLines {Array<Object>} - An array where each element is a trace in the format 
   *        as shown in https://github.com/pgbovine/OnlinePythonTutor/blob/master/v3/docs/opt-trace-format.md
   * @return lineError {Object} - undefined if no errors, otherwise an object containing fields with relevant error info
   * @return lineError.lineNum {integer} - the line the error occured on
   * @return lineError.charNum {integer} - the index on the line the error occured on
   * @return lineError.msg {string} - the compiler message about the error
   */
  static checkTraceForSyntaxErrors(traceLines) {
    if (traceLines.length === 1 && traceLines[0].event === "uncaught_exception") {
      return {
        lineNum: traceLines[0].line,
        charNum: traceLines[0].offset,
        msg: traceLines[0].exception_msg,
      }
    }
  }
  static getTrace (payload, cb) {
    const ajaxDone = (res) => {
      return void cb(null, res)
    }

    const ajaxFail = err => {
      let notif = NotificationView.send('fatal', 'Network error getting trace', {
        large: true,
        details: 'Trying again in a moment will likely fix this issue.',
        actions: [
          { name: 'Try Again', command: 'retry' }
        ]
      })

      notif.on('retry', () => {
        // Call "getTrace" again with same arguments
        Network.getTrace(payload, cb);
      })

      notif.on('dismiss', () => {
        // Notification has been dismissed without using the "Try Again" action
        cb(err, [])
      })

      notif.open()
    };

    superagent
    .post('/trace')
    .send(payload.stringify())
    .end((err, res) => {
      console.log('Trace response', res)
      console.log('Trace error', err)
      if (err || res.ok !== true) {
        ajaxFail(err)
      } else {
        let parsedTrace = {}

        try {
          parsedTrace = JSON.parse(res.text)
          const error = this.checkTraceForSyntaxErrors(parsedTrace.trace);
          if (error) {
            cb(error, []);
            return;
          }
        } catch (err) {
          console.log('Ajax fail', err)
          ajaxFail()
        }

        ajaxDone(parsedTrace)
      }
    })
  }

  static getSuggestion (payload, cb) {
    const ajaxDone = (res) => {
      console.log(res);
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
      console.log('suggest response', res)
      console.log('suggest error', err)
      if (err || res.ok !== true) {
        ajaxFail(err)
      } else {
        ajaxDone(res.text)
      }
    })
  }
}

export default Network
