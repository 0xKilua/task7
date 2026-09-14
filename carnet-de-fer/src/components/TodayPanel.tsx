"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useNow } from "@/lib/clock";
import { DEFAULT_PLACE, fetchWeather, getPosition, type Weather } from "@/lib/weather";
import WeatherIcon from "./WeatherIcon";
import { DAY_TABS } from "@/data/dayList";

type WeatherState =
  | { status: "loading" }
  | { status: "ready"; weather: Weather; place?: string }
  | { status: "error" };

export default function TodayPanel() {
  const now = useNow();
  const [weather, setWeather] = useState<WeatherState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    getPosition()
      .then((pos) => fetchWeather(pos.latitude, pos.longitude).then((w) => ({ w, pos })))
      .then(({ w, pos }) => {
        if (cancelled) return;
        const place = pos.latitude === DEFAULT_PLACE.latitude ? DEFAULT_PLACE.name : undefined;
        setWeather({ status: "ready", weather: w, place });
      })
      .catch(() => {
        if (!cancelled) setWeather({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // now === 0 : rendu serveur, l'heure du visiteur n'est pas encore connue.
  if (now === 0) {
    return <div className="today-panel today-placeholder" aria-hidden="true" />;
  }

  const date = new Date(now);
  const weekday = date.toLocaleDateString("fr-FR", { weekday: "long" });
  const month = date.toLocaleDateString("fr-FR", { month: "long" });
  const time = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const seconds = String(date.getSeconds()).padStart(2, "0");

  const todayId = DAY_TABS[(date.getDay() + 6) % 7].id;
  const todayLabel = DAY_TABS[(date.getDay() + 6) % 7].label;

  return (
    <section className="today-panel">
      <div className="today-left">
        <p className="today-weekday">{weekday}</p>
        <p className="today-date">
          <span className="today-daynum">{date.getDate()}</span>
          <span className="today-month">{month}</span>
        </p>
        <p className="today-time mono">
          {time}
          <span className="today-seconds">:{seconds}</span>
        </p>
        <Link className="today-link" href={`/jour/${todayId}`}>
          Séance de {todayLabel} →
        </Link>
      </div>

      <div className="today-weather">
        {weather.status === "ready" && (
          <>
            <WeatherIcon kind={weather.weather.kind} />
            <p className="today-temp mono">{weather.weather.temperature}°</p>
            <p className="today-cond">
              {weather.weather.label}
              {weather.place ? ` · ${weather.place}` : ""}
            </p>
          </>
        )}
        {weather.status === "loading" && <p className="today-cond">Météo…</p>}
        {weather.status === "error" && <p className="today-cond">Météo indisponible</p>}
      </div>
    </section>
  );
}
