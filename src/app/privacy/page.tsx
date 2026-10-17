import Icon from "@/components/ui/Icon";

export default function PrivacyPage() {
  return (
    <main className="inner-page shell prose-page">
      <div className="page-heading"><span className="eyebrow">Privacy, by design</span><h1>Your message is yours.</h1><p>ClearCheck is designed to inspect content without collecting it.</p></div>
      <div className="prose-grid">
        <section className="prose-card"><span className="prose-icon"><Icon name="lock" size={17} /></span><h2>What happens in the browser</h2><p>After the app loads, the checker runs deterministic rules locally in your browser. The analysis engine does not send your message or URL to a server, an AI provider, a reputation service, or a database.</p></section>
        <section className="prose-card"><span className="prose-icon"><Icon name="clipboard" size={17} /></span><h2>What is retained</h2><p>ClearCheck does not create an account or save investigation history. Resetting the checker clears the current report from the page. Do not paste passwords, codes, or financial details into any tool unless you need to.</p></section>
        <section className="prose-card wide"><span className="prose-icon"><Icon name="alert" size={17} /></span><h2>What the privacy promise does not mean</h2><p>The initial website still needs to load from its host. After loading, core analysis is local. ClearCheck also cannot control screenshots, browser history, or what a user chooses to copy elsewhere. This build uses no analytics or external font requests.</p></section>
      </div>
    </main>
  );
}
