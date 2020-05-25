import { htmlBuilder } from './util'
import DebugTab from './debug-tab'
import { props, getFuncArgs } from './trace';
import Errors from './constants/errors';
import TracePayload from './trace-payload';
import Network from './network';

const intPlaceholder = 0;
const strPlaceholder = "abc";
const boolPlaceholder = false;

class FunctionCorrectionView extends DebugTab {

  constructor (wrapperElem) {
    // Call EventHandler initialization code
    super();
    this.wrapperElem = wrapperElem

  }

  /**
   * TODO: create better way of only adding functions of certain return type
   * @param {Object} traceData 
   */
  setTrace(traceData) {
    this.tracePoints = traceData.trace;
    this.code = traceData.code;

    let funcHtml = `
      <div class="func-container">
      <p class="func-title">Select Function to Repair</p>
      <select class="func-select">`

    const funcNames = traceData.trace.filter(({ func_name }) => 
        func_name !== "main" && 
          traceData.code.search(new RegExp(`int *${func_name}`)) !== -1)
    .map(point => point.func_name)

    const options = []
    new Set(funcNames).forEach(funcName => options.push(htmlBuilder.option(
            { value: funcName, children: funcName}, funcName)))

    if (funcNames.length === 0) {
      this.displayError(Errors.NO_FUNC_CALLS)
    }

    funcHtml = funcHtml.concat(options)
    funcHtml = funcHtml.concat('</div>')

    this.wrapperElem.append(funcHtml)

    //add listener for selector
    this.wrapperElem.find('.func-select').on('change', ({currentTarget}) =>
        this.setFuncName(jQuery(currentTarget).val()))
    
    const examplesElem = jQuery(`<div class="examples-container"></div>`);
    this.examplesElem = examplesElem
    this.wrapperElem.append(examplesElem)
    const submitElem = jQuery(htmlBuilder.button('examples-submit', 'Submit'))
    submitElem.on('click', () => this.handleExamplesSubmit())
    this.wrapperElem.append(submitElem)
    this.setFuncName(funcNames[0])
    this.addBlankExample()
  }

  handleExamplesSubmit() {

    if(!this.validateExamples()) {
      return
    }
    this.setLoading()
    //construct code to submit to trace generator by inserting
    //a call to the target function with the inputted params
    //for each example

    //search for the main method
    let mainRegex = /static\s*void\s*main\s*\(\s*String\[\]\s*\w*\)\s*{/
    const [ match ] = this.code.match(mainRegex)
    const matchIdx = this.code.indexOf(match)
    const tracePromises = []
    const callLine = this.code.substring(0, matchIdx).split('\n').length + 1
    console.log(callLine)

    //get trace for each example
    for (const example of this.examples.slice(0, this.examples.length - 1)) {

      const funcCallStr = `\n${this.funcName}(${example.paramStr});\n`
      const exampleCode = this.code.substring(0, this.code.indexOf(match) + match.length) +
        funcCallStr + this.code.substring(this.code.indexOf(match) + match.length)
      tracePromises.push(axios.post('/trace', { source: exampleCode }))
    }
    Promise.all(tracePromises).then(traceResponses => {
      console.log(traceResponses)
      axios.post('/suggestFunc', {
        targetFunc: this.funcName,
        code: this.code,
        corrections: traceResponses.map((res, idx) => ({
          callLine,
          returnVal: parseInt(this.examples[idx].retStr),
          trace: res.data.trace
        }))
      }).then(suggestRes => {
        console.log(suggestRes)
        this.trigger('new-suggestion', suggestRes.data)
      })
    })
  }

  setLoading() {
    //TODO
  }

  validateExamples() {
    //TODO
    return true
  }

  setFuncName(name) {
    this.funcName = name
    this.clearExamples()
  }

  displayError(msg) {

  }

  clearExamples() {
    this.examples = []
  }

  /**
   * Adds an example to the stored examples and updates the DOM
   * to add a new input for an example
   * Examples are structured where each property is a param
   * and each value is the value of that param
   * and the 'return' property has the desired return value
   */
  addBlankExample() {
    if (!this.examples) {
      this.examples = []
    }
    this.examples.push({})
    const curIdx = this.examples.length - 1

    const exampleElem = jQuery(`
      <div class="example-container">
      </div>
    `)

    const prefix = jQuery(htmlBuilder.p('example-text', `int ${this.funcName}(`))
    exampleElem.append(prefix)

    const paramInputElem = jQuery(htmlBuilder.input({ 
      placeholder: this.getPlaceholderStr(),
      classes: 'example-text'
    }))
    paramInputElem.on('focus', () => 
        this.handleExampleFocus(curIdx))
    paramInputElem.on('change', ({ target }) => 
        this.handleParamStrChange(target.value, curIdx))
    exampleElem.append(paramInputElem)

    const suffix = jQuery(htmlBuilder.p('example-text', `) &xrArr; `))
    exampleElem.append(suffix)

    const retInputElem = jQuery(htmlBuilder.input({
      placeholder: intPlaceholder,
      classes: 'example-text'
    }))
    retInputElem.on('change', ({ target }) =>
        this.handleRetStrChange(target.value, curIdx))
    exampleElem.append(retInputElem)

    this.examplesElem.append(exampleElem)
  }

  handleParamStrChange(val, exampleIdx) {
    this.examples[exampleIdx].paramStr = val
  }

  handleRetStrChange(val, exampleIdx) {
    this.examples[exampleIdx].retStr = val
  }

  /**
   * If this is the last example focused, add a new example
   * @param {number} exampleIdx 
   */
  handleExampleFocus(exampleIdx) {
    if (this.examples.length - 1 === exampleIdx) {
      this.addBlankExample()
    }
  }

  /**
   * Based on the current function, creates a placeholder
   * for the function params
   * @return {string} - in the form: "0, 4, "abc", false"
   */
  getPlaceholderStr() {

    const args = getFuncArgs(this.tracePoints, this.funcName)
    let placeholderStr = ``;

    for (let i = 0; i < args.length; ++i) {
      if (args[0].type === 'number') {
        placeholderStr += `${intPlaceholder}`
      } else if (args[0].type === 'string') {
        placeholderStr += `${strPlaceholder}`
      } else if (args[0].type === 'boolean') {
        placeholderStr += `${boolPlaceholder}`
      }
      if (i !== args.length - 1) {
        placeholderStr += ', '
      }
    }
    return placeholderStr
  }


}

export default FunctionCorrectionView
