'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _eventHandler = require('./event-handler');

var _eventHandler2 = _interopRequireDefault(_eventHandler);

var _controlSurface = require('./control-surface');

var _controlSurface2 = _interopRequireDefault(_controlSurface);

var _util = require('./util');

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

    // Listen for clicks to the step-backward button on the control surface to
    // move the trace's execution point backward by 1. If the user is already at
    // the start of the trace, the point stays the same
    _this.cs.on('step-backward', function () {
      // CLEAN
      if (_this.rendered === true) {
        var curr = jQuery(_this.wrapperElem.find('input[type=radio]:checked'));
        var index = parseInt(curr.val());

        var selector = 'input#point-' + (index - 1);

        if (_this.wrapperElem.find(selector).length > 0) {
          _this.wrapperElem.find(selector).prop('checked', true);
          var line = parseInt(_this.wrapperElem.find(selector).attr('data-line'));
          _get(RuntimeView.prototype.__proto__ || Object.getPrototypeOf(RuntimeView.prototype), 'trigger', _this).call(_this, 'set-trace-point', [line]);
        }
      }
    });

    // Listen for clicks to the step-forward button on the control surface to
    // move the trace's execution point forward by 1. If the user is already at
    // the end of the trace, the point stays the same
    _this.cs.on('step-forward', function () {
      // CLEAN
      if (_this.rendered === true) {
        var curr = jQuery(_this.wrapperElem.find('input[type=radio]:checked'));
        var index = parseInt(curr.val());

        var selector = 'input#point-' + (index + 1);

        if (_this.wrapperElem.find(selector).length > 0) {
          _this.wrapperElem.find(selector).prop('checked', true);
          var line = parseInt(_this.wrapperElem.find(selector).attr('data-line'));
          _get(RuntimeView.prototype.__proto__ || Object.getPrototypeOf(RuntimeView.prototype), 'trigger', _this).call(_this, 'set-trace-point', [line]);
        }
      }
    });

    // Set "wrapperElem" property
    _this.wrapperElem = wrapperElem;

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
    return _this;
  }

  // render (trace: JSONArray): void {
  //   // CLEAN
  //   let html = renderScope(trace)
  //   console.log(html)
  //   this.wrapperElem.find('.trace-visualization').html(html)
  //   jQuery(this.wrapperElem.find('input#point-0')).prop('checked', true)
  //   let line = parseInt(jQuery(this.wrapperElem.find('input#point-0')).attr('data-line'))
  //   super.trigger('set-trace-point', [line])
  //   this.rendered = true
  // }

  _createClass(RuntimeView, [{
    key: 'render',
    value: function render(trace) {
      // The visualization of the execution trace is built last-to-first
      // so that function return values can be collected before their
      // signature, argument, and return values have to be added to the
      // visualization. A stack of return values is kept as the trace is
      // traversed so whenever a "call" event is encountered, the topmost
      // return value is popped and used as the return value
      var returnValueStack = [];

      var html = trace.reduceRight(function (html, point, index) {
        var lineNum = (0, _util.sanitize)(point['line']);
        var pointHtml = void 0;

        var _ret = function () {
          switch (point['event']) {
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

                return html.concat((0, _util.htmlBuilder)([_util.htmlBuilder.span('sig-name', argName), ':', _util.htmlBuilder.span('sig-value', args[argName])]));
              }, []).join(',');

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
                name: 'point',
                value: index,
                'data-line': lineNum
              }),

              // Label element is the visual representation of the trace point
              // on screen including the function signature and the line-dot icon
              _util.htmlBuilder.label({
                classes: ['func-sig'],
                for: 'point-' + index,
                children: [_util.htmlBuilder.span('sig-method', '' + funcName), '(', argsHtml, ')', _util.htmlBuilder.span('sig-syntax', '&xrArr;'), _util.htmlBuilder.span('sig-value field', returnValue)]
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
                  _returnValue = point['stack_to_render'][0]['encoded_locals']['__return__'];
                } catch (err) {
                  throw new Error('cannot get "__return__" field of point ' + index);
                }

                returnValueStack.push((0, _util.sanitize)(_returnValue));
              }

              pointHtml = (0, _util.htmlBuilder)([
              // Closing tags that correspond to open tags rendered for the
              // corresponding "call" trace point
              isReturn ? '</ol>' : '', isReturn ? '</div>' : '', isReturn ? '</li>' : '', _util.htmlBuilder.li('point', [_util.htmlBuilder.input({
                type: 'radio',
                id: 'point-' + index,
                name: 'point',
                value: index,
                'data-line': lineNum
              })])]);

              return {
                v: pointHtml + html
              };

            default:
              throw new Error('cannot handle point at index ' + index);
          }
        }();

        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
      }, '');

      console.log(html);
    }
  }, {
    key: 'renderPending',
    value: function renderPending() {
      this.rendered = false;
      var html = '<em style="font-family:Consolas;padding:16px;color:gray">pending</em>';
      this.wrapperElem.find('.trace-visualization').html(html);
    }
  }]);

  return RuntimeView;
}(_eventHandler2.default);

exports.default = RuntimeView;