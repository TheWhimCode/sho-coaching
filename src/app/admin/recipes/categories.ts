export type RecipeCategory = {
  id: string;
  title: string;
  detail: string;
  match: (recipe: { tags: string[]; calories: number | null }) => boolean;
};

// Meal groups, not one tile per tag. A recipe can appear in more than one group.
export const recipeCategories: RecipeCategory[] = [
  { id: 'pasta', title: 'Pasta', detail: 'Sauces and noodles', match: recipe => recipe.tags.includes('pasta') },
  { id: 'dinner', title: 'Dinner', detail: 'Evening meals', match: recipe => recipe.tags.includes('dinner') },
  { id: 'breakfast', title: 'Breakfast', detail: 'Morning meals', match: recipe => recipe.tags.includes('breakfast') },
  { id: 'smoothie', title: 'Smoothies', detail: 'Blended drinks', match: recipe => recipe.tags.includes('smoothie') },
  { id: 'snack', title: 'Snacks', detail: 'Small plates', match: recipe => recipe.tags.includes('snack') },
  { id: 'quick', title: 'Quick', detail: 'Short to cook', match: recipe => recipe.tags.includes('quick') },
  { id: 'vegetarian', title: 'Vegetarian', detail: 'No meat or fish', match: recipe => recipe.tags.includes('vegetarian') },
  { id: 'add-on', title: 'Add-ons', detail: 'Added once per meal', match: recipe => recipe.tags.includes('add-on') },
  { id: 'low-calorie', title: 'Low calorie', detail: 'Under 600 kcal', match: recipe => recipe.calories != null && recipe.calories < 600 },
];
