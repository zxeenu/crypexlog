import type { WebAppManifest } from "@remix-pwa/dev";
import { json } from "@remix-run/node";

export const loader = () => {
  return json(
    {
      id: "/",
      short_name: "Crypexlog",
      name: "Crypexlog",
      start_url: "/",
      display: "standalone",
      orientation: "portrait", // Optional: set orientation
      background_color: "#d3d7dd",
      theme_color: "#c34138",
      description: "Your app description here", // Optional: provide a description
      icons: [
        {
          src: "/icons/icon-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/icons/icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
      prefer_related_applications: false, // Optional: whether to prefer native apps
      related_applications: [], // Optional: related native apps
    } as WebAppManifest,
    {
      headers: {
        "Cache-Control": "public, max-age=600",
        "Content-Type": "application/manifest+json",
      },
    }
  );
};
