"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Plus, X, Utensils } from "lucide-react";
import styles from "./health.module.css";
import { readMealDrafts, mealNutrition, type Meals } from '@/lib/meal-portions';
import { mealSlots as slots, mainMealSlots, snackSlots, mealSlotLabels, type MealSlot } from '@/lib/meal-slots';

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
type TargetGroup = "Training fuel" | "Recovery & resilience" | "Vitamins & foundations" | "Fats & limits";
type Target = { key: string; label: string; unit: string; daily: number; direction?: "max" | "range"; suggestion: string; group: TargetGroup; why: string };
// Personal starting targets: male, 27, 190 cm, 73 kg and lifting for muscle gain.
// Protein is 1.6 g/kg. Energy is deliberately a starting estimate, not a prescription.
const macros: Target[] = [
  { key: "calories", label: "Energy", unit: "kcal", daily: 2450, direction: "range", group: "Training fuel", why: "Calories are the energy your body uses for training, everyday movement, recovery and basic functions. This is a modest muscle-gain starting target for a mostly sedentary routine: enough to support training and recovery without treating rapid weight gain as the goal.", suggestion: "Add an energy-dense snack or a larger carb portion." },
  { key: "proteinGrams", label: "Protein", unit: "g", daily: 117, group: "Training fuel", why: "Protein supplies amino acids to repair and build muscle after resistance training. Spread it across your meals so each meal contributes meaningfully to recovery and muscle growth.", suggestion: "Prioritise a protein-rich main: tofu, skyr, eggs, fish, chicken, lentils or beans." },
  { key: "carbsGrams", label: "Carbs", unit: "g", daily: 340, group: "Training fuel", why: "Carbohydrates replenish muscle glycogen, the readily available fuel used during hard lifting and many daily activities. Adequate carbs can support training quality, mood and recovery while you are building muscle.", suggestion: "Add oats, potatoes, rice, whole-grain pasta, fruit or legumes for training fuel." },
  { key: "fatGrams", label: "Fat", unit: "g", daily: 70, group: "Fats & limits", why: "Dietary fat is needed for cell membranes, hormone production and absorption of fat-soluble vitamins A, D, E and K. Favour unsaturated sources most often, rather than simply aiming for the highest possible number.", suggestion: "Add nuts, seeds, olive oil, avocado or oily fish." },
];
const nutrients: Target[] = [
  { key: "fibreGrams", label: "Fibre", unit: "g", daily: 30, group: "Recovery & resilience", why: "Fibre feeds beneficial gut microbes and helps food move through the digestive system. High-fibre foods also tend to be filling and nutrient-dense, which can support steadier energy, cholesterol management and easier appetite control during a cut.", suggestion: "Add beans, lentils, vegetables, berries or whole grains." },
  { key: "saturatedFatGrams", label: "Saturated fat", unit: "g", daily: 27, direction: "max", group: "Fats & limits", why: "Saturated fat is not something you need to eliminate, but high habitual intakes can raise LDL cholesterol in many people. This guide helps leave room for more unsaturated fats from plants, nuts, seeds and fish.", suggestion: "Favour olive oil, nuts and fish over butter, fatty meats and coconut fat." },
  { key: "sodiumMg", label: "Sodium", unit: "mg", daily: 1500, direction: "max", group: "Fats & limits", why: "Sodium is essential for fluid balance, nerve signals and muscle contraction, and needs can rise with substantial sweat loss. Most diets already provide plenty, however, and persistently high intake can raise blood pressure—so this is a guide rather than a target to chase.", suggestion: "Use less salty sauces and processed foods; taste before adding salt." },
  { key: "potassiumMg", label: "Potassium", unit: "mg", daily: 4000, group: "Recovery & resilience", why: "Potassium works alongside sodium to regulate fluid balance, nerve signalling and muscle contraction. A food pattern rich in potassium—fruit, vegetables, beans and potatoes—is also associated with healthier blood pressure.", suggestion: "Add potatoes, beans, leafy greens, tomatoes, yoghurt, fruit or nuts." },
  { key: "calciumMg", label: "Calcium", unit: "mg", daily: 1000, group: "Vitamins & foundations", why: "Calcium is the main mineral in bone and teeth, but it also helps muscles contract and nerves communicate. Meeting the target consistently matters more than isolated high-intake days, particularly when building a long-term training habit.", suggestion: "Add dairy or calcium-fortified plant milk, tofu, kale or sesame." },
  { key: "magnesiumMg", label: "Magnesium", unit: "mg", daily: 350, group: "Recovery & resilience", why: "Magnesium participates in hundreds of reactions, including energy metabolism, muscle and nerve function and normal psychological function. It is abundant in many minimally processed plant foods, so a low score can be a useful signal to broaden those foods.", suggestion: "Add pumpkin seeds, nuts, beans, oats, whole grains or dark leafy greens." },
  { key: "ironMg", label: "Iron", unit: "mg", daily: 10, group: "Recovery & resilience", why: "Iron is part of haemoglobin, which carries oxygen around the body, and it supports energy production. Low iron status can contribute to fatigue and impaired endurance, but an intake estimate cannot diagnose it—only appropriate clinical testing can.", suggestion: "Add lentils, beans, tofu, beef, shellfish or pumpkin seeds with vitamin-C-rich produce." },
  { key: "zincMg", label: "Zinc", unit: "mg", daily: 11, group: "Vitamins & foundations", why: "Zinc supports immune function, wound healing, protein synthesis and normal reproductive hormone metabolism. Plant sources count too, although absorption can be lower in some high-phytate diets, so dietary pattern matters as well as the total.", suggestion: "Add beef, cheese, eggs, beans, oats, pumpkin seeds or cashews." },
  { key: "vitaminDMcg", label: "Vitamin D", unit: "µg", daily: 20, group: "Vitamins & foundations", why: "Vitamin D helps the body absorb calcium and supports bone health, muscle function and immunity. Food alone often contributes little; this target applies when vitamin-D production from sunlight is insufficient, and blood testing is the right way to investigate a possible deficiency.", suggestion: "Add oily fish or fortified foods; consider a blood test and clinician advice if intake/sun exposure is low." },
  { key: "vitaminB12McG", label: "Vitamin B12", unit: "µg", daily: 4, group: "Vitamins & foundations", why: "Vitamin B12 is required for red blood cell formation, normal nerve function and energy metabolism. It naturally occurs mainly in animal foods, so people who eat little or no animal food need reliably fortified foods or a clinician-guided supplement plan.", suggestion: "Add fish, eggs, dairy, meat or reliably fortified foods." },
  { key: "folateMcg", label: "Folate", unit: "µg", daily: 300, group: "Vitamins & foundations", why: "Folate supports cell division, normal blood formation and energy metabolism. It is especially plentiful in legumes and leafy vegetables, which makes it a useful marker of whether the plan contains enough varied plant foods.", suggestion: "Add lentils, chickpeas, spinach, leafy greens, asparagus or oranges." },
  { key: "iodineMcg", label: "Iodine", unit: "µg", daily: 200, group: "Vitamins & foundations", why: "Iodine is needed to produce thyroid hormones, which regulate metabolism, body temperature and energy use. Intake varies widely with use of iodised salt and seafood/dairy intake; seaweed can contain very large amounts, so it is best used thoughtfully rather than freely.", suggestion: "Use iodised salt and include dairy, eggs, fish or seaweed in measured amounts." },
  { key: "omega3AlAGrams", label: "Omega-3 ALA", unit: "g", daily: 1.3, group: "Fats & limits", why: "ALA is an essential plant omega-3, meaning the body cannot make it itself. It is concentrated in flax, chia and walnuts; conversion to the longer-chain EPA and DHA forms is limited, which is why both omega-3 cards are shown separately.", suggestion: "Add ground flax, chia, walnuts or rapeseed oil." },
  { key: "omega3EpaDhaMg", label: "Omega-3 EPA/DHA", unit: "mg", daily: 250, group: "Fats & limits", why: "EPA and DHA are marine or algae-derived omega-3 fats. They support normal heart function and form part of brain and eye tissue; oily fish or an algae-based option is the most reliable way to obtain them directly.", suggestion: "Add salmon, sardines, mackerel or an algae-based EPA/DHA option." },
];
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
function atNoon(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
}
function addDays(d: Date, amount: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + amount, 12);
}

export default function HealthPlanner({ recipes }: { recipes: PlannerRecipe[] }) {
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [meals, setMeals] = useState<Meals>({});
  const [active, setActive] = useState<string | null>(null);
  const [picker, setPicker] = useState<{ date: string; slot: MealSlot } | null>(null);
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
  const days = useMemo(() => rangeStart ? Array.from({ length: 7 }, (_, index) => addDays(rangeStart, index)) : [], [rangeStart]);
  const firstDay = days.length ? dayKey(days[0]) : null;
  const lastDay = days.length ? dayKey(days[6]) : null;
  useEffect(() => {
    setRangeStart(atNoon(new Date()));
  }, []);
  useEffect(() => {
    if (!firstDay || !lastDay) return;
    setActive(firstDay);
    const controller = new AbortController();
    (async () => {
      try {
        let rows: ServerSlot[] = await loadPlans(firstDay, lastDay, controller.signal);
        if (!rows.length) {
          const migrated = await migrateLocalDrafts(firstDay, lastDay, controller.signal);
          if (migrated) rows = await loadPlans(firstDay, lastDay, controller.signal);
        }
        if (!controller.signal.aborted) setMeals(mealsFromSlots(rows));
      } catch { if (!controller.signal.aborted) setPlanError("Could not load your plan. Reload to try again."); }
    })();
    return () => controller.abort();
  }, [firstDay, lastDay]);
  useEffect(() => {
    if (!rangeStart) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (pickerOpen || event.altKey || event.ctrlKey || event.metaKey || target?.matches("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        setRangeStart(current => current ? addDays(current, event.key === "ArrowLeft" ? -1 : 1) : current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [rangeStart, pickerOpen]);
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
  function selected(date: string, selectedSlots: readonly MealSlot[] = slots) {
    return selectedSlots.flatMap(slot => {
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
  const plannedDailyMeals = active ? selected(active) : [];
  const weeklyMainCount = days.reduce((total, day) => total + selected(dayKey(day), mainMealSlots).length, 0);
  const weeklySnackCount = days.reduce((total, day) => total + selected(dayKey(day), snackSlots).length, 0);
  // A day counts only when both main meals are chosen. Open days stay out of the score.
  const filledDays = days.filter(day => mainMealSlots.every(slot => meals[dayKey(day) + ":" + slot]?.recipeId));
  const scoredMeals = filledDays.flatMap(day => [dailyBreakfast, ...selected(dayKey(day))]);
  const dailyMeals = active ? [dailyBreakfast, ...plannedDailyMeals] : [];
  const activeDay = days.find(d => dayKey(d) === active);
  const weeklyTarget = (target: Target) => target.daily * filledDays.length;
  function nutrientState(target: Target, total: { value: number; known: number }, mealsCount: number) {
    if (!filledDays.length || !total.known) return "unknown";
    if (total.known < mealsCount) return "partial";
    const ratio = total.value / weeklyTarget(target);
    if (target.direction === "max") return ratio > 1 ? "high" : "onTrack";
    if (target.direction === "range") return ratio < .85 ? "focus" : ratio > 1.1 ? "high" : "onTrack";
    return ratio < .5 ? "urgent" : ratio < .8 ? "focus" : ratio > 1.5 ? "high" : "onTrack";
  }
  const scorecards = [...macros, ...nutrients].map(target => {
    const total = sum(scoredMeals, target.key);
    return { target, total, state: nutrientState(target, total, scoredMeals.length) };
  });
  const scorecardGroups = (["Training fuel", "Recovery & resilience", "Vitamins & foundations", "Fats & limits"] as TargetGroup[])
    .map(group => ({ group, cards: scorecards.filter(card => card.target.group === group) }));
  const focusKeys = new Set(["calories", "proteinGrams", "carbsGrams", "fatGrams", "fibreGrams", "saturatedFatGrams"]);
  const focusScorecards = scorecards.filter(card => focusKeys.has(card.target.key));
  const foundationGroups = scorecardGroups.map(({ group, cards }) => ({ group, cards: cards.filter(card => !focusKeys.has(card.target.key)) })).filter(({ cards }) => cards.length);
  const priorities = focusScorecards.filter(card => card.state === "urgent" || card.state === "focus" || card.state === "high");
  function renderScorecard({ target, total, state }: typeof scorecards[number]) {
    const targetAmount = weeklyTarget(target);
    const amount = filledDays.length && total.known ? total.value : null;
    const progress = amount == null || targetAmount === 0 ? 0 : Math.min(100, amount / targetAmount * 100);
    const dayLabel = `${filledDays.length} ${filledDays.length === 1 ? "day" : "days"}`;
    const label = state === "unknown" ? "Not tracked yet" : state === "partial" ? `Partial estimate · ${total.known}/${scoredMeals.length} meals` : target.direction === "max" ? (state === "high" ? "Above guide" : "Within guide") : state === "urgent" ? "High priority" : state === "focus" ? "Needs focus" : state === "high" ? "Above target" : "On track";
    return <article key={target.key} className={styles.scorecard} data-status={state}><div className={styles.scorecardTop}><span className={styles.nutrientName} tabIndex={0}>{target.label}<span className={styles.infoMark} aria-hidden="true">i</span><span role="tooltip" className={styles.tooltip}><strong>Why it matters</strong>{target.why}</span></span><b>{label}</b></div><p><strong>{amount == null ? "—" : format(amount)}</strong><small> / {filledDays.length ? `${format(targetAmount)} ${target.unit} for ${dayLabel}` : `choose lunch and dinner`}</small></p><div className={styles.meter}><i style={{ width: progress + "%" }} /></div><small>{amount == null ? "A day counts once lunch and dinner are both chosen." : `${format(amount / filledDays.length)} ${target.unit} / day · ${target.direction === "max" ? "guide for the planned days" : `${format(Math.max(0, targetAmount - amount))} ${target.unit} remaining`}`}</small></article>;
  }
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
      <div><p className={styles.eyebrow}>YOUR SEVEN-DAY FOOD LOG</p><h1>A little planning.<br /><span>A well-fed week.</span></h1></div>
      <div className={styles.weekInfo}><strong>{weeklyMainCount}<span> / 14 meals · {weeklySnackCount} snacks</span></strong><p>{days.length ? days[0].toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " – " + days[6].toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Loading week…"}</p></div>
    </header>
    <section className={styles.calendar} aria-label="Seven-day meal planner">
      {days.map((date, i) => {
        const key = dayKey(date);
        return <article key={key} className={styles.dayCard} data-active={active === key}>
          <button className={styles.dayHeading} aria-expanded={active === key} aria-controls="daily-nutrition" onClick={() => setActive(active === key ? null : key)}>
            <span>{dayKey(date) === dayKey(new Date()) ? "Today" : date.toLocaleDateString(undefined, { weekday: "short" })}</span>
            <strong>{date.getDate()}<ChevronDown size={14} /></strong>
          </button>
          {slots.map(slot => {
            const isSnack = slot === 'snack-1' || slot === 'snack-2';
            const mealKey = key + ':' + slot;
            const meal = meals[mealKey];
            const recipe = recipes.find(r => r.id === meal?.recipeId);
            const addon = recipes.find(r => r.id === meal?.addonRecipeId && r.isAddon);
            return <button key={slot} className={`${styles.mealSlot} ${isSnack ? styles.snackSlot : ''}`} data-filled={!!recipe} aria-label={`Choose ${mealSlotLabels[slot]} for ${date.toLocaleDateString()}`} onClick={() => { setActive(key); setQuery(""); setPlanError(""); setPortions({}); setChosenAddons({}); setAddonPicker(null); setAvailability({}); setCheckingStock(true); setPicker({ date: key, slot }); }}>
              {isSnack && !recipe ? <><Plus size={13} /><small>{mealSlotLabels[slot]}</small></> : <><small>{mealSlotLabels[slot]}</small><span>{recipe?.title ?? "Choose meal"}</span>{!recipe && <Plus size={14} />}</>}
              {recipe && addon && <span className={styles.dayAddon}>+ {addon.title}</span>}
            </button>;
          })}
        </article>;
      })}
    </section>
    <p className={styles.helper}>Use Left and Right Arrow to browse days · Nutrition updates for the displayed seven-day window · Planned meals hold their ingredients until you cook</p>
    {planError && !pickerOpen && <p role="alert">{planError}</p>}
    {activeDay && <section id="daily-nutrition" className={styles.daily}>
      <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>{activeDay.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</p><h2>Your daily essentials</h2></div><span>{selected(active!, mainMealSlots).length} of 2 meals · {selected(active!, snackSlots).length} of 2 snacks</span></div>
      <div className={styles.macroGrid}>{macros.map(m => {
        const total = sum(dailyMeals, m.key);
        return <div key={m.key} className={styles.macro}>
          <span>{m.label}</span><p><strong>{total.known ? format(total.value) : "—"}</strong><small> / {format(m.daily)} {m.unit}</small></p>
          <div className={styles.meter}><i style={{ width: Math.min(100, total.value / m.daily * 100) + "%" }} /></div>
          <small>{total.known < dailyMeals.length ? "Estimate incomplete" : total.known ? `${format(Math.max(0, m.daily - total.value))} ${m.unit} to target` : "Choose meals to see progress"}</small>
        </div>;
      })}</div>
    </section>}
    <section className={styles.weekly}>
      <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>THE BIGGER PICTURE</p><h2>Your seven-day nutrition scorecard</h2></div><span>{filledDays.length} {filledDays.length === 1 ? "day" : "days"} with lunch and dinner</span></div>
      <p className={styles.weekIntro}>Targets follow only the days where lunch and dinner are both chosen. An open day stays out of the score. Start with calories and protein. Carbs, fat and fibre help you train, recover and eat well; saturated fat is a useful limit. Red needs attention first; amber is getting close; green is on track; purple is above the useful range. Grey means the nutrition estimate is missing—not zero.</p>
      {priorities.length > 0 && <section className={styles.priorities} aria-label="Recipe ideas for nutrition gaps"><div><p className={styles.eyebrow}>RECIPE SHORTLIST</p><h3>Focus your next recipes here</h3></div><div>{priorities.slice(0, 4).map(({ target, state }) => <p key={target.key} data-status={state}><strong>{target.label}</strong><span>{state === "high" ? "Ease back: " : "Add: "}{target.suggestion}</span></p>)}</div></section>}
      <section className={styles.scorecardGroup}><h3>Focus now</h3><div className={styles.scorecards}>{focusScorecards.map(renderScorecard)}</div></section>
      <details className={styles.nutritionDetails}><summary>Foundations & micronutrients</summary><p>Check these across the week, not as daily perfection targets. Recipe estimates can be less reliable for vitamins and minerals.</p><div className={styles.scorecardGroups}>{foundationGroups.map(({ group, cards }) => <section key={group} className={styles.scorecardGroup}><h3>{group}</h3><div className={styles.scorecards}>{cards.map(renderScorecard)}</div></section>)}</div></details>
      <p className={styles.footnote}>Starting profile: 27-year-old male, 190 cm, 73 kg, lifting for muscle gain. Energy is a starting estimate; adjust it using your weight trend, training performance, hunger and recovery. Nutrition estimates cannot diagnose deficiencies—especially vitamin D, iron and B12—so discuss symptoms or supplements with a clinician.</p>
    </section>
    <dialog ref={dialog} className={styles.picker} onCancel={() => setPicker(null)} onClick={event => { if (event.target === event.currentTarget) setPicker(null); }}>
      <div className={styles.pickerBody}>
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>CHOOSE YOUR DISH</p><h2>Choose {picker ? mealSlotLabels[picker.slot] : ''}</h2></div><button className={styles.close} aria-label="Close meal picker" onClick={() => setPicker(null)}><X size={20} /></button></div>
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
