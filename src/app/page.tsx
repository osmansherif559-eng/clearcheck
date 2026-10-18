import Checker from "@/components/checker/Checker";

export default function HomePage() {
  return (
    <main className="home-page">
      <section className="home-split-hero reference-shell" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <h1 id="home-title">Check before you click.</h1>
          <p className="home-hero-lede">Understand suspicious messages and links. Get clear explanations and know what to do next.</p>
          <p className="home-privacy-note">Private by default. Analysis happens on your device.</p>
        </div>
        <div className="home-hero-checker" id="investigate">
          <div className="home-checker-card">
            <div className="home-checker-heading">
              <h2>Check a message</h2>
              <p>Paste a message or link to see the warning signs.</p>
            </div>
            <Checker showSamples={false} showRecovery={false} />
          </div>
        </div>
      </section>
    </main>
  );
}
