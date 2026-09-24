INSERT INTO "admin"."GroceryItem" ("id", "name", "category", "createdAt", "updatedAt") VALUES
  ('grocery-cucumber', 'cucumber', 'produce', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-tortilla-chips', 'tortilla chips', 'snacks', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grocery-hummus', 'hummus', 'refrigerated', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "admin"."GroceryLot" ("id", "groceryItemId", "purchasedAmount", "remainingAmount", "purchasedWeightGrams", "remainingWeightGrams", "purchasedAt", "createdAt", "updatedAt") VALUES
  ('lot-cucumber-1', 'grocery-cucumber', '1 cucumber', '1 cucumber', NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lot-tortilla-chips-1', 'grocery-tortilla-chips', '1 bag', '1 bag', 200, 200, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lot-hummus-1', 'grocery-hummus', '1 tub', '1 tub', 250, 250, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
