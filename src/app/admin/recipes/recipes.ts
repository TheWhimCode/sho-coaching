export type RecipeIngredient = {
  id: string;
  amount: string;
  unit: string;
  name: string;
  note: string;
};

export type RecipeStep = {
  id: string;
  text: string;
};

export type Recipe = {
  id: string;
  title: string;
  summary: string;
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  tags: string[];
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  notes: string;
};

export const recipes: Recipe[] = [
  {
    id: "garlic-butter-chicken-rice",
    title: "Garlic butter chicken rice",
    summary: "Brown the chicken, gloss it with garlic butter, and eat it over a pot of rice.",
    servings: 2,
    prepMinutes: 10,
    cookMinutes: 20,
    tags: ["dinner", "chicken", "rice"],
    ingredients: [
      { id: "chicken", amount: "2", unit: "", name: "chicken thighs", note: "" },
      { id: "rice", amount: "1", unit: "cup", name: "jasmine rice", note: "" },
      { id: "water", amount: "1 1/4", unit: "cups", name: "water", note: "" },
      { id: "butter", amount: "2", unit: "tbsp", name: "butter", note: "" },
      { id: "garlic", amount: "3", unit: "cloves", name: "garlic", note: "minced" },
      { id: "soy", amount: "1", unit: "tbsp", name: "soy sauce", note: "" },
      { id: "honey", amount: "1", unit: "tsp", name: "honey", note: "" },
      { id: "pepper", amount: "", unit: "", name: "black pepper", note: "" },
      { id: "onion", amount: "", unit: "", name: "green onion", note: "sliced, to finish" },
    ],
    steps: [
      { id: "rice", text: "Rinse the rice, then simmer it covered with the water until the liquid is gone. Leave the lid on and let it rest off the heat." },
      { id: "brown", text: "Season the thighs with pepper. Brown them in half the butter until cooked through, skin side first if they have skin. Set them aside." },
      { id: "sauce", text: "Melt the rest of the butter in the same pan. Cook the garlic for about 30 seconds, then stir in the soy sauce and honey." },
      { id: "plate", text: "Slice the chicken, set it on the rice, and spoon the garlic butter over the top. Finish with green onion." },
    ],
    notes: "Thighs stay juicy while the sauce comes together. Breasts work if you pull them as soon as they are cooked through.",
  },
  {
    id: "miso-salmon",
    title: "Miso salmon",
    summary: "A short miso glaze on salmon, with rice and cucumber so dinner is one plate.",
    servings: 2,
    prepMinutes: 8,
    cookMinutes: 12,
    tags: ["dinner", "fish"],
    ingredients: [
      { id: "salmon", amount: "2", unit: "", name: "salmon fillets", note: "" },
      { id: "miso", amount: "1", unit: "tbsp", name: "white miso", note: "" },
      { id: "honey", amount: "1", unit: "tsp", name: "honey", note: "" },
      { id: "vinegar", amount: "1", unit: "tsp", name: "rice vinegar", note: "" },
      { id: "sesame-oil", amount: "1", unit: "tsp", name: "sesame oil", note: "" },
      { id: "rice", amount: "2", unit: "cups", name: "cooked rice", note: "or another grain already made" },
      { id: "cucumber", amount: "1", unit: "", name: "cucumber", note: "thinly sliced" },
      { id: "sesame", amount: "", unit: "", name: "sesame seeds", note: "" },
    ],
    steps: [
      { id: "glaze", text: "Stir the miso, honey, vinegar, and sesame oil into a loose glaze." },
      { id: "cook", text: "Sear the salmon in a pan, or broil it, until it is nearly cooked through." },
      { id: "finish", text: "Brush on the glaze and cook for another minute. Keep the heat gentle so the miso does not scorch." },
      { id: "plate", text: "Serve over the rice with cucumber and sesame seeds." },
    ],
    notes: "Glaze near the end. Miso burns if it sits on high heat for long.",
  },
  {
    id: "tomato-egg",
    title: "Tomato and egg",
    summary: "Soft eggs and a quick tomato sauce. One pan, and it is done before the rice cools.",
    servings: 1,
    prepMinutes: 5,
    cookMinutes: 8,
    tags: ["lunch", "eggs", "quick"],
    ingredients: [
      { id: "eggs", amount: "2", unit: "", name: "eggs", note: "" },
      { id: "tomato", amount: "1", unit: "large", name: "tomato", note: "cut into wedges" },
      { id: "oil", amount: "1", unit: "tbsp", name: "neutral oil", note: "" },
      { id: "salt", amount: "", unit: "", name: "salt", note: "" },
      { id: "sugar", amount: "1/2", unit: "tsp", name: "sugar", note: "" },
      { id: "onion", amount: "", unit: "", name: "green onion", note: "sliced" },
      { id: "rice", amount: "", unit: "", name: "rice", note: "to serve" },
    ],
    steps: [
      { id: "eggs", text: "Beat the eggs with a pinch of salt. Scramble them in the oil until just set, then slide them out of the pan." },
      { id: "tomato", text: "Cook the tomato in the same pan with the sugar and a little salt until it softens into a sauce." },
      { id: "combine", text: "Return the eggs and fold them through the tomato just until everything is hot." },
      { id: "serve", text: "Top with green onion and eat it over rice." },
    ],
    notes: "Pull the eggs while they still look a little soft. They finish cooking in the tomato.",
  },
];
