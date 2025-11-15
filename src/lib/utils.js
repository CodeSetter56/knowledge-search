import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// for tailwind 
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    // Read the file as a DataURL 
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Example reader.result:
      // "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABVYAAAM..."
      // The backend expects just:
      // "iVBORw0KGgoAAAANSUhEUgAABVYAAAM...", remove the prefix
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };

    reader.onerror = (error) => reject(error);
  });
};
