# Build picker scoring transition

The shield scores are saved from the owner's dictation in
`build-picker-shield-ratings.json`, with provisional alignment documented there.
All 173 durability ratings are saved in `build-picker-durability-ratings.json`.
Steelcaps eligibility for all 96 champions rated durability 1–2 is saved in
`build-picker-steelcaps-ratings.json`: 24 Yes and 72 No. Thresholds are still pending.
The current decision tree remains active, including its existing
AD adjustment. Do not infer ratings from the old categories or activate new rules
until those inputs are supplied.

## Prepared fields

- `durabilityScore`: integer 1–5; expected HP/armor durability relevant to choosing
  Titansbane, rather than mobility or reset denial.
- `shieldScore`: integer 0–5; 0 explicitly means no shielding.
- `shieldTiming`: blank/null means early; `Late` is the only explicit override.
  Preserve the old `shields = Late` classifications when importing ratings.
- `canBuildSteelcaps`: boolean; whether Steelcaps are a realistic build option.
  Only relevant to champions with durability 1–2; ignore it for durability 3–5.
- `mercuryTreadsScore`: integer 1–3; 1 zero value, 2 okay, 3 amazing.
  Saved in `build-picker-mercury-treads-ratings.json` for all 173 champions.
- `ccScore`: integer 1–5. Saved in `build-picker-cc-ratings.json`. Quinn is unrated.
  The old `cc` categories still drive the live tree until this score is wired in.
- `damageScore`: integer 1–5. Dictated for all 173 champions, including 2 and 4.
  The old `damageThreat` categories still drive the
  live low-damage override. Saved in `build-picker-damage-ratings.json`.
  In `/guide/build-test` only, three or more allied physical champions
  (`AD` or `Mixed`) with allied magic (`AP` or `Mixed`) `damageScore` below 6
  add +1 durability, shown as "+1 Steel", to every enemy with
  `canBuildSteelcaps`. That bonus does not count toward Titansbane.

The rating/eligibility fields are nullable: null means not reviewed,
not a low score or false. For timing only, null means early.
The additive migration adds range constraints and does not populate content.
Existing traits, including late shielding and reset denial, remain intact.

## Inputs needed before switching the recommender

Supply build thresholds for the summed durability and shielding scores,
how allied AD and Steelcaps eligibility affect the score, and how shield timing
selects first, second, or delayed Serpent's. Keep reset-denial and low-damage
overrides unless explicitly changed.

Fight-presence weighting and support-specific ratings are deferred. No champion
is discounted merely for being a potential split pusher.

Apply the schema migration before regenerating/deploying a client that queries
the new columns. Load the supplied ratings separately through the data layer,
never as content in a schema migration.

The score-and-timing migration has been applied to the shared database. All 173
shield scores were imported separately, preserving the 10 existing late flags.
