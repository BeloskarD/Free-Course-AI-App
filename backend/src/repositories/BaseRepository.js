/**
 * BASE REPOSITORY INTERFACE
 * =========================
 * Defines the contract for all data access layers.
 * Ensures that the system remains database-agnostic.
 */
class IBaseRepository {
    constructor() {
        if (this.constructor === IBaseRepository) {
            throw new Error("Cannot instantiate an interface class.");
        }
    }

    async create(data) { throw new Error("Method 'create' not implemented."); }
    async findById(id) { throw new Error("Method 'findById' not implemented."); }
    async update(id, data) { throw new Error("Method 'update' not implemented."); }
    async delete(id) { throw new Error("Method 'delete' not implemented."); }
    async find(query) { throw new Error("Method 'find' not implemented."); }

    /**
     * Map a database document to a Plain JavaScript Object (POJO).
     * This isolates the rest of the application from Mongoose-specific objects.
     */
    toPOJO(doc) {
        if (!doc) return null;
        if (Array.isArray(doc)) return doc.map(d => this.toPOJO(d));
        
        // If it's a Mongoose document, convert to object
        const obj = doc.toObject ? doc.toObject({ getters: true, virtuals: true }) : doc;
        
        // Remove MongoDB specific overhead if necessary
        if (obj._id) obj.id = obj._id.toString();
        
        return obj;
    }
}

export default IBaseRepository;
