export default function PanelCard({ children, className = "" }) {
  return (
    <section
      className={`glass rounded-[28px] border border-white/60 shadow-[0_18px_56px_rgba(15,68,98,0.10)] ${className}`}
    >
      {children}
    </section>
  );
}
