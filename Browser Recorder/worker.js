// Local fallback worker placeholder for unpacked extension mode.
self.onmessage = function (event) {
  self.postMessage({ ok: true, type: "noop", received: !!event });
};
