export default function AboutPage() {
  return (
    <main className="inner-page shell prose-page">
      <div className="page-heading"><span className="eyebrow">About ClearCheck</span><h1>Indicators are not proof.</h1><p>ClearCheck is a transparent assessment and education tool—not a guarantee that a message is fraudulent or legitimate.</p></div>
      <div className="about-stack">
        <section className="about-row"><span className="about-label">Observed</span><div><h2>What is directly in front of us</h2><p>ClearCheck can extract phrases, links, schemes, hostnames, ports, and other visible structure from the input. Findings quote that evidence so you can inspect it yourself.</p></div></section>
        <section className="about-row"><span className="about-label">Inferred</span><div><h2>What combinations can suggest</h2><p>Rules combine signals—such as an authentication-code request plus urgency—to identify meaningful risk. They do not identify intent or certify who sent the content.</p></div></section>
        <section className="about-row"><span className="about-label">Unknown</span><div><h2>What local inspection cannot verify</h2><p>ClearCheck does not visit URLs, follow redirects, query DNS, check ownership, scan page content, or consult live reputation feeds. A clean result means only that the configured rules found no major indicators.</p></div></section>
      </div>
      <div className="ruleset-note"><strong>Ruleset 1.0.0</strong><span>Deterministic local rules with documented limitations.</span></div>
    </main>
  );
}
