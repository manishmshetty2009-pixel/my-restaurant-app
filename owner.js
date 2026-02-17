var firebaseConfig = {
  apiKey: "AIzaSyCQBOmA3OktohJKYCzbJxEORsshtsh-Zno",
  authDomain: "my-restaurant-7badd.firebaseapp.com",
  projectId: "my-restaurant-7badd",
  storageBucket: "my-restaurant-7badd.appspot.com",
  messagingSenderId: "588063103672",
  appId: "1:588063103672:web:ace926af186843cb56724d"
};

firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();

/* ================= PIN ================= */

function unlock() {
  const pin = pinInput.value;

  db.collection("settings").doc("ownerConfig").get().then(doc => {

    if (!doc.exists) {
      if (pin === "1234") {
        db.collection("settings").doc("ownerConfig").set({ pin: "1234" });
        openDashboard();
      } else alert("Default PIN is 1234");
      return;
    }

    if (pin === doc.data().pin) openDashboard();
    else alert("Wrong PIN");

  });
}

function openDashboard() {
  lockScreen.style.display = "none";
  dashboard.style.display = "block";
  loadRevenue();
  loadExpenses();
}

/* ================= DAILY CLOSING ================= */

function saveClosing() {

  const today = new Date().toISOString().split("T")[0];
  const cash = parseFloat(cashInput.value) || 0;
  const online = parseFloat(onlineInput.value) || 0;
  const total = cash + online;

  db.collection("dailyClosing").doc(today).set({
    cash: cash,
    online: online,
    total: total
  });

  closingSummary.innerHTML =
    `Total: ₹ ${total}<br>Cash: ₹ ${cash}<br>Online: ₹ ${online}`;
}

/* ================= REVENUE ================= */

function loadRevenue() {

  const today = new Date().toISOString().split("T")[0];
  let total = 0;

  db.collection("sales").get().then(snapshot => {

    snapshot.forEach(doc => {
      const d = doc.data();
      const date = d.date?.toDate().toISOString().split("T")[0];
      if (date === today) total += d.total;
    });

    revenueSummary.innerHTML = "Today Revenue: ₹ " + total;
    calculateProfit();
  });
}

/* ================= EXPENSE ================= */

function addExpense() {

  const today = new Date().toISOString().split("T")[0];
  const amount = parseFloat(expenseAmount.value);
  const reason = expenseReason.value;

  if (!amount || !reason) return alert("Enter details");

  db.collection("expenses").add({
    amount: amount,
    reason: reason,
    date: today
  }).then(() => {
    expenseAmount.value = "";
    expenseReason.value = "";
    loadExpenses();
  });
}

function loadExpenses() {

  const today = new Date().toISOString().split("T")[0];
  let total = 0;
  let html = "";

  db.collection("expenses").where("date", "==", today).get()
    .then(snapshot => {

      snapshot.forEach(doc => {
        const d = doc.data();
        total += d.amount;
        html += `₹ ${d.amount} — ${d.reason}<br>`;
      });

      expenseSummary.innerHTML =
        html + "<b>Total Expense: ₹ " + total + "</b>";

      calculateProfit();
    });
}

/* ================= PROFIT ================= */

function calculateProfit() {

  const revenue = parseFloat(revenueSummary.innerText.replace(/[^\d.]/g, "")) || 0;
  const expense = parseFloat(expenseSummary.innerText.replace(/[^\d.]/g, "")) || 0;

  const profit = revenue - expense;

  profitSummary.innerHTML =
    "<b>Net Profit: ₹ " + profit + "</b>";
}

/* ================= CHART DASHBOARD ================= */

function loadMonthlyCharts() {

  const year = new Date().getFullYear();
  let revenueData = Array(12).fill(0);
  let expenseData = Array(12).fill(0);
  let profitData = Array(12).fill(0);

  db.collection("sales").get().then(salesSnap => {

    salesSnap.forEach(doc => {
      const d = doc.data();
      const date = d.date?.toDate();
      if (date && date.getFullYear() === year) {
        revenueData[date.getMonth()] += d.total;
      }
    });

    db.collection("expenses").get().then(expSnap => {

      expSnap.forEach(doc => {
        const d = doc.data();
        const parts = d.date.split("-");
        const date = new Date(parts[0], parts[1] - 1);
        if (date.getFullYear() === year) {
          expenseData[date.getMonth()] += d.amount;
        }
      });

      for (let i = 0; i < 12; i++) {
        profitData[i] = revenueData[i] - expenseData[i];
      }

      renderCharts(revenueData, expenseData, profitData);
    });
  });
}

function renderCharts(revenueData, expenseData, profitData) {

  const months = ["Jan","Feb","Mar","Apr","May","Jun",
                  "Jul","Aug","Sep","Oct","Nov","Dec"];

  new Chart(revenueChart, {
    type: "bar",
    data: { labels: months, datasets: [{ label: "Revenue", data: revenueData }] }
  });

  new Chart(expenseChart, {
    type: "bar",
    data: { labels: months, datasets: [{ label: "Expense", data: expenseData }] }
  });

  new Chart(profitChart, {
    type: "bar",
    data: { labels: months, datasets: [{ label: "Profit", data: profitData }] }
  });
}

/* ================= FULL PDF ================= */

async function downloadFullReport() {

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 10;

  doc.text("Restaurant Business Report", 10, y);
  y += 10;

  const sections = [
    revenueSummary.innerText,
    expenseSummary.innerText,
    profitSummary.innerText,
    closingSummary.innerText
  ];

  sections.forEach(text => {
    if (!text) return;
    const lines = doc.splitTextToSize(text, 180);
    doc.text(lines, 10, y);
    y += lines.length * 6 + 5;
  });

  doc.save("business_report.pdf");
        }
