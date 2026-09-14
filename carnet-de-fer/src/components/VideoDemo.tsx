"use client";

import { useState } from "react";
import type { Video } from "@/data/program";

export default function VideoDemo({ video }: { video?: Video }) {
  const [playing, setPlaying] = useState(false);
  if (!video) return null;

  return (
    <>
      {playing ? (
        <div className="video-demo">
          <iframe
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
            title={`Démonstration vidéo : ${video.title}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      ) : (
        <button
          type="button"
          className="video-demo"
          onClick={() => setPlaying(true)}
          aria-label={`Lire la démonstration vidéo : ${video.title}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- miniature YouTube servie par leur CDN, next/image n'apporte rien ici */}
          <img
            src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
            alt=""
            className="video-thumb"
            width={480}
            height={360}
            loading="lazy"
          />
          <span className="video-play-btn" aria-hidden="true">
            ▶
          </span>
        </button>
      )}
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
