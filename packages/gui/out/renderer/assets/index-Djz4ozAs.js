function getDefaultExportFromCjs(x2) {
  return x2 && x2.__esModule && Object.prototype.hasOwnProperty.call(x2, "default") ? x2["default"] : x2;
}
var jsxRuntime = { exports: {} };
var reactJsxRuntime_production_min = {};
var react = { exports: {} };
var react_production_min = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var l$2 = Symbol.for("react.element"), n$1 = Symbol.for("react.portal"), p$2 = Symbol.for("react.fragment"), q$1 = Symbol.for("react.strict_mode"), r = Symbol.for("react.profiler"), t = Symbol.for("react.provider"), u = Symbol.for("react.context"), v$2 = Symbol.for("react.forward_ref"), w = Symbol.for("react.suspense"), x = Symbol.for("react.memo"), y = Symbol.for("react.lazy"), z$1 = Symbol.iterator;
function A$1(a) {
  if (null === a || "object" !== typeof a) return null;
  a = z$1 && a[z$1] || a["@@iterator"];
  return "function" === typeof a ? a : null;
}
var B$1 = { isMounted: function() {
  return false;
}, enqueueForceUpdate: function() {
}, enqueueReplaceState: function() {
}, enqueueSetState: function() {
} }, C$1 = Object.assign, D$2 = {};
function E$1(a, b, e) {
  this.props = a;
  this.context = b;
  this.refs = D$2;
  this.updater = e || B$1;
}
E$1.prototype.isReactComponent = {};
E$1.prototype.setState = function(a, b) {
  if ("object" !== typeof a && "function" !== typeof a && null != a) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
  this.updater.enqueueSetState(this, a, b, "setState");
};
E$1.prototype.forceUpdate = function(a) {
  this.updater.enqueueForceUpdate(this, a, "forceUpdate");
};
function F() {
}
F.prototype = E$1.prototype;
function G$1(a, b, e) {
  this.props = a;
  this.context = b;
  this.refs = D$2;
  this.updater = e || B$1;
}
var H$2 = G$1.prototype = new F();
H$2.constructor = G$1;
C$1(H$2, E$1.prototype);
H$2.isPureReactComponent = true;
var I$1 = Array.isArray, J = Object.prototype.hasOwnProperty, K$1 = { current: null }, L$1 = { key: true, ref: true, __self: true, __source: true };
function M$1(a, b, e) {
  var d, c = {}, k2 = null, h2 = null;
  if (null != b) for (d in void 0 !== b.ref && (h2 = b.ref), void 0 !== b.key && (k2 = "" + b.key), b) J.call(b, d) && !L$1.hasOwnProperty(d) && (c[d] = b[d]);
  var g = arguments.length - 2;
  if (1 === g) c.children = e;
  else if (1 < g) {
    for (var f2 = Array(g), m2 = 0; m2 < g; m2++) f2[m2] = arguments[m2 + 2];
    c.children = f2;
  }
  if (a && a.defaultProps) for (d in g = a.defaultProps, g) void 0 === c[d] && (c[d] = g[d]);
  return { $$typeof: l$2, type: a, key: k2, ref: h2, props: c, _owner: K$1.current };
}
function N$1(a, b) {
  return { $$typeof: l$2, type: a.type, key: b, ref: a.ref, props: a.props, _owner: a._owner };
}
function O$1(a) {
  return "object" === typeof a && null !== a && a.$$typeof === l$2;
}
function escape(a) {
  var b = { "=": "=0", ":": "=2" };
  return "$" + a.replace(/[=:]/g, function(a2) {
    return b[a2];
  });
}
var P$1 = /\/+/g;
function Q$1(a, b) {
  return "object" === typeof a && null !== a && null != a.key ? escape("" + a.key) : b.toString(36);
}
function R$1(a, b, e, d, c) {
  var k2 = typeof a;
  if ("undefined" === k2 || "boolean" === k2) a = null;
  var h2 = false;
  if (null === a) h2 = true;
  else switch (k2) {
    case "string":
    case "number":
      h2 = true;
      break;
    case "object":
      switch (a.$$typeof) {
        case l$2:
        case n$1:
          h2 = true;
      }
  }
  if (h2) return h2 = a, c = c(h2), a = "" === d ? "." + Q$1(h2, 0) : d, I$1(c) ? (e = "", null != a && (e = a.replace(P$1, "$&/") + "/"), R$1(c, b, e, "", function(a2) {
    return a2;
  })) : null != c && (O$1(c) && (c = N$1(c, e + (!c.key || h2 && h2.key === c.key ? "" : ("" + c.key).replace(P$1, "$&/") + "/") + a)), b.push(c)), 1;
  h2 = 0;
  d = "" === d ? "." : d + ":";
  if (I$1(a)) for (var g = 0; g < a.length; g++) {
    k2 = a[g];
    var f2 = d + Q$1(k2, g);
    h2 += R$1(k2, b, e, f2, c);
  }
  else if (f2 = A$1(a), "function" === typeof f2) for (a = f2.call(a), g = 0; !(k2 = a.next()).done; ) k2 = k2.value, f2 = d + Q$1(k2, g++), h2 += R$1(k2, b, e, f2, c);
  else if ("object" === k2) throw b = String(a), Error("Objects are not valid as a React child (found: " + ("[object Object]" === b ? "object with keys {" + Object.keys(a).join(", ") + "}" : b) + "). If you meant to render a collection of children, use an array instead.");
  return h2;
}
function S$1(a, b, e) {
  if (null == a) return a;
  var d = [], c = 0;
  R$1(a, d, "", "", function(a2) {
    return b.call(e, a2, c++);
  });
  return d;
}
function T$1(a) {
  if (-1 === a._status) {
    var b = a._result;
    b = b();
    b.then(function(b2) {
      if (0 === a._status || -1 === a._status) a._status = 1, a._result = b2;
    }, function(b2) {
      if (0 === a._status || -1 === a._status) a._status = 2, a._result = b2;
    });
    -1 === a._status && (a._status = 0, a._result = b);
  }
  if (1 === a._status) return a._result.default;
  throw a._result;
}
var U$1 = { current: null }, V$1 = { transition: null }, W$1 = { ReactCurrentDispatcher: U$1, ReactCurrentBatchConfig: V$1, ReactCurrentOwner: K$1 };
function X$1() {
  throw Error("act(...) is not supported in production builds of React.");
}
react_production_min.Children = { map: S$1, forEach: function(a, b, e) {
  S$1(a, function() {
    b.apply(this, arguments);
  }, e);
}, count: function(a) {
  var b = 0;
  S$1(a, function() {
    b++;
  });
  return b;
}, toArray: function(a) {
  return S$1(a, function(a2) {
    return a2;
  }) || [];
}, only: function(a) {
  if (!O$1(a)) throw Error("React.Children.only expected to receive a single React element child.");
  return a;
} };
react_production_min.Component = E$1;
react_production_min.Fragment = p$2;
react_production_min.Profiler = r;
react_production_min.PureComponent = G$1;
react_production_min.StrictMode = q$1;
react_production_min.Suspense = w;
react_production_min.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = W$1;
react_production_min.act = X$1;
react_production_min.cloneElement = function(a, b, e) {
  if (null === a || void 0 === a) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + a + ".");
  var d = C$1({}, a.props), c = a.key, k2 = a.ref, h2 = a._owner;
  if (null != b) {
    void 0 !== b.ref && (k2 = b.ref, h2 = K$1.current);
    void 0 !== b.key && (c = "" + b.key);
    if (a.type && a.type.defaultProps) var g = a.type.defaultProps;
    for (f2 in b) J.call(b, f2) && !L$1.hasOwnProperty(f2) && (d[f2] = void 0 === b[f2] && void 0 !== g ? g[f2] : b[f2]);
  }
  var f2 = arguments.length - 2;
  if (1 === f2) d.children = e;
  else if (1 < f2) {
    g = Array(f2);
    for (var m2 = 0; m2 < f2; m2++) g[m2] = arguments[m2 + 2];
    d.children = g;
  }
  return { $$typeof: l$2, type: a.type, key: c, ref: k2, props: d, _owner: h2 };
};
react_production_min.createContext = function(a) {
  a = { $$typeof: u, _currentValue: a, _currentValue2: a, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null };
  a.Provider = { $$typeof: t, _context: a };
  return a.Consumer = a;
};
react_production_min.createElement = M$1;
react_production_min.createFactory = function(a) {
  var b = M$1.bind(null, a);
  b.type = a;
  return b;
};
react_production_min.createRef = function() {
  return { current: null };
};
react_production_min.forwardRef = function(a) {
  return { $$typeof: v$2, render: a };
};
react_production_min.isValidElement = O$1;
react_production_min.lazy = function(a) {
  return { $$typeof: y, _payload: { _status: -1, _result: a }, _init: T$1 };
};
react_production_min.memo = function(a, b) {
  return { $$typeof: x, type: a, compare: void 0 === b ? null : b };
};
react_production_min.startTransition = function(a) {
  var b = V$1.transition;
  V$1.transition = {};
  try {
    a();
  } finally {
    V$1.transition = b;
  }
};
react_production_min.unstable_act = X$1;
react_production_min.useCallback = function(a, b) {
  return U$1.current.useCallback(a, b);
};
react_production_min.useContext = function(a) {
  return U$1.current.useContext(a);
};
react_production_min.useDebugValue = function() {
};
react_production_min.useDeferredValue = function(a) {
  return U$1.current.useDeferredValue(a);
};
react_production_min.useEffect = function(a, b) {
  return U$1.current.useEffect(a, b);
};
react_production_min.useId = function() {
  return U$1.current.useId();
};
react_production_min.useImperativeHandle = function(a, b, e) {
  return U$1.current.useImperativeHandle(a, b, e);
};
react_production_min.useInsertionEffect = function(a, b) {
  return U$1.current.useInsertionEffect(a, b);
};
react_production_min.useLayoutEffect = function(a, b) {
  return U$1.current.useLayoutEffect(a, b);
};
react_production_min.useMemo = function(a, b) {
  return U$1.current.useMemo(a, b);
};
react_production_min.useReducer = function(a, b, e) {
  return U$1.current.useReducer(a, b, e);
};
react_production_min.useRef = function(a) {
  return U$1.current.useRef(a);
};
react_production_min.useState = function(a) {
  return U$1.current.useState(a);
};
react_production_min.useSyncExternalStore = function(a, b, e) {
  return U$1.current.useSyncExternalStore(a, b, e);
};
react_production_min.useTransition = function() {
  return U$1.current.useTransition();
};
react_production_min.version = "18.3.1";
{
  react.exports = react_production_min;
}
var reactExports = react.exports;
const React = /* @__PURE__ */ getDefaultExportFromCjs(reactExports);
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var f = reactExports, k$1 = Symbol.for("react.element"), l$1 = Symbol.for("react.fragment"), m$1 = Object.prototype.hasOwnProperty, n = f.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, p$1 = { key: true, ref: true, __self: true, __source: true };
function q(c, a, g) {
  var b, d = {}, e = null, h2 = null;
  void 0 !== g && (e = "" + g);
  void 0 !== a.key && (e = "" + a.key);
  void 0 !== a.ref && (h2 = a.ref);
  for (b in a) m$1.call(a, b) && !p$1.hasOwnProperty(b) && (d[b] = a[b]);
  if (c && c.defaultProps) for (b in a = c.defaultProps, a) void 0 === d[b] && (d[b] = a[b]);
  return { $$typeof: k$1, type: c, key: e, ref: h2, props: d, _owner: n.current };
}
reactJsxRuntime_production_min.Fragment = l$1;
reactJsxRuntime_production_min.jsx = q;
reactJsxRuntime_production_min.jsxs = q;
{
  jsxRuntime.exports = reactJsxRuntime_production_min;
}
var jsxRuntimeExports = jsxRuntime.exports;
var reactDom = { exports: {} };
var reactDom_production_min = {};
var scheduler = { exports: {} };
var scheduler_production_min = {};
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
(function(exports$1) {
  function f2(a, b) {
    var c = a.length;
    a.push(b);
    a: for (; 0 < c; ) {
      var d = c - 1 >>> 1, e = a[d];
      if (0 < g(e, b)) a[d] = b, a[c] = e, c = d;
      else break a;
    }
  }
  function h2(a) {
    return 0 === a.length ? null : a[0];
  }
  function k2(a) {
    if (0 === a.length) return null;
    var b = a[0], c = a.pop();
    if (c !== b) {
      a[0] = c;
      a: for (var d = 0, e = a.length, w2 = e >>> 1; d < w2; ) {
        var m2 = 2 * (d + 1) - 1, C2 = a[m2], n2 = m2 + 1, x2 = a[n2];
        if (0 > g(C2, c)) n2 < e && 0 > g(x2, C2) ? (a[d] = x2, a[n2] = c, d = n2) : (a[d] = C2, a[m2] = c, d = m2);
        else if (n2 < e && 0 > g(x2, c)) a[d] = x2, a[n2] = c, d = n2;
        else break a;
      }
    }
    return b;
  }
  function g(a, b) {
    var c = a.sortIndex - b.sortIndex;
    return 0 !== c ? c : a.id - b.id;
  }
  if ("object" === typeof performance && "function" === typeof performance.now) {
    var l2 = performance;
    exports$1.unstable_now = function() {
      return l2.now();
    };
  } else {
    var p2 = Date, q2 = p2.now();
    exports$1.unstable_now = function() {
      return p2.now() - q2;
    };
  }
  var r2 = [], t2 = [], u2 = 1, v2 = null, y2 = 3, z2 = false, A2 = false, B2 = false, D2 = "function" === typeof setTimeout ? setTimeout : null, E2 = "function" === typeof clearTimeout ? clearTimeout : null, F2 = "undefined" !== typeof setImmediate ? setImmediate : null;
  "undefined" !== typeof navigator && void 0 !== navigator.scheduling && void 0 !== navigator.scheduling.isInputPending && navigator.scheduling.isInputPending.bind(navigator.scheduling);
  function G2(a) {
    for (var b = h2(t2); null !== b; ) {
      if (null === b.callback) k2(t2);
      else if (b.startTime <= a) k2(t2), b.sortIndex = b.expirationTime, f2(r2, b);
      else break;
      b = h2(t2);
    }
  }
  function H2(a) {
    B2 = false;
    G2(a);
    if (!A2) if (null !== h2(r2)) A2 = true, I2(J2);
    else {
      var b = h2(t2);
      null !== b && K2(H2, b.startTime - a);
    }
  }
  function J2(a, b) {
    A2 = false;
    B2 && (B2 = false, E2(L2), L2 = -1);
    z2 = true;
    var c = y2;
    try {
      G2(b);
      for (v2 = h2(r2); null !== v2 && (!(v2.expirationTime > b) || a && !M2()); ) {
        var d = v2.callback;
        if ("function" === typeof d) {
          v2.callback = null;
          y2 = v2.priorityLevel;
          var e = d(v2.expirationTime <= b);
          b = exports$1.unstable_now();
          "function" === typeof e ? v2.callback = e : v2 === h2(r2) && k2(r2);
          G2(b);
        } else k2(r2);
        v2 = h2(r2);
      }
      if (null !== v2) var w2 = true;
      else {
        var m2 = h2(t2);
        null !== m2 && K2(H2, m2.startTime - b);
        w2 = false;
      }
      return w2;
    } finally {
      v2 = null, y2 = c, z2 = false;
    }
  }
  var N2 = false, O2 = null, L2 = -1, P2 = 5, Q2 = -1;
  function M2() {
    return exports$1.unstable_now() - Q2 < P2 ? false : true;
  }
  function R2() {
    if (null !== O2) {
      var a = exports$1.unstable_now();
      Q2 = a;
      var b = true;
      try {
        b = O2(true, a);
      } finally {
        b ? S2() : (N2 = false, O2 = null);
      }
    } else N2 = false;
  }
  var S2;
  if ("function" === typeof F2) S2 = function() {
    F2(R2);
  };
  else if ("undefined" !== typeof MessageChannel) {
    var T2 = new MessageChannel(), U2 = T2.port2;
    T2.port1.onmessage = R2;
    S2 = function() {
      U2.postMessage(null);
    };
  } else S2 = function() {
    D2(R2, 0);
  };
  function I2(a) {
    O2 = a;
    N2 || (N2 = true, S2());
  }
  function K2(a, b) {
    L2 = D2(function() {
      a(exports$1.unstable_now());
    }, b);
  }
  exports$1.unstable_IdlePriority = 5;
  exports$1.unstable_ImmediatePriority = 1;
  exports$1.unstable_LowPriority = 4;
  exports$1.unstable_NormalPriority = 3;
  exports$1.unstable_Profiling = null;
  exports$1.unstable_UserBlockingPriority = 2;
  exports$1.unstable_cancelCallback = function(a) {
    a.callback = null;
  };
  exports$1.unstable_continueExecution = function() {
    A2 || z2 || (A2 = true, I2(J2));
  };
  exports$1.unstable_forceFrameRate = function(a) {
    0 > a || 125 < a ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : P2 = 0 < a ? Math.floor(1e3 / a) : 5;
  };
  exports$1.unstable_getCurrentPriorityLevel = function() {
    return y2;
  };
  exports$1.unstable_getFirstCallbackNode = function() {
    return h2(r2);
  };
  exports$1.unstable_next = function(a) {
    switch (y2) {
      case 1:
      case 2:
      case 3:
        var b = 3;
        break;
      default:
        b = y2;
    }
    var c = y2;
    y2 = b;
    try {
      return a();
    } finally {
      y2 = c;
    }
  };
  exports$1.unstable_pauseExecution = function() {
  };
  exports$1.unstable_requestPaint = function() {
  };
  exports$1.unstable_runWithPriority = function(a, b) {
    switch (a) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        break;
      default:
        a = 3;
    }
    var c = y2;
    y2 = a;
    try {
      return b();
    } finally {
      y2 = c;
    }
  };
  exports$1.unstable_scheduleCallback = function(a, b, c) {
    var d = exports$1.unstable_now();
    "object" === typeof c && null !== c ? (c = c.delay, c = "number" === typeof c && 0 < c ? d + c : d) : c = d;
    switch (a) {
      case 1:
        var e = -1;
        break;
      case 2:
        e = 250;
        break;
      case 5:
        e = 1073741823;
        break;
      case 4:
        e = 1e4;
        break;
      default:
        e = 5e3;
    }
    e = c + e;
    a = { id: u2++, callback: b, priorityLevel: a, startTime: c, expirationTime: e, sortIndex: -1 };
    c > d ? (a.sortIndex = c, f2(t2, a), null === h2(r2) && a === h2(t2) && (B2 ? (E2(L2), L2 = -1) : B2 = true, K2(H2, c - d))) : (a.sortIndex = e, f2(r2, a), A2 || z2 || (A2 = true, I2(J2)));
    return a;
  };
  exports$1.unstable_shouldYield = M2;
  exports$1.unstable_wrapCallback = function(a) {
    var b = y2;
    return function() {
      var c = y2;
      y2 = b;
      try {
        return a.apply(this, arguments);
      } finally {
        y2 = c;
      }
    };
  };
})(scheduler_production_min);
{
  scheduler.exports = scheduler_production_min;
}
var schedulerExports = scheduler.exports;
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var aa = reactExports, ca = schedulerExports;
function p(a) {
  for (var b = "https://reactjs.org/docs/error-decoder.html?invariant=" + a, c = 1; c < arguments.length; c++) b += "&args[]=" + encodeURIComponent(arguments[c]);
  return "Minified React error #" + a + "; visit " + b + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
}
var da = /* @__PURE__ */ new Set(), ea = {};
function fa(a, b) {
  ha(a, b);
  ha(a + "Capture", b);
}
function ha(a, b) {
  ea[a] = b;
  for (a = 0; a < b.length; a++) da.add(b[a]);
}
var ia = !("undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement), ja = Object.prototype.hasOwnProperty, ka = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, la = {}, ma = {};
function oa(a) {
  if (ja.call(ma, a)) return true;
  if (ja.call(la, a)) return false;
  if (ka.test(a)) return ma[a] = true;
  la[a] = true;
  return false;
}
function pa(a, b, c, d) {
  if (null !== c && 0 === c.type) return false;
  switch (typeof b) {
    case "function":
    case "symbol":
      return true;
    case "boolean":
      if (d) return false;
      if (null !== c) return !c.acceptsBooleans;
      a = a.toLowerCase().slice(0, 5);
      return "data-" !== a && "aria-" !== a;
    default:
      return false;
  }
}
function qa(a, b, c, d) {
  if (null === b || "undefined" === typeof b || pa(a, b, c, d)) return true;
  if (d) return false;
  if (null !== c) switch (c.type) {
    case 3:
      return !b;
    case 4:
      return false === b;
    case 5:
      return isNaN(b);
    case 6:
      return isNaN(b) || 1 > b;
  }
  return false;
}
function v$1(a, b, c, d, e, f2, g) {
  this.acceptsBooleans = 2 === b || 3 === b || 4 === b;
  this.attributeName = d;
  this.attributeNamespace = e;
  this.mustUseProperty = c;
  this.propertyName = a;
  this.type = b;
  this.sanitizeURL = f2;
  this.removeEmptyString = g;
}
var z = {};
"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(a) {
  z[a] = new v$1(a, 0, false, a, null, false, false);
});
[["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(a) {
  var b = a[0];
  z[b] = new v$1(b, 1, false, a[1], null, false, false);
});
["contentEditable", "draggable", "spellCheck", "value"].forEach(function(a) {
  z[a] = new v$1(a, 2, false, a.toLowerCase(), null, false, false);
});
["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(a) {
  z[a] = new v$1(a, 2, false, a, null, false, false);
});
"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(a) {
  z[a] = new v$1(a, 3, false, a.toLowerCase(), null, false, false);
});
["checked", "multiple", "muted", "selected"].forEach(function(a) {
  z[a] = new v$1(a, 3, true, a, null, false, false);
});
["capture", "download"].forEach(function(a) {
  z[a] = new v$1(a, 4, false, a, null, false, false);
});
["cols", "rows", "size", "span"].forEach(function(a) {
  z[a] = new v$1(a, 6, false, a, null, false, false);
});
["rowSpan", "start"].forEach(function(a) {
  z[a] = new v$1(a, 5, false, a.toLowerCase(), null, false, false);
});
var ra = /[\-:]([a-z])/g;
function sa(a) {
  return a[1].toUpperCase();
}
"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(a) {
  var b = a.replace(
    ra,
    sa
  );
  z[b] = new v$1(b, 1, false, a, null, false, false);
});
"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(a) {
  var b = a.replace(ra, sa);
  z[b] = new v$1(b, 1, false, a, "http://www.w3.org/1999/xlink", false, false);
});
["xml:base", "xml:lang", "xml:space"].forEach(function(a) {
  var b = a.replace(ra, sa);
  z[b] = new v$1(b, 1, false, a, "http://www.w3.org/XML/1998/namespace", false, false);
});
["tabIndex", "crossOrigin"].forEach(function(a) {
  z[a] = new v$1(a, 1, false, a.toLowerCase(), null, false, false);
});
z.xlinkHref = new v$1("xlinkHref", 1, false, "xlink:href", "http://www.w3.org/1999/xlink", true, false);
["src", "href", "action", "formAction"].forEach(function(a) {
  z[a] = new v$1(a, 1, false, a.toLowerCase(), null, true, true);
});
function ta(a, b, c, d) {
  var e = z.hasOwnProperty(b) ? z[b] : null;
  if (null !== e ? 0 !== e.type : d || !(2 < b.length) || "o" !== b[0] && "O" !== b[0] || "n" !== b[1] && "N" !== b[1]) qa(b, c, e, d) && (c = null), d || null === e ? oa(b) && (null === c ? a.removeAttribute(b) : a.setAttribute(b, "" + c)) : e.mustUseProperty ? a[e.propertyName] = null === c ? 3 === e.type ? false : "" : c : (b = e.attributeName, d = e.attributeNamespace, null === c ? a.removeAttribute(b) : (e = e.type, c = 3 === e || 4 === e && true === c ? "" : "" + c, d ? a.setAttributeNS(d, b, c) : a.setAttribute(b, c)));
}
var ua = aa.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, va = Symbol.for("react.element"), wa = Symbol.for("react.portal"), ya = Symbol.for("react.fragment"), za = Symbol.for("react.strict_mode"), Aa = Symbol.for("react.profiler"), Ba = Symbol.for("react.provider"), Ca = Symbol.for("react.context"), Da = Symbol.for("react.forward_ref"), Ea = Symbol.for("react.suspense"), Fa = Symbol.for("react.suspense_list"), Ga = Symbol.for("react.memo"), Ha = Symbol.for("react.lazy");
var Ia = Symbol.for("react.offscreen");
var Ja = Symbol.iterator;
function Ka(a) {
  if (null === a || "object" !== typeof a) return null;
  a = Ja && a[Ja] || a["@@iterator"];
  return "function" === typeof a ? a : null;
}
var A = Object.assign, La;
function Ma(a) {
  if (void 0 === La) try {
    throw Error();
  } catch (c) {
    var b = c.stack.trim().match(/\n( *(at )?)/);
    La = b && b[1] || "";
  }
  return "\n" + La + a;
}
var Na = false;
function Oa(a, b) {
  if (!a || Na) return "";
  Na = true;
  var c = Error.prepareStackTrace;
  Error.prepareStackTrace = void 0;
  try {
    if (b) if (b = function() {
      throw Error();
    }, Object.defineProperty(b.prototype, "props", { set: function() {
      throw Error();
    } }), "object" === typeof Reflect && Reflect.construct) {
      try {
        Reflect.construct(b, []);
      } catch (l2) {
        var d = l2;
      }
      Reflect.construct(a, [], b);
    } else {
      try {
        b.call();
      } catch (l2) {
        d = l2;
      }
      a.call(b.prototype);
    }
    else {
      try {
        throw Error();
      } catch (l2) {
        d = l2;
      }
      a();
    }
  } catch (l2) {
    if (l2 && d && "string" === typeof l2.stack) {
      for (var e = l2.stack.split("\n"), f2 = d.stack.split("\n"), g = e.length - 1, h2 = f2.length - 1; 1 <= g && 0 <= h2 && e[g] !== f2[h2]; ) h2--;
      for (; 1 <= g && 0 <= h2; g--, h2--) if (e[g] !== f2[h2]) {
        if (1 !== g || 1 !== h2) {
          do
            if (g--, h2--, 0 > h2 || e[g] !== f2[h2]) {
              var k2 = "\n" + e[g].replace(" at new ", " at ");
              a.displayName && k2.includes("<anonymous>") && (k2 = k2.replace("<anonymous>", a.displayName));
              return k2;
            }
          while (1 <= g && 0 <= h2);
        }
        break;
      }
    }
  } finally {
    Na = false, Error.prepareStackTrace = c;
  }
  return (a = a ? a.displayName || a.name : "") ? Ma(a) : "";
}
function Pa(a) {
  switch (a.tag) {
    case 5:
      return Ma(a.type);
    case 16:
      return Ma("Lazy");
    case 13:
      return Ma("Suspense");
    case 19:
      return Ma("SuspenseList");
    case 0:
    case 2:
    case 15:
      return a = Oa(a.type, false), a;
    case 11:
      return a = Oa(a.type.render, false), a;
    case 1:
      return a = Oa(a.type, true), a;
    default:
      return "";
  }
}
function Qa(a) {
  if (null == a) return null;
  if ("function" === typeof a) return a.displayName || a.name || null;
  if ("string" === typeof a) return a;
  switch (a) {
    case ya:
      return "Fragment";
    case wa:
      return "Portal";
    case Aa:
      return "Profiler";
    case za:
      return "StrictMode";
    case Ea:
      return "Suspense";
    case Fa:
      return "SuspenseList";
  }
  if ("object" === typeof a) switch (a.$$typeof) {
    case Ca:
      return (a.displayName || "Context") + ".Consumer";
    case Ba:
      return (a._context.displayName || "Context") + ".Provider";
    case Da:
      var b = a.render;
      a = a.displayName;
      a || (a = b.displayName || b.name || "", a = "" !== a ? "ForwardRef(" + a + ")" : "ForwardRef");
      return a;
    case Ga:
      return b = a.displayName || null, null !== b ? b : Qa(a.type) || "Memo";
    case Ha:
      b = a._payload;
      a = a._init;
      try {
        return Qa(a(b));
      } catch (c) {
      }
  }
  return null;
}
function Ra(a) {
  var b = a.type;
  switch (a.tag) {
    case 24:
      return "Cache";
    case 9:
      return (b.displayName || "Context") + ".Consumer";
    case 10:
      return (b._context.displayName || "Context") + ".Provider";
    case 18:
      return "DehydratedFragment";
    case 11:
      return a = b.render, a = a.displayName || a.name || "", b.displayName || ("" !== a ? "ForwardRef(" + a + ")" : "ForwardRef");
    case 7:
      return "Fragment";
    case 5:
      return b;
    case 4:
      return "Portal";
    case 3:
      return "Root";
    case 6:
      return "Text";
    case 16:
      return Qa(b);
    case 8:
      return b === za ? "StrictMode" : "Mode";
    case 22:
      return "Offscreen";
    case 12:
      return "Profiler";
    case 21:
      return "Scope";
    case 13:
      return "Suspense";
    case 19:
      return "SuspenseList";
    case 25:
      return "TracingMarker";
    case 1:
    case 0:
    case 17:
    case 2:
    case 14:
    case 15:
      if ("function" === typeof b) return b.displayName || b.name || null;
      if ("string" === typeof b) return b;
  }
  return null;
}
function Sa(a) {
  switch (typeof a) {
    case "boolean":
    case "number":
    case "string":
    case "undefined":
      return a;
    case "object":
      return a;
    default:
      return "";
  }
}
function Ta(a) {
  var b = a.type;
  return (a = a.nodeName) && "input" === a.toLowerCase() && ("checkbox" === b || "radio" === b);
}
function Ua(a) {
  var b = Ta(a) ? "checked" : "value", c = Object.getOwnPropertyDescriptor(a.constructor.prototype, b), d = "" + a[b];
  if (!a.hasOwnProperty(b) && "undefined" !== typeof c && "function" === typeof c.get && "function" === typeof c.set) {
    var e = c.get, f2 = c.set;
    Object.defineProperty(a, b, { configurable: true, get: function() {
      return e.call(this);
    }, set: function(a2) {
      d = "" + a2;
      f2.call(this, a2);
    } });
    Object.defineProperty(a, b, { enumerable: c.enumerable });
    return { getValue: function() {
      return d;
    }, setValue: function(a2) {
      d = "" + a2;
    }, stopTracking: function() {
      a._valueTracker = null;
      delete a[b];
    } };
  }
}
function Va(a) {
  a._valueTracker || (a._valueTracker = Ua(a));
}
function Wa(a) {
  if (!a) return false;
  var b = a._valueTracker;
  if (!b) return true;
  var c = b.getValue();
  var d = "";
  a && (d = Ta(a) ? a.checked ? "true" : "false" : a.value);
  a = d;
  return a !== c ? (b.setValue(a), true) : false;
}
function Xa(a) {
  a = a || ("undefined" !== typeof document ? document : void 0);
  if ("undefined" === typeof a) return null;
  try {
    return a.activeElement || a.body;
  } catch (b) {
    return a.body;
  }
}
function Ya(a, b) {
  var c = b.checked;
  return A({}, b, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: null != c ? c : a._wrapperState.initialChecked });
}
function Za(a, b) {
  var c = null == b.defaultValue ? "" : b.defaultValue, d = null != b.checked ? b.checked : b.defaultChecked;
  c = Sa(null != b.value ? b.value : c);
  a._wrapperState = { initialChecked: d, initialValue: c, controlled: "checkbox" === b.type || "radio" === b.type ? null != b.checked : null != b.value };
}
function ab(a, b) {
  b = b.checked;
  null != b && ta(a, "checked", b, false);
}
function bb(a, b) {
  ab(a, b);
  var c = Sa(b.value), d = b.type;
  if (null != c) if ("number" === d) {
    if (0 === c && "" === a.value || a.value != c) a.value = "" + c;
  } else a.value !== "" + c && (a.value = "" + c);
  else if ("submit" === d || "reset" === d) {
    a.removeAttribute("value");
    return;
  }
  b.hasOwnProperty("value") ? cb(a, b.type, c) : b.hasOwnProperty("defaultValue") && cb(a, b.type, Sa(b.defaultValue));
  null == b.checked && null != b.defaultChecked && (a.defaultChecked = !!b.defaultChecked);
}
function db(a, b, c) {
  if (b.hasOwnProperty("value") || b.hasOwnProperty("defaultValue")) {
    var d = b.type;
    if (!("submit" !== d && "reset" !== d || void 0 !== b.value && null !== b.value)) return;
    b = "" + a._wrapperState.initialValue;
    c || b === a.value || (a.value = b);
    a.defaultValue = b;
  }
  c = a.name;
  "" !== c && (a.name = "");
  a.defaultChecked = !!a._wrapperState.initialChecked;
  "" !== c && (a.name = c);
}
function cb(a, b, c) {
  if ("number" !== b || Xa(a.ownerDocument) !== a) null == c ? a.defaultValue = "" + a._wrapperState.initialValue : a.defaultValue !== "" + c && (a.defaultValue = "" + c);
}
var eb = Array.isArray;
function fb(a, b, c, d) {
  a = a.options;
  if (b) {
    b = {};
    for (var e = 0; e < c.length; e++) b["$" + c[e]] = true;
    for (c = 0; c < a.length; c++) e = b.hasOwnProperty("$" + a[c].value), a[c].selected !== e && (a[c].selected = e), e && d && (a[c].defaultSelected = true);
  } else {
    c = "" + Sa(c);
    b = null;
    for (e = 0; e < a.length; e++) {
      if (a[e].value === c) {
        a[e].selected = true;
        d && (a[e].defaultSelected = true);
        return;
      }
      null !== b || a[e].disabled || (b = a[e]);
    }
    null !== b && (b.selected = true);
  }
}
function gb(a, b) {
  if (null != b.dangerouslySetInnerHTML) throw Error(p(91));
  return A({}, b, { value: void 0, defaultValue: void 0, children: "" + a._wrapperState.initialValue });
}
function hb(a, b) {
  var c = b.value;
  if (null == c) {
    c = b.children;
    b = b.defaultValue;
    if (null != c) {
      if (null != b) throw Error(p(92));
      if (eb(c)) {
        if (1 < c.length) throw Error(p(93));
        c = c[0];
      }
      b = c;
    }
    null == b && (b = "");
    c = b;
  }
  a._wrapperState = { initialValue: Sa(c) };
}
function ib(a, b) {
  var c = Sa(b.value), d = Sa(b.defaultValue);
  null != c && (c = "" + c, c !== a.value && (a.value = c), null == b.defaultValue && a.defaultValue !== c && (a.defaultValue = c));
  null != d && (a.defaultValue = "" + d);
}
function jb(a) {
  var b = a.textContent;
  b === a._wrapperState.initialValue && "" !== b && null !== b && (a.value = b);
}
function kb(a) {
  switch (a) {
    case "svg":
      return "http://www.w3.org/2000/svg";
    case "math":
      return "http://www.w3.org/1998/Math/MathML";
    default:
      return "http://www.w3.org/1999/xhtml";
  }
}
function lb(a, b) {
  return null == a || "http://www.w3.org/1999/xhtml" === a ? kb(b) : "http://www.w3.org/2000/svg" === a && "foreignObject" === b ? "http://www.w3.org/1999/xhtml" : a;
}
var mb, nb = function(a) {
  return "undefined" !== typeof MSApp && MSApp.execUnsafeLocalFunction ? function(b, c, d, e) {
    MSApp.execUnsafeLocalFunction(function() {
      return a(b, c, d, e);
    });
  } : a;
}(function(a, b) {
  if ("http://www.w3.org/2000/svg" !== a.namespaceURI || "innerHTML" in a) a.innerHTML = b;
  else {
    mb = mb || document.createElement("div");
    mb.innerHTML = "<svg>" + b.valueOf().toString() + "</svg>";
    for (b = mb.firstChild; a.firstChild; ) a.removeChild(a.firstChild);
    for (; b.firstChild; ) a.appendChild(b.firstChild);
  }
});
function ob(a, b) {
  if (b) {
    var c = a.firstChild;
    if (c && c === a.lastChild && 3 === c.nodeType) {
      c.nodeValue = b;
      return;
    }
  }
  a.textContent = b;
}
var pb = {
  animationIterationCount: true,
  aspectRatio: true,
  borderImageOutset: true,
  borderImageSlice: true,
  borderImageWidth: true,
  boxFlex: true,
  boxFlexGroup: true,
  boxOrdinalGroup: true,
  columnCount: true,
  columns: true,
  flex: true,
  flexGrow: true,
  flexPositive: true,
  flexShrink: true,
  flexNegative: true,
  flexOrder: true,
  gridArea: true,
  gridRow: true,
  gridRowEnd: true,
  gridRowSpan: true,
  gridRowStart: true,
  gridColumn: true,
  gridColumnEnd: true,
  gridColumnSpan: true,
  gridColumnStart: true,
  fontWeight: true,
  lineClamp: true,
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  tabSize: true,
  widows: true,
  zIndex: true,
  zoom: true,
  fillOpacity: true,
  floodOpacity: true,
  stopOpacity: true,
  strokeDasharray: true,
  strokeDashoffset: true,
  strokeMiterlimit: true,
  strokeOpacity: true,
  strokeWidth: true
}, qb = ["Webkit", "ms", "Moz", "O"];
Object.keys(pb).forEach(function(a) {
  qb.forEach(function(b) {
    b = b + a.charAt(0).toUpperCase() + a.substring(1);
    pb[b] = pb[a];
  });
});
function rb(a, b, c) {
  return null == b || "boolean" === typeof b || "" === b ? "" : c || "number" !== typeof b || 0 === b || pb.hasOwnProperty(a) && pb[a] ? ("" + b).trim() : b + "px";
}
function sb(a, b) {
  a = a.style;
  for (var c in b) if (b.hasOwnProperty(c)) {
    var d = 0 === c.indexOf("--"), e = rb(c, b[c], d);
    "float" === c && (c = "cssFloat");
    d ? a.setProperty(c, e) : a[c] = e;
  }
}
var tb = A({ menuitem: true }, { area: true, base: true, br: true, col: true, embed: true, hr: true, img: true, input: true, keygen: true, link: true, meta: true, param: true, source: true, track: true, wbr: true });
function ub(a, b) {
  if (b) {
    if (tb[a] && (null != b.children || null != b.dangerouslySetInnerHTML)) throw Error(p(137, a));
    if (null != b.dangerouslySetInnerHTML) {
      if (null != b.children) throw Error(p(60));
      if ("object" !== typeof b.dangerouslySetInnerHTML || !("__html" in b.dangerouslySetInnerHTML)) throw Error(p(61));
    }
    if (null != b.style && "object" !== typeof b.style) throw Error(p(62));
  }
}
function vb(a, b) {
  if (-1 === a.indexOf("-")) return "string" === typeof b.is;
  switch (a) {
    case "annotation-xml":
    case "color-profile":
    case "font-face":
    case "font-face-src":
    case "font-face-uri":
    case "font-face-format":
    case "font-face-name":
    case "missing-glyph":
      return false;
    default:
      return true;
  }
}
var wb = null;
function xb(a) {
  a = a.target || a.srcElement || window;
  a.correspondingUseElement && (a = a.correspondingUseElement);
  return 3 === a.nodeType ? a.parentNode : a;
}
var yb = null, zb = null, Ab = null;
function Bb(a) {
  if (a = Cb(a)) {
    if ("function" !== typeof yb) throw Error(p(280));
    var b = a.stateNode;
    b && (b = Db(b), yb(a.stateNode, a.type, b));
  }
}
function Eb(a) {
  zb ? Ab ? Ab.push(a) : Ab = [a] : zb = a;
}
function Fb() {
  if (zb) {
    var a = zb, b = Ab;
    Ab = zb = null;
    Bb(a);
    if (b) for (a = 0; a < b.length; a++) Bb(b[a]);
  }
}
function Gb(a, b) {
  return a(b);
}
function Hb() {
}
var Ib = false;
function Jb(a, b, c) {
  if (Ib) return a(b, c);
  Ib = true;
  try {
    return Gb(a, b, c);
  } finally {
    if (Ib = false, null !== zb || null !== Ab) Hb(), Fb();
  }
}
function Kb(a, b) {
  var c = a.stateNode;
  if (null === c) return null;
  var d = Db(c);
  if (null === d) return null;
  c = d[b];
  a: switch (b) {
    case "onClick":
    case "onClickCapture":
    case "onDoubleClick":
    case "onDoubleClickCapture":
    case "onMouseDown":
    case "onMouseDownCapture":
    case "onMouseMove":
    case "onMouseMoveCapture":
    case "onMouseUp":
    case "onMouseUpCapture":
    case "onMouseEnter":
      (d = !d.disabled) || (a = a.type, d = !("button" === a || "input" === a || "select" === a || "textarea" === a));
      a = !d;
      break a;
    default:
      a = false;
  }
  if (a) return null;
  if (c && "function" !== typeof c) throw Error(p(231, b, typeof c));
  return c;
}
var Lb = false;
if (ia) try {
  var Mb = {};
  Object.defineProperty(Mb, "passive", { get: function() {
    Lb = true;
  } });
  window.addEventListener("test", Mb, Mb);
  window.removeEventListener("test", Mb, Mb);
} catch (a) {
  Lb = false;
}
function Nb(a, b, c, d, e, f2, g, h2, k2) {
  var l2 = Array.prototype.slice.call(arguments, 3);
  try {
    b.apply(c, l2);
  } catch (m2) {
    this.onError(m2);
  }
}
var Ob = false, Pb = null, Qb = false, Rb = null, Sb = { onError: function(a) {
  Ob = true;
  Pb = a;
} };
function Tb(a, b, c, d, e, f2, g, h2, k2) {
  Ob = false;
  Pb = null;
  Nb.apply(Sb, arguments);
}
function Ub(a, b, c, d, e, f2, g, h2, k2) {
  Tb.apply(this, arguments);
  if (Ob) {
    if (Ob) {
      var l2 = Pb;
      Ob = false;
      Pb = null;
    } else throw Error(p(198));
    Qb || (Qb = true, Rb = l2);
  }
}
function Vb(a) {
  var b = a, c = a;
  if (a.alternate) for (; b.return; ) b = b.return;
  else {
    a = b;
    do
      b = a, 0 !== (b.flags & 4098) && (c = b.return), a = b.return;
    while (a);
  }
  return 3 === b.tag ? c : null;
}
function Wb(a) {
  if (13 === a.tag) {
    var b = a.memoizedState;
    null === b && (a = a.alternate, null !== a && (b = a.memoizedState));
    if (null !== b) return b.dehydrated;
  }
  return null;
}
function Xb(a) {
  if (Vb(a) !== a) throw Error(p(188));
}
function Yb(a) {
  var b = a.alternate;
  if (!b) {
    b = Vb(a);
    if (null === b) throw Error(p(188));
    return b !== a ? null : a;
  }
  for (var c = a, d = b; ; ) {
    var e = c.return;
    if (null === e) break;
    var f2 = e.alternate;
    if (null === f2) {
      d = e.return;
      if (null !== d) {
        c = d;
        continue;
      }
      break;
    }
    if (e.child === f2.child) {
      for (f2 = e.child; f2; ) {
        if (f2 === c) return Xb(e), a;
        if (f2 === d) return Xb(e), b;
        f2 = f2.sibling;
      }
      throw Error(p(188));
    }
    if (c.return !== d.return) c = e, d = f2;
    else {
      for (var g = false, h2 = e.child; h2; ) {
        if (h2 === c) {
          g = true;
          c = e;
          d = f2;
          break;
        }
        if (h2 === d) {
          g = true;
          d = e;
          c = f2;
          break;
        }
        h2 = h2.sibling;
      }
      if (!g) {
        for (h2 = f2.child; h2; ) {
          if (h2 === c) {
            g = true;
            c = f2;
            d = e;
            break;
          }
          if (h2 === d) {
            g = true;
            d = f2;
            c = e;
            break;
          }
          h2 = h2.sibling;
        }
        if (!g) throw Error(p(189));
      }
    }
    if (c.alternate !== d) throw Error(p(190));
  }
  if (3 !== c.tag) throw Error(p(188));
  return c.stateNode.current === c ? a : b;
}
function Zb(a) {
  a = Yb(a);
  return null !== a ? $b(a) : null;
}
function $b(a) {
  if (5 === a.tag || 6 === a.tag) return a;
  for (a = a.child; null !== a; ) {
    var b = $b(a);
    if (null !== b) return b;
    a = a.sibling;
  }
  return null;
}
var ac = ca.unstable_scheduleCallback, bc = ca.unstable_cancelCallback, cc = ca.unstable_shouldYield, dc = ca.unstable_requestPaint, B = ca.unstable_now, ec = ca.unstable_getCurrentPriorityLevel, fc = ca.unstable_ImmediatePriority, gc = ca.unstable_UserBlockingPriority, hc = ca.unstable_NormalPriority, ic = ca.unstable_LowPriority, jc = ca.unstable_IdlePriority, kc = null, lc = null;
function mc(a) {
  if (lc && "function" === typeof lc.onCommitFiberRoot) try {
    lc.onCommitFiberRoot(kc, a, void 0, 128 === (a.current.flags & 128));
  } catch (b) {
  }
}
var oc = Math.clz32 ? Math.clz32 : nc, pc = Math.log, qc = Math.LN2;
function nc(a) {
  a >>>= 0;
  return 0 === a ? 32 : 31 - (pc(a) / qc | 0) | 0;
}
var rc = 64, sc = 4194304;
function tc(a) {
  switch (a & -a) {
    case 1:
      return 1;
    case 2:
      return 2;
    case 4:
      return 4;
    case 8:
      return 8;
    case 16:
      return 16;
    case 32:
      return 32;
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return a & 4194240;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return a & 130023424;
    case 134217728:
      return 134217728;
    case 268435456:
      return 268435456;
    case 536870912:
      return 536870912;
    case 1073741824:
      return 1073741824;
    default:
      return a;
  }
}
function uc(a, b) {
  var c = a.pendingLanes;
  if (0 === c) return 0;
  var d = 0, e = a.suspendedLanes, f2 = a.pingedLanes, g = c & 268435455;
  if (0 !== g) {
    var h2 = g & ~e;
    0 !== h2 ? d = tc(h2) : (f2 &= g, 0 !== f2 && (d = tc(f2)));
  } else g = c & ~e, 0 !== g ? d = tc(g) : 0 !== f2 && (d = tc(f2));
  if (0 === d) return 0;
  if (0 !== b && b !== d && 0 === (b & e) && (e = d & -d, f2 = b & -b, e >= f2 || 16 === e && 0 !== (f2 & 4194240))) return b;
  0 !== (d & 4) && (d |= c & 16);
  b = a.entangledLanes;
  if (0 !== b) for (a = a.entanglements, b &= d; 0 < b; ) c = 31 - oc(b), e = 1 << c, d |= a[c], b &= ~e;
  return d;
}
function vc(a, b) {
  switch (a) {
    case 1:
    case 2:
    case 4:
      return b + 250;
    case 8:
    case 16:
    case 32:
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return b + 5e3;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return -1;
    case 134217728:
    case 268435456:
    case 536870912:
    case 1073741824:
      return -1;
    default:
      return -1;
  }
}
function wc(a, b) {
  for (var c = a.suspendedLanes, d = a.pingedLanes, e = a.expirationTimes, f2 = a.pendingLanes; 0 < f2; ) {
    var g = 31 - oc(f2), h2 = 1 << g, k2 = e[g];
    if (-1 === k2) {
      if (0 === (h2 & c) || 0 !== (h2 & d)) e[g] = vc(h2, b);
    } else k2 <= b && (a.expiredLanes |= h2);
    f2 &= ~h2;
  }
}
function xc(a) {
  a = a.pendingLanes & -1073741825;
  return 0 !== a ? a : a & 1073741824 ? 1073741824 : 0;
}
function yc() {
  var a = rc;
  rc <<= 1;
  0 === (rc & 4194240) && (rc = 64);
  return a;
}
function zc(a) {
  for (var b = [], c = 0; 31 > c; c++) b.push(a);
  return b;
}
function Ac(a, b, c) {
  a.pendingLanes |= b;
  536870912 !== b && (a.suspendedLanes = 0, a.pingedLanes = 0);
  a = a.eventTimes;
  b = 31 - oc(b);
  a[b] = c;
}
function Bc(a, b) {
  var c = a.pendingLanes & ~b;
  a.pendingLanes = b;
  a.suspendedLanes = 0;
  a.pingedLanes = 0;
  a.expiredLanes &= b;
  a.mutableReadLanes &= b;
  a.entangledLanes &= b;
  b = a.entanglements;
  var d = a.eventTimes;
  for (a = a.expirationTimes; 0 < c; ) {
    var e = 31 - oc(c), f2 = 1 << e;
    b[e] = 0;
    d[e] = -1;
    a[e] = -1;
    c &= ~f2;
  }
}
function Cc(a, b) {
  var c = a.entangledLanes |= b;
  for (a = a.entanglements; c; ) {
    var d = 31 - oc(c), e = 1 << d;
    e & b | a[d] & b && (a[d] |= b);
    c &= ~e;
  }
}
var C = 0;
function Dc(a) {
  a &= -a;
  return 1 < a ? 4 < a ? 0 !== (a & 268435455) ? 16 : 536870912 : 4 : 1;
}
var Ec, Fc, Gc, Hc, Ic, Jc = false, Kc = [], Lc = null, Mc = null, Nc = null, Oc = /* @__PURE__ */ new Map(), Pc = /* @__PURE__ */ new Map(), Qc = [], Rc = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
function Sc(a, b) {
  switch (a) {
    case "focusin":
    case "focusout":
      Lc = null;
      break;
    case "dragenter":
    case "dragleave":
      Mc = null;
      break;
    case "mouseover":
    case "mouseout":
      Nc = null;
      break;
    case "pointerover":
    case "pointerout":
      Oc.delete(b.pointerId);
      break;
    case "gotpointercapture":
    case "lostpointercapture":
      Pc.delete(b.pointerId);
  }
}
function Tc(a, b, c, d, e, f2) {
  if (null === a || a.nativeEvent !== f2) return a = { blockedOn: b, domEventName: c, eventSystemFlags: d, nativeEvent: f2, targetContainers: [e] }, null !== b && (b = Cb(b), null !== b && Fc(b)), a;
  a.eventSystemFlags |= d;
  b = a.targetContainers;
  null !== e && -1 === b.indexOf(e) && b.push(e);
  return a;
}
function Uc(a, b, c, d, e) {
  switch (b) {
    case "focusin":
      return Lc = Tc(Lc, a, b, c, d, e), true;
    case "dragenter":
      return Mc = Tc(Mc, a, b, c, d, e), true;
    case "mouseover":
      return Nc = Tc(Nc, a, b, c, d, e), true;
    case "pointerover":
      var f2 = e.pointerId;
      Oc.set(f2, Tc(Oc.get(f2) || null, a, b, c, d, e));
      return true;
    case "gotpointercapture":
      return f2 = e.pointerId, Pc.set(f2, Tc(Pc.get(f2) || null, a, b, c, d, e)), true;
  }
  return false;
}
function Vc(a) {
  var b = Wc(a.target);
  if (null !== b) {
    var c = Vb(b);
    if (null !== c) {
      if (b = c.tag, 13 === b) {
        if (b = Wb(c), null !== b) {
          a.blockedOn = b;
          Ic(a.priority, function() {
            Gc(c);
          });
          return;
        }
      } else if (3 === b && c.stateNode.current.memoizedState.isDehydrated) {
        a.blockedOn = 3 === c.tag ? c.stateNode.containerInfo : null;
        return;
      }
    }
  }
  a.blockedOn = null;
}
function Xc(a) {
  if (null !== a.blockedOn) return false;
  for (var b = a.targetContainers; 0 < b.length; ) {
    var c = Yc(a.domEventName, a.eventSystemFlags, b[0], a.nativeEvent);
    if (null === c) {
      c = a.nativeEvent;
      var d = new c.constructor(c.type, c);
      wb = d;
      c.target.dispatchEvent(d);
      wb = null;
    } else return b = Cb(c), null !== b && Fc(b), a.blockedOn = c, false;
    b.shift();
  }
  return true;
}
function Zc(a, b, c) {
  Xc(a) && c.delete(b);
}
function $c() {
  Jc = false;
  null !== Lc && Xc(Lc) && (Lc = null);
  null !== Mc && Xc(Mc) && (Mc = null);
  null !== Nc && Xc(Nc) && (Nc = null);
  Oc.forEach(Zc);
  Pc.forEach(Zc);
}
function ad(a, b) {
  a.blockedOn === b && (a.blockedOn = null, Jc || (Jc = true, ca.unstable_scheduleCallback(ca.unstable_NormalPriority, $c)));
}
function bd(a) {
  function b(b2) {
    return ad(b2, a);
  }
  if (0 < Kc.length) {
    ad(Kc[0], a);
    for (var c = 1; c < Kc.length; c++) {
      var d = Kc[c];
      d.blockedOn === a && (d.blockedOn = null);
    }
  }
  null !== Lc && ad(Lc, a);
  null !== Mc && ad(Mc, a);
  null !== Nc && ad(Nc, a);
  Oc.forEach(b);
  Pc.forEach(b);
  for (c = 0; c < Qc.length; c++) d = Qc[c], d.blockedOn === a && (d.blockedOn = null);
  for (; 0 < Qc.length && (c = Qc[0], null === c.blockedOn); ) Vc(c), null === c.blockedOn && Qc.shift();
}
var cd = ua.ReactCurrentBatchConfig, dd = true;
function ed(a, b, c, d) {
  var e = C, f2 = cd.transition;
  cd.transition = null;
  try {
    C = 1, fd(a, b, c, d);
  } finally {
    C = e, cd.transition = f2;
  }
}
function gd(a, b, c, d) {
  var e = C, f2 = cd.transition;
  cd.transition = null;
  try {
    C = 4, fd(a, b, c, d);
  } finally {
    C = e, cd.transition = f2;
  }
}
function fd(a, b, c, d) {
  if (dd) {
    var e = Yc(a, b, c, d);
    if (null === e) hd(a, b, d, id, c), Sc(a, d);
    else if (Uc(e, a, b, c, d)) d.stopPropagation();
    else if (Sc(a, d), b & 4 && -1 < Rc.indexOf(a)) {
      for (; null !== e; ) {
        var f2 = Cb(e);
        null !== f2 && Ec(f2);
        f2 = Yc(a, b, c, d);
        null === f2 && hd(a, b, d, id, c);
        if (f2 === e) break;
        e = f2;
      }
      null !== e && d.stopPropagation();
    } else hd(a, b, d, null, c);
  }
}
var id = null;
function Yc(a, b, c, d) {
  id = null;
  a = xb(d);
  a = Wc(a);
  if (null !== a) if (b = Vb(a), null === b) a = null;
  else if (c = b.tag, 13 === c) {
    a = Wb(b);
    if (null !== a) return a;
    a = null;
  } else if (3 === c) {
    if (b.stateNode.current.memoizedState.isDehydrated) return 3 === b.tag ? b.stateNode.containerInfo : null;
    a = null;
  } else b !== a && (a = null);
  id = a;
  return null;
}
function jd(a) {
  switch (a) {
    case "cancel":
    case "click":
    case "close":
    case "contextmenu":
    case "copy":
    case "cut":
    case "auxclick":
    case "dblclick":
    case "dragend":
    case "dragstart":
    case "drop":
    case "focusin":
    case "focusout":
    case "input":
    case "invalid":
    case "keydown":
    case "keypress":
    case "keyup":
    case "mousedown":
    case "mouseup":
    case "paste":
    case "pause":
    case "play":
    case "pointercancel":
    case "pointerdown":
    case "pointerup":
    case "ratechange":
    case "reset":
    case "resize":
    case "seeked":
    case "submit":
    case "touchcancel":
    case "touchend":
    case "touchstart":
    case "volumechange":
    case "change":
    case "selectionchange":
    case "textInput":
    case "compositionstart":
    case "compositionend":
    case "compositionupdate":
    case "beforeblur":
    case "afterblur":
    case "beforeinput":
    case "blur":
    case "fullscreenchange":
    case "focus":
    case "hashchange":
    case "popstate":
    case "select":
    case "selectstart":
      return 1;
    case "drag":
    case "dragenter":
    case "dragexit":
    case "dragleave":
    case "dragover":
    case "mousemove":
    case "mouseout":
    case "mouseover":
    case "pointermove":
    case "pointerout":
    case "pointerover":
    case "scroll":
    case "toggle":
    case "touchmove":
    case "wheel":
    case "mouseenter":
    case "mouseleave":
    case "pointerenter":
    case "pointerleave":
      return 4;
    case "message":
      switch (ec()) {
        case fc:
          return 1;
        case gc:
          return 4;
        case hc:
        case ic:
          return 16;
        case jc:
          return 536870912;
        default:
          return 16;
      }
    default:
      return 16;
  }
}
var kd = null, ld = null, md = null;
function nd() {
  if (md) return md;
  var a, b = ld, c = b.length, d, e = "value" in kd ? kd.value : kd.textContent, f2 = e.length;
  for (a = 0; a < c && b[a] === e[a]; a++) ;
  var g = c - a;
  for (d = 1; d <= g && b[c - d] === e[f2 - d]; d++) ;
  return md = e.slice(a, 1 < d ? 1 - d : void 0);
}
function od(a) {
  var b = a.keyCode;
  "charCode" in a ? (a = a.charCode, 0 === a && 13 === b && (a = 13)) : a = b;
  10 === a && (a = 13);
  return 32 <= a || 13 === a ? a : 0;
}
function pd() {
  return true;
}
function qd() {
  return false;
}
function rd(a) {
  function b(b2, d, e, f2, g) {
    this._reactName = b2;
    this._targetInst = e;
    this.type = d;
    this.nativeEvent = f2;
    this.target = g;
    this.currentTarget = null;
    for (var c in a) a.hasOwnProperty(c) && (b2 = a[c], this[c] = b2 ? b2(f2) : f2[c]);
    this.isDefaultPrevented = (null != f2.defaultPrevented ? f2.defaultPrevented : false === f2.returnValue) ? pd : qd;
    this.isPropagationStopped = qd;
    return this;
  }
  A(b.prototype, { preventDefault: function() {
    this.defaultPrevented = true;
    var a2 = this.nativeEvent;
    a2 && (a2.preventDefault ? a2.preventDefault() : "unknown" !== typeof a2.returnValue && (a2.returnValue = false), this.isDefaultPrevented = pd);
  }, stopPropagation: function() {
    var a2 = this.nativeEvent;
    a2 && (a2.stopPropagation ? a2.stopPropagation() : "unknown" !== typeof a2.cancelBubble && (a2.cancelBubble = true), this.isPropagationStopped = pd);
  }, persist: function() {
  }, isPersistent: pd });
  return b;
}
var sd = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(a) {
  return a.timeStamp || Date.now();
}, defaultPrevented: 0, isTrusted: 0 }, td = rd(sd), ud = A({}, sd, { view: 0, detail: 0 }), vd = rd(ud), wd, xd, yd, Ad = A({}, ud, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: zd, button: 0, buttons: 0, relatedTarget: function(a) {
  return void 0 === a.relatedTarget ? a.fromElement === a.srcElement ? a.toElement : a.fromElement : a.relatedTarget;
}, movementX: function(a) {
  if ("movementX" in a) return a.movementX;
  a !== yd && (yd && "mousemove" === a.type ? (wd = a.screenX - yd.screenX, xd = a.screenY - yd.screenY) : xd = wd = 0, yd = a);
  return wd;
}, movementY: function(a) {
  return "movementY" in a ? a.movementY : xd;
} }), Bd = rd(Ad), Cd = A({}, Ad, { dataTransfer: 0 }), Dd = rd(Cd), Ed = A({}, ud, { relatedTarget: 0 }), Fd = rd(Ed), Gd = A({}, sd, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }), Hd = rd(Gd), Id = A({}, sd, { clipboardData: function(a) {
  return "clipboardData" in a ? a.clipboardData : window.clipboardData;
} }), Jd = rd(Id), Kd = A({}, sd, { data: 0 }), Ld = rd(Kd), Md = {
  Esc: "Escape",
  Spacebar: " ",
  Left: "ArrowLeft",
  Up: "ArrowUp",
  Right: "ArrowRight",
  Down: "ArrowDown",
  Del: "Delete",
  Win: "OS",
  Menu: "ContextMenu",
  Apps: "ContextMenu",
  Scroll: "ScrollLock",
  MozPrintableKey: "Unidentified"
}, Nd = {
  8: "Backspace",
  9: "Tab",
  12: "Clear",
  13: "Enter",
  16: "Shift",
  17: "Control",
  18: "Alt",
  19: "Pause",
  20: "CapsLock",
  27: "Escape",
  32: " ",
  33: "PageUp",
  34: "PageDown",
  35: "End",
  36: "Home",
  37: "ArrowLeft",
  38: "ArrowUp",
  39: "ArrowRight",
  40: "ArrowDown",
  45: "Insert",
  46: "Delete",
  112: "F1",
  113: "F2",
  114: "F3",
  115: "F4",
  116: "F5",
  117: "F6",
  118: "F7",
  119: "F8",
  120: "F9",
  121: "F10",
  122: "F11",
  123: "F12",
  144: "NumLock",
  145: "ScrollLock",
  224: "Meta"
}, Od = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
function Pd(a) {
  var b = this.nativeEvent;
  return b.getModifierState ? b.getModifierState(a) : (a = Od[a]) ? !!b[a] : false;
}
function zd() {
  return Pd;
}
var Qd = A({}, ud, { key: function(a) {
  if (a.key) {
    var b = Md[a.key] || a.key;
    if ("Unidentified" !== b) return b;
  }
  return "keypress" === a.type ? (a = od(a), 13 === a ? "Enter" : String.fromCharCode(a)) : "keydown" === a.type || "keyup" === a.type ? Nd[a.keyCode] || "Unidentified" : "";
}, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: zd, charCode: function(a) {
  return "keypress" === a.type ? od(a) : 0;
}, keyCode: function(a) {
  return "keydown" === a.type || "keyup" === a.type ? a.keyCode : 0;
}, which: function(a) {
  return "keypress" === a.type ? od(a) : "keydown" === a.type || "keyup" === a.type ? a.keyCode : 0;
} }), Rd = rd(Qd), Sd = A({}, Ad, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 }), Td = rd(Sd), Ud = A({}, ud, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: zd }), Vd = rd(Ud), Wd = A({}, sd, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }), Xd = rd(Wd), Yd = A({}, Ad, {
  deltaX: function(a) {
    return "deltaX" in a ? a.deltaX : "wheelDeltaX" in a ? -a.wheelDeltaX : 0;
  },
  deltaY: function(a) {
    return "deltaY" in a ? a.deltaY : "wheelDeltaY" in a ? -a.wheelDeltaY : "wheelDelta" in a ? -a.wheelDelta : 0;
  },
  deltaZ: 0,
  deltaMode: 0
}), Zd = rd(Yd), $d = [9, 13, 27, 32], ae$1 = ia && "CompositionEvent" in window, be$1 = null;
ia && "documentMode" in document && (be$1 = document.documentMode);
var ce = ia && "TextEvent" in window && !be$1, de$1 = ia && (!ae$1 || be$1 && 8 < be$1 && 11 >= be$1), ee$1 = String.fromCharCode(32), fe$1 = false;
function ge(a, b) {
  switch (a) {
    case "keyup":
      return -1 !== $d.indexOf(b.keyCode);
    case "keydown":
      return 229 !== b.keyCode;
    case "keypress":
    case "mousedown":
    case "focusout":
      return true;
    default:
      return false;
  }
}
function he$1(a) {
  a = a.detail;
  return "object" === typeof a && "data" in a ? a.data : null;
}
var ie$1 = false;
function je(a, b) {
  switch (a) {
    case "compositionend":
      return he$1(b);
    case "keypress":
      if (32 !== b.which) return null;
      fe$1 = true;
      return ee$1;
    case "textInput":
      return a = b.data, a === ee$1 && fe$1 ? null : a;
    default:
      return null;
  }
}
function ke(a, b) {
  if (ie$1) return "compositionend" === a || !ae$1 && ge(a, b) ? (a = nd(), md = ld = kd = null, ie$1 = false, a) : null;
  switch (a) {
    case "paste":
      return null;
    case "keypress":
      if (!(b.ctrlKey || b.altKey || b.metaKey) || b.ctrlKey && b.altKey) {
        if (b.char && 1 < b.char.length) return b.char;
        if (b.which) return String.fromCharCode(b.which);
      }
      return null;
    case "compositionend":
      return de$1 && "ko" !== b.locale ? null : b.data;
    default:
      return null;
  }
}
var le$1 = { color: true, date: true, datetime: true, "datetime-local": true, email: true, month: true, number: true, password: true, range: true, search: true, tel: true, text: true, time: true, url: true, week: true };
function me(a) {
  var b = a && a.nodeName && a.nodeName.toLowerCase();
  return "input" === b ? !!le$1[a.type] : "textarea" === b ? true : false;
}
function ne(a, b, c, d) {
  Eb(d);
  b = oe(b, "onChange");
  0 < b.length && (c = new td("onChange", "change", null, c, d), a.push({ event: c, listeners: b }));
}
var pe = null, qe = null;
function re(a) {
  se$1(a, 0);
}
function te$1(a) {
  var b = ue(a);
  if (Wa(b)) return a;
}
function ve(a, b) {
  if ("change" === a) return b;
}
var we = false;
if (ia) {
  var xe;
  if (ia) {
    var ye = "oninput" in document;
    if (!ye) {
      var ze = document.createElement("div");
      ze.setAttribute("oninput", "return;");
      ye = "function" === typeof ze.oninput;
    }
    xe = ye;
  } else xe = false;
  we = xe && (!document.documentMode || 9 < document.documentMode);
}
function Ae() {
  pe && (pe.detachEvent("onpropertychange", Be), qe = pe = null);
}
function Be(a) {
  if ("value" === a.propertyName && te$1(qe)) {
    var b = [];
    ne(b, qe, a, xb(a));
    Jb(re, b);
  }
}
function Ce$1(a, b, c) {
  "focusin" === a ? (Ae(), pe = b, qe = c, pe.attachEvent("onpropertychange", Be)) : "focusout" === a && Ae();
}
function De$1(a) {
  if ("selectionchange" === a || "keyup" === a || "keydown" === a) return te$1(qe);
}
function Ee$1(a, b) {
  if ("click" === a) return te$1(b);
}
function Fe(a, b) {
  if ("input" === a || "change" === a) return te$1(b);
}
function Ge(a, b) {
  return a === b && (0 !== a || 1 / a === 1 / b) || a !== a && b !== b;
}
var He$1 = "function" === typeof Object.is ? Object.is : Ge;
function Ie(a, b) {
  if (He$1(a, b)) return true;
  if ("object" !== typeof a || null === a || "object" !== typeof b || null === b) return false;
  var c = Object.keys(a), d = Object.keys(b);
  if (c.length !== d.length) return false;
  for (d = 0; d < c.length; d++) {
    var e = c[d];
    if (!ja.call(b, e) || !He$1(a[e], b[e])) return false;
  }
  return true;
}
function Je(a) {
  for (; a && a.firstChild; ) a = a.firstChild;
  return a;
}
function Ke(a, b) {
  var c = Je(a);
  a = 0;
  for (var d; c; ) {
    if (3 === c.nodeType) {
      d = a + c.textContent.length;
      if (a <= b && d >= b) return { node: c, offset: b - a };
      a = d;
    }
    a: {
      for (; c; ) {
        if (c.nextSibling) {
          c = c.nextSibling;
          break a;
        }
        c = c.parentNode;
      }
      c = void 0;
    }
    c = Je(c);
  }
}
function Le(a, b) {
  return a && b ? a === b ? true : a && 3 === a.nodeType ? false : b && 3 === b.nodeType ? Le(a, b.parentNode) : "contains" in a ? a.contains(b) : a.compareDocumentPosition ? !!(a.compareDocumentPosition(b) & 16) : false : false;
}
function Me$1() {
  for (var a = window, b = Xa(); b instanceof a.HTMLIFrameElement; ) {
    try {
      var c = "string" === typeof b.contentWindow.location.href;
    } catch (d) {
      c = false;
    }
    if (c) a = b.contentWindow;
    else break;
    b = Xa(a.document);
  }
  return b;
}
function Ne(a) {
  var b = a && a.nodeName && a.nodeName.toLowerCase();
  return b && ("input" === b && ("text" === a.type || "search" === a.type || "tel" === a.type || "url" === a.type || "password" === a.type) || "textarea" === b || "true" === a.contentEditable);
}
function Oe$1(a) {
  var b = Me$1(), c = a.focusedElem, d = a.selectionRange;
  if (b !== c && c && c.ownerDocument && Le(c.ownerDocument.documentElement, c)) {
    if (null !== d && Ne(c)) {
      if (b = d.start, a = d.end, void 0 === a && (a = b), "selectionStart" in c) c.selectionStart = b, c.selectionEnd = Math.min(a, c.value.length);
      else if (a = (b = c.ownerDocument || document) && b.defaultView || window, a.getSelection) {
        a = a.getSelection();
        var e = c.textContent.length, f2 = Math.min(d.start, e);
        d = void 0 === d.end ? f2 : Math.min(d.end, e);
        !a.extend && f2 > d && (e = d, d = f2, f2 = e);
        e = Ke(c, f2);
        var g = Ke(
          c,
          d
        );
        e && g && (1 !== a.rangeCount || a.anchorNode !== e.node || a.anchorOffset !== e.offset || a.focusNode !== g.node || a.focusOffset !== g.offset) && (b = b.createRange(), b.setStart(e.node, e.offset), a.removeAllRanges(), f2 > d ? (a.addRange(b), a.extend(g.node, g.offset)) : (b.setEnd(g.node, g.offset), a.addRange(b)));
      }
    }
    b = [];
    for (a = c; a = a.parentNode; ) 1 === a.nodeType && b.push({ element: a, left: a.scrollLeft, top: a.scrollTop });
    "function" === typeof c.focus && c.focus();
    for (c = 0; c < b.length; c++) a = b[c], a.element.scrollLeft = a.left, a.element.scrollTop = a.top;
  }
}
var Pe = ia && "documentMode" in document && 11 >= document.documentMode, Qe = null, Re = null, Se = null, Te = false;
function Ue(a, b, c) {
  var d = c.window === c ? c.document : 9 === c.nodeType ? c : c.ownerDocument;
  Te || null == Qe || Qe !== Xa(d) || (d = Qe, "selectionStart" in d && Ne(d) ? d = { start: d.selectionStart, end: d.selectionEnd } : (d = (d.ownerDocument && d.ownerDocument.defaultView || window).getSelection(), d = { anchorNode: d.anchorNode, anchorOffset: d.anchorOffset, focusNode: d.focusNode, focusOffset: d.focusOffset }), Se && Ie(Se, d) || (Se = d, d = oe(Re, "onSelect"), 0 < d.length && (b = new td("onSelect", "select", null, b, c), a.push({ event: b, listeners: d }), b.target = Qe)));
}
function Ve$1(a, b) {
  var c = {};
  c[a.toLowerCase()] = b.toLowerCase();
  c["Webkit" + a] = "webkit" + b;
  c["Moz" + a] = "moz" + b;
  return c;
}
var We = { animationend: Ve$1("Animation", "AnimationEnd"), animationiteration: Ve$1("Animation", "AnimationIteration"), animationstart: Ve$1("Animation", "AnimationStart"), transitionend: Ve$1("Transition", "TransitionEnd") }, Xe = {}, Ye = {};
ia && (Ye = document.createElement("div").style, "AnimationEvent" in window || (delete We.animationend.animation, delete We.animationiteration.animation, delete We.animationstart.animation), "TransitionEvent" in window || delete We.transitionend.transition);
function Ze(a) {
  if (Xe[a]) return Xe[a];
  if (!We[a]) return a;
  var b = We[a], c;
  for (c in b) if (b.hasOwnProperty(c) && c in Ye) return Xe[a] = b[c];
  return a;
}
var $e = Ze("animationend"), af = Ze("animationiteration"), bf = Ze("animationstart"), cf = Ze("transitionend"), df = /* @__PURE__ */ new Map(), ef = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
function ff(a, b) {
  df.set(a, b);
  fa(b, [a]);
}
for (var gf = 0; gf < ef.length; gf++) {
  var hf = ef[gf], jf = hf.toLowerCase(), kf = hf[0].toUpperCase() + hf.slice(1);
  ff(jf, "on" + kf);
}
ff($e, "onAnimationEnd");
ff(af, "onAnimationIteration");
ff(bf, "onAnimationStart");
ff("dblclick", "onDoubleClick");
ff("focusin", "onFocus");
ff("focusout", "onBlur");
ff(cf, "onTransitionEnd");
ha("onMouseEnter", ["mouseout", "mouseover"]);
ha("onMouseLeave", ["mouseout", "mouseover"]);
ha("onPointerEnter", ["pointerout", "pointerover"]);
ha("onPointerLeave", ["pointerout", "pointerover"]);
fa("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
fa("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
fa("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
fa("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
fa("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
fa("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
var lf = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), mf = new Set("cancel close invalid load scroll toggle".split(" ").concat(lf));
function nf(a, b, c) {
  var d = a.type || "unknown-event";
  a.currentTarget = c;
  Ub(d, b, void 0, a);
  a.currentTarget = null;
}
function se$1(a, b) {
  b = 0 !== (b & 4);
  for (var c = 0; c < a.length; c++) {
    var d = a[c], e = d.event;
    d = d.listeners;
    a: {
      var f2 = void 0;
      if (b) for (var g = d.length - 1; 0 <= g; g--) {
        var h2 = d[g], k2 = h2.instance, l2 = h2.currentTarget;
        h2 = h2.listener;
        if (k2 !== f2 && e.isPropagationStopped()) break a;
        nf(e, h2, l2);
        f2 = k2;
      }
      else for (g = 0; g < d.length; g++) {
        h2 = d[g];
        k2 = h2.instance;
        l2 = h2.currentTarget;
        h2 = h2.listener;
        if (k2 !== f2 && e.isPropagationStopped()) break a;
        nf(e, h2, l2);
        f2 = k2;
      }
    }
  }
  if (Qb) throw a = Rb, Qb = false, Rb = null, a;
}
function D$1(a, b) {
  var c = b[of];
  void 0 === c && (c = b[of] = /* @__PURE__ */ new Set());
  var d = a + "__bubble";
  c.has(d) || (pf(b, a, 2, false), c.add(d));
}
function qf(a, b, c) {
  var d = 0;
  b && (d |= 4);
  pf(c, a, d, b);
}
var rf = "_reactListening" + Math.random().toString(36).slice(2);
function sf(a) {
  if (!a[rf]) {
    a[rf] = true;
    da.forEach(function(b2) {
      "selectionchange" !== b2 && (mf.has(b2) || qf(b2, false, a), qf(b2, true, a));
    });
    var b = 9 === a.nodeType ? a : a.ownerDocument;
    null === b || b[rf] || (b[rf] = true, qf("selectionchange", false, b));
  }
}
function pf(a, b, c, d) {
  switch (jd(b)) {
    case 1:
      var e = ed;
      break;
    case 4:
      e = gd;
      break;
    default:
      e = fd;
  }
  c = e.bind(null, b, c, a);
  e = void 0;
  !Lb || "touchstart" !== b && "touchmove" !== b && "wheel" !== b || (e = true);
  d ? void 0 !== e ? a.addEventListener(b, c, { capture: true, passive: e }) : a.addEventListener(b, c, true) : void 0 !== e ? a.addEventListener(b, c, { passive: e }) : a.addEventListener(b, c, false);
}
function hd(a, b, c, d, e) {
  var f2 = d;
  if (0 === (b & 1) && 0 === (b & 2) && null !== d) a: for (; ; ) {
    if (null === d) return;
    var g = d.tag;
    if (3 === g || 4 === g) {
      var h2 = d.stateNode.containerInfo;
      if (h2 === e || 8 === h2.nodeType && h2.parentNode === e) break;
      if (4 === g) for (g = d.return; null !== g; ) {
        var k2 = g.tag;
        if (3 === k2 || 4 === k2) {
          if (k2 = g.stateNode.containerInfo, k2 === e || 8 === k2.nodeType && k2.parentNode === e) return;
        }
        g = g.return;
      }
      for (; null !== h2; ) {
        g = Wc(h2);
        if (null === g) return;
        k2 = g.tag;
        if (5 === k2 || 6 === k2) {
          d = f2 = g;
          continue a;
        }
        h2 = h2.parentNode;
      }
    }
    d = d.return;
  }
  Jb(function() {
    var d2 = f2, e2 = xb(c), g2 = [];
    a: {
      var h3 = df.get(a);
      if (void 0 !== h3) {
        var k3 = td, n2 = a;
        switch (a) {
          case "keypress":
            if (0 === od(c)) break a;
          case "keydown":
          case "keyup":
            k3 = Rd;
            break;
          case "focusin":
            n2 = "focus";
            k3 = Fd;
            break;
          case "focusout":
            n2 = "blur";
            k3 = Fd;
            break;
          case "beforeblur":
          case "afterblur":
            k3 = Fd;
            break;
          case "click":
            if (2 === c.button) break a;
          case "auxclick":
          case "dblclick":
          case "mousedown":
          case "mousemove":
          case "mouseup":
          case "mouseout":
          case "mouseover":
          case "contextmenu":
            k3 = Bd;
            break;
          case "drag":
          case "dragend":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "dragstart":
          case "drop":
            k3 = Dd;
            break;
          case "touchcancel":
          case "touchend":
          case "touchmove":
          case "touchstart":
            k3 = Vd;
            break;
          case $e:
          case af:
          case bf:
            k3 = Hd;
            break;
          case cf:
            k3 = Xd;
            break;
          case "scroll":
            k3 = vd;
            break;
          case "wheel":
            k3 = Zd;
            break;
          case "copy":
          case "cut":
          case "paste":
            k3 = Jd;
            break;
          case "gotpointercapture":
          case "lostpointercapture":
          case "pointercancel":
          case "pointerdown":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "pointerup":
            k3 = Td;
        }
        var t2 = 0 !== (b & 4), J2 = !t2 && "scroll" === a, x2 = t2 ? null !== h3 ? h3 + "Capture" : null : h3;
        t2 = [];
        for (var w2 = d2, u2; null !== w2; ) {
          u2 = w2;
          var F2 = u2.stateNode;
          5 === u2.tag && null !== F2 && (u2 = F2, null !== x2 && (F2 = Kb(w2, x2), null != F2 && t2.push(tf(w2, F2, u2))));
          if (J2) break;
          w2 = w2.return;
        }
        0 < t2.length && (h3 = new k3(h3, n2, null, c, e2), g2.push({ event: h3, listeners: t2 }));
      }
    }
    if (0 === (b & 7)) {
      a: {
        h3 = "mouseover" === a || "pointerover" === a;
        k3 = "mouseout" === a || "pointerout" === a;
        if (h3 && c !== wb && (n2 = c.relatedTarget || c.fromElement) && (Wc(n2) || n2[uf])) break a;
        if (k3 || h3) {
          h3 = e2.window === e2 ? e2 : (h3 = e2.ownerDocument) ? h3.defaultView || h3.parentWindow : window;
          if (k3) {
            if (n2 = c.relatedTarget || c.toElement, k3 = d2, n2 = n2 ? Wc(n2) : null, null !== n2 && (J2 = Vb(n2), n2 !== J2 || 5 !== n2.tag && 6 !== n2.tag)) n2 = null;
          } else k3 = null, n2 = d2;
          if (k3 !== n2) {
            t2 = Bd;
            F2 = "onMouseLeave";
            x2 = "onMouseEnter";
            w2 = "mouse";
            if ("pointerout" === a || "pointerover" === a) t2 = Td, F2 = "onPointerLeave", x2 = "onPointerEnter", w2 = "pointer";
            J2 = null == k3 ? h3 : ue(k3);
            u2 = null == n2 ? h3 : ue(n2);
            h3 = new t2(F2, w2 + "leave", k3, c, e2);
            h3.target = J2;
            h3.relatedTarget = u2;
            F2 = null;
            Wc(e2) === d2 && (t2 = new t2(x2, w2 + "enter", n2, c, e2), t2.target = u2, t2.relatedTarget = J2, F2 = t2);
            J2 = F2;
            if (k3 && n2) b: {
              t2 = k3;
              x2 = n2;
              w2 = 0;
              for (u2 = t2; u2; u2 = vf(u2)) w2++;
              u2 = 0;
              for (F2 = x2; F2; F2 = vf(F2)) u2++;
              for (; 0 < w2 - u2; ) t2 = vf(t2), w2--;
              for (; 0 < u2 - w2; ) x2 = vf(x2), u2--;
              for (; w2--; ) {
                if (t2 === x2 || null !== x2 && t2 === x2.alternate) break b;
                t2 = vf(t2);
                x2 = vf(x2);
              }
              t2 = null;
            }
            else t2 = null;
            null !== k3 && wf(g2, h3, k3, t2, false);
            null !== n2 && null !== J2 && wf(g2, J2, n2, t2, true);
          }
        }
      }
      a: {
        h3 = d2 ? ue(d2) : window;
        k3 = h3.nodeName && h3.nodeName.toLowerCase();
        if ("select" === k3 || "input" === k3 && "file" === h3.type) var na = ve;
        else if (me(h3)) if (we) na = Fe;
        else {
          na = De$1;
          var xa = Ce$1;
        }
        else (k3 = h3.nodeName) && "input" === k3.toLowerCase() && ("checkbox" === h3.type || "radio" === h3.type) && (na = Ee$1);
        if (na && (na = na(a, d2))) {
          ne(g2, na, c, e2);
          break a;
        }
        xa && xa(a, h3, d2);
        "focusout" === a && (xa = h3._wrapperState) && xa.controlled && "number" === h3.type && cb(h3, "number", h3.value);
      }
      xa = d2 ? ue(d2) : window;
      switch (a) {
        case "focusin":
          if (me(xa) || "true" === xa.contentEditable) Qe = xa, Re = d2, Se = null;
          break;
        case "focusout":
          Se = Re = Qe = null;
          break;
        case "mousedown":
          Te = true;
          break;
        case "contextmenu":
        case "mouseup":
        case "dragend":
          Te = false;
          Ue(g2, c, e2);
          break;
        case "selectionchange":
          if (Pe) break;
        case "keydown":
        case "keyup":
          Ue(g2, c, e2);
      }
      var $a;
      if (ae$1) b: {
        switch (a) {
          case "compositionstart":
            var ba = "onCompositionStart";
            break b;
          case "compositionend":
            ba = "onCompositionEnd";
            break b;
          case "compositionupdate":
            ba = "onCompositionUpdate";
            break b;
        }
        ba = void 0;
      }
      else ie$1 ? ge(a, c) && (ba = "onCompositionEnd") : "keydown" === a && 229 === c.keyCode && (ba = "onCompositionStart");
      ba && (de$1 && "ko" !== c.locale && (ie$1 || "onCompositionStart" !== ba ? "onCompositionEnd" === ba && ie$1 && ($a = nd()) : (kd = e2, ld = "value" in kd ? kd.value : kd.textContent, ie$1 = true)), xa = oe(d2, ba), 0 < xa.length && (ba = new Ld(ba, a, null, c, e2), g2.push({ event: ba, listeners: xa }), $a ? ba.data = $a : ($a = he$1(c), null !== $a && (ba.data = $a))));
      if ($a = ce ? je(a, c) : ke(a, c)) d2 = oe(d2, "onBeforeInput"), 0 < d2.length && (e2 = new Ld("onBeforeInput", "beforeinput", null, c, e2), g2.push({ event: e2, listeners: d2 }), e2.data = $a);
    }
    se$1(g2, b);
  });
}
function tf(a, b, c) {
  return { instance: a, listener: b, currentTarget: c };
}
function oe(a, b) {
  for (var c = b + "Capture", d = []; null !== a; ) {
    var e = a, f2 = e.stateNode;
    5 === e.tag && null !== f2 && (e = f2, f2 = Kb(a, c), null != f2 && d.unshift(tf(a, f2, e)), f2 = Kb(a, b), null != f2 && d.push(tf(a, f2, e)));
    a = a.return;
  }
  return d;
}
function vf(a) {
  if (null === a) return null;
  do
    a = a.return;
  while (a && 5 !== a.tag);
  return a ? a : null;
}
function wf(a, b, c, d, e) {
  for (var f2 = b._reactName, g = []; null !== c && c !== d; ) {
    var h2 = c, k2 = h2.alternate, l2 = h2.stateNode;
    if (null !== k2 && k2 === d) break;
    5 === h2.tag && null !== l2 && (h2 = l2, e ? (k2 = Kb(c, f2), null != k2 && g.unshift(tf(c, k2, h2))) : e || (k2 = Kb(c, f2), null != k2 && g.push(tf(c, k2, h2))));
    c = c.return;
  }
  0 !== g.length && a.push({ event: b, listeners: g });
}
var xf = /\r\n?/g, yf = /\u0000|\uFFFD/g;
function zf(a) {
  return ("string" === typeof a ? a : "" + a).replace(xf, "\n").replace(yf, "");
}
function Af(a, b, c) {
  b = zf(b);
  if (zf(a) !== b && c) throw Error(p(425));
}
function Bf() {
}
var Cf = null, Df = null;
function Ef(a, b) {
  return "textarea" === a || "noscript" === a || "string" === typeof b.children || "number" === typeof b.children || "object" === typeof b.dangerouslySetInnerHTML && null !== b.dangerouslySetInnerHTML && null != b.dangerouslySetInnerHTML.__html;
}
var Ff = "function" === typeof setTimeout ? setTimeout : void 0, Gf = "function" === typeof clearTimeout ? clearTimeout : void 0, Hf = "function" === typeof Promise ? Promise : void 0, Jf = "function" === typeof queueMicrotask ? queueMicrotask : "undefined" !== typeof Hf ? function(a) {
  return Hf.resolve(null).then(a).catch(If);
} : Ff;
function If(a) {
  setTimeout(function() {
    throw a;
  });
}
function Kf(a, b) {
  var c = b, d = 0;
  do {
    var e = c.nextSibling;
    a.removeChild(c);
    if (e && 8 === e.nodeType) if (c = e.data, "/$" === c) {
      if (0 === d) {
        a.removeChild(e);
        bd(b);
        return;
      }
      d--;
    } else "$" !== c && "$?" !== c && "$!" !== c || d++;
    c = e;
  } while (c);
  bd(b);
}
function Lf(a) {
  for (; null != a; a = a.nextSibling) {
    var b = a.nodeType;
    if (1 === b || 3 === b) break;
    if (8 === b) {
      b = a.data;
      if ("$" === b || "$!" === b || "$?" === b) break;
      if ("/$" === b) return null;
    }
  }
  return a;
}
function Mf(a) {
  a = a.previousSibling;
  for (var b = 0; a; ) {
    if (8 === a.nodeType) {
      var c = a.data;
      if ("$" === c || "$!" === c || "$?" === c) {
        if (0 === b) return a;
        b--;
      } else "/$" === c && b++;
    }
    a = a.previousSibling;
  }
  return null;
}
var Nf = Math.random().toString(36).slice(2), Of = "__reactFiber$" + Nf, Pf = "__reactProps$" + Nf, uf = "__reactContainer$" + Nf, of = "__reactEvents$" + Nf, Qf = "__reactListeners$" + Nf, Rf = "__reactHandles$" + Nf;
function Wc(a) {
  var b = a[Of];
  if (b) return b;
  for (var c = a.parentNode; c; ) {
    if (b = c[uf] || c[Of]) {
      c = b.alternate;
      if (null !== b.child || null !== c && null !== c.child) for (a = Mf(a); null !== a; ) {
        if (c = a[Of]) return c;
        a = Mf(a);
      }
      return b;
    }
    a = c;
    c = a.parentNode;
  }
  return null;
}
function Cb(a) {
  a = a[Of] || a[uf];
  return !a || 5 !== a.tag && 6 !== a.tag && 13 !== a.tag && 3 !== a.tag ? null : a;
}
function ue(a) {
  if (5 === a.tag || 6 === a.tag) return a.stateNode;
  throw Error(p(33));
}
function Db(a) {
  return a[Pf] || null;
}
var Sf = [], Tf = -1;
function Uf(a) {
  return { current: a };
}
function E(a) {
  0 > Tf || (a.current = Sf[Tf], Sf[Tf] = null, Tf--);
}
function G(a, b) {
  Tf++;
  Sf[Tf] = a.current;
  a.current = b;
}
var Vf = {}, H$1 = Uf(Vf), Wf = Uf(false), Xf = Vf;
function Yf(a, b) {
  var c = a.type.contextTypes;
  if (!c) return Vf;
  var d = a.stateNode;
  if (d && d.__reactInternalMemoizedUnmaskedChildContext === b) return d.__reactInternalMemoizedMaskedChildContext;
  var e = {}, f2;
  for (f2 in c) e[f2] = b[f2];
  d && (a = a.stateNode, a.__reactInternalMemoizedUnmaskedChildContext = b, a.__reactInternalMemoizedMaskedChildContext = e);
  return e;
}
function Zf(a) {
  a = a.childContextTypes;
  return null !== a && void 0 !== a;
}
function $f() {
  E(Wf);
  E(H$1);
}
function ag(a, b, c) {
  if (H$1.current !== Vf) throw Error(p(168));
  G(H$1, b);
  G(Wf, c);
}
function bg(a, b, c) {
  var d = a.stateNode;
  b = b.childContextTypes;
  if ("function" !== typeof d.getChildContext) return c;
  d = d.getChildContext();
  for (var e in d) if (!(e in b)) throw Error(p(108, Ra(a) || "Unknown", e));
  return A({}, c, d);
}
function cg(a) {
  a = (a = a.stateNode) && a.__reactInternalMemoizedMergedChildContext || Vf;
  Xf = H$1.current;
  G(H$1, a);
  G(Wf, Wf.current);
  return true;
}
function dg(a, b, c) {
  var d = a.stateNode;
  if (!d) throw Error(p(169));
  c ? (a = bg(a, b, Xf), d.__reactInternalMemoizedMergedChildContext = a, E(Wf), E(H$1), G(H$1, a)) : E(Wf);
  G(Wf, c);
}
var eg = null, fg = false, gg = false;
function hg(a) {
  null === eg ? eg = [a] : eg.push(a);
}
function ig(a) {
  fg = true;
  hg(a);
}
function jg() {
  if (!gg && null !== eg) {
    gg = true;
    var a = 0, b = C;
    try {
      var c = eg;
      for (C = 1; a < c.length; a++) {
        var d = c[a];
        do
          d = d(true);
        while (null !== d);
      }
      eg = null;
      fg = false;
    } catch (e) {
      throw null !== eg && (eg = eg.slice(a + 1)), ac(fc, jg), e;
    } finally {
      C = b, gg = false;
    }
  }
  return null;
}
var kg = [], lg = 0, mg = null, ng = 0, og = [], pg = 0, qg = null, rg = 1, sg = "";
function tg(a, b) {
  kg[lg++] = ng;
  kg[lg++] = mg;
  mg = a;
  ng = b;
}
function ug(a, b, c) {
  og[pg++] = rg;
  og[pg++] = sg;
  og[pg++] = qg;
  qg = a;
  var d = rg;
  a = sg;
  var e = 32 - oc(d) - 1;
  d &= ~(1 << e);
  c += 1;
  var f2 = 32 - oc(b) + e;
  if (30 < f2) {
    var g = e - e % 5;
    f2 = (d & (1 << g) - 1).toString(32);
    d >>= g;
    e -= g;
    rg = 1 << 32 - oc(b) + e | c << e | d;
    sg = f2 + a;
  } else rg = 1 << f2 | c << e | d, sg = a;
}
function vg(a) {
  null !== a.return && (tg(a, 1), ug(a, 1, 0));
}
function wg(a) {
  for (; a === mg; ) mg = kg[--lg], kg[lg] = null, ng = kg[--lg], kg[lg] = null;
  for (; a === qg; ) qg = og[--pg], og[pg] = null, sg = og[--pg], og[pg] = null, rg = og[--pg], og[pg] = null;
}
var xg = null, yg = null, I = false, zg = null;
function Ag(a, b) {
  var c = Bg(5, null, null, 0);
  c.elementType = "DELETED";
  c.stateNode = b;
  c.return = a;
  b = a.deletions;
  null === b ? (a.deletions = [c], a.flags |= 16) : b.push(c);
}
function Cg(a, b) {
  switch (a.tag) {
    case 5:
      var c = a.type;
      b = 1 !== b.nodeType || c.toLowerCase() !== b.nodeName.toLowerCase() ? null : b;
      return null !== b ? (a.stateNode = b, xg = a, yg = Lf(b.firstChild), true) : false;
    case 6:
      return b = "" === a.pendingProps || 3 !== b.nodeType ? null : b, null !== b ? (a.stateNode = b, xg = a, yg = null, true) : false;
    case 13:
      return b = 8 !== b.nodeType ? null : b, null !== b ? (c = null !== qg ? { id: rg, overflow: sg } : null, a.memoizedState = { dehydrated: b, treeContext: c, retryLane: 1073741824 }, c = Bg(18, null, null, 0), c.stateNode = b, c.return = a, a.child = c, xg = a, yg = null, true) : false;
    default:
      return false;
  }
}
function Dg(a) {
  return 0 !== (a.mode & 1) && 0 === (a.flags & 128);
}
function Eg(a) {
  if (I) {
    var b = yg;
    if (b) {
      var c = b;
      if (!Cg(a, b)) {
        if (Dg(a)) throw Error(p(418));
        b = Lf(c.nextSibling);
        var d = xg;
        b && Cg(a, b) ? Ag(d, c) : (a.flags = a.flags & -4097 | 2, I = false, xg = a);
      }
    } else {
      if (Dg(a)) throw Error(p(418));
      a.flags = a.flags & -4097 | 2;
      I = false;
      xg = a;
    }
  }
}
function Fg(a) {
  for (a = a.return; null !== a && 5 !== a.tag && 3 !== a.tag && 13 !== a.tag; ) a = a.return;
  xg = a;
}
function Gg(a) {
  if (a !== xg) return false;
  if (!I) return Fg(a), I = true, false;
  var b;
  (b = 3 !== a.tag) && !(b = 5 !== a.tag) && (b = a.type, b = "head" !== b && "body" !== b && !Ef(a.type, a.memoizedProps));
  if (b && (b = yg)) {
    if (Dg(a)) throw Hg(), Error(p(418));
    for (; b; ) Ag(a, b), b = Lf(b.nextSibling);
  }
  Fg(a);
  if (13 === a.tag) {
    a = a.memoizedState;
    a = null !== a ? a.dehydrated : null;
    if (!a) throw Error(p(317));
    a: {
      a = a.nextSibling;
      for (b = 0; a; ) {
        if (8 === a.nodeType) {
          var c = a.data;
          if ("/$" === c) {
            if (0 === b) {
              yg = Lf(a.nextSibling);
              break a;
            }
            b--;
          } else "$" !== c && "$!" !== c && "$?" !== c || b++;
        }
        a = a.nextSibling;
      }
      yg = null;
    }
  } else yg = xg ? Lf(a.stateNode.nextSibling) : null;
  return true;
}
function Hg() {
  for (var a = yg; a; ) a = Lf(a.nextSibling);
}
function Ig() {
  yg = xg = null;
  I = false;
}
function Jg(a) {
  null === zg ? zg = [a] : zg.push(a);
}
var Kg = ua.ReactCurrentBatchConfig;
function Lg(a, b, c) {
  a = c.ref;
  if (null !== a && "function" !== typeof a && "object" !== typeof a) {
    if (c._owner) {
      c = c._owner;
      if (c) {
        if (1 !== c.tag) throw Error(p(309));
        var d = c.stateNode;
      }
      if (!d) throw Error(p(147, a));
      var e = d, f2 = "" + a;
      if (null !== b && null !== b.ref && "function" === typeof b.ref && b.ref._stringRef === f2) return b.ref;
      b = function(a2) {
        var b2 = e.refs;
        null === a2 ? delete b2[f2] : b2[f2] = a2;
      };
      b._stringRef = f2;
      return b;
    }
    if ("string" !== typeof a) throw Error(p(284));
    if (!c._owner) throw Error(p(290, a));
  }
  return a;
}
function Mg(a, b) {
  a = Object.prototype.toString.call(b);
  throw Error(p(31, "[object Object]" === a ? "object with keys {" + Object.keys(b).join(", ") + "}" : a));
}
function Ng(a) {
  var b = a._init;
  return b(a._payload);
}
function Og(a) {
  function b(b2, c2) {
    if (a) {
      var d2 = b2.deletions;
      null === d2 ? (b2.deletions = [c2], b2.flags |= 16) : d2.push(c2);
    }
  }
  function c(c2, d2) {
    if (!a) return null;
    for (; null !== d2; ) b(c2, d2), d2 = d2.sibling;
    return null;
  }
  function d(a2, b2) {
    for (a2 = /* @__PURE__ */ new Map(); null !== b2; ) null !== b2.key ? a2.set(b2.key, b2) : a2.set(b2.index, b2), b2 = b2.sibling;
    return a2;
  }
  function e(a2, b2) {
    a2 = Pg(a2, b2);
    a2.index = 0;
    a2.sibling = null;
    return a2;
  }
  function f2(b2, c2, d2) {
    b2.index = d2;
    if (!a) return b2.flags |= 1048576, c2;
    d2 = b2.alternate;
    if (null !== d2) return d2 = d2.index, d2 < c2 ? (b2.flags |= 2, c2) : d2;
    b2.flags |= 2;
    return c2;
  }
  function g(b2) {
    a && null === b2.alternate && (b2.flags |= 2);
    return b2;
  }
  function h2(a2, b2, c2, d2) {
    if (null === b2 || 6 !== b2.tag) return b2 = Qg(c2, a2.mode, d2), b2.return = a2, b2;
    b2 = e(b2, c2);
    b2.return = a2;
    return b2;
  }
  function k2(a2, b2, c2, d2) {
    var f3 = c2.type;
    if (f3 === ya) return m2(a2, b2, c2.props.children, d2, c2.key);
    if (null !== b2 && (b2.elementType === f3 || "object" === typeof f3 && null !== f3 && f3.$$typeof === Ha && Ng(f3) === b2.type)) return d2 = e(b2, c2.props), d2.ref = Lg(a2, b2, c2), d2.return = a2, d2;
    d2 = Rg(c2.type, c2.key, c2.props, null, a2.mode, d2);
    d2.ref = Lg(a2, b2, c2);
    d2.return = a2;
    return d2;
  }
  function l2(a2, b2, c2, d2) {
    if (null === b2 || 4 !== b2.tag || b2.stateNode.containerInfo !== c2.containerInfo || b2.stateNode.implementation !== c2.implementation) return b2 = Sg(c2, a2.mode, d2), b2.return = a2, b2;
    b2 = e(b2, c2.children || []);
    b2.return = a2;
    return b2;
  }
  function m2(a2, b2, c2, d2, f3) {
    if (null === b2 || 7 !== b2.tag) return b2 = Tg(c2, a2.mode, d2, f3), b2.return = a2, b2;
    b2 = e(b2, c2);
    b2.return = a2;
    return b2;
  }
  function q2(a2, b2, c2) {
    if ("string" === typeof b2 && "" !== b2 || "number" === typeof b2) return b2 = Qg("" + b2, a2.mode, c2), b2.return = a2, b2;
    if ("object" === typeof b2 && null !== b2) {
      switch (b2.$$typeof) {
        case va:
          return c2 = Rg(b2.type, b2.key, b2.props, null, a2.mode, c2), c2.ref = Lg(a2, null, b2), c2.return = a2, c2;
        case wa:
          return b2 = Sg(b2, a2.mode, c2), b2.return = a2, b2;
        case Ha:
          var d2 = b2._init;
          return q2(a2, d2(b2._payload), c2);
      }
      if (eb(b2) || Ka(b2)) return b2 = Tg(b2, a2.mode, c2, null), b2.return = a2, b2;
      Mg(a2, b2);
    }
    return null;
  }
  function r2(a2, b2, c2, d2) {
    var e2 = null !== b2 ? b2.key : null;
    if ("string" === typeof c2 && "" !== c2 || "number" === typeof c2) return null !== e2 ? null : h2(a2, b2, "" + c2, d2);
    if ("object" === typeof c2 && null !== c2) {
      switch (c2.$$typeof) {
        case va:
          return c2.key === e2 ? k2(a2, b2, c2, d2) : null;
        case wa:
          return c2.key === e2 ? l2(a2, b2, c2, d2) : null;
        case Ha:
          return e2 = c2._init, r2(
            a2,
            b2,
            e2(c2._payload),
            d2
          );
      }
      if (eb(c2) || Ka(c2)) return null !== e2 ? null : m2(a2, b2, c2, d2, null);
      Mg(a2, c2);
    }
    return null;
  }
  function y2(a2, b2, c2, d2, e2) {
    if ("string" === typeof d2 && "" !== d2 || "number" === typeof d2) return a2 = a2.get(c2) || null, h2(b2, a2, "" + d2, e2);
    if ("object" === typeof d2 && null !== d2) {
      switch (d2.$$typeof) {
        case va:
          return a2 = a2.get(null === d2.key ? c2 : d2.key) || null, k2(b2, a2, d2, e2);
        case wa:
          return a2 = a2.get(null === d2.key ? c2 : d2.key) || null, l2(b2, a2, d2, e2);
        case Ha:
          var f3 = d2._init;
          return y2(a2, b2, c2, f3(d2._payload), e2);
      }
      if (eb(d2) || Ka(d2)) return a2 = a2.get(c2) || null, m2(b2, a2, d2, e2, null);
      Mg(b2, d2);
    }
    return null;
  }
  function n2(e2, g2, h3, k3) {
    for (var l3 = null, m3 = null, u2 = g2, w2 = g2 = 0, x2 = null; null !== u2 && w2 < h3.length; w2++) {
      u2.index > w2 ? (x2 = u2, u2 = null) : x2 = u2.sibling;
      var n3 = r2(e2, u2, h3[w2], k3);
      if (null === n3) {
        null === u2 && (u2 = x2);
        break;
      }
      a && u2 && null === n3.alternate && b(e2, u2);
      g2 = f2(n3, g2, w2);
      null === m3 ? l3 = n3 : m3.sibling = n3;
      m3 = n3;
      u2 = x2;
    }
    if (w2 === h3.length) return c(e2, u2), I && tg(e2, w2), l3;
    if (null === u2) {
      for (; w2 < h3.length; w2++) u2 = q2(e2, h3[w2], k3), null !== u2 && (g2 = f2(u2, g2, w2), null === m3 ? l3 = u2 : m3.sibling = u2, m3 = u2);
      I && tg(e2, w2);
      return l3;
    }
    for (u2 = d(e2, u2); w2 < h3.length; w2++) x2 = y2(u2, e2, w2, h3[w2], k3), null !== x2 && (a && null !== x2.alternate && u2.delete(null === x2.key ? w2 : x2.key), g2 = f2(x2, g2, w2), null === m3 ? l3 = x2 : m3.sibling = x2, m3 = x2);
    a && u2.forEach(function(a2) {
      return b(e2, a2);
    });
    I && tg(e2, w2);
    return l3;
  }
  function t2(e2, g2, h3, k3) {
    var l3 = Ka(h3);
    if ("function" !== typeof l3) throw Error(p(150));
    h3 = l3.call(h3);
    if (null == h3) throw Error(p(151));
    for (var u2 = l3 = null, m3 = g2, w2 = g2 = 0, x2 = null, n3 = h3.next(); null !== m3 && !n3.done; w2++, n3 = h3.next()) {
      m3.index > w2 ? (x2 = m3, m3 = null) : x2 = m3.sibling;
      var t3 = r2(e2, m3, n3.value, k3);
      if (null === t3) {
        null === m3 && (m3 = x2);
        break;
      }
      a && m3 && null === t3.alternate && b(e2, m3);
      g2 = f2(t3, g2, w2);
      null === u2 ? l3 = t3 : u2.sibling = t3;
      u2 = t3;
      m3 = x2;
    }
    if (n3.done) return c(
      e2,
      m3
    ), I && tg(e2, w2), l3;
    if (null === m3) {
      for (; !n3.done; w2++, n3 = h3.next()) n3 = q2(e2, n3.value, k3), null !== n3 && (g2 = f2(n3, g2, w2), null === u2 ? l3 = n3 : u2.sibling = n3, u2 = n3);
      I && tg(e2, w2);
      return l3;
    }
    for (m3 = d(e2, m3); !n3.done; w2++, n3 = h3.next()) n3 = y2(m3, e2, w2, n3.value, k3), null !== n3 && (a && null !== n3.alternate && m3.delete(null === n3.key ? w2 : n3.key), g2 = f2(n3, g2, w2), null === u2 ? l3 = n3 : u2.sibling = n3, u2 = n3);
    a && m3.forEach(function(a2) {
      return b(e2, a2);
    });
    I && tg(e2, w2);
    return l3;
  }
  function J2(a2, d2, f3, h3) {
    "object" === typeof f3 && null !== f3 && f3.type === ya && null === f3.key && (f3 = f3.props.children);
    if ("object" === typeof f3 && null !== f3) {
      switch (f3.$$typeof) {
        case va:
          a: {
            for (var k3 = f3.key, l3 = d2; null !== l3; ) {
              if (l3.key === k3) {
                k3 = f3.type;
                if (k3 === ya) {
                  if (7 === l3.tag) {
                    c(a2, l3.sibling);
                    d2 = e(l3, f3.props.children);
                    d2.return = a2;
                    a2 = d2;
                    break a;
                  }
                } else if (l3.elementType === k3 || "object" === typeof k3 && null !== k3 && k3.$$typeof === Ha && Ng(k3) === l3.type) {
                  c(a2, l3.sibling);
                  d2 = e(l3, f3.props);
                  d2.ref = Lg(a2, l3, f3);
                  d2.return = a2;
                  a2 = d2;
                  break a;
                }
                c(a2, l3);
                break;
              } else b(a2, l3);
              l3 = l3.sibling;
            }
            f3.type === ya ? (d2 = Tg(f3.props.children, a2.mode, h3, f3.key), d2.return = a2, a2 = d2) : (h3 = Rg(f3.type, f3.key, f3.props, null, a2.mode, h3), h3.ref = Lg(a2, d2, f3), h3.return = a2, a2 = h3);
          }
          return g(a2);
        case wa:
          a: {
            for (l3 = f3.key; null !== d2; ) {
              if (d2.key === l3) if (4 === d2.tag && d2.stateNode.containerInfo === f3.containerInfo && d2.stateNode.implementation === f3.implementation) {
                c(a2, d2.sibling);
                d2 = e(d2, f3.children || []);
                d2.return = a2;
                a2 = d2;
                break a;
              } else {
                c(a2, d2);
                break;
              }
              else b(a2, d2);
              d2 = d2.sibling;
            }
            d2 = Sg(f3, a2.mode, h3);
            d2.return = a2;
            a2 = d2;
          }
          return g(a2);
        case Ha:
          return l3 = f3._init, J2(a2, d2, l3(f3._payload), h3);
      }
      if (eb(f3)) return n2(a2, d2, f3, h3);
      if (Ka(f3)) return t2(a2, d2, f3, h3);
      Mg(a2, f3);
    }
    return "string" === typeof f3 && "" !== f3 || "number" === typeof f3 ? (f3 = "" + f3, null !== d2 && 6 === d2.tag ? (c(a2, d2.sibling), d2 = e(d2, f3), d2.return = a2, a2 = d2) : (c(a2, d2), d2 = Qg(f3, a2.mode, h3), d2.return = a2, a2 = d2), g(a2)) : c(a2, d2);
  }
  return J2;
}
var Ug = Og(true), Vg = Og(false), Wg = Uf(null), Xg = null, Yg = null, Zg = null;
function $g() {
  Zg = Yg = Xg = null;
}
function ah(a) {
  var b = Wg.current;
  E(Wg);
  a._currentValue = b;
}
function bh(a, b, c) {
  for (; null !== a; ) {
    var d = a.alternate;
    (a.childLanes & b) !== b ? (a.childLanes |= b, null !== d && (d.childLanes |= b)) : null !== d && (d.childLanes & b) !== b && (d.childLanes |= b);
    if (a === c) break;
    a = a.return;
  }
}
function ch(a, b) {
  Xg = a;
  Zg = Yg = null;
  a = a.dependencies;
  null !== a && null !== a.firstContext && (0 !== (a.lanes & b) && (dh = true), a.firstContext = null);
}
function eh(a) {
  var b = a._currentValue;
  if (Zg !== a) if (a = { context: a, memoizedValue: b, next: null }, null === Yg) {
    if (null === Xg) throw Error(p(308));
    Yg = a;
    Xg.dependencies = { lanes: 0, firstContext: a };
  } else Yg = Yg.next = a;
  return b;
}
var fh = null;
function gh(a) {
  null === fh ? fh = [a] : fh.push(a);
}
function hh(a, b, c, d) {
  var e = b.interleaved;
  null === e ? (c.next = c, gh(b)) : (c.next = e.next, e.next = c);
  b.interleaved = c;
  return ih(a, d);
}
function ih(a, b) {
  a.lanes |= b;
  var c = a.alternate;
  null !== c && (c.lanes |= b);
  c = a;
  for (a = a.return; null !== a; ) a.childLanes |= b, c = a.alternate, null !== c && (c.childLanes |= b), c = a, a = a.return;
  return 3 === c.tag ? c.stateNode : null;
}
var jh = false;
function kh(a) {
  a.updateQueue = { baseState: a.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
}
function lh(a, b) {
  a = a.updateQueue;
  b.updateQueue === a && (b.updateQueue = { baseState: a.baseState, firstBaseUpdate: a.firstBaseUpdate, lastBaseUpdate: a.lastBaseUpdate, shared: a.shared, effects: a.effects });
}
function mh(a, b) {
  return { eventTime: a, lane: b, tag: 0, payload: null, callback: null, next: null };
}
function nh(a, b, c) {
  var d = a.updateQueue;
  if (null === d) return null;
  d = d.shared;
  if (0 !== (K & 2)) {
    var e = d.pending;
    null === e ? b.next = b : (b.next = e.next, e.next = b);
    d.pending = b;
    return ih(a, c);
  }
  e = d.interleaved;
  null === e ? (b.next = b, gh(d)) : (b.next = e.next, e.next = b);
  d.interleaved = b;
  return ih(a, c);
}
function oh(a, b, c) {
  b = b.updateQueue;
  if (null !== b && (b = b.shared, 0 !== (c & 4194240))) {
    var d = b.lanes;
    d &= a.pendingLanes;
    c |= d;
    b.lanes = c;
    Cc(a, c);
  }
}
function ph(a, b) {
  var c = a.updateQueue, d = a.alternate;
  if (null !== d && (d = d.updateQueue, c === d)) {
    var e = null, f2 = null;
    c = c.firstBaseUpdate;
    if (null !== c) {
      do {
        var g = { eventTime: c.eventTime, lane: c.lane, tag: c.tag, payload: c.payload, callback: c.callback, next: null };
        null === f2 ? e = f2 = g : f2 = f2.next = g;
        c = c.next;
      } while (null !== c);
      null === f2 ? e = f2 = b : f2 = f2.next = b;
    } else e = f2 = b;
    c = { baseState: d.baseState, firstBaseUpdate: e, lastBaseUpdate: f2, shared: d.shared, effects: d.effects };
    a.updateQueue = c;
    return;
  }
  a = c.lastBaseUpdate;
  null === a ? c.firstBaseUpdate = b : a.next = b;
  c.lastBaseUpdate = b;
}
function qh(a, b, c, d) {
  var e = a.updateQueue;
  jh = false;
  var f2 = e.firstBaseUpdate, g = e.lastBaseUpdate, h2 = e.shared.pending;
  if (null !== h2) {
    e.shared.pending = null;
    var k2 = h2, l2 = k2.next;
    k2.next = null;
    null === g ? f2 = l2 : g.next = l2;
    g = k2;
    var m2 = a.alternate;
    null !== m2 && (m2 = m2.updateQueue, h2 = m2.lastBaseUpdate, h2 !== g && (null === h2 ? m2.firstBaseUpdate = l2 : h2.next = l2, m2.lastBaseUpdate = k2));
  }
  if (null !== f2) {
    var q2 = e.baseState;
    g = 0;
    m2 = l2 = k2 = null;
    h2 = f2;
    do {
      var r2 = h2.lane, y2 = h2.eventTime;
      if ((d & r2) === r2) {
        null !== m2 && (m2 = m2.next = {
          eventTime: y2,
          lane: 0,
          tag: h2.tag,
          payload: h2.payload,
          callback: h2.callback,
          next: null
        });
        a: {
          var n2 = a, t2 = h2;
          r2 = b;
          y2 = c;
          switch (t2.tag) {
            case 1:
              n2 = t2.payload;
              if ("function" === typeof n2) {
                q2 = n2.call(y2, q2, r2);
                break a;
              }
              q2 = n2;
              break a;
            case 3:
              n2.flags = n2.flags & -65537 | 128;
            case 0:
              n2 = t2.payload;
              r2 = "function" === typeof n2 ? n2.call(y2, q2, r2) : n2;
              if (null === r2 || void 0 === r2) break a;
              q2 = A({}, q2, r2);
              break a;
            case 2:
              jh = true;
          }
        }
        null !== h2.callback && 0 !== h2.lane && (a.flags |= 64, r2 = e.effects, null === r2 ? e.effects = [h2] : r2.push(h2));
      } else y2 = { eventTime: y2, lane: r2, tag: h2.tag, payload: h2.payload, callback: h2.callback, next: null }, null === m2 ? (l2 = m2 = y2, k2 = q2) : m2 = m2.next = y2, g |= r2;
      h2 = h2.next;
      if (null === h2) if (h2 = e.shared.pending, null === h2) break;
      else r2 = h2, h2 = r2.next, r2.next = null, e.lastBaseUpdate = r2, e.shared.pending = null;
    } while (1);
    null === m2 && (k2 = q2);
    e.baseState = k2;
    e.firstBaseUpdate = l2;
    e.lastBaseUpdate = m2;
    b = e.shared.interleaved;
    if (null !== b) {
      e = b;
      do
        g |= e.lane, e = e.next;
      while (e !== b);
    } else null === f2 && (e.shared.lanes = 0);
    rh |= g;
    a.lanes = g;
    a.memoizedState = q2;
  }
}
function sh(a, b, c) {
  a = b.effects;
  b.effects = null;
  if (null !== a) for (b = 0; b < a.length; b++) {
    var d = a[b], e = d.callback;
    if (null !== e) {
      d.callback = null;
      d = c;
      if ("function" !== typeof e) throw Error(p(191, e));
      e.call(d);
    }
  }
}
var th = {}, uh = Uf(th), vh = Uf(th), wh = Uf(th);
function xh(a) {
  if (a === th) throw Error(p(174));
  return a;
}
function yh(a, b) {
  G(wh, b);
  G(vh, a);
  G(uh, th);
  a = b.nodeType;
  switch (a) {
    case 9:
    case 11:
      b = (b = b.documentElement) ? b.namespaceURI : lb(null, "");
      break;
    default:
      a = 8 === a ? b.parentNode : b, b = a.namespaceURI || null, a = a.tagName, b = lb(b, a);
  }
  E(uh);
  G(uh, b);
}
function zh() {
  E(uh);
  E(vh);
  E(wh);
}
function Ah(a) {
  xh(wh.current);
  var b = xh(uh.current);
  var c = lb(b, a.type);
  b !== c && (G(vh, a), G(uh, c));
}
function Bh(a) {
  vh.current === a && (E(uh), E(vh));
}
var L = Uf(0);
function Ch(a) {
  for (var b = a; null !== b; ) {
    if (13 === b.tag) {
      var c = b.memoizedState;
      if (null !== c && (c = c.dehydrated, null === c || "$?" === c.data || "$!" === c.data)) return b;
    } else if (19 === b.tag && void 0 !== b.memoizedProps.revealOrder) {
      if (0 !== (b.flags & 128)) return b;
    } else if (null !== b.child) {
      b.child.return = b;
      b = b.child;
      continue;
    }
    if (b === a) break;
    for (; null === b.sibling; ) {
      if (null === b.return || b.return === a) return null;
      b = b.return;
    }
    b.sibling.return = b.return;
    b = b.sibling;
  }
  return null;
}
var Dh = [];
function Eh() {
  for (var a = 0; a < Dh.length; a++) Dh[a]._workInProgressVersionPrimary = null;
  Dh.length = 0;
}
var Fh = ua.ReactCurrentDispatcher, Gh = ua.ReactCurrentBatchConfig, Hh = 0, M = null, N = null, O = null, Ih = false, Jh = false, Kh = 0, Lh = 0;
function P() {
  throw Error(p(321));
}
function Mh(a, b) {
  if (null === b) return false;
  for (var c = 0; c < b.length && c < a.length; c++) if (!He$1(a[c], b[c])) return false;
  return true;
}
function Nh(a, b, c, d, e, f2) {
  Hh = f2;
  M = b;
  b.memoizedState = null;
  b.updateQueue = null;
  b.lanes = 0;
  Fh.current = null === a || null === a.memoizedState ? Oh : Ph;
  a = c(d, e);
  if (Jh) {
    f2 = 0;
    do {
      Jh = false;
      Kh = 0;
      if (25 <= f2) throw Error(p(301));
      f2 += 1;
      O = N = null;
      b.updateQueue = null;
      Fh.current = Qh;
      a = c(d, e);
    } while (Jh);
  }
  Fh.current = Rh;
  b = null !== N && null !== N.next;
  Hh = 0;
  O = N = M = null;
  Ih = false;
  if (b) throw Error(p(300));
  return a;
}
function Sh() {
  var a = 0 !== Kh;
  Kh = 0;
  return a;
}
function Th() {
  var a = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
  null === O ? M.memoizedState = O = a : O = O.next = a;
  return O;
}
function Uh() {
  if (null === N) {
    var a = M.alternate;
    a = null !== a ? a.memoizedState : null;
  } else a = N.next;
  var b = null === O ? M.memoizedState : O.next;
  if (null !== b) O = b, N = a;
  else {
    if (null === a) throw Error(p(310));
    N = a;
    a = { memoizedState: N.memoizedState, baseState: N.baseState, baseQueue: N.baseQueue, queue: N.queue, next: null };
    null === O ? M.memoizedState = O = a : O = O.next = a;
  }
  return O;
}
function Vh(a, b) {
  return "function" === typeof b ? b(a) : b;
}
function Wh(a) {
  var b = Uh(), c = b.queue;
  if (null === c) throw Error(p(311));
  c.lastRenderedReducer = a;
  var d = N, e = d.baseQueue, f2 = c.pending;
  if (null !== f2) {
    if (null !== e) {
      var g = e.next;
      e.next = f2.next;
      f2.next = g;
    }
    d.baseQueue = e = f2;
    c.pending = null;
  }
  if (null !== e) {
    f2 = e.next;
    d = d.baseState;
    var h2 = g = null, k2 = null, l2 = f2;
    do {
      var m2 = l2.lane;
      if ((Hh & m2) === m2) null !== k2 && (k2 = k2.next = { lane: 0, action: l2.action, hasEagerState: l2.hasEagerState, eagerState: l2.eagerState, next: null }), d = l2.hasEagerState ? l2.eagerState : a(d, l2.action);
      else {
        var q2 = {
          lane: m2,
          action: l2.action,
          hasEagerState: l2.hasEagerState,
          eagerState: l2.eagerState,
          next: null
        };
        null === k2 ? (h2 = k2 = q2, g = d) : k2 = k2.next = q2;
        M.lanes |= m2;
        rh |= m2;
      }
      l2 = l2.next;
    } while (null !== l2 && l2 !== f2);
    null === k2 ? g = d : k2.next = h2;
    He$1(d, b.memoizedState) || (dh = true);
    b.memoizedState = d;
    b.baseState = g;
    b.baseQueue = k2;
    c.lastRenderedState = d;
  }
  a = c.interleaved;
  if (null !== a) {
    e = a;
    do
      f2 = e.lane, M.lanes |= f2, rh |= f2, e = e.next;
    while (e !== a);
  } else null === e && (c.lanes = 0);
  return [b.memoizedState, c.dispatch];
}
function Xh(a) {
  var b = Uh(), c = b.queue;
  if (null === c) throw Error(p(311));
  c.lastRenderedReducer = a;
  var d = c.dispatch, e = c.pending, f2 = b.memoizedState;
  if (null !== e) {
    c.pending = null;
    var g = e = e.next;
    do
      f2 = a(f2, g.action), g = g.next;
    while (g !== e);
    He$1(f2, b.memoizedState) || (dh = true);
    b.memoizedState = f2;
    null === b.baseQueue && (b.baseState = f2);
    c.lastRenderedState = f2;
  }
  return [f2, d];
}
function Yh() {
}
function Zh(a, b) {
  var c = M, d = Uh(), e = b(), f2 = !He$1(d.memoizedState, e);
  f2 && (d.memoizedState = e, dh = true);
  d = d.queue;
  $h(ai.bind(null, c, d, a), [a]);
  if (d.getSnapshot !== b || f2 || null !== O && O.memoizedState.tag & 1) {
    c.flags |= 2048;
    bi(9, ci.bind(null, c, d, e, b), void 0, null);
    if (null === Q) throw Error(p(349));
    0 !== (Hh & 30) || di(c, b, e);
  }
  return e;
}
function di(a, b, c) {
  a.flags |= 16384;
  a = { getSnapshot: b, value: c };
  b = M.updateQueue;
  null === b ? (b = { lastEffect: null, stores: null }, M.updateQueue = b, b.stores = [a]) : (c = b.stores, null === c ? b.stores = [a] : c.push(a));
}
function ci(a, b, c, d) {
  b.value = c;
  b.getSnapshot = d;
  ei(b) && fi(a);
}
function ai(a, b, c) {
  return c(function() {
    ei(b) && fi(a);
  });
}
function ei(a) {
  var b = a.getSnapshot;
  a = a.value;
  try {
    var c = b();
    return !He$1(a, c);
  } catch (d) {
    return true;
  }
}
function fi(a) {
  var b = ih(a, 1);
  null !== b && gi(b, a, 1, -1);
}
function hi(a) {
  var b = Th();
  "function" === typeof a && (a = a());
  b.memoizedState = b.baseState = a;
  a = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: Vh, lastRenderedState: a };
  b.queue = a;
  a = a.dispatch = ii.bind(null, M, a);
  return [b.memoizedState, a];
}
function bi(a, b, c, d) {
  a = { tag: a, create: b, destroy: c, deps: d, next: null };
  b = M.updateQueue;
  null === b ? (b = { lastEffect: null, stores: null }, M.updateQueue = b, b.lastEffect = a.next = a) : (c = b.lastEffect, null === c ? b.lastEffect = a.next = a : (d = c.next, c.next = a, a.next = d, b.lastEffect = a));
  return a;
}
function ji() {
  return Uh().memoizedState;
}
function ki(a, b, c, d) {
  var e = Th();
  M.flags |= a;
  e.memoizedState = bi(1 | b, c, void 0, void 0 === d ? null : d);
}
function li(a, b, c, d) {
  var e = Uh();
  d = void 0 === d ? null : d;
  var f2 = void 0;
  if (null !== N) {
    var g = N.memoizedState;
    f2 = g.destroy;
    if (null !== d && Mh(d, g.deps)) {
      e.memoizedState = bi(b, c, f2, d);
      return;
    }
  }
  M.flags |= a;
  e.memoizedState = bi(1 | b, c, f2, d);
}
function mi(a, b) {
  return ki(8390656, 8, a, b);
}
function $h(a, b) {
  return li(2048, 8, a, b);
}
function ni(a, b) {
  return li(4, 2, a, b);
}
function oi(a, b) {
  return li(4, 4, a, b);
}
function pi(a, b) {
  if ("function" === typeof b) return a = a(), b(a), function() {
    b(null);
  };
  if (null !== b && void 0 !== b) return a = a(), b.current = a, function() {
    b.current = null;
  };
}
function qi(a, b, c) {
  c = null !== c && void 0 !== c ? c.concat([a]) : null;
  return li(4, 4, pi.bind(null, b, a), c);
}
function ri() {
}
function si(a, b) {
  var c = Uh();
  b = void 0 === b ? null : b;
  var d = c.memoizedState;
  if (null !== d && null !== b && Mh(b, d[1])) return d[0];
  c.memoizedState = [a, b];
  return a;
}
function ti(a, b) {
  var c = Uh();
  b = void 0 === b ? null : b;
  var d = c.memoizedState;
  if (null !== d && null !== b && Mh(b, d[1])) return d[0];
  a = a();
  c.memoizedState = [a, b];
  return a;
}
function ui(a, b, c) {
  if (0 === (Hh & 21)) return a.baseState && (a.baseState = false, dh = true), a.memoizedState = c;
  He$1(c, b) || (c = yc(), M.lanes |= c, rh |= c, a.baseState = true);
  return b;
}
function vi(a, b) {
  var c = C;
  C = 0 !== c && 4 > c ? c : 4;
  a(true);
  var d = Gh.transition;
  Gh.transition = {};
  try {
    a(false), b();
  } finally {
    C = c, Gh.transition = d;
  }
}
function wi() {
  return Uh().memoizedState;
}
function xi(a, b, c) {
  var d = yi(a);
  c = { lane: d, action: c, hasEagerState: false, eagerState: null, next: null };
  if (zi(a)) Ai(b, c);
  else if (c = hh(a, b, c, d), null !== c) {
    var e = R();
    gi(c, a, d, e);
    Bi(c, b, d);
  }
}
function ii(a, b, c) {
  var d = yi(a), e = { lane: d, action: c, hasEagerState: false, eagerState: null, next: null };
  if (zi(a)) Ai(b, e);
  else {
    var f2 = a.alternate;
    if (0 === a.lanes && (null === f2 || 0 === f2.lanes) && (f2 = b.lastRenderedReducer, null !== f2)) try {
      var g = b.lastRenderedState, h2 = f2(g, c);
      e.hasEagerState = true;
      e.eagerState = h2;
      if (He$1(h2, g)) {
        var k2 = b.interleaved;
        null === k2 ? (e.next = e, gh(b)) : (e.next = k2.next, k2.next = e);
        b.interleaved = e;
        return;
      }
    } catch (l2) {
    } finally {
    }
    c = hh(a, b, e, d);
    null !== c && (e = R(), gi(c, a, d, e), Bi(c, b, d));
  }
}
function zi(a) {
  var b = a.alternate;
  return a === M || null !== b && b === M;
}
function Ai(a, b) {
  Jh = Ih = true;
  var c = a.pending;
  null === c ? b.next = b : (b.next = c.next, c.next = b);
  a.pending = b;
}
function Bi(a, b, c) {
  if (0 !== (c & 4194240)) {
    var d = b.lanes;
    d &= a.pendingLanes;
    c |= d;
    b.lanes = c;
    Cc(a, c);
  }
}
var Rh = { readContext: eh, useCallback: P, useContext: P, useEffect: P, useImperativeHandle: P, useInsertionEffect: P, useLayoutEffect: P, useMemo: P, useReducer: P, useRef: P, useState: P, useDebugValue: P, useDeferredValue: P, useTransition: P, useMutableSource: P, useSyncExternalStore: P, useId: P, unstable_isNewReconciler: false }, Oh = { readContext: eh, useCallback: function(a, b) {
  Th().memoizedState = [a, void 0 === b ? null : b];
  return a;
}, useContext: eh, useEffect: mi, useImperativeHandle: function(a, b, c) {
  c = null !== c && void 0 !== c ? c.concat([a]) : null;
  return ki(
    4194308,
    4,
    pi.bind(null, b, a),
    c
  );
}, useLayoutEffect: function(a, b) {
  return ki(4194308, 4, a, b);
}, useInsertionEffect: function(a, b) {
  return ki(4, 2, a, b);
}, useMemo: function(a, b) {
  var c = Th();
  b = void 0 === b ? null : b;
  a = a();
  c.memoizedState = [a, b];
  return a;
}, useReducer: function(a, b, c) {
  var d = Th();
  b = void 0 !== c ? c(b) : b;
  d.memoizedState = d.baseState = b;
  a = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: a, lastRenderedState: b };
  d.queue = a;
  a = a.dispatch = xi.bind(null, M, a);
  return [d.memoizedState, a];
}, useRef: function(a) {
  var b = Th();
  a = { current: a };
  return b.memoizedState = a;
}, useState: hi, useDebugValue: ri, useDeferredValue: function(a) {
  return Th().memoizedState = a;
}, useTransition: function() {
  var a = hi(false), b = a[0];
  a = vi.bind(null, a[1]);
  Th().memoizedState = a;
  return [b, a];
}, useMutableSource: function() {
}, useSyncExternalStore: function(a, b, c) {
  var d = M, e = Th();
  if (I) {
    if (void 0 === c) throw Error(p(407));
    c = c();
  } else {
    c = b();
    if (null === Q) throw Error(p(349));
    0 !== (Hh & 30) || di(d, b, c);
  }
  e.memoizedState = c;
  var f2 = { value: c, getSnapshot: b };
  e.queue = f2;
  mi(ai.bind(
    null,
    d,
    f2,
    a
  ), [a]);
  d.flags |= 2048;
  bi(9, ci.bind(null, d, f2, c, b), void 0, null);
  return c;
}, useId: function() {
  var a = Th(), b = Q.identifierPrefix;
  if (I) {
    var c = sg;
    var d = rg;
    c = (d & ~(1 << 32 - oc(d) - 1)).toString(32) + c;
    b = ":" + b + "R" + c;
    c = Kh++;
    0 < c && (b += "H" + c.toString(32));
    b += ":";
  } else c = Lh++, b = ":" + b + "r" + c.toString(32) + ":";
  return a.memoizedState = b;
}, unstable_isNewReconciler: false }, Ph = {
  readContext: eh,
  useCallback: si,
  useContext: eh,
  useEffect: $h,
  useImperativeHandle: qi,
  useInsertionEffect: ni,
  useLayoutEffect: oi,
  useMemo: ti,
  useReducer: Wh,
  useRef: ji,
  useState: function() {
    return Wh(Vh);
  },
  useDebugValue: ri,
  useDeferredValue: function(a) {
    var b = Uh();
    return ui(b, N.memoizedState, a);
  },
  useTransition: function() {
    var a = Wh(Vh)[0], b = Uh().memoizedState;
    return [a, b];
  },
  useMutableSource: Yh,
  useSyncExternalStore: Zh,
  useId: wi,
  unstable_isNewReconciler: false
}, Qh = { readContext: eh, useCallback: si, useContext: eh, useEffect: $h, useImperativeHandle: qi, useInsertionEffect: ni, useLayoutEffect: oi, useMemo: ti, useReducer: Xh, useRef: ji, useState: function() {
  return Xh(Vh);
}, useDebugValue: ri, useDeferredValue: function(a) {
  var b = Uh();
  return null === N ? b.memoizedState = a : ui(b, N.memoizedState, a);
}, useTransition: function() {
  var a = Xh(Vh)[0], b = Uh().memoizedState;
  return [a, b];
}, useMutableSource: Yh, useSyncExternalStore: Zh, useId: wi, unstable_isNewReconciler: false };
function Ci(a, b) {
  if (a && a.defaultProps) {
    b = A({}, b);
    a = a.defaultProps;
    for (var c in a) void 0 === b[c] && (b[c] = a[c]);
    return b;
  }
  return b;
}
function Di(a, b, c, d) {
  b = a.memoizedState;
  c = c(d, b);
  c = null === c || void 0 === c ? b : A({}, b, c);
  a.memoizedState = c;
  0 === a.lanes && (a.updateQueue.baseState = c);
}
var Ei = { isMounted: function(a) {
  return (a = a._reactInternals) ? Vb(a) === a : false;
}, enqueueSetState: function(a, b, c) {
  a = a._reactInternals;
  var d = R(), e = yi(a), f2 = mh(d, e);
  f2.payload = b;
  void 0 !== c && null !== c && (f2.callback = c);
  b = nh(a, f2, e);
  null !== b && (gi(b, a, e, d), oh(b, a, e));
}, enqueueReplaceState: function(a, b, c) {
  a = a._reactInternals;
  var d = R(), e = yi(a), f2 = mh(d, e);
  f2.tag = 1;
  f2.payload = b;
  void 0 !== c && null !== c && (f2.callback = c);
  b = nh(a, f2, e);
  null !== b && (gi(b, a, e, d), oh(b, a, e));
}, enqueueForceUpdate: function(a, b) {
  a = a._reactInternals;
  var c = R(), d = yi(a), e = mh(c, d);
  e.tag = 2;
  void 0 !== b && null !== b && (e.callback = b);
  b = nh(a, e, d);
  null !== b && (gi(b, a, d, c), oh(b, a, d));
} };
function Fi(a, b, c, d, e, f2, g) {
  a = a.stateNode;
  return "function" === typeof a.shouldComponentUpdate ? a.shouldComponentUpdate(d, f2, g) : b.prototype && b.prototype.isPureReactComponent ? !Ie(c, d) || !Ie(e, f2) : true;
}
function Gi(a, b, c) {
  var d = false, e = Vf;
  var f2 = b.contextType;
  "object" === typeof f2 && null !== f2 ? f2 = eh(f2) : (e = Zf(b) ? Xf : H$1.current, d = b.contextTypes, f2 = (d = null !== d && void 0 !== d) ? Yf(a, e) : Vf);
  b = new b(c, f2);
  a.memoizedState = null !== b.state && void 0 !== b.state ? b.state : null;
  b.updater = Ei;
  a.stateNode = b;
  b._reactInternals = a;
  d && (a = a.stateNode, a.__reactInternalMemoizedUnmaskedChildContext = e, a.__reactInternalMemoizedMaskedChildContext = f2);
  return b;
}
function Hi(a, b, c, d) {
  a = b.state;
  "function" === typeof b.componentWillReceiveProps && b.componentWillReceiveProps(c, d);
  "function" === typeof b.UNSAFE_componentWillReceiveProps && b.UNSAFE_componentWillReceiveProps(c, d);
  b.state !== a && Ei.enqueueReplaceState(b, b.state, null);
}
function Ii(a, b, c, d) {
  var e = a.stateNode;
  e.props = c;
  e.state = a.memoizedState;
  e.refs = {};
  kh(a);
  var f2 = b.contextType;
  "object" === typeof f2 && null !== f2 ? e.context = eh(f2) : (f2 = Zf(b) ? Xf : H$1.current, e.context = Yf(a, f2));
  e.state = a.memoizedState;
  f2 = b.getDerivedStateFromProps;
  "function" === typeof f2 && (Di(a, b, f2, c), e.state = a.memoizedState);
  "function" === typeof b.getDerivedStateFromProps || "function" === typeof e.getSnapshotBeforeUpdate || "function" !== typeof e.UNSAFE_componentWillMount && "function" !== typeof e.componentWillMount || (b = e.state, "function" === typeof e.componentWillMount && e.componentWillMount(), "function" === typeof e.UNSAFE_componentWillMount && e.UNSAFE_componentWillMount(), b !== e.state && Ei.enqueueReplaceState(e, e.state, null), qh(a, c, e, d), e.state = a.memoizedState);
  "function" === typeof e.componentDidMount && (a.flags |= 4194308);
}
function Ji(a, b) {
  try {
    var c = "", d = b;
    do
      c += Pa(d), d = d.return;
    while (d);
    var e = c;
  } catch (f2) {
    e = "\nError generating stack: " + f2.message + "\n" + f2.stack;
  }
  return { value: a, source: b, stack: e, digest: null };
}
function Ki(a, b, c) {
  return { value: a, source: null, stack: null != c ? c : null, digest: null != b ? b : null };
}
function Li(a, b) {
  try {
    console.error(b.value);
  } catch (c) {
    setTimeout(function() {
      throw c;
    });
  }
}
var Mi = "function" === typeof WeakMap ? WeakMap : Map;
function Ni(a, b, c) {
  c = mh(-1, c);
  c.tag = 3;
  c.payload = { element: null };
  var d = b.value;
  c.callback = function() {
    Oi || (Oi = true, Pi = d);
    Li(a, b);
  };
  return c;
}
function Qi(a, b, c) {
  c = mh(-1, c);
  c.tag = 3;
  var d = a.type.getDerivedStateFromError;
  if ("function" === typeof d) {
    var e = b.value;
    c.payload = function() {
      return d(e);
    };
    c.callback = function() {
      Li(a, b);
    };
  }
  var f2 = a.stateNode;
  null !== f2 && "function" === typeof f2.componentDidCatch && (c.callback = function() {
    Li(a, b);
    "function" !== typeof d && (null === Ri ? Ri = /* @__PURE__ */ new Set([this]) : Ri.add(this));
    var c2 = b.stack;
    this.componentDidCatch(b.value, { componentStack: null !== c2 ? c2 : "" });
  });
  return c;
}
function Si(a, b, c) {
  var d = a.pingCache;
  if (null === d) {
    d = a.pingCache = new Mi();
    var e = /* @__PURE__ */ new Set();
    d.set(b, e);
  } else e = d.get(b), void 0 === e && (e = /* @__PURE__ */ new Set(), d.set(b, e));
  e.has(c) || (e.add(c), a = Ti.bind(null, a, b, c), b.then(a, a));
}
function Ui(a) {
  do {
    var b;
    if (b = 13 === a.tag) b = a.memoizedState, b = null !== b ? null !== b.dehydrated ? true : false : true;
    if (b) return a;
    a = a.return;
  } while (null !== a);
  return null;
}
function Vi(a, b, c, d, e) {
  if (0 === (a.mode & 1)) return a === b ? a.flags |= 65536 : (a.flags |= 128, c.flags |= 131072, c.flags &= -52805, 1 === c.tag && (null === c.alternate ? c.tag = 17 : (b = mh(-1, 1), b.tag = 2, nh(c, b, 1))), c.lanes |= 1), a;
  a.flags |= 65536;
  a.lanes = e;
  return a;
}
var Wi = ua.ReactCurrentOwner, dh = false;
function Xi(a, b, c, d) {
  b.child = null === a ? Vg(b, null, c, d) : Ug(b, a.child, c, d);
}
function Yi(a, b, c, d, e) {
  c = c.render;
  var f2 = b.ref;
  ch(b, e);
  d = Nh(a, b, c, d, f2, e);
  c = Sh();
  if (null !== a && !dh) return b.updateQueue = a.updateQueue, b.flags &= -2053, a.lanes &= ~e, Zi(a, b, e);
  I && c && vg(b);
  b.flags |= 1;
  Xi(a, b, d, e);
  return b.child;
}
function $i(a, b, c, d, e) {
  if (null === a) {
    var f2 = c.type;
    if ("function" === typeof f2 && !aj(f2) && void 0 === f2.defaultProps && null === c.compare && void 0 === c.defaultProps) return b.tag = 15, b.type = f2, bj(a, b, f2, d, e);
    a = Rg(c.type, null, d, b, b.mode, e);
    a.ref = b.ref;
    a.return = b;
    return b.child = a;
  }
  f2 = a.child;
  if (0 === (a.lanes & e)) {
    var g = f2.memoizedProps;
    c = c.compare;
    c = null !== c ? c : Ie;
    if (c(g, d) && a.ref === b.ref) return Zi(a, b, e);
  }
  b.flags |= 1;
  a = Pg(f2, d);
  a.ref = b.ref;
  a.return = b;
  return b.child = a;
}
function bj(a, b, c, d, e) {
  if (null !== a) {
    var f2 = a.memoizedProps;
    if (Ie(f2, d) && a.ref === b.ref) if (dh = false, b.pendingProps = d = f2, 0 !== (a.lanes & e)) 0 !== (a.flags & 131072) && (dh = true);
    else return b.lanes = a.lanes, Zi(a, b, e);
  }
  return cj(a, b, c, d, e);
}
function dj(a, b, c) {
  var d = b.pendingProps, e = d.children, f2 = null !== a ? a.memoizedState : null;
  if ("hidden" === d.mode) if (0 === (b.mode & 1)) b.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, G(ej, fj), fj |= c;
  else {
    if (0 === (c & 1073741824)) return a = null !== f2 ? f2.baseLanes | c : c, b.lanes = b.childLanes = 1073741824, b.memoizedState = { baseLanes: a, cachePool: null, transitions: null }, b.updateQueue = null, G(ej, fj), fj |= a, null;
    b.memoizedState = { baseLanes: 0, cachePool: null, transitions: null };
    d = null !== f2 ? f2.baseLanes : c;
    G(ej, fj);
    fj |= d;
  }
  else null !== f2 ? (d = f2.baseLanes | c, b.memoizedState = null) : d = c, G(ej, fj), fj |= d;
  Xi(a, b, e, c);
  return b.child;
}
function gj(a, b) {
  var c = b.ref;
  if (null === a && null !== c || null !== a && a.ref !== c) b.flags |= 512, b.flags |= 2097152;
}
function cj(a, b, c, d, e) {
  var f2 = Zf(c) ? Xf : H$1.current;
  f2 = Yf(b, f2);
  ch(b, e);
  c = Nh(a, b, c, d, f2, e);
  d = Sh();
  if (null !== a && !dh) return b.updateQueue = a.updateQueue, b.flags &= -2053, a.lanes &= ~e, Zi(a, b, e);
  I && d && vg(b);
  b.flags |= 1;
  Xi(a, b, c, e);
  return b.child;
}
function hj(a, b, c, d, e) {
  if (Zf(c)) {
    var f2 = true;
    cg(b);
  } else f2 = false;
  ch(b, e);
  if (null === b.stateNode) ij(a, b), Gi(b, c, d), Ii(b, c, d, e), d = true;
  else if (null === a) {
    var g = b.stateNode, h2 = b.memoizedProps;
    g.props = h2;
    var k2 = g.context, l2 = c.contextType;
    "object" === typeof l2 && null !== l2 ? l2 = eh(l2) : (l2 = Zf(c) ? Xf : H$1.current, l2 = Yf(b, l2));
    var m2 = c.getDerivedStateFromProps, q2 = "function" === typeof m2 || "function" === typeof g.getSnapshotBeforeUpdate;
    q2 || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h2 !== d || k2 !== l2) && Hi(b, g, d, l2);
    jh = false;
    var r2 = b.memoizedState;
    g.state = r2;
    qh(b, d, g, e);
    k2 = b.memoizedState;
    h2 !== d || r2 !== k2 || Wf.current || jh ? ("function" === typeof m2 && (Di(b, c, m2, d), k2 = b.memoizedState), (h2 = jh || Fi(b, c, h2, d, r2, k2, l2)) ? (q2 || "function" !== typeof g.UNSAFE_componentWillMount && "function" !== typeof g.componentWillMount || ("function" === typeof g.componentWillMount && g.componentWillMount(), "function" === typeof g.UNSAFE_componentWillMount && g.UNSAFE_componentWillMount()), "function" === typeof g.componentDidMount && (b.flags |= 4194308)) : ("function" === typeof g.componentDidMount && (b.flags |= 4194308), b.memoizedProps = d, b.memoizedState = k2), g.props = d, g.state = k2, g.context = l2, d = h2) : ("function" === typeof g.componentDidMount && (b.flags |= 4194308), d = false);
  } else {
    g = b.stateNode;
    lh(a, b);
    h2 = b.memoizedProps;
    l2 = b.type === b.elementType ? h2 : Ci(b.type, h2);
    g.props = l2;
    q2 = b.pendingProps;
    r2 = g.context;
    k2 = c.contextType;
    "object" === typeof k2 && null !== k2 ? k2 = eh(k2) : (k2 = Zf(c) ? Xf : H$1.current, k2 = Yf(b, k2));
    var y2 = c.getDerivedStateFromProps;
    (m2 = "function" === typeof y2 || "function" === typeof g.getSnapshotBeforeUpdate) || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h2 !== q2 || r2 !== k2) && Hi(b, g, d, k2);
    jh = false;
    r2 = b.memoizedState;
    g.state = r2;
    qh(b, d, g, e);
    var n2 = b.memoizedState;
    h2 !== q2 || r2 !== n2 || Wf.current || jh ? ("function" === typeof y2 && (Di(b, c, y2, d), n2 = b.memoizedState), (l2 = jh || Fi(b, c, l2, d, r2, n2, k2) || false) ? (m2 || "function" !== typeof g.UNSAFE_componentWillUpdate && "function" !== typeof g.componentWillUpdate || ("function" === typeof g.componentWillUpdate && g.componentWillUpdate(d, n2, k2), "function" === typeof g.UNSAFE_componentWillUpdate && g.UNSAFE_componentWillUpdate(d, n2, k2)), "function" === typeof g.componentDidUpdate && (b.flags |= 4), "function" === typeof g.getSnapshotBeforeUpdate && (b.flags |= 1024)) : ("function" !== typeof g.componentDidUpdate || h2 === a.memoizedProps && r2 === a.memoizedState || (b.flags |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h2 === a.memoizedProps && r2 === a.memoizedState || (b.flags |= 1024), b.memoizedProps = d, b.memoizedState = n2), g.props = d, g.state = n2, g.context = k2, d = l2) : ("function" !== typeof g.componentDidUpdate || h2 === a.memoizedProps && r2 === a.memoizedState || (b.flags |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h2 === a.memoizedProps && r2 === a.memoizedState || (b.flags |= 1024), d = false);
  }
  return jj(a, b, c, d, f2, e);
}
function jj(a, b, c, d, e, f2) {
  gj(a, b);
  var g = 0 !== (b.flags & 128);
  if (!d && !g) return e && dg(b, c, false), Zi(a, b, f2);
  d = b.stateNode;
  Wi.current = b;
  var h2 = g && "function" !== typeof c.getDerivedStateFromError ? null : d.render();
  b.flags |= 1;
  null !== a && g ? (b.child = Ug(b, a.child, null, f2), b.child = Ug(b, null, h2, f2)) : Xi(a, b, h2, f2);
  b.memoizedState = d.state;
  e && dg(b, c, true);
  return b.child;
}
function kj(a) {
  var b = a.stateNode;
  b.pendingContext ? ag(a, b.pendingContext, b.pendingContext !== b.context) : b.context && ag(a, b.context, false);
  yh(a, b.containerInfo);
}
function lj(a, b, c, d, e) {
  Ig();
  Jg(e);
  b.flags |= 256;
  Xi(a, b, c, d);
  return b.child;
}
var mj = { dehydrated: null, treeContext: null, retryLane: 0 };
function nj(a) {
  return { baseLanes: a, cachePool: null, transitions: null };
}
function oj(a, b, c) {
  var d = b.pendingProps, e = L.current, f2 = false, g = 0 !== (b.flags & 128), h2;
  (h2 = g) || (h2 = null !== a && null === a.memoizedState ? false : 0 !== (e & 2));
  if (h2) f2 = true, b.flags &= -129;
  else if (null === a || null !== a.memoizedState) e |= 1;
  G(L, e & 1);
  if (null === a) {
    Eg(b);
    a = b.memoizedState;
    if (null !== a && (a = a.dehydrated, null !== a)) return 0 === (b.mode & 1) ? b.lanes = 1 : "$!" === a.data ? b.lanes = 8 : b.lanes = 1073741824, null;
    g = d.children;
    a = d.fallback;
    return f2 ? (d = b.mode, f2 = b.child, g = { mode: "hidden", children: g }, 0 === (d & 1) && null !== f2 ? (f2.childLanes = 0, f2.pendingProps = g) : f2 = pj(g, d, 0, null), a = Tg(a, d, c, null), f2.return = b, a.return = b, f2.sibling = a, b.child = f2, b.child.memoizedState = nj(c), b.memoizedState = mj, a) : qj(b, g);
  }
  e = a.memoizedState;
  if (null !== e && (h2 = e.dehydrated, null !== h2)) return rj(a, b, g, d, h2, e, c);
  if (f2) {
    f2 = d.fallback;
    g = b.mode;
    e = a.child;
    h2 = e.sibling;
    var k2 = { mode: "hidden", children: d.children };
    0 === (g & 1) && b.child !== e ? (d = b.child, d.childLanes = 0, d.pendingProps = k2, b.deletions = null) : (d = Pg(e, k2), d.subtreeFlags = e.subtreeFlags & 14680064);
    null !== h2 ? f2 = Pg(h2, f2) : (f2 = Tg(f2, g, c, null), f2.flags |= 2);
    f2.return = b;
    d.return = b;
    d.sibling = f2;
    b.child = d;
    d = f2;
    f2 = b.child;
    g = a.child.memoizedState;
    g = null === g ? nj(c) : { baseLanes: g.baseLanes | c, cachePool: null, transitions: g.transitions };
    f2.memoizedState = g;
    f2.childLanes = a.childLanes & ~c;
    b.memoizedState = mj;
    return d;
  }
  f2 = a.child;
  a = f2.sibling;
  d = Pg(f2, { mode: "visible", children: d.children });
  0 === (b.mode & 1) && (d.lanes = c);
  d.return = b;
  d.sibling = null;
  null !== a && (c = b.deletions, null === c ? (b.deletions = [a], b.flags |= 16) : c.push(a));
  b.child = d;
  b.memoizedState = null;
  return d;
}
function qj(a, b) {
  b = pj({ mode: "visible", children: b }, a.mode, 0, null);
  b.return = a;
  return a.child = b;
}
function sj(a, b, c, d) {
  null !== d && Jg(d);
  Ug(b, a.child, null, c);
  a = qj(b, b.pendingProps.children);
  a.flags |= 2;
  b.memoizedState = null;
  return a;
}
function rj(a, b, c, d, e, f2, g) {
  if (c) {
    if (b.flags & 256) return b.flags &= -257, d = Ki(Error(p(422))), sj(a, b, g, d);
    if (null !== b.memoizedState) return b.child = a.child, b.flags |= 128, null;
    f2 = d.fallback;
    e = b.mode;
    d = pj({ mode: "visible", children: d.children }, e, 0, null);
    f2 = Tg(f2, e, g, null);
    f2.flags |= 2;
    d.return = b;
    f2.return = b;
    d.sibling = f2;
    b.child = d;
    0 !== (b.mode & 1) && Ug(b, a.child, null, g);
    b.child.memoizedState = nj(g);
    b.memoizedState = mj;
    return f2;
  }
  if (0 === (b.mode & 1)) return sj(a, b, g, null);
  if ("$!" === e.data) {
    d = e.nextSibling && e.nextSibling.dataset;
    if (d) var h2 = d.dgst;
    d = h2;
    f2 = Error(p(419));
    d = Ki(f2, d, void 0);
    return sj(a, b, g, d);
  }
  h2 = 0 !== (g & a.childLanes);
  if (dh || h2) {
    d = Q;
    if (null !== d) {
      switch (g & -g) {
        case 4:
          e = 2;
          break;
        case 16:
          e = 8;
          break;
        case 64:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
        case 67108864:
          e = 32;
          break;
        case 536870912:
          e = 268435456;
          break;
        default:
          e = 0;
      }
      e = 0 !== (e & (d.suspendedLanes | g)) ? 0 : e;
      0 !== e && e !== f2.retryLane && (f2.retryLane = e, ih(a, e), gi(d, a, e, -1));
    }
    tj();
    d = Ki(Error(p(421)));
    return sj(a, b, g, d);
  }
  if ("$?" === e.data) return b.flags |= 128, b.child = a.child, b = uj.bind(null, a), e._reactRetry = b, null;
  a = f2.treeContext;
  yg = Lf(e.nextSibling);
  xg = b;
  I = true;
  zg = null;
  null !== a && (og[pg++] = rg, og[pg++] = sg, og[pg++] = qg, rg = a.id, sg = a.overflow, qg = b);
  b = qj(b, d.children);
  b.flags |= 4096;
  return b;
}
function vj(a, b, c) {
  a.lanes |= b;
  var d = a.alternate;
  null !== d && (d.lanes |= b);
  bh(a.return, b, c);
}
function wj(a, b, c, d, e) {
  var f2 = a.memoizedState;
  null === f2 ? a.memoizedState = { isBackwards: b, rendering: null, renderingStartTime: 0, last: d, tail: c, tailMode: e } : (f2.isBackwards = b, f2.rendering = null, f2.renderingStartTime = 0, f2.last = d, f2.tail = c, f2.tailMode = e);
}
function xj(a, b, c) {
  var d = b.pendingProps, e = d.revealOrder, f2 = d.tail;
  Xi(a, b, d.children, c);
  d = L.current;
  if (0 !== (d & 2)) d = d & 1 | 2, b.flags |= 128;
  else {
    if (null !== a && 0 !== (a.flags & 128)) a: for (a = b.child; null !== a; ) {
      if (13 === a.tag) null !== a.memoizedState && vj(a, c, b);
      else if (19 === a.tag) vj(a, c, b);
      else if (null !== a.child) {
        a.child.return = a;
        a = a.child;
        continue;
      }
      if (a === b) break a;
      for (; null === a.sibling; ) {
        if (null === a.return || a.return === b) break a;
        a = a.return;
      }
      a.sibling.return = a.return;
      a = a.sibling;
    }
    d &= 1;
  }
  G(L, d);
  if (0 === (b.mode & 1)) b.memoizedState = null;
  else switch (e) {
    case "forwards":
      c = b.child;
      for (e = null; null !== c; ) a = c.alternate, null !== a && null === Ch(a) && (e = c), c = c.sibling;
      c = e;
      null === c ? (e = b.child, b.child = null) : (e = c.sibling, c.sibling = null);
      wj(b, false, e, c, f2);
      break;
    case "backwards":
      c = null;
      e = b.child;
      for (b.child = null; null !== e; ) {
        a = e.alternate;
        if (null !== a && null === Ch(a)) {
          b.child = e;
          break;
        }
        a = e.sibling;
        e.sibling = c;
        c = e;
        e = a;
      }
      wj(b, true, c, null, f2);
      break;
    case "together":
      wj(b, false, null, null, void 0);
      break;
    default:
      b.memoizedState = null;
  }
  return b.child;
}
function ij(a, b) {
  0 === (b.mode & 1) && null !== a && (a.alternate = null, b.alternate = null, b.flags |= 2);
}
function Zi(a, b, c) {
  null !== a && (b.dependencies = a.dependencies);
  rh |= b.lanes;
  if (0 === (c & b.childLanes)) return null;
  if (null !== a && b.child !== a.child) throw Error(p(153));
  if (null !== b.child) {
    a = b.child;
    c = Pg(a, a.pendingProps);
    b.child = c;
    for (c.return = b; null !== a.sibling; ) a = a.sibling, c = c.sibling = Pg(a, a.pendingProps), c.return = b;
    c.sibling = null;
  }
  return b.child;
}
function yj(a, b, c) {
  switch (b.tag) {
    case 3:
      kj(b);
      Ig();
      break;
    case 5:
      Ah(b);
      break;
    case 1:
      Zf(b.type) && cg(b);
      break;
    case 4:
      yh(b, b.stateNode.containerInfo);
      break;
    case 10:
      var d = b.type._context, e = b.memoizedProps.value;
      G(Wg, d._currentValue);
      d._currentValue = e;
      break;
    case 13:
      d = b.memoizedState;
      if (null !== d) {
        if (null !== d.dehydrated) return G(L, L.current & 1), b.flags |= 128, null;
        if (0 !== (c & b.child.childLanes)) return oj(a, b, c);
        G(L, L.current & 1);
        a = Zi(a, b, c);
        return null !== a ? a.sibling : null;
      }
      G(L, L.current & 1);
      break;
    case 19:
      d = 0 !== (c & b.childLanes);
      if (0 !== (a.flags & 128)) {
        if (d) return xj(a, b, c);
        b.flags |= 128;
      }
      e = b.memoizedState;
      null !== e && (e.rendering = null, e.tail = null, e.lastEffect = null);
      G(L, L.current);
      if (d) break;
      else return null;
    case 22:
    case 23:
      return b.lanes = 0, dj(a, b, c);
  }
  return Zi(a, b, c);
}
var zj, Aj, Bj, Cj;
zj = function(a, b) {
  for (var c = b.child; null !== c; ) {
    if (5 === c.tag || 6 === c.tag) a.appendChild(c.stateNode);
    else if (4 !== c.tag && null !== c.child) {
      c.child.return = c;
      c = c.child;
      continue;
    }
    if (c === b) break;
    for (; null === c.sibling; ) {
      if (null === c.return || c.return === b) return;
      c = c.return;
    }
    c.sibling.return = c.return;
    c = c.sibling;
  }
};
Aj = function() {
};
Bj = function(a, b, c, d) {
  var e = a.memoizedProps;
  if (e !== d) {
    a = b.stateNode;
    xh(uh.current);
    var f2 = null;
    switch (c) {
      case "input":
        e = Ya(a, e);
        d = Ya(a, d);
        f2 = [];
        break;
      case "select":
        e = A({}, e, { value: void 0 });
        d = A({}, d, { value: void 0 });
        f2 = [];
        break;
      case "textarea":
        e = gb(a, e);
        d = gb(a, d);
        f2 = [];
        break;
      default:
        "function" !== typeof e.onClick && "function" === typeof d.onClick && (a.onclick = Bf);
    }
    ub(c, d);
    var g;
    c = null;
    for (l2 in e) if (!d.hasOwnProperty(l2) && e.hasOwnProperty(l2) && null != e[l2]) if ("style" === l2) {
      var h2 = e[l2];
      for (g in h2) h2.hasOwnProperty(g) && (c || (c = {}), c[g] = "");
    } else "dangerouslySetInnerHTML" !== l2 && "children" !== l2 && "suppressContentEditableWarning" !== l2 && "suppressHydrationWarning" !== l2 && "autoFocus" !== l2 && (ea.hasOwnProperty(l2) ? f2 || (f2 = []) : (f2 = f2 || []).push(l2, null));
    for (l2 in d) {
      var k2 = d[l2];
      h2 = null != e ? e[l2] : void 0;
      if (d.hasOwnProperty(l2) && k2 !== h2 && (null != k2 || null != h2)) if ("style" === l2) if (h2) {
        for (g in h2) !h2.hasOwnProperty(g) || k2 && k2.hasOwnProperty(g) || (c || (c = {}), c[g] = "");
        for (g in k2) k2.hasOwnProperty(g) && h2[g] !== k2[g] && (c || (c = {}), c[g] = k2[g]);
      } else c || (f2 || (f2 = []), f2.push(
        l2,
        c
      )), c = k2;
      else "dangerouslySetInnerHTML" === l2 ? (k2 = k2 ? k2.__html : void 0, h2 = h2 ? h2.__html : void 0, null != k2 && h2 !== k2 && (f2 = f2 || []).push(l2, k2)) : "children" === l2 ? "string" !== typeof k2 && "number" !== typeof k2 || (f2 = f2 || []).push(l2, "" + k2) : "suppressContentEditableWarning" !== l2 && "suppressHydrationWarning" !== l2 && (ea.hasOwnProperty(l2) ? (null != k2 && "onScroll" === l2 && D$1("scroll", a), f2 || h2 === k2 || (f2 = [])) : (f2 = f2 || []).push(l2, k2));
    }
    c && (f2 = f2 || []).push("style", c);
    var l2 = f2;
    if (b.updateQueue = l2) b.flags |= 4;
  }
};
Cj = function(a, b, c, d) {
  c !== d && (b.flags |= 4);
};
function Dj(a, b) {
  if (!I) switch (a.tailMode) {
    case "hidden":
      b = a.tail;
      for (var c = null; null !== b; ) null !== b.alternate && (c = b), b = b.sibling;
      null === c ? a.tail = null : c.sibling = null;
      break;
    case "collapsed":
      c = a.tail;
      for (var d = null; null !== c; ) null !== c.alternate && (d = c), c = c.sibling;
      null === d ? b || null === a.tail ? a.tail = null : a.tail.sibling = null : d.sibling = null;
  }
}
function S(a) {
  var b = null !== a.alternate && a.alternate.child === a.child, c = 0, d = 0;
  if (b) for (var e = a.child; null !== e; ) c |= e.lanes | e.childLanes, d |= e.subtreeFlags & 14680064, d |= e.flags & 14680064, e.return = a, e = e.sibling;
  else for (e = a.child; null !== e; ) c |= e.lanes | e.childLanes, d |= e.subtreeFlags, d |= e.flags, e.return = a, e = e.sibling;
  a.subtreeFlags |= d;
  a.childLanes = c;
  return b;
}
function Ej(a, b, c) {
  var d = b.pendingProps;
  wg(b);
  switch (b.tag) {
    case 2:
    case 16:
    case 15:
    case 0:
    case 11:
    case 7:
    case 8:
    case 12:
    case 9:
    case 14:
      return S(b), null;
    case 1:
      return Zf(b.type) && $f(), S(b), null;
    case 3:
      d = b.stateNode;
      zh();
      E(Wf);
      E(H$1);
      Eh();
      d.pendingContext && (d.context = d.pendingContext, d.pendingContext = null);
      if (null === a || null === a.child) Gg(b) ? b.flags |= 4 : null === a || a.memoizedState.isDehydrated && 0 === (b.flags & 256) || (b.flags |= 1024, null !== zg && (Fj(zg), zg = null));
      Aj(a, b);
      S(b);
      return null;
    case 5:
      Bh(b);
      var e = xh(wh.current);
      c = b.type;
      if (null !== a && null != b.stateNode) Bj(a, b, c, d, e), a.ref !== b.ref && (b.flags |= 512, b.flags |= 2097152);
      else {
        if (!d) {
          if (null === b.stateNode) throw Error(p(166));
          S(b);
          return null;
        }
        a = xh(uh.current);
        if (Gg(b)) {
          d = b.stateNode;
          c = b.type;
          var f2 = b.memoizedProps;
          d[Of] = b;
          d[Pf] = f2;
          a = 0 !== (b.mode & 1);
          switch (c) {
            case "dialog":
              D$1("cancel", d);
              D$1("close", d);
              break;
            case "iframe":
            case "object":
            case "embed":
              D$1("load", d);
              break;
            case "video":
            case "audio":
              for (e = 0; e < lf.length; e++) D$1(lf[e], d);
              break;
            case "source":
              D$1("error", d);
              break;
            case "img":
            case "image":
            case "link":
              D$1(
                "error",
                d
              );
              D$1("load", d);
              break;
            case "details":
              D$1("toggle", d);
              break;
            case "input":
              Za(d, f2);
              D$1("invalid", d);
              break;
            case "select":
              d._wrapperState = { wasMultiple: !!f2.multiple };
              D$1("invalid", d);
              break;
            case "textarea":
              hb(d, f2), D$1("invalid", d);
          }
          ub(c, f2);
          e = null;
          for (var g in f2) if (f2.hasOwnProperty(g)) {
            var h2 = f2[g];
            "children" === g ? "string" === typeof h2 ? d.textContent !== h2 && (true !== f2.suppressHydrationWarning && Af(d.textContent, h2, a), e = ["children", h2]) : "number" === typeof h2 && d.textContent !== "" + h2 && (true !== f2.suppressHydrationWarning && Af(
              d.textContent,
              h2,
              a
            ), e = ["children", "" + h2]) : ea.hasOwnProperty(g) && null != h2 && "onScroll" === g && D$1("scroll", d);
          }
          switch (c) {
            case "input":
              Va(d);
              db(d, f2, true);
              break;
            case "textarea":
              Va(d);
              jb(d);
              break;
            case "select":
            case "option":
              break;
            default:
              "function" === typeof f2.onClick && (d.onclick = Bf);
          }
          d = e;
          b.updateQueue = d;
          null !== d && (b.flags |= 4);
        } else {
          g = 9 === e.nodeType ? e : e.ownerDocument;
          "http://www.w3.org/1999/xhtml" === a && (a = kb(c));
          "http://www.w3.org/1999/xhtml" === a ? "script" === c ? (a = g.createElement("div"), a.innerHTML = "<script><\/script>", a = a.removeChild(a.firstChild)) : "string" === typeof d.is ? a = g.createElement(c, { is: d.is }) : (a = g.createElement(c), "select" === c && (g = a, d.multiple ? g.multiple = true : d.size && (g.size = d.size))) : a = g.createElementNS(a, c);
          a[Of] = b;
          a[Pf] = d;
          zj(a, b, false, false);
          b.stateNode = a;
          a: {
            g = vb(c, d);
            switch (c) {
              case "dialog":
                D$1("cancel", a);
                D$1("close", a);
                e = d;
                break;
              case "iframe":
              case "object":
              case "embed":
                D$1("load", a);
                e = d;
                break;
              case "video":
              case "audio":
                for (e = 0; e < lf.length; e++) D$1(lf[e], a);
                e = d;
                break;
              case "source":
                D$1("error", a);
                e = d;
                break;
              case "img":
              case "image":
              case "link":
                D$1(
                  "error",
                  a
                );
                D$1("load", a);
                e = d;
                break;
              case "details":
                D$1("toggle", a);
                e = d;
                break;
              case "input":
                Za(a, d);
                e = Ya(a, d);
                D$1("invalid", a);
                break;
              case "option":
                e = d;
                break;
              case "select":
                a._wrapperState = { wasMultiple: !!d.multiple };
                e = A({}, d, { value: void 0 });
                D$1("invalid", a);
                break;
              case "textarea":
                hb(a, d);
                e = gb(a, d);
                D$1("invalid", a);
                break;
              default:
                e = d;
            }
            ub(c, e);
            h2 = e;
            for (f2 in h2) if (h2.hasOwnProperty(f2)) {
              var k2 = h2[f2];
              "style" === f2 ? sb(a, k2) : "dangerouslySetInnerHTML" === f2 ? (k2 = k2 ? k2.__html : void 0, null != k2 && nb(a, k2)) : "children" === f2 ? "string" === typeof k2 ? ("textarea" !== c || "" !== k2) && ob(a, k2) : "number" === typeof k2 && ob(a, "" + k2) : "suppressContentEditableWarning" !== f2 && "suppressHydrationWarning" !== f2 && "autoFocus" !== f2 && (ea.hasOwnProperty(f2) ? null != k2 && "onScroll" === f2 && D$1("scroll", a) : null != k2 && ta(a, f2, k2, g));
            }
            switch (c) {
              case "input":
                Va(a);
                db(a, d, false);
                break;
              case "textarea":
                Va(a);
                jb(a);
                break;
              case "option":
                null != d.value && a.setAttribute("value", "" + Sa(d.value));
                break;
              case "select":
                a.multiple = !!d.multiple;
                f2 = d.value;
                null != f2 ? fb(a, !!d.multiple, f2, false) : null != d.defaultValue && fb(
                  a,
                  !!d.multiple,
                  d.defaultValue,
                  true
                );
                break;
              default:
                "function" === typeof e.onClick && (a.onclick = Bf);
            }
            switch (c) {
              case "button":
              case "input":
              case "select":
              case "textarea":
                d = !!d.autoFocus;
                break a;
              case "img":
                d = true;
                break a;
              default:
                d = false;
            }
          }
          d && (b.flags |= 4);
        }
        null !== b.ref && (b.flags |= 512, b.flags |= 2097152);
      }
      S(b);
      return null;
    case 6:
      if (a && null != b.stateNode) Cj(a, b, a.memoizedProps, d);
      else {
        if ("string" !== typeof d && null === b.stateNode) throw Error(p(166));
        c = xh(wh.current);
        xh(uh.current);
        if (Gg(b)) {
          d = b.stateNode;
          c = b.memoizedProps;
          d[Of] = b;
          if (f2 = d.nodeValue !== c) {
            if (a = xg, null !== a) switch (a.tag) {
              case 3:
                Af(d.nodeValue, c, 0 !== (a.mode & 1));
                break;
              case 5:
                true !== a.memoizedProps.suppressHydrationWarning && Af(d.nodeValue, c, 0 !== (a.mode & 1));
            }
          }
          f2 && (b.flags |= 4);
        } else d = (9 === c.nodeType ? c : c.ownerDocument).createTextNode(d), d[Of] = b, b.stateNode = d;
      }
      S(b);
      return null;
    case 13:
      E(L);
      d = b.memoizedState;
      if (null === a || null !== a.memoizedState && null !== a.memoizedState.dehydrated) {
        if (I && null !== yg && 0 !== (b.mode & 1) && 0 === (b.flags & 128)) Hg(), Ig(), b.flags |= 98560, f2 = false;
        else if (f2 = Gg(b), null !== d && null !== d.dehydrated) {
          if (null === a) {
            if (!f2) throw Error(p(318));
            f2 = b.memoizedState;
            f2 = null !== f2 ? f2.dehydrated : null;
            if (!f2) throw Error(p(317));
            f2[Of] = b;
          } else Ig(), 0 === (b.flags & 128) && (b.memoizedState = null), b.flags |= 4;
          S(b);
          f2 = false;
        } else null !== zg && (Fj(zg), zg = null), f2 = true;
        if (!f2) return b.flags & 65536 ? b : null;
      }
      if (0 !== (b.flags & 128)) return b.lanes = c, b;
      d = null !== d;
      d !== (null !== a && null !== a.memoizedState) && d && (b.child.flags |= 8192, 0 !== (b.mode & 1) && (null === a || 0 !== (L.current & 1) ? 0 === T && (T = 3) : tj()));
      null !== b.updateQueue && (b.flags |= 4);
      S(b);
      return null;
    case 4:
      return zh(), Aj(a, b), null === a && sf(b.stateNode.containerInfo), S(b), null;
    case 10:
      return ah(b.type._context), S(b), null;
    case 17:
      return Zf(b.type) && $f(), S(b), null;
    case 19:
      E(L);
      f2 = b.memoizedState;
      if (null === f2) return S(b), null;
      d = 0 !== (b.flags & 128);
      g = f2.rendering;
      if (null === g) if (d) Dj(f2, false);
      else {
        if (0 !== T || null !== a && 0 !== (a.flags & 128)) for (a = b.child; null !== a; ) {
          g = Ch(a);
          if (null !== g) {
            b.flags |= 128;
            Dj(f2, false);
            d = g.updateQueue;
            null !== d && (b.updateQueue = d, b.flags |= 4);
            b.subtreeFlags = 0;
            d = c;
            for (c = b.child; null !== c; ) f2 = c, a = d, f2.flags &= 14680066, g = f2.alternate, null === g ? (f2.childLanes = 0, f2.lanes = a, f2.child = null, f2.subtreeFlags = 0, f2.memoizedProps = null, f2.memoizedState = null, f2.updateQueue = null, f2.dependencies = null, f2.stateNode = null) : (f2.childLanes = g.childLanes, f2.lanes = g.lanes, f2.child = g.child, f2.subtreeFlags = 0, f2.deletions = null, f2.memoizedProps = g.memoizedProps, f2.memoizedState = g.memoizedState, f2.updateQueue = g.updateQueue, f2.type = g.type, a = g.dependencies, f2.dependencies = null === a ? null : { lanes: a.lanes, firstContext: a.firstContext }), c = c.sibling;
            G(L, L.current & 1 | 2);
            return b.child;
          }
          a = a.sibling;
        }
        null !== f2.tail && B() > Gj && (b.flags |= 128, d = true, Dj(f2, false), b.lanes = 4194304);
      }
      else {
        if (!d) if (a = Ch(g), null !== a) {
          if (b.flags |= 128, d = true, c = a.updateQueue, null !== c && (b.updateQueue = c, b.flags |= 4), Dj(f2, true), null === f2.tail && "hidden" === f2.tailMode && !g.alternate && !I) return S(b), null;
        } else 2 * B() - f2.renderingStartTime > Gj && 1073741824 !== c && (b.flags |= 128, d = true, Dj(f2, false), b.lanes = 4194304);
        f2.isBackwards ? (g.sibling = b.child, b.child = g) : (c = f2.last, null !== c ? c.sibling = g : b.child = g, f2.last = g);
      }
      if (null !== f2.tail) return b = f2.tail, f2.rendering = b, f2.tail = b.sibling, f2.renderingStartTime = B(), b.sibling = null, c = L.current, G(L, d ? c & 1 | 2 : c & 1), b;
      S(b);
      return null;
    case 22:
    case 23:
      return Hj(), d = null !== b.memoizedState, null !== a && null !== a.memoizedState !== d && (b.flags |= 8192), d && 0 !== (b.mode & 1) ? 0 !== (fj & 1073741824) && (S(b), b.subtreeFlags & 6 && (b.flags |= 8192)) : S(b), null;
    case 24:
      return null;
    case 25:
      return null;
  }
  throw Error(p(156, b.tag));
}
function Ij(a, b) {
  wg(b);
  switch (b.tag) {
    case 1:
      return Zf(b.type) && $f(), a = b.flags, a & 65536 ? (b.flags = a & -65537 | 128, b) : null;
    case 3:
      return zh(), E(Wf), E(H$1), Eh(), a = b.flags, 0 !== (a & 65536) && 0 === (a & 128) ? (b.flags = a & -65537 | 128, b) : null;
    case 5:
      return Bh(b), null;
    case 13:
      E(L);
      a = b.memoizedState;
      if (null !== a && null !== a.dehydrated) {
        if (null === b.alternate) throw Error(p(340));
        Ig();
      }
      a = b.flags;
      return a & 65536 ? (b.flags = a & -65537 | 128, b) : null;
    case 19:
      return E(L), null;
    case 4:
      return zh(), null;
    case 10:
      return ah(b.type._context), null;
    case 22:
    case 23:
      return Hj(), null;
    case 24:
      return null;
    default:
      return null;
  }
}
var Jj = false, U = false, Kj = "function" === typeof WeakSet ? WeakSet : Set, V = null;
function Lj(a, b) {
  var c = a.ref;
  if (null !== c) if ("function" === typeof c) try {
    c(null);
  } catch (d) {
    W(a, b, d);
  }
  else c.current = null;
}
function Mj(a, b, c) {
  try {
    c();
  } catch (d) {
    W(a, b, d);
  }
}
var Nj = false;
function Oj(a, b) {
  Cf = dd;
  a = Me$1();
  if (Ne(a)) {
    if ("selectionStart" in a) var c = { start: a.selectionStart, end: a.selectionEnd };
    else a: {
      c = (c = a.ownerDocument) && c.defaultView || window;
      var d = c.getSelection && c.getSelection();
      if (d && 0 !== d.rangeCount) {
        c = d.anchorNode;
        var e = d.anchorOffset, f2 = d.focusNode;
        d = d.focusOffset;
        try {
          c.nodeType, f2.nodeType;
        } catch (F2) {
          c = null;
          break a;
        }
        var g = 0, h2 = -1, k2 = -1, l2 = 0, m2 = 0, q2 = a, r2 = null;
        b: for (; ; ) {
          for (var y2; ; ) {
            q2 !== c || 0 !== e && 3 !== q2.nodeType || (h2 = g + e);
            q2 !== f2 || 0 !== d && 3 !== q2.nodeType || (k2 = g + d);
            3 === q2.nodeType && (g += q2.nodeValue.length);
            if (null === (y2 = q2.firstChild)) break;
            r2 = q2;
            q2 = y2;
          }
          for (; ; ) {
            if (q2 === a) break b;
            r2 === c && ++l2 === e && (h2 = g);
            r2 === f2 && ++m2 === d && (k2 = g);
            if (null !== (y2 = q2.nextSibling)) break;
            q2 = r2;
            r2 = q2.parentNode;
          }
          q2 = y2;
        }
        c = -1 === h2 || -1 === k2 ? null : { start: h2, end: k2 };
      } else c = null;
    }
    c = c || { start: 0, end: 0 };
  } else c = null;
  Df = { focusedElem: a, selectionRange: c };
  dd = false;
  for (V = b; null !== V; ) if (b = V, a = b.child, 0 !== (b.subtreeFlags & 1028) && null !== a) a.return = b, V = a;
  else for (; null !== V; ) {
    b = V;
    try {
      var n2 = b.alternate;
      if (0 !== (b.flags & 1024)) switch (b.tag) {
        case 0:
        case 11:
        case 15:
          break;
        case 1:
          if (null !== n2) {
            var t2 = n2.memoizedProps, J2 = n2.memoizedState, x2 = b.stateNode, w2 = x2.getSnapshotBeforeUpdate(b.elementType === b.type ? t2 : Ci(b.type, t2), J2);
            x2.__reactInternalSnapshotBeforeUpdate = w2;
          }
          break;
        case 3:
          var u2 = b.stateNode.containerInfo;
          1 === u2.nodeType ? u2.textContent = "" : 9 === u2.nodeType && u2.documentElement && u2.removeChild(u2.documentElement);
          break;
        case 5:
        case 6:
        case 4:
        case 17:
          break;
        default:
          throw Error(p(163));
      }
    } catch (F2) {
      W(b, b.return, F2);
    }
    a = b.sibling;
    if (null !== a) {
      a.return = b.return;
      V = a;
      break;
    }
    V = b.return;
  }
  n2 = Nj;
  Nj = false;
  return n2;
}
function Pj(a, b, c) {
  var d = b.updateQueue;
  d = null !== d ? d.lastEffect : null;
  if (null !== d) {
    var e = d = d.next;
    do {
      if ((e.tag & a) === a) {
        var f2 = e.destroy;
        e.destroy = void 0;
        void 0 !== f2 && Mj(b, c, f2);
      }
      e = e.next;
    } while (e !== d);
  }
}
function Qj(a, b) {
  b = b.updateQueue;
  b = null !== b ? b.lastEffect : null;
  if (null !== b) {
    var c = b = b.next;
    do {
      if ((c.tag & a) === a) {
        var d = c.create;
        c.destroy = d();
      }
      c = c.next;
    } while (c !== b);
  }
}
function Rj(a) {
  var b = a.ref;
  if (null !== b) {
    var c = a.stateNode;
    switch (a.tag) {
      case 5:
        a = c;
        break;
      default:
        a = c;
    }
    "function" === typeof b ? b(a) : b.current = a;
  }
}
function Sj(a) {
  var b = a.alternate;
  null !== b && (a.alternate = null, Sj(b));
  a.child = null;
  a.deletions = null;
  a.sibling = null;
  5 === a.tag && (b = a.stateNode, null !== b && (delete b[Of], delete b[Pf], delete b[of], delete b[Qf], delete b[Rf]));
  a.stateNode = null;
  a.return = null;
  a.dependencies = null;
  a.memoizedProps = null;
  a.memoizedState = null;
  a.pendingProps = null;
  a.stateNode = null;
  a.updateQueue = null;
}
function Tj(a) {
  return 5 === a.tag || 3 === a.tag || 4 === a.tag;
}
function Uj(a) {
  a: for (; ; ) {
    for (; null === a.sibling; ) {
      if (null === a.return || Tj(a.return)) return null;
      a = a.return;
    }
    a.sibling.return = a.return;
    for (a = a.sibling; 5 !== a.tag && 6 !== a.tag && 18 !== a.tag; ) {
      if (a.flags & 2) continue a;
      if (null === a.child || 4 === a.tag) continue a;
      else a.child.return = a, a = a.child;
    }
    if (!(a.flags & 2)) return a.stateNode;
  }
}
function Vj(a, b, c) {
  var d = a.tag;
  if (5 === d || 6 === d) a = a.stateNode, b ? 8 === c.nodeType ? c.parentNode.insertBefore(a, b) : c.insertBefore(a, b) : (8 === c.nodeType ? (b = c.parentNode, b.insertBefore(a, c)) : (b = c, b.appendChild(a)), c = c._reactRootContainer, null !== c && void 0 !== c || null !== b.onclick || (b.onclick = Bf));
  else if (4 !== d && (a = a.child, null !== a)) for (Vj(a, b, c), a = a.sibling; null !== a; ) Vj(a, b, c), a = a.sibling;
}
function Wj(a, b, c) {
  var d = a.tag;
  if (5 === d || 6 === d) a = a.stateNode, b ? c.insertBefore(a, b) : c.appendChild(a);
  else if (4 !== d && (a = a.child, null !== a)) for (Wj(a, b, c), a = a.sibling; null !== a; ) Wj(a, b, c), a = a.sibling;
}
var X = null, Xj = false;
function Yj(a, b, c) {
  for (c = c.child; null !== c; ) Zj(a, b, c), c = c.sibling;
}
function Zj(a, b, c) {
  if (lc && "function" === typeof lc.onCommitFiberUnmount) try {
    lc.onCommitFiberUnmount(kc, c);
  } catch (h2) {
  }
  switch (c.tag) {
    case 5:
      U || Lj(c, b);
    case 6:
      var d = X, e = Xj;
      X = null;
      Yj(a, b, c);
      X = d;
      Xj = e;
      null !== X && (Xj ? (a = X, c = c.stateNode, 8 === a.nodeType ? a.parentNode.removeChild(c) : a.removeChild(c)) : X.removeChild(c.stateNode));
      break;
    case 18:
      null !== X && (Xj ? (a = X, c = c.stateNode, 8 === a.nodeType ? Kf(a.parentNode, c) : 1 === a.nodeType && Kf(a, c), bd(a)) : Kf(X, c.stateNode));
      break;
    case 4:
      d = X;
      e = Xj;
      X = c.stateNode.containerInfo;
      Xj = true;
      Yj(a, b, c);
      X = d;
      Xj = e;
      break;
    case 0:
    case 11:
    case 14:
    case 15:
      if (!U && (d = c.updateQueue, null !== d && (d = d.lastEffect, null !== d))) {
        e = d = d.next;
        do {
          var f2 = e, g = f2.destroy;
          f2 = f2.tag;
          void 0 !== g && (0 !== (f2 & 2) ? Mj(c, b, g) : 0 !== (f2 & 4) && Mj(c, b, g));
          e = e.next;
        } while (e !== d);
      }
      Yj(a, b, c);
      break;
    case 1:
      if (!U && (Lj(c, b), d = c.stateNode, "function" === typeof d.componentWillUnmount)) try {
        d.props = c.memoizedProps, d.state = c.memoizedState, d.componentWillUnmount();
      } catch (h2) {
        W(c, b, h2);
      }
      Yj(a, b, c);
      break;
    case 21:
      Yj(a, b, c);
      break;
    case 22:
      c.mode & 1 ? (U = (d = U) || null !== c.memoizedState, Yj(a, b, c), U = d) : Yj(a, b, c);
      break;
    default:
      Yj(a, b, c);
  }
}
function ak(a) {
  var b = a.updateQueue;
  if (null !== b) {
    a.updateQueue = null;
    var c = a.stateNode;
    null === c && (c = a.stateNode = new Kj());
    b.forEach(function(b2) {
      var d = bk.bind(null, a, b2);
      c.has(b2) || (c.add(b2), b2.then(d, d));
    });
  }
}
function ck(a, b) {
  var c = b.deletions;
  if (null !== c) for (var d = 0; d < c.length; d++) {
    var e = c[d];
    try {
      var f2 = a, g = b, h2 = g;
      a: for (; null !== h2; ) {
        switch (h2.tag) {
          case 5:
            X = h2.stateNode;
            Xj = false;
            break a;
          case 3:
            X = h2.stateNode.containerInfo;
            Xj = true;
            break a;
          case 4:
            X = h2.stateNode.containerInfo;
            Xj = true;
            break a;
        }
        h2 = h2.return;
      }
      if (null === X) throw Error(p(160));
      Zj(f2, g, e);
      X = null;
      Xj = false;
      var k2 = e.alternate;
      null !== k2 && (k2.return = null);
      e.return = null;
    } catch (l2) {
      W(e, b, l2);
    }
  }
  if (b.subtreeFlags & 12854) for (b = b.child; null !== b; ) dk(b, a), b = b.sibling;
}
function dk(a, b) {
  var c = a.alternate, d = a.flags;
  switch (a.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      ck(b, a);
      ek(a);
      if (d & 4) {
        try {
          Pj(3, a, a.return), Qj(3, a);
        } catch (t2) {
          W(a, a.return, t2);
        }
        try {
          Pj(5, a, a.return);
        } catch (t2) {
          W(a, a.return, t2);
        }
      }
      break;
    case 1:
      ck(b, a);
      ek(a);
      d & 512 && null !== c && Lj(c, c.return);
      break;
    case 5:
      ck(b, a);
      ek(a);
      d & 512 && null !== c && Lj(c, c.return);
      if (a.flags & 32) {
        var e = a.stateNode;
        try {
          ob(e, "");
        } catch (t2) {
          W(a, a.return, t2);
        }
      }
      if (d & 4 && (e = a.stateNode, null != e)) {
        var f2 = a.memoizedProps, g = null !== c ? c.memoizedProps : f2, h2 = a.type, k2 = a.updateQueue;
        a.updateQueue = null;
        if (null !== k2) try {
          "input" === h2 && "radio" === f2.type && null != f2.name && ab(e, f2);
          vb(h2, g);
          var l2 = vb(h2, f2);
          for (g = 0; g < k2.length; g += 2) {
            var m2 = k2[g], q2 = k2[g + 1];
            "style" === m2 ? sb(e, q2) : "dangerouslySetInnerHTML" === m2 ? nb(e, q2) : "children" === m2 ? ob(e, q2) : ta(e, m2, q2, l2);
          }
          switch (h2) {
            case "input":
              bb(e, f2);
              break;
            case "textarea":
              ib(e, f2);
              break;
            case "select":
              var r2 = e._wrapperState.wasMultiple;
              e._wrapperState.wasMultiple = !!f2.multiple;
              var y2 = f2.value;
              null != y2 ? fb(e, !!f2.multiple, y2, false) : r2 !== !!f2.multiple && (null != f2.defaultValue ? fb(
                e,
                !!f2.multiple,
                f2.defaultValue,
                true
              ) : fb(e, !!f2.multiple, f2.multiple ? [] : "", false));
          }
          e[Pf] = f2;
        } catch (t2) {
          W(a, a.return, t2);
        }
      }
      break;
    case 6:
      ck(b, a);
      ek(a);
      if (d & 4) {
        if (null === a.stateNode) throw Error(p(162));
        e = a.stateNode;
        f2 = a.memoizedProps;
        try {
          e.nodeValue = f2;
        } catch (t2) {
          W(a, a.return, t2);
        }
      }
      break;
    case 3:
      ck(b, a);
      ek(a);
      if (d & 4 && null !== c && c.memoizedState.isDehydrated) try {
        bd(b.containerInfo);
      } catch (t2) {
        W(a, a.return, t2);
      }
      break;
    case 4:
      ck(b, a);
      ek(a);
      break;
    case 13:
      ck(b, a);
      ek(a);
      e = a.child;
      e.flags & 8192 && (f2 = null !== e.memoizedState, e.stateNode.isHidden = f2, !f2 || null !== e.alternate && null !== e.alternate.memoizedState || (fk = B()));
      d & 4 && ak(a);
      break;
    case 22:
      m2 = null !== c && null !== c.memoizedState;
      a.mode & 1 ? (U = (l2 = U) || m2, ck(b, a), U = l2) : ck(b, a);
      ek(a);
      if (d & 8192) {
        l2 = null !== a.memoizedState;
        if ((a.stateNode.isHidden = l2) && !m2 && 0 !== (a.mode & 1)) for (V = a, m2 = a.child; null !== m2; ) {
          for (q2 = V = m2; null !== V; ) {
            r2 = V;
            y2 = r2.child;
            switch (r2.tag) {
              case 0:
              case 11:
              case 14:
              case 15:
                Pj(4, r2, r2.return);
                break;
              case 1:
                Lj(r2, r2.return);
                var n2 = r2.stateNode;
                if ("function" === typeof n2.componentWillUnmount) {
                  d = r2;
                  c = r2.return;
                  try {
                    b = d, n2.props = b.memoizedProps, n2.state = b.memoizedState, n2.componentWillUnmount();
                  } catch (t2) {
                    W(d, c, t2);
                  }
                }
                break;
              case 5:
                Lj(r2, r2.return);
                break;
              case 22:
                if (null !== r2.memoizedState) {
                  gk(q2);
                  continue;
                }
            }
            null !== y2 ? (y2.return = r2, V = y2) : gk(q2);
          }
          m2 = m2.sibling;
        }
        a: for (m2 = null, q2 = a; ; ) {
          if (5 === q2.tag) {
            if (null === m2) {
              m2 = q2;
              try {
                e = q2.stateNode, l2 ? (f2 = e.style, "function" === typeof f2.setProperty ? f2.setProperty("display", "none", "important") : f2.display = "none") : (h2 = q2.stateNode, k2 = q2.memoizedProps.style, g = void 0 !== k2 && null !== k2 && k2.hasOwnProperty("display") ? k2.display : null, h2.style.display = rb("display", g));
              } catch (t2) {
                W(a, a.return, t2);
              }
            }
          } else if (6 === q2.tag) {
            if (null === m2) try {
              q2.stateNode.nodeValue = l2 ? "" : q2.memoizedProps;
            } catch (t2) {
              W(a, a.return, t2);
            }
          } else if ((22 !== q2.tag && 23 !== q2.tag || null === q2.memoizedState || q2 === a) && null !== q2.child) {
            q2.child.return = q2;
            q2 = q2.child;
            continue;
          }
          if (q2 === a) break a;
          for (; null === q2.sibling; ) {
            if (null === q2.return || q2.return === a) break a;
            m2 === q2 && (m2 = null);
            q2 = q2.return;
          }
          m2 === q2 && (m2 = null);
          q2.sibling.return = q2.return;
          q2 = q2.sibling;
        }
      }
      break;
    case 19:
      ck(b, a);
      ek(a);
      d & 4 && ak(a);
      break;
    case 21:
      break;
    default:
      ck(
        b,
        a
      ), ek(a);
  }
}
function ek(a) {
  var b = a.flags;
  if (b & 2) {
    try {
      a: {
        for (var c = a.return; null !== c; ) {
          if (Tj(c)) {
            var d = c;
            break a;
          }
          c = c.return;
        }
        throw Error(p(160));
      }
      switch (d.tag) {
        case 5:
          var e = d.stateNode;
          d.flags & 32 && (ob(e, ""), d.flags &= -33);
          var f2 = Uj(a);
          Wj(a, f2, e);
          break;
        case 3:
        case 4:
          var g = d.stateNode.containerInfo, h2 = Uj(a);
          Vj(a, h2, g);
          break;
        default:
          throw Error(p(161));
      }
    } catch (k2) {
      W(a, a.return, k2);
    }
    a.flags &= -3;
  }
  b & 4096 && (a.flags &= -4097);
}
function hk(a, b, c) {
  V = a;
  ik(a);
}
function ik(a, b, c) {
  for (var d = 0 !== (a.mode & 1); null !== V; ) {
    var e = V, f2 = e.child;
    if (22 === e.tag && d) {
      var g = null !== e.memoizedState || Jj;
      if (!g) {
        var h2 = e.alternate, k2 = null !== h2 && null !== h2.memoizedState || U;
        h2 = Jj;
        var l2 = U;
        Jj = g;
        if ((U = k2) && !l2) for (V = e; null !== V; ) g = V, k2 = g.child, 22 === g.tag && null !== g.memoizedState ? jk(e) : null !== k2 ? (k2.return = g, V = k2) : jk(e);
        for (; null !== f2; ) V = f2, ik(f2), f2 = f2.sibling;
        V = e;
        Jj = h2;
        U = l2;
      }
      kk(a);
    } else 0 !== (e.subtreeFlags & 8772) && null !== f2 ? (f2.return = e, V = f2) : kk(a);
  }
}
function kk(a) {
  for (; null !== V; ) {
    var b = V;
    if (0 !== (b.flags & 8772)) {
      var c = b.alternate;
      try {
        if (0 !== (b.flags & 8772)) switch (b.tag) {
          case 0:
          case 11:
          case 15:
            U || Qj(5, b);
            break;
          case 1:
            var d = b.stateNode;
            if (b.flags & 4 && !U) if (null === c) d.componentDidMount();
            else {
              var e = b.elementType === b.type ? c.memoizedProps : Ci(b.type, c.memoizedProps);
              d.componentDidUpdate(e, c.memoizedState, d.__reactInternalSnapshotBeforeUpdate);
            }
            var f2 = b.updateQueue;
            null !== f2 && sh(b, f2, d);
            break;
          case 3:
            var g = b.updateQueue;
            if (null !== g) {
              c = null;
              if (null !== b.child) switch (b.child.tag) {
                case 5:
                  c = b.child.stateNode;
                  break;
                case 1:
                  c = b.child.stateNode;
              }
              sh(b, g, c);
            }
            break;
          case 5:
            var h2 = b.stateNode;
            if (null === c && b.flags & 4) {
              c = h2;
              var k2 = b.memoizedProps;
              switch (b.type) {
                case "button":
                case "input":
                case "select":
                case "textarea":
                  k2.autoFocus && c.focus();
                  break;
                case "img":
                  k2.src && (c.src = k2.src);
              }
            }
            break;
          case 6:
            break;
          case 4:
            break;
          case 12:
            break;
          case 13:
            if (null === b.memoizedState) {
              var l2 = b.alternate;
              if (null !== l2) {
                var m2 = l2.memoizedState;
                if (null !== m2) {
                  var q2 = m2.dehydrated;
                  null !== q2 && bd(q2);
                }
              }
            }
            break;
          case 19:
          case 17:
          case 21:
          case 22:
          case 23:
          case 25:
            break;
          default:
            throw Error(p(163));
        }
        U || b.flags & 512 && Rj(b);
      } catch (r2) {
        W(b, b.return, r2);
      }
    }
    if (b === a) {
      V = null;
      break;
    }
    c = b.sibling;
    if (null !== c) {
      c.return = b.return;
      V = c;
      break;
    }
    V = b.return;
  }
}
function gk(a) {
  for (; null !== V; ) {
    var b = V;
    if (b === a) {
      V = null;
      break;
    }
    var c = b.sibling;
    if (null !== c) {
      c.return = b.return;
      V = c;
      break;
    }
    V = b.return;
  }
}
function jk(a) {
  for (; null !== V; ) {
    var b = V;
    try {
      switch (b.tag) {
        case 0:
        case 11:
        case 15:
          var c = b.return;
          try {
            Qj(4, b);
          } catch (k2) {
            W(b, c, k2);
          }
          break;
        case 1:
          var d = b.stateNode;
          if ("function" === typeof d.componentDidMount) {
            var e = b.return;
            try {
              d.componentDidMount();
            } catch (k2) {
              W(b, e, k2);
            }
          }
          var f2 = b.return;
          try {
            Rj(b);
          } catch (k2) {
            W(b, f2, k2);
          }
          break;
        case 5:
          var g = b.return;
          try {
            Rj(b);
          } catch (k2) {
            W(b, g, k2);
          }
      }
    } catch (k2) {
      W(b, b.return, k2);
    }
    if (b === a) {
      V = null;
      break;
    }
    var h2 = b.sibling;
    if (null !== h2) {
      h2.return = b.return;
      V = h2;
      break;
    }
    V = b.return;
  }
}
var lk = Math.ceil, mk = ua.ReactCurrentDispatcher, nk = ua.ReactCurrentOwner, ok = ua.ReactCurrentBatchConfig, K = 0, Q = null, Y$1 = null, Z$1 = 0, fj = 0, ej = Uf(0), T = 0, pk = null, rh = 0, qk = 0, rk = 0, sk = null, tk = null, fk = 0, Gj = Infinity, uk = null, Oi = false, Pi = null, Ri = null, vk = false, wk = null, xk = 0, yk = 0, zk = null, Ak = -1, Bk = 0;
function R() {
  return 0 !== (K & 6) ? B() : -1 !== Ak ? Ak : Ak = B();
}
function yi(a) {
  if (0 === (a.mode & 1)) return 1;
  if (0 !== (K & 2) && 0 !== Z$1) return Z$1 & -Z$1;
  if (null !== Kg.transition) return 0 === Bk && (Bk = yc()), Bk;
  a = C;
  if (0 !== a) return a;
  a = window.event;
  a = void 0 === a ? 16 : jd(a.type);
  return a;
}
function gi(a, b, c, d) {
  if (50 < yk) throw yk = 0, zk = null, Error(p(185));
  Ac(a, c, d);
  if (0 === (K & 2) || a !== Q) a === Q && (0 === (K & 2) && (qk |= c), 4 === T && Ck(a, Z$1)), Dk(a, d), 1 === c && 0 === K && 0 === (b.mode & 1) && (Gj = B() + 500, fg && jg());
}
function Dk(a, b) {
  var c = a.callbackNode;
  wc(a, b);
  var d = uc(a, a === Q ? Z$1 : 0);
  if (0 === d) null !== c && bc(c), a.callbackNode = null, a.callbackPriority = 0;
  else if (b = d & -d, a.callbackPriority !== b) {
    null != c && bc(c);
    if (1 === b) 0 === a.tag ? ig(Ek.bind(null, a)) : hg(Ek.bind(null, a)), Jf(function() {
      0 === (K & 6) && jg();
    }), c = null;
    else {
      switch (Dc(d)) {
        case 1:
          c = fc;
          break;
        case 4:
          c = gc;
          break;
        case 16:
          c = hc;
          break;
        case 536870912:
          c = jc;
          break;
        default:
          c = hc;
      }
      c = Fk(c, Gk.bind(null, a));
    }
    a.callbackPriority = b;
    a.callbackNode = c;
  }
}
function Gk(a, b) {
  Ak = -1;
  Bk = 0;
  if (0 !== (K & 6)) throw Error(p(327));
  var c = a.callbackNode;
  if (Hk() && a.callbackNode !== c) return null;
  var d = uc(a, a === Q ? Z$1 : 0);
  if (0 === d) return null;
  if (0 !== (d & 30) || 0 !== (d & a.expiredLanes) || b) b = Ik(a, d);
  else {
    b = d;
    var e = K;
    K |= 2;
    var f2 = Jk();
    if (Q !== a || Z$1 !== b) uk = null, Gj = B() + 500, Kk(a, b);
    do
      try {
        Lk();
        break;
      } catch (h2) {
        Mk(a, h2);
      }
    while (1);
    $g();
    mk.current = f2;
    K = e;
    null !== Y$1 ? b = 0 : (Q = null, Z$1 = 0, b = T);
  }
  if (0 !== b) {
    2 === b && (e = xc(a), 0 !== e && (d = e, b = Nk(a, e)));
    if (1 === b) throw c = pk, Kk(a, 0), Ck(a, d), Dk(a, B()), c;
    if (6 === b) Ck(a, d);
    else {
      e = a.current.alternate;
      if (0 === (d & 30) && !Ok(e) && (b = Ik(a, d), 2 === b && (f2 = xc(a), 0 !== f2 && (d = f2, b = Nk(a, f2))), 1 === b)) throw c = pk, Kk(a, 0), Ck(a, d), Dk(a, B()), c;
      a.finishedWork = e;
      a.finishedLanes = d;
      switch (b) {
        case 0:
        case 1:
          throw Error(p(345));
        case 2:
          Pk(a, tk, uk);
          break;
        case 3:
          Ck(a, d);
          if ((d & 130023424) === d && (b = fk + 500 - B(), 10 < b)) {
            if (0 !== uc(a, 0)) break;
            e = a.suspendedLanes;
            if ((e & d) !== d) {
              R();
              a.pingedLanes |= a.suspendedLanes & e;
              break;
            }
            a.timeoutHandle = Ff(Pk.bind(null, a, tk, uk), b);
            break;
          }
          Pk(a, tk, uk);
          break;
        case 4:
          Ck(a, d);
          if ((d & 4194240) === d) break;
          b = a.eventTimes;
          for (e = -1; 0 < d; ) {
            var g = 31 - oc(d);
            f2 = 1 << g;
            g = b[g];
            g > e && (e = g);
            d &= ~f2;
          }
          d = e;
          d = B() - d;
          d = (120 > d ? 120 : 480 > d ? 480 : 1080 > d ? 1080 : 1920 > d ? 1920 : 3e3 > d ? 3e3 : 4320 > d ? 4320 : 1960 * lk(d / 1960)) - d;
          if (10 < d) {
            a.timeoutHandle = Ff(Pk.bind(null, a, tk, uk), d);
            break;
          }
          Pk(a, tk, uk);
          break;
        case 5:
          Pk(a, tk, uk);
          break;
        default:
          throw Error(p(329));
      }
    }
  }
  Dk(a, B());
  return a.callbackNode === c ? Gk.bind(null, a) : null;
}
function Nk(a, b) {
  var c = sk;
  a.current.memoizedState.isDehydrated && (Kk(a, b).flags |= 256);
  a = Ik(a, b);
  2 !== a && (b = tk, tk = c, null !== b && Fj(b));
  return a;
}
function Fj(a) {
  null === tk ? tk = a : tk.push.apply(tk, a);
}
function Ok(a) {
  for (var b = a; ; ) {
    if (b.flags & 16384) {
      var c = b.updateQueue;
      if (null !== c && (c = c.stores, null !== c)) for (var d = 0; d < c.length; d++) {
        var e = c[d], f2 = e.getSnapshot;
        e = e.value;
        try {
          if (!He$1(f2(), e)) return false;
        } catch (g) {
          return false;
        }
      }
    }
    c = b.child;
    if (b.subtreeFlags & 16384 && null !== c) c.return = b, b = c;
    else {
      if (b === a) break;
      for (; null === b.sibling; ) {
        if (null === b.return || b.return === a) return true;
        b = b.return;
      }
      b.sibling.return = b.return;
      b = b.sibling;
    }
  }
  return true;
}
function Ck(a, b) {
  b &= ~rk;
  b &= ~qk;
  a.suspendedLanes |= b;
  a.pingedLanes &= ~b;
  for (a = a.expirationTimes; 0 < b; ) {
    var c = 31 - oc(b), d = 1 << c;
    a[c] = -1;
    b &= ~d;
  }
}
function Ek(a) {
  if (0 !== (K & 6)) throw Error(p(327));
  Hk();
  var b = uc(a, 0);
  if (0 === (b & 1)) return Dk(a, B()), null;
  var c = Ik(a, b);
  if (0 !== a.tag && 2 === c) {
    var d = xc(a);
    0 !== d && (b = d, c = Nk(a, d));
  }
  if (1 === c) throw c = pk, Kk(a, 0), Ck(a, b), Dk(a, B()), c;
  if (6 === c) throw Error(p(345));
  a.finishedWork = a.current.alternate;
  a.finishedLanes = b;
  Pk(a, tk, uk);
  Dk(a, B());
  return null;
}
function Qk(a, b) {
  var c = K;
  K |= 1;
  try {
    return a(b);
  } finally {
    K = c, 0 === K && (Gj = B() + 500, fg && jg());
  }
}
function Rk(a) {
  null !== wk && 0 === wk.tag && 0 === (K & 6) && Hk();
  var b = K;
  K |= 1;
  var c = ok.transition, d = C;
  try {
    if (ok.transition = null, C = 1, a) return a();
  } finally {
    C = d, ok.transition = c, K = b, 0 === (K & 6) && jg();
  }
}
function Hj() {
  fj = ej.current;
  E(ej);
}
function Kk(a, b) {
  a.finishedWork = null;
  a.finishedLanes = 0;
  var c = a.timeoutHandle;
  -1 !== c && (a.timeoutHandle = -1, Gf(c));
  if (null !== Y$1) for (c = Y$1.return; null !== c; ) {
    var d = c;
    wg(d);
    switch (d.tag) {
      case 1:
        d = d.type.childContextTypes;
        null !== d && void 0 !== d && $f();
        break;
      case 3:
        zh();
        E(Wf);
        E(H$1);
        Eh();
        break;
      case 5:
        Bh(d);
        break;
      case 4:
        zh();
        break;
      case 13:
        E(L);
        break;
      case 19:
        E(L);
        break;
      case 10:
        ah(d.type._context);
        break;
      case 22:
      case 23:
        Hj();
    }
    c = c.return;
  }
  Q = a;
  Y$1 = a = Pg(a.current, null);
  Z$1 = fj = b;
  T = 0;
  pk = null;
  rk = qk = rh = 0;
  tk = sk = null;
  if (null !== fh) {
    for (b = 0; b < fh.length; b++) if (c = fh[b], d = c.interleaved, null !== d) {
      c.interleaved = null;
      var e = d.next, f2 = c.pending;
      if (null !== f2) {
        var g = f2.next;
        f2.next = e;
        d.next = g;
      }
      c.pending = d;
    }
    fh = null;
  }
  return a;
}
function Mk(a, b) {
  do {
    var c = Y$1;
    try {
      $g();
      Fh.current = Rh;
      if (Ih) {
        for (var d = M.memoizedState; null !== d; ) {
          var e = d.queue;
          null !== e && (e.pending = null);
          d = d.next;
        }
        Ih = false;
      }
      Hh = 0;
      O = N = M = null;
      Jh = false;
      Kh = 0;
      nk.current = null;
      if (null === c || null === c.return) {
        T = 1;
        pk = b;
        Y$1 = null;
        break;
      }
      a: {
        var f2 = a, g = c.return, h2 = c, k2 = b;
        b = Z$1;
        h2.flags |= 32768;
        if (null !== k2 && "object" === typeof k2 && "function" === typeof k2.then) {
          var l2 = k2, m2 = h2, q2 = m2.tag;
          if (0 === (m2.mode & 1) && (0 === q2 || 11 === q2 || 15 === q2)) {
            var r2 = m2.alternate;
            r2 ? (m2.updateQueue = r2.updateQueue, m2.memoizedState = r2.memoizedState, m2.lanes = r2.lanes) : (m2.updateQueue = null, m2.memoizedState = null);
          }
          var y2 = Ui(g);
          if (null !== y2) {
            y2.flags &= -257;
            Vi(y2, g, h2, f2, b);
            y2.mode & 1 && Si(f2, l2, b);
            b = y2;
            k2 = l2;
            var n2 = b.updateQueue;
            if (null === n2) {
              var t2 = /* @__PURE__ */ new Set();
              t2.add(k2);
              b.updateQueue = t2;
            } else n2.add(k2);
            break a;
          } else {
            if (0 === (b & 1)) {
              Si(f2, l2, b);
              tj();
              break a;
            }
            k2 = Error(p(426));
          }
        } else if (I && h2.mode & 1) {
          var J2 = Ui(g);
          if (null !== J2) {
            0 === (J2.flags & 65536) && (J2.flags |= 256);
            Vi(J2, g, h2, f2, b);
            Jg(Ji(k2, h2));
            break a;
          }
        }
        f2 = k2 = Ji(k2, h2);
        4 !== T && (T = 2);
        null === sk ? sk = [f2] : sk.push(f2);
        f2 = g;
        do {
          switch (f2.tag) {
            case 3:
              f2.flags |= 65536;
              b &= -b;
              f2.lanes |= b;
              var x2 = Ni(f2, k2, b);
              ph(f2, x2);
              break a;
            case 1:
              h2 = k2;
              var w2 = f2.type, u2 = f2.stateNode;
              if (0 === (f2.flags & 128) && ("function" === typeof w2.getDerivedStateFromError || null !== u2 && "function" === typeof u2.componentDidCatch && (null === Ri || !Ri.has(u2)))) {
                f2.flags |= 65536;
                b &= -b;
                f2.lanes |= b;
                var F2 = Qi(f2, h2, b);
                ph(f2, F2);
                break a;
              }
          }
          f2 = f2.return;
        } while (null !== f2);
      }
      Sk(c);
    } catch (na) {
      b = na;
      Y$1 === c && null !== c && (Y$1 = c = c.return);
      continue;
    }
    break;
  } while (1);
}
function Jk() {
  var a = mk.current;
  mk.current = Rh;
  return null === a ? Rh : a;
}
function tj() {
  if (0 === T || 3 === T || 2 === T) T = 4;
  null === Q || 0 === (rh & 268435455) && 0 === (qk & 268435455) || Ck(Q, Z$1);
}
function Ik(a, b) {
  var c = K;
  K |= 2;
  var d = Jk();
  if (Q !== a || Z$1 !== b) uk = null, Kk(a, b);
  do
    try {
      Tk();
      break;
    } catch (e) {
      Mk(a, e);
    }
  while (1);
  $g();
  K = c;
  mk.current = d;
  if (null !== Y$1) throw Error(p(261));
  Q = null;
  Z$1 = 0;
  return T;
}
function Tk() {
  for (; null !== Y$1; ) Uk(Y$1);
}
function Lk() {
  for (; null !== Y$1 && !cc(); ) Uk(Y$1);
}
function Uk(a) {
  var b = Vk(a.alternate, a, fj);
  a.memoizedProps = a.pendingProps;
  null === b ? Sk(a) : Y$1 = b;
  nk.current = null;
}
function Sk(a) {
  var b = a;
  do {
    var c = b.alternate;
    a = b.return;
    if (0 === (b.flags & 32768)) {
      if (c = Ej(c, b, fj), null !== c) {
        Y$1 = c;
        return;
      }
    } else {
      c = Ij(c, b);
      if (null !== c) {
        c.flags &= 32767;
        Y$1 = c;
        return;
      }
      if (null !== a) a.flags |= 32768, a.subtreeFlags = 0, a.deletions = null;
      else {
        T = 6;
        Y$1 = null;
        return;
      }
    }
    b = b.sibling;
    if (null !== b) {
      Y$1 = b;
      return;
    }
    Y$1 = b = a;
  } while (null !== b);
  0 === T && (T = 5);
}
function Pk(a, b, c) {
  var d = C, e = ok.transition;
  try {
    ok.transition = null, C = 1, Wk(a, b, c, d);
  } finally {
    ok.transition = e, C = d;
  }
  return null;
}
function Wk(a, b, c, d) {
  do
    Hk();
  while (null !== wk);
  if (0 !== (K & 6)) throw Error(p(327));
  c = a.finishedWork;
  var e = a.finishedLanes;
  if (null === c) return null;
  a.finishedWork = null;
  a.finishedLanes = 0;
  if (c === a.current) throw Error(p(177));
  a.callbackNode = null;
  a.callbackPriority = 0;
  var f2 = c.lanes | c.childLanes;
  Bc(a, f2);
  a === Q && (Y$1 = Q = null, Z$1 = 0);
  0 === (c.subtreeFlags & 2064) && 0 === (c.flags & 2064) || vk || (vk = true, Fk(hc, function() {
    Hk();
    return null;
  }));
  f2 = 0 !== (c.flags & 15990);
  if (0 !== (c.subtreeFlags & 15990) || f2) {
    f2 = ok.transition;
    ok.transition = null;
    var g = C;
    C = 1;
    var h2 = K;
    K |= 4;
    nk.current = null;
    Oj(a, c);
    dk(c, a);
    Oe$1(Df);
    dd = !!Cf;
    Df = Cf = null;
    a.current = c;
    hk(c);
    dc();
    K = h2;
    C = g;
    ok.transition = f2;
  } else a.current = c;
  vk && (vk = false, wk = a, xk = e);
  f2 = a.pendingLanes;
  0 === f2 && (Ri = null);
  mc(c.stateNode);
  Dk(a, B());
  if (null !== b) for (d = a.onRecoverableError, c = 0; c < b.length; c++) e = b[c], d(e.value, { componentStack: e.stack, digest: e.digest });
  if (Oi) throw Oi = false, a = Pi, Pi = null, a;
  0 !== (xk & 1) && 0 !== a.tag && Hk();
  f2 = a.pendingLanes;
  0 !== (f2 & 1) ? a === zk ? yk++ : (yk = 0, zk = a) : yk = 0;
  jg();
  return null;
}
function Hk() {
  if (null !== wk) {
    var a = Dc(xk), b = ok.transition, c = C;
    try {
      ok.transition = null;
      C = 16 > a ? 16 : a;
      if (null === wk) var d = false;
      else {
        a = wk;
        wk = null;
        xk = 0;
        if (0 !== (K & 6)) throw Error(p(331));
        var e = K;
        K |= 4;
        for (V = a.current; null !== V; ) {
          var f2 = V, g = f2.child;
          if (0 !== (V.flags & 16)) {
            var h2 = f2.deletions;
            if (null !== h2) {
              for (var k2 = 0; k2 < h2.length; k2++) {
                var l2 = h2[k2];
                for (V = l2; null !== V; ) {
                  var m2 = V;
                  switch (m2.tag) {
                    case 0:
                    case 11:
                    case 15:
                      Pj(8, m2, f2);
                  }
                  var q2 = m2.child;
                  if (null !== q2) q2.return = m2, V = q2;
                  else for (; null !== V; ) {
                    m2 = V;
                    var r2 = m2.sibling, y2 = m2.return;
                    Sj(m2);
                    if (m2 === l2) {
                      V = null;
                      break;
                    }
                    if (null !== r2) {
                      r2.return = y2;
                      V = r2;
                      break;
                    }
                    V = y2;
                  }
                }
              }
              var n2 = f2.alternate;
              if (null !== n2) {
                var t2 = n2.child;
                if (null !== t2) {
                  n2.child = null;
                  do {
                    var J2 = t2.sibling;
                    t2.sibling = null;
                    t2 = J2;
                  } while (null !== t2);
                }
              }
              V = f2;
            }
          }
          if (0 !== (f2.subtreeFlags & 2064) && null !== g) g.return = f2, V = g;
          else b: for (; null !== V; ) {
            f2 = V;
            if (0 !== (f2.flags & 2048)) switch (f2.tag) {
              case 0:
              case 11:
              case 15:
                Pj(9, f2, f2.return);
            }
            var x2 = f2.sibling;
            if (null !== x2) {
              x2.return = f2.return;
              V = x2;
              break b;
            }
            V = f2.return;
          }
        }
        var w2 = a.current;
        for (V = w2; null !== V; ) {
          g = V;
          var u2 = g.child;
          if (0 !== (g.subtreeFlags & 2064) && null !== u2) u2.return = g, V = u2;
          else b: for (g = w2; null !== V; ) {
            h2 = V;
            if (0 !== (h2.flags & 2048)) try {
              switch (h2.tag) {
                case 0:
                case 11:
                case 15:
                  Qj(9, h2);
              }
            } catch (na) {
              W(h2, h2.return, na);
            }
            if (h2 === g) {
              V = null;
              break b;
            }
            var F2 = h2.sibling;
            if (null !== F2) {
              F2.return = h2.return;
              V = F2;
              break b;
            }
            V = h2.return;
          }
        }
        K = e;
        jg();
        if (lc && "function" === typeof lc.onPostCommitFiberRoot) try {
          lc.onPostCommitFiberRoot(kc, a);
        } catch (na) {
        }
        d = true;
      }
      return d;
    } finally {
      C = c, ok.transition = b;
    }
  }
  return false;
}
function Xk(a, b, c) {
  b = Ji(c, b);
  b = Ni(a, b, 1);
  a = nh(a, b, 1);
  b = R();
  null !== a && (Ac(a, 1, b), Dk(a, b));
}
function W(a, b, c) {
  if (3 === a.tag) Xk(a, a, c);
  else for (; null !== b; ) {
    if (3 === b.tag) {
      Xk(b, a, c);
      break;
    } else if (1 === b.tag) {
      var d = b.stateNode;
      if ("function" === typeof b.type.getDerivedStateFromError || "function" === typeof d.componentDidCatch && (null === Ri || !Ri.has(d))) {
        a = Ji(c, a);
        a = Qi(b, a, 1);
        b = nh(b, a, 1);
        a = R();
        null !== b && (Ac(b, 1, a), Dk(b, a));
        break;
      }
    }
    b = b.return;
  }
}
function Ti(a, b, c) {
  var d = a.pingCache;
  null !== d && d.delete(b);
  b = R();
  a.pingedLanes |= a.suspendedLanes & c;
  Q === a && (Z$1 & c) === c && (4 === T || 3 === T && (Z$1 & 130023424) === Z$1 && 500 > B() - fk ? Kk(a, 0) : rk |= c);
  Dk(a, b);
}
function Yk(a, b) {
  0 === b && (0 === (a.mode & 1) ? b = 1 : (b = sc, sc <<= 1, 0 === (sc & 130023424) && (sc = 4194304)));
  var c = R();
  a = ih(a, b);
  null !== a && (Ac(a, b, c), Dk(a, c));
}
function uj(a) {
  var b = a.memoizedState, c = 0;
  null !== b && (c = b.retryLane);
  Yk(a, c);
}
function bk(a, b) {
  var c = 0;
  switch (a.tag) {
    case 13:
      var d = a.stateNode;
      var e = a.memoizedState;
      null !== e && (c = e.retryLane);
      break;
    case 19:
      d = a.stateNode;
      break;
    default:
      throw Error(p(314));
  }
  null !== d && d.delete(b);
  Yk(a, c);
}
var Vk;
Vk = function(a, b, c) {
  if (null !== a) if (a.memoizedProps !== b.pendingProps || Wf.current) dh = true;
  else {
    if (0 === (a.lanes & c) && 0 === (b.flags & 128)) return dh = false, yj(a, b, c);
    dh = 0 !== (a.flags & 131072) ? true : false;
  }
  else dh = false, I && 0 !== (b.flags & 1048576) && ug(b, ng, b.index);
  b.lanes = 0;
  switch (b.tag) {
    case 2:
      var d = b.type;
      ij(a, b);
      a = b.pendingProps;
      var e = Yf(b, H$1.current);
      ch(b, c);
      e = Nh(null, b, d, a, e, c);
      var f2 = Sh();
      b.flags |= 1;
      "object" === typeof e && null !== e && "function" === typeof e.render && void 0 === e.$$typeof ? (b.tag = 1, b.memoizedState = null, b.updateQueue = null, Zf(d) ? (f2 = true, cg(b)) : f2 = false, b.memoizedState = null !== e.state && void 0 !== e.state ? e.state : null, kh(b), e.updater = Ei, b.stateNode = e, e._reactInternals = b, Ii(b, d, a, c), b = jj(null, b, d, true, f2, c)) : (b.tag = 0, I && f2 && vg(b), Xi(null, b, e, c), b = b.child);
      return b;
    case 16:
      d = b.elementType;
      a: {
        ij(a, b);
        a = b.pendingProps;
        e = d._init;
        d = e(d._payload);
        b.type = d;
        e = b.tag = Zk(d);
        a = Ci(d, a);
        switch (e) {
          case 0:
            b = cj(null, b, d, a, c);
            break a;
          case 1:
            b = hj(null, b, d, a, c);
            break a;
          case 11:
            b = Yi(null, b, d, a, c);
            break a;
          case 14:
            b = $i(null, b, d, Ci(d.type, a), c);
            break a;
        }
        throw Error(p(
          306,
          d,
          ""
        ));
      }
      return b;
    case 0:
      return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), cj(a, b, d, e, c);
    case 1:
      return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), hj(a, b, d, e, c);
    case 3:
      a: {
        kj(b);
        if (null === a) throw Error(p(387));
        d = b.pendingProps;
        f2 = b.memoizedState;
        e = f2.element;
        lh(a, b);
        qh(b, d, null, c);
        var g = b.memoizedState;
        d = g.element;
        if (f2.isDehydrated) if (f2 = { element: d, isDehydrated: false, cache: g.cache, pendingSuspenseBoundaries: g.pendingSuspenseBoundaries, transitions: g.transitions }, b.updateQueue.baseState = f2, b.memoizedState = f2, b.flags & 256) {
          e = Ji(Error(p(423)), b);
          b = lj(a, b, d, c, e);
          break a;
        } else if (d !== e) {
          e = Ji(Error(p(424)), b);
          b = lj(a, b, d, c, e);
          break a;
        } else for (yg = Lf(b.stateNode.containerInfo.firstChild), xg = b, I = true, zg = null, c = Vg(b, null, d, c), b.child = c; c; ) c.flags = c.flags & -3 | 4096, c = c.sibling;
        else {
          Ig();
          if (d === e) {
            b = Zi(a, b, c);
            break a;
          }
          Xi(a, b, d, c);
        }
        b = b.child;
      }
      return b;
    case 5:
      return Ah(b), null === a && Eg(b), d = b.type, e = b.pendingProps, f2 = null !== a ? a.memoizedProps : null, g = e.children, Ef(d, e) ? g = null : null !== f2 && Ef(d, f2) && (b.flags |= 32), gj(a, b), Xi(a, b, g, c), b.child;
    case 6:
      return null === a && Eg(b), null;
    case 13:
      return oj(a, b, c);
    case 4:
      return yh(b, b.stateNode.containerInfo), d = b.pendingProps, null === a ? b.child = Ug(b, null, d, c) : Xi(a, b, d, c), b.child;
    case 11:
      return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), Yi(a, b, d, e, c);
    case 7:
      return Xi(a, b, b.pendingProps, c), b.child;
    case 8:
      return Xi(a, b, b.pendingProps.children, c), b.child;
    case 12:
      return Xi(a, b, b.pendingProps.children, c), b.child;
    case 10:
      a: {
        d = b.type._context;
        e = b.pendingProps;
        f2 = b.memoizedProps;
        g = e.value;
        G(Wg, d._currentValue);
        d._currentValue = g;
        if (null !== f2) if (He$1(f2.value, g)) {
          if (f2.children === e.children && !Wf.current) {
            b = Zi(a, b, c);
            break a;
          }
        } else for (f2 = b.child, null !== f2 && (f2.return = b); null !== f2; ) {
          var h2 = f2.dependencies;
          if (null !== h2) {
            g = f2.child;
            for (var k2 = h2.firstContext; null !== k2; ) {
              if (k2.context === d) {
                if (1 === f2.tag) {
                  k2 = mh(-1, c & -c);
                  k2.tag = 2;
                  var l2 = f2.updateQueue;
                  if (null !== l2) {
                    l2 = l2.shared;
                    var m2 = l2.pending;
                    null === m2 ? k2.next = k2 : (k2.next = m2.next, m2.next = k2);
                    l2.pending = k2;
                  }
                }
                f2.lanes |= c;
                k2 = f2.alternate;
                null !== k2 && (k2.lanes |= c);
                bh(
                  f2.return,
                  c,
                  b
                );
                h2.lanes |= c;
                break;
              }
              k2 = k2.next;
            }
          } else if (10 === f2.tag) g = f2.type === b.type ? null : f2.child;
          else if (18 === f2.tag) {
            g = f2.return;
            if (null === g) throw Error(p(341));
            g.lanes |= c;
            h2 = g.alternate;
            null !== h2 && (h2.lanes |= c);
            bh(g, c, b);
            g = f2.sibling;
          } else g = f2.child;
          if (null !== g) g.return = f2;
          else for (g = f2; null !== g; ) {
            if (g === b) {
              g = null;
              break;
            }
            f2 = g.sibling;
            if (null !== f2) {
              f2.return = g.return;
              g = f2;
              break;
            }
            g = g.return;
          }
          f2 = g;
        }
        Xi(a, b, e.children, c);
        b = b.child;
      }
      return b;
    case 9:
      return e = b.type, d = b.pendingProps.children, ch(b, c), e = eh(e), d = d(e), b.flags |= 1, Xi(a, b, d, c), b.child;
    case 14:
      return d = b.type, e = Ci(d, b.pendingProps), e = Ci(d.type, e), $i(a, b, d, e, c);
    case 15:
      return bj(a, b, b.type, b.pendingProps, c);
    case 17:
      return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), ij(a, b), b.tag = 1, Zf(d) ? (a = true, cg(b)) : a = false, ch(b, c), Gi(b, d, e), Ii(b, d, e, c), jj(null, b, d, true, a, c);
    case 19:
      return xj(a, b, c);
    case 22:
      return dj(a, b, c);
  }
  throw Error(p(156, b.tag));
};
function Fk(a, b) {
  return ac(a, b);
}
function $k(a, b, c, d) {
  this.tag = a;
  this.key = c;
  this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null;
  this.index = 0;
  this.ref = null;
  this.pendingProps = b;
  this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null;
  this.mode = d;
  this.subtreeFlags = this.flags = 0;
  this.deletions = null;
  this.childLanes = this.lanes = 0;
  this.alternate = null;
}
function Bg(a, b, c, d) {
  return new $k(a, b, c, d);
}
function aj(a) {
  a = a.prototype;
  return !(!a || !a.isReactComponent);
}
function Zk(a) {
  if ("function" === typeof a) return aj(a) ? 1 : 0;
  if (void 0 !== a && null !== a) {
    a = a.$$typeof;
    if (a === Da) return 11;
    if (a === Ga) return 14;
  }
  return 2;
}
function Pg(a, b) {
  var c = a.alternate;
  null === c ? (c = Bg(a.tag, b, a.key, a.mode), c.elementType = a.elementType, c.type = a.type, c.stateNode = a.stateNode, c.alternate = a, a.alternate = c) : (c.pendingProps = b, c.type = a.type, c.flags = 0, c.subtreeFlags = 0, c.deletions = null);
  c.flags = a.flags & 14680064;
  c.childLanes = a.childLanes;
  c.lanes = a.lanes;
  c.child = a.child;
  c.memoizedProps = a.memoizedProps;
  c.memoizedState = a.memoizedState;
  c.updateQueue = a.updateQueue;
  b = a.dependencies;
  c.dependencies = null === b ? null : { lanes: b.lanes, firstContext: b.firstContext };
  c.sibling = a.sibling;
  c.index = a.index;
  c.ref = a.ref;
  return c;
}
function Rg(a, b, c, d, e, f2) {
  var g = 2;
  d = a;
  if ("function" === typeof a) aj(a) && (g = 1);
  else if ("string" === typeof a) g = 5;
  else a: switch (a) {
    case ya:
      return Tg(c.children, e, f2, b);
    case za:
      g = 8;
      e |= 8;
      break;
    case Aa:
      return a = Bg(12, c, b, e | 2), a.elementType = Aa, a.lanes = f2, a;
    case Ea:
      return a = Bg(13, c, b, e), a.elementType = Ea, a.lanes = f2, a;
    case Fa:
      return a = Bg(19, c, b, e), a.elementType = Fa, a.lanes = f2, a;
    case Ia:
      return pj(c, e, f2, b);
    default:
      if ("object" === typeof a && null !== a) switch (a.$$typeof) {
        case Ba:
          g = 10;
          break a;
        case Ca:
          g = 9;
          break a;
        case Da:
          g = 11;
          break a;
        case Ga:
          g = 14;
          break a;
        case Ha:
          g = 16;
          d = null;
          break a;
      }
      throw Error(p(130, null == a ? a : typeof a, ""));
  }
  b = Bg(g, c, b, e);
  b.elementType = a;
  b.type = d;
  b.lanes = f2;
  return b;
}
function Tg(a, b, c, d) {
  a = Bg(7, a, d, b);
  a.lanes = c;
  return a;
}
function pj(a, b, c, d) {
  a = Bg(22, a, d, b);
  a.elementType = Ia;
  a.lanes = c;
  a.stateNode = { isHidden: false };
  return a;
}
function Qg(a, b, c) {
  a = Bg(6, a, null, b);
  a.lanes = c;
  return a;
}
function Sg(a, b, c) {
  b = Bg(4, null !== a.children ? a.children : [], a.key, b);
  b.lanes = c;
  b.stateNode = { containerInfo: a.containerInfo, pendingChildren: null, implementation: a.implementation };
  return b;
}
function al(a, b, c, d, e) {
  this.tag = b;
  this.containerInfo = a;
  this.finishedWork = this.pingCache = this.current = this.pendingChildren = null;
  this.timeoutHandle = -1;
  this.callbackNode = this.pendingContext = this.context = null;
  this.callbackPriority = 0;
  this.eventTimes = zc(0);
  this.expirationTimes = zc(-1);
  this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0;
  this.entanglements = zc(0);
  this.identifierPrefix = d;
  this.onRecoverableError = e;
  this.mutableSourceEagerHydrationData = null;
}
function bl(a, b, c, d, e, f2, g, h2, k2) {
  a = new al(a, b, c, h2, k2);
  1 === b ? (b = 1, true === f2 && (b |= 8)) : b = 0;
  f2 = Bg(3, null, null, b);
  a.current = f2;
  f2.stateNode = a;
  f2.memoizedState = { element: d, isDehydrated: c, cache: null, transitions: null, pendingSuspenseBoundaries: null };
  kh(f2);
  return a;
}
function cl(a, b, c) {
  var d = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
  return { $$typeof: wa, key: null == d ? null : "" + d, children: a, containerInfo: b, implementation: c };
}
function dl(a) {
  if (!a) return Vf;
  a = a._reactInternals;
  a: {
    if (Vb(a) !== a || 1 !== a.tag) throw Error(p(170));
    var b = a;
    do {
      switch (b.tag) {
        case 3:
          b = b.stateNode.context;
          break a;
        case 1:
          if (Zf(b.type)) {
            b = b.stateNode.__reactInternalMemoizedMergedChildContext;
            break a;
          }
      }
      b = b.return;
    } while (null !== b);
    throw Error(p(171));
  }
  if (1 === a.tag) {
    var c = a.type;
    if (Zf(c)) return bg(a, c, b);
  }
  return b;
}
function el(a, b, c, d, e, f2, g, h2, k2) {
  a = bl(c, d, true, a, e, f2, g, h2, k2);
  a.context = dl(null);
  c = a.current;
  d = R();
  e = yi(c);
  f2 = mh(d, e);
  f2.callback = void 0 !== b && null !== b ? b : null;
  nh(c, f2, e);
  a.current.lanes = e;
  Ac(a, e, d);
  Dk(a, d);
  return a;
}
function fl(a, b, c, d) {
  var e = b.current, f2 = R(), g = yi(e);
  c = dl(c);
  null === b.context ? b.context = c : b.pendingContext = c;
  b = mh(f2, g);
  b.payload = { element: a };
  d = void 0 === d ? null : d;
  null !== d && (b.callback = d);
  a = nh(e, b, g);
  null !== a && (gi(a, e, g, f2), oh(a, e, g));
  return g;
}
function gl(a) {
  a = a.current;
  if (!a.child) return null;
  switch (a.child.tag) {
    case 5:
      return a.child.stateNode;
    default:
      return a.child.stateNode;
  }
}
function hl(a, b) {
  a = a.memoizedState;
  if (null !== a && null !== a.dehydrated) {
    var c = a.retryLane;
    a.retryLane = 0 !== c && c < b ? c : b;
  }
}
function il(a, b) {
  hl(a, b);
  (a = a.alternate) && hl(a, b);
}
function jl() {
  return null;
}
var kl = "function" === typeof reportError ? reportError : function(a) {
  console.error(a);
};
function ll(a) {
  this._internalRoot = a;
}
ml.prototype.render = ll.prototype.render = function(a) {
  var b = this._internalRoot;
  if (null === b) throw Error(p(409));
  fl(a, b, null, null);
};
ml.prototype.unmount = ll.prototype.unmount = function() {
  var a = this._internalRoot;
  if (null !== a) {
    this._internalRoot = null;
    var b = a.containerInfo;
    Rk(function() {
      fl(null, a, null, null);
    });
    b[uf] = null;
  }
};
function ml(a) {
  this._internalRoot = a;
}
ml.prototype.unstable_scheduleHydration = function(a) {
  if (a) {
    var b = Hc();
    a = { blockedOn: null, target: a, priority: b };
    for (var c = 0; c < Qc.length && 0 !== b && b < Qc[c].priority; c++) ;
    Qc.splice(c, 0, a);
    0 === c && Vc(a);
  }
};
function nl(a) {
  return !(!a || 1 !== a.nodeType && 9 !== a.nodeType && 11 !== a.nodeType);
}
function ol(a) {
  return !(!a || 1 !== a.nodeType && 9 !== a.nodeType && 11 !== a.nodeType && (8 !== a.nodeType || " react-mount-point-unstable " !== a.nodeValue));
}
function pl() {
}
function ql(a, b, c, d, e) {
  if (e) {
    if ("function" === typeof d) {
      var f2 = d;
      d = function() {
        var a2 = gl(g);
        f2.call(a2);
      };
    }
    var g = el(b, d, a, 0, null, false, false, "", pl);
    a._reactRootContainer = g;
    a[uf] = g.current;
    sf(8 === a.nodeType ? a.parentNode : a);
    Rk();
    return g;
  }
  for (; e = a.lastChild; ) a.removeChild(e);
  if ("function" === typeof d) {
    var h2 = d;
    d = function() {
      var a2 = gl(k2);
      h2.call(a2);
    };
  }
  var k2 = bl(a, 0, false, null, null, false, false, "", pl);
  a._reactRootContainer = k2;
  a[uf] = k2.current;
  sf(8 === a.nodeType ? a.parentNode : a);
  Rk(function() {
    fl(b, k2, c, d);
  });
  return k2;
}
function rl(a, b, c, d, e) {
  var f2 = c._reactRootContainer;
  if (f2) {
    var g = f2;
    if ("function" === typeof e) {
      var h2 = e;
      e = function() {
        var a2 = gl(g);
        h2.call(a2);
      };
    }
    fl(b, g, a, e);
  } else g = ql(c, b, a, e, d);
  return gl(g);
}
Ec = function(a) {
  switch (a.tag) {
    case 3:
      var b = a.stateNode;
      if (b.current.memoizedState.isDehydrated) {
        var c = tc(b.pendingLanes);
        0 !== c && (Cc(b, c | 1), Dk(b, B()), 0 === (K & 6) && (Gj = B() + 500, jg()));
      }
      break;
    case 13:
      Rk(function() {
        var b2 = ih(a, 1);
        if (null !== b2) {
          var c2 = R();
          gi(b2, a, 1, c2);
        }
      }), il(a, 1);
  }
};
Fc = function(a) {
  if (13 === a.tag) {
    var b = ih(a, 134217728);
    if (null !== b) {
      var c = R();
      gi(b, a, 134217728, c);
    }
    il(a, 134217728);
  }
};
Gc = function(a) {
  if (13 === a.tag) {
    var b = yi(a), c = ih(a, b);
    if (null !== c) {
      var d = R();
      gi(c, a, b, d);
    }
    il(a, b);
  }
};
Hc = function() {
  return C;
};
Ic = function(a, b) {
  var c = C;
  try {
    return C = a, b();
  } finally {
    C = c;
  }
};
yb = function(a, b, c) {
  switch (b) {
    case "input":
      bb(a, c);
      b = c.name;
      if ("radio" === c.type && null != b) {
        for (c = a; c.parentNode; ) c = c.parentNode;
        c = c.querySelectorAll("input[name=" + JSON.stringify("" + b) + '][type="radio"]');
        for (b = 0; b < c.length; b++) {
          var d = c[b];
          if (d !== a && d.form === a.form) {
            var e = Db(d);
            if (!e) throw Error(p(90));
            Wa(d);
            bb(d, e);
          }
        }
      }
      break;
    case "textarea":
      ib(a, c);
      break;
    case "select":
      b = c.value, null != b && fb(a, !!c.multiple, b, false);
  }
};
Gb = Qk;
Hb = Rk;
var sl = { usingClientEntryPoint: false, Events: [Cb, ue, Db, Eb, Fb, Qk] }, tl = { findFiberByHostInstance: Wc, bundleType: 0, version: "18.3.1", rendererPackageName: "react-dom" };
var ul = { bundleType: tl.bundleType, version: tl.version, rendererPackageName: tl.rendererPackageName, rendererConfig: tl.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: ua.ReactCurrentDispatcher, findHostInstanceByFiber: function(a) {
  a = Zb(a);
  return null === a ? null : a.stateNode;
}, findFiberByHostInstance: tl.findFiberByHostInstance || jl, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.3.1-next-f1338f8080-20240426" };
if ("undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) {
  var vl = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!vl.isDisabled && vl.supportsFiber) try {
    kc = vl.inject(ul), lc = vl;
  } catch (a) {
  }
}
reactDom_production_min.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = sl;
reactDom_production_min.createPortal = function(a, b) {
  var c = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null;
  if (!nl(b)) throw Error(p(200));
  return cl(a, b, null, c);
};
reactDom_production_min.createRoot = function(a, b) {
  if (!nl(a)) throw Error(p(299));
  var c = false, d = "", e = kl;
  null !== b && void 0 !== b && (true === b.unstable_strictMode && (c = true), void 0 !== b.identifierPrefix && (d = b.identifierPrefix), void 0 !== b.onRecoverableError && (e = b.onRecoverableError));
  b = bl(a, 1, false, null, null, c, false, d, e);
  a[uf] = b.current;
  sf(8 === a.nodeType ? a.parentNode : a);
  return new ll(b);
};
reactDom_production_min.findDOMNode = function(a) {
  if (null == a) return null;
  if (1 === a.nodeType) return a;
  var b = a._reactInternals;
  if (void 0 === b) {
    if ("function" === typeof a.render) throw Error(p(188));
    a = Object.keys(a).join(",");
    throw Error(p(268, a));
  }
  a = Zb(b);
  a = null === a ? null : a.stateNode;
  return a;
};
reactDom_production_min.flushSync = function(a) {
  return Rk(a);
};
reactDom_production_min.hydrate = function(a, b, c) {
  if (!ol(b)) throw Error(p(200));
  return rl(null, a, b, true, c);
};
reactDom_production_min.hydrateRoot = function(a, b, c) {
  if (!nl(a)) throw Error(p(405));
  var d = null != c && c.hydratedSources || null, e = false, f2 = "", g = kl;
  null !== c && void 0 !== c && (true === c.unstable_strictMode && (e = true), void 0 !== c.identifierPrefix && (f2 = c.identifierPrefix), void 0 !== c.onRecoverableError && (g = c.onRecoverableError));
  b = el(b, null, a, 1, null != c ? c : null, e, false, f2, g);
  a[uf] = b.current;
  sf(a);
  if (d) for (a = 0; a < d.length; a++) c = d[a], e = c._getVersion, e = e(c._source), null == b.mutableSourceEagerHydrationData ? b.mutableSourceEagerHydrationData = [c, e] : b.mutableSourceEagerHydrationData.push(
    c,
    e
  );
  return new ml(b);
};
reactDom_production_min.render = function(a, b, c) {
  if (!ol(b)) throw Error(p(200));
  return rl(null, a, b, false, c);
};
reactDom_production_min.unmountComponentAtNode = function(a) {
  if (!ol(a)) throw Error(p(40));
  return a._reactRootContainer ? (Rk(function() {
    rl(null, null, a, false, function() {
      a._reactRootContainer = null;
      a[uf] = null;
    });
  }), true) : false;
};
reactDom_production_min.unstable_batchedUpdates = Qk;
reactDom_production_min.unstable_renderSubtreeIntoContainer = function(a, b, c, d) {
  if (!ol(c)) throw Error(p(200));
  if (null == a || void 0 === a._reactInternals) throw Error(p(38));
  return rl(a, b, c, false, d);
};
reactDom_production_min.version = "18.3.1-next-f1338f8080-20240426";
function checkDCE() {
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== "function") {
    return;
  }
  try {
    __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
  } catch (err) {
    console.error(err);
  }
}
{
  checkDCE();
  reactDom.exports = reactDom_production_min;
}
var reactDomExports = reactDom.exports;
var createRoot;
var m = reactDomExports;
{
  createRoot = m.createRoot;
  m.hydrateRoot;
}
const MODES = [
  {
    id: "live-code",
    label: "Live Code",
    description: "Write music as code. Real-time evaluation with visualizer.",
    icon: "{ }"
  },
  {
    id: "produce",
    label: "Produce",
    description: "Arrange tracks, automate parameters, export stems.",
    icon: "▦"
  },
  {
    id: "dj-set",
    label: "DJ Set",
    description: "Mix decks, manage cues, crossfade. Score is your DJ software.",
    icon: "⊙"
  },
  {
    id: "jam-session",
    label: "Jam Session",
    description: "Perform live with MIDI hardware. Patch anything to anything.",
    icon: "⊕"
  }
];
const HARDWARE_LEVELS = [
  { id: "pc-only", label: "PC Only", description: "Keyboard + mouse" },
  { id: "controller", label: "+ Controller", description: "MIDI controller connected" },
  { id: "aio", label: "+ AIO", description: "Pioneer XDJ all-in-one" }
];
const SplashScreen = ({ onSelect }) => {
  const [selectedMode, setSelectedMode] = reactExports.useState("live-code");
  const [selectedHardware, setSelectedHardware] = reactExports.useState("pc-only");
  const activeMode = MODES.find((m2) => m2.id === selectedMode);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { style: styles$j.root, "aria-label": "Score Studio mode selector", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { style: styles$j.header, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { style: styles$j.logo, children: "Score Studio" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: styles$j.tagline, children: "What are you doing today?" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { "aria-label": "Select a mode", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { role: "group", "aria-label": "Studio modes", style: styles$j.modeGrid, children: MODES.map((m2) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        "aria-label": m2.disabled ? `${m2.label} — coming soon` : m2.label,
        "aria-pressed": selectedMode === m2.id,
        "aria-describedby": `mode-desc-${m2.id}`,
        "aria-disabled": m2.disabled,
        disabled: m2.disabled,
        style: {
          ...styles$j.modeCard,
          ...selectedMode === m2.id ? styles$j.modeCardActive : {},
          ...m2.disabled ? styles$j.modeCardDisabled : {}
        },
        onClick: () => {
          if (!m2.disabled) setSelectedMode(m2.id);
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", style: styles$j.modeIcon, children: m2.icon }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$j.modeLabel, children: m2.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { id: `mode-desc-${m2.id}`, style: styles$j.modeDesc, children: m2.disabled ? "Coming soon" : m2.description })
        ]
      },
      m2.id
    )) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { "aria-label": "Select hardware level", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { role: "group", "aria-label": "Hardware options", style: styles$j.hardwareRow, children: HARDWARE_LEVELS.map((h2) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        "aria-label": h2.label,
        "aria-pressed": selectedHardware === h2.id,
        "aria-describedby": `hw-desc-${h2.id}`,
        style: {
          ...styles$j.hwButton,
          ...selectedHardware === h2.id ? styles$j.hwButtonActive : {}
        },
        onClick: () => {
          setSelectedHardware(h2.id);
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$j.hwLabel, children: h2.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { id: `hw-desc-${h2.id}`, style: styles$j.hwDesc, children: h2.description })
        ]
      },
      h2.id
    )) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        style: {
          ...styles$j.startButton,
          ...activeMode ? {} : styles$j.startButtonDisabled
        },
        disabled: activeMode === void 0,
        "aria-label": activeMode ? `Start ${activeMode.label}` : "Select a mode to continue",
        onClick: () => {
          if (activeMode) onSelect(activeMode.id, selectedHardware);
        },
        children: activeMode ? `Start ${activeMode.label}` : "Select a mode"
      }
    )
  ] });
};
const styles$j = {
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    gap: "1.75rem",
    padding: "2rem",
    background: "linear-gradient(180deg, #0c0c0e 0%, #0e0e12 100%)"
  },
  header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.3rem"
  },
  logo: {
    fontFamily: "system-ui, sans-serif",
    fontSize: "1.6rem",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#c8d8f8",
    margin: 0
  },
  tagline: {
    fontFamily: "system-ui, sans-serif",
    fontSize: "0.8rem",
    color: "#888898",
    margin: 0,
    letterSpacing: "0.06em"
  },
  modeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "0.75rem",
    maxWidth: "860px",
    width: "100%"
  },
  modeCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.4rem",
    padding: "1.25rem 0.75rem",
    background: "#111113",
    border: "1px solid #2a2a30",
    borderRadius: "4px",
    cursor: "pointer",
    color: "#a0a0b0",
    transition: "border-color 0.1s ease, background 0.1s ease"
  },
  modeCardActive: {
    background: "#111825",
    border: "1px solid #3a6aaa",
    color: "#d8e8ff",
    boxShadow: "0 0 20px rgba(74,143,255,0.18)"
  },
  modeCardDisabled: {
    opacity: 0.35,
    cursor: "not-allowed",
    background: "#0c0c0e",
    border: "1px solid #161618"
  },
  modeIcon: {
    fontFamily: "monospace",
    fontSize: "1.5rem",
    lineHeight: 1,
    color: "#6aafff",
    opacity: 1
  },
  modeLabel: {
    fontFamily: "system-ui, sans-serif",
    fontSize: "0.85rem",
    fontWeight: 600,
    letterSpacing: "0.04em"
  },
  modeDesc: {
    fontFamily: "system-ui, sans-serif",
    fontSize: "0.7rem",
    color: "#888898",
    textAlign: "center",
    lineHeight: 1.4
  },
  hardwareRow: {
    display: "flex",
    gap: "0.5rem"
  },
  hwButton: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.15rem",
    padding: "0.5rem 1rem",
    background: "#111113",
    border: "1px solid #1e1e22",
    borderRadius: "3px",
    cursor: "pointer",
    color: "#888",
    transition: "border-color 0.1s ease, background 0.1s ease"
  },
  hwButtonActive: {
    background: "#111825",
    border: "1px solid #2a4a7a",
    color: "#c8d8f8"
  },
  hwLabel: {
    fontFamily: "system-ui, sans-serif",
    fontSize: "0.78rem",
    fontWeight: 600,
    letterSpacing: "0.04em"
  },
  hwDesc: {
    fontFamily: "system-ui, sans-serif",
    fontSize: "0.65rem",
    color: "#888898"
  },
  startButton: {
    padding: "0.6rem 2.5rem",
    fontFamily: "system-ui, sans-serif",
    fontSize: "0.85rem",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    background: "#1a3060",
    color: "#aacfff",
    border: "1px solid #3a6aaa",
    borderRadius: "3px",
    cursor: "pointer",
    transition: "all 0.1s ease"
  },
  startButtonDisabled: {
    background: "#111113",
    color: "#3e3e46",
    border: "1px solid #1e1e22",
    cursor: "not-allowed"
  }
};
const BugReportModal = ({
  isOpen,
  onClose,
  getCurrentCode,
  getRecentLogs,
  engineState
}) => {
  const [description, setDescription] = reactExports.useState("");
  const [detailsOpen, setDetailsOpen] = reactExports.useState(false);
  const [copied, setCopied] = reactExports.useState(false);
  if (!isOpen) return null;
  const buildReport = () => ({
    description,
    code: getCurrentCode(),
    logs: JSON.stringify(getRecentLogs()),
    timestamp: Date.now(),
    engineState
  });
  const handleCopy = () => {
    void navigator.clipboard.writeText(JSON.stringify(buildReport(), null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2e3);
    });
  };
  const handleSave = () => {
    window.scoreBridge.send("bug:report", buildReport());
    onClose();
  };
  const handleClose = () => {
    setDescription("");
    setDetailsOpen(false);
    setCopied(false);
    onClose();
  };
  const codePreview = getCurrentCode().split("\n").slice(0, 3).join("\n");
  const logCount = getRecentLogs().length;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { role: "dialog", "aria-modal": "true", "aria-label": "Report an issue", style: styles$i.overlay, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$i.card, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$i.header, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: styles$i.title, children: "Report an Issue" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          "aria-label": "Close",
          style: styles$i.closeBtn,
          onClick: handleClose,
          children: "✕"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { style: styles$i.label, htmlFor: "bug-description", children: "What happened?" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "textarea",
      {
        id: "bug-description",
        style: styles$i.textarea,
        rows: 4,
        placeholder: "Describe what you were doing and what went wrong...",
        value: description,
        onChange: (e) => {
          setDescription(e.target.value);
        }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        "aria-expanded": detailsOpen,
        style: styles$i.disclosureBtn,
        onClick: () => {
          setDetailsOpen((v2) => !v2);
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$i.disclosureArrow, children: detailsOpen ? "▾" : "▸" }),
          "What's included"
        ]
      }
    ),
    detailsOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$i.details, "aria-label": "Report contents", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: styles$i.detailItem, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$i.detailKey, children: "Code snapshot" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("code", { style: styles$i.codeSnippet, children: [
          codePreview,
          "\n…"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: styles$i.detailItem, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$i.detailKey, children: "Recent activity" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: styles$i.detailVal, children: [
          logCount,
          " recent ",
          logCount === 1 ? "event" : "events"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: styles$i.detailItem, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$i.detailKey, children: "Engine state" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$i.detailVal, children: "Included automatically" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: styles$i.detailItem, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$i.detailKey, children: "No personal data" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$i.detailVal, children: "Only what you see above" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$i.actions, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { style: styles$i.cancelBtn, onClick: handleClose, children: "Cancel" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { style: styles$i.copyBtn, onClick: handleCopy, "aria-live": "polite", children: copied ? "Copied ✓" : "Copy Report" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { style: styles$i.saveBtn, onClick: handleSave, children: "Save Report" })
    ] })
  ] }) });
};
const styles$i = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1e3
  },
  card: {
    background: "#0e0e11",
    border: "1px solid #1e1e22",
    borderRadius: 8,
    padding: 24,
    width: 480,
    maxWidth: "calc(100vw - 32px)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    boxShadow: "0 8px 32px rgba(0,0,0,0.6)"
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4
  },
  title: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: "#c8d8f8",
    letterSpacing: "0.02em"
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#556688",
    fontSize: 16,
    cursor: "pointer",
    padding: "2px 6px",
    borderRadius: 4,
    lineHeight: 1
  },
  label: {
    fontSize: 13,
    color: "#8899bb",
    fontWeight: 500
  },
  textarea: {
    width: "100%",
    background: "#12121a",
    border: "1px solid #2a2a35",
    borderRadius: 6,
    color: "#c8d8f8",
    fontSize: 13,
    padding: "8px 10px",
    resize: "vertical",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box"
  },
  disclosureBtn: {
    background: "none",
    border: "none",
    color: "#556688",
    fontSize: 12,
    cursor: "pointer",
    padding: 0,
    textAlign: "left",
    display: "flex",
    alignItems: "center",
    gap: 4
  },
  disclosureArrow: {
    fontSize: 10,
    color: "#445577"
  },
  details: {
    background: "#0a0a10",
    border: "1px solid #1a1a22",
    borderRadius: 6,
    padding: "10px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 6
  },
  detailItem: {
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: 2
  },
  detailKey: {
    fontSize: 11,
    color: "#445577",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em"
  },
  detailVal: {
    fontSize: 12,
    color: "#8899bb"
  },
  codeSnippet: {
    fontSize: 11,
    color: "#6a9fff",
    fontFamily: "monospace",
    whiteSpace: "pre",
    overflow: "hidden",
    maxHeight: 48,
    display: "block"
  },
  actions: {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    marginTop: 4
  },
  cancelBtn: {
    background: "none",
    border: "1px solid #2a2a35",
    color: "#8899bb",
    borderRadius: 6,
    padding: "7px 16px",
    fontSize: 13,
    cursor: "pointer"
  },
  copyBtn: {
    background: "#1a1a24",
    border: "1px solid #2a2a35",
    color: "#c8d8f8",
    borderRadius: 6,
    padding: "7px 16px",
    fontSize: 13,
    cursor: "pointer"
  },
  saveBtn: {
    background: "#4a8fff",
    border: "none",
    color: "#fff",
    borderRadius: 6,
    padding: "7px 16px",
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 600
  }
};
const TransportBar = ({ hardware, onHome, onPlay, onStop, onBpmChange, getCurrentCode, getRecentLogs, bugEngineState }) => {
  const bpmId = reactExports.useId();
  const barsId = reactExports.useId();
  const [engine, setEngine] = reactExports.useState({
    playing: false,
    bpm: 128,
    bars: 0
  });
  const [localBpm, setLocalBpm] = reactExports.useState(128);
  const [bugModalOpen, setBugModalOpen] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const off = window.scoreBridge.on("engine:state", (payload) => {
      setEngine(payload);
    });
    return off;
  }, []);
  reactExports.useEffect(() => {
    setLocalBpm(engine.bpm);
  }, [engine.bpm]);
  const toggle = () => {
    if (engine.playing) {
      if (onStop) onStop();
      else window.scoreBridge.send("transport:stop", void 0);
    } else {
      if (onPlay) onPlay();
      else window.scoreBridge.send("transport:play", void 0);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "toolbar", "aria-label": "Transport controls", style: styles$h.bar, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        "aria-label": "Score Studio home",
        style: styles$h.homeBtn,
        onClick: onHome,
        title: "Back to mode selector",
        children: "Score"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles$h.divider, "aria-hidden": "true" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        "aria-label": engine.playing ? "Stop" : "Play",
        "aria-pressed": engine.playing,
        style: engine.playing ? { ...styles$h.playBtn, ...styles$h.playBtnActive } : styles$h.playBtn,
        onClick: toggle,
        children: engine.playing ? "■" : "▶"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$h.bpmGroup, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: bpmId, style: styles$h.label, children: "BPM" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          id: bpmId,
          style: styles$h.bpmInput,
          type: "number",
          min: 20,
          max: 300,
          value: localBpm,
          onChange: (e) => {
            const bpm = Number(e.target.value);
            setLocalBpm(bpm);
            if (bpm >= 20 && bpm <= 300) {
              window.scoreBridge.send("transport:bpm-set", { bpm });
              onBpmChange?.(bpm);
            }
          }
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$h.barCount, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: barsId, style: styles$h.label, children: "Bar" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("output", { id: barsId, htmlFor: bpmId, style: styles$h.value, children: engine.bars })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$h.hwBadge, "aria-label": `Hardware: ${hardware}`, children: [
      hardware === "pc-only" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$h.hw, children: "PC" }),
      hardware === "controller" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { ...styles$h.hw, ...styles$h.hwActive }, children: "CTRL" }),
      hardware === "aio" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { ...styles$h.hw, ...styles$h.hwActive }, children: "AIO" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        "aria-label": "Report an issue",
        style: styles$h.reportBtn,
        title: "Report a bug",
        onClick: () => {
          setBugModalOpen(true);
        },
        children: "Report Issue"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      BugReportModal,
      {
        isOpen: bugModalOpen,
        onClose: () => {
          setBugModalOpen(false);
        },
        getCurrentCode: getCurrentCode ?? (() => ""),
        getRecentLogs: getRecentLogs ?? (() => []),
        engineState: bugEngineState ?? {}
      }
    )
  ] });
};
const styles$h = {
  homeBtn: {
    background: "none",
    border: "none",
    color: "#4a8fff",
    fontFamily: "system-ui, sans-serif",
    fontSize: "0.75rem",
    fontWeight: 700,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    cursor: "pointer",
    padding: "0.2rem 0.5rem",
    flexShrink: 0,
    opacity: 0.85
  },
  divider: {
    width: "1px",
    height: "18px",
    background: "#252528",
    flexShrink: 0
  },
  bar: {
    display: "flex",
    alignItems: "center",
    gap: "1.1rem",
    height: "42px",
    padding: "0 0.85rem",
    background: "#0e0e11",
    borderBottom: "1px solid #1e1e22",
    flexShrink: 0,
    userSelect: "none"
  },
  playBtn: {
    width: "30px",
    height: "30px",
    background: "#111318",
    border: "1px solid #252c3a",
    borderRadius: "3px",
    color: "#6a9fff",
    fontSize: "0.75rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all 0.1s ease"
  },
  playBtnActive: {
    background: "#152035",
    border: "1px solid #4a8fff",
    color: "#7ab0ff",
    boxShadow: "0 0 6px rgba(74,143,255,0.25)"
  },
  bpmGroup: {
    display: "flex",
    alignItems: "center",
    gap: "0.3rem"
  },
  bpmInput: {
    width: "52px",
    background: "#080809",
    border: "1px solid #1e1e22",
    borderRadius: "2px",
    color: "#c8d8f8",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: "0.8rem",
    fontVariantNumeric: "tabular-nums",
    padding: "0.12rem 0.25rem",
    textAlign: "center"
  },
  barCount: {
    display: "flex",
    alignItems: "center",
    gap: "0.3rem"
  },
  label: {
    fontFamily: "system-ui, sans-serif",
    fontSize: "0.58rem",
    color: "#3e3e46",
    letterSpacing: "0.12em",
    textTransform: "uppercase"
  },
  value: {
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: "0.8rem",
    color: "#9aadbe",
    fontVariantNumeric: "tabular-nums",
    minWidth: "2ch",
    textAlign: "right"
  },
  hwBadge: {
    // no marginLeft: auto — reportBtn takes that role now
  },
  reportBtn: {
    marginLeft: "auto",
    background: "none",
    border: "1px solid #2a2a35",
    color: "#556688",
    fontFamily: "system-ui, sans-serif",
    fontSize: "0.58rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    cursor: "pointer",
    padding: "0.12rem 0.5rem",
    borderRadius: 2,
    flexShrink: 0
  },
  hw: {
    fontFamily: "system-ui, sans-serif",
    fontSize: "0.58rem",
    color: "#3e3e46",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    padding: "0.12rem 0.4rem",
    border: "1px solid #1e1e22",
    borderRadius: "2px"
  },
  hwActive: {
    color: "#6a9fff",
    border: "1px solid #253050",
    background: "#0d1928"
  }
};
const BG_COLOR$2 = "#080809";
const ROW_HEIGHT$1 = 28;
const ROW_GAP = 2;
const LABEL_WIDTH = 52;
const STRIP_WIDTH = 4;
const CELL_GAP = 1;
const STRIP_COLOR$1 = {
  kick: "#c05a20",
  kick808: "#c05a20",
  kick909: "#d04010",
  snare: "#c02040",
  snare909: "#c02040",
  hihat: "#208060",
  hihat808: "#208060",
  bass303: "#9040c0",
  synth: "#2060a0",
  subsynth: "#2060a0",
  fmsynth: "#1a50c0",
  pad: "#206080",
  pluck: "#208060",
  arp: "#6040a0",
  sample: "#606060"
};
const STRIP_DEFAULT$1 = "#404040";
const CELL_ACTIVE = "#2a4a6a";
const CELL_INACTIVE = "#111115";
const CURSOR_OVERLAY$1 = "#4a8fff22";
const CURSOR_OVERLAY_FLASH = "#6aafff44";
const CURSOR_ACTIVE = "#4a8fff";
const CURSOR_INACTIVE = "#1a2a3a";
const EMPTY_COLOR = "#2a3a4a";
const FLASH_DURATION_MS = 80;
const resolveStripColor = (type) => STRIP_COLOR$1[type] ?? STRIP_DEFAULT$1;
const isActive = (value) => value !== 0 && value !== "";
const drawGrid = (ctx, tracks, currentStep, stepCount, width, height, flash, selectedTrack) => {
  ctx.fillStyle = BG_COLOR$2;
  ctx.fillRect(0, 0, width, height);
  if (tracks.length === 0) {
    ctx.fillStyle = EMPTY_COLOR;
    ctx.font = "12px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Waiting for song…", width / 2, height / 2);
    return;
  }
  const cellAreaWidth = width - LABEL_WIDTH;
  const cellWidth = (cellAreaWidth - (stepCount - 1) * CELL_GAP) / stepCount;
  tracks.forEach((track, rowIndex) => {
    const rowY = rowIndex * (ROW_HEIGHT$1 + ROW_GAP);
    const trackLen = track.pattern.length > 0 ? track.pattern.length : stepCount;
    const localStep = currentStep % trackLen;
    const isSelected = selectedTrack === rowIndex;
    ctx.fillStyle = isSelected ? "#0e1a2e" : "#0a0a0c";
    ctx.fillRect(0, rowY, LABEL_WIDTH, ROW_HEIGHT$1);
    ctx.fillStyle = resolveStripColor(track.type);
    ctx.fillRect(0, rowY, STRIP_WIDTH, ROW_HEIGHT$1);
    if (isSelected) {
      ctx.fillStyle = "#4a8fff";
      ctx.font = "8px monospace";
      ctx.textAlign = "right";
      ctx.fillText("▸", LABEL_WIDTH - 2, rowY + ROW_HEIGHT$1 / 2);
    }
    ctx.fillStyle = isSelected ? "#8ab8ff" : "#5a6a7a";
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const label = track.name.length > 5 ? track.name.slice(0, 5) : track.name;
    ctx.fillText(label.toUpperCase(), STRIP_WIDTH + 4, rowY + ROW_HEIGHT$1 / 2);
    Array.from({ length: stepCount }, (_2, step) => {
      const cellX = LABEL_WIDTH + step * (cellWidth + CELL_GAP);
      const patternIdx = step % trackLen;
      const isCurrent = step % trackLen === localStep;
      const active = isActive(track.pattern[patternIdx] ?? 0);
      if (step > 0 && step % trackLen === 0) {
        ctx.fillStyle = "#2a2a36";
        ctx.fillRect(cellX - CELL_GAP, rowY, CELL_GAP, ROW_HEIGHT$1);
      }
      const color = isCurrent ? active ? CURSOR_ACTIVE : CURSOR_INACTIVE : active ? CELL_ACTIVE : CELL_INACTIVE;
      ctx.fillStyle = color;
      ctx.fillRect(cellX, rowY, cellWidth, ROW_HEIGHT$1);
    });
  });
  const globalCursorStep = currentStep < stepCount ? currentStep : currentStep % stepCount;
  const cursorX = LABEL_WIDTH + globalCursorStep * (cellWidth + CELL_GAP);
  const totalHeight = tracks.length * (ROW_HEIGHT$1 + ROW_GAP) - ROW_GAP;
  ctx.fillStyle = flash ? CURSOR_OVERLAY_FLASH : CURSOR_OVERLAY$1;
  ctx.fillRect(cursorX, 0, cellWidth, totalHeight);
};
const PunchcardGrid = ({ tracks, currentStep, stepCount, onStepClick, onLabelClick, selectedTrack }) => {
  const canvasRef = reactExports.useRef(null);
  const [flash, setFlash] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (currentStep !== 0) return;
    setFlash(true);
    const id2 = setTimeout(() => {
      setFlash(false);
    }, FLASH_DURATION_MS);
    return () => {
      clearTimeout(id2);
    };
  }, [currentStep]);
  reactExports.useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const dpr = window.devicePixelRatio;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext("2d");
    if (ctx === null) return;
    ctx.scale(dpr, dpr);
    drawGrid(ctx, tracks, currentStep, stepCount, width, height, flash, selectedTrack);
  }, [tracks, currentStep, stepCount, flash, selectedTrack]);
  const handleClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x2 = e.clientX - rect.left;
    const y2 = e.clientY - rect.top;
    const trackIndex = Math.floor(y2 / (ROW_HEIGHT$1 + ROW_GAP));
    if (trackIndex < 0 || trackIndex >= tracks.length) return;
    if (x2 < LABEL_WIDTH) {
      onLabelClick?.(trackIndex);
      return;
    }
    if (!onStepClick) return;
    const track = tracks[trackIndex];
    if (!track) return;
    const trackLen = track.pattern.length > 0 ? track.pattern.length : stepCount;
    const cellAreaWidth = canvas.clientWidth - LABEL_WIDTH;
    const cellWidth = (cellAreaWidth - (trackLen - 1) * CELL_GAP) / trackLen;
    const stepIndex = Math.floor((x2 - LABEL_WIDTH) / (cellWidth + CELL_GAP));
    if (stepIndex < 0 || stepIndex >= trackLen) return;
    onStepClick(trackIndex, stepIndex);
  };
  const canvasHeight = tracks.length === 0 ? 60 : tracks.length * (ROW_HEIGHT$1 + ROW_GAP) - ROW_GAP;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "canvas",
    {
      ref: canvasRef,
      onClick: onStepClick ?? onLabelClick ? handleClick : void 0,
      style: {
        width: "100%",
        height: `${String(canvasHeight)}px`,
        display: "block",
        imageRendering: "pixelated",
        cursor: onStepClick ? "pointer" : "default"
      }
    }
  );
};
const drawScope = (canvas, waveform, playing) => {
  const dpr = window.devicePixelRatio;
  const rect = canvas.getBoundingClientRect();
  const w2 = rect.width;
  const h2 = rect.height;
  if (canvas.width !== Math.round(w2 * dpr) || canvas.height !== Math.round(h2 * dpr)) {
    canvas.width = Math.round(w2 * dpr);
    canvas.height = Math.round(h2 * dpr);
  }
  const ctx = canvas.getContext("2d");
  if (ctx === null) return;
  ctx.scale(dpr, dpr);
  ctx.fillStyle = "#080809";
  ctx.fillRect(0, 0, w2, h2);
  const centerY = h2 / 2;
  ctx.beginPath();
  ctx.strokeStyle = "#111115";
  ctx.lineWidth = 1;
  ctx.moveTo(0, centerY);
  ctx.lineTo(w2, centerY);
  ctx.stroke();
  const hasData = waveform.length > 0;
  if (playing && hasData) {
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#1a6a4a80";
    ctx.strokeStyle = "#2a8a6a";
    ctx.lineWidth = 1.5;
    const padding = h2 * 0.1;
    const drawHeight = h2 - padding * 2;
    const len = waveform.length;
    ctx.beginPath();
    Array.from({ length: len }, (_2, i) => {
      const sample = waveform[i] ?? 0;
      const x2 = len === 1 ? w2 / 2 : i / (len - 1) * w2;
      const y2 = centerY - sample * (drawHeight / 2);
      if (i === 0) {
        ctx.moveTo(x2, y2);
      } else {
        ctx.lineTo(x2, y2);
      }
    });
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
  } else {
    ctx.strokeStyle = "#1a2a2a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(w2, centerY);
    ctx.stroke();
  }
  ctx.font = "9px monospace";
  ctx.fillStyle = "#1a3a3a";
  ctx.textBaseline = "top";
  ctx.fillText("SCOPE", 6, 6);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};
const Scope = ({ waveform, playing }) => {
  const canvasRef = reactExports.useRef(null);
  const containerRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    drawScope(canvas, waveform, playing);
  }, [waveform, playing]);
  reactExports.useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (container === null || canvas === null) return;
    const observer = new ResizeObserver(() => {
      drawScope(canvas, waveform, playing);
    });
    observer.observe(container);
    return () => {
      observer.disconnect();
    };
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: containerRef, style: styles$g.container, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    "canvas",
    {
      ref: canvasRef,
      style: styles$g.canvas,
      "aria-label": "Oscilloscope waveform display",
      role: "img"
    }
  ) });
};
const styles$g = {
  container: {
    width: "100%",
    height: "100%",
    overflow: "hidden"
  },
  canvas: {
    width: "100%",
    height: "100%",
    display: "block"
  }
};
const DEFAULT_COLOR = "#6a9fff";
const BG_COLOR$1 = "#080809";
const BAR_GAP = 1;
const BASELINE_H = 2;
const GLOW_BLUR = 8;
const drawSpectrum$1 = (canvas, bins, playing, color) => {
  const dpr = window.devicePixelRatio;
  const rect = canvas.getBoundingClientRect();
  const w2 = rect.width || canvas.clientWidth || 300;
  const h2 = rect.height || canvas.clientHeight || 120;
  if (canvas.width !== Math.round(w2 * dpr) || canvas.height !== Math.round(h2 * dpr)) {
    canvas.width = Math.round(w2 * dpr);
    canvas.height = Math.round(h2 * dpr);
  }
  const ctx = canvas.getContext("2d");
  if (ctx === null) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = BG_COLOR$1;
  ctx.fillRect(0, 0, w2, h2);
  const count = bins.length;
  if (count === 0) {
    ctx.fillStyle = color;
    ctx.fillRect(0, h2 - BASELINE_H, w2, BASELINE_H);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return;
  }
  const allZero = bins.every((b) => b === 0);
  if (!playing && allZero) {
    ctx.fillStyle = color;
    ctx.fillRect(0, h2 - BASELINE_H, w2, BASELINE_H);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return;
  }
  if (playing) {
    ctx.shadowBlur = GLOW_BLUR;
    ctx.shadowColor = color;
  } else {
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
  }
  ctx.fillStyle = color;
  const barW = Math.max(1, (w2 - (count - 1) * BAR_GAP) / count);
  Array.from({ length: count }, (_2, i) => {
    const magnitude = Math.min(Math.max(bins[i] ?? 0, 0), 1);
    const barH = Math.max(magnitude * h2, BASELINE_H);
    const x2 = i * (barW + BAR_GAP);
    const y2 = h2 - barH;
    ctx.fillRect(x2, y2, barW, barH);
  });
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};
const SpectrumAnalyser = ({
  bins,
  playing,
  color = DEFAULT_COLOR
}) => {
  const canvasRef = reactExports.useRef(null);
  const containerRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    drawSpectrum$1(canvas, bins, playing, color);
  }, [bins, playing, color]);
  reactExports.useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (container === null || canvas === null) return;
    const observer = new ResizeObserver(() => {
      drawSpectrum$1(canvas, bins, playing, color);
    });
    observer.observe(container);
    return () => {
      observer.disconnect();
    };
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: containerRef, style: styles$f.container, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    "canvas",
    {
      ref: canvasRef,
      style: styles$f.canvas,
      "aria-label": "Spectrum analyser",
      role: "img",
      "data-color": color
    }
  ) });
};
const styles$f = {
  container: {
    width: "100%",
    height: "100%",
    overflow: "hidden"
  },
  canvas: {
    width: "100%",
    height: "100%",
    display: "block"
  }
};
const BG_COLOR = "#080809";
const EMPTY_TEXT_COLOR = "#2a3a4a";
const ROW_HEIGHT = 14;
const PIANO_STRIP_WIDTH = 12;
const ROW_OCTAVE_BOUND = "#0f0f14";
const ROW_BLACK_KEY = "#0b0b0f";
const ROW_WHITE_KEY = "#0e0e13";
const NOTE_NORMAL = "#4a8fff";
const NOTE_CURRENT = "#6aafff";
const CURSOR_OVERLAY = "#4a8fff18";
const CURSOR_LINE = "#4a8fff66";
const PIANO_WHITE_KEY = "#1a1a22";
const PIANO_BLACK_KEY = "#0a0a0f";
const BLACK_KEY_OFFSETS = /* @__PURE__ */ new Set([1, 3, 6, 8, 10]);
const DEFAULT_MIN_NOTE = 48;
const DEFAULT_MAX_NOTE = 72;
const isBlackKey = (note) => BLACK_KEY_OFFSETS.has(note % 12);
const rowBgColor = (note) => {
  if (note % 12 === 0) return ROW_OCTAVE_BOUND;
  if (isBlackKey(note)) return ROW_BLACK_KEY;
  return ROW_WHITE_KEY;
};
const detectNoteRange = (notes, minNoteProp, maxNoteProp) => {
  if (notes.length === 0) {
    return {
      minNote: minNoteProp ?? DEFAULT_MIN_NOTE,
      maxNote: maxNoteProp ?? DEFAULT_MAX_NOTE
    };
  }
  const pitches = notes.map((n2) => n2.pitch);
  const rawMin = Math.min(...pitches);
  const rawMax = Math.max(...pitches);
  return {
    minNote: minNoteProp ?? Math.max(0, rawMin - 2),
    maxNote: maxNoteProp ?? Math.min(127, rawMax + 2)
  };
};
const drawRoll = (ctx, notes, currentStep, stepCount, width, height, minNote, maxNote) => {
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, width, height);
  if (notes.length === 0) {
    ctx.fillStyle = EMPTY_TEXT_COLOR;
    ctx.font = "12px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("No notes", width / 2, height / 2);
    return;
  }
  const noteRange = maxNote - minNote + 1;
  const gridLeft = PIANO_STRIP_WIDTH;
  const gridWidth = width - gridLeft;
  const colWidth = gridWidth / stepCount;
  Array.from({ length: noteRange }, (_2, i) => {
    const note = maxNote - i;
    const rowY = i * ROW_HEIGHT;
    ctx.fillStyle = rowBgColor(note);
    ctx.fillRect(gridLeft, rowY, gridWidth, ROW_HEIGHT);
  });
  const cursorStep = currentStep < stepCount ? currentStep : currentStep % stepCount;
  const cursorX = gridLeft + cursorStep * colWidth;
  ctx.fillStyle = CURSOR_OVERLAY;
  ctx.fillRect(cursorX, 0, colWidth, height);
  notes.forEach((note) => {
    if (note.pitch < minNote || note.pitch > maxNote) return;
    const rowIndex = maxNote - note.pitch;
    const rowY = rowIndex * ROW_HEIGHT;
    const noteX = gridLeft + note.step * colWidth;
    const noteW = Math.max(colWidth * note.duration - 1, 1);
    const noteH = ROW_HEIGHT - 1;
    const isCurrentStepNote = note.step === cursorStep;
    ctx.fillStyle = isCurrentStepNote ? NOTE_CURRENT : NOTE_NORMAL;
    ctx.fillRect(noteX, rowY + 0.5, noteW, noteH);
  });
  ctx.fillStyle = CURSOR_LINE;
  ctx.fillRect(cursorX, 0, 1, height);
  Array.from({ length: noteRange }, (_2, i) => {
    const note = maxNote - i;
    const rowY = i * ROW_HEIGHT;
    ctx.fillStyle = isBlackKey(note) ? PIANO_BLACK_KEY : PIANO_WHITE_KEY;
    ctx.fillRect(0, rowY, PIANO_STRIP_WIDTH, ROW_HEIGHT);
  });
};
const PianoRoll = ({
  notes,
  currentStep,
  stepCount,
  minNote: minNoteProp,
  maxNote: maxNoteProp,
  onNoteClick
}) => {
  const canvasRef = reactExports.useRef(null);
  const { minNote, maxNote } = detectNoteRange(notes, minNoteProp, maxNoteProp);
  const noteRange = maxNote - minNote + 1;
  const canvasHeight = noteRange * ROW_HEIGHT;
  reactExports.useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const dpr = window.devicePixelRatio;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext("2d");
    if (ctx === null) return;
    ctx.scale(dpr, dpr);
    drawRoll(ctx, notes, currentStep, stepCount, width, height, minNote, maxNote);
  }, [notes, currentStep, stepCount, minNote, maxNote]);
  const handleClick = (e) => {
    if (!onNoteClick) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x2 = e.clientX - rect.left;
    const y2 = e.clientY - rect.top;
    const gridLeft = PIANO_STRIP_WIDTH;
    if (x2 < gridLeft) return;
    const noteRange2 = maxNote - minNote + 1;
    const rowIndex = Math.floor(y2 / ROW_HEIGHT);
    if (rowIndex < 0 || rowIndex >= noteRange2) return;
    const pitch = maxNote - rowIndex;
    const colWidth = (canvas.clientWidth - gridLeft) / stepCount;
    const step = Math.floor((x2 - gridLeft) / colWidth);
    if (step < 0 || step >= stepCount) return;
    onNoteClick(pitch, step);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "canvas",
    {
      ref: canvasRef,
      "aria-label": "Piano roll",
      role: "img",
      onClick: onNoteClick ? handleClick : void 0,
      style: {
        width: "100%",
        height: `${String(canvasHeight)}px`,
        display: "block",
        imageRendering: "pixelated",
        cursor: onNoteClick ? "pointer" : "default"
      }
    }
  );
};
const METER_W = 16;
const METER_H = 80;
const VU_BG$1 = "#141418";
const VU_GREEN$1 = "#22cc66";
const VU_YELLOW$1 = "#ccaa00";
const VU_RED$1 = "#cc2244";
const GREEN_THRESHOLD$1 = 0.7;
const YELLOW_THRESHOLD$1 = 0.85;
const computeRms$1 = (waveform) => {
  if (waveform.length === 0) return 0;
  const sumOfSquares = waveform.reduce((acc, v2) => acc + v2 * v2, 0);
  return Math.min(1, Math.sqrt(sumOfSquares / waveform.length));
};
const drawMeter = (canvas, level) => {
  const ctx = canvas.getContext("2d");
  if (ctx === null) return;
  const w2 = canvas.width;
  const h2 = canvas.height;
  const lvl = Math.min(Math.max(level, 0), 1);
  ctx.fillStyle = VU_BG$1;
  ctx.fillRect(0, 0, w2, h2);
  const fillH = lvl * h2;
  const barColor = lvl > YELLOW_THRESHOLD$1 ? VU_RED$1 : lvl > GREEN_THRESHOLD$1 ? VU_YELLOW$1 : VU_GREEN$1;
  ctx.fillStyle = barColor;
  ctx.fillRect(0, h2 - fillH, w2, fillH);
};
const MasterLevel = ({ waveform, playing }) => {
  const canvasRef = reactExports.useRef(null);
  const level = playing ? computeRms$1(waveform) : 0;
  reactExports.useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    drawMeter(canvas, level);
  }, [level]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$e.wrapper, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "canvas",
      {
        ref: canvasRef,
        "aria-label": "Master level",
        role: "img",
        width: METER_W,
        height: METER_H,
        style: styles$e.canvas
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", style: styles$e.label, children: "MASTER" })
  ] });
};
const styles$e = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    userSelect: "none"
  },
  canvas: {
    display: "block",
    width: `${String(METER_W)}px`,
    height: `${String(METER_H)}px`,
    imageRendering: "pixelated",
    border: "1px solid #1e1e22"
  },
  label: {
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: "0.6rem",
    color: "#6a6a7a",
    letterSpacing: "0.1em",
    textTransform: "uppercase"
  }
};
const STRIP_COLOR = {
  kick: "#c05a20",
  kick808: "#c05a20",
  kick909: "#d04010",
  snare: "#c02040",
  snare909: "#c02040",
  hihat: "#208060",
  hihat808: "#208060",
  bass303: "#9040c0",
  synth: "#2060a0",
  subsynth: "#2060a0",
  fmsynth: "#1a50c0",
  pad: "#206080",
  pluck: "#208060",
  arp: "#6040a0",
  sample: "#606060"
};
const STRIP_DEFAULT = "#404040";
const VU_GREEN = "#22cc66";
const VU_YELLOW = "#ccaa00";
const VU_RED = "#cc2244";
const VU_BG = "#0a0a0d";
const GREEN_THRESHOLD = 0.7;
const YELLOW_THRESHOLD = 0.85;
const drawVU = (canvas, level) => {
  const ctx = canvas.getContext("2d");
  if (ctx === null) return;
  const w2 = canvas.width;
  const h2 = canvas.height;
  const lvl = Math.min(Math.max(level, 0), 1);
  ctx.fillStyle = VU_BG;
  ctx.fillRect(0, 0, w2, h2);
  const fillH = lvl * h2;
  const barColor = lvl > YELLOW_THRESHOLD ? VU_RED : lvl > GREEN_THRESHOLD ? VU_YELLOW : VU_GREEN;
  ctx.fillStyle = barColor;
  ctx.fillRect(0, h2 - fillH, w2, fillH);
};
const MixerStrip = ({
  name,
  type,
  volume,
  muted,
  level,
  onVolume,
  onMute
}) => {
  const canvasRef = reactExports.useRef(null);
  const accentColor = STRIP_COLOR[type] ?? STRIP_DEFAULT;
  reactExports.useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    drawVU(canvas, level);
  }, [level]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "aria-label": `${name} channel strip`,
      style: styles$d.strip,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            "aria-hidden": "true",
            style: { ...styles$d.accentBar, background: accentColor }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            "aria-label": `Track: ${name}`,
            style: styles$d.trackName,
            title: name,
            children: name
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            "aria-label": muted ? `Unmute ${name}` : `Mute ${name}`,
            "aria-pressed": muted,
            style: muted ? { ...styles$d.muteBtn, ...styles$d.muteBtnActive } : styles$d.muteBtn,
            onClick: onMute,
            children: "M"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            "aria-label": `${name} volume`,
            type: "range",
            min: 0,
            max: 1,
            step: 0.01,
            value: volume,
            style: styles$d.fader,
            onChange: (e) => {
              onVolume(Number(e.target.value));
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "canvas",
          {
            ref: canvasRef,
            "aria-label": `${name} level`,
            role: "img",
            width: 4,
            height: 44,
            style: styles$d.vuCanvas
          }
        )
      ]
    }
  );
};
const styles$d = {
  strip: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "56px",
    background: "#0d0d10",
    border: "1px solid #1e1e22",
    boxSizing: "border-box",
    padding: "0 0 4px",
    gap: "3px",
    userSelect: "none",
    flexShrink: 0
  },
  accentBar: {
    width: "100%",
    height: "4px",
    flexShrink: 0
  },
  trackName: {
    width: "100%",
    fontSize: "0.6rem",
    color: "#6a6a7a",
    fontFamily: "system-ui, sans-serif",
    textAlign: "center",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    padding: "2px 3px 0",
    boxSizing: "border-box",
    letterSpacing: "0.05em"
  },
  muteBtn: {
    width: "28px",
    height: "20px",
    background: "#1a1a22",
    border: "1px solid #2a2a36",
    borderRadius: "2px",
    color: "#6a6a7a",
    fontSize: "0.65rem",
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    padding: 0,
    letterSpacing: "0.05em"
  },
  muteBtnActive: {
    background: "#ffcc00",
    border: "1px solid #cc9900",
    color: "#1a1000"
  },
  fader: {
    // writingMode makes the range input render vertically in modern browsers.
    // WebkitAppearance is kept for older Chromium (Electron) builds.
    writingMode: "vertical-lr",
    direction: "rtl",
    WebkitAppearance: "slider-vertical",
    width: "28px",
    height: "60px",
    cursor: "pointer",
    accentColor: "#4a8fff",
    flexShrink: 0
  },
  vuCanvas: {
    display: "block",
    width: "4px",
    height: "44px",
    imageRendering: "pixelated",
    flexShrink: 0
  }
};
const MIN_W = 120;
const MIN_H = 80;
const TITLE_H = 28;
const HANDLE_SIZE = 8;
const DraggablePanel = (props) => {
  const {
    title,
    children,
    defaultX = 40,
    defaultY = 40,
    defaultWidth = 320,
    defaultHeight = 240,
    onClose,
    panelId,
    onMoved
  } = props;
  const [pos, setPos] = reactExports.useState({ x: defaultX, y: defaultY });
  const [size, setSize] = reactExports.useState({ w: defaultWidth, h: defaultHeight });
  const [dragging, setDragging] = reactExports.useState(false);
  const [resizing, setResizing] = reactExports.useState(false);
  const dragOrigin = reactExports.useRef(null);
  const resizeOrigin = reactExports.useRef(null);
  const posRef = reactExports.useRef(pos);
  const sizeRef = reactExports.useRef(size);
  const onTitleMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    dragOrigin.current = { mx: e.clientX, my: e.clientY, ox: pos.x, oy: pos.y };
  };
  reactExports.useEffect(() => {
    if (!dragging) return;
    const onMouseMove = (e) => {
      const origin = dragOrigin.current;
      if (origin === null) return;
      const newPos = {
        x: origin.ox + (e.clientX - origin.mx),
        y: origin.oy + (e.clientY - origin.my)
      };
      posRef.current = newPos;
      setPos(newPos);
    };
    const onMouseUp = () => {
      setDragging(false);
      dragOrigin.current = null;
      if (panelId && onMoved) {
        const { x: x2, y: y2 } = posRef.current;
        const { w: w2, h: h2 } = sizeRef.current;
        onMoved(panelId, x2, y2, w2, h2);
      }
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging, panelId, onMoved]);
  const onHandleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing(true);
    resizeOrigin.current = { mx: e.clientX, my: e.clientY, ox: size.w, oy: size.h };
  };
  reactExports.useEffect(() => {
    if (!resizing) return;
    const onMouseMove = (e) => {
      const origin = resizeOrigin.current;
      if (origin === null) return;
      const newSize = {
        w: Math.max(MIN_W, origin.ox + (e.clientX - origin.mx)),
        h: Math.max(MIN_H, origin.oy + (e.clientY - origin.my))
      };
      sizeRef.current = newSize;
      setSize(newSize);
    };
    const onMouseUp = () => {
      setResizing(false);
      resizeOrigin.current = null;
      if (panelId && onMoved) {
        const { x: x2, y: y2 } = posRef.current;
        const { w: w2, h: h2 } = sizeRef.current;
        onMoved(panelId, x2, y2, w2, h2);
      }
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [resizing, panelId, onMoved]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "aria-label": title,
      style: {
        ...styles$c.panel,
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: size.h
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            role: "heading",
            "aria-level": 3,
            style: {
              ...styles$c.titleBar,
              cursor: dragging ? "grabbing" : "grab"
            },
            onMouseDown: onTitleMouseDown,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$c.titleText, children: title }),
              onClose !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  "aria-label": `Close ${title}`,
                  style: styles$c.closeBtn,
                  onMouseDown: (e) => {
                    e.stopPropagation();
                  },
                  onClick: onClose,
                  children: "×"
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles$c.body, children }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            "aria-label": "Resize panel",
            role: "separator",
            style: styles$c.resizeHandle,
            onMouseDown: onHandleMouseDown
          }
        )
      ]
    }
  );
};
const styles$c = {
  panel: {
    position: "absolute",
    zIndex: 100,
    border: "1px solid #2a2a36",
    background: "#0d0d10",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxSizing: "border-box",
    userSelect: "none"
  },
  titleBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: `${String(TITLE_H)}px`,
    flexShrink: 0,
    padding: "0 6px 0 8px",
    background: "#141418",
    borderBottom: "1px solid #1e1e22"
  },
  titleText: {
    color: "#6a9fff",
    fontSize: "0.7rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontFamily: "system-ui, sans-serif",
    fontWeight: 600,
    pointerEvents: "none"
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#6a9fff",
    fontSize: "1rem",
    lineHeight: 1,
    cursor: "pointer",
    padding: "0 2px",
    opacity: 0.7,
    flexShrink: 0
  },
  body: {
    flex: 1,
    overflow: "auto"
  },
  resizeHandle: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: `${String(HANDLE_SIZE)}px`,
    height: `${String(HANDLE_SIZE)}px`,
    background: "#2a2a36",
    cursor: "se-resize",
    flexShrink: 0
  }
};
const drawBeatViz = (ctx, waveform, currentStep, stepCount, width, height, playing) => {
  ctx.clearRect(0, 0, width, height);
  if (!playing) return;
  const rms = Math.sqrt(
    waveform.reduce((s, v2) => s + v2 * v2, 0) / Math.max(waveform.length, 1)
  );
  const intensity = Math.min(rms * 8, 1);
  if (intensity > 0.01) {
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      width * 0.7
    );
    gradient.addColorStop(0, `rgba(74, 143, 255, ${String(intensity * 0.06)})`);
    gradient.addColorStop(1, "rgba(74, 143, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
  if (stepCount > 0) {
    const progress = currentStep / stepCount;
    ctx.fillStyle = "rgba(74, 143, 255, 0.5)";
    ctx.fillRect(0, 0, width * progress, 2);
  }
};
const CodeWaveform = ({ waveform, playing, currentStep, stepCount }) => {
  const canvasRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const dpr = window.devicePixelRatio;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) return;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext("2d");
    if (ctx === null) return;
    ctx.scale(dpr, dpr);
    drawBeatViz(ctx, waveform, currentStep, stepCount, width, height, playing);
  }, [waveform, playing, currentStep, stepCount]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "canvas",
    {
      ref: canvasRef,
      "aria-hidden": "true",
      style: styles$b.canvas
    }
  );
};
const styles$b = {
  canvas: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    imageRendering: "pixelated",
    zIndex: 0
  }
};
const TRACK_LINE_RE = /(?:Track\(|=\s*(?:Kick(?:808|909)?|Snare(?:909)?|HiHat(?:808)?|Hihat(?:808)?|Bass303|Pad|Rhodes|Pluck|Synth|Sample|Theremin|Sax|Arp|SubSynth|FMSynth)\s*\()/;
const getTrackLines = (code, tracks) => {
  if (tracks.length === 0) return [];
  const lines = code.split("\n");
  const trackLineIndices = [];
  lines.forEach((line, i) => {
    if (TRACK_LINE_RE.test(line)) trackLineIndices.push(i);
  });
  const result = [];
  tracks.forEach((_2, i) => {
    const lineIdx = trackLineIndices[i];
    if (lineIdx !== void 0) {
      result.push({ lineIndex: lineIdx, trackIndex: i });
    }
  });
  return result;
};
const getActiveLines = (code, tracks, currentStep) => {
  if (tracks.length === 0) return [];
  const lines = code.split("\n");
  const trackLineIndices = [];
  lines.forEach((line, i) => {
    if (TRACK_LINE_RE.test(line)) trackLineIndices.push(i);
  });
  const result = [];
  tracks.forEach((track, i) => {
    const lineIdx = trackLineIndices[i];
    if (lineIdx === void 0) return;
    const len = track.pattern.length;
    if (len === 0) return;
    const val = track.pattern[currentStep % len];
    if (val) result.push(lineIdx);
  });
  return result.sort((a, b) => a - b);
};
const getStepBadges = (code, tracks, currentStep, defaultStepCount) => {
  if (tracks.length === 0) return [];
  const trackLines = getTrackLines(code, tracks);
  return trackLines.map(({ lineIndex, trackIndex }) => {
    const track = tracks[trackIndex];
    if (!track) return null;
    const total = track.pattern.length > 0 ? track.pattern.length : defaultStepCount;
    return { line: lineIndex + 1, step: currentStep % total, total };
  }).filter((b) => b !== null);
};
function _arrayLikeToArray(r2, a) {
  (null == a || a > r2.length) && (a = r2.length);
  for (var e = 0, n2 = Array(a); e < a; e++) n2[e] = r2[e];
  return n2;
}
function _arrayWithHoles(r2) {
  if (Array.isArray(r2)) return r2;
}
function _defineProperty$1(e, r2, t2) {
  return (r2 = _toPropertyKey(r2)) in e ? Object.defineProperty(e, r2, {
    value: t2,
    enumerable: true,
    configurable: true,
    writable: true
  }) : e[r2] = t2, e;
}
function _iterableToArrayLimit(r2, l2) {
  var t2 = null == r2 ? null : "undefined" != typeof Symbol && r2[Symbol.iterator] || r2["@@iterator"];
  if (null != t2) {
    var e, n2, i, u2, a = [], f2 = true, o = false;
    try {
      if (i = (t2 = t2.call(r2)).next, 0 === l2) ;
      else for (; !(f2 = (e = i.call(t2)).done) && (a.push(e.value), a.length !== l2); f2 = true) ;
    } catch (r3) {
      o = true, n2 = r3;
    } finally {
      try {
        if (!f2 && null != t2.return && (u2 = t2.return(), Object(u2) !== u2)) return;
      } finally {
        if (o) throw n2;
      }
    }
    return a;
  }
}
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function ownKeys$1(e, r2) {
  var t2 = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r2 && (o = o.filter(function(r3) {
      return Object.getOwnPropertyDescriptor(e, r3).enumerable;
    })), t2.push.apply(t2, o);
  }
  return t2;
}
function _objectSpread2$1(e) {
  for (var r2 = 1; r2 < arguments.length; r2++) {
    var t2 = null != arguments[r2] ? arguments[r2] : {};
    r2 % 2 ? ownKeys$1(Object(t2), true).forEach(function(r3) {
      _defineProperty$1(e, r3, t2[r3]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t2)) : ownKeys$1(Object(t2)).forEach(function(r3) {
      Object.defineProperty(e, r3, Object.getOwnPropertyDescriptor(t2, r3));
    });
  }
  return e;
}
function _objectWithoutProperties(e, t2) {
  if (null == e) return {};
  var o, r2, i = _objectWithoutPropertiesLoose(e, t2);
  if (Object.getOwnPropertySymbols) {
    var n2 = Object.getOwnPropertySymbols(e);
    for (r2 = 0; r2 < n2.length; r2++) o = n2[r2], -1 === t2.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
  }
  return i;
}
function _objectWithoutPropertiesLoose(r2, e) {
  if (null == r2) return {};
  var t2 = {};
  for (var n2 in r2) if ({}.hasOwnProperty.call(r2, n2)) {
    if (-1 !== e.indexOf(n2)) continue;
    t2[n2] = r2[n2];
  }
  return t2;
}
function _slicedToArray(r2, e) {
  return _arrayWithHoles(r2) || _iterableToArrayLimit(r2, e) || _unsupportedIterableToArray(r2, e) || _nonIterableRest();
}
function _toPrimitive(t2, r2) {
  if ("object" != typeof t2 || !t2) return t2;
  var e = t2[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t2, r2);
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r2 ? String : Number)(t2);
}
function _toPropertyKey(t2) {
  var i = _toPrimitive(t2, "string");
  return "symbol" == typeof i ? i : i + "";
}
function _unsupportedIterableToArray(r2, a) {
  if (r2) {
    if ("string" == typeof r2) return _arrayLikeToArray(r2, a);
    var t2 = {}.toString.call(r2).slice(8, -1);
    return "Object" === t2 && r2.constructor && (t2 = r2.constructor.name), "Map" === t2 || "Set" === t2 ? Array.from(r2) : "Arguments" === t2 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t2) ? _arrayLikeToArray(r2, a) : void 0;
  }
}
function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function(sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }
  return keys;
}
function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    if (i % 2) {
      ownKeys(Object(source), true).forEach(function(key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function(key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }
  return target;
}
function compose$1() {
  for (var _len = arguments.length, fns = new Array(_len), _key = 0; _key < _len; _key++) {
    fns[_key] = arguments[_key];
  }
  return function(x2) {
    return fns.reduceRight(function(y2, f2) {
      return f2(y2);
    }, x2);
  };
}
function curry$1(fn) {
  return function curried() {
    var _this = this;
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }
    return args.length >= fn.length ? fn.apply(this, args) : function() {
      for (var _len3 = arguments.length, nextArgs = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        nextArgs[_key3] = arguments[_key3];
      }
      return curried.apply(_this, [].concat(args, nextArgs));
    };
  };
}
function isObject$1(value) {
  return {}.toString.call(value).includes("Object");
}
function isEmpty(obj) {
  return !Object.keys(obj).length;
}
function isFunction(value) {
  return typeof value === "function";
}
function hasOwnProperty(object, property) {
  return Object.prototype.hasOwnProperty.call(object, property);
}
function validateChanges(initial, changes) {
  if (!isObject$1(changes)) errorHandler$1("changeType");
  if (Object.keys(changes).some(function(field) {
    return !hasOwnProperty(initial, field);
  })) errorHandler$1("changeField");
  return changes;
}
function validateSelector(selector) {
  if (!isFunction(selector)) errorHandler$1("selectorType");
}
function validateHandler(handler) {
  if (!(isFunction(handler) || isObject$1(handler))) errorHandler$1("handlerType");
  if (isObject$1(handler) && Object.values(handler).some(function(_handler) {
    return !isFunction(_handler);
  })) errorHandler$1("handlersType");
}
function validateInitial(initial) {
  if (!initial) errorHandler$1("initialIsRequired");
  if (!isObject$1(initial)) errorHandler$1("initialType");
  if (isEmpty(initial)) errorHandler$1("initialContent");
}
function throwError$1(errorMessages2, type) {
  throw new Error(errorMessages2[type] || errorMessages2["default"]);
}
var errorMessages$1 = {
  initialIsRequired: "initial state is required",
  initialType: "initial state should be an object",
  initialContent: "initial state shouldn't be an empty object",
  handlerType: "handler should be an object or a function",
  handlersType: "all handlers should be a functions",
  selectorType: "selector should be a function",
  changeType: "provided value of changes should be an object",
  changeField: 'it seams you want to change a field in the state which is not specified in the "initial" state',
  "default": "an unknown error accured in `state-local` package"
};
var errorHandler$1 = curry$1(throwError$1)(errorMessages$1);
var validators$1 = {
  changes: validateChanges,
  selector: validateSelector,
  handler: validateHandler,
  initial: validateInitial
};
function create(initial) {
  var handler = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  validators$1.initial(initial);
  validators$1.handler(handler);
  var state = {
    current: initial
  };
  var didUpdate = curry$1(didStateUpdate)(state, handler);
  var update = curry$1(updateState)(state);
  var validate = curry$1(validators$1.changes)(initial);
  var getChanges = curry$1(extractChanges)(state);
  function getState2() {
    var selector = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : function(state2) {
      return state2;
    };
    validators$1.selector(selector);
    return selector(state.current);
  }
  function setState2(causedChanges) {
    compose$1(didUpdate, update, validate, getChanges)(causedChanges);
  }
  return [getState2, setState2];
}
function extractChanges(state, causedChanges) {
  return isFunction(causedChanges) ? causedChanges(state.current) : causedChanges;
}
function updateState(state, changes) {
  state.current = _objectSpread2(_objectSpread2({}, state.current), changes);
  return changes;
}
function didStateUpdate(state, handler, changes) {
  isFunction(handler) ? handler(state.current) : Object.keys(changes).forEach(function(field) {
    var _handler$field;
    return (_handler$field = handler[field]) === null || _handler$field === void 0 ? void 0 : _handler$field.call(handler, state.current[field]);
  });
  return changes;
}
var index = {
  create
};
var config$1 = {
  paths: {
    vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs"
  }
};
function curry(fn) {
  return function curried() {
    var _this = this;
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    return args.length >= fn.length ? fn.apply(this, args) : function() {
      for (var _len2 = arguments.length, nextArgs = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        nextArgs[_key2] = arguments[_key2];
      }
      return curried.apply(_this, [].concat(args, nextArgs));
    };
  };
}
function isObject(value) {
  return {}.toString.call(value).includes("Object");
}
function validateConfig(config2) {
  if (!config2) errorHandler("configIsRequired");
  if (!isObject(config2)) errorHandler("configType");
  if (config2.urls) {
    informAboutDeprecation();
    return {
      paths: {
        vs: config2.urls.monacoBase
      }
    };
  }
  return config2;
}
function informAboutDeprecation() {
  console.warn(errorMessages.deprecation);
}
function throwError(errorMessages2, type) {
  throw new Error(errorMessages2[type] || errorMessages2["default"]);
}
var errorMessages = {
  configIsRequired: "the configuration object is required",
  configType: "the configuration object should be an object",
  "default": "an unknown error accured in `@monaco-editor/loader` package",
  deprecation: "Deprecation warning!\n    You are using deprecated way of configuration.\n\n    Instead of using\n      monaco.config({ urls: { monacoBase: '...' } })\n    use\n      monaco.config({ paths: { vs: '...' } })\n\n    For more please check the link https://github.com/suren-atoyan/monaco-loader#config\n  "
};
var errorHandler = curry(throwError)(errorMessages);
var validators = {
  config: validateConfig
};
var compose = function compose2() {
  for (var _len = arguments.length, fns = new Array(_len), _key = 0; _key < _len; _key++) {
    fns[_key] = arguments[_key];
  }
  return function(x2) {
    return fns.reduceRight(function(y2, f2) {
      return f2(y2);
    }, x2);
  };
};
function merge(target, source) {
  Object.keys(source).forEach(function(key) {
    if (source[key] instanceof Object) {
      if (target[key]) {
        Object.assign(source[key], merge(target[key], source[key]));
      }
    }
  });
  return _objectSpread2$1(_objectSpread2$1({}, target), source);
}
var CANCELATION_MESSAGE = {
  type: "cancelation",
  msg: "operation is manually canceled"
};
function makeCancelable(promise) {
  var hasCanceled_ = false;
  var wrappedPromise = new Promise(function(resolve, reject) {
    promise.then(function(val) {
      return hasCanceled_ ? reject(CANCELATION_MESSAGE) : resolve(val);
    });
    promise["catch"](reject);
  });
  return wrappedPromise.cancel = function() {
    return hasCanceled_ = true;
  }, wrappedPromise;
}
var _excluded = ["monaco"];
var _state$create = index.create({
  config: config$1,
  isInitialized: false,
  resolve: null,
  reject: null,
  monaco: null
}), _state$create2 = _slicedToArray(_state$create, 2), getState = _state$create2[0], setState = _state$create2[1];
function config(globalConfig) {
  var _validators$config = validators.config(globalConfig), monaco = _validators$config.monaco, config2 = _objectWithoutProperties(_validators$config, _excluded);
  setState(function(state) {
    return {
      config: merge(state.config, config2),
      monaco
    };
  });
}
function init() {
  var state = getState(function(_ref) {
    var monaco = _ref.monaco, isInitialized = _ref.isInitialized, resolve = _ref.resolve;
    return {
      monaco,
      isInitialized,
      resolve
    };
  });
  if (!state.isInitialized) {
    setState({
      isInitialized: true
    });
    if (state.monaco) {
      state.resolve(state.monaco);
      return makeCancelable(wrapperPromise);
    }
    if (window.monaco && window.monaco.editor) {
      storeMonacoInstance(window.monaco);
      state.resolve(window.monaco);
      return makeCancelable(wrapperPromise);
    }
    compose(injectScripts, getMonacoLoaderScript)(configureLoader);
  }
  return makeCancelable(wrapperPromise);
}
function injectScripts(script) {
  return document.body.appendChild(script);
}
function createScript(src) {
  var script = document.createElement("script");
  return src && (script.src = src), script;
}
function getMonacoLoaderScript(configureLoader2) {
  var state = getState(function(_ref2) {
    var config2 = _ref2.config, reject = _ref2.reject;
    return {
      config: config2,
      reject
    };
  });
  var loaderScript = createScript("".concat(state.config.paths.vs, "/loader.js"));
  loaderScript.onload = function() {
    return configureLoader2();
  };
  loaderScript.onerror = state.reject;
  return loaderScript;
}
function configureLoader() {
  var state = getState(function(_ref3) {
    var config2 = _ref3.config, resolve = _ref3.resolve, reject = _ref3.reject;
    return {
      config: config2,
      resolve,
      reject
    };
  });
  var require2 = window.require;
  require2.config(state.config);
  require2(["vs/editor/editor.main"], function(loaded) {
    var monaco = loaded.m || loaded;
    storeMonacoInstance(monaco);
    state.resolve(monaco);
  }, function(error) {
    state.reject(error);
  });
}
function storeMonacoInstance(monaco) {
  if (!getState().monaco) {
    setState({
      monaco
    });
  }
}
function __getMonacoInstance() {
  return getState(function(_ref4) {
    var monaco = _ref4.monaco;
    return monaco;
  });
}
var wrapperPromise = new Promise(function(resolve, reject) {
  return setState({
    resolve,
    reject
  });
});
var loader = {
  config,
  init,
  __getMonacoInstance
};
var le = { wrapper: { display: "flex", position: "relative", textAlign: "initial" }, fullWidth: { width: "100%" }, hide: { display: "none" } }, v = le;
var ae = { container: { display: "flex", height: "100%", width: "100%", justifyContent: "center", alignItems: "center" } }, Y = ae;
function Me({ children: e }) {
  return React.createElement("div", { style: Y.container }, e);
}
var Z = Me;
var $ = Z;
function Ee({ width: e, height: r2, isEditorReady: n2, loading: t2, _ref: a, className: m2, wrapperProps: E2 }) {
  return React.createElement("section", { style: { ...v.wrapper, width: e, height: r2 }, ...E2 }, !n2 && React.createElement($, null, t2), React.createElement("div", { ref: a, style: { ...v.fullWidth, ...!n2 && v.hide }, className: m2 }));
}
var ee = Ee;
var H = reactExports.memo(ee);
function Ce(e) {
  reactExports.useEffect(e, []);
}
var k = Ce;
function he(e, r2, n2 = true) {
  let t2 = reactExports.useRef(true);
  reactExports.useEffect(t2.current || !n2 ? () => {
    t2.current = false;
  } : e, r2);
}
var l = he;
function D() {
}
function h(e, r2, n2, t2) {
  return De(e, t2) || be(e, r2, n2, t2);
}
function De(e, r2) {
  return e.editor.getModel(te(e, r2));
}
function be(e, r2, n2, t2) {
  return e.editor.createModel(r2, n2, t2 ? te(e, t2) : void 0);
}
function te(e, r2) {
  return e.Uri.parse(r2);
}
function Oe({ original: e, modified: r2, language: n2, originalLanguage: t2, modifiedLanguage: a, originalModelPath: m2, modifiedModelPath: E2, keepCurrentOriginalModel: g = false, keepCurrentModifiedModel: N2 = false, theme: x2 = "light", loading: P2 = "Loading...", options: y2 = {}, height: V2 = "100%", width: z2 = "100%", className: F2, wrapperProps: j = {}, beforeMount: A2 = D, onMount: q2 = D }) {
  let [M2, O2] = reactExports.useState(false), [T2, s] = reactExports.useState(true), u2 = reactExports.useRef(null), c = reactExports.useRef(null), w2 = reactExports.useRef(null), d = reactExports.useRef(q2), o = reactExports.useRef(A2), b = reactExports.useRef(false);
  k(() => {
    let i = loader.init();
    return i.then((f2) => (c.current = f2) && s(false)).catch((f2) => f2?.type !== "cancelation" && console.error("Monaco initialization: error:", f2)), () => u2.current ? I2() : i.cancel();
  }), l(() => {
    if (u2.current && c.current) {
      let i = u2.current.getOriginalEditor(), f2 = h(c.current, e || "", t2 || n2 || "text", m2 || "");
      f2 !== i.getModel() && i.setModel(f2);
    }
  }, [m2], M2), l(() => {
    if (u2.current && c.current) {
      let i = u2.current.getModifiedEditor(), f2 = h(c.current, r2 || "", a || n2 || "text", E2 || "");
      f2 !== i.getModel() && i.setModel(f2);
    }
  }, [E2], M2), l(() => {
    let i = u2.current.getModifiedEditor();
    i.getOption(c.current.editor.EditorOption.readOnly) ? i.setValue(r2 || "") : r2 !== i.getValue() && (i.executeEdits("", [{ range: i.getModel().getFullModelRange(), text: r2 || "", forceMoveMarkers: true }]), i.pushUndoStop());
  }, [r2], M2), l(() => {
    u2.current?.getModel()?.original.setValue(e || "");
  }, [e], M2), l(() => {
    let { original: i, modified: f2 } = u2.current.getModel();
    c.current.editor.setModelLanguage(i, t2 || n2 || "text"), c.current.editor.setModelLanguage(f2, a || n2 || "text");
  }, [n2, t2, a], M2), l(() => {
    c.current?.editor.setTheme(x2);
  }, [x2], M2), l(() => {
    u2.current?.updateOptions(y2);
  }, [y2], M2);
  let L2 = reactExports.useCallback(() => {
    if (!c.current) return;
    o.current(c.current);
    let i = h(c.current, e || "", t2 || n2 || "text", m2 || ""), f2 = h(c.current, r2 || "", a || n2 || "text", E2 || "");
    u2.current?.setModel({ original: i, modified: f2 });
  }, [n2, r2, a, e, t2, m2, E2]), U2 = reactExports.useCallback(() => {
    !b.current && w2.current && (u2.current = c.current.editor.createDiffEditor(w2.current, { automaticLayout: true, ...y2 }), L2(), c.current?.editor.setTheme(x2), O2(true), b.current = true);
  }, [y2, x2, L2]);
  reactExports.useEffect(() => {
    M2 && d.current(u2.current, c.current);
  }, [M2]), reactExports.useEffect(() => {
    !T2 && !M2 && U2();
  }, [T2, M2, U2]);
  function I2() {
    let i = u2.current?.getModel();
    g || i?.original?.dispose(), N2 || i?.modified?.dispose(), u2.current?.dispose();
  }
  return React.createElement(H, { width: z2, height: V2, isEditorReady: M2, loading: P2, _ref: w2, className: F2, wrapperProps: j });
}
var ie = Oe;
reactExports.memo(ie);
function He(e) {
  let r2 = reactExports.useRef();
  return reactExports.useEffect(() => {
    r2.current = e;
  }, [e]), r2.current;
}
var se = He;
var _ = /* @__PURE__ */ new Map();
function Ve({ defaultValue: e, defaultLanguage: r2, defaultPath: n2, value: t2, language: a, path: m2, theme: E2 = "light", line: g, loading: N2 = "Loading...", options: x2 = {}, overrideServices: P2 = {}, saveViewState: y2 = true, keepCurrentModel: V2 = false, width: z2 = "100%", height: F2 = "100%", className: j, wrapperProps: A2 = {}, beforeMount: q2 = D, onMount: M2 = D, onChange: O2, onValidate: T2 = D }) {
  let [s, u2] = reactExports.useState(false), [c, w2] = reactExports.useState(true), d = reactExports.useRef(null), o = reactExports.useRef(null), b = reactExports.useRef(null), L2 = reactExports.useRef(M2), U2 = reactExports.useRef(q2), I2 = reactExports.useRef(), i = reactExports.useRef(t2), f2 = se(m2), Q2 = reactExports.useRef(false), B2 = reactExports.useRef(false);
  k(() => {
    let p2 = loader.init();
    return p2.then((R2) => (d.current = R2) && w2(false)).catch((R2) => R2?.type !== "cancelation" && console.error("Monaco initialization: error:", R2)), () => o.current ? pe2() : p2.cancel();
  }), l(() => {
    let p2 = h(d.current, e || t2 || "", r2 || a || "", m2 || n2 || "");
    p2 !== o.current?.getModel() && (y2 && _.set(f2, o.current?.saveViewState()), o.current?.setModel(p2), y2 && o.current?.restoreViewState(_.get(m2)));
  }, [m2], s), l(() => {
    o.current?.updateOptions(x2);
  }, [x2], s), l(() => {
    !o.current || t2 === void 0 || (o.current.getOption(d.current.editor.EditorOption.readOnly) ? o.current.setValue(t2) : t2 !== o.current.getValue() && (B2.current = true, o.current.executeEdits("", [{ range: o.current.getModel().getFullModelRange(), text: t2, forceMoveMarkers: true }]), o.current.pushUndoStop(), B2.current = false));
  }, [t2], s), l(() => {
    let p2 = o.current?.getModel();
    p2 && a && d.current?.editor.setModelLanguage(p2, a);
  }, [a], s), l(() => {
    g !== void 0 && o.current?.revealLine(g);
  }, [g], s), l(() => {
    d.current?.editor.setTheme(E2);
  }, [E2], s);
  let X2 = reactExports.useCallback(() => {
    if (!(!b.current || !d.current) && !Q2.current) {
      U2.current(d.current);
      let p2 = m2 || n2, R2 = h(d.current, t2 || e || "", r2 || a || "", p2 || "");
      o.current = d.current?.editor.create(b.current, { model: R2, automaticLayout: true, ...x2 }, P2), y2 && o.current.restoreViewState(_.get(p2)), d.current.editor.setTheme(E2), g !== void 0 && o.current.revealLine(g), u2(true), Q2.current = true;
    }
  }, [e, r2, n2, t2, a, m2, x2, P2, y2, E2, g]);
  reactExports.useEffect(() => {
    s && L2.current(o.current, d.current);
  }, [s]), reactExports.useEffect(() => {
    !c && !s && X2();
  }, [c, s, X2]), i.current = t2, reactExports.useEffect(() => {
    s && O2 && (I2.current?.dispose(), I2.current = o.current?.onDidChangeModelContent((p2) => {
      B2.current || O2(o.current.getValue(), p2);
    }));
  }, [s, O2]), reactExports.useEffect(() => {
    if (s) {
      let p2 = d.current.editor.onDidChangeMarkers((R2) => {
        let G2 = o.current.getModel()?.uri;
        if (G2 && R2.find((J2) => J2.path === G2.path)) {
          let J2 = d.current.editor.getModelMarkers({ resource: G2 });
          T2?.(J2);
        }
      });
      return () => {
        p2?.dispose();
      };
    }
    return () => {
    };
  }, [s, T2]);
  function pe2() {
    I2.current?.dispose(), V2 ? y2 && _.set(m2, o.current.saveViewState()) : o.current.getModel()?.dispose(), o.current.dispose();
  }
  return React.createElement(H, { width: z2, height: F2, isEditorReady: s, loading: N2, _ref: b, className: j, wrapperProps: A2 });
}
var fe = Ve;
var de = reactExports.memo(fe);
var Ft = de;
const registerScoreDslLanguage = (monaco) => {
  const existing = monaco.languages.getLanguages().find((l2) => l2.id === "score-dsl");
  if (existing) return;
  monaco.languages.register({ id: "score-dsl", extensions: [".score.ts"], aliases: ["Score DSL"] });
  monaco.languages.setMonarchTokensProvider("score-dsl", {
    defaultToken: "",
    tokenPostfix: ".ts",
    keywords: [
      "Song",
      "Track",
      // Instruments
      "Kick",
      "Snare",
      "HiHat",
      "Synth",
      "Sample",
      "Theremin",
      "Sax",
      "Arp",
      "Kick808",
      "Kick909",
      "Snare909",
      "HiHat808",
      "SubSynth",
      "FMSynth",
      // Effects
      "Reverb",
      "Delay",
      "Filter",
      "Distortion",
      "Chorus",
      "Phaser",
      "Flanger",
      "Compressor",
      "Limiter",
      "EQ",
      "Saturation",
      "AutoPan",
      "BitCrusher",
      "StereoWidener",
      "Gate",
      "Sidechain",
      "MultibandCompressor"
    ],
    typeKeywords: ["const", "export", "default", "import", "from", "type"],
    operators: ["=>", ":", ",", ".", "(", ")", "[", "]", "{", "}", "="],
    symbols: /[=><!~?:&|+\-*/^%]+/,
    tokenizer: {
      root: [
        // Score DSL keywords — instruments and structure
        [/\b(Song|Track|Kick|Snare|HiHat|Synth|Sample|Theremin|Sax|Arp|Kick808|Kick909|Snare909|HiHat808|SubSynth|FMSynth)\b/, "keyword.score-instrument"],
        // Effects keywords
        [/\b(Reverb|Delay|Filter|Distortion|Chorus|Phaser|Flanger|Compressor|Limiter|EQ|Saturation|AutoPan|BitCrusher|StereoWidener|Gate|Sidechain|MultibandCompressor)\b/, "keyword.score-effect"],
        // import/export
        [/\b(import|export|default|from|const|type)\b/, "keyword"],
        // Note strings: 'C4', 'E3', 'A#2' etc.
        [/'[A-G][#b]?[0-9]'/, "string.note"],
        // Numbers
        [/\d+\.?\d*/, "number"],
        // Strings
        [/'[^']*'/, "string"],
        [/"[^"]*"/, "string"],
        // Comments
        [/\/\/.*$/, "comment"],
        [/\/\*/, "comment", "@comment"],
        // Whitespace
        { include: "@whitespace" }
      ],
      comment: [
        [/[^/*]+/, "comment"],
        [/\*\//, "comment", "@pop"],
        [/[/*]/, "comment"]
      ],
      whitespace: [
        [/[ \t\r\n]+/, "white"]
      ]
    }
  });
  monaco.editor.defineTheme("score-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword.score-instrument", foreground: "4a8fff", fontStyle: "bold" },
      { token: "keyword.score-effect", foreground: "8866cc", fontStyle: "italic" },
      { token: "string.note", foreground: "88cc66" },
      { token: "number", foreground: "b5cea8" },
      { token: "comment", foreground: "4a4a52", fontStyle: "italic" },
      { token: "string", foreground: "ce9178" },
      { token: "keyword", foreground: "569cd6" }
    ],
    colors: {
      "editor.background": "#080809",
      "editor.foreground": "#c8d8f8",
      "editorLineNumber.foreground": "#2a3040",
      "editorLineNumber.activeForeground": "#4a6080",
      "editor.lineHighlightBackground": "#111115",
      "editorGutter.background": "#080809",
      "editor.selectionBackground": "#1a3060",
      "editor.inactiveSelectionBackground": "#0f1e3c",
      "editorCursor.foreground": "#4a8fff",
      "editorIndentGuide.background1": "#1e1e22",
      "scrollbarSlider.background": "#1e1e2288"
    }
  });
};
const cssState = { injected: false };
const injectDecorationCss = () => {
  if (cssState.injected) return;
  cssState.injected = true;
  const style = document.createElement("style");
  style.textContent = `
    /* Beat highlight — active track line during playback */
    .score-beat-active {
      background: rgba(74, 143, 255, 0.07) !important;
      border-left: 2px solid rgba(74, 143, 255, 0.4) !important;
    }
    /* Step badge — inline content widget gutter marker */
    .score-step-badge {
      display: inline-block;
      background: rgba(74, 143, 255, 0.15);
      color: #4a8fff;
      font-size: 9px;
      font-family: monospace;
      padding: 0 3px;
      border-radius: 2px;
      margin-right: 4px;
      vertical-align: middle;
      opacity: 0.8;
    }
  `;
  document.head.appendChild(style);
};
const CodeEditorPanel = ({ value, onChange, onEval, decorations, stepBadges, importsVisible = true }) => {
  const editorRef = reactExports.useRef(null);
  const decorationsRef = reactExports.useRef([]);
  const stepBadgesRef = reactExports.useRef([]);
  const monacoRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    const ed2 = editorRef.current;
    const monaco = monacoRef.current;
    if (!ed2 || !monaco) return;
    const model = ed2.getModel();
    if (!model) return;
    const newDecorations = (decorations ?? []).map((d) => ({
      range: new monaco.Range(d.startLine, 1, d.endLine, 1),
      options: {
        isWholeLine: d.isWholeLine ?? true,
        className: d.className,
        overviewRulerLane: monaco.editor.OverviewRulerLane.Left,
        overviewRulerColor: "rgba(74,143,255,0.3)"
      }
    }));
    decorationsRef.current = ed2.deltaDecorations(decorationsRef.current, newDecorations);
  }, [decorations]);
  reactExports.useEffect(() => {
    const ed2 = editorRef.current;
    const monaco = monacoRef.current;
    if (!ed2 || !monaco) return;
    const model = ed2.getModel();
    if (!model) return;
    const newBadges = (stepBadges ?? []).map((b) => ({
      range: new monaco.Range(b.line, 1, b.line, 1),
      options: {
        after: {
          content: ` ${String(b.step + 1)}/${String(b.total)}`,
          inlineClassName: "score-step-badge"
        },
        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
      }
    }));
    stepBadgesRef.current = ed2.deltaDecorations(stepBadgesRef.current, newBadges);
  }, [stepBadges]);
  reactExports.useEffect(() => {
    const ed2 = editorRef.current;
    if (!ed2) return;
    if (importsVisible) {
      ed2.trigger("t220", "editor.unfold", { selectionLines: [1] });
    } else {
      ed2.trigger("t220", "editor.fold", { selectionLines: [1] });
    }
  }, [importsVisible]);
  const handleMount = reactExports.useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    registerScoreDslLanguage(monaco);
    injectDecorationCss();
    monaco.editor.setTheme("score-dark");
    const model = editor.getModel();
    if (model) monaco.editor.setModelLanguage(model, "score-dsl");
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => {
        onEval();
      }
    );
    editor.focus();
    if (!importsVisible) {
      window.setTimeout(() => {
        editor.trigger("t220", "editor.fold", { selectionLines: [1] });
      }, 150);
    }
  }, [onEval, importsVisible]);
  const handleChange = reactExports.useCallback((val) => {
    onChange(val ?? "");
  }, [onChange]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Ft,
    {
      height: "100%",
      language: "score-dsl",
      theme: "score-dark",
      value,
      onChange: handleChange,
      onMount: handleMount,
      options: {
        fontSize: 12.8,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        lineHeight: 1.65 * 12.8,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: "on",
        tabSize: 2,
        insertSpaces: true,
        renderLineHighlight: "line",
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        padding: { top: 12, bottom: 12 },
        overviewRulerLanes: 1,
        scrollbar: {
          verticalScrollbarSize: 6,
          horizontalScrollbarSize: 6
        },
        // Folding enabled so import block can be collapsed via the Imports toggle (t220).
        // The fold icon is hidden via CSS — folding: true is required for editor.fold() to work.
        folding: true,
        showFoldingControls: "never",
        renderWhitespace: "none",
        guides: { indentation: false }
      }
    }
  );
};
const INSTRUMENTS = {
  title: "Instruments",
  items: [
    { name: "Kick", desc: "pattern, volume, decay, tune" },
    { name: "Snare", desc: "pattern, volume, decay, tone" },
    { name: "HiHat", desc: "pattern, volume, decay, open" },
    { name: "Synth", desc: "wave, frequency, pattern, filter, gain, effects" },
    { name: "Sample", desc: "src, pattern, volume, rate, loop" },
    { name: "Theremin", desc: "wave, frequency, vibrato, gain, effects" },
    { name: "Sax", desc: "pattern (notes), wave, gain, effects" },
    { name: "Arp", desc: "notes[], mode, rate, wave, gain, effects" }
  ]
};
const EFFECTS = {
  title: "Effects",
  items: [
    { name: "Reverb", desc: "decay, mix" },
    { name: "Delay", desc: "time, feedback, mix" },
    { name: "Filter", desc: "type, frequency, Q" },
    { name: "Compressor", desc: "threshold, ratio, attack, release" },
    { name: "EQ", desc: "low, mid, high" },
    { name: "Distortion", desc: "drive, mode, mix" },
    { name: "Limiter", desc: "threshold, release" },
    { name: "BitCrusher", desc: "bits, mix" },
    { name: "Chorus", desc: "rate, depth, mix" },
    { name: "Phaser", desc: "rate, depth, mix" },
    { name: "Flanger", desc: "rate, depth, feedback, mix" },
    { name: "StereoWidener", desc: "width" },
    { name: "Gate", desc: "threshold, attack, release" },
    { name: "Saturation", desc: "drive, mix — tanh soft-clip warmth" },
    { name: "AutoPan", desc: "rate, depth, shape — LFO stereo sweep" }
  ]
};
const STRUCTURE = {
  title: "Structure",
  items: [
    { name: "Song", desc: "bpm, tracks, masterVolume" },
    { name: "Track", desc: "wraps an instrument, volume, mute" },
    { name: "Intro", desc: "section({ bars, tracks })" },
    { name: "Drop", desc: "section({ bars, tracks })" },
    { name: "Outro", desc: "section({ bars, tracks })" }
  ]
};
const PATTERNS = {
  title: "Patterns",
  items: [
    { name: "euclidean(hits, steps)", desc: "Bjorklund rhythm, e.g. euclidean(3,8)" },
    { name: "pat(string)", desc: "space-separated pattern, e.g. pat('1 0 1 0')" }
  ]
};
const SHORTCUTS = {
  title: "Shortcuts",
  items: [
    { name: "Ctrl+Enter", desc: "Eval code without playing" },
    { name: "▶ Run", desc: "Eval + play (stopped) / hot-swap (playing)" },
    { name: "■ Stop", desc: "Stop transport" }
  ]
};
const SECTIONS = [INSTRUMENTS, EFFECTS, STRUCTURE, PATTERNS, SHORTCUTS];
const INSERT_SNIPPETS = {
  Kick: "Track(Kick({  pattern: [1, 0, 0, 0, 1, 0, 0, 0], volume: 0.9 }))",
  Snare: "Track(Snare({ pattern: [0, 0, 1, 0, 0, 0, 1, 0], volume: 0.7 }))",
  HiHat: "Track(HiHat({ pattern: [1, 1, 1, 1, 1, 1, 1, 1], volume: 0.4 }))",
  Synth: "Track(Synth({ wave: 'sawtooth', frequency: 440, pattern: [1, 0, 1, 0], gain: 0.6 }))",
  Sample: "Track(Sample({ src: './samples/sound.wav', pattern: [1, 0, 0, 0] }))",
  Theremin: "Track(Theremin({ wave: 'sine', frequency: 440, gain: 0.5 }))",
  Sax: "Track(Sax({ pattern: ['C4', 'E4', 'G4', 'A4'], wave: 'sawtooth', gain: 0.5 }))",
  Arp: "Track(Arp({ notes: ['C3', 'E3', 'G3', 'B3'], mode: 'up', rate: 2, wave: 'triangle', gain: 0.4 }))"
};
const RefSection = ({ section, onInsert }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$a.section, children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles$a.sectionTitle, children: section.title }),
  section.items.map((item) => {
    const snippet = section.title === "Instruments" ? INSERT_SNIPPETS[item.name] : void 0;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$a.row, children: [
      snippet && onInsert ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          style: styles$a.nameBtn,
          onClick: () => {
            onInsert(snippet);
          },
          title: `Insert ${item.name}`,
          children: item.name
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$a.name, children: item.name }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$a.desc, children: item.desc })
    ] }, item.name);
  })
] });
const ReferencePanel = ({ onInsert }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$a.root, "aria-label": "DSL reference panel", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$a.header, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$a.headerLabel, children: "Score DSL" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: styles$a.headerImport, children: [
      "import ",
      "{",
      " Song, Track, Kick, … ",
      "}",
      " from '@score/dsl'"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: styles$a.headerImport, children: [
      "import ",
      "{",
      " Reverb, Delay, … ",
      "}",
      " from '@score/effects'"
    ] })
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles$a.scroll, children: SECTIONS.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(RefSection, { section: s, onInsert }, s.title)) })
] });
const styles$a = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "#0a0a0d",
    overflow: "hidden"
  },
  header: {
    flexShrink: 0,
    padding: "6px 8px 4px",
    borderBottom: "1px solid #1e1e22",
    display: "flex",
    flexDirection: "column",
    gap: "2px"
  },
  headerLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.62rem",
    color: "#6a9fff",
    letterSpacing: "0.1em",
    textTransform: "uppercase"
  },
  headerImport: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.6rem",
    color: "#3a5a7a"
  },
  scroll: {
    flex: 1,
    overflowY: "auto",
    padding: "4px 0 8px"
  },
  section: {
    padding: "4px 0 2px",
    borderBottom: "1px solid #141418"
  },
  sectionTitle: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.58rem",
    color: "#3a3a46",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    padding: "2px 8px",
    marginBottom: "2px"
  },
  row: {
    display: "flex",
    gap: "6px",
    padding: "1px 8px",
    alignItems: "baseline"
  },
  name: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.68rem",
    color: "#8ab4d4",
    flexShrink: 0,
    minWidth: "88px"
  },
  nameBtn: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.68rem",
    color: "#8ab4d4",
    flexShrink: 0,
    minWidth: "88px",
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    textAlign: "left",
    textDecoration: "underline",
    textDecorationColor: "#3a5a7a"
  },
  desc: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.62rem",
    color: "#4a5a6a",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis"
  }
};
const timeStr = (t2) => {
  const d = new Date(t2);
  const hh2 = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh2}:${mm}:${ss}`;
};
const PREFIX = {
  info: "·",
  ok: "✓",
  error: "✗",
  warn: "!"
};
const COLOR = {
  info: "#6a6a7a",
  ok: "#22cc66",
  error: "#ff4444",
  warn: "#ffcc00"
};
const ConsoleLog = ({ entries }) => {
  const bottomRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      role: "log",
      "aria-label": "Engine console",
      "aria-live": "polite",
      style: styles$9.root,
      children: [
        entries.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles$9.empty, children: "No output yet — eval a song or press play" }),
        entries.map((entry) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$9.row, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { ...styles$9.prefix, color: COLOR[entry.level] }, children: PREFIX[entry.level] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$9.timestamp, children: timeStr(entry.time) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { ...styles$9.message, color: COLOR[entry.level] }, children: entry.message })
        ] }, entry.id)),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: bottomRef, "aria-hidden": "true" })
      ]
    }
  );
};
const styles$9 = {
  root: {
    flex: 1,
    overflow: "auto",
    background: "#080809",
    padding: "0.4rem 0.5rem",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: "0.72rem",
    display: "flex",
    flexDirection: "column",
    gap: "1px"
  },
  empty: {
    color: "#2a2a36",
    padding: "0.25rem 0"
  },
  row: {
    display: "flex",
    alignItems: "baseline",
    gap: "0.5rem",
    lineHeight: 1.5
  },
  prefix: {
    flexShrink: 0,
    width: "10px",
    textAlign: "center"
  },
  timestamp: {
    flexShrink: 0,
    color: "#3a3a46",
    fontSize: "0.65rem",
    fontVariantNumeric: "tabular-nums"
  },
  message: {
    wordBreak: "break-all",
    flex: 1
  }
};
const relativeTime = (timestamp) => {
  const secs = Math.floor((Date.now() - timestamp) / 1e3);
  if (secs < 60) return `${String(secs)}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${String(mins)}m ago`;
  return `${String(Math.floor(mins / 60))}h ago`;
};
const DOT_COLOR = {
  idle: "#3a3a46",
  ok: "#22cc66",
  error: "#ff4444",
  pending: "#ffcc00"
};
const EvalStatus = ({ status, message, timestamp }) => {
  const [, setTick] = reactExports.useState(0);
  reactExports.useEffect(() => {
    if (status !== "ok" || timestamp === void 0) return;
    const handle = { value: null };
    handle.value = setInterval(() => {
      setTick((t2) => t2 + 1);
    }, 1e3);
    return () => {
      if (handle.value !== null) clearInterval(handle.value);
    };
  }, [status, timestamp]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$8.pill, "aria-label": `Eval status: ${status}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "span",
      {
        "aria-hidden": "true",
        style: { ...styles$8.dot, background: DOT_COLOR[status] }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: styles$8.label, children: [
      status === "idle" && "Ready",
      status === "ok" && "OK",
      status === "error" && "Error",
      status === "pending" && "Pending..."
    ] }),
    status === "ok" && timestamp !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$8.time, children: relativeTime(timestamp) }),
    status === "error" && message !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$8.errorMsg, title: message, children: message.length > 48 ? `${message.slice(0, 45)}…` : message })
  ] });
};
const styles$8 = {
  pill: {
    display: "inline-flex",
    flexDirection: "column",
    gap: "0.2rem",
    padding: "0.3rem 0.65rem",
    background: "#0c0c0e",
    border: "1px solid #1e1e22",
    borderRadius: "999px",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: "0.72rem",
    color: "#a0a0b0",
    minWidth: "72px"
  },
  dot: {
    display: "inline-block",
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    flexShrink: 0,
    marginRight: "0.35rem"
  },
  label: {
    display: "inline",
    fontWeight: 600
  },
  time: {
    fontSize: "0.65rem",
    color: "#5a5a6a",
    marginLeft: "0.25rem"
  },
  errorMsg: {
    display: "block",
    fontSize: "0.65rem",
    color: "#ff7777",
    marginTop: "0.1rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "220px"
  }
};
const BeatClock = ({ step, stepCount }) => {
  const beatsInPattern = Math.max(Math.ceil(stepCount / 4), 1);
  const currentBeat = Math.floor(step / 4);
  const currentSixteenth = step % 4;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$7.beatClock, "aria-label": `Beat ${String(currentBeat + 1)} of ${String(beatsInPattern)}`, children: Array.from({ length: beatsInPattern }, (_2, b) => {
    const isBeat = b === currentBeat;
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { ...styles$7.beatGroup, ...isBeat ? styles$7.beatGroupActive : {} }, children: Array.from({ length: 4 }, (__, s) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "span",
      {
        "aria-hidden": "true",
        style: {
          ...styles$7.pip,
          ...isBeat && s === currentSixteenth ? styles$7.pipActive : styles$7.pipInactive
        }
      },
      s
    )) }, b);
  }) });
};
const BarCounter = ({ bars, step, stepCount, bpm, playing }) => {
  const color = playing ? "#6a9fff" : "#2a2a3a";
  const beatNum = playing ? Math.floor(step / 4) + 1 : 0;
  const beatsTotal = Math.max(Math.ceil(stepCount / 4), 1);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { ...styles$7.root, color }, "aria-label": "Transport position", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: styles$7.segment, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$7.dimLabel, children: "BAR" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$7.bigNum, children: playing ? bars + 1 : "—" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$7.separator, "aria-hidden": "true", children: "·" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: styles$7.segment, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$7.dimLabel, children: "BEAT" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$7.bigNum, children: playing ? `${String(beatNum)}/${String(beatsTotal)}` : "—" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$7.separator, "aria-hidden": "true", children: "·" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: styles$7.segment, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$7.bigNum, children: bpm }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$7.dimLabel, children: "BPM" })
    ] }),
    playing && /* @__PURE__ */ jsxRuntimeExports.jsx(BeatClock, { step, stepCount })
  ] });
};
const styles$7 = {
  root: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: "0.8rem"
  },
  segment: {
    display: "inline-flex",
    alignItems: "baseline",
    gap: "0.25rem"
  },
  dimLabel: {
    fontSize: "0.6rem",
    opacity: 0.5,
    fontWeight: 400
  },
  bigNum: {
    fontSize: "1.2rem",
    fontWeight: 700,
    lineHeight: 1
  },
  separator: {
    opacity: 0.3,
    fontSize: "0.9rem"
  },
  // Beat clock
  beatClock: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    marginLeft: "0.5rem"
  },
  beatGroup: {
    display: "inline-flex",
    alignItems: "center",
    gap: "1px",
    padding: "2px 3px",
    borderRadius: "2px",
    border: "1px solid transparent"
  },
  beatGroupActive: {
    border: "1px solid rgba(106, 159, 255, 0.35)",
    background: "rgba(106, 159, 255, 0.07)"
  },
  pip: {
    display: "inline-block",
    width: "3px",
    height: "3px",
    borderRadius: "50%",
    flexShrink: 0
  },
  pipActive: {
    background: "#6a9fff",
    opacity: 1
  },
  pipInactive: {
    background: "#6a9fff",
    opacity: 0.15
  }
};
const PendingSwapBadge = ({ pending, step, stepCount }) => {
  if (!pending) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$6.pill, "aria-label": "Pending bar-boundary swap", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$6.icon, "aria-hidden": "true", children: "⟳" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$6.label, children: "swap on next bar" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: styles$6.progress, "aria-label": `Step ${String(step)} of ${String(stepCount)}`, children: [
      step,
      "/",
      stepCount
    ] })
  ] });
};
const styles$6 = {
  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.25rem 0.6rem",
    background: "#1a1500",
    border: "1px solid #ffcc00",
    borderRadius: "999px",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: "0.7rem",
    color: "#ffcc00",
    whiteSpace: "nowrap"
  },
  icon: {
    fontSize: "0.85rem",
    lineHeight: 1
  },
  label: {
    fontWeight: 600
  },
  progress: {
    opacity: 0.65,
    fontSize: "0.65rem",
    marginLeft: "0.1rem"
  }
};
const findTrackPositions = (code) => {
  const re2 = /(?:Track\(|=\s*)([A-Z][A-Za-z0-9]*)\s*\(/g;
  return Array.from(code.matchAll(re2)).filter((m2) => {
    const instrName = m2[1] ?? "";
    return instrName !== "Song" && instrName !== "Track";
  }).map((m2) => {
    const fullMatch = m2[0];
    const instrName = m2[1] ?? "";
    const nameOffset = fullMatch.lastIndexOf(instrName);
    return m2.index + nameOffset;
  });
};
const trackSlice = (code, trackIndex) => {
  const positions = findTrackPositions(code);
  const start = positions[trackIndex];
  if (start === void 0) return null;
  const end = positions[trackIndex + 1] ?? code.length;
  return { start, end };
};
const parseTrackModel = (code, trackIndex) => {
  const positions = findTrackPositions(code);
  const start = positions[trackIndex];
  if (start === void 0) return "";
  const m2 = /^([A-Z][A-Za-z0-9]*)/.exec(code.slice(start));
  return m2?.[1] ?? "";
};
const patchInstrumentModel = (code, trackIndex, newModel) => {
  const positions = findTrackPositions(code);
  const start = positions[trackIndex];
  if (start === void 0) return code;
  const m2 = /^([A-Z][A-Za-z0-9]*)/.exec(code.slice(start));
  if (!m2) return code;
  return code.slice(0, start) + newModel + code.slice(start + m2[0].length);
};
const patchBpm = (code, newBpm) => code.replace(/\bbpm:\s*\d+(?:\.\d+)?/, `bpm: ${String(newBpm)}`);
const patchTrackPattern = (code, trackIndex, stepIndex, value) => {
  const region = trackSlice(code, trackIndex);
  if (!region) return code;
  const { start, end } = region;
  const slice = code.slice(start, end);
  const mProp = /pattern:\s*\[([^\]]*)\]/.exec(slice);
  const mChain = /\.pattern\(\[([^\]]*)\]\)/.exec(slice);
  const m2 = mProp ?? mChain;
  if (!m2) return code;
  const items = (m2[1] ?? "").split(",").map((s) => s.trim());
  if (stepIndex < 0 || stepIndex >= items.length) return code;
  items[stepIndex] = String(value);
  const isChain = !mProp && Boolean(mChain);
  const newChunk = isChain ? `.pattern([${items.join(", ")}])` : `pattern: [${items.join(", ")}]`;
  const newSlice = slice.slice(0, m2.index) + newChunk + slice.slice(m2.index + m2[0].length);
  return code.slice(0, start) + newSlice + code.slice(end);
};
const patchTrackVolume = (code, trackIndex, volume) => {
  const region = trackSlice(code, trackIndex);
  if (!region) return code;
  const { start, end } = region;
  const slice = code.slice(start, end);
  const formatted = String(Math.round(volume * 100) / 100);
  const mChain = /\.volume\(\s*\d+(?:\.\d+)?\s*\)/.exec(slice);
  if (mChain) {
    const newSlice2 = slice.slice(0, mChain.index) + `.volume(${formatted})` + slice.slice(mChain.index + mChain[0].length);
    return code.slice(0, start) + newSlice2 + code.slice(end);
  }
  const mProp = /\bvolume:\s*\d+(?:\.\d+)?/.exec(slice);
  if (!mProp) return code;
  const newSlice = slice.slice(0, mProp.index) + `volume: ${formatted}` + slice.slice(mProp.index + mProp[0].length);
  return code.slice(0, start) + newSlice + code.slice(end);
};
const patchTrackNote = (code, trackIndex, noteIndex, note) => {
  const region = trackSlice(code, trackIndex);
  if (!region) return code;
  const { start, end } = region;
  const slice = code.slice(start, end);
  const m2 = /notes:\s*\[([^\]]*)\]/.exec(slice);
  if (!m2) return code;
  const items = (m2[1] ?? "").split(",").map((s) => s.trim());
  if (noteIndex < 0 || noteIndex >= items.length) return code;
  items[noteIndex] = `'${note}'`;
  const newChunk = `notes: [${items.join(", ")}]`;
  const newSlice = slice.slice(0, m2.index) + newChunk + slice.slice(m2.index + m2[0].length);
  return code.slice(0, start) + newSlice + code.slice(end);
};
const patchChainMethod = (code, trackIndex, method, value) => {
  const region = trackSlice(code, trackIndex);
  if (!region) return code;
  const { start, end } = region;
  const slice = code.slice(start, end);
  const formatted = typeof value === "string" ? `'${value}'` : String(Math.round(value * 1e3) / 1e3);
  const methodRe = new RegExp(`\\.${method}\\([^)]*\\)`);
  if (methodRe.test(slice)) {
    const newSlice = slice.replace(methodRe, `.${method}(${formatted})`);
    return code.slice(0, start) + newSlice + code.slice(end);
  }
  const lines = slice.split("\n");
  const stopIdx = lines.findIndex((ln) => ln.trim().startsWith("const ") || ln.trim().startsWith("export "));
  const regionLines = stopIdx === -1 ? lines : lines.slice(0, stopIdx);
  const insertLineIdx = regionLines.reduce((acc, ln, i) => ln.trim().length > 0 ? i : acc, 0);
  const patched = lines.map((ln, i) => i === insertLineIdx ? ln + `.${method}(${formatted})` : ln);
  return code.slice(0, start) + patched.join("\n") + code.slice(end);
};
const parseTrackChainParams = (code, trackIndex) => {
  const region = trackSlice(code, trackIndex);
  if (!region) return {};
  const slice = code.slice(region.start, region.end);
  const result = {};
  const re2 = /\.([a-zA-Z]\w*)\(\s*(-?\d+(?:\.\d+)?)\s*\)/g;
  for (const m2 of slice.matchAll(re2)) {
    const method = m2[1];
    const val = parseFloat(m2[2] ?? "");
    if (method !== void 0 && !isNaN(val)) result[method] = val;
  }
  return result;
};
const uniqueVarName = (code, base) => {
  if (!new RegExp(`\\bconst\\s+${base}\\b`).test(code)) return base;
  for (let n2 = 2; n2 < 20; n2++) {
    const candidate = `${base}${String(n2)}`;
    if (!new RegExp(`\\bconst\\s+${candidate}\\b`).test(code)) return candidate;
  }
  return `${base}${String(Date.now())}`;
};
const patchAddInstrument = (code, varName, instrumentLine) => {
  const exportIdx = code.indexOf("export default Song(");
  if (exportIdx === -1) return code;
  const newConst = `const ${varName} = ${instrumentLine}
`;
  const withConst = code.slice(0, exportIdx) + newConst + code.slice(exportIdx);
  const tracksMatch = /\btracks\s*:\s*\[([^\]]*)\]/s.exec(withConst);
  if (!tracksMatch) return withConst;
  const inner = tracksMatch[1] ?? "";
  const trimmed = inner.trimEnd();
  const lastCommaOrBracket = trimmed.lastIndexOf("\n");
  const indent = lastCommaOrBracket !== -1 ? trimmed.slice(lastCommaOrBracket + 1).match(/^\s*/)?.[0] ?? "  " : " ";
  const hasNewlines = inner.includes("\n");
  const trailingComma = trimmed.endsWith(",");
  const newInner = hasNewlines ? trailingComma ? `${trimmed}
${indent}${varName},
` : `${trimmed},
${indent}${varName}
` : `${trimmed}, ${varName}`;
  const matchStart = tracksMatch.index + tracksMatch[0].indexOf("[") + 1;
  const matchEnd = matchStart + inner.length;
  return withConst.slice(0, matchStart) + newInner + withConst.slice(matchEnd);
};
const parseMuteState = (code, trackIndex) => {
  const region = trackSlice(code, trackIndex);
  if (!region) return false;
  return /\.mute\(\)/.test(code.slice(region.start, region.end));
};
const patchMute = (code, trackIndex, muted) => {
  const region = trackSlice(code, trackIndex);
  if (!region) return code;
  const { start, end } = region;
  const slice = code.slice(start, end);
  if (!muted) {
    const cleaned = slice.replace(/\.mute\(\)/g, "");
    return code.slice(0, start) + cleaned + code.slice(end);
  }
  if (/\.mute\(\)/.test(slice)) return code;
  const lines = slice.split("\n");
  const stopIdx = lines.findIndex((ln) => ln.trim().startsWith("const ") || ln.trim().startsWith("export "));
  const regionLines = stopIdx === -1 ? lines : lines.slice(0, stopIdx);
  const insertLineIdx = regionLines.reduce((acc, ln, i) => ln.trim().length > 0 ? i : acc, 0);
  const patched = lines.map((ln, i) => i === insertLineIdx ? ln + ".mute()" : ln);
  return code.slice(0, start) + patched.join("\n") + code.slice(end);
};
const slider = (label, method, min, max, step, def) => ({ kind: "slider", label, method, min, max, step, default: def });
const select = (label, method, options) => ({ kind: "select", label, method, options });
const FALLBACK_CONTROLS = [
  slider("Volume", "volume", 0, 1, 0.01, 0.8),
  slider("Reverb", "reverb", 0, 1, 0.01, 0)
];
const KICK_MODELS = [{ value: "Kick808", label: "808" }, { value: "Kick909", label: "909" }, { value: "Kick", label: "Generic" }];
const SNARE_MODELS = [{ value: "Snare909", label: "909" }, { value: "Snare", label: "Generic" }];
const HIHAT_MODELS = [{ value: "Hihat808", label: "808" }, { value: "HiHat", label: "Generic" }];
const CONTROLS = {
  kick: [select("Model", "_model", KICK_MODELS), slider("Volume", "volume", 0, 1, 0.01, 0.85), slider("Tune", "pitch", -24, 24, 1, 0), slider("Decay", "decay", 0.1, 2, 0.01, 0.5), slider("Reverb", "reverb", 0, 1, 0.01, 0)],
  kick808: [select("Model", "_model", KICK_MODELS), slider("Volume", "volume", 0, 1, 0.01, 0.85), slider("Tune", "pitch", -24, 24, 1, 0), slider("Decay", "decay", 0.1, 2, 0.01, 0.5), slider("Reverb", "reverb", 0, 1, 0.01, 0)],
  kick909: [select("Model", "_model", KICK_MODELS), slider("Volume", "volume", 0, 1, 0.01, 0.85), slider("Tune", "pitch", -24, 24, 1, 0), slider("Decay", "decay", 0.1, 2, 0.01, 0.5), slider("Reverb", "reverb", 0, 1, 0.01, 0)],
  snare: [select("Model", "_model", SNARE_MODELS), slider("Volume", "volume", 0, 1, 0.01, 0.7), slider("Tune", "pitch", -24, 24, 1, 0), slider("Snappy", "sustain", 0, 1, 0.01, 0.5), slider("Reverb", "reverb", 0, 1, 0.01, 0)],
  snare909: [select("Model", "_model", SNARE_MODELS), slider("Volume", "volume", 0, 1, 0.01, 0.7), slider("Tune", "pitch", -24, 24, 1, 0), slider("Snappy", "sustain", 0, 1, 0.01, 0.5), slider("Reverb", "reverb", 0, 1, 0.01, 0)],
  hihat: [select("Model", "_model", HIHAT_MODELS), slider("Volume", "volume", 0, 1, 0.01, 0.4), slider("Tune", "pitch", -24, 24, 1, 0), slider("Decay", "decay", 0.05, 2, 0.01, 0.1), slider("Reverb", "reverb", 0, 1, 0.01, 0)],
  hihat808: [select("Model", "_model", HIHAT_MODELS), slider("Volume", "volume", 0, 1, 0.01, 0.4), slider("Tune", "pitch", -24, 24, 1, 0), slider("Decay", "decay", 0.05, 2, 0.01, 0.1), slider("Reverb", "reverb", 0, 1, 0.01, 0)],
  bass303: [slider("Volume", "volume", 0, 1, 0.01, 0.8), slider("Cutoff", "cutoff", 100, 8e3, 10, 600), slider("Resonance", "resonance", 0, 30, 0.1, 0.5), slider("Wobble", "wobble", 0, 1, 0.01, 0)],
  synth: [slider("Volume", "volume", 0, 1, 0.01, 0.6), slider("Filter", "filter", 100, 8e3, 10, 2e3), slider("Attack", "attack", 0.01, 2, 0.01, 0.01), slider("Release", "release", 0.1, 4, 0.01, 0.3), slider("Reverb", "reverb", 0, 1, 0.01, 0)],
  subsynth: [slider("Volume", "volume", 0, 1, 0.01, 0.6), slider("Filter", "filter", 100, 8e3, 10, 2e3), slider("Attack", "attack", 0.01, 2, 0.01, 0.01), slider("Release", "release", 0.1, 4, 0.01, 0.3), slider("Reverb", "reverb", 0, 1, 0.01, 0)],
  fmsynth: [slider("Volume", "volume", 0, 1, 0.01, 0.6), slider("Filter", "filter", 100, 8e3, 10, 2e3), slider("Attack", "attack", 0.01, 2, 0.01, 0.01), slider("Release", "release", 0.1, 4, 0.01, 0.3), slider("Reverb", "reverb", 0, 1, 0.01, 0)],
  pad: [slider("Volume", "volume", 0, 1, 0.01, 0.6), slider("Filter", "filter", 100, 8e3, 10, 2e3), slider("Attack", "attack", 0.01, 2, 0.01, 0.3), slider("Release", "release", 0.1, 4, 0.01, 1), slider("Reverb", "reverb", 0, 1, 0.01, 0.2)],
  pluck: [slider("Volume", "volume", 0, 1, 0.01, 0.6), slider("Filter", "filter", 100, 8e3, 10, 2e3), slider("Attack", "attack", 0.01, 2, 0.01, 5e-3), slider("Release", "release", 0.1, 4, 0.01, 0.4), slider("Reverb", "reverb", 0, 1, 0.01, 0)]
};
const styles$5 = {
  panel: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: "6px 10px",
    background: "#111",
    borderTop: "1px solid #222",
    minHeight: 48
  },
  nameSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
    minWidth: 64
  },
  trackName: {
    fontSize: 10,
    color: "#aaa",
    fontFamily: "monospace",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 60
  },
  muteBtn: (muted) => ({
    width: 28,
    height: 18,
    fontSize: 9,
    fontFamily: "monospace",
    background: muted ? "#ffcc00" : "#222",
    color: muted ? "#000" : "#aaa",
    border: "1px solid #333",
    borderRadius: 2,
    cursor: "pointer",
    padding: 0
  }),
  controlsRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap"
  },
  control: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2
  },
  label: { fontSize: 9, color: "#666", fontFamily: "monospace", userSelect: "none" },
  value: { fontSize: 9, color: "#888", fontFamily: "monospace", minWidth: 32 },
  slider: {
    width: 60,
    height: 16,
    accentColor: "#4a8fff"
  },
  checkboxRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  select: {
    fontSize: 9,
    fontFamily: "monospace",
    background: "#181818",
    color: "#aaa",
    border: "1px solid #333",
    borderRadius: 2,
    padding: "1px 2px",
    cursor: "pointer"
  }
};
const InstrumentPanel = (props) => {
  const { trackIndex, instrumentType, trackName, params, muted, onChange, onMute } = props;
  const controls = CONTROLS[instrumentType] ?? FALLBACK_CONTROLS;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$5.panel, "data-testid": `instrument-panel-${String(trackIndex)}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$5.nameSection, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$5.trackName, children: trackName }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          style: styles$5.muteBtn(muted),
          "aria-label": `Mute ${trackName}`,
          "aria-pressed": muted,
          onClick: onMute,
          children: muted ? "M" : "m"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles$5.controlsRow, children: controls.map((ctrl) => {
      const inputId = `panel-${String(trackIndex)}-${ctrl.method}`;
      if (ctrl.kind === "select") {
        const current = typeof params[ctrl.method] === "string" ? params[ctrl.method] : ctrl.options[0]?.value ?? "";
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$5.control, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: inputId, style: styles$5.label, children: ctrl.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "select",
            {
              id: inputId,
              "aria-label": ctrl.label,
              style: styles$5.select,
              value: current,
              onChange: (e) => {
                onChange(ctrl.method, e.target.value);
              },
              children: ctrl.options.map((opt) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: opt.value, children: opt.label }, opt.value))
            }
          )
        ] }, ctrl.method);
      }
      if (ctrl.kind === "checkbox") {
        const checked = Boolean(params[ctrl.method] ?? 0);
        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles$5.control, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$5.checkboxRow, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              id: inputId,
              type: "checkbox",
              "aria-label": ctrl.label,
              checked,
              onChange: (e) => {
                onChange(ctrl.method, e.target.checked ? 1 : 0);
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: inputId, style: styles$5.label, children: ctrl.label })
        ] }) }, ctrl.method);
      }
      const val = typeof params[ctrl.method] === "number" ? params[ctrl.method] : ctrl.default;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$5.control, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexDirection: "row", gap: 4 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: inputId, style: styles$5.label, children: ctrl.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$5.value, children: val.toFixed(ctrl.step < 1 ? 2 : 0) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            id: inputId,
            type: "range",
            "aria-label": ctrl.label,
            style: styles$5.slider,
            min: ctrl.min,
            max: ctrl.max,
            step: ctrl.step,
            value: val,
            onChange: (e) => {
              onChange(ctrl.method, parseFloat(e.target.value));
            }
          }
        )
      ] }, ctrl.method);
    }) })
  ] });
};
const STARTER$1 = `import { Song, Kick808, Snare909, Hihat808, Bass303 } from '@score/dsl'

// Click a track in the mixer to open its instrument panel (model, decay, reverb…)
// Click a step in the punchcard to toggle it on/off
const kick  = Kick808(4).decay(0.7).volume(0.8)
const snare = Snare909(2).decay(0.2).volume(0.55)
const hihat = Hihat808(8).decay(0.08).volume(0.25)
const bass  = Bass303('A2').cutoff(600).resonance(0.4)
  .pattern(['A2', 0, 0, 0,  'D3', 0, 0, 0,  'A2', 0, 0, 0,  'D3', 0, 0, 0])
  .volume(0.6)

export default Song({ bpm: 128, tracks: [kick, snare, hihat, bass] })`;
const mkEntry = (level, message) => ({
  id: Date.now() + Math.random(),
  level,
  message,
  time: Date.now()
});
const updateStrip = (prev, index2, patch) => prev.map((s, i) => i === index2 ? { ...s, ...patch } : s);
const PanelToggle = ({ label, active, onClick }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "button",
  {
    "aria-pressed": active,
    onClick,
    style: {
      padding: "0.2rem 0.5rem",
      background: active ? "#152035" : "none",
      border: active ? "1px solid #2a4a7a" : "1px solid #1e1e22",
      borderRadius: "2px",
      color: active ? "#6a9fff" : "#3a3a46",
      fontSize: "0.65rem",
      fontFamily: "system-ui, sans-serif",
      letterSpacing: "0.06em",
      cursor: "pointer"
    },
    children: label
  }
);
const LiveCode = ({ hardware, onHome }) => {
  const [code, setCode] = reactExports.useState(STARTER$1);
  const [error, setError] = reactExports.useState(null);
  const [tracks, setTracks] = reactExports.useState([]);
  const [waveform, setWaveform] = reactExports.useState([]);
  const [engineState, setEngineState] = reactExports.useState({
    playing: false,
    bpm: 128,
    bars: 0
  });
  const [currentStep, setCurrentStep] = reactExports.useState(0);
  const [currentStepCount, setCurrentStepCount] = reactExports.useState(8);
  const [evalStatus, setEvalStatus] = reactExports.useState("idle");
  const [evalTimestamp, setEvalTimestamp] = reactExports.useState(void 0);
  const [pendingSwap, setPendingSwap] = reactExports.useState(false);
  const [stripStates, setStripStates] = reactExports.useState([]);
  const [fftBins, setFftBins] = reactExports.useState([]);
  const [logEntries, setLogEntries] = reactExports.useState([]);
  const [pianoNotes, setPianoNotes] = reactExports.useState([]);
  const [importsVisible, setImportsVisible] = reactExports.useState(false);
  const [selectedTrack, setSelectedTrack] = reactExports.useState(null);
  const [addTrackOpen, setAddTrackOpen] = reactExports.useState(false);
  const autoPlayRef = reactExports.useRef(false);
  const evalDebounceRef = reactExports.useRef(null);
  const codeRef = reactExports.useRef(STARTER$1);
  codeRef.current = code;
  const [splitPct, setSplitPct] = reactExports.useState(50);
  const bodyRef = reactExports.useRef(null);
  const dragRef = reactExports.useRef({
    active: false,
    startX: 0,
    startPct: 50
  });
  const onSplitterMouseDown = reactExports.useCallback((e) => {
    e.preventDefault();
    dragRef.current.active = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startPct = splitPct;
  }, [splitPct]);
  reactExports.useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragRef.current.active) return;
      const containerW = bodyRef.current?.offsetWidth ?? 1;
      const dx = e.clientX - dragRef.current.startX;
      const newPct = dragRef.current.startPct + dx / containerW * 100;
      setSplitPct(Math.min(80, Math.max(20, newPct)));
    };
    const onMouseUp = () => {
      dragRef.current.active = false;
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);
  const [savedLayout, setSavedLayout] = reactExports.useState({});
  const [layoutGen, setLayoutGen] = reactExports.useState(0);
  const layoutAccRef = reactExports.useRef({});
  const editorDecorations = reactExports.useMemo(() => {
    if (!engineState.playing) return [];
    const activeLines = getActiveLines(code, tracks, currentStep);
    return activeLines.map((zeroIdx) => ({
      startLine: zeroIdx + 1,
      // Monaco is 1-based
      endLine: zeroIdx + 1,
      className: "score-beat-active",
      isWholeLine: true
    }));
  }, [engineState.playing, code, tracks, currentStep]);
  const stepBadges = reactExports.useMemo(
    () => engineState.playing ? getStepBadges(code, tracks, currentStep, currentStepCount) : [],
    [engineState.playing, code, tracks, currentStep, currentStepCount]
  );
  const [panels, setPanels] = reactExports.useState({
    punchcard: true,
    scope: false,
    spectrum: false,
    piano: false,
    mixer: true,
    console: true,
    reference: false
  });
  const togglePanel = reactExports.useCallback((key) => {
    setPanels((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);
  const addLog = reactExports.useCallback((level, message) => {
    setLogEntries((prev) => [...prev.slice(-199), mkEntry(level, message)]);
  }, []);
  reactExports.useEffect(() => {
    const unsub = window.scoreBridge.on("error:report", ({ message }) => {
      autoPlayRef.current = false;
      setError(message);
      setEvalStatus("error");
      addLog("error", message);
    });
    return unsub;
  }, [addLog]);
  reactExports.useEffect(() => {
    const unsub = window.scoreBridge.on("song:error", ({ message, fix }) => {
      autoPlayRef.current = false;
      setError(message);
      setEvalStatus("error");
      addLog("error", message);
      if (fix) addLog("info", `💡 ${fix}`);
    });
    return unsub;
  }, [addLog]);
  reactExports.useEffect(() => {
    const unsub = window.scoreBridge.on("song:update", ({ tracks: t2 }) => {
      setTracks(t2);
      setStripStates((prev) => t2.map((track, i) => prev[i] ?? { volume: track.volume ?? 1, muted: parseMuteState(codeRef.current, i) }));
      setEvalStatus("ok");
      setEvalTimestamp(Date.now());
      addLog("ok", `Song loaded — ${String(t2.length)} track${t2.length === 1 ? "" : "s"}`);
      if (autoPlayRef.current) {
        autoPlayRef.current = false;
        window.scoreBridge.send("transport:play", void 0);
      }
    });
    return unsub;
  }, [addLog]);
  reactExports.useEffect(() => {
    const unsub = window.scoreBridge.on("engine:analysis", ({ waveform: w2 }) => {
      setWaveform(w2);
      const binCount = 32;
      const chunkSize = Math.floor(w2.length / binCount);
      const bins = Array.from({ length: binCount }, (_2, b) => {
        const start = b * chunkSize;
        const chunk = w2.slice(start, start + chunkSize);
        return Math.sqrt(chunk.reduce((s, v2) => s + v2 * v2, 0) / Math.max(chunk.length, 1));
      });
      setFftBins(bins);
    });
    return unsub;
  }, []);
  reactExports.useEffect(() => {
    const unsub = window.scoreBridge.on("engine:state", ({ playing, bpm, bars }) => {
      setEngineState((prev) => {
        if (prev.playing !== playing) {
          addLog("info", playing ? "▶ Playing" : "■ Stopped");
        }
        return { playing, bpm, bars };
      });
    });
    return unsub;
  }, [addLog]);
  reactExports.useEffect(() => {
    const unsub = window.scoreBridge.on("engine:step", ({ step, stepCount }) => {
      setCurrentStep(step);
      setCurrentStepCount(stepCount);
    });
    return unsub;
  }, []);
  reactExports.useEffect(() => {
    const unsub = window.scoreBridge.on("engine:pending", ({ pending }) => {
      setPendingSwap(pending);
      if (pending) addLog("warn", "Swap queued — applying at next bar boundary");
    });
    return unsub;
  }, [addLog]);
  reactExports.useEffect(() => {
    const unsub = window.scoreBridge.on("engine:notes", ({ notes }) => {
      setPianoNotes(notes.map((n2) => ({
        pitch: n2.pitch,
        step: n2.step,
        velocity: n2.velocity,
        duration: 1
      })));
    });
    return unsub;
  }, []);
  reactExports.useEffect(() => {
    const unsub = window.scoreBridge.on("debug:pop", ({ maxDelta, bars }) => {
      addLog("warn", `POP detected at bar ${String(bars)} — max delta ${maxDelta.toFixed(3)} (threshold 0.25). Likely gain staging or scheduling jitter.`);
    });
    return unsub;
  }, [addLog]);
  reactExports.useEffect(() => {
    const unsub = window.scoreBridge.on("layout:load", (layout) => {
      layoutAccRef.current = layout;
      setSavedLayout(layout);
      setLayoutGen((g) => g + 1);
    });
    return unsub;
  }, []);
  reactExports.useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "." && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        window.scoreBridge.send("transport:stop", void 0);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);
  reactExports.useEffect(() => {
    const unsub = window.scoreBridge.on("file:opened", ({ code: loadedCode }) => {
      setCode(loadedCode);
      setError(null);
      setEvalStatus("idle");
      addLog("info", "File opened");
    });
    return unsub;
  }, [addLog]);
  reactExports.useEffect(() => () => {
    if (evalDebounceRef.current !== null) clearTimeout(evalDebounceRef.current);
  }, []);
  const onPanelMoved = reactExports.useCallback((panelId, x2, y2, w2, h2) => {
    layoutAccRef.current = { ...layoutAccRef.current, [panelId]: { x: x2, y: y2, w: w2, h: h2 } };
    window.scoreBridge.send("layout:save", layoutAccRef.current);
  }, []);
  const onEval = reactExports.useCallback(() => {
    setError(null);
    setEvalStatus("pending");
    addLog("info", "Evaluating…");
    window.scoreBridge.send("engine:eval", { code });
  }, [code, addLog]);
  const onPlay = reactExports.useCallback(() => {
    autoPlayRef.current = true;
    setError(null);
    setEvalStatus("pending");
    addLog("info", "Evaluating…");
    window.scoreBridge.send("engine:eval", { code });
  }, [code, addLog]);
  const onStop = reactExports.useCallback(() => {
    autoPlayRef.current = false;
    setPianoNotes([]);
    window.scoreBridge.send("transport:stop", void 0);
  }, []);
  const onRun = reactExports.useCallback(() => {
    setError(null);
    setEvalStatus("pending");
    addLog("info", "Evaluating…");
    if (!engineState.playing) {
      autoPlayRef.current = true;
    }
    window.scoreBridge.send("engine:eval", { code });
  }, [code, addLog, engineState.playing]);
  const onMixerVolume = reactExports.useCallback((index2, volume) => {
    setStripStates((prev) => updateStrip(prev, index2, { volume }));
    window.scoreBridge.send("engine:patch", { tracks: [{ index: index2, volume }] });
    setCode((prev) => patchTrackVolume(prev, index2, volume));
  }, []);
  const onMixerMute = reactExports.useCallback((index2) => {
    const mute = !(stripStates[index2]?.muted ?? false);
    setStripStates((prev) => updateStrip(prev, index2, { muted: mute }));
    window.scoreBridge.send("engine:patch", { tracks: [{ index: index2, mute }] });
    setCode((prev) => patchMute(prev, index2, mute));
  }, [stripStates]);
  const onInstrumentChange = reactExports.useCallback((trackIndex, method, value) => {
    if (method === "_model" && typeof value === "string") {
      setCode((prev) => patchInstrumentModel(prev, trackIndex, value));
    } else {
      setCode((prev) => patchChainMethod(prev, trackIndex, method, value));
      if (method === "volume" && typeof value === "number") {
        setStripStates((prev) => updateStrip(prev, trackIndex, { volume: value }));
        window.scoreBridge.send("engine:patch", { tracks: [{ index: trackIndex, volume: value }] });
      }
    }
    if (evalDebounceRef.current !== null) clearTimeout(evalDebounceRef.current);
    evalDebounceRef.current = setTimeout(() => {
      setError(null);
      setEvalStatus("pending");
      addLog("info", "Evaluating…");
      setCode((latest) => {
        window.scoreBridge.send("engine:eval", { code: latest });
        return latest;
      });
    }, 300);
  }, [addLog]);
  const onInstrumentMute = reactExports.useCallback((trackIndex) => {
    onMixerMute(trackIndex);
  }, [onMixerMute]);
  const onBpmChange = reactExports.useCallback((bpm) => {
    setCode((prev) => patchBpm(prev, bpm));
    if (evalDebounceRef.current !== null) clearTimeout(evalDebounceRef.current);
    evalDebounceRef.current = setTimeout(() => {
      setError(null);
      setEvalStatus("pending");
      addLog("info", "Evaluating…");
      setCode((latest) => {
        window.scoreBridge.send("engine:eval", { code: latest });
        return latest;
      });
    }, 300);
  }, [addLog]);
  const onStepClick = reactExports.useCallback((trackIndex, stepIndex) => {
    const track = tracks[trackIndex];
    if (!track) return;
    const len = track.pattern.length;
    if (len === 0) return;
    const currentVal = track.pattern[stepIndex % len];
    const newVal = currentVal ? 0 : 1;
    setTracks((prev) => prev.map((t2, i) => {
      if (i !== trackIndex) return t2;
      const pat = [...t2.pattern];
      pat[stepIndex % len] = newVal;
      return { ...t2, pattern: pat };
    }));
    setCode((prev) => patchTrackPattern(prev, trackIndex, stepIndex, newVal));
    if (evalDebounceRef.current !== null) clearTimeout(evalDebounceRef.current);
    evalDebounceRef.current = setTimeout(() => {
      setError(null);
      setEvalStatus("pending");
      addLog("info", "Evaluating…");
      setCode((latest) => {
        window.scoreBridge.send("engine:eval", { code: latest });
        return latest;
      });
    }, 300);
  }, [tracks, addLog]);
  const onNoteClick = reactExports.useCallback((pitch, step) => {
    const arpIndex = tracks.findIndex((t2) => t2.type === "arp");
    if (arpIndex === -1) return;
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const octave = Math.floor(pitch / 12) - 1;
    const noteName = `${noteNames[pitch % 12] ?? "C"}${String(octave)}`;
    setCode((prev) => patchTrackNote(prev, arpIndex, step, noteName));
  }, [tracks]);
  const onAddTrack = reactExports.useCallback((instrumentType) => {
    setAddTrackOpen(false);
    const DEFAULTS = {
      kick808: "Kick808(4).decay(0.7).volume(0.8)",
      kick909: "Kick909(4).decay(0.6).volume(0.8)",
      kick: "Kick(4).volume(0.8)",
      snare909: "Snare909(2).decay(0.2).volume(0.6)",
      snare: "Snare(2).volume(0.6)",
      hihat808: "Hihat808(8).decay(0.08).volume(0.3)",
      hihat: "HiHat(8).volume(0.3)",
      bass303: "Bass303('A2').cutoff(600).resonance(0.4).volume(0.6)",
      synth: "Synth('C3').attack(0.01).release(0.4).volume(0.6)",
      subsynth: "SubSynth('C3').filter(1200).volume(0.6)",
      fmsynth: "FMSynth('C3').attack(0.01).release(0.4).volume(0.6)",
      pad: "Pad('Am').attack(0.3).reverb(0.3).volume(0.5)",
      pluck: "Pluck('C3').volume(0.6)"
    };
    const snippet = DEFAULTS[instrumentType] ?? `Synth('C3').volume(0.6)`;
    const base = instrumentType.replace(/\d+$/, "").replace(/[^a-z]/g, "");
    setCode((prev) => {
      const varName = uniqueVarName(prev, base);
      return patchAddInstrument(prev, varName, snippet);
    });
    if (evalDebounceRef.current !== null) clearTimeout(evalDebounceRef.current);
    evalDebounceRef.current = setTimeout(() => {
      setError(null);
      setEvalStatus("pending");
      addLog("info", "Evaluating…");
      setCode((latest) => {
        window.scoreBridge.send("engine:eval", { code: latest });
        return latest;
      });
    }, 80);
  }, [addLog]);
  const onInsert = reactExports.useCallback((snippet) => {
    setCode((prev) => {
      const tracksIdx = prev.indexOf("tracks:");
      if (tracksIdx === -1) return prev + "\n" + snippet;
      const openBracket = prev.indexOf("[", tracksIdx);
      if (openBracket === -1) return prev + "\n" + snippet;
      const closeBracket = Array.from(prev.slice(openBracket + 1)).reduce(
        (acc, ch2, idx) => acc.pos !== -1 ? acc : (() => {
          const d = acc.depth + (ch2 === "[" ? 1 : ch2 === "]" ? -1 : 0);
          return { depth: d, pos: d === 0 ? openBracket + 1 + idx : -1 };
        })(),
        { depth: 1, pos: -1 }
      ).pos;
      const beforeClose = prev.slice(0, closeBracket);
      const lastNewline = beforeClose.lastIndexOf("\n");
      const lineContent = lastNewline !== -1 ? beforeClose.slice(lastNewline + 1) : "";
      const indentMatch = lineContent.match(/^(\s+)/);
      const indent = indentMatch?.[1] ?? "    ";
      return `${prev.slice(0, closeBracket)},
${indent}${snippet}${prev.slice(closeBracket)}`;
    });
  }, []);
  const onNew = reactExports.useCallback(() => {
    if (!window.confirm("Start a new song? Current code will be lost.")) return;
    window.scoreBridge.send("transport:stop", void 0);
    setCode(STARTER$1);
    setError(null);
    setEvalStatus("idle");
    setTracks([]);
    setPianoNotes([]);
    setStripStates([]);
    setLogEntries([]);
    setSelectedTrack(null);
  }, []);
  const onSave = reactExports.useCallback(() => {
    window.scoreBridge.send("file:save", { code });
  }, [code]);
  const onOpen = reactExports.useCallback(() => {
    window.scoreBridge.send("file:open", void 0);
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$4.root, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(TransportBar, { hardware, onHome, onPlay, onStop, onBpmChange }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$4.statusBar, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        BarCounter,
        {
          bars: engineState.bars,
          step: currentStep,
          stepCount: currentStepCount,
          bpm: engineState.bpm,
          playing: engineState.playing
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$4.statusRight, children: [
        pendingSwap && /* @__PURE__ */ jsxRuntimeExports.jsx(
          PendingSwapBadge,
          {
            pending: pendingSwap,
            step: currentStep,
            stepCount: currentStepCount
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          EvalStatus,
          {
            status: evalStatus,
            ...error !== null ? { message: error } : {},
            ...evalTimestamp !== void 0 ? { timestamp: evalTimestamp } : {}
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$4.body, ref: bodyRef, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { ...styles$4.editorPane, flex: `0 0 ${String(splitPct)}%` }, children: [
        error !== null && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles$4.errorBanner, role: "alert", children: error }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$4.editorArea, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            CodeWaveform,
            {
              waveform,
              playing: engineState.playing,
              currentStep,
              stepCount: currentStepCount
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles$4.monacoWrapper, "aria-label": "Song code editor", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            CodeEditorPanel,
            {
              value: code,
              onChange: setCode,
              onEval,
              decorations: editorDecorations,
              stepBadges,
              importsVisible
            }
          ) })
        ] }),
        panels.console && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$4.consolePane, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$4.consoleHeader, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$4.consoleLabel, children: "Console" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                style: styles$4.consoleClose,
                onClick: () => {
                  togglePanel("console");
                },
                "aria-label": "Close console",
                children: "×"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ConsoleLog, { entries: logEntries })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$4.editorFooter, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MasterLevel, { waveform, playing: engineState.playing }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$4.footerBtns, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { style: styles$4.fileBtn, onClick: onNew, "aria-label": "New song", children: "New" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { style: styles$4.fileBtn, onClick: onOpen, "aria-label": "Open song", children: "Open" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { style: styles$4.fileBtn, onClick: onSave, "aria-label": "Save song", children: "Save" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { style: styles$4.fileBtn, onClick: onEval, "aria-label": "Eval song (load without playing)", children: "Eval" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { style: styles$4.evalBtn, onClick: onRun, "aria-label": "Run song", children: "▶ Run" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          role: "separator",
          "aria-label": "Resize editor pane",
          "aria-orientation": "vertical",
          style: styles$4.splitter,
          onMouseDown: onSplitterMouseDown
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$4.canvas, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$4.panelToolbar, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(PanelToggle, { label: "Grid", active: panels.punchcard, onClick: () => {
            togglePanel("punchcard");
          } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(PanelToggle, { label: "Scope", active: panels.scope, onClick: () => {
            togglePanel("scope");
          } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(PanelToggle, { label: "FFT", active: panels.spectrum, onClick: () => {
            togglePanel("spectrum");
          } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(PanelToggle, { label: "Piano", active: panels.piano, onClick: () => {
            togglePanel("piano");
          } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(PanelToggle, { label: "Mixer", active: panels.mixer, onClick: () => {
            togglePanel("mixer");
          } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(PanelToggle, { label: "Console", active: panels.console, onClick: () => {
            togglePanel("console");
          } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(PanelToggle, { label: "Ref", active: panels.reference, onClick: () => {
            togglePanel("reference");
          } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(PanelToggle, { label: "Imports", active: importsVisible, onClick: () => {
            setImportsVisible((v2) => !v2);
          } })
        ] }),
        panels.punchcard && /* @__PURE__ */ jsxRuntimeExports.jsx(
          DraggablePanel,
          {
            title: "Step Grid",
            defaultX: savedLayout["punchcard"]?.x ?? 8,
            defaultY: savedLayout["punchcard"]?.y ?? 48,
            defaultWidth: savedLayout["punchcard"]?.w ?? 560,
            defaultHeight: savedLayout["punchcard"]?.h ?? 160,
            onClose: () => {
              togglePanel("punchcard");
            },
            panelId: "punchcard",
            onMoved: onPanelMoved,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              PunchcardGrid,
              {
                tracks,
                currentStep,
                stepCount: currentStepCount,
                onStepClick,
                onLabelClick: (i) => {
                  setSelectedTrack((prev) => prev === i ? null : i);
                  if (!panels.mixer) togglePanel("mixer");
                },
                selectedTrack
              }
            )
          },
          `punchcard-${String(layoutGen)}`
        ),
        panels.scope && /* @__PURE__ */ jsxRuntimeExports.jsx(
          DraggablePanel,
          {
            title: "Waveform",
            defaultX: savedLayout["scope"]?.x ?? 8,
            defaultY: savedLayout["scope"]?.y ?? 240,
            defaultWidth: savedLayout["scope"]?.w ?? 420,
            defaultHeight: savedLayout["scope"]?.h ?? 160,
            onClose: () => {
              togglePanel("scope");
            },
            panelId: "scope",
            onMoved: onPanelMoved,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Scope, { waveform, playing: engineState.playing })
          },
          `scope-${String(layoutGen)}`
        ),
        panels.spectrum && /* @__PURE__ */ jsxRuntimeExports.jsx(
          DraggablePanel,
          {
            title: "Spectrum",
            defaultX: savedLayout["spectrum"]?.x ?? 440,
            defaultY: savedLayout["spectrum"]?.y ?? 48,
            defaultWidth: savedLayout["spectrum"]?.w ?? 260,
            defaultHeight: savedLayout["spectrum"]?.h ?? 200,
            onClose: () => {
              togglePanel("spectrum");
            },
            panelId: "spectrum",
            onMoved: onPanelMoved,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(SpectrumAnalyser, { bins: fftBins, playing: engineState.playing })
          },
          `spectrum-${String(layoutGen)}`
        ),
        panels.piano && /* @__PURE__ */ jsxRuntimeExports.jsx(
          DraggablePanel,
          {
            title: "Piano Roll",
            defaultX: savedLayout["piano"]?.x ?? 440,
            defaultY: savedLayout["piano"]?.y ?? 260,
            defaultWidth: savedLayout["piano"]?.w ?? 260,
            defaultHeight: savedLayout["piano"]?.h ?? 180,
            onClose: () => {
              togglePanel("piano");
            },
            panelId: "piano",
            onMoved: onPanelMoved,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              PianoRoll,
              {
                notes: pianoNotes,
                currentStep,
                stepCount: currentStepCount,
                onNoteClick
              }
            )
          },
          `piano-${String(layoutGen)}`
        ),
        panels.mixer && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          DraggablePanel,
          {
            title: "Mixer",
            defaultX: savedLayout["mixer"]?.x ?? 8,
            defaultY: savedLayout["mixer"]?.y ?? 320,
            defaultWidth: savedLayout["mixer"]?.w ?? 560,
            defaultHeight: savedLayout["mixer"]?.h ?? 260,
            onClose: () => {
              togglePanel("mixer");
            },
            panelId: "mixer",
            onMoved: onPanelMoved,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$4.mixerInner, children: [
                tracks.map((track, i) => {
                  const isSelected = selectedTrack === i;
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        borderRadius: 3,
                        border: isSelected ? "2px solid #4a8fff" : "2px solid transparent",
                        background: isSelected ? "rgba(74,143,255,0.08)" : "transparent"
                      },
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          MixerStrip,
                          {
                            name: track.name,
                            type: track.type,
                            volume: stripStates[i]?.volume ?? 1,
                            muted: stripStates[i]?.muted ?? false,
                            level: 0,
                            onVolume: (v2) => {
                              onMixerVolume(i, v2);
                            },
                            onMute: () => {
                              onMixerMute(i);
                            }
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "button",
                          {
                            style: {
                              fontSize: 8,
                              fontFamily: "monospace",
                              color: isSelected ? "#4a8fff" : "#3a3a4a",
                              letterSpacing: "0.08em",
                              paddingBottom: 3,
                              userSelect: "none",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              width: "100%"
                            },
                            "aria-label": `${isSelected ? "Close" : "Open"} ${track.name} instrument editor`,
                            title: isSelected ? `Close ${track.name} editor` : `Click to edit ${track.name}`,
                            onClick: () => {
                              setSelectedTrack((prev) => prev === i ? null : i);
                            },
                            children: isSelected ? "▲ EDIT" : "▼ EDIT"
                          }
                        )
                      ]
                    },
                    `${track.name}-${String(i)}`
                  );
                }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 2, alignSelf: "flex-start", paddingTop: 4, position: "relative" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      style: styles$4.addTrackBtn,
                      "aria-label": "Add track",
                      title: "Add a new instrument track",
                      onClick: () => {
                        setAddTrackOpen((v2) => !v2);
                      },
                      children: "+"
                    }
                  ),
                  addTrackOpen && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles$4.addTrackPicker, children: [
                    ["kick808", "Kick 808"],
                    ["kick909", "Kick 909"],
                    ["snare909", "Snare 909"],
                    ["hihat808", "HiHat 808"],
                    ["bass303", "Bass 303"],
                    ["synth", "Synth"],
                    ["subsynth", "SubSynth"],
                    ["fmsynth", "FM Synth"],
                    ["pad", "Pad"],
                    ["pluck", "Pluck"]
                  ].map(([type, label]) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      style: styles$4.addTrackPickerBtn,
                      onClick: () => {
                        onAddTrack(type);
                      },
                      children: label
                    },
                    type
                  )) })
                ] }),
                tracks.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$4.mixerEmpty, children: "No tracks — eval a song first" })
              ] }),
              selectedTrack === null && tracks.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 9, color: "#3a3a52", fontFamily: "monospace", padding: "4px 8px", textAlign: "center", letterSpacing: "0.06em" }, children: "▼ EDIT — click a strip above" }),
              selectedTrack !== null && tracks[selectedTrack] !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                InstrumentPanel,
                {
                  trackIndex: selectedTrack,
                  instrumentType: tracks[selectedTrack].type,
                  trackName: tracks[selectedTrack].name,
                  params: { ...parseTrackChainParams(code, selectedTrack), _model: parseTrackModel(code, selectedTrack), volume: stripStates[selectedTrack]?.volume ?? 1 },
                  muted: stripStates[selectedTrack]?.muted ?? false,
                  onChange: (method, value) => {
                    onInstrumentChange(selectedTrack, method, value);
                  },
                  onMute: () => {
                    onInstrumentMute(selectedTrack);
                  }
                }
              )
            ]
          },
          `mixer-${String(layoutGen)}`
        ),
        panels.reference && /* @__PURE__ */ jsxRuntimeExports.jsx(
          DraggablePanel,
          {
            title: "Reference",
            defaultX: savedLayout["reference"]?.x ?? 440,
            defaultY: savedLayout["reference"]?.y ?? 48,
            defaultWidth: savedLayout["reference"]?.w ?? 260,
            defaultHeight: savedLayout["reference"]?.h ?? 380,
            onClose: () => {
              togglePanel("reference");
            },
            panelId: "reference",
            onMoved: onPanelMoved,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ReferencePanel, { onInsert })
          },
          `reference-${String(layoutGen)}`
        )
      ] })
    ] })
  ] });
};
const styles$4 = {
  root: { display: "flex", flexDirection: "column", height: "100vh", background: "#0c0c0e" },
  statusBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 0.75rem",
    height: "36px",
    flexShrink: 0,
    borderBottom: "1px solid #1e1e22",
    background: "#0a0a0d"
  },
  statusRight: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem"
  },
  body: { display: "flex", flex: 1, overflow: "hidden" },
  editorPane: {
    // flex is overridden inline with splitPct state — this value acts as fallback only
    flex: "0 0 50%",
    display: "flex",
    flexDirection: "column",
    background: "#0d0d10",
    overflow: "hidden"
  },
  splitter: {
    width: "6px",
    cursor: "col-resize",
    background: "#1e1e22",
    flexShrink: 0,
    transition: "background 0.15s",
    userSelect: "none"
  },
  errorBanner: {
    background: "#3a1a1a",
    color: "#ff6b6b",
    padding: "0.4rem 0.75rem",
    fontSize: "0.75rem",
    borderBottom: "1px solid #5a2a2a",
    flexShrink: 0,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
  },
  // Container for waveform + textarea stacked absolutely
  editorArea: {
    flex: 1,
    position: "relative",
    display: "flex"
  },
  monacoWrapper: {
    flex: 1,
    position: "relative",
    zIndex: 1,
    // Monaco needs an explicit height to fill flex container
    minHeight: 0
  },
  consolePane: {
    flexShrink: 0,
    height: "120px",
    borderTop: "1px solid #1e1e22",
    display: "flex",
    flexDirection: "column",
    background: "#080809"
  },
  consoleHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 0.5rem",
    height: "22px",
    flexShrink: 0,
    borderBottom: "1px solid #141418",
    background: "#0a0a0d"
  },
  consoleLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.6rem",
    color: "#3a3a46",
    textTransform: "uppercase",
    letterSpacing: "0.1em"
  },
  consoleClose: {
    background: "none",
    border: "none",
    color: "#3a3a46",
    cursor: "pointer",
    fontSize: "1rem",
    lineHeight: 1,
    padding: "0"
  },
  editorFooter: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "4px 8px",
    borderTop: "1px solid #1e1e22",
    background: "#0a0a0d"
  },
  footerBtns: {
    display: "flex",
    gap: "6px",
    alignItems: "center"
  },
  fileBtn: {
    height: "28px",
    background: "none",
    border: "1px solid #1e1e28",
    borderRadius: "2px",
    color: "#3a3a50",
    fontSize: "0.68rem",
    letterSpacing: "0.06em",
    cursor: "pointer",
    padding: "0 0.6rem"
  },
  evalBtn: {
    height: "28px",
    background: "#152035",
    border: "1px solid #2a4a7a",
    borderRadius: "2px",
    color: "#6a9fff",
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    cursor: "pointer",
    padding: "0 1rem"
  },
  canvas: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    background: "#090909"
  },
  panelToolbar: {
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 200,
    display: "flex",
    gap: "4px"
  },
  mixerInner: {
    display: "flex",
    flexWrap: "nowrap",
    gap: "4px",
    padding: "6px",
    overflowX: "auto",
    alignItems: "flex-start"
  },
  mixerEmpty: {
    color: "#3a3a46",
    fontSize: "0.75rem",
    fontFamily: "'JetBrains Mono', monospace",
    padding: "8px"
  },
  addTrackBtn: {
    width: "32px",
    height: "32px",
    background: "#141420",
    border: "1px solid #2a2a42",
    borderRadius: "3px",
    color: "#4a8fff",
    fontSize: "1.2rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    padding: 0,
    lineHeight: 1
  },
  addTrackPicker: {
    position: "absolute",
    bottom: "38px",
    // opens upward above the + button
    left: 0,
    zIndex: 300,
    background: "#0e0e14",
    border: "1px solid #2a2a42",
    borderRadius: "4px",
    display: "flex",
    flexDirection: "column",
    minWidth: "90px",
    maxHeight: "260px",
    overflowY: "auto",
    boxShadow: "0 -4px 16px #0006"
  },
  addTrackPickerBtn: {
    background: "none",
    border: "none",
    borderBottom: "1px solid #1a1a28",
    color: "#8a9ab0",
    fontSize: "0.65rem",
    fontFamily: "monospace",
    letterSpacing: "0.05em",
    padding: "5px 10px",
    cursor: "pointer",
    textAlign: "left"
  }
};
const Produce = ({ hardware, onHome }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$3.root, children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(TransportBar, { hardware, onHome }),
  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$3.body, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles$3.trackHeaders, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles$3.trackLanes, children: ["Kick", "Bass", "Lead", "Pad", "FX"].map((name, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$3.trackLane, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { ...styles$3.trackLaneStrip, background: TRACK_COLORS[i] } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$3.trackLaneName, children: name }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { style: styles$3.trackLaneMute, children: "M" })
    ] }, name)) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$3.timeline, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles$3.timelineRuler, children: [1, 2, 3, 4, 5, 6, 7, 8].map((bar) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { ...styles$3.timelineRulerLabel, marginRight: "3rem" }, children: bar }, bar)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles$3.timelineBody, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$3.placeholder, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$3.placeholderIcon, children: "▦" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$3.sub, children: "Clip timeline — Phase 13c" })
      ] }) })
    ] })
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles$3.mixerStrip, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles$3.placeholder, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$3.sub, children: "Mixer — Phase 13" }) }) })
] });
const styles$3 = {
  root: { display: "flex", flexDirection: "column", height: "100vh", background: "#0c0c0e" },
  body: { display: "flex", flex: 1, overflow: "hidden" },
  trackHeaders: {
    flex: "0 0 200px",
    borderRight: "1px solid #1e1e22",
    display: "flex",
    flexDirection: "column",
    background: "#111113",
    overflowY: "auto"
  },
  timeline: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "#0c0c0e"
  },
  mixerStrip: {
    height: "130px",
    borderTop: "1px solid #1e1e22",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0e0e11"
  },
  // Track header lane items (phase 13 — stubs)
  trackLanes: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
    padding: "0.5rem 0",
    flex: 1
  },
  trackLane: {
    display: "flex",
    alignItems: "center",
    height: "40px",
    borderBottom: "1px solid #1a1a1e",
    gap: "0.5rem",
    paddingRight: "0.5rem"
  },
  trackLaneStrip: {
    width: "3px",
    height: "100%",
    flexShrink: 0
  },
  trackLaneName: {
    fontFamily: "system-ui, sans-serif",
    fontSize: "0.72rem",
    color: "#8a9aaa",
    flex: 1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  trackLaneMute: {
    fontFamily: "system-ui, sans-serif",
    fontSize: "0.55rem",
    color: "#3e3e46",
    letterSpacing: "0.1em",
    padding: "0.1rem 0.25rem",
    border: "1px solid #1e1e22",
    borderRadius: "2px",
    cursor: "pointer",
    background: "none"
  },
  // Timeline ruler stub
  timelineRuler: {
    height: "20px",
    borderBottom: "1px solid #1e1e22",
    background: "#0e0e11",
    display: "flex",
    alignItems: "center",
    paddingLeft: "0.5rem"
  },
  timelineRulerLabel: {
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: "0.6rem",
    color: "#3e3e46",
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "0.08em"
  },
  timelineBody: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  placeholder: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", color: "#2e2e36" },
  placeholderIcon: { fontFamily: "monospace", fontSize: "2rem", color: "#2a4a6a" },
  sub: { fontFamily: "system-ui, sans-serif", fontSize: "0.7rem", color: "#2a2a32", letterSpacing: "0.06em" }
};
const TRACK_COLORS = ["#3a7a5a", "#3a5a8a", "#6a4a8a", "#8a6a3a", "#8a3a4a"];
const STARTER = `import { Song, Kick, Synth } from '@score/core'

const kick = Kick({
  pattern: [1, 0, 0, 0, 1, 0, 0, 0],
  volume:  0.9,
})

export default Song({
  bpm:    130,
  tracks: [kick],
})`;
const DJSet = ({ hardware, onHome }) => {
  const [codeOpen, setCodeOpen] = reactExports.useState(false);
  const [code, setCode] = reactExports.useState(STARTER);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$2.root, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(TransportBar, { hardware, onHome }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$2.body, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { ...styles$2.codePanel, width: codeOpen ? "280px" : "0" }, children: codeOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$2.codePanelHeader, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$2.codePanelTitle, children: "song.ts" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              style: styles$2.codeToggleBtn,
              onClick: () => {
                setCodeOpen(false);
              },
              "aria-label": "Close code panel",
              children: "✕"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            style: styles$2.codeEditor,
            value: code,
            onChange: (e) => {
              setCode(e.target.value);
            },
            spellCheck: false,
            "aria-label": "Song code"
          }
        )
      ] }) }),
      !codeOpen && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          style: styles$2.codeTab,
          onClick: () => {
            setCodeOpen(true);
          },
          "aria-label": "Open code panel",
          title: "Show song code",
          children: "{ }"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$2.deck, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$2.deckHeader, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$2.deckLabel, children: "A" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$2.deckSub, children: "Deck A" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$2.placeholder, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$2.placeholderIcon, children: "⊙" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$2.placeholderText, children: "Waveform · Beat grid · Hot cues" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$2.sub, children: "Phase 12e" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles$2.centreStrip, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$2.placeholder, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$2.sub, children: "FX" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles$2.crossfaderTrack, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles$2.crossfaderThumb }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$2.sub, children: "Phase 12e" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$2.deck, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$2.deckHeader, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$2.deckLabel, children: "B" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$2.deckSub, children: "Deck B" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$2.placeholder, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$2.placeholderIcon, children: "⊙" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$2.placeholderText, children: "Waveform · Beat grid · Hot cues" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$2.sub, children: "Phase 12e" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles$2.library, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$2.libraryHeader, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$2.libraryLabel, children: "Library" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$2.sub, children: hardware === "aio" ? "AIO display mirrors library" : "Drag tracks to decks · Phase 12e" })
    ] }) })
  ] });
};
const styles$2 = {
  root: { display: "flex", flexDirection: "column", height: "100vh", background: "#0c0c0e" },
  body: { display: "flex", flex: 1, overflow: "hidden", position: "relative" },
  // Code panel
  codePanel: {
    borderRight: "1px solid #1e1e22",
    background: "#0d0d10",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    transition: "width 0.15s ease",
    flexShrink: 0
  },
  codePanelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.3rem 0.5rem",
    background: "#111113",
    borderBottom: "1px solid #1e1e22",
    flexShrink: 0
  },
  codePanelTitle: {
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: "0.7rem",
    color: "#4a4a52",
    letterSpacing: "0.04em"
  },
  codeToggleBtn: {
    background: "none",
    border: "none",
    color: "#3e3e46",
    fontSize: "0.65rem",
    cursor: "pointer",
    padding: "0.1rem 0.25rem"
  },
  codeEditor: {
    flex: 1,
    width: "100%",
    background: "#080809",
    color: "#8a9ab8",
    border: "none",
    outline: "none",
    padding: "0.6rem",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: "0.72rem",
    lineHeight: 1.6,
    resize: "none",
    tabSize: 2
  },
  codeTab: {
    position: "absolute",
    left: 0,
    top: "50%",
    transform: "translateY(-50%)",
    background: "#111113",
    border: "1px solid #1e1e22",
    borderLeft: "none",
    borderRadius: "0 3px 3px 0",
    color: "#3e3e46",
    fontFamily: "monospace",
    fontSize: "0.7rem",
    padding: "0.4rem 0.25rem",
    cursor: "pointer",
    writingMode: "vertical-rl",
    letterSpacing: "0.12em",
    zIndex: 1
  },
  // Decks
  deck: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid #1e1e22",
    background: "#0e0e11"
  },
  deckHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.4rem 0.7rem",
    borderBottom: "1px solid #1e1e22",
    background: "#111113",
    flexShrink: 0
  },
  deckLabel: {
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: "1rem",
    fontWeight: 700,
    color: "#4a8fff",
    lineHeight: 1
  },
  deckSub: {
    fontFamily: "system-ui, sans-serif",
    fontSize: "0.65rem",
    color: "#3e3e46",
    letterSpacing: "0.08em"
  },
  centreStrip: {
    flex: "0 0 160px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRight: "1px solid #1e1e22",
    background: "#111113"
  },
  crossfaderTrack: {
    width: "100px",
    height: "4px",
    background: "#1e1e22",
    borderRadius: "2px",
    position: "relative",
    margin: "0.5rem 0"
  },
  crossfaderThumb: {
    position: "absolute",
    left: "50%",
    top: "-4px",
    transform: "translateX(-50%)",
    width: "10px",
    height: "12px",
    background: "#252528",
    border: "1px solid #3a3a42",
    borderRadius: "2px"
  },
  // Library
  library: {
    height: "160px",
    borderTop: "1px solid #1e1e22",
    display: "flex",
    flexDirection: "column",
    background: "#111113"
  },
  libraryHeader: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "0.4rem 0.75rem",
    borderBottom: "1px solid #1e1e22",
    background: "#0e0e11",
    flexShrink: 0
  },
  libraryLabel: {
    fontFamily: "system-ui, sans-serif",
    fontSize: "0.65rem",
    color: "#4a4a52",
    letterSpacing: "0.1em",
    textTransform: "uppercase"
  },
  // Shared placeholders
  placeholder: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "0.4rem" },
  placeholderIcon: { fontFamily: "monospace", fontSize: "1.8rem", color: "#1e2e3e", lineHeight: 1 },
  placeholderText: { fontFamily: "system-ui, sans-serif", fontSize: "0.7rem", color: "#2a2a32" },
  sub: { fontFamily: "system-ui, sans-serif", fontSize: "0.65rem", color: "#2a2a32", letterSpacing: "0.06em" }
};
const JamSession = ({ hardware, onHome }) => {
  const [midiConnected, setMidiConnected] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const off = window.scoreBridge.on("midi:status", ({ connected }) => {
      setMidiConnected(connected);
    });
    return off;
  }, []);
  const handleConnectMidi = () => {
    window.scoreBridge.send("midi:connect", void 0);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$1.root, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(TransportBar, { hardware, onHome }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$1.body, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles$1.midiPanel, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$1.placeholder, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$1.placeholderIcon, children: "⊕" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "MIDI Controller" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: {
          ...styles$1.statusBadge,
          ...midiConnected ? styles$1.statusBadgeOn : styles$1.statusBadgeOff
        }, children: midiConnected ? "CONNECTED" : "NOT CONNECTED" }),
        !midiConnected && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { style: styles$1.connectBtn, onClick: handleConnectMidi, children: "Connect MIDI" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$1.sub, children: hardware === "aio" ? "Pioneer XDJ — mapping loaded" : hardware === "controller" ? "Generic MIDI controller" : "No hardware — keyboard + mouse only" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles$1.muteMatrix, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$1.placeholder, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Track mute matrix — Phase 13b" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$1.sub, children: "Per-track mute · Volume · FX send" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles$1.mappingPanel, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles$1.placeholder, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "MIDI mapping — Phase 13b" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles$1.sub, children: "Controller → engine parameter visualiser" })
      ] }) })
    ] })
  ] });
};
const styles$1 = {
  root: { display: "flex", flexDirection: "column", height: "100vh", background: "#0c0c0e" },
  body: { display: "flex", flex: 1, overflow: "hidden" },
  midiPanel: {
    flex: "0 0 260px",
    borderRight: "1px solid #1e1e22",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#111113"
  },
  muteMatrix: {
    flex: 1,
    borderRight: "1px solid #1e1e22",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0c0c0e"
  },
  mappingPanel: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0c0c0e"
  },
  placeholder: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6rem", color: "#2e2e36" },
  placeholderIcon: { fontFamily: "monospace", fontSize: "2rem", color: "#2a4a6a" },
  sub: { fontFamily: "system-ui, sans-serif", fontSize: "0.7rem", color: "#2a2a32", letterSpacing: "0.06em" },
  statusBadge: {
    fontFamily: "system-ui, sans-serif",
    fontSize: "0.6rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    padding: "0.18rem 0.5rem",
    borderRadius: "2px"
  },
  statusBadgeOn: { background: "#0e2a1a", color: "#4adf8f", border: "1px solid #1a5a30" },
  statusBadgeOff: { background: "#111113", color: "#3e3e46", border: "1px solid #1e1e22" },
  connectBtn: {
    fontFamily: "system-ui, sans-serif",
    fontSize: "0.75rem",
    letterSpacing: "0.08em",
    padding: "0.35rem 0.9rem",
    background: "#0e1825",
    border: "1px solid #253050",
    borderRadius: "3px",
    color: "#4a8fff",
    cursor: "pointer"
  }
};
const darkPulseAppTheme = {
  name: "dark-pulse",
  background: "#0e0e11",
  surface: "#111318",
  border: "#1e1e22",
  text: "#c8d8f8",
  textMuted: "#556688",
  accent: "#4a8fff",
  accentMuted: "#1a2035",
  error: "#ff4a4a",
  tracks: ["#4a8fff", "#ff6b35", "#44cc88", "#cc44aa", "#ffcc00", "#44cccc", "#ff4a4a", "#88cc44"]
};
const lorenzAppTheme = {
  name: "lorenz",
  background: "#050008",
  surface: "#0d0012",
  border: "#1a0025",
  text: "#e8d8ff",
  textMuted: "#664488",
  accent: "#cc44ff",
  accentMuted: "#220033",
  error: "#ff4466",
  tracks: ["#cc44ff", "#ff44cc", "#8844ff", "#ff6688", "#aa66ff", "#ff88aa", "#6688ff", "#ffaa66"]
};
const neonGridAppTheme = {
  name: "neon-grid",
  background: "#000510",
  surface: "#000c1a",
  border: "#001830",
  text: "#ccffee",
  textMuted: "#224466",
  accent: "#00ff88",
  accentMuted: "#002211",
  error: "#ff4466",
  tracks: ["#00ff88", "#00ccff", "#88ff00", "#ffcc00", "#ff8800", "#ff0088", "#8800ff", "#00ffcc"]
};
const logisticAppTheme = {
  name: "logistic",
  background: "#0a0800",
  surface: "#150f00",
  border: "#2a1e00",
  text: "#ffe8cc",
  textMuted: "#886633",
  accent: "#ffaa00",
  accentMuted: "#332200",
  error: "#ff4444",
  tracks: ["#ffaa00", "#ff6600", "#ffcc44", "#ff3300", "#ffee88", "#ff8800", "#ffdd00", "#ff4400"]
};
const euclideanAppTheme = {
  name: "euclidean-mandala",
  background: "#00080a",
  surface: "#001015",
  border: "#001820",
  text: "#ccffff",
  textMuted: "#226688",
  accent: "#00ccff",
  accentMuted: "#001122",
  error: "#ff4455",
  tracks: ["#00ccff", "#00ffcc", "#0088ff", "#00ffaa", "#44aaff", "#00ddaa", "#22aaff", "#00cc88"]
};
const probabilityAppTheme = {
  name: "probability-storm",
  background: "#020a02",
  surface: "#051005",
  border: "#0a1a0a",
  text: "#ccffcc",
  textMuted: "#336633",
  accent: "#44ff44",
  accentMuted: "#0a1a0a",
  error: "#ff4444",
  tracks: ["#44ff44", "#88ff44", "#44ff88", "#aaff22", "#66ff66", "#ccff44", "#33ff33", "#99ff55"]
};
const minimalAppTheme = {
  name: "minimal",
  background: "#080808",
  surface: "#101010",
  border: "#1c1c1c",
  text: "#e0e0e0",
  textMuted: "#505050",
  accent: "#a0a0a0",
  accentMuted: "#1c1c1c",
  error: "#ff4444",
  tracks: ["#ffffff", "#cccccc", "#aaaaaa", "#888888", "#dddddd", "#bbbbbb", "#999999", "#eeeeee"]
};
const cycleRingsAppTheme = {
  name: "cycle-rings",
  background: "#0a0805",
  surface: "#130f08",
  border: "#221a0e",
  text: "#fff0cc",
  textMuted: "#776644",
  accent: "#ffaa44",
  accentMuted: "#221505",
  error: "#ff4455",
  tracks: ["#ffaa44", "#ff6688", "#88ffaa", "#ffcc22", "#44ccff", "#ff88cc", "#aaff44", "#ff4488"]
};
const eventCascadeAppTheme = {
  name: "event-cascade",
  background: "#060606",
  surface: "#0e0e0e",
  border: "#1a1a1a",
  text: "#f0f0f0",
  textMuted: "#606060",
  accent: "#ff6644",
  accentMuted: "#1a0a08",
  error: "#ff3333",
  tracks: ["#ff6644", "#44aaff", "#44ff88", "#ffcc00", "#ff44aa", "#88ff44", "#ff8800", "#44ffcc"]
};
const tidalStreamAppTheme = {
  name: "tidal-stream",
  background: "#00060a",
  surface: "#000c14",
  border: "#001520",
  text: "#cceeff",
  textMuted: "#336688",
  accent: "#44aaff",
  accentMuted: "#001122",
  error: "#ff4466",
  tracks: ["#44aaff", "#00ccdd", "#6688ff", "#00eebb", "#4488ff", "#22ccff", "#8866ff", "#00ffdd"]
};
const VisualsError = (message) => {
  const err = new Error(message);
  err.name = "ScoreError";
  return err;
};
const themeRegistry = /* @__PURE__ */ new Map();
const defineTheme = (bundle) => bundle;
const registerTheme = (bundle) => {
  themeRegistry.set(bundle.name, bundle);
};
const getTheme = (name) => {
  const bundle = themeRegistry.get(name);
  if (bundle === void 0) {
    throw VisualsError(`@score/visuals: theme '${name}' is not registered. Available themes: [${listThemes().join(", ")}]. Did you forget to import '@score/visuals'?`);
  }
  return bundle;
};
const listThemes = () => [...themeRegistry.keys()];
const annotationRegistry = /* @__PURE__ */ new Map();
const defineAnnotationSource = (fn) => fn;
const registerAnnotationSource = (name, fn) => {
  annotationRegistry.set(name, fn);
};
const waveformLayer = (waveform, color, alpha = 0.8) => ({
  kind: "waveform",
  color,
  alpha,
  data: { waveform }
});
const spectrumLayer = (bins, color, alpha = 0.7) => ({
  kind: "spectrum",
  color,
  alpha,
  data: { bins }
});
const radialGlowLayer = (rms, color, alpha = 0.6) => ({
  kind: "radial-glow",
  color,
  alpha,
  data: { rms }
});
const stepBarLayer = (step, stepCount, color, alpha = 0.5) => ({
  kind: "step-bar",
  color,
  alpha,
  data: { step, stepCount }
});
const euclideanRingLayer = (pattern, step, color, radius, alpha = 0.9) => ({
  kind: "euclidean-ring",
  color,
  alpha,
  data: { pattern, step, radius }
});
const gridLayer = (bins, color, alpha = 0.85) => ({
  kind: "grid",
  color,
  alpha,
  data: { bins }
});
const attractorPointsLayer = (points, color, alpha = 0.7) => ({
  kind: "attractor-points",
  color,
  alpha,
  data: { points }
});
const probabilityFieldLayer = (probs, color, alpha = 0.6) => ({
  kind: "probability-field",
  color,
  alpha,
  data: { probs }
});
const particleBurstLayer = (active, color, alpha = 0.9) => ({
  kind: "particle-burst",
  color,
  alpha,
  data: { active }
});
const RING_BASE_R = 160;
const RING_SPACING = 48;
const darkPulseCanvas = (state) => {
  const { waveform, rms, tick, tracks } = state;
  const { step } = tick;
  const theme = darkPulseAppTheme;
  const glow = radialGlowLayer(rms, theme.accent, 0.55);
  const wave = waveformLayer(waveform, theme.textMuted, 0.45);
  const rings = tracks.filter((t2) => t2.pattern !== void 0 && t2.pattern.length > 0).slice(0, 6).map((t2, i) => euclideanRingLayer(t2.pattern, step, theme.tracks[i % theme.tracks.length] ?? theme.accent, RING_BASE_R + i * RING_SPACING, t2.active ? 0.95 : 0.55));
  const bar = stepBarLayer(step, 16, theme.accentMuted, 0.35);
  return {
    _type: "VisualSceneDescriptor",
    background: theme.background,
    layers: [bar, wave, glow, ...rings]
  };
};
const darkPulseBundle = defineTheme({
  name: "dark-pulse",
  appTheme: darkPulseAppTheme,
  canvasTheme: darkPulseCanvas
});
const rk4 = (state, t2, dt, deriv, add, scale) => {
  const k1 = deriv(state, t2);
  const k2 = deriv(add(state, scale(k1, dt / 2)), t2 + dt / 2);
  const k3 = deriv(add(state, scale(k2, dt / 2)), t2 + dt / 2);
  const k4 = deriv(add(state, scale(k3, dt)), t2 + dt);
  return add(state, scale(add(add(add(k1, scale(k2, 2)), scale(k3, 2)), k4), dt / 6));
};
const lorenzDeriv = (sigma, rho, beta) => (state, _t) => ({
  x: sigma * (state.y - state.x),
  y: state.x * (rho - state.z) - state.y,
  z: state.x * state.y - beta * state.z
});
const lorenzAdd = (a, b) => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z
});
const lorenzScale = (a, k2) => ({
  x: a.x * k2,
  y: a.y * k2,
  z: a.z * k2
});
const createLorenz = (params) => {
  const sigma = params?.sigma;
  const rho = params?.rho;
  const beta = params?.beta;
  const initial = { x: 0.1, y: 0, z: 0 };
  const deriv = lorenzDeriv(sigma, rho, beta);
  const sim = { current: { ...initial }, t: 0 };
  return {
    /**
     * Advance the simulation one RK4 step and return the new state.
     *
     * @param dt - Time step size. Default `0.01`.
     * @returns New `LorenzState` after advancing by `dt`.
     */
    next(dt = 0.01) {
      sim.current = rk4(sim.current, sim.t, dt, deriv, lorenzAdd, lorenzScale);
      sim.t += dt;
      return { ...sim.current };
    },
    /**
     * Reset the simulation to the initial state and time.
     */
    reset() {
      sim.current = { ...initial };
      sim.t = 0;
    },
    /**
     * The current state of the Lorenz system.
     */
    get state() {
      return { ...sim.current };
    }
  };
};
const TRAIL_LENGTH = 512;
const DT_BASE = 8e-3;
const trail = [];
const lorenz = createLorenz({ sigma: 10, rho: 28, beta: 8 / 3 });
const normalise = (v2, min, max) => Math.max(0, Math.min(1, (v2 - min) / (max - min)));
const lorenzCanvas = (state) => {
  const { rms, waveform, tracks, tick, math } = state;
  const theme = lorenzAppTheme;
  const dt = DT_BASE * (1 + (tick.bpm / 128 - 1) * 0.3);
  if (math?.lorenz !== void 0) {
    const { x: x2, y: y2 } = math.lorenz;
    const nx = normalise(x2, -25, 25);
    const ny = normalise(y2, -30, 30);
    trail.push([nx, ny]);
  } else {
    const next = lorenz.next(dt);
    const nx = normalise(next.x, -25, 25);
    const ny = normalise(next.y, -30, 30);
    trail.push([nx, ny]);
  }
  if (trail.length > TRAIL_LENGTH)
    trail.splice(0, trail.length - TRAIL_LENGTH);
  const trailColor = tracks[0]?.active ? theme.accent : theme.textMuted;
  const attractor = attractorPointsLayer(trail, trailColor, 0.8);
  const glow = radialGlowLayer(rms, theme.accent, 0.4);
  const wave = waveformLayer(waveform, theme.border, 0.25);
  const rings = tracks.filter((t2) => t2.pattern !== void 0 && t2.pattern.length > 0).slice(0, 3).map((t2, i) => euclideanRingLayer(t2.pattern, tick.step, theme.tracks[i % theme.tracks.length] ?? theme.accent, 120 + i * 40, t2.active ? 0.7 : 0.3));
  return {
    _type: "VisualSceneDescriptor",
    background: theme.background,
    layers: [wave, ...rings, glow, attractor]
  };
};
const lorenzBundle = defineTheme({
  name: "lorenz",
  appTheme: lorenzAppTheme,
  canvasTheme: lorenzCanvas
});
const neonGridCanvas = (state) => ({
  _type: "VisualSceneDescriptor",
  background: neonGridAppTheme.background,
  layers: [
    waveformLayer(state.waveform, neonGridAppTheme.textMuted, 0.4),
    gridLayer(state.bins, neonGridAppTheme.accent, 0.8)
  ]
});
const neonGridBundle = defineTheme({
  name: "neon-grid",
  appTheme: neonGridAppTheme,
  canvasTheme: neonGridCanvas
});
const logisticCanvas = (state) => ({
  _type: "VisualSceneDescriptor",
  background: logisticAppTheme.background,
  layers: [
    waveformLayer(state.waveform, logisticAppTheme.textMuted, 0.4),
    spectrumLayer(state.bins, logisticAppTheme.accent, 0.7)
  ]
});
const logisticBundle = defineTheme({
  name: "logistic",
  appTheme: logisticAppTheme,
  canvasTheme: logisticCanvas
});
const euclideanMandalaCanvas = (state) => ({
  _type: "VisualSceneDescriptor",
  background: euclideanAppTheme.background,
  layers: [
    radialGlowLayer(state.rms, euclideanAppTheme.accent, 0.5),
    ...state.tracks.filter((t2) => t2.pattern !== void 0).slice(0, 5).map((t2, i) => euclideanRingLayer(t2.pattern, state.tick.step, euclideanAppTheme.tracks[i % euclideanAppTheme.tracks.length] ?? euclideanAppTheme.accent, 100 + i * 50, 0.8))
  ]
});
const euclideanMandalaBundle = defineTheme({
  name: "euclidean-mandala",
  appTheme: euclideanAppTheme,
  canvasTheme: euclideanMandalaCanvas
});
const probabilityStormCanvas = (state) => ({
  _type: "VisualSceneDescriptor",
  background: probabilityAppTheme.background,
  layers: [
    waveformLayer(state.waveform, probabilityAppTheme.textMuted, 0.3),
    ...state.tracks.filter((t2) => t2.pattern !== void 0 && t2.pattern.length > 0).slice(0, 3).map((t2) => probabilityFieldLayer(t2.pattern, probabilityAppTheme.accent, 0.6))
  ]
});
const probabilityStormBundle = defineTheme({
  name: "probability-storm",
  appTheme: probabilityAppTheme,
  canvasTheme: probabilityStormCanvas
});
const minimalCanvas = (state) => ({
  _type: "VisualSceneDescriptor",
  background: minimalAppTheme.background,
  layers: [
    waveformLayer(state.waveform, minimalAppTheme.accent, 0.7),
    stepBarLayer(state.tick.step, 16, minimalAppTheme.textMuted, 0.4)
  ]
});
const minimalBundle = defineTheme({
  name: "minimal",
  appTheme: minimalAppTheme,
  canvasTheme: minimalCanvas
});
const cycleRingsCanvas = (state) => ({
  _type: "VisualSceneDescriptor",
  background: cycleRingsAppTheme.background,
  layers: [
    radialGlowLayer(state.rms, cycleRingsAppTheme.accent, 0.4),
    ...state.tracks.filter((t2) => t2.pattern !== void 0).slice(0, 6).map((t2, i) => euclideanRingLayer(t2.pattern, state.tick.step, cycleRingsAppTheme.tracks[i % cycleRingsAppTheme.tracks.length] ?? cycleRingsAppTheme.accent, 80 + i * 44, t2.active ? 1 : 0.5))
  ]
});
const cycleRingsBundle = defineTheme({
  name: "cycle-rings",
  appTheme: cycleRingsAppTheme,
  canvasTheme: cycleRingsCanvas
});
const eventCascadeCanvas = (state) => ({
  _type: "VisualSceneDescriptor",
  background: eventCascadeAppTheme.background,
  layers: [
    waveformLayer(state.waveform, eventCascadeAppTheme.textMuted, 0.3),
    ...state.tracks.filter((t2) => t2.active).slice(0, 4).map((t2, i) => particleBurstLayer(t2.active, eventCascadeAppTheme.tracks[i % eventCascadeAppTheme.tracks.length] ?? eventCascadeAppTheme.accent, 0.9))
  ]
});
const eventCascadeBundle = defineTheme({
  name: "event-cascade",
  appTheme: eventCascadeAppTheme,
  canvasTheme: eventCascadeCanvas
});
const tidalStreamCanvas = (state) => ({
  _type: "VisualSceneDescriptor",
  background: tidalStreamAppTheme.background,
  layers: [
    spectrumLayer(state.bins, tidalStreamAppTheme.accentMuted, 0.5),
    waveformLayer(state.waveform, tidalStreamAppTheme.accent, 0.8),
    stepBarLayer(state.tick.step, 16, tidalStreamAppTheme.textMuted, 0.3)
  ]
});
const tidalStreamBundle = defineTheme({
  name: "tidal-stream",
  appTheme: tidalStreamAppTheme,
  canvasTheme: tidalStreamCanvas
});
const defaultAnnotationSource = defineAnnotationSource((state, varMap) => {
  if (varMap.length === 0)
    return [];
  const varIndex = new Map(varMap.map((v2) => [v2.name, v2.lineNumber]));
  return state.tracks.filter((t2) => t2.pattern !== void 0 && t2.pattern.length > 0).flatMap((t2, i) => {
    const lineNumber = varIndex.get(t2.name);
    if (lineNumber === void 0)
      return [];
    return [{
      variableName: t2.name,
      lineNumber,
      trackIndex: i,
      pattern: t2.pattern,
      step: state.tick.step,
      color: darkPulseAppTheme.tracks[i % darkPulseAppTheme.tracks.length] ?? darkPulseAppTheme.accent
    }];
  });
});
registerTheme(darkPulseBundle);
registerTheme(lorenzBundle);
registerTheme(neonGridBundle);
registerTheme(logisticBundle);
registerTheme(euclideanMandalaBundle);
registerTheme(probabilityStormBundle);
registerTheme(minimalBundle);
registerTheme(cycleRingsBundle);
registerTheme(eventCascadeBundle);
registerTheme(tidalStreamBundle);
registerAnnotationSource("default", defaultAnnotationSource);
const drawWaveform = (ctx, w2, h2, layer) => {
  const waveform = layer.data["waveform"];
  if (!waveform || waveform.length === 0) return;
  ctx.globalAlpha = layer.alpha;
  ctx.strokeStyle = layer.color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const sliceW = w2 / waveform.length;
  waveform.forEach((s, i) => {
    const x2 = i * sliceW;
    const y2 = h2 / 2 + s * (h2 / 2) * 0.8;
    if (i === 0) ctx.moveTo(x2, y2);
    else ctx.lineTo(x2, y2);
  });
  ctx.stroke();
};
const drawSpectrum = (ctx, w2, h2, layer) => {
  const bins = layer.data["bins"];
  if (!bins || bins.length === 0) return;
  ctx.globalAlpha = layer.alpha;
  ctx.fillStyle = layer.color;
  const barW = w2 / bins.length;
  bins.forEach((mag, i) => {
    const barH = mag * h2 * 0.8;
    ctx.fillRect(i * barW, h2 - barH, barW - 1, barH);
  });
};
const drawRadialGlow = (ctx, w2, h2, layer) => {
  const rms = layer.data["rms"] ?? 0;
  const cx = w2 / 2;
  const cy = h2 / 2;
  const radius = 80 + rms * 180;
  const blur = 20 + rms * 60;
  ctx.globalAlpha = layer.alpha;
  const gradient = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius + blur);
  gradient.addColorStop(0, layer.color + "aa");
  gradient.addColorStop(0.5, layer.color + "44");
  gradient.addColorStop(1, layer.color + "00");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + blur, 0, Math.PI * 2);
  ctx.fill();
};
const drawStepBar = (ctx, w2, h2, layer) => {
  const step = layer.data["step"] ?? 0;
  const stepCount = layer.data["stepCount"] ?? 16;
  const x2 = step / stepCount * w2;
  ctx.globalAlpha = layer.alpha;
  ctx.strokeStyle = layer.color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x2, 0);
  ctx.lineTo(x2, h2);
  ctx.stroke();
};
const drawEuclideanRing = (ctx, w2, h2, layer) => {
  const pattern = layer.data["pattern"];
  const step = layer.data["step"] ?? 0;
  const radius = layer.data["radius"] ?? 120;
  if (!pattern || pattern.length === 0) return;
  const cx = w2 / 2;
  const cy = h2 / 2;
  const total = pattern.length;
  const arcW = 2 * Math.PI / total;
  pattern.forEach((active, i) => {
    const angle = i / total * 2 * Math.PI - Math.PI / 2;
    const isCurrent = i === step % total;
    const glow = isCurrent ? 1 : active ? 0.6 : 0.15;
    ctx.globalAlpha = layer.alpha * glow;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, angle, angle + arcW * 0.85);
    ctx.strokeStyle = layer.color;
    ctx.lineWidth = isCurrent ? 4 : 2;
    ctx.stroke();
    if (active) {
      const dotX = cx + Math.cos(angle + arcW / 2) * radius;
      const dotY = cy + Math.sin(angle + arcW / 2) * radius;
      ctx.globalAlpha = layer.alpha * glow;
      ctx.beginPath();
      ctx.arc(dotX, dotY, isCurrent ? 5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = layer.color;
      ctx.fill();
    }
  });
};
const drawAttractorPoints = (ctx, w2, h2, layer) => {
  const points = layer.data["points"];
  if (!points || points.length === 0) return;
  ctx.globalAlpha = layer.alpha * 0.7;
  ctx.fillStyle = layer.color;
  points.forEach(([px, py]) => {
    ctx.beginPath();
    ctx.arc(px * w2, py * h2, 1.5, 0, Math.PI * 2);
    ctx.fill();
  });
};
const drawLayer = (ctx, w2, h2, layer) => {
  ctx.save();
  switch (layer.kind) {
    case "waveform":
      drawWaveform(ctx, w2, h2, layer);
      break;
    case "spectrum":
      drawSpectrum(ctx, w2, h2, layer);
      break;
    case "radial-glow":
      drawRadialGlow(ctx, w2, h2, layer);
      break;
    case "step-bar":
      drawStepBar(ctx, w2, h2, layer);
      break;
    case "euclidean-ring":
      drawEuclideanRing(ctx, w2, h2, layer);
      break;
    case "attractor-points":
      drawAttractorPoints(ctx, w2, h2, layer);
      break;
  }
  ctx.restore();
};
const PerformanceCanvas = ({
  state,
  theme,
  editorVisible: _editorVisible
}) => {
  const canvasRef = reactExports.useRef(null);
  const containerRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const { width, height } = container.getBoundingClientRect();
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w2 = canvas.width;
    const h2 = canvas.height;
    let bundle = null;
    try {
      bundle = getTheme(theme);
    } catch {
      try {
        bundle = getTheme("dark-pulse");
      } catch {
        return;
      }
    }
    const scene = bundle.canvasTheme(state);
    ctx.globalAlpha = 1;
    ctx.fillStyle = scene.background;
    ctx.fillRect(0, 0, w2, h2);
    scene.layers.forEach((layer) => {
      drawLayer(ctx, w2, h2, layer);
    });
  }, [state, theme]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      ref: containerRef,
      style: {
        flex: 1,
        display: "flex",
        overflow: "hidden",
        position: "relative"
      },
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "canvas",
        {
          ref: canvasRef,
          "data-testid": "performance-canvas",
          style: { display: "block", width: "100%", height: "100%" }
        }
      )
    }
  );
};
const ZERO_TICK = {
  step: 0,
  bar: 0,
  beat: 0,
  bpm: 120,
  time: 0,
  stepCount: 16
};
const EMPTY_STATE = {
  waveform: [],
  bins: [],
  tick: ZERO_TICK,
  rms: 0,
  tracks: []
};
const computeRms = (waveform) => {
  if (waveform.length === 0) return 0;
  const sumSq = waveform.reduce((acc, s) => acc + s * s, 0);
  return Math.sqrt(sumSq / waveform.length);
};
const useAudioVisualState = (audioRef, stepRef, bpmRef, tracksRef) => {
  const [state, setState2] = reactExports.useState(EMPTY_STATE);
  const rafRef = reactExports.useRef(0);
  const startTime = reactExports.useRef(performance.now());
  reactExports.useEffect(() => {
    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      const waveform = audioRef.current?.waveform ?? [];
      const rms = computeRms(waveform);
      const { step = 0, stepCount = 16 } = stepRef.current ?? {};
      const bpm = bpmRef.current ?? 120;
      const elapsed = (performance.now() - startTime.current) / 1e3;
      const temporalTick = {
        step,
        stepCount,
        bpm,
        bar: Math.floor(step / 4),
        beat: step % 4,
        time: elapsed
      };
      setState2({
        waveform,
        bins: [],
        // engine:analysis does not send FFT bins; extend when engine exposes them
        tick: temporalTick,
        rms,
        tracks: tracksRef.current ?? []
      });
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [audioRef, stepRef, bpmRef, tracksRef]);
  return state;
};
const PERFORMANCE_STARTER = `import { Song, Kick808, Bass303 } from '@score/dsl'

const kick = Kick808().pattern([1,0,0,0,1,0,0,0]).volume(0.7)
const bass = Bass303('C2').cutoff(500).volume(0.6)

export default Song({ bpm: 130, tracks: [kick, bass] })`;
const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    width: "100vw",
    height: "100vh",
    background: "#050506",
    overflow: "hidden"
  },
  body: {
    display: "flex",
    flex: 1,
    overflow: "hidden"
  },
  editorStrip: {
    width: "30%",
    minWidth: "240px",
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid #111116",
    overflow: "hidden"
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.3rem 0.6rem",
    background: "#080809",
    borderBottom: "1px solid #111116",
    flexShrink: 0
  },
  toolbarLeft: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem"
  },
  homeBtn: {
    background: "none",
    border: "1px solid #1e1e22",
    color: "#3a3a46",
    fontSize: "0.65rem",
    fontFamily: "system-ui, sans-serif",
    letterSpacing: "0.06em",
    padding: "0.2rem 0.45rem",
    borderRadius: "2px",
    cursor: "pointer"
  },
  modeLabel: {
    fontSize: "0.6rem",
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.1em",
    color: "#2a3a52",
    textTransform: "uppercase"
  },
  tabHint: {
    fontSize: "0.55rem",
    fontFamily: "system-ui, sans-serif",
    letterSpacing: "0.06em",
    color: "#1e2a3a"
  },
  editorContainer: {
    flex: 1,
    overflow: "hidden"
  },
  canvasArea: {
    flex: 1,
    overflow: "hidden",
    display: "flex"
  }
};
const PerformanceMode = ({ hardware: _hardware, onHome }) => {
  const [code, setCode] = reactExports.useState(PERFORMANCE_STARTER);
  const [editorVisible, setEditorVisible] = reactExports.useState(true);
  const [theme, setTheme] = reactExports.useState("dark-pulse");
  const audioRef = reactExports.useRef({ waveform: [] });
  const stepRef = reactExports.useRef({ step: 0, stepCount: 16 });
  const bpmRef = reactExports.useRef(120);
  const tracksRef = reactExports.useRef([]);
  reactExports.useEffect(() => {
    const unsubAnalysis = window.scoreBridge.on("engine:analysis", ({ waveform }) => {
      audioRef.current = { waveform };
    });
    const unsubStep = window.scoreBridge.on("engine:step", ({ step, stepCount }) => {
      stepRef.current = { step, stepCount };
    });
    const unsubState = window.scoreBridge.on("engine:state", ({ bpm }) => {
      bpmRef.current = bpm;
    });
    const unsubSong = window.scoreBridge.on("song:update", (payload) => {
      if (payload.theme !== void 0) setTheme(payload.theme);
      tracksRef.current = payload.tracks.map((t2) => ({
        name: t2.name,
        type: t2.type,
        active: false,
        rms: 0,
        pattern: t2.pattern.filter((v2) => typeof v2 === "number")
      }));
    });
    return () => {
      unsubAnalysis();
      unsubStep();
      unsubState();
      unsubSong();
    };
  }, []);
  reactExports.useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Tab" && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const tag = e.target.tagName;
        if (tag !== "TEXTAREA" && tag !== "INPUT") {
          e.preventDefault();
          setEditorVisible((v2) => !v2);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);
  const handleEval = reactExports.useCallback(() => {
    window.scoreBridge.send("engine:eval", { code });
  }, [code]);
  const visualState = useAudioVisualState(audioRef, stepRef, bpmRef, tracksRef);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles.root, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles.body, children: [
    editorVisible && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles.editorStrip, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles.toolbar, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: styles.toolbarLeft, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { style: styles.homeBtn, onClick: onHome, children: "← Home" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles.modeLabel, children: "Performance" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: styles.tabHint, children: "Tab — hide editor" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles.editorContainer, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        CodeEditorPanel,
        {
          value: code,
          onChange: setCode,
          onEval: handleEval
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: styles.canvasArea, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      PerformanceCanvas,
      {
        state: visualState,
        theme,
        editorVisible
      }
    ) })
  ] }) });
};
const App = () => {
  const [state, setState2] = reactExports.useState({ screen: "splash" });
  const goHome = () => {
    window.scoreBridge.send("transport:stop", void 0);
    setState2({ screen: "splash" });
  };
  if (state.screen === "splash") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      SplashScreen,
      {
        onSelect: (mode2, hardware2) => {
          window.scoreBridge.send("mode:selected", { mode: mode2, hardware: hardware2 });
          setState2({ screen: "mode", mode: mode2, hardware: hardware2 });
        }
      }
    );
  }
  const { mode, hardware } = state;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    mode === "live-code" && /* @__PURE__ */ jsxRuntimeExports.jsx(LiveCode, { hardware, onHome: goHome }),
    mode === "produce" && /* @__PURE__ */ jsxRuntimeExports.jsx(Produce, { hardware, onHome: goHome }),
    mode === "dj-set" && /* @__PURE__ */ jsxRuntimeExports.jsx(DJSet, { hardware, onHome: goHome }),
    mode === "jam-session" && /* @__PURE__ */ jsxRuntimeExports.jsx(JamSession, { hardware, onHome: goHome }),
    mode === "performance" && /* @__PURE__ */ jsxRuntimeExports.jsx(PerformanceMode, { hardware, onHome: goHome })
  ] });
};
class DevErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    const { error } = this.state;
    if (error) {
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "2rem", fontFamily: "monospace", color: "#ff6b6b", background: "#0d0d0f", height: "100vh" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { color: "#ff6b6b", marginBottom: "1rem" }, children: "Renderer crash" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { style: { whiteSpace: "pre-wrap", fontSize: "0.85rem" }, children: error.message }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { style: { whiteSpace: "pre-wrap", fontSize: "0.75rem", color: "#888", marginTop: "1rem" }, children: error.stack })
      ] });
    }
    return this.props.children;
  }
}
const root = document.getElementById("root");
if (!root) throw new Error("root element not found");
createRoot(root).render(
  /* @__PURE__ */ jsxRuntimeExports.jsx(React.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DevErrorBoundary, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(App, {}) }) })
);
