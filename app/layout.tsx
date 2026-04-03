import type { Metadata } from "next";
import Script from "next/script";
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

{/* ✅ Google Tag Manager */}
<Script
  id="gtm-script"
  strategy="afterInteractive"
>
  {`
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-MS5943PN');
  `}
</Script>

{/* ✅ NoScript fallback */}
<noscript>
  <iframe
    src="https://www.googletagmanager.com/ns.html?id=GTM-MS5943PN"
    height="0"
    width="0"
    style={{ display: "none", visibility: "hidden" }}
  />
</noscript>

{children}

</body>
    </html>
  );
}
