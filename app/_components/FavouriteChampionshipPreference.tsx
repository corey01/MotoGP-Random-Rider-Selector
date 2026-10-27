"use client";

import { championshipForValue, type ChampionshipOption } from "@/utils/championships";
import style from "./FavouriteChampionshipPreference.module.scss";

export function FavouriteChampionshipPreference({ value, options, onChange, disabled = false }: {
  value: string | null;
  options: ChampionshipOption[];
  onChange: (value: string | null) => void;
  disabled?: boolean;
}) {
  const saved = championshipForValue(value);
  const noLongerFollowed = !!saved && !options.some((option) => option.value === value);
  return <div className={style.preference}>
    <label htmlFor="favourite-championship">Favourite championship</label>
    <p id="favourite-championship-help">Track its standings on your home screen. Choose from the classes you follow.</p>
    <select id="favourite-championship" aria-describedby="favourite-championship-help" value={value ?? ""} disabled={disabled} onChange={(event) => onChange(event.target.value || null)}>
      <option value="">No favourite championship</option>
      {noLongerFollowed && <option value={saved.value}>{saved.label} — no longer followed</option>}
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
    {noLongerFollowed && <p>Follow this class again or choose another favourite. Your saved choice is kept until you change it.</p>}
    {!options.length && <p>Follow a class with championship standings to choose a favourite.</p>}
  </div>;
}
