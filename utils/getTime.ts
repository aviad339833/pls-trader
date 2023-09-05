export function getCurrentDateTime() {
  const date = new Date();

  // Array of month names for display purposes
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Array of day names for display purposes
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Construct the string
  const dateString = `${dayNames[date.getDay()]} ${
    monthNames[date.getMonth()]
  } ${date.getFullYear()} ${date.toLocaleTimeString()}`;

  return dateString;
}
