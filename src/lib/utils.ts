import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function number(value: number | null | undefined, digits = 0) {
  return value == null ? "—" : new Intl.NumberFormat("zh-TW", { maximumFractionDigits: digits }).format(value);
}
