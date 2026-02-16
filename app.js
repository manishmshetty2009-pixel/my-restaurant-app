// ================= FIREBASE CONFIG =================

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
var auth = firebase.auth();


// ================= LOGIN =================

function login() {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      document.getElementById("loginBox").style.display = "none";
      document.getElementById("dashboard").style.display = "block";
      loadStock();
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
  const cost = parseFloat(document.getElementById("costPrice").value) || 0;
  const selling = parseFloat(document.getElementById("sellingPrice").value) || 0;
  const qty = parseInt(document.getElementById("itemQty").value) || 0;

  if (!name || qty <= 0) {
    alert("Please enter valid item name and quantity");
    return;
  }

  db.collection("items").add({
    name: name,
    type: type,
    costPrice: cost,
    sellingPrice: selling,
    quantity: qty,
    date: new Date()
  })
  .then(() => {
    alert("Item Added Successfully ✅");

    document.getElementById("itemName").value = "";
    document.getElementById("costPrice").value = "";
    document.getElementById("sellingPrice").value = "";
    document.getElementById("itemQty").value = "";

    loadStock();
  })
  .catch(error => {
    alert(error.message);
  });
}


// ================= LOAD STOCK =================

function loadStock() {

  db.collection("items").get()
  .then(snapshot => {

    let html = "";

    if (snapshot.empty) {
      html = "<p>No stock available</p>";
    }

    snapshot.forEach(doc => {

      const data = doc.data();

      html += `
        <div class="card">
          <strong>${data.name}</strong><br>
          Type: ${data.type}<br>
          Quantity: ${data.quantity}<br>
          Cost: ₹${data.costPrice}<br>
          Selling: ₹${data.sellingPrice}
        </div>
      `;
    });

    document.getElementById("stockList").innerHTML = html;
  });
}


// ================= DAILY REPORT =================

function generateReport() {

  db.collection("items").get()
  .then(snapshot => {

    let revenue = 0;
    let expense = 0;

    snapshot.forEach(doc => {

      const data = doc.data();

      if (data.type === "sale") {
        revenue += data.sellingPrice * data.quantity;
      } else {
        expense += data.costPrice * data.quantity;
      }
    });

    const profit = revenue - expense;

    document.getElementById("report").innerHTML = `
      <h4>Today's Summary</h4>
      <p>Total Revenue: ₹${revenue}</p>
      <p>Total Expense: ₹${expense}</p>
      <p>Net Profit: ₹${profit}</p>
    `;
  });
}


// ================= EXPORT PDF =================

function exportPDF() {

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const content = document.getElementById("report").innerText;

  doc.text("Restaurant Daily Report", 20, 20);
  doc.text(content, 20, 40);

  doc.save("Restaurant_Report.pdf");
}


// ================= QR ATTENDANCE =================

let scanner;

function startScanner() {

  scanner = new Html5Qrcode("reader");

  scanner.start(
    { facingMode: "environment" }, // back camera
    { fps: 10, qrbox: 250 },
    (decodedText) => {

      db.collection("attendance").add({
        staffId: decodedText,
        time: new Date()
      });

      alert("Attendance Marked for " + decodedText);
    }
  );
}

function stopScanner() {
  if (scanner) {
    scanner.stop();
  }
}
