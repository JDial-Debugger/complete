'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var TAG_REPLACEMENTS = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt'
};

var sanitize = exports.sanitize = function sanitize(dirty) {
  return dirty.replace(/[&<>]/g, function (tag) {
    return TAG_REPLACEMENTS[tag] || tag;
  });
};

var htmlBuilder = exports.htmlBuilder = function htmlBuilder(elements) {
  return elements.reduce(function (out, elem) {
    return out + elem;
  }, '');
};

var VALID_TAGS = [['input', true], ['label', false], ['li', false], ['span', false]];

var VALID_FIELDS = ['children', 'classes', 'id', 'name', 'type', 'value'];

VALID_TAGS.forEach(function (tagInfo) {
  var tagName = tagInfo[0];
  var selfClosing = tagInfo[1];

  htmlBuilder[tagName] = function (first, second) {
    if (typeof first === 'string') {
      // Assume "first" argument is a class descriptor
      if (typeof second === 'string') {
        // Assume "second" argument is an HTML string
        if (selfClosing) {
          throw new Error('self closing tags like ' + tagName + ' can not have children');
        }

        return '<' + tagName + ' class="' + first + '">' + second + '</' + tagName + '>';
      } else if (typeof second === 'undefined') {
        // "second" is undefined
        if (selfClosing) {
          return '<' + tagName + '>';
        } else {
          return '<' + tagName + '></' + tagName + '>';
        }
      } else if (second instanceof Array) {
        // Assume "second" argument is an array of HTML strings
        return '<' + tagName + ' class="' + first + '">' + second.join('') + '</' + tagName + '>';
      } else {
        throw new Error('un-recognized type of second argument');
      }
    } else if ((typeof first === 'undefined' ? 'undefined' : _typeof(first)) === 'object') {
      // Assume "first" is a config object
      var attrs = Object.keys(first).reduce(function (attrs, attrName) {
        // Ignore any attribute names that are part of prototype objects
        if (first.hasOwnProperty(attrName) === false) {
          return attrs;
        }

        // Ignore this field during this stage
        if (attrName === 'children') {
          return attrs;
        }

        // Allow any fields prefixed with the string "data-" and followed by
        // 0 or more alphanumeric, underscore, or hyphen characters
        if (/^data-[a-zA-Z0-9\-_]*$/.test(attrName)) {
          return attrs + (' ' + attrName + '="' + first[attrName] + '"');
        }

        // Allow explicitly defined legal attribute names
        if (VALID_FIELDS.includes(attrName)) {
          if (attrName === 'classes') {
            // Handle the "classes" field specially
            if (attrName['classes'] instanceof Array) {
              // Handle classes when given as an array
              return attrs + (' class="' + first['classes'].join(' ') + '"');
            } else {
              // Handle classes when given as a single string
              return attrs + (' class="' + first['classes'] + '"');
            }
          } else {
            return attrs + (' ' + attrName + '="' + first[attrName] + '"');
          }
        }

        throw new Error('un-recognized attribute named: "' + attrName + '"');
      }, '');

      // Emit an error if a self-closing tag defines child elements so that
      // elements are not silently ignored
      if (selfClosing && first.children instanceof Array) {
        throw new Error('self closing tags like ' + tagName + ' can not have children');
      }

      var children = '';

      if (typeof first.children === 'string') {
        // Accept a string for the children field
        children = first.children;
      } else if (first.children instanceof Array) {
        // Convert children to strings then concatenate
        children = first.children.map(function (child) {
          return child.toString();
        }).join('');
      } else {
        // Emit an error if the "children" field was of some other type
        throw new Error('un-recognized type of children field');
      }

      if (selfClosing) {
        return '<' + tagName + attrs + '>';
      } else {
        return '<' + tagName + attrs + '>' + children + '</' + tagName + '>';
      }
    }

    throw new Error('could not parse htmlBuilder inputs');
  };
});