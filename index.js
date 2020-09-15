/*! (c) Andrea Giammarchi @webreflection ISC */
(function () {
  'use strict';

  var Lie = typeof Promise === 'function' ? Promise : function (fn) {
    var queue = [],
        resolved = 0,
        value;
    fn(function ($) {
      value = $;
      resolved = 1;
      queue.splice(0).forEach(then);
    });
    return {
      then: then
    };

    function then(fn) {
      return resolved ? setTimeout(fn, 0, value) : queue.push(fn), this;
    }
  };

  var attributesObserver = (function (whenDefined, MutationObserver) {
    var attributeChanged = function attributeChanged(records) {
      for (var i = 0, length = records.length; i < length; i++) {
        dispatch(records[i]);
      }
    };

    var dispatch = function dispatch(_ref) {
      var target = _ref.target,
          attributeName = _ref.attributeName,
          oldValue = _ref.oldValue;
      target.attributeChangedCallback(attributeName, oldValue, target.getAttribute(attributeName));
    };

    return function (target, is) {
      var attributeFilter = target.constructor.observedAttributes;

      if (attributeFilter) {
        whenDefined(is).then(function () {
          new MutationObserver(attributeChanged).observe(target, {
            attributes: true,
            attributeOldValue: true,
            attributeFilter: attributeFilter
          });

          for (var i = 0, length = attributeFilter.length; i < length; i++) {
            if (target.hasAttribute(attributeFilter[i])) dispatch({
              target: target,
              attributeName: attributeFilter[i],
              oldValue: null
            });
          }
        });
      }

      return target;
    };
  });

  var _self = self,
      document = _self.document,
      MutationObserver = _self.MutationObserver,
      Set = _self.Set,
      WeakMap = _self.WeakMap;

  var elements = function elements(element) {
    return 'querySelectorAll' in element;
  };

  var filter = [].filter;
  var qsaObserver = (function (options) {
    var live = new WeakMap();

    var callback = function callback(records) {
      var query = options.query;

      if (query.length) {
        for (var i = 0, length = records.length; i < length; i++) {
          loop(filter.call(records[i].addedNodes, elements), true, query);
          loop(filter.call(records[i].removedNodes, elements), false, query);
        }
      }
    };

    var drop = function drop(elements) {
      for (var i = 0, length = elements.length; i < length; i++) {
        live["delete"](elements[i]);
      }
    };

    var flush = function flush() {
      callback(observer.takeRecords());
    };

    var loop = function loop(elements, connected, query) {
      var set = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : new Set();

      var _loop = function _loop(_selectors, _element, i, length) {
        // guard against repeated elements within nested querySelectorAll results
        if (!set.has(_element = elements[i])) {
          set.add(_element);

          if (connected) {
            for (var q, m = matches(_element), _i = 0, _length = query.length; _i < _length; _i++) {
              if (m.call(_element, q = query[_i])) {
                if (!live.has(_element)) live.set(_element, new Set());
                _selectors = live.get(_element); // guard against selectors that were handled already

                if (!_selectors.has(q)) {
                  _selectors.add(q);

                  options.handle(_element, connected, q);
                }
              }
            }
          } // guard against elements that never became live
          else if (live.has(_element)) {
              _selectors = live.get(_element);
              live["delete"](_element);

              _selectors.forEach(function (q) {
                options.handle(_element, connected, q);
              });
            }

          loop(_element.querySelectorAll(query), connected, query, set);
        }

        selectors = _selectors;
        element = _element;
      };

      for (var selectors, element, i = 0, length = elements.length; i < length; i++) {
        _loop(selectors, element, i);
      }
    };

    var matches = function matches(element) {
      return element.matches || element.webkitMatchesSelector || element.msMatchesSelector;
    };

    var parse = function parse(elements) {
      var connected = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      loop(elements, connected, options.query);
    };

    var observer = new MutationObserver(callback);
    var root = options.root || document;
    var query = options.query;
    observer.observe(root, {
      childList: true,
      subtree: true
    });
    if (query.length) parse(root.querySelectorAll(query));
    return {
      drop: drop,
      flush: flush,
      observer: observer,
      parse: parse
    };
  });

  var _self$1 = self,
      document$1 = _self$1.document,
      Map = _self$1.Map,
      MutationObserver$1 = _self$1.MutationObserver,
      Object = _self$1.Object,
      Set$1 = _self$1.Set,
      WeakMap$1 = _self$1.WeakMap,
      Element = _self$1.Element,
      HTMLElement = _self$1.HTMLElement,
      Node = _self$1.Node,
      Error = _self$1.Error,
      TypeError = _self$1.TypeError;
  var Promise$1 = self.Promise || Lie;
  var defineProperty = Object.defineProperty,
      getOwnPropertyNames = Object.getOwnPropertyNames,
      setPrototypeOf = Object.setPrototypeOf;
  var legacy = !self.customElements;

  if (legacy) {
    var HTMLBuiltIn = function HTMLBuiltIn() {
      var constructor = this.constructor;
      if (!classes.has(constructor)) throw new TypeError('Illegal constructor');
      var is = classes.get(constructor);
      if (override) return augment(override, is);
      var element = createElement.call(document$1, is);
      return augment(setPrototypeOf(element, constructor.prototype), is);
    };

    var createElement = document$1.createElement;
    var classes = new Map();
    var defined = new Map();
    var prototypes = new Map();
    var registry = new Map();
    var query = [];

    var handle = function handle(element, connected, selector) {
      var proto = prototypes.get(selector);

      if (connected && !proto.isPrototypeOf(element)) {
        override = setPrototypeOf(element, proto);

        try {
          new proto.constructor();
        } finally {
          override = null;
        }
      }

      var method = "".concat(connected ? '' : 'dis', "connectedCallback");
      if (method in proto) element[method]();
    };

    var _qsaObserver = qsaObserver({
      query: query,
      handle: handle
    }),
        parse = _qsaObserver.parse;

    var override = null;

    var whenDefined = function whenDefined(name) {
      if (!defined.has(name)) {
        var _,
            $ = new Lie(function ($) {
          _ = $;
        });

        defined.set(name, {
          $: $,
          _: _
        });
      }

      return defined.get(name).$;
    };

    var augment = attributesObserver(whenDefined, MutationObserver$1);
    defineProperty(self, 'customElements', {
      configurable: true,
      value: {
        define: function define(is, Class) {
          if (registry.has(is)) throw new Error("the name \"".concat(is, "\" has already been used with this registry"));
          classes.set(Class, is);
          prototypes.set(is, Class.prototype);
          registry.set(is, Class);
          query.push(is);
          whenDefined(is).then(function () {
            parse(document$1.querySelectorAll(is));
          });

          defined.get(is)._(Class);
        },
        get: function get(is) {
          return registry.get(is);
        },
        whenDefined: whenDefined
      }
    });
    (HTMLBuiltIn.prototype = HTMLElement.prototype).constructor = HTMLBuiltIn;
    defineProperty(self, 'HTMLElement', {
      configurable: true,
      value: HTMLBuiltIn
    });
    defineProperty(document$1, 'createElement', {
      configurable: true,
      value: function value(name, options) {
        var is = options && options.is;
        var Class = is ? registry.get(is) : registry.get(name);
        return Class ? new Class() : createElement.call(document$1, name);
      }
    }); // in case ShadowDOM is used through a polyfill, to avoid issues
    // with builtin extends within shadow roots

    if (!('isConnected' in Node.prototype)) defineProperty(Node.prototype, 'isConnected', {
      configurable: true,
      get: function get() {
        return !(this.ownerDocument.compareDocumentPosition(this) & this.DOCUMENT_POSITION_DISCONNECTED);
      }
    });
  } else {
    try {
      var LI = function LI() {
        return self.Reflect.construct(HTMLLIElement, [], LI);
      };

      LI.prototype = HTMLLIElement.prototype;
      var is = 'extends-li';
      self.customElements.define('extends-li', LI, {
        'extends': 'li'
      });
      legacy = document$1.createElement('li', {
        is: is
      }).outerHTML.indexOf(is) < 0;
      var _self$customElements = self.customElements,
          get = _self$customElements.get,
          _whenDefined = _self$customElements.whenDefined;
      defineProperty(self.customElements, 'whenDefined', {
        configurable: true,
        value: function value(is) {
          var _this = this;

          return _whenDefined.call(this, is).then(function (Class) {
            return Class || get.call(_this, is);
          });
        }
      });
    } catch (o_O) {
      legacy = !legacy;
    }
  }

  if (legacy) {
    var parseShadow = function parseShadow(element) {
      var _shadowRoots$get = shadowRoots.get(element),
          parse = _shadowRoots$get.parse,
          root = _shadowRoots$get.root;

      parse(root.querySelectorAll(this), element.isConnected);
    };

    var customElements = self.customElements;
    var attachShadow = Element.prototype.attachShadow;
    var _createElement = document$1.createElement;
    var define = customElements.define,
        _get = customElements.get;
    var shadowRoots = new WeakMap$1();
    var shadows = new Set$1();

    var _classes = new Map();

    var _defined = new Map();

    var _prototypes = new Map();

    var _registry = new Map();

    var shadowed = [];
    var _query = [];

    var getCE = function getCE(is) {
      return _registry.get(is) || _get.call(customElements, is);
    };

    var _handle = function _handle(element, connected, selector) {
      var proto = _prototypes.get(selector);

      if (connected && !proto.isPrototypeOf(element)) {
        _override = setPrototypeOf(element, proto);

        try {
          new proto.constructor();
        } finally {
          _override = null;
        }
      }

      var method = "".concat(connected ? '' : 'dis', "connectedCallback");
      if (method in proto) element[method]();
    };

    var _qsaObserver2 = qsaObserver({
      query: _query,
      handle: _handle
    }),
        _parse = _qsaObserver2.parse;

    var _qsaObserver3 = qsaObserver({
      query: shadowed,
      handle: function handle(element, connected) {
        if (shadowRoots.has(element)) {
          if (connected) shadows.add(element);else shadows["delete"](element);
          parseShadow.call(_query, element);
        }
      }
    }),
        parseShadowed = _qsaObserver3.parse;

    var _whenDefined2 = function _whenDefined2(name) {
      if (!_defined.has(name)) {
        var _,
            $ = new Promise$1(function ($) {
          _ = $;
        });

        _defined.set(name, {
          $: $,
          _: _
        });
      }

      return _defined.get(name).$;
    };

    var _augment = attributesObserver(_whenDefined2, MutationObserver$1);

    var _override = null;
    getOwnPropertyNames(self).filter(function (k) {
      return /^HTML(?!Element)/.test(k);
    }).forEach(function (k) {
      function HTMLBuiltIn() {
        var constructor = this.constructor;
        if (!_classes.has(constructor)) throw new TypeError('Illegal constructor');

        var _classes$get = _classes.get(constructor),
            is = _classes$get.is,
            tag = _classes$get.tag;

        if (_override) return _augment(_override, is);

        var element = _createElement.call(document$1, tag);

        element.setAttribute('is', is);
        return _augment(setPrototypeOf(element, constructor.prototype), is);
      }


      (HTMLBuiltIn.prototype = self[k].prototype).constructor = HTMLBuiltIn;
      defineProperty(self, k, {
        value: HTMLBuiltIn
      });
    });
    defineProperty(document$1, 'createElement', {
      value: function value(name, options) {
        var is = options && options.is;

        if (is) {
          var Class = _registry.get(is);

          if (Class && _classes.get(Class).tag === name) return new Class();
        }

        var element = _createElement.call(document$1, name);

        if (is) element.setAttribute('is', is);
        return element;
      }
    });
    defineProperty(Element.prototype, 'attachShadow', {
      value: function value() {
        var root = attachShadow.apply(this, arguments);

        var _qsaObserver4 = qsaObserver({
          query: _query,
          root: root,
          handle: _handle
        }),
            parse = _qsaObserver4.parse;

        shadowRoots.set(this, {
          root: root,
          parse: parse
        });
        return root;
      }
    });
    defineProperty(customElements, 'get', {
      configurable: true,
      value: getCE
    });
    defineProperty(customElements, 'whenDefined', {
      configurable: true,
      value: _whenDefined2
    });
    defineProperty(customElements, 'define', {
      configurable: true,
      value: function value(is, Class, options) {
        var selector;
        var tag = options && options["extends"];

        if (tag) {
          if (getCE(is)) throw new Error("'".concat(is, "' has already been defined as a custom element"));
          selector = "".concat(tag, "[is=\"").concat(is, "\"]");

          _classes.set(Class, {
            is: is,
            tag: tag
          });

          _prototypes.set(selector, Class.prototype);

          _registry.set(is, Class);

          _query.push(selector);
        } else {
          define.apply(customElements, arguments);
          shadowed.push(selector = is);
        }

        _whenDefined2(is).then(function () {
          if (tag) {
            _parse(document$1.querySelectorAll(selector));

            shadows.forEach(parseShadow, [selector]);
          } else parseShadowed(document$1.querySelectorAll(selector));
        });

        _defined.get(is)._(Class);
      }
    });
  }

}());
