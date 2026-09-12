/**
 * SenpaiWorks Admin Console - Payments & Gateway Analytics Module
 * scripts/admin/admin-payments.js
 */

let allPaymentsData = [];

window.loadPayments = async function () {
  const tbody = document.getElementById("payments-list-body");
  const emptyState = document.getElementById("payments-empty-state");
  const totalVolEl = document.getElementById("payments-total-volume");
  const totalTxCountEl = document.getElementById("payments-tx-count");
  const upiVolEl = document.getElementById("payments-upi-volume");
  const cardVolEl = document.getElementById("payments-card-volume");
  const searchInput = document.getElementById("payments-search");
  const methodFilter = document.getElementById("payments-filter-method");

  if (!tbody) return;

  try {
    // Fetch orders and donations concurrently
    const [ordersRes, donationsRes] = await Promise.allSettled([
      fetch("/api/orders", { headers: localStorage.getItem("userToken") ? { "Authorization": `Bearer ${localStorage.getItem("userToken")}` } : {} }),
      fetch("/api/donate/list")
    ]);

    let ordersList = [];
    if (ordersRes.status === "fulfilled" && ordersRes.value.ok) {
      ordersList = await ordersRes.value.json();
    }

    let donationsList = [];
    if (donationsRes.status === "fulfilled" && donationsRes.value.ok) {
      const dData = await donationsRes.value.json();
      donationsList = dData.donations || [];
    }

    // Merge transactions into unified ledger
    const transactions = [];

    (Array.isArray(ordersList) ? ordersList : []).forEach(o => {
      const isDonation = (o.items || []).some(i => i && (i.isDonation || i.id === "DONATION" || (i.name && i.name.toLowerCase().includes("donation"))));
      const pmtId = o.razorpayPaymentId || o.paymentId || (o.paymentType === "Cash on Delivery (COD)" ? "COD-PENDING" : "—");
      const method = o.paymentType || (pmtId.startsWith("COD") ? "COD" : "Razorpay");
      const amt = Number(o.total || o.grandTotal || 0);

      transactions.push({
        id: o.orderNumber || o.orderId || o.id,
        type: isDonation ? "Donation" : "Store Order",
        customerName: o.guestName || (o.customer ? o.customer.username : (o.customerName || "Customer")),
        customerEmail: o.customerEmail || o.email || "—",
        amount: amt,
        currency: "INR",
        method: method,
        paymentId: pmtId,
        status: o.paymentStatus || (o.status === "Cancelled" ? "FAILED" : "PAID"),
        createdAt: o.createdAt || new Date().toISOString()
      });
    });

    donationsList.forEach(d => {
      // Avoid duplicate if already in orders
      if (d.transactionId && !transactions.some(t => t.paymentId === d.transactionId || t.id === d.orderId)) {
        transactions.push({
          id: d.orderId || `DON-${String(d.id).slice(-6)}`,
          type: "Donation",
          customerName: d.donorName || "Anonymous Patron",
          customerEmail: d.donorEmail || "—",
          amount: Number(d.amount || d.amountInUsd || 0),
          currency: d.currency || "INR",
          method: d.paymentMethod || "Razorpay UPI",
          paymentId: d.transactionId || "—",
          status: (d.paymentStatus || "SUCCESS").toUpperCase() === "SUCCESS" ? "PAID" : "PENDING",
          createdAt: d.createdAt || new Date().toISOString()
        });
      }
    });

    // Sort by newest first
    transactions.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    allPaymentsData = transactions;

    // Calculate analytics metrics
    const totalVolume = transactions.filter(t => t.status === "PAID").reduce((sum, t) => sum + t.amount, 0);
    const upiTransactions = transactions.filter(t => (t.method || "").toLowerCase().includes("upi"));
    const cardTransactions = transactions.filter(t => (t.method || "").toLowerCase().includes("card") || (t.method || "").toLowerCase().includes("razorpay"));
    const upiVolume = upiTransactions.reduce((sum, t) => sum + t.amount, 0);
    const cardVolume = cardTransactions.reduce((sum, t) => sum + t.amount, 0);

    if (totalVolEl) totalVolEl.textContent = `₹${totalVolume.toLocaleString('en-IN')}`;
    if (totalTxCountEl) totalTxCountEl.textContent = transactions.length.toLocaleString();
    if (upiVolEl) upiVolEl.textContent = `₹${upiVolume.toLocaleString('en-IN')}`;
    if (cardVolEl) cardVolEl.textContent = `₹${cardVolume.toLocaleString('en-IN')}`;

    renderPaymentsTable(allPaymentsData);

    const filterHandler = () => {
      const q = searchInput ? searchInput.value.toLowerCase().trim() : "";
      const m = methodFilter ? methodFilter.value.toLowerCase() : "";

      const filtered = allPaymentsData.filter(t => {
        const matchesQuery = !q || 
          t.id.toLowerCase().includes(q) ||
          t.customerName.toLowerCase().includes(q) ||
          t.customerEmail.toLowerCase().includes(q) ||
          t.paymentId.toLowerCase().includes(q);

        const matchesMethod = !m || t.method.toLowerCase().includes(m) || (m === "donation" && t.type === "Donation") || (m === "store" && t.type === "Store Order");

        return matchesQuery && matchesMethod;
      });

      renderPaymentsTable(filtered);
    };

    if (searchInput) searchInput.oninput = filterHandler;
    if (methodFilter) methodFilter.onchange = filterHandler;

  } catch (err) {
    console.warn("Could not load payments dashboard:", err);
    if (emptyState) emptyState.style.display = "block";
    if (tbody) tbody.innerHTML = "";
  }
};

function renderPaymentsTable(transactions) {
  const tbody = document.getElementById("payments-list-body");
  const emptyState = document.getElementById("payments-empty-state");
  const table = document.getElementById("payments-table");

  if (!tbody) return;

  if (!transactions || transactions.length === 0) {
    tbody.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    if (table) table.style.display = "none";
    return;
  }

  if (emptyState) emptyState.style.display = "none";
  if (table) table.style.display = "";

  tbody.innerHTML = transactions.map(t => {
    const isSuccess = t.status === "PAID" || t.status === "SUCCESS";
    const statusBadge = isSuccess
      ? `<span class="badge badge-success" style="background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 0.72rem;"><i class="fa-solid fa-circle-check"></i> Captured</span>`
      : `<span class="badge badge-warning" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 0.72rem;"><i class="fa-solid fa-clock"></i> ${window.escapeHtml(t.status)}</span>`;

    const typeBadge = t.type === "Donation"
      ? `<span style="background: rgba(239, 68, 68, 0.12); color: #ef4444; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 0.7rem;"><i class="fa-solid fa-heart"></i> Patron</span>`
      : `<span style="background: rgba(59, 130, 246, 0.12); color: #3b82f6; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 0.7rem;"><i class="fa-solid fa-shirt"></i> Store</span>`;

    const dateStr = t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "—";

    return `
      <tr>
        <td>
          <div style="font-weight: 800; color: var(--text-primary);">${window.escapeHtml(t.id)}</div>
          <div style="margin-top: 2px;">${typeBadge}</div>
        </td>
        <td>
          <div style="font-weight: 700; color: var(--text-primary);">${window.escapeHtml(t.customerName)}</div>
          <div style="font-size: 0.78rem; color: var(--text-secondary);">${window.escapeHtml(t.customerEmail)}</div>
        </td>
        <td style="font-weight: 800; font-size: 1rem; color: #10b981;">
          ₹${t.amount.toLocaleString('en-IN')}
        </td>
        <td>
          <div style="font-size: 0.85rem; font-weight: 600;">${window.escapeHtml(t.method)}</div>
        </td>
        <td>
          <code style="font-size: 0.78rem; color: var(--text-secondary); background: var(--bg-primary, #0f172a); padding: 3px 6px; border-radius: 4px; border: 1px solid var(--border-color, rgba(255,255,255,0.08));">${window.escapeHtml(t.paymentId)}</code>
        </td>
        <td>${statusBadge}</td>
        <td style="font-size: 0.8rem; color: var(--text-secondary);">${dateStr}</td>
      </tr>
    `;
  }).join("");
}
