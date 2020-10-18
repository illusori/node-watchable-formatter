# node-watchable-formatter

Watch specific object properties for changes. Add and remove listeners. Supports nested objects and arrays. Intended for use in lightweight data-bindings.

It's exactly like [watchable](https://github.com/illusori/node-watchable) but you can use lightweight reformatting functions to transform the value before passing it to your binding function.

# Install

Not on npm yet, so you'll have to download it the old fashioned way. FIXME: update once it's released.

# Usage

```js
const { WatchableFormatter } = require('watchable-formatter');

let m = new WatchableFormatter({ a: 1 });
m.addListener('a',
    (newValue, oldValue, prop) => console.log(`${prop} changed from ${JSON.stringify(oldValue)} to ${JSON.stringify(newValue)}.`),
    (newValue, oldValue, prop) => newValue.toFixed(2)
);

// (newValue, oldValue, prop) => newValue.toFixed(2) changed from undefined to "1.00".
// Gets called with the initial value.
// Note: property name gets a little mangled, this should probably be considered a bug. :D

m.a += 1.50001;
// (newValue, oldValue, prop) => newValue.toFixed(2) changed from "1.00" to "2.50".
```

See [watchable](https://github.com/illusori/node-watchable) for more examples, this is a fairly thin wrapper that sets up an intermediate store for the formatted values.

One useful side effect is that your final binding function will only becalled when the intermediate transformed value changes, not every time the original value changes. To continue the above example:

```js
m.a += 0.00001;
// No call to the logging function even though m.a changed.

m.a += 1;
// (newValue, oldValue, prop) => newValue.toFixed(2) changed from "2.50" to "3.50".
// Change was big enough to change the intermediate value.

console.log(m.a);
// 3.50002
```

# API

## Construction

```js
watchable = new WatchableFormatter(original);
```

Creates a watchable from `original`. A watchable is a Proxy wrapper around the original.

By default it will wrap `original` using [Watchable](https://github.com/illusori/node-watchable), however you can pass in an instance of a another `Watchable` subclasses if you prefer to extend that:

```js
const { WatchableFormatter } = require('watchable-formatter');
const { WatchableJSONPath } = require('watchable-jsonpath');

let m = new WatchableFormatter(new WatchableJSONPath({ a: { b: 1 } }));
m.addListener('a.b', ..., ...);
```

WARNING: Changes to `original` will NOT be watched, you will need to use the returned watchable. However, since nested objects are replaced, the original object will be modified. Use the returned watchable and you'll be fine. If you want the original data-structure to be unmodified, create a deep clone yourself before watching.

## watchable.addListener(prop, listener, transform)

Adds a listener to a property of the watchable, after passing it through the transform function.

## watchable.removeListener(prop, listener, transform)

Removes the given listener from the watch list on that property with the given transform. If you added an anonymous function as a listener or transform, you'll have needed to have kept a reference to it somewhere for this to work.

## watchable[property]._rawValue_

Gets the raw (unwrapped) value of a property in case you need the non-proxied version for some reasons.

## watchable.listeners(prop)

Returns an array of all listeners for the matching jsonpaths.

# See also

 * [on-change](https://github.com/sindresorhus/on-change) - Watch entire objects for non-specific changes.
 * [watchable](https://github.com/illusori/node-watchable) - The base library this uses.
 * [watchable-jsonpath](https://github.com/illusori/node-watchable-jsonpath) - Watchable with JSONPath navigation.
