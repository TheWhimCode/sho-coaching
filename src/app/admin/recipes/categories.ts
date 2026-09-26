export type RecipeCategoryGroup = { id: string; title: string };

export type RecipeCategory = {
  id: string;
  group: RecipeCategoryGroup['id'];
  title: string;
  detail: string;
  match: (recipe: { tags: string[]; calories: number | null }) => boolean;
};

// Overarching groups: each becomes a row on the recipes landing page, in this order.
export const recipeCategoryGroups: RecipeCategoryGroup[] = [
  { id: 'main', title: 'Main meals' },
  { id: 'quick', title: 'Quick' },
  { id: 'other', title: 'Other' },
];

// Meal groups, not one tile per tag. A recipe can appear in more than one group.
export const recipeCategories: RecipeCategory[] = [
  { id: 'pasta', group: 'main', title: 'Pasta', detail: 'Sauces and noodles', match: recipe => recipe.tags.includes('pasta') },
  { id: 'curry', group: 'main', title: 'Curry', detail: 'Spiced and saucy', match: recipe => recipe.tags.includes('curry') },
  { id: 'quick', group: 'quick', title: 'Low energy', detail: 'Short to cook', match: recipe => recipe.tags.includes('quick') },
  { id: 'snack', group: 'quick', title: 'Snacks', detail: 'Small plates', match: recipe => recipe.tags.includes('snack') },
  { id: 'low-calorie', group: 'other', title: 'Low calorie', detail: 'Under 600 kcal', match: recipe => recipe.calories != null && recipe.calories < 600 },
  { id: 'add-on', group: 'other', title: 'Add-ons', detail: 'Added once per meal', match: recipe => recipe.tags.includes('add-on') },
];
