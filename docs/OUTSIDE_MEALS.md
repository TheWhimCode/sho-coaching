# One-off restaurant meals

Outside meals are permanent food-log records for one occasion, not reusable recipes.
They never create or consume groceries, reservations, cooked portions or shopping items.
The health page includes them in daily totals. A lunch/dinner outside entry also fills
that slot for the existing weekly score, which requires both main meals for a day.
Multiple entries in a slot (such as a main plus dessert) count as one filled slot.
Entries are additive: an existing planned recipe in the same slot still counts. If the
restaurant meal replaces a planned recipe, remove that plan through the meal-plan API
or the existing picker so its stock reservations are released correctly.

## AI workflow

1. Inspect the photos and menu description. Confirm date, meal slot and amounts eaten.
2. Estimate nutrients for one clearly described portion and record the assumptions in
   `notes`, including inferred food identity, weights, hidden fats and uncertainty.
3. Use separate entries for foods eaten in different proportions. For example, set
   dessert `amount: 0.8` and supply nutrition for the **whole** dessert. Alternatively,
   provide already-consumed totals with `amount: 1`; never apply the fraction twice.
4. Use a stable unique ID per occasion/food. Reusing it replaces the complete record,
   so retries and corrections never double-count. Include all fields when correcting.
5. Save via the authenticated API or the local script, then read back the entry.

No image upload or AI provider is needed in the website. The AI assistant performs
the estimate externally and saves structured data. Do not put routine meals in migrations.

## Nutrients and units

Keys match `nutrientKeys` in `src/lib/ingredient-measurements.ts`:

- kcal: `calories`
- g: `proteinGrams`, `carbsGrams`, `fatGrams`, `fibreGrams`, `saturatedFatGrams`, `sugarGrams`, `omega3AlAGrams`
- mg: `sodiumMg`, `potassiumMg`, `calciumMg`, `magnesiumMg`, `ironMg`, `zincMg`, `omega3EpaDhaMg`
- micrograms: `vitaminDMcg`, `vitaminB12McG`, `folateMcg`, `iodineMcg`

Sugar is supported by the data model but does not have a health-page target card.
Omitted/null nutrients remain unknown, not zero. Do not invent micronutrients merely
to fill every field. All numbers describe one `portion`; `amount` scales them once.

## API

Protected by the existing admin authentication:

- `PUT /api/admin/outside-meals`: create or fully replace by ID.
- `GET /api/admin/outside-meals?from=2026-09-27&to=2026-10-03`: inclusive date range.
- `DELETE /api/admin/outside-meals?id=restaurant-dessert-example`: remove one entry, safely retryable.

```json
{
  "id": "restaurant-dessert-example",
  "date": "2026-09-27",
  "mealSlot": "lunch",
  "name": "Wiesn Gläsle",
  "amount": 0.8,
  "portion": "one full dessert glass",
  "nutrition": { "calories": 550, "proteinGrams": 8, "carbsGrams": 65, "fatGrams": 29 },
  "notes": "Photo/menu estimate: Bavarian cream, apricot compote and mini Kaiserschmarrn. Ate 80%; values above are for the full glass.",
  "source": "AI photo and menu estimate"
}
```

The meal slots are `lunch`, `dinner`, `snack-1`, `snack-2`. Multiple entries are allowed.
Reload the health page after external changes to refresh the displayed totals.

## Local command

Save the JSON to a file, then run from the project directory:

```sh
npx tsx scripts/log-outside-meal.ts meal.json --dry-run
npx tsx scripts/log-outside-meal.ts meal.json
```

The script loads `.env.local` before `.env`, matching the app. It validates input before
connecting and shares the API's save function. Apply the schema migration and regenerate
Prisma Client when setting up an older checkout. Restart an already-running dev server
after regenerating the client.
