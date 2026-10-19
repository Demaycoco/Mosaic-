import { shardService } from '../src/services/shardService';
import { questService } from '../src/services/questService';

async function runTests() {
  console.log('--- Starting Mosaic Shards & Quests Test Suite ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${detail}`);
      failed++;
    }
  }

  const testUserId = `test_user_${Date.now()}`;

  // Test 1: Initial balance is 0
  const initialAcc = shardService.getAccount(testUserId);
  assert(initialAcc.balance === 0, 'Initial balance is 0');
  assert(initialAcc.lifetimeEarned === 0, 'Initial lifetimeEarned is 0');
  assert(initialAcc.lifetimeSpent === 0, 'Initial lifetimeSpent is 0');

  // Test 2: Valid quest completion awards Shards once
  const questId = 'relay_contributor';
  const quest = questService.getQuestById(questId)!;
  const awardRes = await shardService.awardQuestCompletion({
    userId: testUserId,
    questId: quest.id,
    questTitle: quest.title,
    shardsReward: quest.shardsReward,
  });

  assert(awardRes.account.balance === 150, 'Awards 150 Shards on first completion');
  assert(awardRes.account.lifetimeEarned === 150, 'Lifetime earned reflects 150');
  assert(awardRes.transaction.amount === 150, 'Transaction recorded +150 credit');
  assert(awardRes.transaction.type === 'quest_reward', 'Transaction type is quest_reward');

  // Test 3: Repeating the same completion does NOT award Shards again (idempotency check)
  let repeatFailedAsExpected = false;
  try {
    await shardService.awardQuestCompletion({
      userId: testUserId,
      questId: quest.id,
      questTitle: quest.title,
      shardsReward: quest.shardsReward,
    });
  } catch (err: any) {
    repeatFailedAsExpected = err.message.includes('already been claimed') || err.message.includes('processed');
  }
  assert(repeatFailedAsExpected, 'Repeating same quest completion throws duplicate error');

  const afterRepeatAcc = shardService.getAccount(testUserId);
  assert(afterRepeatAcc.balance === 150, 'Balance remains 150 after duplicate attempt');

  // Test 4: A rejected submission does NOT award Shards
  const manualQuestId = 'artifact_lore_thesis';
  await questService.joinQuest(manualQuestId, testUserId);
  await questService.submitEvidence(manualQuestId, testUserId, {
    evidenceText: 'Incomplete thesis...',
  });
  const partBeforeReview = questService.getParticipation(manualQuestId, testUserId)!;
  assert(partBeforeReview.status === 'under_review', 'Evidence submission sets status under_review');

  // Organizer rejects with feedback
  await questService.reviewSubmission(partBeforeReview.id, 'curator_alice', 'reject', 'Needs more detail.');
  const rejectedPart = questService.getParticipation(manualQuestId, testUserId)!;
  assert(rejectedPart.status === 'rejected', 'Status changed to rejected');
  assert(rejectedPart.reviewFeedback === 'Needs more detail.', 'Review feedback recorded');

  // Attempting to claim reward on rejected quest must fail
  let rejectedClaimBlocked = false;
  try {
    await questService.claimQuestReward(manualQuestId, testUserId);
  } catch (err: any) {
    rejectedClaimBlocked = err.message.includes('not approved');
  }
  assert(rejectedClaimBlocked, 'Rejected submission cannot claim Shards');
  assert(shardService.getAccount(testUserId).balance === 150, 'Balance untouched on rejected claim attempt');

  // Test 5: User cannot spend more Shards than they have
  const expensiveReward = shardService.getRewards().find((r) => r.shardsCost > 150)!; // 200 or 500
  let overspendBlocked = false;
  try {
    await shardService.claimReward({
      userId: testUserId,
      rewardId: expensiveReward.id,
    });
  } catch (err: any) {
    overspendBlocked = err.message.includes('Insufficient Mosaic Shards');
  }
  assert(overspendBlocked, 'User cannot spend more Shards than available balance');

  // Test 6: A valid claim deducts Shards, creates pending fulfillment, records debit in ledger
  // Add 100 Shards first so balance is 250
  await shardService.awardQuestCompletion({
    userId: testUserId,
    questId: 'community_guilds',
    questTitle: 'Network Explorer',
    shardsReward: 100,
  });
  assert(shardService.getAccount(testUserId).balance === 250, 'Balance is now 250 Shards');

  const affordableReward = shardService.getRewards().find((r) => r.shardsCost === 200)!;
  const claimRes = await shardService.claimReward({
    userId: testUserId,
    rewardId: affordableReward.id,
    userDisplayName: 'Test User',
  });

  assert(claimRes.account.balance === 50, 'Balance reduced to 50 (250 - 200)');
  assert(claimRes.account.lifetimeSpent === 200, 'Lifetime spent updated to 200');
  assert(claimRes.transaction.amount === -200, 'Ledger transaction recorded negative debit (-200)');
  assert(claimRes.transaction.type === 'reward_redemption', 'Ledger type is reward_redemption');

  // Test 7: A claim is NOT marked fulfilled before delivery is confirmed
  assert(claimRes.claim.status === 'pending_fulfillment', 'New claim has status pending_fulfillment');
  assert(!claimRes.claim.fulfilledAt, 'fulfilledAt is undefined before confirmation');

  // Organizer fulfills claim
  const fulfilled = await shardService.fulfillClaim(claimRes.claim.id, 'organizer_bob', 'Whitelist slot reserved.');
  assert(fulfilled.status === 'fulfilled', 'Claim marked fulfilled after organizer confirmation');
  assert(!!fulfilled.fulfilledAt, 'fulfilledAt timestamp recorded');
  assert(fulfilled.fulfilledBy === 'organizer_bob', 'fulfilledBy recorded');

  // Test 8: A reward with no remaining inventory cannot be claimed
  // First ensure user has enough Shards so that the rejection is strictly due to inventory
  await shardService.awardQuestCompletion({
    userId: testUserId,
    questId: 'social_voice',
    questTitle: 'Creative Voice',
    shardsReward: 500,
  });

  const rewardsList = shardService.getRewards();
  const limitedReward = { ...rewardsList.find((r) => r.inventoryLimit !== undefined)! };
  // Max out inventory and save
  limitedReward.claimedCount = limitedReward.inventoryLimit!;
  limitedReward.status = 'out_of_stock';
  shardService.updateReward(limitedReward);

  let outOfStockBlocked = false;
  try {
    await shardService.claimReward({
      userId: testUserId,
      rewardId: limitedReward.id,
    });
  } catch (err: any) {
    outOfStockBlocked = err.message.includes('out of stock') || err.message.includes('not available');
  }
  assert(outOfStockBlocked, 'Out-of-stock reward claim is rejected');

  // Test 9: Two simultaneous claims cannot overspend the same balance
  // Give user 200 Shards
  const userSim = `test_user_sim_${Date.now()}`;
  await shardService.awardQuestCompletion({
    userId: userSim,
    questId: 'relay_contributor',
    questTitle: 'Living Story Curator',
    shardsReward: 200,
  });
  assert(shardService.getAccount(userSim).balance === 200, 'User has 200 Shards for simultaneous test');

  // Both claims cost 150 each. User only has 200. Only one may succeed; second must fail.
  const reward150 = shardService.getRewards().find((r) => r.shardsCost === 150)!;
  let simSuccessCount = 0;
  let simFailureCount = 0;

  const results = await Promise.allSettled([
    shardService.claimReward({ userId: userSim, rewardId: reward150.id }),
    shardService.claimReward({ userId: userSim, rewardId: reward150.id }),
  ]);

  results.forEach((res) => {
    if (res.status === 'fulfilled') simSuccessCount++;
    if (res.status === 'rejected') simFailureCount++;
  });

  assert(simSuccessCount === 1, 'Exactly one simultaneous claim succeeded');
  assert(simFailureCount === 1, 'Second simultaneous claim failed due to insufficient funds');
  assert(shardService.getAccount(userSim).balance === 50, 'Balance is exactly 50 (200 - 150), no negative balance');

  // Test 10: A user cannot award themselves Shards (zero/negative or without valid quest)
  let zeroAwardBlocked = false;
  try {
    await shardService.awardQuestCompletion({
      userId: testUserId,
      questId: 'fake_quest',
      questTitle: 'Fake',
      shardsReward: 0,
    });
  } catch (err: any) {
    zeroAwardBlocked = err.message.includes('greater than zero');
  }
  assert(zeroAwardBlocked, 'Self-awarding 0 or negative Shards is blocked');

  // Test 11: Premium Badge service boundary verification
  const eligibility = shardService.checkPremiumBadgeEligibility(testUserId);
  assert(typeof eligibility.eligible === 'boolean', 'Premium badge boundary reports eligibility');
  assert(eligibility.badgeName.includes('Genesis Curator'), 'Reports correct future badge definition');

  console.log(`\n--- Test Results: ${passed} passed, ${failed} failed ---`);
  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
