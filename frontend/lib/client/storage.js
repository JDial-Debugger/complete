'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WORKING_PROGRAM_KEY = 'working_program_copy';

var BUILTIN_PROGRAMS = {
  'tests': 'public class Main {\n    static int SimpleJava() {\n        int a = 2;\n        int b = a + 1;\n        int c = a + b;\n        return c;\n    }\n\n    public static void main(String[] args) {\n        int x = SimpleJava();\n        System.out.println(x);\n    }\n}',
  'hello': 'public class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println("Hello world");\n    }\n}',
  'custom': ''
};

var Storage = function () {
  function Storage() {
    _classCallCheck(this, Storage);
  }

  _createClass(Storage, null, [{
    key: 'workingCopyExists',
    value: function workingCopyExists(cb) {
      if (typeof cb !== 'function') {
        throw new Error('expected 1st arg. of Storage.workingCopyExists() to be a function');
      }

      localForage.getItem(WORKING_PROGRAM_KEY).then(function (value) {
        var exists = typeof value === 'string';
        cb.apply({}, [null, exists]);
      }).catch(function (err) {
        cb.apply({}, [err]);
      });
    }
  }, {
    key: 'getWorkingCopy',
    value: function getWorkingCopy(cb) {
      if (typeof cb !== 'function') {
        throw new Error('expected 1st arg. of Storage.getWorkingCopy() to be a function');
      }

      localForage.getItem(WORKING_PROGRAM_KEY).then(function (value) {
        if (typeof value !== 'string') {
          value = '';
        }

        cb.apply({}, [null, value]);
      }).catch(function (err) {
        cb.apply({}, [err]);
      });
    }
  }, {
    key: 'setWorkingCopy',
    value: function setWorkingCopy(newValue, cb) {
      if (typeof newValue !== 'string') {
        throw new Error('expected 1st arg. of Storage.setWorkingCopy() to be a string');
      }

      if (typeof cb !== 'function') {
        throw new Error('expected 2nd arg. of Storage.setWorkingCopy() to be a function');
      }

      localForage.setItem(WORKING_PROGRAM_KEY, newValue).then(function (value) {
        cb.apply({}, [null, value]);
      }).catch(function (err) {
        cb.apply({}, [err]);
      });
    }
  }, {
    key: 'setWorkingCopyFromBuiltin',
    value: function setWorkingCopyFromBuiltin(builtinID, cb) {
      if (typeof builtinID !== 'string') {
        var err = new Error('expected 1st arg. of Storage.setWorkingCopyFromDefault() to be a string');
        return void cb.apply({}, [err]);
      }

      if (BUILTIN_PROGRAMS.hasOwnProperty(builtinID) === false) {
        var _err = new Error('1st arg. of Storage.setWorkingCopyFromDefault() not a valid ID');
        return void cb.apply({}, [_err]);
      }

      if (typeof cb !== 'function') {
        var _err2 = new Error('expected 3rd arg. of Storage.setWorkingCopy() to be a function');
        return void cb.apply({}, [_err2]);
      }

      Storage.setWorkingCopy(BUILTIN_PROGRAMS[builtinID], cb);
    }
  }, {
    key: 'clear',
    value: function clear() {
      var force = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      if (force === true || window.confirm('Clear local storage?')) {
        localForage.clear().then(function () {
          console.log('Local storage cleared');
        }).catch(function (err) {
          console.error('Could not clear local storage. Error has been logged');
          console.error(err);
        });
      }
    }
  }, {
    key: 'workingCopyMatchesBuiltin',
    value: function workingCopyMatchesBuiltin(testProgram) {
      var keys = Object.keys(BUILTIN_PROGRAMS);

      for (var i = 0, len = keys.length; i < len; i++) {
        var key = keys[i];

        if (BUILTIN_PROGRAMS[key] === testProgram) {
          return key;
        }
      }

      return false;
    }
  }]);

  return Storage;
}();

exports.default = Storage;