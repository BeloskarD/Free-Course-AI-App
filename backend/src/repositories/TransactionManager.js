/**
 * TRANSACTION MANAGER INTERFACE
 * =============================
 * Defines the database-agnostic contract for executing operations within transactions.
 * Prevents Mongoose session or SQL connection details from leaking into the service layer.
 */
class ITransactionManager {
    constructor() {
        if (this.constructor === ITransactionManager) {
            throw new Error("Cannot instantiate abstract class ITransactionManager.");
        }
    }

    /**
     * Run operations inside a database transaction.
     * @param {Function} work - Async callback containing business logic, receiving the session/transaction token.
     * @returns {Promise<any>}
     */
    async run(work) {
        throw new Error("Method 'run' must be implemented by the database adapter.");
    }
}

export default ITransactionManager;
