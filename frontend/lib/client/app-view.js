'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _controlSurface = require('./control-surface');

var _controlSurface2 = _interopRequireDefault(_controlSurface);

var _editorView = require('./editor-view');

var _editorView2 = _interopRequireDefault(_editorView);

var _network = require('./network');

var _network2 = _interopRequireDefault(_network);

var _notificationView = require('./notification-view');

var _notificationView2 = _interopRequireDefault(_notificationView);

var _runtimeView = require('./runtime-view');

var _runtimeView2 = _interopRequireDefault(_runtimeView);

var _storage = require('./storage');

var _storage2 = _interopRequireDefault(_storage);

var _tracePayload = require('./trace-payload');

var _tracePayload2 = _interopRequireDefault(_tracePayload);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AppView = function () {
  function AppView() {
    _classCallCheck(this, AppView);

    this.edv = new _editorView2.default(jQuery('.mp-editor'), '');
    this.rtv = new _runtimeView2.default(jQuery('.mp-runtime'));
    this.mcs = new _controlSurface2.default(jQuery('.mp-controls'));

    this._init();
  }

  _createClass(AppView, [{
    key: '_init',
    value: function _init() {
      var _this = this;

      var traceAction = function traceAction() {
        _this.mcs.disableCommands(['trace']);
        _this.mcs.startSpinning('trace');
        _this.rtv.renderPending();

        // Clear any pending notifications under the assumption that they
        // were meant for a previous program
        _notificationView2.default.flush();

        var payload = new _tracePayload2.default(_this.edv.getProgram(), '');

        var getTrace = function getTrace(err, res) {
          _this.mcs.stopSpinning('trace');
          _this.mcs.enableCommands(['trace']);

          if (err !== null || res === '') {
            console.error(err);
            _notificationView2.default.send('fatal', 'Error getting execution trace').open();
            return;
          }

          var parsed = null;

          try {
            parsed = JSON.parse(res);
          } catch (err) {
            console.error(err);
            _notificationView2.default.send('fatal', 'Error parsing execution trace').open();
            return;
          }

          if (parsed !== null && parsed.trace.length > 0 && parsed.trace[0]['event'] === 'instruction_limit_reached') {
            var notif = _notificationView2.default.send('fatal', 'Error generating trace', {
              large: true,
              code: parsed.trace[0]['exception_msg'],
              details: 'Trying again in a moment will likely fix this issue.',
              actions: [{ name: 'Try Again', command: 'retry' }]
            });

            notif.on('retry', function () {
              _this.mcs.startSpinning('trace');
              _network2.default.getTrace(payload, getTrace);
            });

            notif.on('dismiss', function () {
              throw new Error(parsed.trace[0]['exception_msg']);
            });

            notif.open();
          } else {
            _this.rtv.render(parsed.trace);
          }
        };

        _network2.default.getTrace(payload, getTrace);
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