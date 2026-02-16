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


// ================= SMART ADD / DEDUCT ITEM =================

function addItem() {

  const name = document.getElementById("itemName").value.trim();
  const type = document.getElementById("itemType").value;
  const cost = parseFloat(document.getElementById("costPrice").value) || 0;
  const selling = parseFloat(document.getElementById("sellingPrice").value) || 0;
  const qty = parseInt(document.getElementById("itemQty").value) || 0;

  if (!name || qty <= 0) {
    alert("Enter valid item name and quantity");
    return;
  }

  const stockRef = db.collection("items").where("name", "==", name);

  stockRef.get().then(snapshot => {

    if (snapshot.empty) {

      // New item
      db.collection("items").add({
        name: name,
        type: type,
        costPrice: cost,
        sellingPrice: selling,
        quantity: qty,
        createdAt: new Date()
      }).then(() => {
        alert("New Item Added ✅");
        loadStock();
      });

    } else {

      // Item exists → update quantity
      snapshot.forEach(doc => {

        const existingQty = doc.data().quantity;
        let newQty;

        if (type === "sale") {
          // Deduct stock
          newQty = existingQty - qty;

          if (newQty < 0) {
            alert("Not enough stock ❌");
            return;
          }

        } else {
          // Add stock
          newQty = existingQty + qty;
        }

        db.collection("items").doc(doc.id).update({
          quantity: newQty
        }).then(() => {
          alert("Stock Updated ✅");
          loadStock();
        });

      });

    }

  });

  // Clear fields
  document.getElementById("itemName").value = "";
  document.getElementById("costPrice").value = "";
  document.getElementById("sellingPrice").value = "";
  document.getElementById("itemQty").value = "";
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
