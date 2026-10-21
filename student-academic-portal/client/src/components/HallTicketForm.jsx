import { useState } from "react";

/**
 * @param {{ onSubmit: (hallTicket: string) => void, loading: boolean, actionLabel: string }} props
 */
function HallTicketForm({ onSubmit, loading, actionLabel }) {
  const [hallTicket, setHallTicket] = useState("");
  const [touched, setTouched] = useState(false);

  const isValid = hallTicket.trim().length >= 8;

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    onSubmit(hallTicket.trim().toUpperCase());
  };

  return (
    <form className="hall-ticket-form" onSubmit={handleSubmit}>
      <label htmlFor="hallTicket">Hall Ticket Number</label>
      <input
        id="hallTicket"
        type="text"
        placeholder="22XXXXXXXX"
        value={hallTicket}
        onChange={(e) => setHallTicket(e.target.value)}
        disabled={loading}
        autoComplete="off"
      />
      {touched && !isValid && (
        <p className="field-error">Enter a valid Hall Ticket Number.</p>
      )}
      <button type="submit" disabled={loading}>
        {loading ? "Loading..." : actionLabel}
      </button>
    </form>
  );
}

export default HallTicketForm;
