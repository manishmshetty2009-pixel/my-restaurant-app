// 🔥 REPLACE WITH YOUR REAL FIREBASE VALUES
var firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MSG_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();
var auth = firebase.auth();

// ================= LOGIN =================

function login() {
  const email = emailInput("email");
  const password = emailInput("password");

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      showDashboard();
    })
    .catch(error => {
      document.getElementById("message").innerText = error.message;
    });
}

function logout() {
  auth.signOut();
  location.reload();
}

function showDashboard() {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
}

function emailInput(id){
  return document.getElementById(id).value;
}

// ================= ADD ITEM =================

function addItem() {

  const name = emailInput("itemName");
  const type = document.getElementById("itemType").value;
  const cost = Number(emailInput("costPrice"));
  const selling = Number(emailInput("sellingPrice"));
  const qty = Number(emailInput("itemQty"));

  const now = new Date();

  db.collection("items").add({
    name: name,
    type: type,
    costPrice: cost,
    sellingPrice: type === "sale" ? selling : 0,
    quantity: qty,
    date: now.toISOString().slice(0,10),
    month: now.getMonth()+1,
    year: now.getFullYear(),
    time: now.toLocaleTimeString()
  }).then(()=>{
    alert("Item Added Successfully");
  });
}

// ================= CALCULATE REPORT =================

function calculateReport(querySnapshot) {

  let revenue = 0;
  let expense = 0;

  querySnapshot.forEach(doc => {
    const data = doc.data();

    if (data.type === "sale") {
      revenue += data.sellingPrice * data.quantity;
    } else {
      expense += data.costPrice * data.quantity;
    }
  });

  const profit = revenue - expense;

  return { revenue, expense, profit };
}

// ================= DAILY REPORT =================

function generateReport() {

  const today = new Date().toISOString().slice(0,10);

  db.collection("items")
    .where("date", "==", today)
    .get()
    .then(snapshot => {

      const result = calculateReport(snapshot);

      showReport("Daily Report ("+today+")", result);
    });
}

// ================= MONTHLY REPORT =================

function generateMonthlyReport() {

  const now = new Date();
  const month = now.getMonth()+1;
  const year = now.getFullYear();

  db.collection("items")
    .where("month","==",month)
    .where("year","==",year)
    .get()
    .then(snapshot => {

      const result = calculateReport(snapshot);
      showReport("Monthly Report ("+month+"/"+year+")", result);
    });
}

// ================= YEARLY REPORT =================

function generateYearlyReport() {

  const year = new Date().getFullYear();

  db.collection("items")
    .where("year","==",year)
    .get()
    .then(snapshot => {

      const result = calculateReport(snapshot);
      showReport("Yearly Report ("+year+")", result);
    });
}

// ================= CUSTOM REPORT =================

function generateCustomReport(date) {

  db.collection("items")
    .where("date","==",date)
    .get()
    .then(snapshot => {

      const result = calculateReport(snapshot);
      showReport("Custom Report ("+date+")", result);
    });
}

// ================= SHOW REPORT =================

function showReport(title, result){

  document.getElementById("report").innerHTML = `
    <h4>${title}</h4>
    <p><strong>Total Revenue:</strong> ₹${result.revenue}</p>
    <p><strong>Total Expense:</strong> ₹${result.expense}</p>
    <p><strong>Net Profit:</strong> ₹${result.profit}</p>
  `;
}

// ================= PDF EXPORT =================

function exportTodayPDF() {

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const content = document.getElementById("report").innerText;

  doc.text("My Restaurant Report", 20, 20);
  doc.text(content, 20, 40);

  doc.save("Restaurant_Report.pdf");
}

// ================= QR ATTENDANCE =================

let qrScanner;

function startScanner() {

  qrScanner = new Html5Qrcode("reader");

  qrScanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    qrCodeMessage => {

      const now = new Date();

      db.collection("attendance").add({
        staff: qrCodeMessage,
        date: now.toISOString().slice(0,10),
        time: now.toLocaleTimeString()
      });

      alert("Attendance Marked");
    }
  );
}

function stopScanner() {
  if(qrScanner){
    qrScanner.stop();
  }
    }
