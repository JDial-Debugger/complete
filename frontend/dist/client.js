/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _controlSurface = __webpack_require__(1);
	
	var _controlSurface2 = _interopRequireDefault(_controlSurface);
	
	var _editorView = __webpack_require__(3);
	
	var _editorView2 = _interopRequireDefault(_editorView);
	
	var _network = __webpack_require__(4);
	
	var _network2 = _interopRequireDefault(_network);
	
	var _notificationView = __webpack_require__(5);
	
	var _notificationView2 = _interopRequireDefault(_notificationView);
	
	var _runtimeView = __webpack_require__(7);
	
	var _runtimeView2 = _interopRequireDefault(_runtimeView);
	
	var _storage = __webpack_require__(8);
	
	var _storage2 = _interopRequireDefault(_storage);
	
	var _tracePayload = __webpack_require__(9);
	
	var _tracePayload2 = _interopRequireDefault(_tracePayload);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var AppView = function () {
	  function AppView() {
	    _classCallCheck(this, AppView);
	
	    this.edv = new _editorView2.default(jQuery('.mp-editor'), '');
	    this.rtv = new _runtimeView2.default(jQuery('.mp-runtime'));
	    this.mcs = new _controlSurface2.default(jQuery('.mp-controls'));
	
	    // Properties for coordinating HTTP requests
	    this.requestPending = true;
	    this.requestCancelled = false;
	
	    this._init();
	  }
	
	  _createClass(AppView, [{
	    key: '_init',
	    value: function _init() {
	      var _this = this;
	
	      var traceAction = function traceAction() {
	        _this.mcs.disableCommands(['trace']);
	        _this.mcs.startSpinning('trace');
	        _this.mcs.enableCommands(['halt']);
	        _this.rtv.showPendingMessage();
	
	        // Clear any pending notifications under the assumption that they
	        // were meant for a previous program
	        _notificationView2.default.flush();
	
	        var payload = new _tracePayload2.default(_this.edv.getProgram(), '');
	
	        var getTrace = function getTrace(err, trace) {
	          _this.requestPending = false;
	
	          // If the "requestCancelled" field has been set between when the
	          // request was dispatched and when the request was returned, cancel
	          // any logic that would have been run with the request response. This
	          // property was most likely set by the user clicking the "Halt" button
	          // between when they clicked the "Run" button and when the trace was
	          // returned from the server
	          if (_this.requestCancelled === true) {
	            _this.requestCancelled = false;
	            return;
	          }
	
	          _this.mcs.stopSpinning('trace');
	
	          // Display appropriate notifications if there was an error or
	          // the given trace was well-formed but contains a runtime error
	          if (err !== null) {
	            // TODO
	            _notificationView2.default.send('fatal', 'Bad trace!').open();
	            throw err;
	          } else if (trace[0]['event'] === 'instruction_limit_reached') {
	            var notif = _notificationView2.default.send('fatal', 'Error generating trace', {
	              large: true,
	              code: trace[0]['exception_msg'],
	              details: 'Trying again in a moment will likely fix this issue.',
	              actions: [{ name: 'Try Again', command: 'retry' }]
	            });
	
	            notif.on('retry', function () {
	              _this.mcs.startSpinning('trace');
	              _network2.default.getTrace(payload, getTrace);
	            });
	
	            notif.on('dismiss', function () {
	              throw new Error(trace[0]['exception_msg']);
	            });
	
	            notif.open();
	          } else {
	            _this.rtv.render(trace);
	          }
	        };
	
	        // Reset the "requestCancelled" property before the request is issued so that
	        // if the property is set between now and when the request response is received
	        // the resonse can be ignored because the user no long wants it
	        _this.requestCancelled = false;
	        _this.requestPending = true;
	
	        _network2.default.getTrace(payload, getTrace);
	      };
	
	      var haltAction = function haltAction() {
	        _this.mcs.enableCommands(['trace']);
	        _this.mcs.disableCommands(['halt']);
	        _this.rtv.clear();
	        _this.edv.unfreeze();
	        _this.requestCancelled = true;
	        _this.mcs.stopSpinning('trace');
	      };
	
	      var resetAction = function resetAction() {
	        var _mcs$get = _this.mcs.get('dropdown'),
	            _mcs$get2 = _slicedToArray(_mcs$get, 2),
	            err = _mcs$get2[0],
	            dropdownValue = _mcs$get2[1];
	
	        if (err !== null) {
	          console.error(err);
	          return;
	        }
	
	        _storage2.default.setWorkingCopyFromBuiltin(dropdownValue, function (err, value) {
	          if (err !== null) {
	            console.error(err);
	          } else {
	            console.log('loaded builtin program "' + dropdownValue + '"');
	            _this.edv.setProgram(value);
	          }
	        });
	      };
	
	      var dropdownAction = function dropdownAction(dropdownValue) {
	        _storage2.default.setWorkingCopyFromBuiltin(dropdownValue, function (err, value) {
	          if (err !== null) {
	            console.error(err);
	          } else {
	            console.log('loaded builtin program "' + dropdownValue + '"');
	            _this.edv.setProgram(value);
	          }
	        });
	      };
	
	      this.mcs.on('trace', traceAction);
	      this.mcs.on('halt', haltAction);
	      this.mcs.on('reset', resetAction);
	      this.mcs.on('dropdown', dropdownAction);
	
	      this.rtv.on('set-trace-point', function (line) {
	        _this.edv.freeze();
	        _this.edv.highlightLine(line);
	      });
	
	      this.rtv.on('get-advice', function () {
	        traceAction();
	      });
	
	      // Handle loading either a default program or a saved program
	      // the user has already been editing
	      _storage2.default.workingCopyExists(function (err, exists) {
	        if (err !== null) {
	          console.error(err);
	          return;
	        }
	
	        if (exists) {
	          // Use existing program from local storage
	          _storage2.default.getWorkingCopy(function (err, value) {
	            if (err !== null) {
	              console.error(err);
	            } else {
	              console.log('loaded working copy from local storage');
	
	              var matchingBuiltin = _storage2.default.workingCopyMatchesBuiltin(value);
	
	              if (typeof matchingBuiltin === 'string') {
	                // Checks if a working copy is a perfect match for one of the
	                // simple builtin programs. This gracefully handles the situation where
	                // a builtin is loaded, not edited and the page reloads. The un-edited
	                // program was stored in local storage but the selector should still
	                // be set to the name of the builtin program
	                try {
	                  _this.mcs.set('dropdown', matchingBuiltin);
	                } catch (err) {
	                  console.error(err);
	                }
	              } else {
	                try {
	                  // If there exists a program in memory, set the control surface
	                  // dropdown to "custom". This will avoid the situation where a previously
	                  // edited program is loaded into the editor but the builtin program select
	                  // still displays the name of some builtin program
	                  _this.mcs.set('dropdown', 'custom');
	                } catch (err) {
	                  console.error(err);
	                }
	              }
	
	              _this.edv.setProgram(value, true);
	            }
	          });
	        } else {
	          // Use some default program built-in as a starting program
	          _storage2.default.setWorkingCopyFromBuiltin('tests', function (err, value) {
	            if (err !== null) {
	              console.error(err);
	            } else {
	              console.log('loaded default program as working copy');
	
	              try {
	                // Set the control surface dropdown to "tests" since the default
	                // program being loaded is the "tests" program. Then any clicks on
	                // the "Reset" button will reset the editor with the correct program
	                _this.mcs.set('dropdown', 'tests');
	              } catch (err) {
	                console.error(err);
	              }
	
	              _this.edv.setProgram(value, true);
	            }
	          });
	        }
	      });
	
	      // Set event listener so that before a user refreshes or closes the page,
	      // the working copy of the edited program source code will be saved
	      // inside the browser's local storage
	      window.onbeforeunload = function () {
	        _storage2.default.setWorkingCopy(_this.edv.getProgram(), function (err, value) {
	          if (err !== null) {
	            console.error(err);
	          } else {
	            console.log('saved working copy to local storage');
	          }
	        });
	      };
	    }
	  }]);
	
	  return AppView;
	}();
	
	var app = new AppView();
	window.app = app;

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };
	
	var _eventHandler = __webpack_require__(2);
	
	var _eventHandler2 = _interopRequireDefault(_eventHandler);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var SPINNER_ON_CLASS = 'show-spinner';
	var SPINNING_CLASS = 'icon-spinning';
	
	var ControlSurface = function (_EventHandler) {
	  _inherits(ControlSurface, _EventHandler);
	
	  function ControlSurface(wrapperElem) {
	    _classCallCheck(this, ControlSurface);
	
	    var _this = _possibleConstructorReturn(this, (ControlSurface.__proto__ || Object.getPrototypeOf(ControlSurface)).call(this));
	    // Call EventHandler initialization code
	
	
	    if (wrapperElem instanceof jQuery === false || jQuery(wrapperElem).hasClass('control-surface') === false) {
	      throw new Error('expected arg. to be a jQuery object with class "control-surface"');
	    }
	
	    // Gather all the button elements within the control surface
	    var buttonElems = jQuery(wrapperElem).find('.mp-control-button');
	    _this.commands = jQuery(buttonElems).toArray().reduce(function (hash, buttonElem) {
	      var command = jQuery(buttonElem).attr('data-command');
	      _get(ControlSurface.prototype.__proto__ || Object.getPrototypeOf(ControlSurface.prototype), 'declareEvent', _this).call(_this, command);
	      hash[command] = buttonElem;
	
	      jQuery(buttonElem).on('click', function () {
	        _get(ControlSurface.prototype.__proto__ || Object.getPrototypeOf(ControlSurface.prototype), 'trigger', _this).call(_this, command, []);
	      });
	
	      return hash;
	    }, {});
	
	    if (jQuery(wrapperElem).find('.spinner-wrapper').length !== 0) {
	      _this.spinner = jQuery(wrapperElem).find('.spinner-wrapper');
	      _this.spinnerOff();
	    } else {
	      _this.spinner = null;
	    }
	
	    if (jQuery(wrapperElem).find('.dropdown').length !== 0) {
	      _this.dropdown = jQuery(wrapperElem).find('.dropdown');
	    } else {
	      _this.dropdown = null;
	    }
	    return _this;
	  }
	
	  _createClass(ControlSurface, [{
	    key: 'on',
	    value: function on(name, listener) {
	      var _this2 = this;
	
	      if (name === 'dropdown' && this.dropdown !== null) {
	        jQuery(this.dropdown).on('change', function () {
	          listener.apply({}, [null, jQuery(_this2).val()]);
	        });
	      } else {
	        _get(ControlSurface.prototype.__proto__ || Object.getPrototypeOf(ControlSurface.prototype), 'on', this).call(this, name, listener);
	      }
	    }
	  }, {
	    key: 'get',
	    value: function get(command) {
	      if (command === 'dropdown') {
	        if (this.dropdown !== null) {
	          var dropdownValue = jQuery(this.dropdown).val();
	          return [null, dropdownValue];
	        }
	
	        var _err = new Error('control surface lacks <select> to support "' + command + '"');
	        return [_err, ''];
	      }
	
	      var err = new Error('command "' + command + '" is not available from this control surface');
	      return [err, ''];
	    }
	  }, {
	    key: 'set',
	    value: function set(command, value) {
	      switch (command) {
	        case 'dropdown':
	          if (this.dropdown === null) {
	            throw new Error('control surface lacks <select> to support "' + command + '"');
	          }
	
	          // Check that the <select> has an <option> with a matching value
	          if (jQuery(this.dropdown).find('option[value="' + value + '"]').length > 0) {
	            jQuery(this.dropdown).val(value);
	          } else {
	            throw new Error('<select> has no option with the value ' + value);
	          }
	
	          break;
	        default:
	          throw new Error('command "' + command + '" is not available from this control surface');
	      }
	    }
	  }, {
	    key: 'startSpinning',
	    value: function startSpinning(command) {
	      if (Object.keys(this.commands).includes(command) === false) {
	        throw new Error('command "' + command + '" is not availalbe from this control surface');
	      }
	
	      jQuery(this.commands[command]).addClass(SPINNING_CLASS);
	    }
	  }, {
	    key: 'stopSpinning',
	    value: function stopSpinning(command) {
	      if (Object.keys(this.commands).includes(command) === false) {
	        throw new Error('command "' + command + '" is not availalbe from this control surface');
	      }
	
	      jQuery(this.commands[command]).removeClass(SPINNING_CLASS);
	    }
	  }, {
	    key: 'disableCommands',
	    value: function disableCommands(commands) {
	      var _this3 = this;
	
	      if (Array.isArray(commands) === false) {
	        throw new Error('1st argument of ControlSurface.disableActions must be an array');
	      }
	
	      commands.forEach(function (command) {
	        if (Object.keys(_this3.commands).includes(command) === false) {
	          throw new Error('command "' + command + '" is not available from this control surface');
	        }
	
	        // Disable the button
	        jQuery(_this3.commands[command]).attr('disabled', true);
	      });
	    }
	  }, {
	    key: 'enableCommands',
	    value: function enableCommands(commands) {
	      var _this4 = this;
	
	      if (Array.isArray(commands) === false) {
	        throw new Error('1st argument of ControlSurface.enableCommands must be an array');
	      }
	
	      commands.forEach(function (command) {
	        if (Object.keys(_this4.commands).includes(command) === false) {
	          throw new Error('command "' + command + '" is not available from this control surface');
	        }
	
	        // Enable the button
	        jQuery(_this4.commands[command]).attr('disabled', false);
	      });
	    }
	  }, {
	    key: 'spinnerOn',
	    value: function spinnerOn() {
	      if (this.spinner !== null) {
	        jQuery(this.spinner).addClass(SPINNER_ON_CLASS);
	      }
	    }
	  }, {
	    key: 'spinnerOff',
	    value: function spinnerOff() {
	      if (this.spinner !== null) {
	        jQuery(this.spinner).removeClass(SPINNER_ON_CLASS);
	      }
	    }
	  }]);
	
	  return ControlSurface;
	}(_eventHandler2.default);
	
	exports.default = ControlSurface;

/***/ },
/* 2 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var EventHandler = function () {
	  function EventHandler() {
	    _classCallCheck(this, EventHandler);
	
	    this.events = {};
	  }
	
	  _createClass(EventHandler, [{
	    key: 'declareEvent',
	    value: function declareEvent(name) {
	      // Create a new property in the "events" object if it
	      // doesn't exist already
	      if (this.events.hasOwnProperty(name) === false || Array.isArray(this.events[name]) === false) {
	        this.events[name] = [];
	      }
	    }
	  }, {
	    key: 'on',
	    value: function on(name, listener) {
	      if (typeof listener !== 'function') {
	        throw new Error('expected 2nd arg. to be of type "function"');
	      }
	
	      if (this.events.hasOwnProperty(name) === false) {
	        throw new Error('"' + name + '" is not a recognized event');
	      }
	
	      // Add the event listening function to the list
	      this.events[name].push(listener);
	    }
	  }, {
	    key: 'off',
	    value: function off(name, listener) {
	      if (typeof listener !== 'function') {
	        throw new Error('expected 2nd arg. to be of type "function"');
	      }
	
	      if (this.events[name].hasOwnProperty(name) === false) {
	        throw new Error('"' + name + '" is not a recognized event');
	      }
	
	      if (this.events[name].includes(listener) === false) {
	        throw new Error('event listener has not been attached yet');
	      }
	
	      // Get the index of the listener in the list of registered event listeners
	      var index = this.events[name].indexOf(listener);
	
	      // Remove that event listener function from the list
	      this.events[name].splice(index, 1);
	    }
	  }, {
	    key: 'trigger',
	    value: function trigger(name, payload) {
	      if (this.events.hasOwnProperty(name) === false && Array.isArray(this.events[name]) === false) {
	        throw new Error('"' + name + '" is not a recognized event');
	      }
	
	      // Call each event listener with the given payload
	      this.events[name].forEach(function (listener) {
	        listener.apply({}, payload);
	      });
	    }
	  }]);
	
	  return EventHandler;
	}();
	
	exports.default = EventHandler;

/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var HL_LINE_CLASS = 'active-line';
	
	var EditorView = function () {
	  function EditorView(wrapperElem) {
	    var initialProgram = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
	
	    _classCallCheck(this, EditorView);
	
	    if (wrapperElem instanceof jQuery === false) {
	      throw new Error('expected argument to new EditorView() to be a jQuery object');
	    }
	
	    // HTML element that the CodeMirror instance is embedded within
	    this.wrapperElem = wrapperElem;
	
	    // Create a new CodeMirror instance inside of the given wrapper
	    this.editor = CodeMirror(this.wrapperElem[0], {
	      mode: 'text/x-java',
	      theme: 'neat',
	      value: initialProgram,
	      lineNumbers: true,
	      indentUnit: 4,
	      smartIndent: false,
	      tabSize: 4,
	      indentWithTabs: true,
	      electricChars: false
	    });
	
	    // Line number of the line currently highlighted. Set to -1 if no line highlighted
	    this.highlightedLine = -1; // NOTE: 0-based line count
	
	    this.frozen = false;
	  }
	
	  _createClass(EditorView, [{
	    key: 'getProgram',
	    value: function getProgram() {
	      return this.editor.getValue();
	    }
	  }, {
	    key: 'setProgram',
	    value: function setProgram(newValue) {
	      var clearHistory = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
	
	      if (typeof newValue !== 'string') {
	        throw new Error('expected 1st arg. of EditorView.setProgram() to be a string');
	      }
	
	      this.editor.setValue(newValue);
	
	      // If "clearHistory" is set, this will reset the editor's undo history
	      // so that it won't be possible to use the undo command to reverse
	      // changes made by "setValue"
	      if (clearHistory === true) {
	        this.editor.clearHistory();
	      }
	    }
	  }, {
	    key: 'freeze',
	    value: function freeze() {
	      this.frozen = true;
	      this.editor.setOption('readOnly', 'nocursor');
	    }
	  }, {
	    key: 'unfreeze',
	    value: function unfreeze() {
	      this.frozen = false;
	      this.editor.setOption('readOnly', false);
	      this.clearHighlightedLine();
	      this.editor.focus();
	    }
	  }, {
	    key: 'highlightLine',
	    value: function highlightLine(lineNum) {
	      if (this.frozen === false) {
	        throw new Error('cannot highlight line until editor is frozen');
	      }
	
	      // Convert lineNum from 1-based to 0-based
	      lineNum--;
	
	      if (this.highlightedLine >= 0) {
	        this.clearHighlightedLine();
	      }
	
	      var PADDING = 20; // pixels that should be in-view above & below the line
	
	      this.editor.addLineClass(lineNum, 'gutter', HL_LINE_CLASS);
	      this.editor.addLineClass(lineNum, 'background', HL_LINE_CLASS);
	      this.editor.scrollIntoView({ line: lineNum, ch: 0 }, PADDING);
	      this.highlightedLine = lineNum;
	    }
	  }, {
	    key: 'clearHighlightedLine',
	    value: function clearHighlightedLine() {
	      if (this.highlightedLine === -1) {
	        return;
	      }
	
	      this.editor.removeLineClass(this.highlightedLine, 'gutter', HL_LINE_CLASS);
	      this.editor.removeLineClass(this.highlightedLine, 'background', HL_LINE_CLASS);
	      this.highlightedLine = -1;
	    }
	
	    /*
	    showSuggestion (range: Range, message: string, snippet: string, acceptFn, declineFn) {
	      window.ConstantSuggestion(
	        range,
	        message.toString(),
	        snippet.toString(),
	        acceptFn,
	        declineFn)
	    }
	    */
	
	  }]);
	
	  return EditorView;
	}();
	
	exports.default = EditorView;

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _notificationView = __webpack_require__(5);
	
	var _notificationView2 = _interopRequireDefault(_notificationView);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var Network = function () {
	  function Network() {
	    _classCallCheck(this, Network);
	  }
	
	  _createClass(Network, null, [{
	    key: 'getTrace',
	    value: function getTrace(payload, cb) {
	      var ajaxDone = function ajaxDone(res) {
	        return void cb(null, res);
	      };
	
	      var ajaxFail = function ajaxFail(err) {
	        var notif = _notificationView2.default.send('fatal', 'Network error getting trace', {
	          large: true,
	          details: 'Trying again in a moment will likely fix this issue.',
	          actions: [{ name: 'Try Again', command: 'retry' }]
	        });
	
	        notif.on('retry', function () {
	          // Call "getTrace" again with same arguments
	          Network.getTrace(payload, cb);
	        });
	
	        notif.on('dismiss', function () {
	          // Notification has been dismissed without using the "Try Again" action
	          cb(err, []);
	        });
	
	        notif.open();
	      };
	
	      superagent.post('/trace').send(payload.stringify()).end(function (err, res) {
	        if (err || res.ok !== true) {
	          ajaxFail(err);
	        } else {
	          var parsedTrace = {};
	
	          try {
	            parsedTrace = JSON.parse(res.text);
	          } catch (err) {
	            ajaxFail();
	          }
	
	          ajaxDone(parsedTrace.trace);
	        }
	      });
	    }
	  }]);
	
	  return Network;
	}();
	
	exports.default = Network;

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };
	
	var _eventHandler = __webpack_require__(2);
	
	var _eventHandler2 = _interopRequireDefault(_eventHandler);
	
	var _util = __webpack_require__(6);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var NOTIF_TYPES = ['fatal', 'alert', 'info', 'success'];
	
	var Notification = function (_EventHandler) {
	  _inherits(Notification, _EventHandler);
	
	  function Notification(parentElem, type, title, opts) {
	    _classCallCheck(this, Notification);
	
	    // Triggered when the notification is resolved with no actions
	    var _this = _possibleConstructorReturn(this, (Notification.__proto__ || Object.getPrototypeOf(Notification)).call(this));
	
	    _get(Notification.prototype.__proto__ || Object.getPrototypeOf(Notification.prototype), 'declareEvent', _this).call(_this, 'dismiss');
	
	    // Triggered WHENEVER a notification is resolved
	    _get(Notification.prototype.__proto__ || Object.getPrototypeOf(Notification.prototype), 'declareEvent', _this).call(_this, 'close');
	
	    if (NOTIF_TYPES.includes(type) === false) {
	      throw new Error('"' + type + '" is an invlaid notification type');
	    }
	
	    _this.parent = parentElem;
	    _this.type = type;
	    _this.title = (0, _util.sanitize)(title);
	    _this.large = opts.large === true;
	
	    if (typeof opts.code === 'string') {
	      _this.hasCode = true;
	      _this.code = (0, _util.sanitize)(opts.code).replace('\n', '<br>');
	    } else {
	      _this.hasCode = false;
	      _this.code = '';
	    }
	
	    if (typeof opts.details === 'string') {
	      _this.hasDetails = true;
	      _this.details = (0, _util.sanitize)(opts.details);
	    } else {
	      _this.hasDetails = false;
	    }
	
	    _this.actions = [];
	
	    if (Array.isArray(opts.actions)) {
	      _this.actions = opts.actions.reduce(function (actions, action) {
	        if (action.hasOwnProperty('name') && action.hasOwnProperty('command') && typeof action.name === 'string' && typeof action.command === 'string') {
	          // Add just the action "name" and "command" to the list of notification actions
	          actions = actions.concat({
	            name: action.name,
	            command: action.command
	          });
	
	          // Add the command to the list of accepted event commands
	          _get(Notification.prototype.__proto__ || Object.getPrototypeOf(Notification.prototype), 'declareEvent', _this).call(_this, action.command);
	        }
	
	        return actions;
	      }, []);
	    }
	
	    _this.expired = false;
	    return _this;
	  }
	
	  _createClass(Notification, [{
	    key: 'on',
	    value: function on(name, listener) {
	      if (this.expired === true) {
	        throw new Error('notification has expired');
	      }
	
	      _get(Notification.prototype.__proto__ || Object.getPrototypeOf(Notification.prototype), 'on', this).call(this, name, listener);
	    }
	  }, {
	    key: 'trigger',
	    value: function trigger(name, payload) {
	      if (this.expired === true) {
	        throw new Error('notification has expired');
	      }
	
	      _get(Notification.prototype.__proto__ || Object.getPrototypeOf(Notification.prototype), 'trigger', this).call(this, name, payload);
	    }
	  }, {
	    key: 'open',
	    value: function open() {
	      var _this2 = this;
	
	      if (this.expired === true) {
	        throw new Error('notification has expired');
	      }
	
	      if (this.parent instanceof jQuery === false) {
	        throw new Error('notification has not parent element');
	      }
	
	      var html = '';
	
	      html += '<div class="notif ' + this.type + ' ' + (this.large === true ? 'large' : '') + '">';
	      html += '<div class="tag"></div>';
	
	      if (this.large) {
	        html += '<button class="dismiss" title="Dismiss"></button>';
	      }
	
	      html += '<div class="content">';
	      html += '<p class="title">' + this.title + '</p>';
	
	      if (this.hasCode) {
	        html += '<code>' + this.code + '</code>';
	      }
	
	      if (this.hasDetails) {
	        html += '<p class="details">' + this.details + '</p>';
	      }
	
	      if (this.actions.length > 0) {
	        html += this.actions.reduce(function (html, action) {
	          return html + ('<button class="action" data-command="' + action.command + '">' + action.name + '</button>');
	        }, '');
	      }
	
	      html += '</div>'; // end of .content
	      html += '</div>'; // end of .notif
	
	      var elem = jQuery(html);
	
	      elem.find('button.dismiss').on('click', function () {
	        _this2.trigger('dismiss', []);
	        _this2.close();
	      });
	
	      elem.find('button[data-command]').on('click', function (event) {
	        var btn = jQuery(event.currentTarget);
	
	        var command = btn.attr('data-command');
	
	        if (typeof command === 'string') {
	          _this2.trigger(command, []);
	        }
	      });
	
	      this.elem = elem;
	      jQuery(this.parent).append(elem);
	
	      if (this.large === false) {
	        setTimeout(function () {
	          _this2.trigger('dismiss', []);
	        }, 4000);
	      }
	    }
	  }, {
	    key: 'close',
	    value: function close() {
	      var _this3 = this;
	
	      if (this.elem instanceof jQuery === false) {
	        throw new Error('notification has not been rendered yet');
	      }
	
	      // The addition of the "close" class triggers the
	      // notification's exit animation
	      this.elem.addClass('close');
	
	      // Run the tear-down code when the notification's
	      // exit animation has finished running
	      setTimeout(function () {
	        _this3.elem.remove();
	        _this3.elem = null;
	        _this3.parent = null;
	        _this3.expired = true;
	      }, 300);
	    }
	  }]);
	
	  return Notification;
	}(_eventHandler2.default);
	
	var NOTIF_VIEW_SELECTOR = '.notif-bucket';
	
	var pendingNotifications = [];
	
	var NotificationView = function () {
	  function NotificationView() {
	    _classCallCheck(this, NotificationView);
	  }
	
	  _createClass(NotificationView, null, [{
	    key: 'getElem',
	    value: function getElem() {
	      return jQuery(NOTIF_VIEW_SELECTOR);
	    }
	  }, {
	    key: 'send',
	    value: function send(type, title) {
	      var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
	
	      var elem = NotificationView.getElem();
	      var notif = new Notification(elem, type, title, opts);
	
	      pendingNotifications.push(notif);
	      notif.on('close', function () {
	        var index = pendingNotifications.indexOf(notif);
	        pendingNotifications.splice(index, 1);
	      });
	
	      return notif;
	    }
	  }, {
	    key: 'flush',
	    value: function flush() {
	      pendingNotifications.forEach(function (notif) {
	        notif.close();
	      });
	    }
	  }]);
	
	  return NotificationView;
	}();
	
	exports.default = NotificationView;

/***/ },
/* 6 */
/***/ function(module, exports) {

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
	  if (typeof dirty !== 'string') {
	    dirty = '' + dirty;
	  }
	
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
	
	var VALID_FIELDS = ['children', 'classes', 'for', 'id', 'name', 'placeholder', 'type', 'value'];
	
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
	      } else if (Array.isArray(second)) {
	        // Assume "second" argument is an array of HTML strings
	        return '<' + tagName + ' class="' + first + '">' + second.join('') + '</' + tagName + '>';
	      } else {
	        console.log(second);
	        throw new Error('un-recognized type of second argument');
	      }
	    } else if (Array.isArray(first)) {
	      if (selfClosing) {
	        throw new Error('self closing tags like ' + tagName + ' can not have children');
	      }
	
	      return '<' + tagName + '>' + first.join('') + '</' + tagName + '>';
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
	            if (Array.isArray(attrName['classes'])) {
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
	      if (selfClosing && Array.isArray(first.children)) {
	        throw new Error('self closing tags like ' + tagName + ' can not have children');
	      }
	
	      var children = '';
	
	      if (typeof first.children === 'undefined') {
	        children = '';
	      } else if (typeof first.children === 'string') {
	        // Accept a string for the children field
	        children = first.children;
	      } else if (first.children instanceof Array) {
	        // Convert children to strings then concatenate
	        children = first.children.map(function (child) {
	          return child.toString();
	        }).join('');
	      } else {
	        // Emit an error if the "children" field was of some other type
	        console.error(first);
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

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };
	
	var _eventHandler = __webpack_require__(2);
	
	var _eventHandler2 = _interopRequireDefault(_eventHandler);
	
	var _controlSurface = __webpack_require__(1);
	
	var _controlSurface2 = _interopRequireDefault(_controlSurface);
	
	var _notificationView = __webpack_require__(5);
	
	var _notificationView2 = _interopRequireDefault(_notificationView);
	
	var _util = __webpack_require__(6);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var RuntimeView = function (_EventHandler) {
	  _inherits(RuntimeView, _EventHandler);
	
	  function RuntimeView(wrapperElem) {
	    _classCallCheck(this, RuntimeView);
	
	    // Attach events to the RuntimeView's control surface
	    var _this = _possibleConstructorReturn(this, (RuntimeView.__proto__ || Object.getPrototypeOf(RuntimeView)).call(this));
	    // Call EventHandler initialization code
	
	
	    _this.cs = new _controlSurface2.default(wrapperElem.find('.control-surface'));
	    _this.cs.disableCommands(['step-backward', 'step-forward']);
	
	    // Listen for clicks to the step-backward button on the control surface to
	    // move the trace's execution point backward by 1. If the user is already at
	    // the start of the trace, the point stays the same
	    _this.cs.on('step-backward', function () {
	      if (_this.rendered === true && _this.index - 1 >= 0) {
	        _this.setVisiblePoint(_this.index - 1);
	      }
	    });
	
	    // Listen for clicks to the step-forward button on the control surface to
	    // move the trace's execution point forward by 1. If the user is already at
	    // the end of the trace, the point stays the same
	    _this.cs.on('step-forward', function () {
	      if (_this.rendered === true && _this.index + 1 < _this.trace.length) {
	        _this.setVisiblePoint(_this.index + 1);
	      }
	    });
	
	    // Set "wrapperElem" property & significant children elements
	    _this.wrapperElem = wrapperElem;
	    _this.visualizationElem = wrapperElem.find('.trace-visualization');
	    _this.variablesElem = wrapperElem.find('.variables-wrapper');
	
	    if (_this.visualizationElem.length < 1) {
	      throw new Error('missing .trace-visualization element');
	    }
	
	    if (_this.variablesElem.length < 1) {
	      throw new Error('missing .variables-wrapper element');
	    }
	
	    // Define events that can be emitted by RuntimeView objects. set-trace-point
	    // events are emitted whenever the user changes the currently viewed
	    // execution point. get-advice events are emitted whenever the user has
	    // specified a variable's target value and indicates that they want the app
	    // to suggest some changes
	    _get(RuntimeView.prototype.__proto__ || Object.getPrototypeOf(RuntimeView.prototype), 'declareEvent', _this).call(_this, 'set-trace-point');
	    _get(RuntimeView.prototype.__proto__ || Object.getPrototypeOf(RuntimeView.prototype), 'declareEvent', _this).call(_this, 'get-advice');
	
	    // A boolean flag indicating whether this view is populated with program
	    // trace data. If it isn't populated, the step-forward and step-backward
	    // buttons won't trigger any actions
	    _this.rendered = false;
	
	    // A cached copy of the current trace & scope data
	    _this.trace = [];
	    _this.scope = {};
	
	    // Current trace point being displayed
	    _this.index = 0;
	
	    // Display "pending" messages in the visualization and variable views
	    _this.showPendingMessage();
	    return _this;
	  }
	
	  _createClass(RuntimeView, [{
	    key: 'render',
	    value: function render(trace) {
	      var _this2 = this;
	
	      if (Array.isArray(trace) === false) {
	        throw new Error('trace must be an array, received ' + (typeof trace === 'undefined' ? 'undefined' : _typeof(trace)));
	      }
	
	      // The visualization of the execution trace is built last-to-first
	      // so that function return values can be collected before their
	      // signature, argument, and return values have to be added to the
	      // visualization. A stack of return values is kept as the trace is
	      // traversed so whenever a "call" event is encountered, the topmost
	      // return value is popped and used as the return value
	      var returnValueStack = [];
	
	      var html = '';
	
	      html += (0, _util.htmlBuilder)(['<div class="scope top-level">', '<ol class="execution">']);
	
	      html += trace.reduceRight(function (html, point, index) {
	        var lineNum = (0, _util.sanitize)(point['line']);
	        var pointHtml = '';
	
	        var _ret = function () {
	          switch (point['event']) {
	            case 'instruction_limit_reached':
	              _notificationView2.default.send('fatal', 'VM reached instruction limit', {
	                large: true,
	                code: point['exception_msg']
	              }).open();
	
	              return {
	                v: html
	              };
	
	            case 'call':
	              // Collect a list of the function call's argument values
	              var args = {};
	
	              try {
	                args = point['stack_to_render'][0]['encoded_locals'];
	              } catch (err) {
	                throw new Error('cannot get local variables of point ' + index);
	              }
	
	              var argsHtml = Object.keys(args).reduce(function (html, argName) {
	                // Ignore any argument names that are part of prototype objects
	                if (args.hasOwnProperty(argName) === false) {
	                  return html;
	                }
	
	                return html.concat((0, _util.htmlBuilder)([_util.htmlBuilder.span('sig-name', argName), _util.htmlBuilder.span('sig-syntax', ':'), _util.htmlBuilder.span('sig-value', '' + args[argName])]));
	              }, []).join(_util.htmlBuilder.span('sig-syntax', ','));
	
	              var funcName = (0, _util.sanitize)(point['func_name']);
	              var returnValue = (0, _util.sanitize)(returnValueStack.pop());
	
	              if (typeof returnValue !== 'string') {
	                throw new Error('call with no return value');
	              }
	
	              pointHtml = (0, _util.htmlBuilder)([
	              // Render only the open tag since the closing tag was rendered
	              // when the corresponding "return" trace point was rendered
	              '<li class="point call expanded">',
	
	              // Hidden radio button used to ensure that there can't be more
	              // than 1 trace point selected at a time
	              _util.htmlBuilder.input({
	                type: 'radio',
	                id: 'point-' + index,
	                classes: ['point-radio-button'],
	                name: 'point',
	                value: index,
	                'data-line': lineNum
	              }),
	
	              // Label element is the visual representation of the trace point
	              // on screen including the function signature and the line-dot icon
	              _util.htmlBuilder.label({
	                classes: ['func-sig'],
	                for: 'point-' + index,
	                children: [_util.htmlBuilder.span('sig-method', '' + funcName), _util.htmlBuilder.span('sig-syntax', '('), argsHtml, _util.htmlBuilder.span('sig-syntax', ')'), _util.htmlBuilder.span('sig-syntax', '&xrArr;'), _util.htmlBuilder.span('sig-value field', returnValue)]
	              }),
	
	              // Render only the open tags since the closing tags were rendered
	              // when the corresponding "return" trace point was rendered
	              '<div class="scope">', '<ol class="execution">']);
	
	              return {
	                v: pointHtml + html
	              };
	
	            case 'return':
	            case 'step_line':
	              var isReturn = point['event'] === 'return';
	
	              // If this point is a return point, append the return value
	              // to the stack of return values so the corresponding "call" trace
	              // point can use that value in its function signature
	              if (isReturn) {
	                var _returnValue = 'void';
	
	                try {
	                  _returnValue = point['stack_to_render'][0]['encoded_locals']['__return__'].toString();
	                } catch (err) {
	                  throw new Error('cannot get "__return__" field of point ' + index);
	                }
	
	                returnValueStack.push((0, _util.sanitize)(_returnValue));
	              }
	
	              pointHtml = (0, _util.htmlBuilder)([_util.htmlBuilder.li('point', [_util.htmlBuilder.input({
	                type: 'radio',
	                id: 'point-' + index,
	                classes: ['point-radio-button'],
	                name: 'point',
	                value: index,
	                'data-line': lineNum
	              }), _util.htmlBuilder.label({
	                for: 'point-' + index
	              })]),
	
	              // Closing tags that correspond to open tags rendered for the
	              // corresponding "call" trace point
	              isReturn ? '</ol>' : '', isReturn ? '</div>' : '', isReturn ? '</li>' : '']);
	
	              return {
	                v: pointHtml + html
	              };
	
	            default:
	              console.error(point);
	              throw new Error('cannot handle point at index ' + index);
	          }
	        }();
	
	        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
	      }, '');
	
	      html += (0, _util.htmlBuilder)(['</div>', '</ol>']);
	
	      // Insert the HTML into the DOM
	      this.visualizationElem.html(html);
	
	      // Attach event listeners to the newly created visualization HTML
	      this.visualizationElem.find('.scope input[type="radio"]').on('click', function (event) {
	        var id = jQuery(event.currentTarget).attr('id');
	        var index = parseInt(id.replace('point-', ''), 10);
	
	        // Ensure that no corrosive values like NaN escape into the rest of the logic
	        if (isNaN(index)) {
	          index = 0;
	        }
	
	        _this2.setVisiblePoint(index);
	      });
	
	      // Cache the trace data
	      this.trace = trace;
	
	      // Set the "rendered" flag to true
	      this.rendered = true;
	
	      this.initializeVariableView();
	
	      // View the first execution point
	      this.setVisiblePoint(0);
	
	      // Enable forward, backward navigation buttons
	      this.cs.enableCommands(['step-backward', 'step-forward']);
	    }
	  }, {
	    key: 'showPendingMessage',
	    value: function showPendingMessage() {
	      var html = '<p class="pending">waiting for execution trace&hellip;</p>';
	      this.rendered = false;
	
	      this.visualizationElem.html(html);
	      this.variablesElem.html(html);
	    }
	  }, {
	    key: 'clear',
	    value: function clear() {
	      // Reset stateful properties of the view
	      this.rendered = false;
	      this.trace = [];
	      this.scope = {};
	      this.index = 0;
	
	      // Disable commands since there's not data to manipulate
	      this.cs.disableCommands(['step-backward', 'step-forward']);
	
	      // Replace any HTML embedded in the trace or variable views with
	      // a basic "pending" message
	      this.showPendingMessage();
	    }
	  }, {
	    key: 'setVisiblePoint',
	    value: function setVisiblePoint(index) {
	      if (this.rendered === true) {
	        if (index >= this.trace.length || index < 0) {
	          throw new Error('index ' + index + ' is out of range');
	        }
	
	        var radioButton = this.wrapperElem.find('.point-radio-button:eq(' + index + ')');
	        var line = parseInt(radioButton.attr('data-line'));
	
	        if (isNaN(line)) {
	          throw new Error('button at index ' + index + ' has corrupted "data-line" property');
	        }
	
	        // If everything checks out, commit to the change
	        this.index = index;
	        radioButton.prop('checked', true);
	        this.setVisibleScope(index);
	        _get(RuntimeView.prototype.__proto__ || Object.getPrototypeOf(RuntimeView.prototype), 'trigger', this).call(this, 'set-trace-point', [line]);
	      }
	    }
	  }, {
	    key: 'initializeVariableView',
	    value: function initializeVariableView() {
	      if (this.rendered === true) {
	        var variableListHtml = '<ol></ol>';
	        var suggestBtnHtml = '<button class="action-button success" disabled>Get suggestions</button>';
	        var cancelBtnHtml = '<button class="action-button" disabled>Cancel</button>';
	        this.variablesElem.html(variableListHtml + suggestBtnHtml + cancelBtnHtml);
	      }
	    }
	  }, {
	    key: 'setVisibleScope',
	    value: function setVisibleScope(index) {
	      var _this3 = this;
	
	      if (this.rendered === true) {
	        if (index >= this.trace.length || index < 0) {
	          throw new Error('index ' + index + ' is out of range');
	        }
	
	        var point = this.trace[index];
	        var callstack = point['stack_to_render'];
	
	        if (Array.isArray(callstack) === false) {
	          throw new Error('malformed scope at index ' + index);
	        }
	
	        if (callstack.length > 0) {
	          (function () {
	            var topCallstack = callstack[0];
	            var locals = topCallstack['encoded_locals'] || {};
	            var variablesHtml = Object.keys(locals).reduce(function (html, localName) {
	              if (locals.hasOwnProperty(localName) === false) {
	                return html;
	              }
	
	              return html + _util.htmlBuilder.li([_util.htmlBuilder.span('current', [_util.htmlBuilder.span('name', (0, _util.sanitize)(localName)), _util.htmlBuilder.span('value field', (0, _util.sanitize)(locals[localName]))]), ' &xrarr; ', _util.htmlBuilder.input({
	                type: 'textbox',
	                classes: ['edit'],
	                placeholder: '?'
	              })]);
	            }, '');
	
	            _this3.variablesElem.find('ol').html(variablesHtml);
	          })();
	        }
	      }
	    }
	  }]);
	
	  return RuntimeView;
	}(_eventHandler2.default);
	
	exports.default = RuntimeView;

/***/ },
/* 8 */
/***/ function(module, exports) {

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
	
	      localforage.getItem(WORKING_PROGRAM_KEY).then(function (value) {
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
	
	      localforage.getItem(WORKING_PROGRAM_KEY).then(function (value) {
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
	
	      localforage.setItem(WORKING_PROGRAM_KEY, newValue).then(function (value) {
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
	        localforage.clear().then(function () {
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

/***/ },
/* 9 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var TracePayload = function () {
	  function TracePayload(source, stdin) {
	    _classCallCheck(this, TracePayload);
	
	    this.source = source;
	    this.stdin = stdin;
	  }
	
	  _createClass(TracePayload, [{
	    key: "stringify",
	    value: function stringify() {
	      return JSON.stringify({
	        source: this.source,
	        input: this.stdin
	      });
	    }
	  }]);
	
	  return TracePayload;
	}();
	
	exports.default = TracePayload;

/***/ }
/******/ ]);
//# sourceMappingURL=client.js.map