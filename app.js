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
  loadRestaurantName();
})
    .catch(error => {
      document.getElementById("message").innerText = error.message;
    });
}

function logout() {
  auth.signOut();
  location.reload();
}


// ================= PROFESSIONAL STOCK + SALES =================

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

  const itemsRef = db.collection("items").where("name", "==", name);

  itemsRef.get().then(snapshot => {

    if (snapshot.empty) {

      if (type === "sale") {
        alert("Item does not exist in stock ❌");
        return;
      }

      // New raw item
      db.collection("items").add({
        name: name,
        type: "raw",
        costPrice: cost,
        sellingPrice: selling,
        quantity: qty,
        createdAt: new Date()
      }).then(() => {
        alert("New Raw Item Added ✅");
        loadStock();
      });

    } else {

      snapshot.forEach(doc => {

        const data = doc.data();
        const existingQty = data.quantity;

        if (type === "raw") {

          // Increase stock
          const newQty = existingQty + qty;

          db.collection("items").doc(doc.id).update({
            quantity: newQty
          }).then(() => {
            alert("Stock Increased ✅");
            loadStock();
          });

        } else {

          // SALE LOGIC
          if (existingQty < qty) {
            alert("Not enough stock ❌");
            return;
          }

          const newQty = existingQty - qty;

          // Deduct stock
          db.collection("items").doc(doc.id).update({
            quantity: newQty
          });

          // Save sale record
          db.collection("sales").add({
            name: name,
            quantity: qty,
            sellingPrice: data.sellingPrice,
            total: data.sellingPrice * qty,
            date: new Date()
          }).then(() => {
            alert("Sale Recorded ✅");
            loadStock();
          });

        }

      });

    }

  });

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


// ================= PROFESSIONAL DAILY REPORT =================

function generateReport() {

  const today = new Date();
  today.setHours(0,0,0,0);

  db.collection("sales").get().then(snapshot => {

    let revenue = 0;

    snapshot.forEach(doc => {

      const data = doc.data();
      const saleDate = data.date.toDate();
      saleDate.setHours(0,0,0,0);

      if (saleDate.getTime() === today.getTime()) {
        revenue += data.total;
      }

    });

    document.getElementById("report").innerHTML = `
      <h4>Today's Sales</h4>
      <p>Total Revenue: ₹${revenue}</p>
    `;
  });
}


// ================= EXPORT PDF =================

function exportPDF() {

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const content = document.getElementById("report").innerText;

  db.collection("settings").doc("restaurant").get().then(docSnap => {

    let restaurantName = "MY RESTAURANT";

    if (docSnap.exists) {
      restaurantName = docSnap.data().name;
    }

    // Watermark
    doc.setFontSize(50);
    doc.setTextColor(200, 200, 200);
    doc.text(restaurantName, 105, 140, {
      align: "center",
      angle: 45
    });

    // Normal text
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text(restaurantName, 20, 20);

    doc.setFontSize(12);
    doc.text(content, 20, 40);

    doc.save("Restaurant_Report.pdf");
  });

}

// ================= RESTAURANT NAME SETTINGS =================

function saveRestaurantName() {

  const name = document.getElementById("restaurantName").value.trim();

  if (!name) {
    alert("Enter restaurant name");
    return;
  }

  db.collection("settings").doc("restaurant").set({
    name: name
  }).then(() => {
    document.getElementById("nameStatus").innerText = "Name Saved ✅";
  });

}

function loadRestaurantName() {

  db.collection("settings").doc("restaurant").get()
    .then(doc => {
      if (doc.exists) {
        const data = doc.data();
        document.getElementById("restaurantName").value = data.name;
      }
    });
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
