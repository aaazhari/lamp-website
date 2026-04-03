import type { Metadata } from "next";
import { GoogleTagManager } from "@next/third-parties/google";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'LAMP Event Solution',
  description: 'Creative event solutions.',
  openGraph: {
    title: 'LAMP Event Solution',
    description: 'Creative event solutions.',
    url: 'https://lampevent.com',
    siteName: 'LAMP Event Solution',
    images: [
      {
        url: '/lamp.png',
        width: 1200,
        height: 630,
      },
    ],
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >

<body className="min-h-full flex flex-col">

  <GoogleTagManager gtmId="GTM-MS5943PN" />

  {children}

</body>
    </html>
  );
}
