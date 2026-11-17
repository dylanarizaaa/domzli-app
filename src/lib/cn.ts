import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Combina clases de NativeWind; la última gana en caso de conflicto. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
