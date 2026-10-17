const guides = [
  { number: "01", title: "Phishing messages", body: "Unexpected urgency, requests for codes, and threats to close an account are common pressure tactics. Pause and verify through a known channel." },
  { number: "02", title: "Suspicious links", body: "Read a hostname from right to left. A brand name in a subdomain or path does not make the destination official. HTTPS only encrypts the connection." },
  { number: "03", title: "Payment scams", body: "Gift cards, cryptocurrency, wire transfers, and unexplained upfront fees are difficult to reverse. Never let a message rush a money decision." },
  { number: "04", title: "Account theft", body: "Never share a password, one-time code, or recovery code in response to an unexpected request. Use the service's official app or website instead." },
];

export default function LearnPage() {
  return (
    <main className="inner-page shell learn-page">
      <div className="page-heading"><span className="eyebrow">Learn the patterns</span><h1>Small details are worth a pause.</h1><p>Scams often borrow the language of real services. These simple checks help you slow down and verify.</p></div>
      <div className="guide-grid">
        {guides.map((guide) => <article className="guide-card" key={guide.number}><span className="guide-number">{guide.number}</span><h2>{guide.title}</h2><p>{guide.body}</p></article>)}
      </div>
      <div className="learn-callout"><span className="callout-icon">✓</span><div><h2>When in doubt, change the channel.</h2><p>Do not use the phone number, link, or reply address in the suspicious message. Find the organization independently through a trusted source.</p></div></div>
    </main>
  );
}
