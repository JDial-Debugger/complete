class TracePayload {
  constructor (source, stdin) {
    this.source = source
    this.stdin = stdin
  }

  stringify () {
    return JSON.stringify({
      source: this.source,
      input: this.stdin
    })
  }
}

export default TracePayload
