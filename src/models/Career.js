'use strict';

const mongoose = require('mongoose');

const DOMAIN_ENUM = [
  'Technology',
  'Healthcare',
  'Arts',
  'Business',
  'Education',
  'Science',
  'Law',
  'Engineering',
  'Finance',
  'Social Services',
];

const TRAITS = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];

/**
 * Build a traitWeights sub-schema where each of the five trait keys
 * is a Number validated to be in [0.0, 1.0].
 */
function buildTraitWeightsSchema() {
  const fields = {};
  for (const trait of TRAITS) {
    fields[trait] = {
      type: Number,
      min: [0.0, `${trait} weight must be >= 0`],
      max: [1.0, `${trait} weight must be <= 1`],
      default: 0.0,
    };
  }
  return fields;
}

const careerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Career title is required'],
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  domain: {
    type: String,
    enum: {
      values: DOMAIN_ENUM,
      message: `Domain must be one of: ${DOMAIN_ENUM.join(', ')}`,
    },
  },
  traitWeights: {
    type: buildTraitWeightsSchema(),
    // Custom validator: sum of all traitWeights values must be <= 5.0
    validate: {
      validator: function (weights) {
        if (!weights) return true;
        const sum = TRAITS.reduce((acc, trait) => acc + (weights[trait] || 0), 0);
        return sum <= 5.0;
      },
      message: 'Sum of all traitWeights values must be <= 5.0',
    },
  },
  requiredSkills: {
    type: [String],
    default: [],
  },
  educationPath: {
    type: String,
    trim: true,
  },
  salaryRange: {
    min: { type: Number },
    max: { type: Number },
    currency: { type: String, default: 'USD' },
  },
});

const Career = mongoose.model('Career', careerSchema);

module.exports = Career;
