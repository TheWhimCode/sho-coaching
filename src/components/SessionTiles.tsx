      
      export default function SessionTiles(){
        return(
      <section id="more" className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <a href="#what" className="group rounded-2xl ring-1 ring-white/10 bg-white/5 hover:bg-white/8 p-5 transition">
            <div className="text-lg font-semibold mb-1">What you get</div>
            <p className="text-white/70 text-sm">Exactly what’s included.</p>
          </a>
          <a href="#example" className="group rounded-2xl ring-1 ring-white/10 bg-white/5 hover:bg-white/8 p-5 transition">
            <div className="text-lg font-semibold mb-1">Example session</div>
            <p className="text-white/70 text-sm">60–90s highlight clip.</p>
          </a>
          <a href="#testimonials" className="group rounded-2xl ring-1 ring-white/10 bg-white/5 hover:bg-white/8 p-5 transition">
            <div className="text-lg font-semibold mb-1">Testimonials</div>
            <p className="text-white/70 text-sm">Real results & ranks.</p>
          </a>
          <a href="#how" className="group rounded-2xl ring-1 ring-white/10 bg-white/5 hover:bg-white/8 p-5 transition">
            <div className="text-lg font-semibold mb-1">How it works</div>
            <p className="text-white/70 text-sm">3 simple steps.</p>
          </a>
        </div>
      </section>
        );
      }