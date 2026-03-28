"use client";

import { useEffect, useRef, useState } from "react";

function CountUp({
  end,
  duration = 2000,
}: {
  end: number;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const [start, setStart] = useState(false);
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStart(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );

    if (ref.current) observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!start) return;

    let startTime: number | null = null;

    const updateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };

    requestAnimationFrame(updateCount);
  }, [start, end, duration]);

  return <span ref={ref}>{count}</span>;
}

export default function StatsSection() {
  return (
    <div
      className="bg-white text-black py-20 px-10 bg-cover bg-center"
      style={{ backgroundImage: "url('/bg-pattern.png')" }}
    >
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-extrabold uppercase">
          Enjoy Our Latest Work
        </h2>
        <div className="w-24 h-1 bg-blue-600 mx-auto my-4"></div>
        <p className="text-blue-600 text-2xl font-semibold">
          our finished product
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
        <div>
          <div className="text-6xl md:text-7xl font-extrabold text-fuchsia-500">
            <CountUp end={76} />+
          </div>
          <p className="mt-3 text-2xl uppercase">Clients</p>
        </div>

        <div>
          <div className="text-6xl md:text-7xl font-extrabold text-orange-500">
            <CountUp end={100} />+
          </div>
          <p className="mt-3 text-2xl uppercase">Projects</p>
        </div>

        <div>
          <div className="text-6xl md:text-7xl font-extrabold text-blue-600">
            <CountUp end={28} />+
          </div>
          <p className="mt-3 text-2xl uppercase">Partners</p>
        </div>
      </div>
    </div>
  );
}