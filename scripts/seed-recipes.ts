import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.recipe.upsert({
    where: { slug: "mascarpone-pasta" }, update: {},
    create: {
      slug: "mascarpone-pasta", title: "Mascarpone Pasta", summary: "Creamy garlic mascarpone spaghetti with spinach, nutmeg, and plenty of black pepper.", servings: 1, prepMinutes: 5, cookMinutes: 20, tags: ["dinner", "pasta", "quick", "vegetarian"], notes: "Keep the heat gentle once the mascarpone is in the pan so the sauce stays silky.", calories: 1310, proteinGrams: 34, carbsGrams: 158, fatGrams: 66,
      ingredients: { create: [
        { amount: "200", unit: "g", name: "spaghetti", note: "", optional: false, sortOrder: 0 },
        { amount: "1/2", unit: "cup", name: "mascarpone", note: "", optional: false, sortOrder: 1 },
        { amount: "50", unit: "g", name: "spinach", note: "washed", optional: false, sortOrder: 2 },
        { amount: "3", unit: "cloves", name: "garlic", note: "finely chopped", optional: false, sortOrder: 3 },
        { amount: "1", unit: "tbsp", name: "olive oil", note: "", optional: false, sortOrder: 4 },
        { amount: "", unit: "", name: "salt", note: "", optional: false, sortOrder: 5 },
        { amount: "", unit: "", name: "black pepper", note: "", optional: false, sortOrder: 6 },
        { amount: "", unit: "", name: "nutmeg", note: "a small pinch, freshly grated if possible", optional: false, sortOrder: 7 },
        { amount: "", unit: "", name: "roasted sunflower seeds", note: "to finish", optional: true, sortOrder: 8 },
        { amount: "", unit: "", name: "Parmesan cheese", note: "finely grated, to finish", optional: true, sortOrder: 9 },
      ] },
      steps: { create: [
        "Bring a pot of well-salted water to a boil. Chop the garlic and wash the spinach.", "Cook the spaghetti until just shy of al dente. Reserve a cup of the pasta water before draining.", "While the pasta cooks, warm the olive oil in a large pan over medium-low heat. Cook the garlic briefly until fragrant, without browning.", "Stir in the mascarpone and a splash of pasta water. Season with salt, black pepper, and a small pinch of nutmeg until smooth.", "Add the spinach and let it wilt. Toss in the spaghetti, adding more pasta water as needed, until coated and finished cooking in the sauce.", "Serve with extra black pepper, Parmesan, and roasted sunflower seeds if using.",
      ].map((text, sortOrder) => ({ text, sortOrder })) },
    },
  });
}

main().finally(() => prisma.$disconnect());
