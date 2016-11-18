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
      if (this.events.hasOwnProperty(name) === false || this.events[name] instanceof Array === false) {
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
      if (this.events.hasOwnProperty(name) === false && this.events[name] instanceof Array === false) {
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