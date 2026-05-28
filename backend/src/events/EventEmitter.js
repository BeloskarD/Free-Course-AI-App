import { EventEmitter } from 'events';

/**
 * RESILIENT DOMAIN EVENT EMITTER
 * ==============================
 * Core async-safe, process-decoupled event dispatcher for the Zeeklect domain.
 * Ensures that any failures in event handlers/listeners NEVER bubble up or crash
 * the primary request flow.
 */
class SafeEventEmitter {
    constructor() {
        this.emitter = new EventEmitter();
        // Warn if more than 20 listeners are attached to prevent memory leaks
        this.emitter.setMaxListeners(20);
    }

    /**
     * Resiliently emit a domain event async-safely on the next event-loop tick.
     * @param {String} eventName 
     * @param {Object} payload 
     */
    emit(eventName, payload) {
        process.nextTick(() => {
            try {
                this.emitter.emit(eventName, payload);
            } catch (err) {
                console.error(`❌ Thread crash isolated: Event [${eventName}] failed to emit:`, err);
            }
        });
    }

    /**
     * Safely attach an async handler to a domain event.
     * Enforces error encapsulation.
     * @param {String} eventName 
     * @param {Function} handler - Async event handler callback 
     */
    on(eventName, handler) {
        this.emitter.on(eventName, async (payload) => {
            try {
                await handler(payload);
            } catch (err) {
                console.error(`❌ Handler regression isolated for event [${eventName}]:`, err);
                // Keep the thread alive: prevent crashes from bubbling up
            }
        });
    }
}

export default new SafeEventEmitter();
