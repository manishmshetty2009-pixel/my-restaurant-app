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

// PIN
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
  loadStaff();
  loadRestaurantStatus();
  loadRevenue();
  loadExpenses();
}

// RESTAURANT STATUS
function openRestaurant() {
  const today = new Date().toISOString().split("T")[0];
  db.collection("restaurantStatus").doc(today).set({
    openTime: new Date(),
    status: "open"
  }, { merge: true });
  loadRestaurantStatus();
}

function closeRestaurant() {
  const today = new Date().toISOString().split("T")[0];
  db.collection("restaurantStatus").doc(today).set({
    closeTime: new Date(),
    status: "closed"
  }, { merge: true });
  loadRestaurantStatus();
}

function loadRestaurantStatus() {
  const today = new Date().toISOString().split("T")[0];
  db.collection("restaurantStatus").doc(today).get().then(doc => {
    if (!doc.exists) return;
    const d = doc.data();
    statusInfo.innerHTML =
      `Status: ${d.status}<br>
       Open: ${d.openTime ? d.openTime.toDate().toLocaleTimeString() : "-"}<br>
       Close: ${d.closeTime ? d.closeTime.toDate().toLocaleTimeString() : "-"}`;
  });
}

// STAFF
function generateStaffId() {
  return "STF" + Math.floor(1000 + Math.random() * 9000);
}

function addStaff() {
  if (!staffName.value || !staffWage.value) return alert("Enter details");
  const id = generateStaffId();

  db.collection("staff").doc(id).set({
    name: staffName.value,
    dailyWage: parseFloat(staffWage.value)
  }).then(() => {
    staffName.value = "";
    staffWage.value = "";
    loadStaff();
  });
}

function loadStaff() {
  db.collection("staff").get().then(snapshot => {
    let html = "";
    snapshot.forEach(doc => {
      const d = doc.data();
      html += `
        <div>
          <b>${doc.id}</b> - ${d.name} (₹${d.dailyWage})
          <div id="qr-${doc.id}"></div>
        </div>`;
    });
    staffList.innerHTML = html;
    snapshot.forEach(doc => {
      new QRCode(document.getElementById("qr-" + doc.id), doc.id);
    });
  });
}

// ATTENDANCE
document.getElementById("reportType").addEventListener("change", function () {
  monthPicker.style.display = this.value === "monthly" ? "block" : "none";
  yearPicker.style.display = this.value === "yearly" ? "block" : "none";
});

function loadReport() {
  const type = reportType.value;
  if (type === "daily") loadPeriod(new Date().toISOString().split("T")[0]);
  if (type === "monthly") loadPeriod(monthPicker.value);
  if (type === "yearly") loadPeriod(yearPicker.value);
}

function loadPeriod(prefix) {

  if (!prefix) return alert("Select period");

  db.collection("attendance").get().then(snapshot => {

    let staffDays = {};

    snapshot.forEach(doc => {
      const d = doc.data();
      if (d.date.startsWith(prefix) && d.salaryEligible) {
        if (!staffDays[d.staffId]) staffDays[d.staffId] = 0;
        staffDays[d.staffId]++;
      }
    });

    db.collection("staff").get().then(staffSnap => {

      let html = "";
      let totalSalary = 0;

      staffSnap.forEach(staffDoc => {

        const id = staffDoc.id;
        const wage = staffDoc.data().dailyWage;
        const days = staffDays[id] || 0;
        const salary = days * wage;

        totalSalary += salary;

        html += `${id} — Days: ${days} — Salary: ₹ ${salary}<br>`;
      });

      attendanceReport.innerHTML = html;
      salarySummary.innerHTML = "Total Salary: ₹ " + totalSalary;
      calculateProfit();
    });
  });
}

// REVENUE
function loadRevenue() {
  const today = new Date().toISOString().split("T")[0];
  let total = 0;

  db.collection("sales").get().then(snapshot => {
    snapshot.forEach(doc => {
      const d = doc.data();
      const saleDate = d.date?.toDate().toISOString().split("T")[0];
      if (saleDate === today) total += d.total;
    });
    revenueSummary.innerHTML = "Today Revenue: ₹ " + total;
    calculateProfit();
  });
}

// EXPENSE
function addExpense() {
  if (!expenseAmount.value || !expenseReason.value)
    return alert("Enter details");

  const today = new Date().toISOString().split("T")[0];

  db.collection("expenses").add({
    amount: parseFloat(expenseAmount.value),
    reason: expenseReason.value,
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

// PROFIT
function calculateProfit() {

  const revenue = parseFloat(revenueSummary.innerText.replace(/[^\d.]/g, "")) || 0;
  const expense = parseFloat(expenseSummary.innerText.replace(/[^\d.]/g, "")) || 0;
  const salary = parseFloat(salarySummary.innerText.replace(/[^\d.]/g, "")) || 0;

  const profit = revenue - expense - salary;

  profitSummary.innerHTML =
    `Net Profit: ₹ ${profit}`;
}

// DAILY CLOSING
function saveClosing() {
  const today = new Date().toISOString().split("T")[0];
  const cash = parseFloat(cashInput.value) || 0;
  const online = parseFloat(onlineInput.value) || 0;
  const total = cash + online;

  db.collection("dailyClosing").doc(today).set({ cash, online, total });

  closingSummary.innerHTML =
    `Total: ₹ ${total}<br>Cash: ₹ ${cash}<br>Online: ₹ ${online}`;
}

// FULL PDF
async function downloadFullReport() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 10;

  doc.text("Restaurant Business Report", 10, y);
  y += 10;

  const sections = [
    attendanceReport.innerText,
    salarySummary.innerText,
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

// ================= PROFIT REPORT ENGINE =================

document.getElementById("profitType").addEventListener("change", function () {

  if (this.value === "monthly") {
    profitMonth.style.display = "block";
    profitYear.style.display = "none";
  } else {
    profitMonth.style.display = "none";
    profitYear.style.display = "block";
  }

});

function loadProfitReport() {

  const type = profitType.value;
  let prefix = "";

  if (type === "monthly") {
    if (!profitMonth.value) return alert("Select month");
    prefix = profitMonth.value;
  }

  if (type === "yearly") {
    if (!profitYear.value) return alert("Enter year");
    prefix = profitYear.value;
  }

  calculateProfitPeriod(prefix);
}

function calculateProfitPeriod(prefix) {

  let totalRevenue = 0;
  let totalExpense = 0;
  let totalSalary = 0;

  // REVENUE
  db.collection("sales").get().then(salesSnap => {

    salesSnap.forEach(doc => {
      const d = doc.data();
      const saleDate = d.date?.toDate().toISOString().split("T")[0];

      if (saleDate.startsWith(prefix)) {
        totalRevenue += d.total;
      }
    });

    // EXPENSE
    db.collection("expenses").get().then(expSnap => {

      expSnap.forEach(doc => {
        const d = doc.data();
        if (d.date.startsWith(prefix)) {
          totalExpense += d.amount;
        }
      });

      // SALARY
      db.collection("attendance").get().then(attSnap => {

        let staffDays = {};

        attSnap.forEach(doc => {

          const d = doc.data();

          if (d.date.startsWith(prefix) && d.salaryEligible) {

            if (!staffDays[d.staffId]) staffDays[d.staffId] = 0;
            staffDays[d.staffId]++;
          }
        });

        db.collection("staff").get().then(staffSnap => {

          staffSnap.forEach(staffDoc => {

            const id = staffDoc.id;
            const wage = staffDoc.data().dailyWage;
            const days = staffDays[id] || 0;

            totalSalary += days * wage;
          });

          const profit = totalRevenue - totalExpense - totalSalary;

          profitReport.innerHTML =
            `Revenue: ₹ ${totalRevenue}<br>
             Expense: ₹ ${totalExpense}<br>
             Salary: ₹ ${totalSalary}<br>
             <b>Net Profit: ₹ ${profit}</b>`;
        });
      });
    });
  });
}
