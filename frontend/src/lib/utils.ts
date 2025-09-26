import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// HTTP Method Colors - Consistent across all components
export const HTTP_METHOD_COLORS = {
  GET: 'bg-green-100 text-green-800 border-green-200',
  POST: 'bg-blue-100 text-blue-800 border-blue-200',
  PUT: 'bg-orange-100 text-orange-800 border-orange-200',
  DELETE: 'bg-red-100 text-red-800 border-red-200',
  PATCH: 'bg-purple-100 text-purple-800 border-purple-200',
  HEAD: 'bg-gray-100 text-gray-800 border-gray-200',
  OPTIONS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
} as const;

export function getMethodColor(method: string): string {
  const upperMethod = method.toUpperCase();
  return HTTP_METHOD_COLORS[upperMethod as keyof typeof HTTP_METHOD_COLORS] || 'bg-gray-100 text-gray-800 border-gray-200';
}
