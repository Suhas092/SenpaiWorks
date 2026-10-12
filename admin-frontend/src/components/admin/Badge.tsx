export function Badge({ children }: { children: string }) {
  const tone = /paid|delivered|active|published|resolved|healthy|fulfilled|reviewed/i.test(children)
    ? "success"
    : /pending|processing|draft|low|reported/i.test(children)
      ? "warning"
      : /cancel|hidden|out of stock|failed/i.test(children)
        ? "danger"
        : "neutral";
  return (
    <span className={`status-badge status-${tone}`}>
      <span className="status-dot" />
      {children}
    </span>
  );
}
