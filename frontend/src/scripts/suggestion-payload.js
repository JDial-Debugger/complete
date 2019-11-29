class SuggestionPayload {
  constructor (trace, point, pointIndex, focusedLines, assertions) {
    if (typeof trace !== 'string') {
      throw new Error('expected `trace` to have type String')
    }

    if (typeof point !== 'string') {
      throw new Error('expected `point` to have type String')
    }

    if (typeof pointIndex !== 'number') {
      throw new Error('expected `pointIndex` to have type Number')
    }

    if (Array.isArray(focusedLines) === false) {
      throw new Error('expected `focusedLines` to be an Array')
    } else {
      focusedLines.forEach((elem, i) => {
        if (typeof elem !== 'number') {
          throw new Error(`expected ${i} element of \`focusedLines\` to have type Number`)
        }
      })
    }

    this.trace = trace
    this.point = point
    this.pointIndex = pointIndex
    this.focusedLines = focusedLines
    this.assertions = assertions
  }

  stringify () {
    return JSON.stringify({
      full_trace: this.trace,
      modified_point: this.point,
      modified_point_index: this.pointIndex,
      focused_lines: this.focusedLines,
      assertions: this.assertions,
    })
  }
}

export default SuggestionPayload
