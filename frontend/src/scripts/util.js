const TAG_REPLACEMENTS = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt'
}

/**
 * @author - Matt Kramer
 * @summary - Given some source code, removes every line that contains an
 *            assert statement, and returns the modified code and list
 *            of source code lines containing the asserts. To keep traces 
 *            consistent with the source code, a blank line is kept in the 
 *            source code
 * @param {string} code - The source code to extract the assert statements from
 * @return {list, string} - The list of assert statements and the code without
 *                          the assert statements
 */
export const extractAssertLinesFromCode = code => {
  let codeMinusAsserts = code;
  const assertions = [];
  //find all assert statements from code and remove them
  let curAssertLineIdx = '';
  while ((curAssertLineIdx = codeMinusAsserts.search(/\n.*assert.*\n/)) != -1) {
    let restOfCode = codeMinusAsserts.substring(curAssertLineIdx + 1);
    assertions.push( restOfCode.substring(0, restOfCode.search(/\n/)).trim());
    //does not remove new lines from the code
    codeMinusAsserts = codeMinusAsserts.substring(0, curAssertLineIdx + 1) 
                        + restOfCode.substring(restOfCode.search(/\n/));
  }
  return [assertions, codeMinusAsserts];
};

export const sanitize = function (dirty) {
  if (typeof dirty !== 'string') {
    dirty = `${dirty}`
  }

  return dirty.replace(/[&<>]/g, (tag) => TAG_REPLACEMENTS[tag] || tag)
}

export const htmlBuilder = function (elements) {
  return elements.reduce((out, elem) => out + elem, '')
}

// Tuple array of the form: [<tag name> , <tag is self-closing>]
const VALID_TAGS = [
  ['button', false],
  ['code', false],
  ['div', false],
  ['input', true],
  ['label', false],
  ['li', false],
  ['p', false],
  ['span', false]
]

const VALID_FIELDS = [
  'children',
  'classes',
  'for',
  'id',
  'name',
  'placeholder',
  'title',
  'type',
  'value'
]

VALID_TAGS.forEach((tagInfo) => {
  const tagName = tagInfo[0]
  const selfClosing = tagInfo[1]

  htmlBuilder[tagName] = function (first, second) {
    if (typeof first === 'string') {
      // Assume "first" argument is a class descriptor
      if (typeof second === 'string') {
        // Assume "second" argument is an HTML string
        if (selfClosing) {
          throw new Error(`self closing tags like ${tagName} can not have children`)
        }

        return `<${tagName} class="${first}">${second}</${tagName}>`
      } else if (typeof second === 'undefined') {
        // "second" is undefined
        if (selfClosing) {
          return `<${tagName}>`
        } else {
          return `<${tagName} class="${first}"></${tagName}>`
        }
      } else if (Array.isArray(second)) {
        // Assume "second" argument is an array of HTML strings
        return `<${tagName} class="${first}">${second.join('')}</${tagName}>`
      } else {
        console.log(second)
        throw new Error('un-recognized type of second argument')
      }
    } else if (Array.isArray(first)) {
      if (selfClosing) {
        throw new Error(`self closing tags like ${tagName} can not have children`)
      }

      return `<${tagName}>${first.join('')}</${tagName}>`
    } else if (typeof first === 'object') {
      // Assume "first" is a config object
      let attrs = Object.keys(first).reduce((attrs, attrName) => {
        // Ignore any attribute names that are part of prototype objects
        if (first.hasOwnProperty(attrName) === false) {
          return attrs
        }

        // Ignore this field during this stage
        if (attrName === 'children') {
          return attrs
        }

        // Allow any fields prefixed with the string "data-" and followed by
        // 0 or more alphanumeric, underscore, or hyphen characters
        if (/^data-[a-zA-Z0-9\-_]*$/.test(attrName)) {
          return attrs + ` ${attrName}="${first[attrName]}"`
        }

        // Allow explicitly defined legal attribute names
        if (VALID_FIELDS.includes(attrName)) {
          if (attrName === 'classes') {
            // Handle the "classes" field specially
            if (Array.isArray(first['classes'])) {
              // Handle classes when given as an array
              return attrs + ` class="${first['classes'].join(' ')}"`
            } else {
              // Handle classes when given as a single string
              return attrs + ` class="${first['classes']}"`
            }
          } else {
            return attrs + ` ${attrName}="${first[attrName]}"`
          }
        }

        throw new Error(`un-recognized attribute named: "${attrName}"`)
      }, '')

      // Emit an error if a self-closing tag defines child elements so that
      // elements are not silently ignored
      if (selfClosing && Array.isArray(first.children)) {
        throw new Error(`self closing tags like ${tagName} can not have children`)
      }

      let children = ''

      if (typeof first.children === 'undefined') {
        children = ''
      } else if (typeof first.children === 'string') {
        // Accept a string for the children field
        children = first.children
      } else if (first.children instanceof Array) {
        // Convert children to strings then concatenate
        children = first.children.map((child) => child.toString()).join('')
      } else {
        // Emit an error if the "children" field was of some other type
        console.error(first)
        throw new Error('un-recognized type of children field')
      }

      if (selfClosing) {
        return `<${tagName}${attrs}>`
      } else {
        return `<${tagName}${attrs}>${children}</${tagName}>`
      }
    }

    throw new Error('could not parse htmlBuilder inputs')
  }
})
