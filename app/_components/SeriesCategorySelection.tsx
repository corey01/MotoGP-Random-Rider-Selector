"use client";

import { useState } from "react";
import { SERIES_COLORS, SERIES_GROUPS, SERIES_CARD_META, type SubSeriesKey } from "@/consts/series";
import { categorySelection, seriesCategories, toggleCategorySelection } from "@/utils/seriesCategories";
import style from "./SeriesCategorySelection.module.scss";

export function SeriesCategorySelection({ selected, onChange, disabled = false }: {
  selected: ReadonlySet<SubSeriesKey>;
  onChange: (selected: Set<SubSeriesKey>) => void;
  disabled?: boolean;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => Object.fromEntries(
    seriesCategories.map((category) => [category.key, categorySelection(category, selected).selected > 0]),
  ));

  return <div className={style.categories}>
    {seriesCategories.map((category) => {
      const summary = categorySelection(category, selected);
      const isExpanded = !!expanded[category.key];
      return <section className={style.category} key={category.key} aria-label={category.label}>
        <div className={style.categoryHeader}>
          <button type="button" className={style.expand} aria-expanded={isExpanded} aria-controls={`category-${category.key}`} onClick={() => setExpanded((previous) => ({ ...previous, [category.key]: !previous[category.key] }))}>
            <span><span className={style.categoryLabel}>{category.label}</span><span className={style.summary}>{summary.selected} of {summary.total} classes followed</span></span>
            <span className={style.chevron} aria-hidden="true">{isExpanded ? "−" : "+"}</span>
          </button>
          <button type="button" role="checkbox" aria-checked={summary.state === "some" ? "mixed" : summary.state === "all"} className={style.bulk} disabled={disabled} onClick={() => onChange(toggleCategorySelection(category, selected))} aria-label={`${summary.state === "all" ? "Unfollow" : "Follow"} all ${category.label.toLowerCase()}`}>
            <span className={`${style.checkbox} ${summary.state !== "none" ? style.checked : ""}`} aria-hidden="true">{summary.state === "all" ? "✓" : summary.state === "some" ? "−" : ""}</span>
            {summary.state === "all" ? "Unfollow all" : "Follow all"}
          </button>
        </div>
        <div id={`category-${category.key}`} hidden={!isExpanded} className={style.categoryBody}>
          {category.series.map((series) => {
            const group = SERIES_GROUPS.find((value) => value.key === series)!;
            return <div className={style.group} key={group.key}>
              <h3 className={style.groupLabel}>{group.label}</h3>
              <div className={style.grid}>
                {group.children.map((child) => {
                  const isSelected = selected.has(child.key);
                  const meta = SERIES_CARD_META[child.key];
                  return <button key={child.key} type="button" className={`${style.card} ${isSelected ? style.cardSelected : ""}`} style={{ "--series-color": SERIES_COLORS[group.key] } as React.CSSProperties} disabled={disabled} aria-pressed={isSelected} onClick={() => {
                    const next = new Set(selected);
                    if (isSelected) next.delete(child.key); else next.add(child.key);
                    onChange(next);
                  }}>
                    <span className={style.cardTop}><span className={style.abbr}>{meta.abbr}</span><span className={`${style.checkbox} ${isSelected ? style.checked : ""}`} aria-hidden="true">{isSelected ? "✓" : ""}</span></span>
                    <span className={style.cardBottom}><span className={style.cardLabel}>{child.label}</span><span className={style.cardSub}>{meta.subtitle}</span></span>
                  </button>;
                })}
              </div>
            </div>;
          })}
        </div>
      </section>;
    })}
  </div>;
}
