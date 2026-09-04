// Shared helpers for the service layer (dates, times, overlap logic).

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Two time ranges overlap when startA < endB AND startB < endA ("HH:MM" strings compare lexicographically).
function rangesOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

// Weekday name for an ISO date "YYYY-MM-DD".
function weekdayOf(isoDate) {
  const d = new Date(`${isoDate}T00:00:00`);
  return DAYS[d.getDay()];
}

// Today's date as "YYYY-MM-DD" in Asia/Dhaka.
function todayISO() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date());
}

function addDays(isoDate, n) {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

module.exports = { rangesOverlap, weekdayOf, todayISO, addDays };
