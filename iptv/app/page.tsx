"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [channels, setChannels] = useState<any[]>([]);
  const [currentUrl, setCurrentUrl] = useState("");
  const [currentChannel, setCurrentChannel] =
    useState("Loading...");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Loading...");
  const [currentIndex, setCurrentIndex] = useState(0);

  // Load Playlist
  useEffect(() => {
    fetch("https://raw.githubusercontent.com/mamunptsc1/iptv/main/bd")
      .then((res) => res.text())
      .then((data) => {
        const lines = data.split("\n");
        const list: any[] = [];

        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes("#EXTINF")) {
            const name = lines[i].split(",").pop()?.trim();

            const logoMatch = lines[i].match(/tvg-logo="(.*?)"/);
            const logo = logoMatch ? logoMatch[1] : "";

            const url = lines[i + 1];

            list.push({
              name,
              url,
              logo,
            });
          }
        }

        setChannels(list);

        if (list.length > 0) {
          playChannel(0, list);
        }
      });
  }, []);

  // Play Channel
  const playChannel = (
    index: number,
    customList?: any[]
  ) => {
    const activeList = customList || channels;

    if (index >= activeList.length) {
      setStatus("❌ No Working Streams");
      return;
    }

    const ch = activeList[index];

    setCurrentIndex(index);
    setCurrentUrl(ch.url);
    setCurrentChannel(ch.name);

    setStatus("⏳ Loading...");
  };

  // HLS Player
  useEffect(() => {
    if (!currentUrl) return;

    const video = videoRef.current;

    if (!video) return;

    let hls: Hls;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(currentUrl);
      hls.attachMedia(video);

      // Loaded
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play();
        setStatus("🟢 LIVE");
      });

      // Error Handling
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setStatus("❌ Dead Stream - Switching...");

          setTimeout(() => {
            playChannel(currentIndex + 1);
          }, 1500);

          hls.destroy();
        }
      });

      return () => {
        hls.destroy();
      };
    } else if (
      video.canPlayType(
        "application/vnd.apple.mpegurl"
      )
    ) {
      video.src = currentUrl;

      video.addEventListener(
        "loadedmetadata",
        () => {
          video.play();
          setStatus("🟢 LIVE");
        }
      );
    }
  }, [currentUrl]);

  // Search
  const filteredChannels = channels.filter((ch) =>
    ch.name
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-red-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-red-500">
            IPTV AI PLAYER
          </h1>

          <div className="bg-red-600 px-4 py-2 rounded-full animate-pulse">
            🔴 LIVE
          </div>
        </div>

        {/* Search */}
        <div className="mt-4">
          <input
            type="text"
            placeholder="Search channels..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="w-full p-4 rounded-2xl bg-white/10 border border-white/10 outline-none"
          />
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Player */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-4 mb-8 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm">
                NOW PLAYING
              </p>

              <h2 className="text-2xl font-bold text-red-400">
                {currentChannel}
              </h2>
            </div>

            <div className="bg-white/10 px-4 py-2 rounded-xl">
              {status}
            </div>
          </div>

          {/* Player */}
          <video
            ref={videoRef}
            controls
            autoPlay
            playsInline
            className="w-full rounded-2xl bg-black"
          />
        </div>

        {/* Channels */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {filteredChannels.map((ch, i) => (
            <div
              key={i}
              onClick={() => playChannel(i)}
              className={`cursor-pointer rounded-3xl p-4 border transition-all duration-300 hover:scale-105 ${
                currentChannel === ch.name
                  ? "bg-red-600/30 border-red-500"
                  : "bg-white/5 border-white/10 hover:bg-red-600/20"
              }`}
            >
              {/* Logo */}
              {ch.logo ? (
                <img
                  src={ch.logo}
                  alt={ch.name}
                  className="w-full h-20 object-contain mb-4"
                />
              ) : (
                <div className="h-20 flex items-center justify-center text-gray-500">
                  NO LOGO
                </div>
              )}

              {/* Name */}
              <div className="text-center">
                <p className="text-sm font-semibold">
                  {ch.name}
                </p>

                <div className="mt-2 inline-block bg-red-600/20 text-red-400 px-2 py-1 rounded-full text-xs">
                  LIVE TV
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}