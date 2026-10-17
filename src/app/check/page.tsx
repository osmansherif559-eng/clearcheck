import Checker from "@/components/checker/Checker";

export default function CheckPage() {
  return (
    <main className="inner-page shell">
      <div className="page-heading"><span className="eyebrow">Investigation desk</span><h1>What are you unsure about?</h1><p>Paste a message or link. ClearCheck will point to the signals it can observe without opening anything.</p></div>
      <Checker />
    </main>
  );
}
