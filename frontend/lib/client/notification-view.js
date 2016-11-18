'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _eventHandler = require('./event-handler');

var _eventHandler2 = _interopRequireDefault(_eventHandler);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var NOTIF_TYPES = ['fatal', 'alert', 'info', 'success'];

var Notification = function (_EventHandler) {
  _inherits(Notification, _EventHandler);

  function Notification(parentElem, type, title) {
    var opts = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

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

    if (opts.actions instanceof Array) {
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

      if (this.expired === true) {
        throw new Error('notification has expired');
      }

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