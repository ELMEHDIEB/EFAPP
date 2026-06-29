import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db.js';

export function useStreakData() {
  // Query the last spin log to find when the last impulsive/spin action occurred
  const lastSpin = useLiveQuery(
    () => db.spinLogs.orderBy('id').reverse().first()
  );

  // Query the first ever coin log to serve as a baseline if no spins exist
  const firstLog = useLiveQuery(
    () => db.coinLogs.orderBy('id').first()
  );

  // Check if emotional check-in is done today
  const today = new Date().toISOString().slice(0, 10);
  const todaysCheckins = useLiveQuery(
    () => db.emotionalLogs.where('date').equals(today).toArray()
  );

  if (lastSpin === undefined || firstLog === undefined || todaysCheckins === undefined) {
    return { isLoading: true, streakDays: 0, needsCheckin: false };
  }

  // Calculate Streak
  const now = new Date();
  let streakStartDate = now;

  if (lastSpin) {
    streakStartDate = new Date(lastSpin.createdAt || lastSpin.date);
  } else if (firstLog) {
    streakStartDate = new Date(firstLog.createdAt || firstLog.date);
  } else {
    // If absolutely no data, streak is 0
    streakStartDate = now;
  }

  // Set times to midnight to calculate full days correctly
  const startDate = new Date(streakStartDate.getFullYear(), streakStartDate.getMonth(), streakStartDate.getDate());
  const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = Math.abs(currentDate - startDate);
  const streakDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const needsCheckin = todaysCheckins.length === 0;

  return { isLoading: false, streakDays, needsCheckin };
}
