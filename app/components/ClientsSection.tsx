"use client";

export default function ClientsSection() {
  const logos = [
    "/clients/culture.png",
    "/clients/sports.png",
    "/clients/tourism.png",
    "/clients/stcpay.png",
    "/clients/smc.png",
    "/clients/aseer.png",
  ];

  return (
    <section className="bg-white py-20 overflow-hidden">
      <div className="text-center mb-10">
        <h2 className="text-4xl md:text-5xl font-extrabold text-black uppercase">
          Our Clients
        </h2>
      </div>

      <div className="relative w-full overflow-hidden">
        <div className="flex animate-scroll gap-16 w-max">
          {[...logos, ...logos].map((logo, index) => (
            <div
            key={index}
            className="flex items-center justify-center min-w-[180px] md:min-w-[220px] h-[120px]"
          >
            <div className="w-[160px] h-[80px] flex items-center justify-center">
              <img
                src={logo}
                alt={`Client ${index + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
          ))}
        </div>
      </div>
    </section>
  );
}