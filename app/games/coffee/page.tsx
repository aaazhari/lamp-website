import CoffeeClient from "./CoffeeClient";

export const metadata = {
  title: "Bring Your Kid To Work Day Invitation",
  description: "Join us for a special experience with LAMP Event",
  openGraph: {
    title: "Bring Your Kid To Work Day Invitation",
    description: "Join us for a special experience with LAMP Event",
    url: "https://lampevent.com/games/coffee",
    siteName: "LAMP Event",
    images: [
      {
        url: "https://lampevent.com/ihc-invitation.png",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
};

export default function CoffeeGamePage() {
  return <CoffeeClient />;
}