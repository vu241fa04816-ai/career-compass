'use strict';

const mongoose = require('mongoose');

const TRAITS = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];

/**
 * Build a traitWeights sub-schema where each of the five trait keys
 * is a Number validated to be in [0, 1].
 */
function buildTraitWeightsSchema() {
  const fields = {};
  for (const trait of TRAITS) {
    fields[trait] = {
      type: Number,
      min: [0, `${trait} weight must be >= 0`],
      max: [1, `${trait} weight must be <= 1`],
      default: 0,
    };
  }
  return fields;
}

const optionSchema = new mongoose.Schema(
  {
    label: {
      type: String,
    },
    value: {
      type: Number,
      validate: {
        validator: (v) => Number.isInteger(v) && v > 0,
        message: 'Option value must be a positive integer',
      },
    },
    traitWeights: buildTraitWeightsSchema(),
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
  },
  sequence: {
    type: Number,
    required: [true, 'Sequence is required'],
  },
  options: {
    type: [optionSchema],
    validate: {
      validator: (opts) => Array.isArray(opts) && opts.length >= 2,
      message: 'A question must have at least 2 options',
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
