import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ConsentLayer",
    short_name: "ConsentLayer",
    description: "Programmable permissions, payments, and receipts for AI dataset usage.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f7f9f8",
    theme_color: "#102333",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  }
}
