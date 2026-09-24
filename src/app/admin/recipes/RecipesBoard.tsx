"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Recipe, RecipeIngredient } from "./recipes";
import { recipeCategories } from "./categories";
import styles from "./recipes.module.css";

function minutes(total: number) {
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}

function measure(item: RecipeIngredient) {
  return [item.amount, item.unit].filter(Boolean).join(" ");
}

function isShort(item: RecipeIngredient) {
  return item.needGrams != null && (item.haveGrams ?? 0) + 0.000001 < item.needGrams;
}

function formatGrams(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function familiesOf(recipes: Recipe[]) {
  return recipes.reduce<{ key: string; title: string; recipes: Recipe[] }[]>((groups, item) => {
    const key = item.familyKey ?? item.id;
    const existing = groups.find((group) => group.key === key);
    if (existing) existing.recipes.push(item);
    else groups.push({ key, title: item.familyTitle ?? item.title, recipes: [item] });
    return groups;
  }, []);
}

type GroceryRow = { id: string; name: string; count: number | null; grams: number | null; inStock: boolean };
type ShoppingRow = { id: string; name: string; grams: number };

export default function RecipesBoard({ recipes, category, recipeId }: { recipes: Recipe[]; category: string | null; recipeId: string | null }) {
  const router = useRouter();
  const [groceries, setGroceries] = useState<GroceryRow[] | null>(null);
  const [shopping, setShopping] = useState<ShoppingRow[] | null>(null);
  const [groceryQuery, setGroceryQuery] = useState("");
  const [groceryError, setGroceryError] = useState("");
  const [savingGrocery, setSavingGrocery] = useState<string | null>(null);
  const [shopMessage, setShopMessage] = useState("");
  const [shoppingBusy, setShoppingBusy] = useState(false);
  useEffect(() => { setShopMessage(""); }, [recipeId]);

  function go(nextCategory: string | null, nextRecipe: string | null) {
    const params = new URLSearchParams();
    if (nextCategory) params.set("category", nextCategory);
    if (nextRecipe) params.set("recipe", nextRecipe);
    const query = params.toString();
    router.push(query ? `/admin/recipes?${query}` : "/admin/recipes");
  }

  async function updateGrocery(id: string, field: "count" | "grams", value: string) {
    if (value.trim() === "") return;
    setGroceryError("");
    setSavingGrocery(id);
    try {
      const response = await fetch("/api/admin/groceries", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, field, value: Number(value) }) });
      if (!response.ok) throw new Error("Could not save. Enter a non-negative number and try again.");
      const updated = await response.json();
      setGroceries(current => current?.map(row => row.id === id ? { ...row, ...updated, inStock: (updated.count ?? 0) > 0 || (updated.grams ?? 0) > 0 } : row) ?? null);
      router.refresh();
    } catch (error) { setGroceryError(error instanceof Error ? error.message : "Could not save groceries."); }
    finally { setSavingGrocery(null); }
  }

  async function openPantry() {
    setGroceryQuery("");
    setGroceryError("");
    setGroceries(null);
    setShopping(null);
    try {
      const [groceryResponse, shoppingResponse] = await Promise.all([
        fetch("/api/admin/groceries"),
        fetch("/api/admin/shopping"),
      ]);
      if (!groceryResponse.ok || !shoppingResponse.ok) throw new Error("Could not load groceries.");
      setGroceries(await groceryResponse.json());
      setShopping(await shoppingResponse.json());
    } catch (error) {
      setGroceries([]);
      setShopping([]);
      setGroceryError(error instanceof Error ? error.message : "Could not load groceries.");
    }
  }

  async function addMissing(recipe: Recipe) {
    setShopMessage("");
    setShoppingBusy(true);
    try {
      const response = await fetch("/api/admin/shopping", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add-recipe", recipeId: recipe.id }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not update the shopping list.");
      setShopMessage(result.added ? "Missing ingredients are on the shopping list." : "Nothing new to buy for this recipe.");
    } catch (error) { setShopMessage(error instanceof Error ? error.message : "Could not update the shopping list."); }
    finally { setShoppingBusy(false); }
  }

  async function purchaseShopping() {
    setGroceryError("");
    setShoppingBusy(true);
    try {
      const response = await fetch("/api/admin/shopping", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "purchase" }) });
      if (!response.ok) throw new Error("Could not move those items into groceries.");
      const [groceryResponse, shoppingResponse] = await Promise.all([fetch("/api/admin/groceries"), fetch("/api/admin/shopping")]);
      setGroceries(await groceryResponse.json());
      setShopping(await shoppingResponse.json());
      router.refresh();
    } catch (error) { setGroceryError(error instanceof Error ? error.message : "Could not move those items into groceries."); }
    finally { setShoppingBusy(false); }
  }

  async function removeShopping(id: string) {
    setShoppingBusy(true);
    try {
      await fetch(`/api/admin/shopping?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setShopping(current => current?.filter(item => item.id !== id) ?? null);
    } finally { setShoppingBusy(false); }
  }

  const knownCategory = recipeCategories.find(item => item.id === category) ?? null;
  const selected = recipes.find(item => item.id === recipeId) ?? null;
  const activeCategory = knownCategory ?? (selected ? recipeCategories.find(item => item.match(selected)) ?? null : null);
  const categoryRecipes = activeCategory ? recipes.filter(item => activeCategory.match(item)) : recipes;
  const families = familiesOf(selected ? categoryRecipes : []);
  const selectedFamilyKey = selected?.familyKey ?? selected?.id;
  const selectedFamily = families.find(family => family.key === selectedFamilyKey);
  const groceryNeedle = groceryQuery.trim().toLowerCase();
  const visibleGroceries = (groceries ?? []).filter(item => groceryNeedle ? item.name.toLowerCase().includes(groceryNeedle) : item.inStock)
    .sort((a, b) => Number(b.inStock) - Number(a.inStock) || a.name.localeCompare(b.name));
  const stockedGroceries = (groceries ?? []).filter(item => item.inStock).length;
  const shorts = selected?.ingredients.filter(isShort) ?? [];
  const picker = !selected && activeCategory ? familiesOf(categoryRecipes) : [];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          {selected || activeCategory ? <button type="button" className={styles.backButton} onClick={() => go(selected ? activeCategory?.id ?? null : null, null)}>Back</button> : <p className={styles.eyebrow}><span />Kitchen</p>}
          <h1>{activeCategory ? activeCategory.title : <>What to <span>cook</span></>}</h1>
          <p className={styles.subtitle}>{selected ? "The full recipe, with what you already have." : activeCategory ? activeCategory.detail : "Choose a kind of meal, then open the recipe."}</p>
        </div>
        <div className={styles.headerActions}><button className={styles.groceryButton} onClick={() => void openPantry()}>Groceries</button></div>
      </header>

      {!selected && !activeCategory && <div className={styles.categories} aria-label="Recipe categories">
        {recipeCategories.map(item => {
          const count = recipes.filter(recipe => item.match(recipe)).length;
          return <button key={item.id} type="button" onClick={() => go(item.id, null)}>
            <strong>{item.title}</strong>
            <span>{item.detail}</span>
            <em>{count} {count === 1 ? "recipe" : "recipes"}</em>
          </button>;
        })}
      </div>}

      {!selected && activeCategory && <div className={styles.categories} aria-label={`${activeCategory.title} recipes`}>
        {picker.map(family => {
          const item = family.recipes[0];
          return <button key={family.key} type="button" onClick={() => go(activeCategory.id, item.id)}>
            <strong>{family.title}</strong>
            <span>{family.recipes.length > 1 ? `${family.recipes.length} versions` : `${minutes(item.prepMinutes + item.cookMinutes)}${item.servings === null ? "" : ` · serves ${item.servings}`}`}</span>
          </button>;
        })}
        {!picker.length && <p className={styles.groceryEmpty}>No recipes in this category yet.</p>}
      </div>}

      {selected && <div className={styles.layout}>
        <nav className={styles.list} aria-label="Recipes">
          {families.map(family => {
            const item = family.recipes[0];
            return <button key={family.key} type="button" aria-current={family.key === selectedFamilyKey} onClick={() => go(activeCategory?.id ?? null, item.id)}>
              <strong>{family.title}</strong>
              <span>{family.recipes.length > 1 ? `${family.recipes.length} versions` : `${minutes(item.prepMinutes + item.cookMinutes)}${item.servings === null ? "" : ` · serves ${item.servings}`}`}</span>
            </button>;
          })}
        </nav>
        <article className={styles.sheet}>
          <div className={styles.titleRow}>
            <h2>{selected.title}</h2>
            {selectedFamily && selectedFamily.recipes.length > 1 ? (
              <div className={styles.variants} aria-label={`${selectedFamily.title} version`}>
                {selectedFamily.recipes.map(variant => (
                  <button key={variant.id} type="button" aria-pressed={variant.id === selected.id} onClick={() => go(activeCategory?.id ?? null, variant.id)}>
                    {variant.variantLabel ?? variant.title}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <p className={styles.summary}>{selected.summary}</p>
          <ul className={styles.tags}>{selected.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
          <dl className={styles.stats}>
            <div><dt>Prep</dt><dd>{minutes(selected.prepMinutes)}</dd></div>
            <div><dt>Cook</dt><dd>{minutes(selected.cookMinutes)}</dd></div>
            {selected.servings !== null && <div><dt>Serves</dt><dd>{selected.servings}</dd></div>}
          </dl>
          <div className={styles.columns}>
            <section className={styles.block}>
              <h3>Ingredients</h3>
              <ul className={styles.ingredients}>
                {selected.ingredients.map(item => (
                  <li key={item.id} className={isShort(item) ? styles.short : undefined}>
                    <b>{measure(item) || "—"}</b>
                    <span>
                      {item.name}
                      {item.optional ? <em className={styles.optional}> optional</em> : null}
                      {item.note ? <em className={styles.note}> {item.note}</em> : null}
                      {item.needGrams != null && <em className={styles.onHand}>{formatGrams(item.haveGrams ?? 0)} g on hand</em>}
                    </span>
                  </li>
                ))}
              </ul>
              {shorts.length > 0 && <button type="button" className={styles.groceryButton} disabled={shoppingBusy} onClick={() => void addMissing(selected)}>Add missing to shopping list</button>}
              {shopMessage && <p className={styles.shopMessage} role="status">{shopMessage}</p>}
            </section>
            <section className={styles.block}>
              <h3>Method</h3>
              <ol className={styles.steps}>{selected.steps.map(step => <li key={step.id}>{step.text}</li>)}</ol>
            </section>
          </div>
          {selected.notes ? <p className={styles.notes}><strong>Notes</strong>{selected.notes}</p> : null}
          {selected.nutrition ? <section className={styles.nutrition}>
            <div><p>Estimated nutrition</p><span>{selected.nutrition.basis}</span></div>
            <dl>{selected.nutrition.values.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value === null ? "—" : `${item.value} ${item.unit}`}</dd></div>)}</dl>
          </section> : null}
        </article>
      </div>}

      {groceries !== null && shopping !== null && <div className={styles.groceryBackdrop} onClick={() => setGroceries(null)}><section className={styles.groceryDialog} role="dialog" aria-modal="true" aria-label="Groceries and shopping" onClick={event => event.stopPropagation()}>
        <button onClick={() => setGroceries(null)}>Close</button>
        <div className={styles.pantryColumns}>
          <div>
            <h2>Groceries</h2>
            <span className={styles.groceryCount}>{groceryNeedle ? `${visibleGroceries.length} matching` : `${stockedGroceries} items in stock`} · Count and grams stay linked when a weight is known.</span>
            <input className={styles.grocerySearch} aria-label="Find a grocery" placeholder="Find a grocery, including empty ones…" value={groceryQuery} onChange={event => setGroceryQuery(event.target.value)} />
            {groceryError && <div role="alert">{groceryError}</div>}
            {visibleGroceries.map(item => <p key={item.id}><strong>{item.name}</strong>{(["count", "grams"] as const).map(field => <label key={`${field}-${item[field]}`}>{field === "count" ? "Count" : "Grams"}<input type="number" min="0" step="any" disabled={savingGrocery !== null} aria-label={`${item.name} ${field}`} defaultValue={item[field] ?? ""} placeholder="Unknown" onBlur={event => { if (event.target.value !== String(item[field] ?? "")) void updateGrocery(item.id, field, event.target.value); }} /></label>)}<button disabled={savingGrocery !== null} className={styles.clearGrocery} aria-label={`Set ${item.name} to zero`} onClick={() => void updateGrocery(item.id, "count", "0")}>×</button></p>)}
            {groceryNeedle && !visibleGroceries.length && <p className={styles.groceryEmpty}>No groceries match that search.</p>}
          </div>
          <div className={styles.shopPane}>
            <h2>Shopping</h2>
            <span className={styles.groceryCount}>Amounts are rounded up to a pack when one is known.</span>
            <ul>
              {shopping.map(item => <li key={item.id}><strong>{item.name}</strong><span>{formatGrams(item.grams)} g</span><button type="button" disabled={shoppingBusy} aria-label={`Remove ${item.name} from the shopping list`} onClick={() => void removeShopping(item.id)}>×</button></li>)}
            </ul>
            {!shopping.length && <p className={styles.groceryEmpty}>Nothing to buy.</p>}
            <button type="button" className={styles.purchaseButton} disabled={shoppingBusy || !shopping.length} onClick={() => void purchaseShopping()}>Purchase</button>
          </div>
        </div>
      </section></div>}
    </div>
  );
}
