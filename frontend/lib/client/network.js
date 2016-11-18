'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _tracePayload = require('./trace-payload');

var _tracePayload2 = _interopRequireDefault(_tracePayload);

var _notificationView = require('./notification-view');

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
        return void cb(null, res.trace);
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
          cb(err, '');
        });

        notif.open();
      };

      jQuery.ajax({
        url: '/trace',
        type: 'POST',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        data: payload.stringify()
      }).done(ajaxDone).fail(ajaxFail);
    }
  }]);

  return Network;
}();

exports.default = Network;