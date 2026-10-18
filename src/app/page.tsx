import Checker from "@/components/checker/Checker";

export default function HomePage() {
  return (
    <main>
      <section className="home-product shell" aria-labelledby="home-title">
        <div className="home-product-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> Private, local-first analysis</span>
          <h1 id="home-title">Not sure about a message? Check it first.</h1>
          <p>Paste a message, email, or link. ClearCheck will explain the warning signs and help you decide what to do.</p>
        </div>
      </section>

      <section className="checker-section shell" id="investigate">
        <Checker showSamples={false} showRecovery={false} />
      </section>
    </main>
  );
}
