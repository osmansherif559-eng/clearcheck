import Link from "next/link";
import Checker from "@/components/checker/Checker";
import Icon from "@/components/ui/Icon";

export default function HomePage() {
  return (
    <main>
      <section className="home-product shell" aria-labelledby="home-title">
        <div className="home-product-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> Private, local-first analysis</span>
          <h1 id="home-title">Check before you click.</h1>
          <p>Paste a message, link, or screenshot. See the evidence and decide what to do next.</p>
        </div>
        <div className="home-product-note">
          <Icon name="lock" size={16} />
          <span><strong>Nothing leaves this browser.</strong><small>No account, history, or external AI service.</small></span>
        </div>
      </section>

      <section className="checker-section shell" id="investigate">
        <Checker />
      </section>

      <section className="home-support shell" aria-labelledby="home-support-title">
        <div className="home-support-intro">
          <span className="eyebrow">A calmer way to be cautious</span>
          <h2 id="home-support-title">Evidence first. Next steps second.</h2>
          <p>ClearCheck shows what local rules can observe, what remains unknown, and how to verify through a trusted channel.</p>
        </div>
        <div className="home-support-list">
          <div><span>01</span><strong>Investigate locally</strong><p>Paste a message or link without opening the destination.</p></div>
          <div><span>02</span><strong>Read the signals</strong><p>See the exact words and URL features behind each finding.</p></div>
          <div><span>03</span><strong>Choose your next step</strong><p>Use practical guidance without unsupported safety claims.</p></div>
        </div>
        <div className="home-support-links"><Link className="text-link" href="/privacy">Read the privacy approach <span>→</span></Link><Link className="text-link" href="/about">See limitations <span>→</span></Link></div>
      </section>
    </main>
  );
}
