'use strict';

const TRAITS = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];

/**
 * Aggregates traitWeights from each answer's pre-resolved option and normalizes
 * each trait score to the [0, 100] range.
 *
 * The caller (controller) is responsible for attaching `option.traitWeights`
 * to each answer before calling this function.
 *
 * @param {Array<{questionId: string, selectedValue: number, option: {traitWeights: Object}}>} answers
 * @returns {{ openness: number, conscientiousness: number, extraversion: number, agreeableness: number, neuroticism: number }}
 */
function scoreAnswers(answers) {
  // Initialize accumulators — never mutate the input array
  const traitTotals = {};
  const traitCounts = {};
  for (const trait of TRAITS) {
    traitTotals[trait] = 0;
    traitCounts[trait] = 0;
  }

  for (const answer of answers) {
    const weights = answer.option && answer.option.traitWeights;
    if (!weights) continue;

    for (const trait of TRAITS) {
      const w = weights[trait];
      if (typeof w === 'number' && !isNaN(w)) {
        traitTotals[trait] += w;
        traitCounts[trait] += 1;
      }
    }
  }

  // Normalize each trait to [0, 100]
  const profile = {};
  for (const trait of TRAITS) {
    if (traitCounts[trait] > 0) {
      profile[trait] = (traitTotals[trait] / traitCounts[trait]) * 100;
    } else {
      profile[trait] = 0;
    }
  }

  return profile;
}

/**
 * Computes the cosine similarity between a personality profile vector (values in
 * [0, 100]) and a career trait-weight vector (values in [0, 1]).
 *
 * The profile is normalized to [0, 1] before the computation so both vectors
 * live in the same space.
 *
 * @param {{ openness: number, conscientiousness: number, extraversion: number, agreeableness: number, neuroticism: number }} profileVector  — values in [0, 100]
 * @param {{ openness: number, conscientiousness: number, extraversion: number, agreeableness: number, neuroticism: number }} careerVector   — values in [0, 1]
 * @returns {number} similarity in [0, 1]; 0 if either magnitude is 0
 */
function cosineSimilarity(profileVector, careerVector) {
  let dotProduct = 0;
  let magProfileSq = 0;
  let magCareerSq = 0;

  for (const trait of TRAITS) {
    const p = (profileVector[trait] || 0) / 100; // normalize profile to [0, 1]
    const c = careerVector[trait] || 0;

    dotProduct += p * c;
    magProfileSq += p * p;
    magCareerSq += c * c;
  }

  const magProfile = Math.sqrt(magProfileSq);
  const magCareer = Math.sqrt(magCareerSq);

  if (magProfile === 0 || magCareer === 0) {
    return 0;
  }

  return dotProduct / (magProfile * magCareer);
}

/**
 * Ranks careers by their cosine similarity to the given personality profile.
 *
 * @param {{ openness: number, conscientiousness: number, extraversion: number, agreeableness: number, neuroticism: number }} profile  — values in [0, 100]
 * @param {Array<{ _id: *, title: string, description: string, traitWeights: Object }>} careers
 * @returns {Array<{ careerId: *, title: string, matchScore: number, rank: number, description: string }>}
 */
function rankCareers(profile, careers) {
  const maxSuggestions = parseInt(process.env.MAX_SUGGESTIONS, 10) || 5;

  // Score every career
  const scored = careers.map((career) => ({
    careerId: career._id,
    title: career.title,
    description: career.description,
    matchScore: cosineSimilarity(profile, career.traitWeights) * 100,
  }));

  // Sort descending by matchScore
  scored.sort((a, b) => b.matchScore - a.matchScore);

  // Assign unique ranks and cap at MAX_SUGGESTIONS
  return scored.slice(0, maxSuggestions).map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

module.exports = { scoreAnswers, cosineSimilarity, rankCareers };
