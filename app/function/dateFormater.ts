export function getFormattedDate(inputDate?: Date) {
  const date = inputDate || new Date();
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Function to get a date X days before a given date
// This function needs to parse "DD/MM/YYYY" and return "DD/MM/YYYY"
export function getDateXDaysBefore(dateString: string, days: number): string {
  // Assuming dateString is in "DD/MM/YYYY" format
  const [day, month, year] = dateString.split("/").map(Number);
  // Month is 0-indexed in JavaScript Date objects, so subtract 1
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - days);

  const newDay = String(date.getDate()).padStart(2, "0");
  const newMonth = String(date.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed, so add 1
  const newYear = date.getFullYear();

  return `${newDay}/${newMonth}/${newYear}`;
}
