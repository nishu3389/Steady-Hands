# Steady Hands — Progression & Challenge System Plan

## 1. Goal

Add a lightweight progression layer around the existing Steady Hands core loop without replacing or substantially changing the current balance/walking physics.

Current core loop:
Calibrate → Walk + balance the bowl → Keep water from spilling → Finish round → Receive Mind-Body Steadiness result.

The progression system should make the same core mechanic increasingly meaningful over time:

- Early game: learn the basic balance mechanic.
- Mid game: pursue precision and consistency.
- Later game: handle controlled special conditions.
- Long-term: master difficult combinations and improve personal performance.

## 2. Product principle

Do NOT turn Steady Hands into a generic arcade/RPG game.

Keep the central identity:
- Physical phone interaction
- Walking + balance
- Water preservation
- Calm / mindful presentation
- Skill improvement

Progression should be layered ON TOP of the existing gameplay.

Avoid introducing:
- Combat
- Enemies
- Complex inventories
- Multiple currencies
- Large backend systems
- Gameplay-affecting cosmetic upgrades

## 3. Proposed progression structure

Use milestones based on completed successful rounds rather than requiring a complicated XP system.

Example:

### Milestone 1 — First Balance
Round 1:
"Can you keep the water from spilling?"

Purpose:
- Teach the core loop.
- No special modifiers.
- Keep the experience simple.

### Milestone 2 — Perfect Balance
Around Round 10:
"Maintain Perfect Balance for 15 seconds."

Purpose:
- Introduce precision as a secondary objective.
- Encourage staying near the center rather than merely surviving.

### Milestone 3 — Storm
Around Round 30:
"Survive a Storm Event without losing Flow."

Purpose:
- Introduce temporary gameplay events.
- Increase variety without creating a new game mode.

### Milestone 4 — Master Challenge
Around Round 50:
"Beat the Hard Master Challenge."

Purpose:
- Give experienced players a meaningful mastery target.
- Combine existing difficulty parameters with challenge conditions.

Important:
These are progression milestones, NOT necessarily mandatory numbered levels. The implementation should remain flexible so milestone requirements can be changed later.

## 4. Recommended V1 feature set

Implement these four systems first:

### A. Progression Milestones

Track:
- Total completed rounds
- Successful rounds
- Highest score
- Highest score per difficulty
- Best water remaining
- Best Perfect Balance duration
- Challenge completion

Milestones should unlock based on achievement, not simply time spent in the app.

Suggested initial milestones:

1. First Step
   - Complete 1 successful round.

2. Finding Balance
   - Complete 5 successful rounds.

3. Perfect Balance
   - Maintain Perfect Zone for 15 cumulative seconds in one round.

4. Finding Rhythm
   - Achieve a strong Rhythm score / maintain target cadence for a challenge-defined duration.

5. Flow State
   - Achieve a score of 85+.

6. Storm Walker
   - Successfully complete a round containing a Storm Event.

7. Master of Balance
   - Successfully complete Hard difficulty.

8. Steady Master
   - Achieve 90+ on Hard.

The exact thresholds should be centralized in configuration rather than hardcoded throughout UI components.

### B. Perfect Zone

Introduce a third balance state in addition to the existing safe/danger concepts.

Concept:

- PERFECT: player is very close to center.
- SAFE: player is balanced but not highly precise.
- DANGER: player is approaching/exceeding spill threshold.

When the player stays in PERFECT:
- Show subtle visual feedback.
- Accumulate Perfect Balance time.
- Allow a combo/Flow counter to build.

Do not make the Perfect Zone punish players. The existing core objective remains survival.

The Perfect Zone should be derived from the existing tilt measurements, not a new sensor system.

Suggested implementation approach:
- Define a `perfectTiltThreshold` based on difficulty.
- Compare current smoothed tilt magnitude against that threshold.
- Accumulate `perfectZoneTime` while inside the threshold.
- Reset or pause accumulation when outside it.

Keep the exact threshold values configurable and tune them during testing.

### C. Flow / Combo

Create an in-round Flow state based on sustained excellent balance.

Example progression:

- 3 sec Perfect → FLOW 1
- 6 sec → FLOW 2
- 10 sec → FLOW 3
- 15+ sec → FLOW STATE

The UI should be subtle and consistent with the Zen aesthetic.

Example:

FLOW ×3
"Beautifully steady"

If the player enters a strong wobble/danger state, the combo can reset.

Do not make this overly arcade-like. It should feel like recognition of good performance, not a flashy multiplier game.

Store enough data at round end to show:
- Highest Flow level
- Longest Perfect Balance streak
- Total Perfect Balance time

### D. Controlled Water Events

Introduce optional temporary events during later progression.

Initial event:

#### Storm

During Storm:
- Slightly increase tilt sensitivity OR temporarily narrow the safe zone.
- Keep the duration short.
- Display a clear warning.
- Restore normal parameters automatically afterward.

Example UI:

STORM
"Stay centered"

Important implementation constraint:
Do NOT create a second physics engine.

Reuse the existing difficulty configuration and temporarily apply a modifier to the values already used by the gameplay loop.

Example conceptual model:

baseConfig
+
temporaryEventModifier
=
activeConfig

The event system should be deterministic enough for debugging/testing.

## 5. Difficulty progression

Do not automatically force players through Easy → Medium → Hard.

Existing difficulty selection should remain intact.

Progression should unlock:
- Challenges
- Events
- Master challenges
- Cosmetic rewards later

Players should still be able to play their preferred difficulty.

## 6. Challenge architecture

Create a generic challenge definition rather than hardcoding individual screens.

Conceptual TypeScript shape:

```ts
type ChallengeType =
  | 'complete_round'
  | 'perfect_balance_time'
  | 'score_threshold'
  | 'water_remaining'
  | 'cadence_range'
  | 'difficulty_win'
  | 'event_survival';

interface ChallengeDefinition {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  target: number;
  difficulty?: Difficulty;
  eventType?: GameEventType;
  unlockAtRound?: number;
  reward?: number;
}
```

Keep challenge evaluation separate from presentation.

A challenge engine should receive round statistics and return progress/completion.

## 7. Round statistics

Extend the existing result data with progression-friendly metrics where practical.

Potential fields:

```ts
interface RoundStats {
  score: number;
  waterRemaining: number;
  duration: number;
  stillnessScore: number;
  rhythmScore: number;
  postureScore: number;

  perfectBalanceTime: number;
  longestPerfectStreak: number;
  highestFlowLevel: number;

  steps: number;
  averageCadence: number;

  eventsEncountered: string[];
  eventsSurvived: string[];
}
```

Only add fields that can be calculated reliably from the current gameplay loop.

Do not duplicate existing state unnecessarily.

## 8. Persistence

Use the existing localStorage persistence architecture.

Progression data can be stored locally.

Example conceptual structure:

```ts
interface ProgressionState {
  completedRounds: number;
  successfulRounds: number;

  unlockedMilestones: string[];
  completedChallenges: string[];

  bestPerfectBalanceTime: number;
  bestFlowLevel: number;
}
```

Do not add Firestore requirements for V1.

The global leaderboard should remain responsible for leaderboard data only.

## 9. Progression UI

### Home screen

Show a compact progress section, not a large dashboard.

Example:

🪷 YOUR JOURNEY

Finding Balance
████████░░ 80%

Next:
"Maintain Perfect Balance for 15 sec"

The player should immediately understand:
1. What they have achieved.
2. What they are working toward.
3. Why they should play another round.

### Pre-round

If a challenge is active:

TODAY'S CHALLENGE
"Maintain Perfect Balance for 15 sec"

Optional:
Reward: Zen Token / cosmetic unlock

Do not overwhelm the start screen with multiple objectives.

### During round

Only show information relevant to immediate gameplay:
- Water
- Timer
- Walking state
- Current Flow state
- Event warning

Avoid permanent large challenge panels.

### Results

Add a progression section beneath the existing Mind-Body Steadiness result.

Example:

RESULT
82 — Mindful Balance

NEW PERSONAL BEST
+4

CHALLENGE COMPLETE
"Perfect Balance — 15 sec"

MILESTONE UNLOCKED
"Finding Rhythm"

NEXT
"Reach 85 Steadiness"

This should make the result screen answer:
"What did I accomplish?"
"What did I unlock?"
"What should I try next?"

## 10. Milestone pacing

Do not make milestones unlock too quickly.

Suggested pacing:

Rounds 1–5:
- Core learning
- First achievements

Rounds 5–15:
- Perfect Zone
- Flow

Rounds 15–30:
- More demanding challenges

Rounds 30–50:
- Events
- Advanced challenges

50+:
- Master challenges
- High-score mastery
- Hard-mode goals

These numbers are starting points, not fixed product requirements.

## 11. Rewards

For V1, rewards can be simple.

Recommended:
- Milestone badge
- Challenge completion
- New title
- Progress indicator

If a currency is eventually added, use one simple cosmetic-only currency such as Zen Tokens.

Do NOT build a complex economy in this feature.

Possible future cosmetics:
- Bowl styles
- Water styles
- Background environments
- Calm ambient themes

Cosmetics must not affect gameplay balance.

## 12. Important UX rule: never punish experimentation

Players should be able to:
- Try Easy
- Try Hard
- Disable Walking Mode if needed
- Replay previous difficulties

Progression should reward mastery without locking the basic game behind progression.

## 13. Technical integration points

The implementation should primarily touch:

- `PlayScreen.tsx`
  - Track progression-related round metrics.
  - Detect Perfect Zone.
  - Manage Flow state.
  - Trigger temporary events.

- `types.ts`
  - Add shared progression/event/challenge types.

- `storage.ts`
  - Persist progression state.

- `MatchResultsModal.tsx`
  - Show milestone/challenge completion and next objective.

- Home/lobby UI
  - Show current progression and next objective.

- `ThreeBowlCanvas.tsx`
  - Only modify if visual feedback for Perfect/Storm requires it.

Do not rewrite the existing walking detector unless testing reveals an actual issue. The walking detector already provides the core walking state, steps and cadence signals required for progression. 

## 14. Architecture recommendation

Keep the feature modular.

Prefer new modules such as:

```text
src/
  progression/
    progressionConfig.ts
    progressionService.ts
    challengeEngine.ts
    eventEngine.ts
```

Exact folder structure may be adapted to the existing project conventions.

Responsibilities:

### progressionConfig
Contains:
- milestone definitions
- challenge definitions
- event definitions
- thresholds

### progressionService
Handles:
- loading progression
- saving progression
- unlocking milestones
- updating progress

### challengeEngine
Pure logic:
- input: round statistics
- output: challenge progress/completion

### eventEngine
Handles:
- event selection
- event timing
- temporary modifiers
- event completion/survival

Keep gameplay state inside `PlayScreen.tsx` where practical, but move reusable progression logic out of the component.

## 15. Avoid overengineering

For this feature, explicitly avoid:

- New backend collections
- Real-time multiplayer
- Complex XP/level systems
- Procedural world generation
- New sensor types
- Major physics rewrites
- Large animation systems
- Permanent gameplay modifiers
- Multiple currencies
- Skill trees

The goal is a thin progression layer over the existing game.

## 16. Suggested implementation order

### Phase 1 — Metrics
1. Add Perfect Zone detection.
2. Track Perfect Balance duration.
3. Track longest Perfect streak.
4. Track highest Flow level.
5. Expose these in round results.

### Phase 2 — Flow
1. Add Flow state machine.
2. Add subtle gameplay/UI feedback.
3. Reset Flow on significant instability.
4. Verify it does not interfere with water physics.

### Phase 3 — Milestones
1. Add progression state.
2. Add milestone definitions.
3. Implement unlock evaluation.
4. Persist locally.
5. Show newly unlocked milestone on results.

### Phase 4 — Challenges
1. Create generic challenge model.
2. Add 5–8 initial challenges.
3. Evaluate challenges from RoundStats.
4. Show active challenge before round.
5. Show completion on results.

### Phase 5 — Events
1. Add generic event model.
2. Implement Storm only.
3. Add temporary modifier support.
4. Add warning UI.
5. Test event start/end transitions.
6. Unlock Storm through progression.

### Phase 6 — Polish
1. Tune thresholds.
2. Tune milestone pacing.
3. Improve animations.
4. Improve result feedback.
5. Ensure dark mode works.
6. Ensure accessibility/font-size settings still work.
7. Test desktop fallback.
8. Test walking mode on real Android devices.

## 17. Acceptance criteria

The feature is complete when:

- Existing rounds still work exactly as before when no progression modifier is active.
- Perfect Zone is measurable and reliable.
- Flow can be earned and lost predictably.
- Progression persists across app restarts.
- Milestones unlock based on actual achievements.
- Challenges can be added through configuration without rewriting UI logic.
- Storm can temporarily modify existing gameplay parameters and then restore them safely.
- No progression data requires Firestore.
- Existing leaderboard behavior is unaffected.
- Existing score calculation remains compatible.
- Walking detection remains unchanged unless a specific integration bug is discovered.
- Results clearly communicate achievement + next objective.
- The player always has an obvious reason to attempt another round.

## 18. Product success test

After implementation, ask a simple question:

After completing a round, does the player naturally think:

"Can I beat that?"
"I want to complete the next challenge."
"I want to unlock the next milestone."

If the answer is yes, the progression layer is doing its job.

The objective is NOT to make the game more complicated.

The objective is to make the existing 60-second balance experience feel like a journey from:

FIRST BALANCE
→ PRECISION
→ RHYTHM
→ FLOW
→ STORM
→ MASTERY
