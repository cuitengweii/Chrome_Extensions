(function () {
  const BRIDGE_KEY = "__localeShieldBridge";
  if (window[BRIDGE_KEY]?.version === 1) return;

  const DEFAULT_CONFIG = {
    profile: {
      label: "Hong Kong (Sample)",
      latitude: 22.3193,
      longitude: 114.1694,
      accuracyMeters: 800,
      timezone: "Asia/Hong_Kong",
      locale: "zh-CN",
      languages: ["zh-CN", "zh", "en-US"]
    },
    toggles: {
      geolocation: true,
      timezone: true,
      languages: true
    }
  };

  const NativeDateTimeFormat = Intl.DateTimeFormat;
  const nativeResolvedOptions = NativeDateTimeFormat.prototype.resolvedOptions;
  const nativeDateToString = Date.prototype.toString;
  const nativeTimezoneOffset = Date.prototype.getTimezoneOffset;
  const nativeLocaleString = Date.prototype.toLocaleString;
  const nativeLocaleDateString = Date.prototype.toLocaleDateString;
  const nativeLocaleTimeString = Date.prototype.toLocaleTimeString;
  const explicitFormatterTimezones = new WeakMap();
  const formatterCache = new Map();
  const watchTimers = new Map();

  let nextWatchId = 1;

  const state = {
    config: cloneConfig(DEFAULT_CONFIG),
    issues: [],
    installed: false
  };

  function cloneConfig(rawConfig) {
    const profile = rawConfig?.profile || {};
    const toggles = rawConfig?.toggles || {};
    return {
      profile: {
        label: String(profile.label || DEFAULT_CONFIG.profile.label).trim() || DEFAULT_CONFIG.profile.label,
        latitude: Number.isFinite(Number(profile.latitude)) ? Number(profile.latitude) : DEFAULT_CONFIG.profile.latitude,
        longitude: Number.isFinite(Number(profile.longitude)) ? Number(profile.longitude) : DEFAULT_CONFIG.profile.longitude,
        accuracyMeters: Number.isFinite(Number(profile.accuracyMeters)) ? Math.max(1, Number(profile.accuracyMeters)) : DEFAULT_CONFIG.profile.accuracyMeters,
        timezone: String(profile.timezone || DEFAULT_CONFIG.profile.timezone).trim() || DEFAULT_CONFIG.profile.timezone,
        locale: String(profile.locale || DEFAULT_CONFIG.profile.locale).trim() || DEFAULT_CONFIG.profile.locale,
        languages: Array.isArray(profile.languages) && profile.languages.length
          ? profile.languages.map((item) => String(item || "").trim()).filter(Boolean)
          : DEFAULT_CONFIG.profile.languages.slice()
      },
      toggles: {
        geolocation: toggles.geolocation !== false,
        timezone: toggles.timezone !== false,
        languages: toggles.languages !== false
      }
    };
  }

  function recordIssue(issue) {
    if (!issue || state.issues.includes(issue)) return;
    state.issues.push(issue);
  }

  function safeDefine(target, property, descriptor) {
    if (!target) return false;
    try {
      Object.defineProperty(target, property, descriptor);
      return true;
    } catch (_) {
      return false;
    }
  }

  function overrideMethod(targets, property, replacement) {
    for (const target of targets) {
      if (safeDefine(target, property, {
        configurable: true,
        writable: true,
        value: replacement
      })) {
        return true;
      }
    }
    return false;
  }

  function overrideGetter(targets, property, getter) {
    for (const target of targets) {
      const descriptor = target ? Object.getOwnPropertyDescriptor(target, property) : null;
      if (descriptor && descriptor.configurable === false) continue;
      if (safeDefine(target, property, {
        configurable: true,
        get: getter
      })) {
        return true;
      }
    }
    return false;
  }

  function buildPosition() {
    const profile = state.config.profile;
    return {
      coords: {
        accuracy: profile.accuracyMeters,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        latitude: profile.latitude,
        longitude: profile.longitude,
        speed: null
      },
      timestamp: Date.now()
    };
  }

  function buildPermissionStatus(status) {
    if (typeof EventTarget === "function") {
      class MockPermissionStatus extends EventTarget {
        constructor(stateValue) {
          super();
          this.state = stateValue;
          this.onchange = null;
        }
      }
      return new MockPermissionStatus(status);
    }

    return {
      state: status,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() { return false; }
    };
  }

  function getTimezoneFormatter(timeZone) {
    if (!formatterCache.has(timeZone)) {
      formatterCache.set(timeZone, new NativeDateTimeFormat("en-US", {
        timeZone,
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }));
    }
    return formatterCache.get(timeZone);
  }

  function getTimezoneOffsetMinutes(date, timeZone) {
    const formatter = getTimezoneFormatter(timeZone);
    const parts = formatter.formatToParts(date).reduce((result, part) => {
      if (part.type !== "literal") result[part.type] = part.value;
      return result;
    }, {});
    const hour = Number(parts.hour) % 24;
    const asUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      hour,
      Number(parts.minute),
      Number(parts.second)
    );
    return Math.round((date.getTime() - asUtc) / 60000);
  }

  function installGeolocationHooks() {
    const geolocation = navigator.geolocation;
    if (!geolocation) {
      recordIssue("navigator.geolocation unavailable");
      return;
    }

    const geolocationPrototype = Object.getPrototypeOf(geolocation);
    const nativeGetCurrentPosition = geolocation.getCurrentPosition?.bind(geolocation);
    const nativeWatchPosition = geolocation.watchPosition?.bind(geolocation);
    const nativeClearWatch = geolocation.clearWatch?.bind(geolocation);

    const getCurrentPosition = function (success, error, options) {
      if (!state.config.toggles.geolocation && typeof nativeGetCurrentPosition === "function") {
        return nativeGetCurrentPosition(success, error, options);
      }
      if (typeof success !== "function") return undefined;
      queueMicrotask(() => success(buildPosition()));
      return undefined;
    };

    const watchPosition = function (success, error, options) {
      if (!state.config.toggles.geolocation && typeof nativeWatchPosition === "function") {
        return nativeWatchPosition(success, error, options);
      }
      const watchId = nextWatchId++;
      if (typeof success === "function") {
        queueMicrotask(() => success(buildPosition()));
        const timer = window.setInterval(() => success(buildPosition()), 15000);
        watchTimers.set(watchId, timer);
      } else if (typeof error === "function") {
        queueMicrotask(() => error({ code: 2, message: "Position callback missing" }));
      }
      return watchId;
    };

    const clearWatch = function (watchId) {
      if (watchTimers.has(watchId)) {
        window.clearInterval(watchTimers.get(watchId));
        watchTimers.delete(watchId);
        return;
      }
      if (typeof nativeClearWatch === "function") {
        nativeClearWatch(watchId);
      }
    };

    if (!overrideMethod([geolocationPrototype, geolocation], "getCurrentPosition", getCurrentPosition)) {
      recordIssue("geolocation.getCurrentPosition override failed");
    }
    if (!overrideMethod([geolocationPrototype, geolocation], "watchPosition", watchPosition)) {
      recordIssue("geolocation.watchPosition override failed");
    }
    if (!overrideMethod([geolocationPrototype, geolocation], "clearWatch", clearWatch)) {
      recordIssue("geolocation.clearWatch override failed");
    }
  }

  function installPermissionsHook() {
    const permissionsObject = navigator.permissions;
    if (!permissionsObject?.query) {
      recordIssue("navigator.permissions unavailable");
      return;
    }

    const permissionsPrototype = Object.getPrototypeOf(permissionsObject);
    const nativeQuery = permissionsObject.query.bind(permissionsObject);
    const query = function (descriptor) {
      if (
        state.config.toggles.geolocation &&
        descriptor &&
        typeof descriptor === "object" &&
        descriptor.name === "geolocation"
      ) {
        return Promise.resolve(buildPermissionStatus("granted"));
      }
      return nativeQuery(descriptor);
    };

    if (!overrideMethod([permissionsPrototype, permissionsObject], "query", query)) {
      recordIssue("permissions.query override failed");
    }
  }

  function installLanguageHooks() {
    const navigatorPrototype = Object.getPrototypeOf(navigator);
    const nativeLanguageGetter =
      Object.getOwnPropertyDescriptor(navigatorPrototype, "language")?.get?.bind(navigator) ||
      (() => navigator.language);
    const nativeLanguagesGetter =
      Object.getOwnPropertyDescriptor(navigatorPrototype, "languages")?.get?.bind(navigator) ||
      (() => navigator.languages);

    if (!overrideGetter([navigatorPrototype, navigator], "language", () => {
      if (!state.config.toggles.languages) return nativeLanguageGetter();
      return state.config.profile.locale;
    })) {
      recordIssue("navigator.language override failed");
    }

    if (!overrideGetter([navigatorPrototype, navigator], "languages", () => {
      if (!state.config.toggles.languages) return nativeLanguagesGetter();
      return state.config.profile.languages.slice();
    })) {
      recordIssue("navigator.languages override failed");
    }
  }

  function installTimezoneHooks() {
    const nativeDateTimeFormat = Intl.DateTimeFormat;

    const wrappedResolvedOptions = function (...args) {
      const resolved = nativeResolvedOptions.apply(this, args);
      if (state.config.toggles.timezone && !explicitFormatterTimezones.get(this)) {
        resolved.timeZone = state.config.profile.timezone;
        resolved.locale = state.config.profile.locale;
      }
      return resolved;
    };

    const WrappedDateTimeFormat = function (...args) {
      const [locales, options] = args;
      const hasExplicitTimeZone = Boolean(options && typeof options === "object" && options.timeZone);
      const effectiveLocales = locales === undefined ? state.config.profile.locale : locales;
      const effectiveOptions = hasExplicitTimeZone || !state.config.toggles.timezone
        ? options
        : { ...(options || {}), timeZone: state.config.profile.timezone };
      const formatter = Reflect.construct(nativeDateTimeFormat, [effectiveLocales, effectiveOptions], new.target || WrappedDateTimeFormat);
      explicitFormatterTimezones.set(formatter, hasExplicitTimeZone);
      return formatter;
    };

    Object.setPrototypeOf(WrappedDateTimeFormat, nativeDateTimeFormat);
    WrappedDateTimeFormat.prototype = nativeDateTimeFormat.prototype;

    if (!safeDefine(Intl, "DateTimeFormat", {
      configurable: true,
      writable: true,
      value: WrappedDateTimeFormat
    })) {
      recordIssue("Intl.DateTimeFormat override failed");
    }

    if (!overrideMethod([nativeDateTimeFormat.prototype], "resolvedOptions", wrappedResolvedOptions)) {
      recordIssue("Intl.DateTimeFormat.resolvedOptions override failed");
    }

    if (!overrideMethod([Date.prototype], "getTimezoneOffset", function () {
      if (!state.config.toggles.timezone) {
        return nativeTimezoneOffset.call(this);
      }
      return getTimezoneOffsetMinutes(this, state.config.profile.timezone);
    })) {
      recordIssue("Date.getTimezoneOffset override failed");
    }

    const wrapLocaleMethod = (nativeMethod) => function (...args) {
      if (!state.config.toggles.timezone) {
        return nativeMethod.apply(this, args);
      }
      const [locales, options] = args;
      const effectiveLocales = locales === undefined ? state.config.profile.locale : locales;
      const effectiveOptions = options && typeof options === "object" && options.timeZone
        ? options
        : { ...(options || {}), timeZone: state.config.profile.timezone };
      return nativeMethod.call(this, effectiveLocales, effectiveOptions);
    };

    if (!overrideMethod([Date.prototype], "toLocaleString", wrapLocaleMethod(nativeLocaleString))) {
      recordIssue("Date.toLocaleString override failed");
    }
    if (!overrideMethod([Date.prototype], "toLocaleDateString", wrapLocaleMethod(nativeLocaleDateString))) {
      recordIssue("Date.toLocaleDateString override failed");
    }
    if (!overrideMethod([Date.prototype], "toLocaleTimeString", wrapLocaleMethod(nativeLocaleTimeString))) {
      recordIssue("Date.toLocaleTimeString override failed");
    }

    if (!overrideMethod([Date.prototype], "toString", function () {
      if (!state.config.toggles.timezone) {
        return nativeDateToString.call(this);
      }
      const formatter = new NativeDateTimeFormat(state.config.profile.locale, {
        timeZone: state.config.profile.timezone,
        dateStyle: "medium",
        timeStyle: "long"
      });
      return `${formatter.format(this)} (${state.config.profile.timezone})`;
    })) {
      recordIssue("Date.toString override failed");
    }
  }

  function installHooks() {
    if (state.installed) return;
    state.installed = true;
    installGeolocationHooks();
    installPermissionsHook();
    installLanguageHooks();
    installTimezoneHooks();
  }

  function buildReport() {
    return {
      status: state.issues.length ? "limited" : "enabled",
      message: state.issues.length
        ? state.issues.join("; ")
        : `Front-end masking active for ${state.config.profile.label}.`,
      issues: state.issues.slice(),
      profileLabel: state.config.profile.label,
      toggles: {
        ...state.config.toggles
      }
    };
  }

  function updateConfig(rawConfig) {
    state.config = cloneConfig(rawConfig || DEFAULT_CONFIG);
    return buildReport();
  }

  installHooks();

  safeDefine(window, BRIDGE_KEY, {
    configurable: false,
    enumerable: false,
    writable: false,
    value: Object.freeze({
      version: 1,
      updateConfig,
      getStatus: buildReport
    })
  });
})();
