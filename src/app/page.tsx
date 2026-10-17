import Link from "next/link";
import Checker from "@/components/checker/Checker";
import Icon from "@/components/ui/Icon";

export default function HomePage() {
  return (
    <main>
      <section className="hero shell">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> Private by default</div>
          <h1>Know the warning signs <em>before</em> you act.</h1>
          <p className="hero-lede">ClearCheck helps you understand suspicious messages and links with evidence you can actually see—not a mysterious score.</p>
          <div className="trust-row"><Icon name="lock" size={15} /> Analyze locally in your browser <span className="trust-divider" /> No account or history</div>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="orbit-ring orbit-ring-one" />
          <div className="orbit-ring orbit-ring-two" />
          <div className="orbit-ring orbit-ring-three" />
          <div className="orbit-core"><span><Icon name="shield-check" size={38} strokeWidth={1.7} /></span><small>clear</small></div>
          <span className="orbit-spark spark-one"><Icon name="sparkle" size={18} /></span><span className="orbit-spark spark-two"><Icon name="sparkle" size={14} /></span><span className="orbit-spark spark-three"><Icon name="check" size={14} /></span>
        </div>
      </section>

      <section className="checker-section shell" id="investigate">
        <Checker />
      </section>

      <section className="three-pillars shell" aria-label="How ClearCheck works">
        <div className="pillar"><span className="pillar-number">01</span><h2><Icon name="search" size={17} /> Investigate</h2><p>Paste a message, email, or URL without opening the destination.</p></div>
        <div className="pillar"><span className="pillar-number">02</span><h2><Icon name="eye" size={17} /> Understand</h2><p>See the exact words and URL features behind every warning.</p></div>
        <div className="pillar"><span className="pillar-number">03</span><h2><Icon name="shield-check" size={17} /> Protect</h2><p>Get practical next steps that never rely on the suspicious link.</p></div>
      </section>

      <section className="home-bottom shell">
        <div><span className="eyebrow">A clearer way to be cautious</span><h2>Absence of a warning is not a guarantee.</h2></div>
        <p>ClearCheck is an education and assessment tool. It shows what local rules can observe, what remains unknown, and when to independently verify.</p>
        <Link className="text-link" href="/about">Read about the approach <span>→</span></Link>
      </section>
    </main>
  );
}
