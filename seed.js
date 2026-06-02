'use strict';

/**
 * One-time database seed script.
 * Run with: node seed.js
 *
 * Seeds the careers and questions collections with initial data.
 * Safe to run multiple times — clears existing data before inserting.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Career = require('./src/models/Career');
const Question = require('./src/models/Question');

const CAREERS = [
  {
    title: 'Software Engineer',
    description: 'Design, build, and maintain software systems and applications. Work on challenging problems and create technology that impacts millions.',
    domain: 'Technology',
    traitWeights: { openness: 0.8, conscientiousness: 0.7, extraversion: 0.4, agreeableness: 0.5, neuroticism: 0.2 },
    requiredSkills: ['Programming', 'Problem Solving', 'Algorithms', 'Teamwork'],
    educationPath: 'B.Tech / B.E. in Computer Science or related field',
    salaryRange: { min: 600000, max: 2500000, currency: 'INR' },
  },
  {
    title: 'Doctor / Physician',
    description: 'Diagnose and treat illnesses, injuries, and medical conditions. Make a direct difference in patients\' lives every day.',
    domain: 'Healthcare',
    traitWeights: { openness: 0.6, conscientiousness: 0.9, extraversion: 0.6, agreeableness: 0.8, neuroticism: 0.3 },
    requiredSkills: ['Medicine', 'Empathy', 'Decision Making', 'Communication'],
    educationPath: 'MBBS + MD / MS Specialization',
    salaryRange: { min: 800000, max: 3000000, currency: 'INR' },
  },
  {
    title: 'Teacher / Educator',
    description: 'Inspire and educate the next generation. Shape young minds and contribute to society through knowledge sharing.',
    domain: 'Education',
    traitWeights: { openness: 0.7, conscientiousness: 0.7, extraversion: 0.8, agreeableness: 0.9, neuroticism: 0.2 },
    requiredSkills: ['Communication', 'Patience', 'Subject Knowledge', 'Mentoring'],
    educationPath: 'B.Ed or subject-specific degree + teaching certification',
    salaryRange: { min: 300000, max: 1200000, currency: 'INR' },
  },
  {
    title: 'Business Analyst',
    description: 'Bridge the gap between business needs and technology solutions. Analyze data and processes to drive organizational improvements.',
    domain: 'Business',
    traitWeights: { openness: 0.6, conscientiousness: 0.8, extraversion: 0.6, agreeableness: 0.6, neuroticism: 0.3 },
    requiredSkills: ['Analysis', 'Communication', 'Excel', 'Problem Solving'],
    educationPath: 'BBA / MBA or B.Tech with business focus',
    salaryRange: { min: 500000, max: 1800000, currency: 'INR' },
  },
  {
    title: 'Graphic Designer',
    description: 'Create compelling visual content for brands, media, and digital platforms. Combine creativity with technical skill.',
    domain: 'Arts',
    traitWeights: { openness: 0.9, conscientiousness: 0.6, extraversion: 0.5, agreeableness: 0.6, neuroticism: 0.3 },
    requiredSkills: ['Creativity', 'Adobe Suite', 'Typography', 'Visual Communication'],
    educationPath: 'BFA / B.Des or Design Diploma',
    salaryRange: { min: 300000, max: 1200000, currency: 'INR' },
  },
  {
    title: 'Data Scientist',
    description: 'Extract meaningful insights from large datasets using statistics and machine learning. Drive data-informed decisions.',
    domain: 'Technology',
    traitWeights: { openness: 0.8, conscientiousness: 0.8, extraversion: 0.3, agreeableness: 0.5, neuroticism: 0.2 },
    requiredSkills: ['Python', 'Statistics', 'Machine Learning', 'SQL'],
    educationPath: 'B.Tech + Data Science / Statistics courses or M.Sc. in Data Science',
    salaryRange: { min: 700000, max: 2800000, currency: 'INR' },
  },
  {
    title: 'Lawyer',
    description: 'Represent clients, interpret laws, and uphold justice. Work in corporate law, criminal defense, or public interest.',
    domain: 'Law',
    traitWeights: { openness: 0.7, conscientiousness: 0.8, extraversion: 0.7, agreeableness: 0.5, neuroticism: 0.4 },
    requiredSkills: ['Argumentation', 'Research', 'Writing', 'Critical Thinking'],
    educationPath: 'LLB (5-year integrated) + LLM for specialization',
    salaryRange: { min: 400000, max: 2000000, currency: 'INR' },
  },
  {
    title: 'Civil Engineer',
    description: 'Design and oversee construction of infrastructure — roads, bridges, buildings, and water systems.',
    domain: 'Engineering',
    traitWeights: { openness: 0.6, conscientiousness: 0.9, extraversion: 0.5, agreeableness: 0.6, neuroticism: 0.2 },
    requiredSkills: ['Mathematics', 'CAD', 'Project Management', 'Structural Analysis'],
    educationPath: 'B.Tech in Civil Engineering',
    salaryRange: { min: 400000, max: 1500000, currency: 'INR' },
  },
  {
    title: 'Psychologist',
    description: 'Study human behavior and mental processes. Help individuals overcome challenges and improve mental well-being.',
    domain: 'Healthcare',
    traitWeights: { openness: 0.8, conscientiousness: 0.7, extraversion: 0.6, agreeableness: 0.9, neuroticism: 0.4 },
    requiredSkills: ['Empathy', 'Active Listening', 'Research', 'Counseling'],
    educationPath: 'B.A./B.Sc. Psychology + M.A./M.Sc. + RCI registration',
    salaryRange: { min: 350000, max: 1500000, currency: 'INR' },
  },
  {
    title: 'Financial Analyst',
    description: 'Analyze financial data, market trends, and investment opportunities to guide business and investment decisions.',
    domain: 'Finance',
    traitWeights: { openness: 0.5, conscientiousness: 0.9, extraversion: 0.5, agreeableness: 0.5, neuroticism: 0.3 },
    requiredSkills: ['Financial Modeling', 'Excel', 'Accounting', 'Analytical Thinking'],
    educationPath: 'B.Com / BBA + CA / CFA / MBA Finance',
    salaryRange: { min: 500000, max: 2000000, currency: 'INR' },
  },
];

const QUESTIONS = [
  {
    text: 'I enjoy trying new and different activities.',
    sequence: 1,
    isActive: true,
    options: [
      { label: 'Strongly Agree',    value: 5, traitWeights: { openness: 0.9, conscientiousness: 0.3, extraversion: 0.5, agreeableness: 0.4, neuroticism: 0.1 } },
      { label: 'Agree',             value: 4, traitWeights: { openness: 0.7, conscientiousness: 0.3, extraversion: 0.4, agreeableness: 0.4, neuroticism: 0.2 } },
      { label: 'Neutral',           value: 3, traitWeights: { openness: 0.5, conscientiousness: 0.5, extraversion: 0.5, agreeableness: 0.5, neuroticism: 0.3 } },
      { label: 'Disagree',          value: 2, traitWeights: { openness: 0.3, conscientiousness: 0.6, extraversion: 0.4, agreeableness: 0.5, neuroticism: 0.4 } },
      { label: 'Strongly Disagree', value: 1, traitWeights: { openness: 0.1, conscientiousness: 0.7, extraversion: 0.3, agreeableness: 0.5, neuroticism: 0.5 } },
    ],
  },
  {
    text: 'I prefer to plan things carefully before starting.',
    sequence: 2,
    isActive: true,
    options: [
      { label: 'Strongly Agree',    value: 5, traitWeights: { openness: 0.3, conscientiousness: 0.9, extraversion: 0.3, agreeableness: 0.5, neuroticism: 0.2 } },
      { label: 'Agree',             value: 4, traitWeights: { openness: 0.3, conscientiousness: 0.7, extraversion: 0.4, agreeableness: 0.5, neuroticism: 0.2 } },
      { label: 'Neutral',           value: 3, traitWeights: { openness: 0.5, conscientiousness: 0.5, extraversion: 0.5, agreeableness: 0.5, neuroticism: 0.3 } },
      { label: 'Disagree',          value: 2, traitWeights: { openness: 0.6, conscientiousness: 0.3, extraversion: 0.6, agreeableness: 0.5, neuroticism: 0.4 } },
      { label: 'Strongly Disagree', value: 1, traitWeights: { openness: 0.7, conscientiousness: 0.1, extraversion: 0.7, agreeableness: 0.4, neuroticism: 0.5 } },
    ],
  },
  {
    text: 'I feel energized when I am around other people.',
    sequence: 3,
    isActive: true,
    options: [
      { label: 'Strongly Agree',    value: 5, traitWeights: { openness: 0.5, conscientiousness: 0.3, extraversion: 0.9, agreeableness: 0.6, neuroticism: 0.1 } },
      { label: 'Agree',             value: 4, traitWeights: { openness: 0.4, conscientiousness: 0.3, extraversion: 0.7, agreeableness: 0.6, neuroticism: 0.2 } },
      { label: 'Neutral',           value: 3, traitWeights: { openness: 0.5, conscientiousness: 0.5, extraversion: 0.5, agreeableness: 0.5, neuroticism: 0.3 } },
      { label: 'Disagree',          value: 2, traitWeights: { openness: 0.4, conscientiousness: 0.6, extraversion: 0.3, agreeableness: 0.4, neuroticism: 0.4 } },
      { label: 'Strongly Disagree', value: 1, traitWeights: { openness: 0.3, conscientiousness: 0.7, extraversion: 0.1, agreeableness: 0.3, neuroticism: 0.5 } },
    ],
  },
  {
    text: 'I care deeply about the feelings of others.',
    sequence: 4,
    isActive: true,
    options: [
      { label: 'Strongly Agree',    value: 5, traitWeights: { openness: 0.5, conscientiousness: 0.4, extraversion: 0.5, agreeableness: 0.9, neuroticism: 0.2 } },
      { label: 'Agree',             value: 4, traitWeights: { openness: 0.4, conscientiousness: 0.4, extraversion: 0.5, agreeableness: 0.7, neuroticism: 0.2 } },
      { label: 'Neutral',           value: 3, traitWeights: { openness: 0.5, conscientiousness: 0.5, extraversion: 0.5, agreeableness: 0.5, neuroticism: 0.3 } },
      { label: 'Disagree',          value: 2, traitWeights: { openness: 0.4, conscientiousness: 0.5, extraversion: 0.4, agreeableness: 0.3, neuroticism: 0.4 } },
      { label: 'Strongly Disagree', value: 1, traitWeights: { openness: 0.3, conscientiousness: 0.5, extraversion: 0.3, agreeableness: 0.1, neuroticism: 0.5 } },
    ],
  },
  {
    text: 'I often feel anxious or worried about things.',
    sequence: 5,
    isActive: true,
    options: [
      { label: 'Strongly Agree',    value: 5, traitWeights: { openness: 0.3, conscientiousness: 0.4, extraversion: 0.2, agreeableness: 0.4, neuroticism: 0.9 } },
      { label: 'Agree',             value: 4, traitWeights: { openness: 0.3, conscientiousness: 0.4, extraversion: 0.3, agreeableness: 0.4, neuroticism: 0.7 } },
      { label: 'Neutral',           value: 3, traitWeights: { openness: 0.5, conscientiousness: 0.5, extraversion: 0.5, agreeableness: 0.5, neuroticism: 0.5 } },
      { label: 'Disagree',          value: 2, traitWeights: { openness: 0.5, conscientiousness: 0.6, extraversion: 0.6, agreeableness: 0.5, neuroticism: 0.3 } },
      { label: 'Strongly Disagree', value: 1, traitWeights: { openness: 0.6, conscientiousness: 0.7, extraversion: 0.7, agreeableness: 0.5, neuroticism: 0.1 } },
    ],
  },
  {
    text: 'I enjoy working with numbers and data.',
    sequence: 6,
    isActive: true,
    options: [
      { label: 'Strongly Agree',    value: 5, traitWeights: { openness: 0.6, conscientiousness: 0.9, extraversion: 0.3, agreeableness: 0.4, neuroticism: 0.2 } },
      { label: 'Agree',             value: 4, traitWeights: { openness: 0.5, conscientiousness: 0.7, extraversion: 0.3, agreeableness: 0.4, neuroticism: 0.2 } },
      { label: 'Neutral',           value: 3, traitWeights: { openness: 0.5, conscientiousness: 0.5, extraversion: 0.5, agreeableness: 0.5, neuroticism: 0.3 } },
      { label: 'Disagree',          value: 2, traitWeights: { openness: 0.5, conscientiousness: 0.3, extraversion: 0.6, agreeableness: 0.5, neuroticism: 0.4 } },
      { label: 'Strongly Disagree', value: 1, traitWeights: { openness: 0.6, conscientiousness: 0.2, extraversion: 0.7, agreeableness: 0.5, neuroticism: 0.4 } },
    ],
  },
  {
    text: 'I like helping people solve their problems.',
    sequence: 7,
    isActive: true,
    options: [
      { label: 'Strongly Agree',    value: 5, traitWeights: { openness: 0.6, conscientiousness: 0.6, extraversion: 0.7, agreeableness: 0.9, neuroticism: 0.2 } },
      { label: 'Agree',             value: 4, traitWeights: { openness: 0.5, conscientiousness: 0.5, extraversion: 0.6, agreeableness: 0.7, neuroticism: 0.2 } },
      { label: 'Neutral',           value: 3, traitWeights: { openness: 0.5, conscientiousness: 0.5, extraversion: 0.5, agreeableness: 0.5, neuroticism: 0.3 } },
      { label: 'Disagree',          value: 2, traitWeights: { openness: 0.4, conscientiousness: 0.5, extraversion: 0.4, agreeableness: 0.3, neuroticism: 0.4 } },
      { label: 'Strongly Disagree', value: 1, traitWeights: { openness: 0.3, conscientiousness: 0.4, extraversion: 0.3, agreeableness: 0.1, neuroticism: 0.5 } },
    ],
  },
  {
    text: 'I am good at expressing my ideas clearly.',
    sequence: 8,
    isActive: true,
    options: [
      { label: 'Strongly Agree',    value: 5, traitWeights: { openness: 0.7, conscientiousness: 0.6, extraversion: 0.8, agreeableness: 0.6, neuroticism: 0.1 } },
      { label: 'Agree',             value: 4, traitWeights: { openness: 0.6, conscientiousness: 0.5, extraversion: 0.7, agreeableness: 0.5, neuroticism: 0.2 } },
      { label: 'Neutral',           value: 3, traitWeights: { openness: 0.5, conscientiousness: 0.5, extraversion: 0.5, agreeableness: 0.5, neuroticism: 0.3 } },
      { label: 'Disagree',          value: 2, traitWeights: { openness: 0.4, conscientiousness: 0.5, extraversion: 0.3, agreeableness: 0.4, neuroticism: 0.4 } },
      { label: 'Strongly Disagree', value: 1, traitWeights: { openness: 0.3, conscientiousness: 0.4, extraversion: 0.2, agreeableness: 0.3, neuroticism: 0.6 } },
    ],
  },
  {
    text: 'I prefer creative work over routine tasks.',
    sequence: 9,
    isActive: true,
    options: [
      { label: 'Strongly Agree',    value: 5, traitWeights: { openness: 0.9, conscientiousness: 0.3, extraversion: 0.6, agreeableness: 0.5, neuroticism: 0.2 } },
      { label: 'Agree',             value: 4, traitWeights: { openness: 0.7, conscientiousness: 0.4, extraversion: 0.5, agreeableness: 0.5, neuroticism: 0.2 } },
      { label: 'Neutral',           value: 3, traitWeights: { openness: 0.5, conscientiousness: 0.5, extraversion: 0.5, agreeableness: 0.5, neuroticism: 0.3 } },
      { label: 'Disagree',          value: 2, traitWeights: { openness: 0.3, conscientiousness: 0.7, extraversion: 0.4, agreeableness: 0.5, neuroticism: 0.3 } },
      { label: 'Strongly Disagree', value: 1, traitWeights: { openness: 0.1, conscientiousness: 0.9, extraversion: 0.3, agreeableness: 0.5, neuroticism: 0.4 } },
    ],
  },
  {
    text: 'I stay calm and composed under pressure.',
    sequence: 10,
    isActive: true,
    options: [
      { label: 'Strongly Agree',    value: 5, traitWeights: { openness: 0.5, conscientiousness: 0.7, extraversion: 0.6, agreeableness: 0.6, neuroticism: 0.1 } },
      { label: 'Agree',             value: 4, traitWeights: { openness: 0.5, conscientiousness: 0.6, extraversion: 0.5, agreeableness: 0.5, neuroticism: 0.2 } },
      { label: 'Neutral',           value: 3, traitWeights: { openness: 0.5, conscientiousness: 0.5, extraversion: 0.5, agreeableness: 0.5, neuroticism: 0.4 } },
      { label: 'Disagree',          value: 2, traitWeights: { openness: 0.4, conscientiousness: 0.4, extraversion: 0.4, agreeableness: 0.4, neuroticism: 0.7 } },
      { label: 'Strongly Disagree', value: 1, traitWeights: { openness: 0.3, conscientiousness: 0.3, extraversion: 0.3, agreeableness: 0.3, neuroticism: 0.9 } },
    ],
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGODB_URI is not set in your .env file.');
    console.error('Please create a .env file with your MongoDB Atlas connection string.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected!\n');

  // Seed careers
  await Career.deleteMany({});
  await Career.insertMany(CAREERS);
  console.log(`✓ Seeded ${CAREERS.length} careers`);

  // Seed questions
  await Question.deleteMany({});
  await Question.insertMany(QUESTIONS);
  console.log(`✓ Seeded ${QUESTIONS.length} questions`);

  await mongoose.disconnect();
  console.log('\nDatabase seeded successfully! You can now run: npm start');
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
