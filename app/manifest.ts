import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TechSonance Infotech",
    short_name: "TechSonance",
    description:
      "Enterprise & Startup Software Engineering Agency delivering AI automation, full-stack systems, and high-performance digital products.",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#1155CC",
    icons: [
      {
        src: "/images/logo-icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/images/logo-icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
