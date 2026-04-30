import mongoose from 'mongoose';

const roleTaxonomySchema = new mongoose.Schema({
  roleId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true,
  },
  roleName: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['engineering', 'data', 'design', 'product', 'other'],
    default: 'engineering',
  },
  skillMap: [{
    skill: { type: String, required: true },
    weight: { type: Number, required: true, min: 1, max: 100 },
    category: { type: String, required: true }, // e.g., 'Frontend', 'Backend'
  }],
  radarAxes: [{
    label: { type: String, required: true },
    weight: { type: Number, required: true, default: 100 },
  }],
  description: {
    type: String,
  }
}, {
  timestamps: true,
});

const RoleTaxonomy = mongoose.models.RoleTaxonomy || mongoose.model('RoleTaxonomy', roleTaxonomySchema);

export default RoleTaxonomy;
