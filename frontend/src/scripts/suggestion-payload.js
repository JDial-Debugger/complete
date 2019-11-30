class SuggestionPayload {
  constructor (trace, point, pointIndex, focusedLines) {

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

    this.trace = trace;
    this.point = point;
    this.pointIndex = pointIndex;
    this.focusedLines = focusedLines;
  }

  setAssertions (assertions) {
    this.point.assertions = JSON.stringify(assertions);
  }

  stringify () {
    return JSON.stringify({
      full_trace: JSON.stringify(this.trace),
      modified_point: JSON.stringify(this.point),
      modified_point_index: this.pointIndex,
      focused_lines: this.focusedLines,
    })
  }
}

export default SuggestionPayload
