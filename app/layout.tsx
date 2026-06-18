import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SEDS J'pura | Students for the Exploration and Development of Space",
    template: "%s | SEDS J'pura",
  },
  description:
    "Students for the Exploration and Development of Space at the University of Sri Jayewardenepura — pioneering space research, rocketry, robotics, biomedical science, and astronomy.",
  keywords: [
    "SEDS", "Sri Jayewardenepura", "space", "rocketry", "satellite",
    "astronomy", "robotics", "Sri Lanka", "space research", "university",
  ],
  openGraph: {
    type: "website",
    locale: "en_LK",
    siteName: "SEDS J'pura",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <div className="stars-bg" aria-hidden="true" />
        <div className="page-wrapper">{children}</div>
      </body>
    </html>
  );
}
