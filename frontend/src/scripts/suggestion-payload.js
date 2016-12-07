class SuggestionPayload {
  constructor (trace, point, pointIndex) {
    if (typeof trace !== 'string') {
      throw new Error('expected `trace` to have type String')
    }

    if (typeof point !== 'string') {
      throw new Error('expected `point` to have type String')
    }

    if (typeof pointIndex !== 'number') {
      throw new Error('expected `pointIndex` to have type Number')
    }

    this.trace = trace
    this.point = point
    this.pointIndex = pointIndex
  }

  stringify () {
    return JSON.stringify({
      full_trace: this.trace,
      modified_point: this.point,
      modified_point_index: this.pointIndex
    })
  }
}

export default SuggestionPayload
