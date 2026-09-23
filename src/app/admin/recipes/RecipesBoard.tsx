"use client";

import { useState } from "react";
import { recipes, type Recipe } from "./recipes";
import styles from "./recipes.module.css";

function minutes(total: number) {
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}

function measure(item: Recipe["ingredients"][number]) {
  return [item.amount, item.unit].filter(Boolean).join(" ");
}

export default function RecipesBoard() {
  const [selectedId, setSelectedId] = useState(recipes[0]?.id ?? "");
  const recipe = recipes.find((item) => item.id === selectedId) ?? recipes[0];
  if (!recipe) return null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}><span />Kitchen</p>
          <h1>What to <span>cook</span></h1>
          <p className={styles.subtitle}>Meals written down so the next one is already decided.</p>
        </div>
        <p className={styles.count}>{recipes.length} recipes</p>
      </header>

      <div className={styles.layout}>
        <nav className={styles.list} aria-label="Recipes">
          {recipes.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={item.id === recipe.id}
              onClick={() => setSelectedId(item.id)}
            >
              <strong>{item.title}</strong>
              <span>{minutes(item.prepMinutes + item.cookMinutes)} · serves {item.servings}</span>
            </button>
          ))}
        </nav>

        <article className={styles.sheet}>
          <h2>{recipe.title}</h2>
          <p className={styles.summary}>{recipe.summary}</p>
          <ul className={styles.tags}>
            {recipe.tags.map((tag) => <li key={tag}>{tag}</li>)}
          </ul>
          <dl className={styles.stats}>
            <div><dt>Prep</dt><dd>{minutes(recipe.prepMinutes)}</dd></div>
            <div><dt>Cook</dt><dd>{minutes(recipe.cookMinutes)}</dd></div>
            <div><dt>Serves</dt><dd>{recipe.servings}</dd></div>
          </dl>
          <div className={styles.columns}>
            <section className={styles.block}>
              <h3>Ingredients</h3>
              <ul className={styles.ingredients}>
                {recipe.ingredients.map((item) => (
                  <li key={item.id}>
                    <b>{measure(item) || "—"}</b>
                    <span>
                      {item.name}
                      {item.note ? <em className={styles.note}> {item.note}</em> : null}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
            <section className={styles.block}>
              <h3>Method</h3>
              <ol className={styles.steps}>
                {recipe.steps.map((step) => <li key={step.id}>{step.text}</li>)}
              </ol>
            </section>
          </div>
          {recipe.notes ? (
            <p className={styles.notes}><strong>Notes</strong>{recipe.notes}</p>
          ) : null}
        </article>
      </div>
    </div>
  );
}
