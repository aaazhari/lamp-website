export default function FooterSection() {
    return (
      <footer className="bg-black text-white pt-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 px-8 md:px-16 pb-12">
          {/* Left */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-extrabold uppercase">Address</h3>
              <p className="mt-2 text-xl">2750 Altahlia Street, Jeddah, KSA</p>
              <p className="mt-2 text-xl">111 Al Olaya Street, Riyadh, KSA</p>
            </div>
  
            <div>
              <h3 className="text-2xl font-extrabold uppercase">Email</h3>
              <a
                href="mailto:hello@lampevet.com"
                className="mt-2 block text-xl hover:underline"
              >
                hello@lampevet.com
              </a>
            </div>
  
            <div>
              <h3 className="text-2xl font-extrabold uppercase">Phone</h3>
              <a
                href="https://wa.me/966542326719"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block text-xl hover:underline"
              >
                +966 54 232 6719
              </a>
            </div>
          </div>
  
          {/* Middle */}
          <div className="space-y-5 text-2xl font-bold uppercase">
            <a href="#about" className="block hover:text-gray-300">About Us</a>
            <a  href="https://wa.me/966542326719"
                target="_blank"
                rel="noopener noreferrer" 
                className="block hover:text-gray-300">Contact Us</a>
            <a href="#services" className="block hover:text-gray-300">Services</a>
          </div>
  
          {/* Right */}
          <div>
          <a
            href="https://maps.app.goo.gl/xKYJ1ZfE5UhF7nZm8"
            target="_blank"
            rel="noopener noreferrer"
            >
            <iframe
                src="https://maps.google.com/maps?q=Jeddah&t=&z=13&ie=UTF8&iwloc=&output=embed"
                className="w-full max-w-[420px] h-[300px] rounded-lg border-0 pointer-events-none"
                loading="lazy"
            ></iframe>
            </a>
          </div>
        </div>
  
        <div className="border-t border-gray-700 py-6 text-center text-2xl">
          Copyright @ 2026 LAMP EVENT
        </div>
      </footer>
    );
  }