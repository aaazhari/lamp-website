export default function Home() {
  return (
    <div className="bg-black text-white">

      {/* Hero */}
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <img src="/lamphome.png" alt="LAMP" className="w-4/5 md:w-1/2" />

        <a
          href="https://wa.me/966542326719"
          target="_blank"
          rel="noopener noreferrer"
        >
          <button className="mt-2 px-6 py-2 border border-white text-white rounded-lg hover:bg-white hover:text-black transition">
            Contact Us
          </button>
        </a>
      </div>

      {/* Services */}
      <div
  className="text-black py-16 px-10 bg-white bg-cover bg-center"
  style={{ backgroundImage: "url('/bg-pattern.png')" }}
>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* 01 */}
          <div>
            <h3 className="text-red-500 font-bold text-lg mb-2">01 | EVENT MANAGEMENT</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>Event Organization</li>
              <li>Event Implementation</li>
              <li>Event Supplies</li>
              <li>Crowd Management</li>
              <li>Event User Experience (UX)</li>
              <li>Videography and Photography</li>
            </ul>
          </div>

          {/* 02 */}
          <div>
            <h3 className="text-yellow-500 font-bold text-lg mb-2">02 | DESIGN & CREATIVE</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>Event Concepts</li>
              <li>Layout & Spatial Design</li>
              <li>3D Modeling & Visualization</li>
              <li>Material & Technical Design</li>
            </ul>
          </div>

          {/* 03 */}
          <div>
            <h3 className="text-orange-500 font-bold text-lg mb-2">03 | PRODUCTION SERVICES</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>Booth & Stage Production</li>
              <li>Materials Supply</li>
              <li>Production Supervision</li>
              <li>Event Printing & Gifts</li>
            </ul>
          </div>

          {/* 04 */}
          <div>
            <h3 className="text-purple-500 font-bold text-lg mb-2">04 | LOGISTICS SERVICES</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>Guest Transportation</li>
              <li>VIP Protocol</li>
              <li>Airport Meet & Assist</li>
              <li>Accommodation Services</li>
            </ul>
          </div>

        </div>
      </div>
     
      {/* About Section */}
<div className="bg-white text-black py-20 px-10">
  <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-10">

    {/* Left - Image */}
    <div className="flex justify-center">
      <img src="/lamp.png" alt="LAMP" className="w-3/4" />
    </div>

    {/* Right - Text */}
    <div>
      <h2 className="text-4xl font-extrabold mb-4">
        WE BRING YOUR IDEAS TO LIFE
      </h2>

      <div className="w-16 h-1 bg-blue-600 mb-4"></div>

      <h3 className="text-xl text-blue-600 font-semibold mb-3">
        we love creating
      </h3>

      <p className="text-gray-600 mb-6">
      We help brands connect with people through unforgettable moments. 
      At LAMP, we combine strategic thinking, creative design, and 
      seamless execution to deliver an End-To-End Event Solution 
      tailored to your vision. 
      </p>

      <a
          href="https://wa.me/966542326719"
          target="_blank"
          rel="noopener noreferrer"
        >
          <button className="mt-2 px-6 py-2 border border-black text-black rounded-lg hover:bg-black hover:text-white transition">
            Contact Us
          </button>
        </a>

      
    </div>

  </div>
</div>

    </div>
  );
}