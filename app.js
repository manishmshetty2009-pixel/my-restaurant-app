// 🔥 REPLACE WITH YOUR FIREBASE VALUES
var firebaseConfig = {
  apiKey: "AIzaSyCQBOmA3OktohJKYCzbJxEORsshtsh-Zno",
  authDomain: "my-restaurant-7badd.firebaseapp.com",
  projectId: "my-restaurant-7badd",
  storageBucket: "my-restaurant-7badd.appspot.com",
  messagingSenderId: "588063103672",
  appId: "1:588063103672:web:ace926af186843cb56724d",
  measurementId: "G-ZD9DZKNZLB"
};

firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();
var auth = firebase.auth();

// ================= LOGIN =================

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      document.getElementById("loginBox").style.display = "none";
      document.getElementById("dashboard").style.display = "block";
    })
    .catch(error => {
      document.getElementById("message").innerText = error.message;
    });
}

function logout() {
  auth.signOut();
  location.reload();
}

// ================= ADD ITEM =================

function addItem() {

  const name = document.getElementById("itemName").value;
  const type = document.getElementById("itemType").value;
  const cost = Number(document.getElementById("costPrice").value);
  const sell = Number(document.getElementById("sellingPrice").value);
  const qty = Number(document.getElementById("itemQty").value);

  const now = new Date();

  db.collection("items").add({
    name: name,
    type: type,
    costPrice: cost,
    sellingPrice: type === "sale" ? sell : 0,
    quantity: qty,
    date: now.toISOString().slice(0,10),
    month: now.getMonth()+1,
    year: now.getFullYear()
  }).then(()=>{
    alert("Item Added");
  });
}

// ================= REPORT LOGIC =================

function calculate(snapshot){

  let revenue = 0;
  let expense = 0;

  snapshot.forEach(doc => {
    const data = doc.data();

    if(data.type === "sale"){
      revenue += data.sellingPrice * data.quantity;
    } else {
      expense += data.costPrice * data.quantity;
    }
  });

  return {
    revenue: revenue,
    expense: expense,
    profit: revenue - expense
  };
}

function show(result, title){

  document.getElementById("report").innerHTML =
    "<h4>"+title+"</h4>" +
    "<p>Total Revenue: ₹"+result.revenue+"</p>" +
    "<p>Total Expense: ₹"+result.expense+"</p>" +
    "<p>Net Profit: ₹"+result.profit+"</p>";
}

// ================= DAILY =================

function generateDaily(){

  const today = new Date().toISOString().slice(0,10);

  db.collection("items")
    .where("date","==",today)
    .get()
    .then(snapshot=>{
      show(calculate(snapshot),"Daily Report");
    });
}

// ================= MONTHLY =================

function generateMonthly(){

  const now = new Date();
  const month = now.getMonth()+1;
  const year = now.getFullYear();

  db.collection("items")
    .where("month","==",month)
    .where("year","==",year)
    .get()
    .then(snapshot=>{
      show(calculate(snapshot),"Monthly Report");
    });
}

// ================= YEARLY =================

function generateYearly(){

  const year = new Date().getFullYear();

  db.collection("items")
    .where("year","==",year)
    .get()
    .then(snapshot=>{
      show(calculate(snapshot),"Yearly Report");
    });
}

// ================= PDF =================

function exportPDF(){

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const content = document.getElementById("report").innerText;

  doc.text(content, 20, 20);
  doc.save("Restaurant_Report.pdf");
}

// ================= QR SCANNER =================

let scanner;

function startScanner(){

  scanner = new Html5Qrcode("reader");

  scanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (decodedText) => {

      const now = new Date();

      db.collection("attendance").add({
        staff: decodedText,
        date: now.toISOString().slice(0,10),
        time: now.toLocaleTimeString()
      });

      alert("Attendance Marked");
    }
  );
}

function stopScanner(){
  if(scanner){
    scanner.stop();
  }
}
