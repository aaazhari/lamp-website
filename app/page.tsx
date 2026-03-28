export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black">
      <img src="/lamphome.png" alt="LAMP" className="w-1/2" />

      <a
  href="https://wa.me/966500032297"
  target="_blank"
  rel="noopener noreferrer"
>
  <button className="mt-2 px-6 py-2 border border-white text-white rounded-lg hover:bg-white hover:text-black transition">
    Contact Us
  </button>
</a>
    </div>
  );
}