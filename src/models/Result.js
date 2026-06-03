'use strict';

const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    selectedValue: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const careerSuggestionSchema = new mongoose.Schema(
  {
    careerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Career',
      required: true,
    },
    title: {
      type: String,
    },
    matchScore: {
      type: Number,
    },
    rank: {
      type: Number,
    },
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'userId is required'],
  },
  takenAt: {
    type: Date,
    default: Date.now,
  },
  answers: {
    type: [answerSchema],
    default: [],
  },
  profile: {
    openness: { type: Number },
    conscientiousness: { type: Number },
    extraversion: { type: Number },
    agreeableness: { type: Number },
    neuroticism: { type: Number },
  },
  careers: {
    type: [careerSuggestionSchema],
    default: [],
  },
});

const Result = mongoose.model('Result', resultSchema);

module.exports = Result;
