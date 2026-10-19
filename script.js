const STORAGE_KEY = "pocketpal_transactions_v1";
const categories = {
  income: [
    { value: "Salary", label: "💼 Salary" },
    { value: "Allowance", label: "🪙 Allowance" },
    { value: "Freelance", label: "💻 Freelance" },
    { value: "Gift", label: "🎁 Gift" },
    { value: "Other income", label: "✨ Other income" }
  ],
  expense: [
    { value: "Food", label: "🍜 Food & drinks" },
    { value: "Travel", label: "🚌 Travel" },
    { value: "Shopping", label: "🛍️ Shopping" },
    { value: "Education", label: "📚 Education" },
    { value: "Bills", label: "🧾 Bills" },
    { value: "Entertainment", label: "🎬 Entertainment" },
    { value: "Health", label: "💊 Health" },
    { value: "Other expense", label: "✨ Other expense" }
  ]
};
const categoryMeta = {
  Salary: ["💼", "#eae4ff"], Allowance: ["🪙", "#fff1d8"], Freelance: ["💻", "#e0f6ff"],
  Gift: ["🎁", "#ffe8ee"], "Other income": ["✨", "#f0eaff"], Food: ["🍜", "#ffeadf"],
  Travel: ["🚌", "#e3f3ff"], Shopping: ["🛍️", "#fce5f0"], Education: ["📚", "#e8e5ff"],
  Bills: ["🧾", "#e3f8ee"], Entertainment: ["🎬", "#fff1d8"], Health: ["💊", "#ffe8e8"],
  "Other expense": ["✨", "#f0eaff"]
};

const $ = (selector) => document.querySelector(selector);
const transactionList = $("#transactionList");
const modalBackdrop = $("#modalBackdrop");
const transactionForm = $("#transactionForm");
let transactions = loadTransactions();
let showAll = false;
let toastTimer;

function loadTransactions() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter(isValidTransaction) : [];
  } catch (error) {
    console.warn("Could not read saved transactions:", error);
    return [];
  }
}
function isValidTransaction(item) {
  return item && typeof item.id === "string" &&
    ["income", "expense"].includes(item.type) &&
    Number.isFinite(Number(item.amount)) && Number(item.amount) > 0 &&
    typeof item.description === "string" && typeof item.category === "string";
}
function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    showToast("Could not save data in this browser.");
  }
}
function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 2
  }).format(value);
}
function dateToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
function displayDate(value) {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}
function totals(items = transactions) {
  return items.reduce((result, item) => {
    result[item.type] += Number(item.amount);
    return result;
  }, { income: 0, expense: 0 });
}
function currentMonthItems() {
  const prefix = dateToday().slice(0, 7);
  return transactions.filter((item) => item.date && item.date.startsWith(prefix));
}
function renderSummary() {
  const total = totals();
  $("#balanceAmount").textContent = money(total.income - total.expense);
  $("#incomeAmount").textContent = money(total.income);
  $("#expenseAmount").textContent = money(total.expense);
  const thisMonth = currentMonthItems().filter((item) => item.type === "expense");
  $("#monthExpenseAmount").textContent = money(totals(thisMonth).expense);
  $("#monthPill").textContent = new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  $("#chartMonthLabel").textContent = new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}
function renderTransactions() {
  const query = $("#searchInput").value.trim().toLowerCase();
  const type = $("#typeFilter").value;
  const filtered = [...transactions]
    .filter((item) => type === "all" || item.type === type)
    .filter((item) => `${item.description} ${item.category} ${item.type}`.toLowerCase().includes(query))
    .sort((a, b) => `${b.date}${b.createdAt || ""}`.localeCompare(`${a.date}${a.createdAt || ""}`));
  const visible = showAll ? filtered : filtered.slice(0, 6);
  transactionList.innerHTML = visible.map((item) => {
    const meta = categoryMeta[item.category] || ["✦", "#f0eaff"];
    const sign = item.type === "income" ? "+" : "−";
    return `<tr>
      <td><div class="transaction-info"><span class="transaction-icon" style="background:${meta[1]}">${meta[0]}</span><div><strong>${escapeHTML(item.description)}</strong><small>${escapeHTML(item.type === "income" ? "Income" : "Expense")}</small></div></div></td>
      <td>${escapeHTML(item.category)}</td>
      <td>${displayDate(item.date)}</td>
      <td class="align-right ${item.type === "income" ? "amount-positive" : "amount-negative"}">${sign}${money(Number(item.amount))}</td>
      <td><button class="delete-btn" data-delete="${escapeHTML(item.id)}" aria-label="Delete ${escapeHTML(item.description)}" title="Delete transaction">×</button></td>
    </tr>`;
  }).join("");
  const isEmpty = filtered.length === 0;
  $("#emptyState").classList.toggle("show", isEmpty);
  transactionList.closest("table").style.display = isEmpty ? "none" : "table";
  $("#transactionCount").textContent = `${filtered.length} transaction${filtered.length === 1 ? "" : "s"}${query || type !== "all" ? " found" : ""}`;
  $("#viewAllBtn").style.display = filtered.length > 6 ? "inline-block" : "none";
  $("#viewAllBtn").innerHTML = showAll ? 'Show less <span>↑</span>' : 'View all <span>→</span>';
}
function renderChart() {
  const expenses = currentMonthItems().filter((item) => item.type === "expense");
  const daily = Array.from({ length: 14 }, (_, index) => {
    const day = index + 1;
    return expenses.filter((item) => Number(item.date.slice(8, 10)) === day).reduce((sum, item) => sum + Number(item.amount), 0);
  });
  const max = Math.max(...daily, 1);
  const chart = $("#barChart");
  if (!expenses.length) {
    chart.innerHTML = '<div class="chart-placeholder">Add expenses to see your monthly chart</div>';
    return;
  }
  chart.innerHTML = daily.map((amount, index) => {
    const height = amount ? Math.max(8, (amount / max) * 100) : 3;
    return `<div class="bar" style="height:${height}%" title="Day ${index + 1}: ${money(amount)}" aria-label="Day ${index + 1}: ${money(amount)}"></div>`;
  }).join("");
}
function renderCategories() {
  const expenses = currentMonthItems().filter((item) => item.type === "expense");
  const sums = {};
  expenses.forEach((item) => { sums[item.category] = (sums[item.category] || 0) + Number(item.amount); });
  const sorted = Object.entries(sums).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const total = sorted.reduce((sum, entry) => sum + entry[1], 0);
  if (!sorted.length) {
    $("#categoryList").innerHTML = '<p class="category-empty">Your category breakdown will appear here.</p>';
    return;
  }
  $("#categoryList").innerHTML = sorted.map(([category, amount]) => {
    const meta = categoryMeta[category] || ["✦", "#f0eaff"];
    const percent = total ? Math.round(amount / total * 100) : 0;
    return `<div class="category-row">
      <span class="category-icon" style="background:${meta[1]}">${meta[0]}</span>
      <div><div class="category-name">${escapeHTML(category)}</div><div class="category-track"><div class="category-progress" style="width:${percent}%"></div></div></div>
      <span class="category-amount">${money(amount)}</span>
    </div>`;
  }).join("");
}
function render() {
  renderSummary();
  renderTransactions();
  renderChart();
  renderCategories();
}
function updateCategoryOptions() {
  const type = document.querySelector('input[name="type"]:checked').value;
  $("#categoryInput").innerHTML = categories[type].map((category) =>
    `<option value="${escapeHTML(category.value)}">${escapeHTML(category.label)}</option>`
  ).join("");
}
function openModal() {
  transactionForm.reset();
  $("#dateInput").value = dateToday();
  updateCategoryOptions();
  modalBackdrop.classList.add("open");
  modalBackdrop.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  setTimeout(() => $("#amountInput").focus(), 50);
}
function closeModal() {
  modalBackdrop.classList.remove("open");
  modalBackdrop.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}
function addTransaction(event) {
  event.preventDefault();
  const type = document.querySelector('input[name="type"]:checked').value;
  const amount = Number($("#amountInput").value);
  const description = $("#descriptionInput").value.trim();
  const category = $("#categoryInput").value;
  const date = $("#dateInput").value;
  if (!Number.isFinite(amount) || amount <= 0 || !description || !date || !category) {
    showToast("Please fill all fields with valid details.");
    return;
  }
  transactions.push({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type, amount, description, category, date, createdAt: new Date().toISOString()
  });
  saveTransactions();
  render();
  closeModal();
  showToast(type === "income" ? "Income added successfully!" : "Expense added successfully!");
}
function deleteTransaction(id) {
  const item = transactions.find((transaction) => transaction.id === id);
  if (!item) return;
  transactions = transactions.filter((transaction) => transaction.id !== id);
  saveTransactions();
  render();
  showToast("Transaction deleted.");
}

$("#openModalBtn").addEventListener("click", openModal);
$("#emptyAddBtn").addEventListener("click", openModal);
$("#closeModalBtn").addEventListener("click", closeModal);
$("#cancelBtn").addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", (event) => { if (event.target === modalBackdrop) closeModal(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeModal(); });
transactionForm.addEventListener("submit", addTransaction);
document.querySelectorAll('input[name="type"]').forEach((radio) => radio.addEventListener("change", updateCategoryOptions));
$("#searchInput").addEventListener("input", renderTransactions);
$("#typeFilter").addEventListener("change", renderTransactions);
$("#viewAllBtn").addEventListener("click", () => { showAll = !showAll; renderTransactions(); });
transactionList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete]");
  if (button) deleteTransaction(button.dataset.delete);
});
$("#clearAllBtn").addEventListener("click", () => {
  if (!transactions.length) { showToast("There are no transactions to clear."); return; }
  if (confirm("Delete all transactions? This cannot be undone.")) {
    transactions = [];
    saveTransactions();
    render();
    showToast("All transactions cleared.");
  }
});
$("#todayLabel").textContent = new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" }).toUpperCase();
$("#dateInput").value = dateToday();
updateCategoryOptions();
render();
