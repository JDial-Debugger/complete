import { htmlBuilder } from './util'
import DebugTab from './debug-tab'
import { props, getFuncArgs } from './trace';
import Errors from './constants/errors';

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
    console.log(traceData)
    this.tracePoints = traceData.trace;

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
    this.wrapperElem.append(examplesElem)
    this.examplesElem = examplesElem
    this.setFuncName(funcNames[0])
    this.addBlankExample()
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
    console.log("HERE")
    if (!this.examples) {
      this.examples = []
    }
    this.examples.push({})

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
    paramInputElem.on('change', ({ target }) => 
        this.handleParamStrChange(target.value, this.examples.length - 1))
    exampleElem.append(paramInputElem)

    const suffix = jQuery(htmlBuilder.p('example-text', `) &xrArr; `))
    exampleElem.append(suffix)

    const retInputElem = jQuery(htmlBuilder.input({
      placeholder: intPlaceholder,
      classes: 'example-text'
    }))
    retInputElem.on('change', ({ target }) =>
        this.handleRetStrChange(target.value, this.examples.length - 1))
    exampleElem.append(retInputElem)

    this.examplesElem.append(exampleElem)
  }

  handleParamStrChange(val, exampleIdx) {
    this.examples[exampleIdx].paramStr = val
  }

  handleRetStrChange(val, exampleIdx) {
    this.examples[exampleIdx].retStr = val
  }

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
