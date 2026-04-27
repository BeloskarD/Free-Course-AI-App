import PKG from '../../models/PKG.js';
import IPkgRepository from '../PkgRepository.js';

/**
 * MONGO PKG REPOSITORY
 * ====================
 * Mongoose-specific implementation of the PKG Repository.
 */
class MongoPkgRepository extends IPkgRepository {
    async findById(id) {
        const pkg = await PKG.findById(id);
        return this.toPOJO(pkg);
    }

    async findByUserId(userId) {
        const pkg = await PKG.findOne({ userId });
        return this.toPOJO(pkg);
    }

    async getOrCreate(userId) {
        const pkg = await PKG.getOrCreate(userId);
        return this.toPOJO(pkg);
    }

    async create(pkgData) {
        const pkg = new PKG(pkgData);
        await pkg.save();
        return this.toPOJO(pkg);
    }

    async update(id, updateData) {
        const pkg = await PKG.findByIdAndUpdate(id, updateData, { new: true });
        return this.toPOJO(pkg);
    }

    async updateSkills(userId, skills) {
        const pkg = await PKG.findOneAndUpdate(
            { userId },
            { $set: { skills } },
            { new: true }
        );
        return this.toPOJO(pkg);
    }

    async save(pkgData) {
        if (!pkgData?.id && !pkgData?._id) {
            return this.create(pkgData);
        }

        const pkgId = pkgData.id || pkgData._id;
        const nextData = { ...pkgData };
        
        // Strip immutable/protected fields to avoid validation errors on updates
        delete nextData.id;
        delete nextData._id;
        delete nextData.userId;

        const pkg = await PKG.findByIdAndUpdate(
            pkgId,
            { $set: nextData },
            { new: true, runValidators: false }
        );

        if (!pkg) {
            throw new Error('PKG not found');
        }

        return this.toPOJO(pkg);
    }

    async delete(id) {
        return await PKG.findByIdAndDelete(id);
    }

    async find(query) {
        const pkgs = await PKG.find(query);
        return this.toPOJO(pkgs);
    }
}

export default new MongoPkgRepository();
