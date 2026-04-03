export default function Badge({ children, color }) {
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: color + '22', color }}
    >
      {children}
    </span>
  );
}
