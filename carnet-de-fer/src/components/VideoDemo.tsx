"use client";

import { useState } from "react";
import type { Video } from "@/data/program";

export default function VideoDemo({ video }: { video?: Video }) {
  const [playing, setPlaying] = useState(false);
  if (!video) return null;

  return (
    <>
      <div className="video-demo" onClick={() => setPlaying(true)}>
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
            title="Démonstration vidéo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- image externe YouTube, pas d'optimisation next/image nécessaire ici */}
            <img src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`} alt="Démonstration vidéo" className="video-thumb" loading="lazy" />
            <button type="button" className="video-play-btn" aria-label="Lire la vidéo de démonstration">
              ▶
            </button>
          </>
        )}
      </div>
      <p className="video-credit">
        🎥{" "}
        <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer">
          {video.title}
        </a>
        {video.channel ? ` — ${video.channel}` : ""}
      </p>
    </>
  );
}
