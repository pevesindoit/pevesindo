import dayjs from "dayjs";

export function FormatToday() {
  return dayjs().format("DD/MM/YYYY");
}
