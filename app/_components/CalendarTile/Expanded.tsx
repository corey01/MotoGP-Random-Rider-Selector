import { Race } from "@/models/race";
import React, { useState } from "react";
import style from "./CalendarTile.module.scss";
import { localRaceTime } from "@/utils/datesTimes";
import Switch from "../Switch";

export function Expanded({
  race,
  handleToggle,
}: {
  race: Race;
  handleToggle: () => void;
}) {
  const [showAll, setShowAll] = useState(false);

  const handleModeSwitch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowAll(e.target.checked);
  };

  return (
    <div className={style.expanded}>
      <Switch
        uniqueId={race.name}
        checked={showAll}
        onChange={handleModeSwitch}
        leftText="Show only Races"
        rightText="Show All Events"
      />
      <table className={style.allEvents}>
        <thead>
          <tr className={style.headerRow}>
            <th>Class</th>
            <th>Type</th>
            <th>When</th>
          </tr>
        </thead>
        <tbody>
          {race.broadcasts.map((broadcast) => {
            const showMe = showAll || broadcast.kind === "RACE";
            return showMe ? (
              <tr
                key={broadcast.date_start + broadcast.eventName}
                className={
                  broadcast.eventName === "MotoGP" ? style.highlight : undefined
                }
              >
                <td>{broadcast.eventName}</td>
                <td>{broadcast.name}</td>
                <td>{localRaceTime(broadcast.date_start)}</td>
              </tr>
            ) : null;
          })}
        </tbody>
      </table>
      <p className={style.closeViewLink} onClick={handleToggle}>
        Close expanded view
      </p>
    </div>
  );
}
