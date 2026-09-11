/**
 * SenpaiWorks Admin Console - Donations Module
 * scripts/admin/admin-donations.js
 */

let allDonationsData = [];

window.loadDonations = async function () {
  const tbody = document.getElementById("donations-list-body");
  const emptyState = document.getElementById("donations-empty-state");
  const totalRaisedEl = document.getElementById("donations-total-raised");
  const donorCountEl = document.getElementById("donations-donor-count");
  const goalProgressEl = document.getElementById("donations-goal-progress");
  const searchInput = document.getElementById("donations-search");

  if (!tbody) return;

  try {
    const res = await fetch("/api/donate/list");
    if (!res.ok) throw new Error("API error");
    const data = await res.json();

    allDonationsData = data.donations || [];

    if (totalRaisedEl) totalRaisedEl.textContent = `$${(data.totalUsd || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (donorCountEl) donorCountEl.textContent = (data.totalDonors || 0).toLocaleString();
    if (goalProgressEl) {
      const goalPct = Math.min(100, Math.round(((data.totalUsd || 0) / (data.goalUsd || 1500)) * 100));
      goalProgressEl.textContent = `${goalPct}%`;
    }

    renderDonationsTable(allDonationsData);

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        const q = searchInput.value.toLowerCase().trim();
        if (!q) {
          renderDonationsTable(allDonationsData);
          return;
        }
        const filtered = allDonationsData.filter(d =>
          (d.donorName || "").toLowerCase().includes(q) ||
          (d.donorEmail || "").toLowerCase().includes(q) ||
          (d.transactionId || "").toLowerCase().includes(q) ||
          (d.paymentMethod || "").toLowerCase().includes(q)
        );
        renderDonationsTable(filtered);
      });
    }

  } catch (err) {
    console.warn("Could not fetch donations list:", err);
    if (emptyState) emptyState.style.display = "block";
    if (tbody) tbody.innerHTML = "";
  }
};

function renderDonationsTable(donations) {
  const tbody = document.getElementById("donations-list-body");
  const emptyState = document.getElementById("donations-empty-state");
  const table = document.getElementById("donations-table");

  if (!tbody) return;

  if (!donations || donations.length === 0) {
    tbody.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    if (table) table.style.display = "none";
    return;
  }

  if (emptyState) emptyState.style.display = "none";
  if (table) table.style.display = "";

  const methodLabels = {
    card: "Credit/Debit Card",
    upi: "UPI",
    paypal: "PayPal",
    razorpay: "Razorpay",
    store_checkout: "Store Checkout",
    cards: "Card",
    netbanking: "Net Banking",
    cod: "COD"
  };

  tbody.innerHTML = donations.map(d => {
    const currSymbol = (d.currency || "USD") === "INR" ? "₹" : "$";
    const amountDisplay = `${currSymbol}${(d.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const usdDisplay = `$${(d.amountInUsd || d.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const method = methodLabels[(d.paymentMethod || "").toLowerCase()] || (d.paymentMethod || "Unknown");
    const dateStr = d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : "—";
    const statusClass = (d.paymentStatus || "").toUpperCase() === "SUCCESS" ? "status-active" : "status-pending";
    const statusText = d.paymentStatus || "Pending";

    return `
      <tr>
        <td><strong>${window.escapeHtml(d.donorName || 'Anonymous')}</strong></td>
        <td>${window.escapeHtml(d.donorEmail || '—')}</td>
        <td class="font-bold">${amountDisplay}</td>
        <td class="text-green font-semibold">${usdDisplay}</td>
        <td><span class="badge badge-type">${method}</span></td>
        <td><code class="font-mono text-xs">${window.escapeHtml(d.transactionId || '—')}</code></td>
        <td>${dateStr}</td>
        <td><span class="status-pill ${statusClass}">${statusText}</span></td>
      </tr>
    `;
  }).join("");
}
