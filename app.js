// 🔥 YOUR FIREBASE CONFIG
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
  const cost = parseFloat(document.getElementById("costPrice").value);
  const selling = parseFloat(document.getElementById("sellingPrice").value);
  const qty = parseInt(document.getElementById("itemQty").value);

  db.collection("items").add({
    name: name,
    type: type,
    cost: cost,
    selling: selling,
    qty: qty,
    date: new Date()
  });

  alert("Item Added");
}


// ================= DAILY REPORT =================

function generateReport() {
  db.collection("items").get().then(snapshot => {
    let total = 0;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.type === "sale") {
        total += data.selling * data.qty;
      }
    });

    document.getElementById("report").innerHTML =
      "<h4>Total Sales: ₹" + total + "</h4>";
  });
}


// ================= PDF =================

function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text("Restaurant Daily Report", 20, 20);
  doc.text(document.getElementById("report").innerText, 20, 40);
  doc.save("report.pdf");
}


// ================= QR SCANNER =================

let scanner;

function startScanner() {
  scanner = new Html5Qrcode("reader");

  scanner.start(
    { facingMode: "environment" }, // MAIN CAMERA
    {
      fps: 10,
      qrbox: 250
    },
    qrCodeMessage => {
      db.collection("attendance").add({
        staffId: qrCodeMessage,
        time: new Date()
      });
      alert("Attendance Marked for " + qrCodeMessage);
    }
  );
}

function stopScanner() {
  if (scanner) {
    scanner.stop();
  }
}

// ================= STOCK LIST =================

function loadStock() {

  db.collection("items").get().then((snapshot) => {

    let stockHTML = "";

    snapshot.forEach((doc) => {

      let data = doc.data();

      stockHTML += `
        <div style="border:1px solid #ccc; padding:8px; margin:5px;">
          <strong>${data.name}</strong><br>
          Type: ${data.type}<br>
          Quantity: ${data.quantity}<br>
          Cost Price: ₹${data.costPrice}<br>
          Selling Price: ₹${data.sellingPrice}
        </div>
      `;
    });

    document.getElementById("stockList").innerHTML = stockHTML;

  }).catch((error) => {
    console.log(error);
  });
      }
