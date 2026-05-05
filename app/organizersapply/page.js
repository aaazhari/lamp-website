export default function OrganizersApplyPage() {
    return (
      <main className="min-h-screen bg-black text-white px-6 py-16">
        
        {/* Title Section */}
        <section className="max-w-4xl mx-auto text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">
            Apply as an Organizer
          </h1>
          <p className="text-gray-300">
            Join Lamp Event Solution and be part of our event team.
          </p>
        </section>
  
        {/* Form Section */}
        <section className="max-w-4xl mx-auto bg-white rounded-2xl overflow-hidden shadow-lg">
            <iframe
                src="https://docs.google.com/forms/d/e/1FAIpQLSfEkKhEbwlfq0EKnic9JuXgMqOlPqlYXh4LqFPB-dm7zbZxEw/viewform?embedded=true"
                width="100%"
                height="1200"
                style={{ border: "none" }}
            >
                Loading…
            </iframe>
        </section>
  
      </main>
    );
  }