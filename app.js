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
var auth = firebase.auth();

let currentUserRole = "";

// ================= LOGIN =================

function login() {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {

      const userEmail = userCredential.user.email;

      db.collection("users").doc(userEmail).get().then(doc => {

        if (doc.exists) {
          currentUserRole = doc.data().role;
        } else {
          currentUserRole = "staff"; // default
        }

        document.getElementById("userRole").innerText = currentUserRole;

        document.getElementById("loginBox").style.display = "none";
        document.getElementById("dashboard").style.display = "block";

        applyRolePermissions();
        loadStock();
      });

    })
    .catch(error => {
      document.getElementById("message").innerText = error.message;
    });
}

function logout() {
  auth.signOut();
  location.reload();
}

// ================= ROLE CONTROL =================

function applyRolePermissions() {

  if (currentUserRole === "owner") {
    // Full access
  }

  if (currentUserRole === "chef") {
    document.getElementById("reportSection").style.display = "none";
  }

  if (currentUserRole === "staff") {
    document.getElementById("stockSection").style.display = "none";
    document.getElementById("reportSection").style.display = "none";
  }
}

// ================= STOCK + SALES =================

function addItem() {

  const name = document.getElementById("itemName").value.trim();
  const type = document.getElementById("itemType").value;
  const cost = parseFloat(document.getElementById("costPrice").value) || 0;
  const sell = parseFloat(document.getElementById("sellingPrice").value) || 0;
  const qty = parseInt(document.getElementById("itemQty").value) || 0;

  if (!name || qty <= 0) return alert("Enter valid details");

  const ref = db.collection("items").where("name", "==", name);

  ref.get().then(snapshot => {

    if (snapshot.empty && type === "raw") {

      db.collection("items").add({
        name, costPrice: cost, sellingPrice: sell,
        quantity: qty
      });

    } else {

      snapshot.forEach(doc => {

        const data = doc.data();
        let newQty = data.quantity;

        if (type === "raw") {
          newQty += qty;
        } else {
          if (data.quantity < qty) return alert("Not enough stock");
          newQty -= qty;

          db.collection("sales").add({
            name,
            quantity: qty,
            total: data.sellingPrice * qty,
            date: new Date()
          });
        }

        db.collection("items").doc(doc.id).update({
          quantity: newQty
        });

      });

    }

    loadStock();
  });
}

// ================= LOAD STOCK =================

function loadStock() {

  db.collection("items").get().then(snapshot => {

    let html = "";

    snapshot.forEach(doc => {
      const d = doc.data();

      html += `
        <div class="card">
          <strong>${d.name}</strong><br>
          Quantity: ${d.quantity}
        </div>
      `;
    });

    document.getElementById("stockList").innerHTML = html;
  });
}

// ================= DAILY REPORT =================

function generateReport() {

  const today = new Date();
  today.setHours(0,0,0,0);

  db.collection("sales").get().then(snapshot => {

    let revenue = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      const d = data.date.toDate();
      d.setHours(0,0,0,0);

      if (d.getTime() === today.getTime()) {
        revenue += data.total;
      }
    });

    document.getElementById("report").innerHTML =
      "<h4>Total Revenue Today: ₹" + revenue + "</h4>";
  });
}

// ================= PDF =================

function exportPDF() {

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const content = document.getElementById("report").innerText;

  doc.setFontSize(40);
  doc.setTextColor(220);
  doc.text("MY RESTAURANT", 105, 140, { align: "center", angle: 45 });

  doc.setTextColor(0);
  doc.text(content, 20, 20);

  doc.save("Report.pdf");
}

// ================= QR =================

let scanner;

function startScanner() {

  scanner = new Html5Qrcode("reader");

  scanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    text => {

      db.collection("attendance").add({
        staff: text,
        time: new Date()
      });

      alert("Attendance marked");
    }
  );
}

function stopScanner() {
  if (scanner) scanner.stop();
}
