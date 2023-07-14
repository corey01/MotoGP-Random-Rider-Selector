import { useState } from "react";

import RemovableList from "../RemovableList";

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

  const handleInput = (e: any) => {
    if (e?.target?.value) {
      setInput(e.target.value);
    }
  };
  return (
    <div className="panel">
      {entrants.map((e) => (
        <RemovableList value={e} removeEvent={handleRemoveEntrant} key={e} />
      ))}
      <div className="addInput">
        <input onChange={handleInput} type="text" placeholder="Name" name="name" value={inputVal} />
        <button
          onClick={() => {
            handleAddNewEntrant(inputVal);
              setInput("")
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
