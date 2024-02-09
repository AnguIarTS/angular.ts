// NOTE: ADVANCED_OPTIMIZATIONS mode.
//
// This file is compiled with Closure compiler's ADVANCED_OPTIMIZATIONS flag! Be wary of using
// constructs incompatible with that mode.

/* global $interpolateMinErr: false */
/* global isFunction: false */
/* global noop: false */

/**
 * @constructor
 * @private
 */
function MessageSelectorBase(expressionFn, choices) {
  let self = this;
  this.expressionFn = expressionFn;
  this.choices = choices;
  if (choices["other"] === undefined) {
    throw $interpolateMinErr("reqother", "“other” is a required option.");
  }
  this.parsedFn = function (context) {
    return self.getResult(context);
  };
  this.parsedFn["$$watchDelegate"] = function $$watchDelegate(
    scope,
    listener,
    objectEquality,
  ) {
    return self.watchDelegate(scope, listener, objectEquality);
  };
  this.parsedFn["exp"] = expressionFn["exp"];
  this.parsedFn["expressions"] = expressionFn["expressions"];
}

MessageSelectorBase.prototype.getMessageFn = function getMessageFn(value) {
  return this.choices[this.categorizeValue(value)];
};

MessageSelectorBase.prototype.getResult = function getResult(context) {
  return this.getMessageFn(this.expressionFn(context))(context);
};

MessageSelectorBase.prototype.watchDelegate = function watchDelegate(
  scope,
  listener,
  objectEquality,
) {
  let watchers = new MessageSelectorWatchers(
    this,
    scope,
    listener,
    objectEquality,
  );
  return function () {
    watchers.cancelWatch();
  };
};

/**
 * @constructor
 * @private
 */
function MessageSelectorWatchers(msgSelector, scope, listener, objectEquality) {
  let self = this;
  this.scope = scope;
  this.msgSelector = msgSelector;
  this.listener = listener;
  this.objectEquality = objectEquality;
  this.lastMessage = undefined;
  this.messageFnWatcher = noop;
  let expressionFnListener = function (newValue, oldValue) {
    return self.expressionFnListener(newValue, oldValue);
  };
  this.expressionFnWatcher = scope["$watch"](
    msgSelector.expressionFn,
    expressionFnListener,
    objectEquality,
  );
}

MessageSelectorWatchers.prototype.expressionFnListener =
  function expressionFnListener(newValue, oldValue) {
    let self = this;
    this.messageFnWatcher();
    let messageFnListener = function (newMessage, oldMessage) {
      return self.messageFnListener(newMessage, oldMessage);
    };
    let messageFn = this.msgSelector.getMessageFn(newValue);
    this.messageFnWatcher = this.scope["$watch"](
      messageFn,
      messageFnListener,
      this.objectEquality,
    );
  };

MessageSelectorWatchers.prototype.messageFnListener =
  function messageFnListener(newMessage, oldMessage) {
    this.listener.call(
      null,
      newMessage,
      newMessage === oldMessage ? newMessage : this.lastMessage,
      this.scope,
    );
    this.lastMessage = newMessage;
  };

MessageSelectorWatchers.prototype.cancelWatch = function cancelWatch() {
  this.expressionFnWatcher();
  this.messageFnWatcher();
};

/**
 * @constructor
 * @extends MessageSelectorBase
 * @private
 */
function SelectMessage(expressionFn, choices) {
  MessageSelectorBase.call(this, expressionFn, choices);
}

function SelectMessageProto() {}
SelectMessageProto.prototype = MessageSelectorBase.prototype;

SelectMessage.prototype = new SelectMessageProto();
SelectMessage.prototype.categorizeValue = function categorizeSelectValue(
  value,
) {
  return this.choices[value] !== undefined ? value : "other";
};

/**
 * @constructor
 * @extends MessageSelectorBase
 * @private
 */
function PluralMessage(expressionFn, choices, offset, pluralCat) {
  MessageSelectorBase.call(this, expressionFn, choices);
  this.offset = offset;
  this.pluralCat = pluralCat;
}

function PluralMessageProto() {}
PluralMessageProto.prototype = MessageSelectorBase.prototype;

PluralMessage.prototype = new PluralMessageProto();
PluralMessage.prototype.categorizeValue = function categorizePluralValue(
  value,
) {
  if (isNaN(value)) {
    return "other";
  } else if (this.choices[value] !== undefined) {
    return value;
  } else {
    let category = this.pluralCat(value - this.offset);
    return this.choices[category] !== undefined ? category : "other";
  }
};
