export function getTimeElapsed(date: any) {
  const now = new Date();
  const then = new Date(date);
  const difference = now.getTime() - then.getTime(); // difference in milliseconds
  const seconds = Math.floor(difference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  // Format the difference as days and hours, hours and minutes, or minutes and seconds
  if (days >= 1) {
    const remainingHours = hours % 24;
    return `${days} days and ${remainingHours} hours ago`;
  } else if (hours >= 1) {
    const remainingMinutes = minutes % 60;
    return `${hours} hours and ${remainingMinutes} minutes ago`;
  } else if (minutes >= 1) {
    const remainingSeconds = seconds % 60;
    return `${minutes} minutes and ${remainingSeconds} seconds ago`;
  } else {
    return `${seconds} seconds ago`;
  }
}
