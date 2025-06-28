function formatDateToDDMMYYYY(date: Date): string {
  console.log(date);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
