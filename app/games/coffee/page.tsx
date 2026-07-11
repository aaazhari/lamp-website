import CoffeeClient from "./CoffeeClient";

export const metadata = {
  title: "AbrarDose OverCamp Invitation",
  description: "Join us for a special Summer & Fun Vibes experience with OverDose",
  openGraph: {
    title: "AbrarDose OverCamp Invitation",
    description: "Join us for a special Summer & Fun Vibes experience with OverDose",
    url: "https://lampevent.com/games/coffee",
    siteName: "LAMP Event",
    images: [
      {
        url: "https://lampevent.com/overcamp-invitation.png",
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