// 🔥 FIREBASE CONFIG
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

// ================= PIN =================

function unlock() {

  const pin = document.getElementById("pinInput").value;

  db.collection("settings").doc("ownerConfig").get()
    .then(doc => {

      if (!doc.exists) {
        if (pin === "1234") {
          db.collection("settings").doc("ownerConfig").set({ pin: "1234" });
          openDashboard();
        } else {
          alert("Default PIN is 1234");
        }
        return;
      }

      if (pin === doc.data().pin) {
        openDashboard();
      } else {
        alert("Wrong PIN");
      }

    });
}

function openDashboard() {
  lockScreen.style.display = "none";
  dashboard.style.display = "block";
  loadStaff();
  loadRestaurantStatus();
  loadRevenue();
}

// ================= RESTAURANT STATUS =================

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
  db.collection("restaurantStatus").doc(today).get()
    .then(doc => {
      if (!doc.exists) return;
      const d = doc.data();
      statusInfo.innerHTML = `
        Status: ${d.status || "-"} <br>
        Open: ${d.openTime ? d.openTime.toDate().toLocaleTimeString() : "-"} <br>
        Close: ${d.closeTime ? d.closeTime.toDate().toLocaleTimeString() : "-"}
      `;
    });
}

// ================= STAFF =================

function generateStaffId() {
  return "STF" + Math.floor(1000 + Math.random() * 9000);
}

function addStaff() {
  const name = staffName.value;
  const wage = parseFloat(staffWage.value);

  if (!name || !wage) return alert("Enter details");

  const id = generateStaffId();

  db.collection("staff").doc(id).set({
    name: name,
    dailyWage: wage
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
      const data = doc.data();
      html += `
        <div>
          <strong>${doc.id}</strong> - ${data.name} (₹${data.dailyWage})
          <div id="qr-${doc.id}"></div>
        </div>
      `;
    });

    staffList.innerHTML = html;

    snapshot.forEach(doc => {
      new QRCode(document.getElementById("qr-" + doc.id), doc.id);
    });
  });
}

// ================= ATTENDANCE REPORT =================

document.getElementById("reportType").addEventListener("change", function () {

  monthPicker.style.display =
    this.value === "monthly" ? "block" : "none";

  yearPicker.style.display =
    this.value === "yearly" ? "block" : "none";
});

function loadReport() {

  const type = reportType.value;

  if (type === "daily") loadDaily();
  if (type === "monthly") loadMonthly();
  if (type === "yearly") loadYearly();
}

function loadDaily() {

  const today = new Date().toISOString().split("T")[0];

  db.collection("attendance").where("date", "==", today).get()
    .then(snapshot => {

      let html = "";
      let totalSalary = 0;

      snapshot.forEach(doc => {
        const d = doc.data();
        html += `
          ${d.staffId} — ${d.totalHours?.toFixed(2) || 0} hrs —
          ${d.salaryEligible ? "Eligible" : "Not Eligible"} <br>
        `;
        if (d.salaryEligible) totalSalary++;
      });

      attendanceReport.innerHTML = html;
      salarySummary.innerHTML = "Today Eligible Staff: " + totalSalary;
    });
}

function loadMonthly() {

  const monthValue = monthPicker.value;
  if (!monthValue) return alert("Select month");

  const [year, month] = monthValue.split("-");
  calculatePeriod(year + "-" + month);
}

function loadYearly() {

  const year = yearPicker.value;
  if (!year) return alert("Enter year");

  calculatePeriod(year);
}

function calculatePeriod(prefix) {

  db.collection("attendance").get().then(snapshot => {

    let staffData = {};

    snapshot.forEach(doc => {

      const d = doc.data();

      if (d.date.startsWith(prefix) && d.salaryEligible) {

        if (!staffData[d.staffId]) staffData[d.staffId] = 0;
        staffData[d.staffId]++;
      }
    });

    db.collection("staff").get().then(staffSnap => {

      let html = "";
      let totalSalary = 0;

      staffSnap.forEach(staffDoc => {

        const id = staffDoc.id;
        const wage = staffDoc.data().dailyWage;

        const days = staffData[id] || 0;
        const salary = days * wage;

        totalSalary += salary;

        html += `${id} — Days: ${days} — Salary: ₹ ${salary} <br>`;
      });

      attendanceReport.innerHTML = html;
      salarySummary.innerHTML = "Total Salary: ₹ " + totalSalary;
    });
  });
}

// ================= REVENUE =================

function loadRevenue() {

  const today = new Date().toISOString().split("T")[0];
  let total = 0;

  db.collection("sales").get().then(snapshot => {

    snapshot.forEach(doc => {
      const d = doc.data();
      const saleDate = d.date?.toDate().toISOString().split("T")[0];
      if (saleDate === today) total += d.total;
    });

    revenueSummary.innerHTML = "Today Revenue: ₹ " + total.toFixed(2);
  });
}

// ================= DAILY CLOSING =================

function saveClosing() {

  const today = new Date().toISOString().split("T")[0];

  const cash = parseFloat(cashInput.value) || 0;
  const online = parseFloat(onlineInput.value) || 0;

  const total = cash + online;

  db.collection("dailyClosing").doc(today).set({
    cash, online, total
  });

  closingSummary.innerHTML =
    `Total: ₹ ${total} <br> Cash: ₹ ${cash} <br> Online: ₹ ${online}`;
}

// ================= FULL REPORT PDF =================

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
