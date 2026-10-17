import {
  RelayExperience,
  RelayMetrics,
  NftPersonality,
  RelayMilestone,
  PersonalityTraitName,
} from '../types';

/**
 * Calculates genuine metrics derived ONLY from stored Relay interaction steps.
 * Does not fabricate statistics.
 */
export function calculateRelayMetrics(relay: RelayExperience): RelayMetrics {
  const steps = relay.steps || [];
  const journeyLength = steps.length;

  // 1. Unique Participants
  const uniqueParticipants = new Set(
    steps.map((s) => (s.userId && s.userId.trim() ? s.userId : s.personHandle.toLowerCase()))
  );
  const participantsCount = Math.max(uniqueParticipants.size, 1);

  // 2. Decisions Count
  const decisionsCount = steps.filter((s) => !!s.action && s.action.trim().length > 0).length;

  // 3. Predictions Count
  const predictionsCount = steps.filter((s) => !!s.prediction && s.prediction.trim().length > 0).length;

  // 4. Contradictions & Disagreements
  // A contradiction occurs when a participant's action diverges from the previous participant's action
  let contradictionsCount = 0;
  const transitions = Math.max(steps.length - 1, 0);

  for (let i = 1; i < steps.length; i++) {
    const prevAction = steps[i - 1].action.trim().toUpperCase();
    const currAction = steps[i].action.trim().toUpperCase();
    if (prevAction && currAction && prevAction !== currAction) {
      contradictionsCount++;
    }
  }

  // 5. Consensus vs Disagreement Percentages
  let disagreementPct = 0;
  let consensusPct = 100;
  if (transitions > 0) {
    disagreementPct = Math.round((contradictionsCount / transitions) * 100);
    consensusPct = Math.max(0, 100 - disagreementPct);
  }

  // 6. Longest Prediction Streak
  // Consecutive steps where step[i-1].prediction matched step[i].action
  let currentStreak = 0;
  let longestPredictionStreak = 0;

  for (let i = 1; i < steps.length; i++) {
    const prevPrediction = steps[i - 1].prediction?.trim().toUpperCase();
    const currAction = steps[i].action?.trim().toUpperCase();

    if (prevPrediction && currAction && prevPrediction === currAction) {
      currentStreak++;
      if (currentStreak > longestPredictionStreak) {
        longestPredictionStreak = currentStreak;
      }
    } else {
      currentStreak = 0;
    }
  }

  return {
    participantsCount,
    decisionsCount,
    predictionsCount,
    contradictionsCount,
    disagreementPct,
    consensusPct,
    longestPredictionStreak,
    journeyLength,
  };
}

/**
 * Derives playful product/entertainment traits from actual response distributions.
 * These are entertainment traits, not psychological diagnoses.
 */
export function calculateNftPersonality(
  relay: RelayExperience,
  metrics: RelayMetrics
): NftPersonality {
  const steps = relay.steps || [];

  // Count choices
  let createCount = 0;
  let changeCount = 0;
  steps.forEach((s) => {
    const act = s.action.toUpperCase();
    if (act.includes('CREATE')) createCount++;
    else if (act.includes('CHANGE')) changeCount++;
  });

  const totalDecisions = Math.max(metrics.decisionsCount, 1);
  const createRatio = createCount / totalDecisions;

  let title: PersonalityTraitName = 'Observer';
  let tagline = 'Quiet and reflective as its early journey unfolds';
  let summary = 'A nascent artifact absorbing the very first impressions of its community.';
  let accentColor = '#38bdf8'; // cyan

  if (steps.length <= 1) {
    title = 'Observer';
    tagline = 'Genesis artifact witnessing its initial community reception';
    summary = 'Freshly inscribed into the collective canvas, awaiting community momentum.';
    accentColor = '#38bdf8';
  } else if (metrics.disagreementPct >= 50 || metrics.contradictionsCount >= 2) {
    title = 'Contrarian';
    tagline = 'Regularly defies the status quo with alternating choices';
    summary = `${metrics.disagreementPct}% of decisions diverged from the predecessor, turning this token into a dynamic battleground of contrasting ideas.`;
    accentColor = '#f43f5e'; // rose/pink
  } else if (metrics.consensusPct >= 65) {
    title = 'Consensus Seeker';
    tagline = 'Curators harmonize and reinforce each other’s direction';
    summary = `With ${metrics.consensusPct}% consensus across ${metrics.participantsCount} participants, the community demonstrates rare directional alignment.`;
    accentColor = '#10b981'; // emerald
  } else if (createRatio >= 0.6) {
    title = 'Creator';
    tagline = 'Overwhelming bias toward building, expanding, and synthesizing';
    summary = `Curators predominantly choose constructive addition, deepening the NFT's lore with architectural weight.`;
    accentColor = '#a855f7'; // purple
  } else if (metrics.predictionsCount >= 3 && metrics.longestPredictionStreak >= 1) {
    title = 'Risk Taker';
    tagline = 'High prediction frequency and bold community forecasting';
    summary = `Curators actively speculate on next moves, leaning into unpredictable forks and sudden direction switches.`;
    accentColor = '#f59e0b'; // amber
  } else {
    title = 'Explorer';
    tagline = 'Evenly distributed curiosity navigating varied narrative branches';
    summary = `The artifact moves gracefully between expansion and alteration without settling into a single pattern.`;
    accentColor = '#06b6d4'; // cyan
  }

  return {
    title,
    tagline,
    summary,
    disagreementPct: metrics.disagreementPct,
    consensusPct: metrics.consensusPct,
    disagreementCount: metrics.contradictionsCount,
    consensusCount: Math.max(0, Math.max(steps.length - 1, 0) - metrics.contradictionsCount),
    accentColor,
  };
}

/**
 * Computes all milestones and flags them as unlocked ONLY when actual stored data satisfies conditions.
 */
export function calculateRelayMilestones(
  relay: RelayExperience,
  metrics: RelayMetrics
): RelayMilestone[] {
  const allMilestones: RelayMilestone[] = [
    {
      id: 'first_relay',
      title: 'First Relay',
      description: 'Genesis Relay authored and published to Mosaic lore.',
      unlocked: metrics.decisionsCount >= 1,
      unlockedAtChapter: 1,
      currentProgress: Math.min(metrics.decisionsCount, 1),
      targetProgress: 1,
    },
    {
      id: 'first_contradiction',
      title: 'First Contradiction',
      description: 'A curator diverged from the previous decision, creating the first narrative fork.',
      unlocked: metrics.contradictionsCount >= 1,
      unlockedAtChapter: (() => {
        const steps = relay.steps || [];
        for (let i = 1; i < steps.length; i++) {
          if (steps[i].action.toUpperCase() !== steps[i - 1].action.toUpperCase()) {
            return steps[i].step;
          }
        }
        return undefined;
      })(),
      currentProgress: Math.min(metrics.contradictionsCount, 1),
      targetProgress: 1,
    },
    {
      id: 'prediction_streak',
      title: 'Prediction Streak',
      description: 'Achieved 2 or more consecutive accurate forecasts about the next person’s choice.',
      unlocked: metrics.longestPredictionStreak >= 2,
      currentProgress: Math.min(metrics.longestPredictionStreak, 2),
      targetProgress: 2,
    },
    {
      id: 'ten_humans',
      title: '10 Humans',
      description: 'Inscribed by 10 distinct community participants.',
      unlocked: metrics.participantsCount >= 10,
      currentProgress: Math.min(metrics.participantsCount, 10),
      targetProgress: 10,
    },
    {
      id: 'twenty_five_decisions',
      title: '25 Decisions',
      description: 'Quarter-century milestone: 25 collaborative choices inscribed into provenance.',
      unlocked: metrics.decisionsCount >= 25,
      currentProgress: Math.min(metrics.decisionsCount, 25),
      targetProgress: 25,
    },
    {
      id: 'hundred_participants',
      title: '100 Participants',
      description: 'Centurion status: A living community story enriched by 100 individuals.',
      unlocked: metrics.participantsCount >= 100,
      currentProgress: Math.min(metrics.participantsCount, 100),
      targetProgress: 100,
    },
  ];

  return allMilestones;
}

/**
 * Generates the clean social post text formatted as requested:
 * "Chog #1847 has reached 50 people.
 *
 * Its current personality:
 * THE CONTRARIAN
 *
 * [View Relay]"
 */
export function formatRelaySocialPostText(
  relay: RelayExperience,
  personality: NftPersonality,
  metrics: RelayMetrics
): string {
  const peopleCount = metrics.participantsCount;
  const personLabel = peopleCount === 1 ? 'person' : 'people';
  const nameLabel = `${relay.collection} ${relay.tokenId}`;

  return `${nameLabel} has reached ${peopleCount} ${personLabel}.\n\nIts current personality:\nTHE ${personality.title.toUpperCase()}\n\n${metrics.disagreementPct}% disagreement · ${metrics.consensusPct}% consensus\n\n[View Relay]`;
}
