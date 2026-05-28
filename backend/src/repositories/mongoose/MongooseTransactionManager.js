import mongoose from 'mongoose';
import ITransactionManager from '../TransactionManager.js';

/**
 * MONGOOSE TRANSACTION MANAGER
 * ============================
 * Concrete Mongoose implementation of transactional boundaries.
 * Automatically wraps queries in sessions and manages commits/rollbacks.
 * Gracefully handles standalone local environments where transactions are not supported.
 */
class MongooseTransactionManager extends ITransactionManager {
    async run(work) {
        let session = null;
        
        try {
            session = await mongoose.startSession();
            session.startTransaction();
        } catch (sessionError) {
            // Graceful Fallback: Local database is a standalone MongoDB (no replica set configured)
            // Execute the domain operations sequentially without active transaction locking
            return await work(null);
        }

        try {
            const result = await work(session);
            await session.commitTransaction();
            return result;
        } catch (error) {
            if (session.inTransaction()) {
                await session.abortTransaction();
            }
            throw error;
        } finally {
            session.endSession();
        }
    }
}

export default new MongooseTransactionManager();
