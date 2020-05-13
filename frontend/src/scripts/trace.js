//Util methods for dealing with trace data
/**
 * @typedef {Object} Argument
 * @property {string} name - the name of the argument
 * @property {string} type - the type of the argument
 */

/**
 * The value is how each property of a trace point is named
 */
export const props = {
    EVENT: 'event',
    FUNC: 'func_name',
    GLOBALS: 'globals',
    HEAP: 'heap',
    LINE: 'line',
    ORDERED_GLOBALS: 'ordered_globals',
    STACK: 'stack_to_render',
    STDOUT: 'stdout',
    stack: {
        LOCALS: 'encoded_locals',
        ID: 'frame_id',
        HIGHLIGHT: 'is_highlighted',
        PARENT: 'is_parent',
        ZOMBIE: 'is_zombie',
        VAR_NAMES: 'ordered_varnames',
        PARENT_IDS: 'parent_frame_id_list',
        HASH: 'unique_hash',
    },
    event: {
        CALL: 'call',
        STEP: 'step_line',
        RETURN: 'return',
    }
}

/**
 * Gets the argument names and types from the first call of a given function
 * in a given trace
 * @param {Object[]} trace - the trace to extract arg names from
 * @param {string} funcName - the name of the function
 * @return {Argument[]} - Each argument is ordered same as function order, if
 * function name not found in trace, returns nothing
 */
export const getFuncArgs = (trace, funcName) => {

    for (const tracePoint of trace) {
        if (tracePoint[props.EVENT] === props.event.CALL && 
                tracePoint[props.FUNC] === funcName) {
            const locals = tracePoint[props.STACK][0][props.stack.LOCALS]
            const result = []
            for (const varName of Object.keys(locals)) {
                result.push({ name: varName, type: typeof locals[varName] })
            }
            return result
        }
    }
}