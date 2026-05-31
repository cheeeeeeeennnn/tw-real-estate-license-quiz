export default function StatGrid({ items }) {
  return (
    <section className="stat-grid">
      {items.map((item) => (
        <div className="stat-card" key={item.label}>
          <strong>{item.value}</strong>
          <span>{item.label}</span>
        </div>
      ))}
    </section>
  );
}
