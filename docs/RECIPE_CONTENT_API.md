# Recipe content API

`POST /api/admin/recipes` creates a recipe, optionally upserts the grocery definitions it uses, and optionally adds tracked stock. It is protected by the existing admin authentication.

This endpoint is for recipe and pantry content. Do not create a database migration for routine recipes, groceries, or stock. Migrations remain for schema changes only.

## Pantry behavior

Each grocery has two independent flags:

- `pantryStaple`: does not appear on shopping lists, does not require stock, and does not block cooking.
- `excludeFromNutrition`: excludes the grocery from nutrition estimates.

Use both for untracked spices. Use `pantryStaple: true` and `excludeFromNutrition: false` for measured oil, salt, broth, or other staples whose nutrients should count. Package fields are preserved independently: `gramsPerCount` and `unitsPerPurchase` define the shopping pack size; `nutritionPer100g` defines nutrient density.

## Minimal request shape

```json
{
  "groceries": [{
    "name": "chicken breast",
    "category": "meat",
    "gramsPerCount": 600,
    "unitsPerPurchase": 1,
    "weightBasis": "One package: 600 g",
    "nutritionPer100g": { "calories": 120, "proteinGrams": 23, "fatGrams": 2.6, "carbsGrams": 0 }
  }],
  "recipe": {
    "title": "Chicken Example",
    "tags": ["quick"],
    "ingredients": [{ "groceryName": "chicken breast", "amount": "600", "unit": "g", "weightGrams": 600 }]
  },
  "stock": [{
    "groceryName": "chicken breast",
    "purchasedAmount": "600 g",
    "purchasedWeightGrams": 600
  }]
}
```
