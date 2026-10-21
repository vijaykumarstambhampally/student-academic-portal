function Loading({ label = "Loading..." }) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <div className="loading-spinner" />
      <span>{label}</span>
    </div>
  );
}

export default Loading;
