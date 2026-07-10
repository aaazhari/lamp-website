export const metadata = {
    metadataBase: new URL("https://lampevent.com"),
  
    title: "Apply as an Organizer | Lamp Event",
    description: "Join the Lamp organizing team and create unforgettable experiences.",
  
    openGraph: {
      title: "Apply to be an Organizer",
      description: "Shape experiences. Create impact.",
      url: "/organizersapply",
      siteName: "Lamp Event",
      images: [
        {
          url: "/organizersapply.png", // use relative path (IMPORTANT)
          width: 1200,
          height: 1200,
        },
      ],
      locale: "en_US",
      type: "website",
    },
  
    twitter: {
      card: "summary_large_image",
      title: "Apply to be an Organizer",
      description: "Join Lamp Event team",
      images: ["/organizersapply.png"],
    },
  };

export default function OrganizersApplyPage() {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center">
  
        {/* Image */}
        <img
          src="/organizersapply.png"
          alt="Apply to be an Organizer"
          className="w-full max-w-4xl object-contain"
        />
  
        {/* Button */}
        <a
          href="https://forms.gle/MekddvN3KW9P2K5S7"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 mb-12 px-10 py-4 rounded-full text-white font-bold text-lg 
                     bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400 
                     hover:opacity-90 transition"
        >
          Apply Now
        </a>
  
      </main>
    );
  }