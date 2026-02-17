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

// ================= PIN SYSTEM =================

function unlock() {

  const enteredPin = document.getElementById("pinInput").value;

  db.collection("settings").doc("ownerConfig").get()
    .then(doc => {

      // First time setup
      if (!doc.exists) {
        if (enteredPin === "1234") {
          db.collection("settings").doc("ownerConfig").set({
            pin: "1234"
          });
          openDashboard();
        } else {
          alert("Default PIN is 1234");
        }
        return;
      }

      const savedPin = doc.data().pin;

      if (enteredPin === savedPin) {
        openDashboard();
      } else {
        alert("Wrong PIN");
      }

    });
}

function openDashboard() {
  document.getElementById("lockScreen").style.display = "none";
  document.getElementById("dashboard").style.display = "block";

  loadStaff();
  loadRestaurantStatus();
  loadRevenue();
}

// ================= RESTAURANT STATUS =================

function openRestaurant() {

  const today = new Date().toISOString().split("T")[0];

  db.collection("restaurantStatus").doc(today).set({
    date: today,
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

      if (!doc.exists) {
        document.getElementById("statusInfo").innerHTML = "No status set today.";
        return;
      }

      const data = doc.data();

      document.getElementById("statusInfo").innerHTML = `
        Status: ${data.status || "-"} <br>
        Open Time: ${data.openTime ? data.openTime.toDate().toLocaleTimeString() : "-"} <br>
        Close Time: ${data.closeTime ? data.closeTime.toDate().toLocaleTimeString() : "-"}
      `;
    });
}

// ================= STAFF MANAGEMENT =================

function generateStaffId() {
  return "STF" + Math.floor(1000 + Math.random() * 9000);
}

function addStaff() {

  const name = document.getElementById("staffName").value;
  const wage = parseFloat(document.getElementById("staffWage").value);

  if (!name || !wage) {
    alert("Enter all details");
    return;
  }

  const id = generateStaffId();

  db.collection("staff").doc(id).set({
    name: name,
    dailyWage: wage
  }).then(() => {

    document.getElementById("staffName").value = "";
    document.getElementById("staffWage").value = "";

    loadStaff();
  });
}

function loadStaff() {

  db.collection("staff").get().then(snapshot => {

    let html = "";

    snapshot.forEach(doc => {

      const data = doc.data();

      html += `
        <div style="margin-bottom:15px;">
          <strong>${doc.id}</strong> - ${data.name} (₹${data.dailyWage})
          <div id="qr-${doc.id}"></div>
        </div>
      `;
    });

    document.getElementById("staffList").innerHTML = html;

    snapshot.forEach(doc => {
      new QRCode(document.getElementById("qr-" + doc.id), doc.id);
    });

  });
}

// ================= REVENUE SUMMARY =================

function loadRevenue() {

  const today = new Date().toISOString().split("T")[0];
  let total = 0;

  db.collection("sales").get().then(snapshot => {

    snapshot.forEach(doc => {

      const data = doc.data();
      const saleDate = data.date?.toDate().toISOString().split("T")[0];

      if (saleDate === today) {
        total += data.total;
      }
    });

    document.getElementById("revenueSummary").innerHTML =
      "Today Revenue: ₹ " + total.toFixed(2);
  });
}

// ================= REPORT TYPE UI CONTROL =================

document.getElementById("reportType").addEventListener("change", function () {

  const type = this.value;

  document.getElementById("monthPicker").style.display =
    type === "monthly" ? "block" : "none";

  document.getElementById("yearPicker").style.display =
    type === "yearly" ? "block" : "none";
});

// ================= LOAD REPORT =================

function loadReport() {

  const type = document.getElementById("reportType").value;

  if (type === "daily") {
    loadDailyReport();
  }

  if (type === "monthly") {
    loadMonthlyReport();
  }

  if (type === "yearly") {
    loadYearlyReport();
  }
}

// ================= DAILY REPORT =================

function loadDailyReport() {

  const today = new Date().toISOString().split("T")[0];

  db.collection("attendance")
    .where("date", "==", today)
    .get()
    .then(snapshot => {

      let html = "";
      let totalSalary = 0;

      snapshot.forEach(doc => {

        const data = doc.data();

        html += `
          <div>
            ${data.staffId} —
            ${data.totalHours?.toFixed(2) || 0} hrs —
            ${data.salaryEligible ? "Eligible" : "Not Eligible"}
          </div>
        `;

        if (data.salaryEligible) {
          totalSalary++;
        }
      });

      document.getElementById("attendanceReport").innerHTML = html;
      document.getElementById("salarySummary").innerHTML =
        "Today Eligible Staff Count: " + totalSalary;
    });
}

// ================= MONTHLY REPORT =================

function loadMonthlyReport() {

  const monthValue = document.getElementById("monthPicker").value;

  if (!monthValue) {
    alert("Select month first");
    return;
  }

  const [year, month] = monthValue.split("-");

  db.collection("attendance").get().then(snapshot => {

    let staffData = {};

    snapshot.forEach(doc => {

      const data = doc.data();
      const date = data.date;

      if (date.startsWith(year + "-" + month)) {

        if (!staffData[data.staffId]) {
          staffData[data.staffId] = {
            daysWorked: 0
          };
        }

        if (data.salaryEligible) {
          staffData[data.staffId].daysWorked++;
        }
      }
    });

    generateMonthlyHTML(staffData);
  });
}

function generateMonthlyHTML(staffData) {

  let html = "";
  let totalSalary = 0;

  db.collection("staff").get().then(staffSnapshot => {

    staffSnapshot.forEach(staffDoc => {

      const id = staffDoc.id;
      const wage = staffDoc.data().dailyWage;

      const days = staffData[id]?.daysWorked || 0;
      const salary = days * wage;

      totalSalary += salary;

      html += `
        <div>
          ${id} — Days: ${days} — Salary: ₹ ${salary}
        </div>
      `;
    });

    document.getElementById("attendanceReport").innerHTML = html;
    document.getElementById("salarySummary").innerHTML =
      "Monthly Salary Total: ₹ " + totalSalary;
  });
}

// ================= YEARLY REPORT =================

function loadYearlyReport() {

  const year = document.getElementById("yearPicker").value;

  if (!year) {
    alert("Enter year first");
    return;
  }

  db.collection("attendance").get().then(snapshot => {

    let staffData = {};

    snapshot.forEach(doc => {

      const data = doc.data();

      if (data.date.startsWith(year)) {

        if (!staffData[data.staffId]) {
          staffData[data.staffId] = {
            daysWorked: 0
          };
        }

        if (data.salaryEligible) {
          staffData[data.staffId].daysWorked++;
        }
      }
    });

    generateYearlyHTML(staffData);
  });
}

function generateYearlyHTML(staffData) {

  let html = "";
  let totalSalary = 0;

  db.collection("staff").get().then(staffSnapshot => {

    staffSnapshot.forEach(staffDoc => {

      const id = staffDoc.id;
      const wage = staffDoc.data().dailyWage;

      const days = staffData[id]?.daysWorked || 0;
      const salary = days * wage;

      totalSalary += salary;

      html += `
        <div>
          ${id} — Days: ${days} — Salary: ₹ ${salary}
        </div>
      `;
    });

    document.getElementById("attendanceReport").innerHTML = html;
    document.getElementById("salarySummary").innerHTML =
      "Yearly Salary Total: ₹ " + totalSalary;
  });
}
