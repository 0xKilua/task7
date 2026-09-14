import type { WeatherKind } from "@/components/WeatherIcon";

export type Weather = {
  temperature: number;
  label: string;
  kind: WeatherKind;
};

// Position de repli quand la géolocalisation est refusée ou indisponible.
export const DEFAULT_PLACE = { latitude: 48.8566, longitude: 2.3522, name: "Paris" };

// Codes WMO renvoyés par Open-Meteo.
function describe(code: number, isDay: boolean): { label: string; kind: WeatherKind } {
  if (code === 0) return { label: "Ciel dégagé", kind: isDay ? "clear" : "clear-night" };
  if (code === 1) return { label: "Plutôt dégagé", kind: isDay ? "clear" : "clear-night" };
  if (code === 2) return { label: "Partiellement nuageux", kind: isDay ? "partly" : "partly-night" };
  if (code === 3) return { label: "Couvert", kind: "cloudy" };
  if (code === 45 || code === 48) return { label: "Brouillard", kind: "fog" };
  if (code >= 51 && code <= 57) return { label: "Bruine", kind: "drizzle" };
  if (code >= 61 && code <= 67) return { label: "Pluie", kind: "rain" };
  if (code >= 71 && code <= 77) return { label: "Neige", kind: "snow" };
  if (code >= 80 && code <= 82) return { label: "Averses", kind: "rain" };
  if (code === 85 || code === 86) return { label: "Averses de neige", kind: "snow" };
  if (code >= 95) return { label: "Orage", kind: "thunder" };
  return { label: "Temps variable", kind: "cloudy" };
}

export async function fetchWeather(latitude: number, longitude: number): Promise<Weather> {
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${latitude}&longitude=${longitude}` +
    "&current=temperature_2m,weather_code,is_day&timezone=auto";

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Météo indisponible (${res.status})`);

  const data = await res.json();
  const current = data?.current;
  if (!current || typeof current.temperature_2m !== "number") {
    throw new Error("Réponse météo inattendue");
  }

  const { label, kind } = describe(Number(current.weather_code), current.is_day === 1);
  return { temperature: Math.round(current.temperature_2m), label, kind };
}

/** Coordonnées du navigateur, avec repli silencieux sur DEFAULT_PLACE. */
export function getPosition(): Promise<{ latitude: number; longitude: number; name?: string }> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(DEFAULT_PLACE);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(DEFAULT_PLACE),
      { timeout: 8000, maximumAge: 15 * 60 * 1000 }
    );
  });
}
