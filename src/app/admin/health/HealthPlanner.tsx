"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus, X, Utensils } from "lucide-react";
import styles from "./health.module.css";
import { readMealDrafts, mealNutrition, type Meals } from '@/lib/meal-portions';

export type PlannerRecipe = {
  id: string;
  title: string;
  portionable: boolean;
  isAddon: boolean;
  familyKey: string | null;
  familyTitle: string | null;
  variantLabel: string | null;
  nutrition: Record<string, number | null>;
};
const macros = [
  { key: "calories", label: "Energy", unit: "kcal", target: 2300 },
  { key: "proteinGrams", label: "Protein", unit: "g", target: 135 },
  { key: "carbsGrams", label: "Carbs", unit: "g", target: 290 },
  { key: "fatGrams", label: "Fat", unit: "g", target: 70 },
];
const nutrients = [
  ["fibreGrams", "Fibre", "g"], ["saturatedFatGrams", "Saturated fat", "g"],
  ["sugarGrams", "Sugar", "g"], ["sodiumMg", "Sodium", "mg"],
  ["potassiumMg", "Potassium", "mg"], ["calciumMg", "Calcium", "mg"],
  ["magnesiumMg", "Magnesium", "mg"], ["ironMg", "Iron", "mg"],
  ["zincMg", "Zinc", "mg"], ["vitaminDMcg", "Vitamin D", "µg"],
  ["vitaminB12McG", "Vitamin B12", "µg"], ["folateMcg", "Folate", "µg"],
  ["iodineMcg", "Iodine", "µg"], ["omega3AlAGrams", "Omega-3 ALA", "g"],
  ["omega3EpaDhaMg", "Omega-3 EPA/DHA", "mg"],
];
const slots = ["lunch", "dinner"] as const;
const format = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 1 });
// Plans used to live only in this browser; anything still there is pushed to the server once, then removed.
const legacyStorageKey = "health-meal-drafts-v1";
type ServerSlot = { plannedDate: string; mealSlot: string; recipeId: string; servings: number; addonRecipeId: string | null };
function mealsFromSlots(rows: ServerSlot[]): Meals {
  return Object.fromEntries(rows.map(row => [row.plannedDate + ':' + row.mealSlot, { recipeId: row.recipeId, servings: row.servings, ...(row.addonRecipeId ? { addonRecipeId: row.addonRecipeId } : {}) }]));
}
const dailyBreakfast: PlannerRecipe = {
  id: "daily-breakfast-clif-bar",
  title: "Peanut Butter Crunch Clif Bar",
  portionable: false,
  isAddon: false,
  familyKey: null,
  familyTitle: null,
  variantLabel: null,
  nutrition: {
    calories: 260,
    proteinGrams: 11,
    carbsGrams: 40,
    fatGrams: 7,
    fibreGrams: 4,
    sugarGrams: 17,
  },
};
function dayKey(d: Date) {
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
}

export default function HealthPlanner({ recipes }: { recipes: PlannerRecipe[] }) {
  const [days, setDays] = useState<Date[]>([]);
  const [meals, setMeals] = useState<Meals>({});
  const [active, setActive] = useState<string | null>(null);
  const [picker, setPicker] = useState<{ date: string; slot: string } | null>(null);
  const [portions, setPortions] = useState<Record<string, number>>({});
  const [availability, setAvailability] = useState<Record<string, number>>({});
  const [withAddons, setWithAddons] = useState<Record<string, Record<string, number>>>({});
  const [cooked, setCooked] = useState<Record<string, number>>({});
  const [chosenAddons, setChosenAddons] = useState<Record<string, string>>({});
  const [addonPicker, setAddonPicker] = useState<string | null>(null);
  const [checkingStock, setCheckingStock] = useState(false);
  const [stockError, setStockError] = useState(false);
  const [query, setQuery] = useState("");
  const [planError, setPlanError] = useState("");
  const [saving, setSaving] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const pickerOpen = picker !== null;
  const firstDay = days.length ? dayKey(days[0]) : null;
  useEffect(() => {
    const today = new Date();
    const next = Array.from({ length: 7 }, (_, i) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + i, 12));
    setDays(next);
    setActive(dayKey(next[0]));
    const from = dayKey(next[0]);
    const to = dayKey(next[6]);
    const controller = new AbortController();
    (async () => {
      try {
        let rows: ServerSlot[] = await loadPlans(from, to, controller.signal);
        if (!rows.length) {
          const migrated = await migrateLocalDrafts(from, to, controller.signal);
          if (migrated) rows = await loadPlans(from, to, controller.signal);
        }
        if (!controller.signal.aborted) setMeals(mealsFromSlots(rows));
      } catch { if (!controller.signal.aborted) setPlanError("Could not load your plan. Reload to try again."); }
    })();
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (pickerOpen) dialog.current?.showModal();
    else dialog.current?.close();
  }, [pickerOpen]);
  useEffect(() => {
    if (!pickerOpen || !firstDay) return;
    const controller = new AbortController();
    setCheckingStock(true);
    setStockError(false);
    fetch(`/api/admin/recipes/availability?from=${firstDay}`, { cache: 'no-store', signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Stock check failed'); return response.json(); })
      .then(data => { if (!controller.signal.aborted) { setAvailability(data.recipes); setWithAddons(data.withAddons); setCooked(data.cooked ?? {}); } })
      .catch(() => { if (!controller.signal.aborted) { setStockError(true); setAvailability({}); } })
      .finally(() => { if (!controller.signal.aborted) setCheckingStock(false); });
    return () => controller.abort();
  }, [pickerOpen, firstDay]);
  async function loadPlans(from: string, to: string, signal: AbortSignal): Promise<ServerSlot[]> {
    const response = await fetch(`/api/admin/meal-plan?from=${from}&to=${to}`, { cache: 'no-store', signal });
    if (!response.ok) throw new Error('Could not load plan');
    return response.json();
  }
  async function migrateLocalDrafts(from: string, to: string, signal: AbortSignal) {
    let drafts: Meals = {};
    try { drafts = readMealDrafts(JSON.parse(localStorage.getItem(legacyStorageKey) ?? "null")); } catch { /* nothing to migrate */ }
    const entries = Object.entries(drafts).filter(([key]) => { const date = key.split(':')[0]; return date >= from && date <= to; });
    for (const [key, meal] of entries) {
      const [plannedDate, mealSlot] = key.split(':');
      // Drafts that no longer fit the stock are dropped; the server is the source of truth from here on.
      await fetch('/api/admin/meal-plan', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, signal, body: JSON.stringify({ plannedDate, mealSlot, recipeId: meal.recipeId, servings: meal.servings, addonRecipeId: meal.addonRecipeId ?? null, from }) }).catch(() => null);
    }
    try { localStorage.removeItem(legacyStorageKey); } catch { /* ignore */ }
    return entries.length > 0;
  }
  async function choose(recipeId: string) {
    if (!picker || !firstDay || saving) return;
    const key = picker.date + ':' + picker.slot;
    const recipe = recipes.find(r => r.id === recipeId);
    const addonRecipeId = recipe ? chosenAddons[recipe.familyKey ?? recipe.id] : undefined;
    const servings = recipe?.portionable ? portions[recipe.familyKey ?? recipe.id] ?? 1 : 1;
    if (recipe && (recipe.isAddon || checkingStock || stockError || maxAvailable(recipe) < servings)) return;
    setPlanError("");
    setSaving(true);
    try {
      const response = recipe
        ? await fetch('/api/admin/meal-plan', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plannedDate: picker.date, mealSlot: picker.slot, recipeId, servings, addonRecipeId: addonRecipeId || null, from: firstDay }) })
        : await fetch(`/api/admin/meal-plan?date=${picker.date}&slot=${picker.slot}`, { method: 'DELETE' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? 'Could not save this meal.');
      const next = { ...meals };
      if (recipe) next[key] = { recipeId, servings, ...(addonRecipeId ? { addonRecipeId } : {}) };
      else delete next[key];
      setMeals(next);
      setPicker(null);
    } catch (error) {
      setPlanError(error instanceof Error ? error.message : 'Could not save this meal.');
    } finally { setSaving(false); }
  }
  function selected(date: string) {
    return slots.flatMap(slot => {
      const meal = meals[date + ':' + slot];
      const recipe = recipes.find(r => r.id === meal?.recipeId);
      const servings = recipe?.portionable ? meal.servings : 1;
      const addon = recipes.find(r => r.id === meal?.addonRecipeId && r.isAddon);
      return recipe ? [{ ...recipe, servings, nutrition: mealNutrition(recipe.nutrition, servings, addon?.nutrition) }] : [];
    });
  }
  function sum(items: PlannerRecipe[], key: string) {
    const known = items.filter(r => r.nutrition[key] != null);
    return { value: known.reduce((n, r) => n + (r.nutrition[key] ?? 0), 0), known: known.length };
  }
  const plannedWeekMeals = days.flatMap(d => selected(dayKey(d)));
  const plannedDailyMeals = active ? selected(active) : [];
  const weekMeals = [...days.map(() => dailyBreakfast), ...plannedWeekMeals];
  const dailyMeals = active ? [dailyBreakfast, ...plannedDailyMeals] : [];
  const activeDay = days.find(d => dayKey(d) === active);
  const knownNutrients = nutrients.filter(([key]) => sum(weekMeals, key).known > 0);
  function maxAvailable(recipe: PlannerRecipe) {
    const addonId = chosenAddons[recipe.familyKey ?? recipe.id];
    return addonId ? withAddons[recipe.id]?.[addonId] ?? 0 : availability[recipe.id] ?? 0;
  }
  const availableRecipes = checkingStock || stockError ? [] : recipes.filter(recipe => !recipe.isAddon && maxAvailable(recipe) >= (recipe.portionable ? portions[recipe.familyKey ?? recipe.id] ?? 1 : 1));
  const recipeFamilies = availableRecipes.reduce<{ key: string; title: string; recipes: PlannerRecipe[] }[]>((families, recipe) => {
    const key = recipe.familyKey ?? recipe.id;
    const family = families.find(item => item.key === key);
    if (family) family.recipes.push(recipe);
    else families.push({ key, title: recipe.familyTitle ?? recipe.title, recipes: [recipe] });
    return families;
  }, []);
  const matchingFamilies = recipeFamilies.filter(family => {
    const needle = query.trim().toLowerCase();
    return !needle || family.title.toLowerCase().includes(needle) || family.recipes.some(recipe => recipe.title.toLowerCase().includes(needle));
  });
  return <main className={styles.page}>
    <header className={styles.header}>
      <div><p className={styles.eyebrow}>YOUR NEXT SEVEN DAYS</p><h1>A little planning.<br /><span>A well-fed week.</span></h1></div>
      <div className={styles.weekInfo}><strong>{plannedWeekMeals.length}<span> / 14 meals</span></strong><p>{days.length ? days[0].toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " – " + days[6].toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Loading week…"}</p></div>
    </header>
    <section className={styles.calendar} aria-label="Seven-day meal planner">
      {days.map((date, i) => {
        const key = dayKey(date);
        return <article key={key} className={styles.dayCard} data-active={active === key}>
          <button className={styles.dayHeading} aria-expanded={active === key} aria-controls="daily-nutrition" onClick={() => setActive(active === key ? null : key)}>
            <span>{i === 0 ? "Today" : date.toLocaleDateString(undefined, { weekday: "short" })}</span>
            <strong>{date.getDate()}<ChevronDown size={14} /></strong>
          </button>
          {slots.map(slot => {
            const mealKey = key + ':' + slot;
            const meal = meals[mealKey];
            const recipe = recipes.find(r => r.id === meal?.recipeId);
            const addon = recipes.find(r => r.id === meal?.addonRecipeId && r.isAddon);
            return <button key={slot} className={styles.mealSlot} data-filled={!!recipe} aria-label={`Choose ${slot} for ${date.toLocaleDateString()}`} onClick={() => { setActive(key); setQuery(""); setPlanError(""); setPortions({}); setChosenAddons({}); setAddonPicker(null); setAvailability({}); setCheckingStock(true); setPicker({ date: key, slot }); }}>
              <small>{slot}</small><span>{recipe?.title ?? "Choose meal"}</span>{!recipe && <Plus size={14} />}
              {recipe && addon && <span className={styles.dayAddon}>+ {addon.title}</span>}
            </button>;
          })}
        </article>;
      })}
    </section>
    <p className={styles.helper}>Choose meals and servings in the picker · Nutrition updates automatically · Planned meals hold their ingredients until you cook</p>
    {planError && !pickerOpen && <p role="alert">{planError}</p>}
    {activeDay && <section id="daily-nutrition" className={styles.daily}>
      <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>{activeDay.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</p><h2>Your daily essentials</h2></div><span>{plannedDailyMeals.length} of 2 meals planned</span></div>
      <div className={styles.macroGrid}>{macros.map(m => {
        const total = sum(dailyMeals, m.key);
        return <div key={m.key} className={styles.macro}>
          <span>{m.label}</span><p><strong>{total.known ? format(total.value) : "—"}</strong><small> / {format(m.target)} {m.unit}</small></p>
          <div className={styles.meter}><i style={{ width: Math.min(100, total.value / m.target * 100) + "%" }} /></div>
          <small>{total.known < dailyMeals.length ? "Estimate incomplete" : total.known ? `${format(Math.max(0, m.target - total.value))} ${m.unit} to target` : "Choose meals to see progress"}</small>
        </div>;
      })}</div>
      <p className={styles.footnote}>Includes one Peanut Butter Crunch Clif Bar every day, plus planned lunch and dinner. Snacks and drinks also count toward your day.</p>
    </section>}
    <section className={styles.weekly}>
      <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>THE BIGGER PICTURE</p><h2>Nutrition across your week</h2></div><span>7 breakfasts · {format(plannedWeekMeals.reduce((total, meal) => total + meal.servings, 0))} planned servings</span></div>
      <div className={styles.weekTotals}>{macros.map(m => {
        const total = sum(weekMeals, m.key);
        return <div key={m.key}><span>{m.label}</span><strong>{total.known ? format(total.value) : "—"} <small>{m.unit}</small></strong><small>{total.known ? format(total.value / 7) + " " + m.unit + " / day on average" : "No estimate yet"}</small></div>;
      })}</div>
      <div className={styles.nutrientHeading}><h3>Fibre, vitamins & minerals</h3><span>Weekly total · daily average</span></div>
      {knownNutrients.length ? <div className={styles.nutrients}>{knownNutrients.map(([key, label, unit]) => {
        const total = sum(weekMeals, key);
        return <div key={key}><span>{label}<small>{total.known < weekMeals.length ? `Partial · ${total.known}/${weekMeals.length} meals estimated` : "Estimated"}</small></span><strong>{format(total.value)} {unit}<small>{format(total.value / 7)} {unit} / day</small></strong></div>;
      })}</div> : <div className={styles.empty}><Utensils size={22} /><p>Select meals to build your weekly nutrition picture.</p></div>}
      <p className={styles.footnote}>Only known estimates are included. Missing nutrient data is not zero. Weekly averages help reveal patterns; they are not a reason to take large occasional supplement doses.</p>
    </section>
    <dialog ref={dialog} className={styles.picker} onCancel={() => setPicker(null)} onClick={event => { if (event.target === event.currentTarget) setPicker(null); }}>
      <div className={styles.pickerBody}>
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>CHOOSE YOUR DISH</p><h2>Choose {picker?.slot}</h2></div><button className={styles.close} aria-label="Close meal picker" onClick={() => setPicker(null)}><X size={20} /></button></div>
        <input aria-label="Find a recipe" placeholder="Find a recipe…" value={query} onChange={e => setQuery(e.target.value)} />
        <div className={styles.recipeOptions}>{matchingFamilies.map(family => {
          const first = family.recipes[0];
          const amount = portions[family.key] ?? 1;
          const maxServings = Math.max(...family.recipes.map(maxAvailable));
          const inFridge = family.recipes.reduce((total, recipe) => total + (cooked[recipe.id] ?? 0), 0);
          const addon = recipes.find(recipe => recipe.id === chosenAddons[family.key] && recipe.isAddon);
          const preview = mealNutrition(first.nutrition, first.portionable ? amount : 1, addon?.nutrition);
          const addonOptions = recipes.filter(recipe => recipe.isAddon && family.recipes.some(main => (withAddons[main.id]?.[recipe.id] ?? 0) >= (main.portionable ? amount : 1)));
          return <div className={styles.recipeOption} key={family.key}>
            <button className={styles.recipeChoice} disabled={saving} onClick={() => choose(first.id)}>
              <strong>{family.title}</strong>
              <span>{family.recipes.length > 1 ? `${family.recipes.length} versions` : `${preview.calories != null ? format(preview.calories) + " kcal" : "Energy not estimated"} · ${preview.proteinGrams != null ? format(preview.proteinGrams) + " g protein" : "Protein not estimated"}`}</span>
              <span>{inFridge > 0 ? `${inFridge} in the fridge · ${maxServings} ${maxServings === 1 ? "serving" : "servings"} available` : `${maxServings} ${maxServings === 1 ? "serving" : "servings"} available`}</span>
              {addon && <span>+ {addon.title} · added once</span>}
            </button>
            {first.portionable && <div className={styles.portionStepper} role="group" aria-label={`${family.title} servings`}>
              <button type="button" aria-label={`Decrease ${family.title} servings`} disabled={amount <= 1} onClick={() => setPortions(current => ({ ...current, [family.key]: Math.max(1, (current[family.key] ?? 1) - 1) }))}>−</button>
              <output aria-live="polite" aria-label={`${family.title} serving amount`}>{amount}</output>
              <button type="button" aria-label={`Increase ${family.title} servings`} disabled={amount >= maxServings} onClick={() => setPortions(current => ({ ...current, [family.key]: Math.min(maxServings, (current[family.key] ?? 1) + 1) }))}>+</button>
            </div>}
            <button type="button" className={styles.addonButton} aria-label={`Choose add-on for ${family.title}`} aria-expanded={addonPicker === family.key} onClick={() => setAddonPicker(current => current === family.key ? null : family.key)}><Plus size={15} /><span>Add-on</span></button>
            {family.recipes.length > 1 && <div className={styles.recipeVariants} aria-label={`${family.title} version`}>
              {family.recipes.map(recipe => <button key={recipe.id} disabled={saving} onClick={() => choose(recipe.id)}>{recipe.variantLabel ?? recipe.title}</button>)}
            </div>}
            {addonPicker === family.key && <div className={styles.addonOptions} aria-label={`${family.title} add-ons`}>
              <button type="button" aria-pressed={!addon} onClick={() => { setChosenAddons(current => ({ ...current, [family.key]: '' })); setAddonPicker(null); }}>No add-on</button>
              {addonOptions.map(option => <button type="button" key={option.id} aria-pressed={addon?.id === option.id} onClick={() => { setChosenAddons(current => ({ ...current, [family.key]: option.id })); setAddonPicker(null); }}>{option.title}</button>)}
              {!addonOptions.length && <p>No add-ons available with this meal. Create add-ons on the Recipes page and stock their ingredients.</p>}
            </div>}
          </div>;
        })}</div>
        {checkingStock ? <p role="status">Checking groceries…</p> : stockError ? <p role="alert">Could not check groceries. Close and reopen the picker to try again.</p> : !matchingFamilies.length && <p>{query.trim() ? 'No available recipes match your search.' : 'Nothing is available: no cooked portions in the fridge and no recipe has all its ingredients in stock. Update your groceries to see meals here.'}</p>}
        {planError && <p role="alert">{planError}</p>}
        <button className={styles.remove} disabled={saving} onClick={() => choose('')}>{saving ? 'Saving…' : 'Leave this meal unplanned'}</button>
        <p className={styles.footnote}>Available servings are cooked portions in the fridge plus what your unexpired groceries can still make, minus meals already planned this week. Optional ingredients and unmeasured essentials do not block a meal. Cook a recipe on the Recipes page to move its ingredients into the fridge.</p>
      </div>
    </dialog>
  </main>;
}
