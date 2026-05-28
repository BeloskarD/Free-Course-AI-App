import ITransactionManager from '../TransactionManager.js';

/**
 * POSTGRES TRANSACTION MANAGER SKELETON
 * =====================================
 * Future compatible PostgreSQL implementation of transactional boundaries.
 * Ready for integrations using PrismaClient `$transaction` blocks.
 */
class PostgresTransactionManager extends ITransactionManager {
    async run(work) {
        // Placeholder skeleton for future compatibility with SQL engines
        // Example integration:
        // return await prisma.$transaction(async (tx) => {
        //     return await work(tx);
        // });
        
        console.warn("⚠️ PostgresTransactionManager is running in skeleton compatibility mode.");
        return await work(null);
    }
}

export default new PostgresTransactionManager();
