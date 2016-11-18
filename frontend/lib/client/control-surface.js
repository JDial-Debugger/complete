'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _eventHandler = require('./event-handler');

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

      if (commands instanceof Array === false) {
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

      if (commands instanceof Array === false) {
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