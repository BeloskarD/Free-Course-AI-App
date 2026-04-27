import mongoose from 'mongoose';
import config from '../src/config/env.js';
import PKG from '../src/models/PKG.js';

/**
 * PKG SKILLS MIGRATION SCRIPT
 * ==========================
 * Scans all PKG documents and converts 'skills' from Map/Object to Array.
 */

async function migrate() {
    console.log('🚀 Starting PKG Skills Migration...');
    
    try {
        await mongoose.connect(config.mongodbUri);
        console.log('✅ Connected to MongoDB');

        const pkgs = await PKG.find({});
        console.log(`📦 Found ${pkgs.length} PKG documents`);

        let migratedCount = 0;
        let skippedCount = 0;

        for (const pkg of pkgs) {
            if (!Array.isArray(pkg.skills)) {
                process.stdout.write(`🔄 Migrating PKG for user ${pkg.userId}... `);
                
                // Use the static normalizer we added to the model
                pkg.skills = PKG.normalizeSkills(pkg.skills);
                pkg.markModified('skills');
                
                await pkg.save();
                
                process.stdout.write('DONE\n');
                migratedCount++;
            } else {
                skippedCount++;
            }
        }

        console.log('\n✨ Migration Complete!');
        console.log(`📊 Total: ${pkgs.length}`);
        console.log(`✅ Migrated: ${migratedCount}`);
        console.log(`⏭️ Skipped: ${skippedCount}`);

    } catch (error) {
        console.error('\n❌ Migration Failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

migrate();
