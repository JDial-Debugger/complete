import DevtoolsView from './devtools-view'
import EventHandler from './event-handler'
import ControlSurface from './control-surface'
import NotificationView from './notification-view'
import SuggestionPayload from './suggestion-payload'
import { htmlBuilder, sanitize } from './util'

class RuntimeView extends EventHandler {
  constructor (wrapperElem) {
    // Call EventHandler initialization code
    super()

    // Attach events to the RuntimeView's control surface
    this.cs = new ControlSurface(wrapperElem.find('.control-surface'))
    this.cs.disableCommands([
      'step-backward',
      'step-forward',
      'jump-start',
      'jump-end'
    ])

    // Listen for clicks to the step-backward button on the control surface to
    // move the trace's execution point backward by 1. If the user is already at
    // the start of the trace, the point stays the same
    this.cs.on('step-backward', () => {
      if (this.rendered === true && this.index - 1 >= 0) {
        this.setVisiblePoint(this.index - 1)
      }
    })

    // Listen for clicks to the step-forward button on the control surface to
    // move the trace's execution point forward by 1. If the user is already at
    // the end of the trace, the point stays the same
    this.cs.on('step-forward', () => {
      if (this.rendered === true && this.index + 1 < this.trace.length) {
        this.setVisiblePoint(this.index + 1)
      }
    })

    this.cs.on('jump-start', () => {
      if (this.rendered === true && this.trace.length > 1) {
        this.setVisiblePoint(0)
      }
    })

    this.cs.on('jump-end', () => {
      if (this.rendered === true && this.trace.length > 1) {
        this.setVisiblePoint(this.trace.length - 1)
      }
    })

    // Set "wrapperElem" property & significant children elements
    this.wrapperElem = wrapperElem
    this.visualizationElem = wrapperElem.find('.trace-visualization')
    this.variablesElem = wrapperElem.find('.variables-wrapper')

    if (this.visualizationElem.length < 1) {
      throw new Error('missing .trace-visualization element')
    }

    if (this.variablesElem.length < 1) {
      throw new Error('missing .variables-wrapper element')
    }

    // Define events that can be emitted by RuntimeView objects. set-trace-point
    // events are emitted whenever the user changes the currently viewed
    // execution point. get-suggestion events are emitted whenever the user has
    // specified a variable's target value and indicates that they want the app
    // to suggest some changes
    super.declareEvent('set-trace-point')
    super.declareEvent('get-suggestion')

    // A boolean flag indicating whether this view is populated with program
    // trace data. If it isn't populated, the step-forward and step-backward
    // buttons won't trigger any actions
    this.rendered = false

    // A cached copy of the current trace & scope data
    this.trace = []
    this.scope = {}

    // Current trace point being displayed
    this.index = 0

    // Display "pending" messages in the visualization and variable views
    this.showPendingMessage()
  }

  render (whole) {
    let trace = whole.trace;

    //For each function call in the execution, saves what value the user 
    //has locked the return value as for debugging
    this.lockedReturnValues = []

    if (Array.isArray(trace) === false) {
      throw new Error(`trace must be an array, received ${typeof trace}`)
    }

    // The visualization of the execution trace is built last-to-first
    // so that function return values can be collected before their
    // signature, argument, and return values have to be added to the
    // visualization. A stack of return values is kept as the trace is
    // traversed so whenever a "call" event is encountered, the topmost
    // return value is popped and used as the return value.
    // These function return values are used to populate the 'lock' fields
    // initially
    let returnValueStack = []

    let html = ''

    html += htmlBuilder([
      '<div class="scope top-level">',
      '<ol class="execution">'
    ])

    html += trace.reduceRight((html, point, index) => {
      let lineNum = sanitize(point['line'])
      let pointHtml = ''

      switch (point['event']) {
        case 'instruction_limit_reached':
          NotificationView.send('fatal', 'VM reached instruction limit', {
            large: true,
            code: point['exception_msg']
          }).open()

          return html

        case 'call':
          // Collect a list of the function call's argument values
          let args = {}

          try {
            args = point['stack_to_render'][0]['encoded_locals']
          } catch (err) {
            throw new Error(`cannot get local variables of point ${index}`)
          }

          let argsHtml = Object.keys(args).reduce((html, argName) => {
            // Ignore any argument names that are part of prototype objects
            if (args.hasOwnProperty(argName) === false) {
              return html
            }

            return html.concat(htmlBuilder([
              htmlBuilder.span('sig-name', argName),
              htmlBuilder.span('sig-syntax', ':'),
              htmlBuilder.span('sig-value', `${args[argName]}`),
            ]))
          }, []).join(htmlBuilder.span('sig-syntax', ','))

          let funcName = sanitize(point['func_name'])
          let returnData = returnValueStack.pop()

          //possible for a return statement to not exist if an exception occurs
          let returnValueStr = returnData && returnData.value ? sanitize(returnData.value.toString()) : undefined;
          this.lockedReturnValues[index] = {
            value: returnValueStr, 
            isLocked: false
          };

          pointHtml = htmlBuilder([
            // Render only the open tag since the closing tag was rendered
            // when the corresponding "return" trace point was rendered
            //or when the corresponding "exception" trace point was rendered
            '<li class="point call expanded">',

            // Hidden radio button used to ensure that there can't be more
            // than 1 trace point selected at a time
            htmlBuilder.input({
              type: 'radio',
              id: `point-${index}`,
              classes: ['point-radio-button'],
              name: 'point',
              value: index,
              'data-line': lineNum
            }),

            // Label element is the visual representation of the trace point
            // on screen including the function signature and the line-dot icon
            htmlBuilder.label({
              classes: ['func-sig'],
              for: `point-${index}`,
              children: [
                htmlBuilder.span('sig-method', `${funcName}`),
                htmlBuilder.span('sig-syntax', '('),
                argsHtml,
                htmlBuilder.span('sig-syntax', ')'),
                returnValueStr ? htmlBuilder.span('sig-syntax', '&xrArr;') : '',
                returnValueStr ? htmlBuilder.span({
                  classes: ['sig-value', 'field', 'sig-return-value'],
                  children: htmlBuilder.input({
                    id: `sig-assert-return`,
                    value: returnValueStr,
                  }),
                  'data-point': returnValueStr
                }) : '',
                htmlBuilder.button({
                  id: `func-return-lock-${index}`,
                  classes: ['action-button'],
                  children: 'Lock Return'
                })
              ]
            }),

            // Render only the open tags since the closing tags were rendered
            // when the corresponding "return" trace point was rendered
            '<div class="scope">',
            '<ol class="execution">'
          ])

          return pointHtml + html

        case 'return':
        case 'step_line':
          let isReturn = (point['event'] === 'return')

          // If this point is a return point, append the return value
          // to the stack of return values so the corresponding "call" trace
          // point can use that value in its function signature
          if (isReturn) {
            let returnValue = 'VOID'

            try {
              returnValue = point['stack_to_render'][0]['encoded_locals']['__return__']
            } catch (err) {
              NotificationView.send('fatal', 'Malformed execution trace', {
                large: true,
                code: 'trace point ' + index + ' has type "return" but no `__return__` field',
                details: 'Try running "Trace" again'
              }).open()

              throw new Error(`cannot get "__return__" field of point ${index}`)
            }

            returnValueStack.push({
              value: returnValue,
              line: point.line || -1,
              index: index
            })
          }

          pointHtml = htmlBuilder([
            htmlBuilder.li('point', [
              htmlBuilder.input({
                type: 'radio',
                id: `point-${index}`,
                classes: ['point-radio-button'],
                name: 'point',
                value: index,
                'data-line': lineNum
              }),
              htmlBuilder.label({
                for: `point-${index}`
              })
            ]),

            // Closing tags that correspond to open tags rendered for the
            // corresponding "call" trace point
            isReturn ? '</ol>' : '',
            isReturn ? '</div>' : '',
            isReturn ? '</li>' : ''
          ])

          return pointHtml + html
        //if a runtime exception was thrown in this point
        case 'exception':
          console.log('exception in trace index', point)
          const notif = NotificationView.send('fatal', 'Runtime exception occured ', {
            large: true,
            details: `${point.exception_msg} at ${point.stack_to_render.map(frame => frame.func_name).join(", ")}`,
          })
          notif.open()
          pointHtml = htmlBuilder([
            htmlBuilder.li('point', [
              htmlBuilder.input({
                type: 'radio',
                id: `point-${index}`,
                classes: ['point-radio-button', 'point-exception'],
                name: 'point',
                value: index,
                'data-line': lineNum
              }),
              htmlBuilder.p({
                classes: ['exception'],
                for: `point-${index}`,
                children: `Exception ${point.exception_msg}`,
              })
            ]),
            // Closing tags that correspond to open tags rendered for the
            // corresponding "call" trace point
            '</ol>',
            '</div>', 
            '</li>'
          ])
          return pointHtml + html;

        default:
          console.error(point)
          throw new Error(`cannot handle point at index ${index}`)
      }
    }, '')

    html += htmlBuilder([
      '</div>',
      '</ol>'
    ])

    // Insert the HTML into the DOM
    this.visualizationElem.html(html)

    // Attach event listeners to the newly created visualization HTML
    this.visualizationElem.find('.scope input[type="radio"]').on('click', (event) => {
      let id = jQuery(event.currentTarget).attr('id')
      let index = parseInt(id.replace('point-', ''), 10)

      // Ensure that no corrosive values like NaN escape into the rest of the logic
      if (isNaN(index)) {
        index = 0
      }

      this.setVisiblePoint(index)
    })
    //Attach event listeners to lock buttons
    this.visualizationElem.find('.func-sig > button').on('click', (event) => {
      const id = jQuery(event.currentTarget).attr('id')
      const index = parseInt(id.replace('func-return-lock-', ''))
      if (!this.lockedReturnValues[index]) {
        return;
      }
      const wasLocked  = this.lockedReturnValues[index].isLocked;
      if (wasLocked) {
        jQuery(event.currentTarget).removeClass('button-return-locked')
      } else {
        jQuery(event.currentTarget).addClass('button-return-locked')
      }
      this.lockedReturnValues[index].isLocked = !wasLocked; 

    })


    // Cache the trace data
    this.whole = whole
    this.trace = trace

    // Set the "rendered" flag to true
    this.rendered = true

    this.initializeVariableView()

    // View the first execution point
    this.setVisiblePoint(0)

    // Enable forward, backward navigation buttons
    this.cs.enableCommands([
      'step-backward',
      'step-forward',
      'jump-start',
      'jump-end'
    ])
  }

  showPendingMessage () {
    const html = '<p class="pending">waiting for execution trace&hellip;</p>'
    this.rendered = false

    this.visualizationElem.html(html)
    this.variablesElem.html(html)
  }

  clear () {
    // Reset stateful properties of the view
    this.rendered = false
    this.trace = []
    this.scope = {}
    this.index = 0

    // Disable commands since there's not data to manipulate
    this.cs.disableCommands([
      'step-backward',
      'step-forward',
      'jump-start',
      'jump-end'
    ])

    // Replace any HTML embedded in the trace or variable views with
    // a basic "pending" message
    this.showPendingMessage()
  }

  setVisiblePoint (index, focus) {
    if (this.rendered === true) {
      if (index >= this.trace.length || index < 0) {
        throw new Error(`index ${index} is out of range`)
      }

      let radioButton = this.wrapperElem.find(`.point-radio-button:eq(${index})`)
      let line = parseInt(radioButton.attr('data-line'))

      if (isNaN(line)) {
        throw new Error(`button at index ${index} has corrupted "data-line" property`)
      }

      // If everything checks out, commit to the change
      this.index = index
      radioButton.prop('checked', true)
      this.setVisibleScope(index)
      super.trigger('set-trace-point', [line])

      if (typeof focus === 'string') {
        this.variablesElem
          .find(`ol li[data-variable="${focus}"]`)
          .addClass('edit-alert')
          .find('.edit')
          .focus()
      }
    }
  }

  initializeVariableView () {
    if (this.rendered === true) {
      let variableListHtml = '<ol></ol>'
      let suggestBtnHtml = '<button class="action-button success">Get suggestions</button>'
      // let cancelBtnHtml = '<button class="action-button">Cancel</button>'
      this.variablesElem.html(variableListHtml + suggestBtnHtml)

      this.variablesElem.find('.action-button.success').on('click', (event) => {
        let list = this.variablesElem.find('ol li')

        if (list.length > 0) {
          let wasError = false

          let goals = list.toArray().filter((li) => {
            // Only fields with non-empty values pass through this filter
            return jQuery(li).find('.edit').val() !== ''
          }).map((li) => {
            let varname = jQuery(li).find('.name').text()

            let oldValueStr = jQuery(li).find('.value').text()
            let oldValue = parseInt(oldValueStr)

            let newValueStr = jQuery(li).find('.edit').val()
            let newValue = parseInt(newValueStr)

            if (isNaN(oldValue)) {
              wasError = true

              NotificationView.send('fatal', 'Could not request suggestions', {
                large: true,
                code: `"${varname}" is not type INTEGER`
              }).open()
            }

            if (isNaN(newValue)) {
              wasError = true

              NotificationView.send('fatal', 'Could not request suggestions', {
                large: true,
                code: `input "${newValueStr}" is not type INTEGER`
              }).open()
            }

            // FIXME: only integers are currently supported
            return {
              varname: varname,
              oldValue: oldValue,
              newValue: newValue
            }
          })

          if (wasError === false) {
            this.getSuggestions(goals)
          }
        }
      })
    }
  }

  getSuggestions (goals) {
    if (this.rendered === true) {
      if (this.index >= this.trace.length || this.index < 0) {
        throw new Error(`index ${this.index} is out of range`)
      }

      // Create a deep-copy of the current trace point
      let clone = JSON.parse(JSON.stringify(this.trace[this.index]))

      // Apply the trace transformations to the cloned trace point
      clone['stack_to_render'][0]['encoded_locals'] = goals.reduce((hash, goal) => {
        hash[goal.varname] = goal.newValue
        return hash
      }, {});
      //and for the locked function return values
      for (const lockedReturnValueKey of Object.keys(this.lockedReturnValues.filter(
            lockedReturnValueMeta => lockedReturnValueMeta.isLocked))) {

        clone['stack_to_render'][lockedReturnValueKey]['encoded_locals']['__return__'] 
                = this.lockedReturnValues[lockedReturnValueKey].value;
      }

      clone['stack_to_render'][0]['ordered_varnames'] = goals.map((goal) => goal.varname)

      const assertions = [];
      //find all assert statements from code and remove them
      let curAssertLineIdx = '';
      while ((curAssertLineIdx = this.whole.search(/\n.*assert.*\n/)) != -1) {
        let restOfWhole = this.whole.substring(curAssertLineIdx + 1);
        assertions.push(restOfWhole.substring(0, restOfWhole.find(/\n/) - 1));
        this.whole = this.whole.substring(0, curAssertLineIdx) + restOfWhole.substring(restOfWhole.find(/\n/))
      }

      // Send this data to the app-view module for processing
      let wholeStr = JSON.stringify(this.whole);
      let pointStr = JSON.stringify(clone);
      let assertionsStr = JSON.stringify(assertions);
      let pointIdx = this.index;
      let focusedLines = []; // This value will be filled in by the AppView

      // Make data available to the Debug panel
      DevtoolsView.setModifiedTracePoint(clone, pointIdx);

      this.trigger('get-suggestion', [new SuggestionPayload(wholeStr, pointStr, pointIdx, focusedLines, assertions)]);
    }
  }

  setVisibleScope (index) {
    if (this.rendered === true) {
      if (index >= this.trace.length || index < 0) {
        throw new Error(`index ${index} is out of range`)
      }

      let point = this.trace[index]
      let callstack = point['stack_to_render']

      if (Array.isArray(callstack) === false) {
        throw new Error(`malformed scope at index ${index}`)
      }

      if (callstack.length > 0) {
        let topCallstack = callstack[0]
        let locals = topCallstack['encoded_locals'] || {}
        let variablesHtml = Object.keys(locals).reduce((html, localName) => {
          if (locals.hasOwnProperty(localName) === false) {
            return html
          }

          if (locals[localName] && locals[localName][0] === 'VOID') {
            return html
          }

          return html + htmlBuilder.li({
            'data-variable': sanitize(localName),
            children: [
              htmlBuilder.span('current', [
                htmlBuilder.span('name', sanitize(localName)),
                htmlBuilder.span('value field', sanitize(locals[localName]))
              ]),
              ' &xrarr; ',
              htmlBuilder.input({
                type: 'textbox',
                classes: ['edit'],
                placeholder: '?'
              })
            ]
          })
        }, '')

        this.variablesElem.find('ol').html(variablesHtml)
      }
    }
  }
}

export default RuntimeView
