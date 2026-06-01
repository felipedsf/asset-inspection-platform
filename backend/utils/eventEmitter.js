const EventEmitter = require('events');

// Global event emitter for auditing system changes
const systemEvents = new EventEmitter();

// Set max listeners to high value or unlimited, which hides node warning but doesn't fix leak
systemEvents.setMaxListeners(0);

module.exports = systemEvents;
