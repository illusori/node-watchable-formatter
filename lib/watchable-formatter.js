/* jshint esversion: 9, node: true */
"use strict";

const { Watchable, WatchableHandler } = require('watchable');

// Use a class factory rather than a class, so we can wrap any WatchableHandler subclass.
class WatchableFormatterHandlerFactory {
    static subclasses = {};

    static handlerClassName(superclass) {
        let superclassName = superclass.name;
        if (superclassName.substring(superclassName.length - 7) == 'Handler') {
            return superclassName.substring(0, superclassName.length - 7) + 'FormattableHandler';
        }
        return superclassName + 'Formattable';
    }

    static generateSubclassHandler (superclass, subclassName) {
        // The immediately-invoked object evaluation ensures the class gets a sane name,
        // rather than being anonymous. Not sure that's useful, but "eh".
        // Also possibly only works under node. Doesn't seem to name it under Chrome.
        return ({ [subclassName]:
        class extends superclass {
            constructor () {
                super();
                this.formattedValues = new Watchable({});
                this.formattingListeners = {};
            }

            static fromHandler (source) {
                let handler = super.fromHandler(source)
                if (source?.formattedValues) {
                    // TODO: Hmm, going to be a shared reference. Problem?
                    handler.formattedValues = source.formattedValues;
                }
                if (source?.formattingListeners) {
                    handler.formattingListeners = Object.assign({}, source.formattingListeners);
                }
                return handler;
            }

            addListener (target, prop, listener, formatter = null) {
                if (formatter === null) {
                    return super.addListener(target, prop, listener);
                }
                if (this.formattedValues[prop] === undefined) {
                    this.formattedValues[prop] = {};
                }
                if (this.formattingListeners[prop] === undefined) {
                    this.formattingListeners[prop] = {};
                }
                if (this.formattingListeners[prop][formatter] === undefined) {
                    this.formattingListeners[prop][formatter] = (...args) => {
                        this.formattedValues[prop][formatter] = formatter(...args);
                    };
                }
                super.addListener(target, prop, this.formattingListeners[prop][formatter]);
                // TODO: rewrite listener to fudge prop?
                this.formattedValues[prop].addListener(formatter, listener);
            }

            removeListener (target, prop, listener, formatter = null) {
                if (formatter === null) {
                    return super.removeListener(target, prop, listener);
                }
                this.formattedValues[prop].removeListener(formatter, listener);
                if (!this.formattedValues[prop].listeners(formatter).length) {
                    super.removeListener(target, prop, this.formattingListeners[prop][formatter]);
                    delete this.formattingListeners[prop][formatter];
                    if (Object.keys(this.formattingListeners[prop]).length === 0) {
                        delete this.formattingListeners[prop];
                    }
                    delete this.formattedValues[prop][formatter];
                    if (Object.keys(this.formattedValues[prop]).length === 0) {
                        delete this.formattedValues[prop];
                    }
                }
            }
        }})[subclassName];
    }

    static subclassHandler (superclass) {
        let subclassName = this.handlerClassName(superclass);

        if (!this.subclasses[subclassName]) {
            // Cache for probably tiny performance effects.
            this.subclasses[subclassName] = this.generateSubclassHandler(superclass, subclassName);
        }
        return this.subclasses[subclassName];
    }
}

class WatchableFormatter {
    constructor (target) {
        let superclass = target._watchableHandler_?.constructor ?? WatchableHandler;
        return WatchableFormatterHandlerFactory.subclassHandler(superclass).attach(target);
    }

}

exports.WatchableFormatterHandlerFactory = WatchableFormatterHandlerFactory;
exports.WatchableFormatter = WatchableFormatter;
