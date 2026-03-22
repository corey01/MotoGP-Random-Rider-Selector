"use client";
import { useState, type ChangeEvent, type FormEvent } from "react";
import style from "./Entrants.module.scss";

import Entrant from "./Entrant";

const Entrants = ({
  entrants,
  handleRemoveEntrant,
  handleResetEntrants,
  handleAddNewEntrant,
}: {
  entrants: string[];
  handleRemoveEntrant: (entrant: string) => void;
  handleResetEntrants: () => void;
  handleAddNewEntrant: (newEntrant: string) => void;
}) => {
  const [inputVal, setInput] = useState("");
  const [error, setError] = useState("");

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextName = inputVal.trim();
    if (nextName.length < 2) {
      setError("Please enter a name");
      return;
    }
    handleAddNewEntrant(nextName);
    setInput("");
  };

  return (
    <div className={style.panel}>
      <div className={style.header}>
        <div>
          <p className={style.eyebrow}>Entrant List</p>
          <h2 className={style.title}>Who is in the draw?</h2>
        </div>
        <button className={style.resetButton} onClick={handleResetEntrants} type="button">
          Reset entrants
        </button>
      </div>

      <p className={style.summary}>
        {entrants.length} entrant{entrants.length === 1 ? "" : "s"} currently loaded.
      </p>

      <div className={style.grid}>
        {entrants.map((entrant) => (
          <Entrant value={entrant} removeEvent={handleRemoveEntrant} key={entrant} />
        ))}
      </div>

      <form className={style.editor} onSubmit={handleSubmit}>
        <div className={style.formLabelRow}>
          <label htmlFor="entrant-name" className={style.formLabel}>
            Add entrant
          </label>
          <span className={style.formHint}>Name only. Photos auto-resolve when available.</span>
        </div>

        <div className={style.addInput}>
          <input
            id="entrant-name"
            onChange={handleInput}
            onFocus={() => {
              if (error) setError("");
            }}
            type="text"
            placeholder="Enter a name"
            name="name"
            value={inputVal}
            className={`${style.input} ${error ? style.inputError : ""}`}
          />
          <button type="submit" className={style.submitButton}>
            Add entrant
          </button>
        </div>
        {error && <p className={style.error}>{error}</p>}
      </form>
    </div>
  );
};

export default Entrants;
