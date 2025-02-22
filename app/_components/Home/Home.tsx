"use client";

import Link from "next/link";
import styles from "./Home.module.scss";
import { motoGP } from "@/app/fonts";

export const Home = () => {
  return (
    <div className={`${styles.splitContainer} ${styles.homePage}`}>
      <Link href="/sweepstake" className={`${styles.section} ${styles.sweepstake}`}>
        <div className={`${styles.content} ${motoGP.className}`}>
          <h2>Sweepstake</h2>
          <p>Generate random rider selections</p>
        </div>
      </Link>
      <Link href="/calendar" className={`${styles.section} ${styles.calendar}`}>
        <div className={`${styles.content} ${motoGP.className}`}>
          <h2>Calendar</h2>
          <p>View race schedules</p>
        </div>
      </Link>
    </div>
  );
}
