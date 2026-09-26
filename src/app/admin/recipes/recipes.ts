export type RecipeIngredient = {
  id: string; amount: string; unit: string; name: string; note: string; optional: boolean;
  groceryItemId: string | null; needGrams: number | null; haveGrams: number | null; packGrams: number | null;
};
export type RecipeStep = { id: string; text: string };
export type Recipe = {
  id: string; title: string; familyKey: string | null; familyTitle: string | null; variantLabel: string | null;
  summary: string; servings: number | null; prepMinutes: number; cookMinutes: number; tags: string[]; calories: number | null;
  ingredients: RecipeIngredient[]; steps: RecipeStep[]; methodText: string; notes: string;
  nutrition?: { basis: string; values: { label: string; value: number | null; unit: string }[] };
};
