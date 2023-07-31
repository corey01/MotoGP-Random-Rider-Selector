"use client";
import { useState } from "react";
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

  const handleInput = (e: any) => {
    setInput(e.target.value);
  };

  return (
    <div className={`${style.Entrants} panel`}>
      {entrants.map((e) => (
        <Entrant value={e} removeEvent={handleRemoveEntrant} key={e} />
      ))}
      <div className={style.addInput}>
        <input
          onChange={handleInput}
          onFocus={() => {
            if (error) setError("");
          }}
          type="text"
          placeholder="Name"
          name="name"
          value={inputVal}
          className={`${style.input} ${error ? style.inputError : null}`}
        />
        {error && <p className={style.error}>{error}</p>}
        <button
          onClick={() => {
            if (inputVal.length < 4) {
              setError("Please enter a name");
              return;
            }
            handleAddNewEntrant(inputVal);
            setInput("");
          }}
        >
          Add
        </button>
      </div>
      <button style={{ marginTop: 20 }} onClick={handleResetEntrants}>
        Reset Entrants
      </button>
    </div>
  );
};

export default Entrants;
