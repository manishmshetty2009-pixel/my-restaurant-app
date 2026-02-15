import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.addStock = async function () {
  const name = document.getElementById("itemName").value;
  const qty = document.getElementById("itemQty").value;

  if (!name || !qty) {
    alert("Enter item and quantity");
    return;
  }

  await addDoc(collection(db, "stock"), {
    item: name,
    quantity: Number(qty),
    time: new Date()
  });

  alert("Stock Added!");
  document.getElementById("itemName").value = "";
  document.getElementById("itemQty").value = "";
  loadStock();
};

async function loadStock() {
  const stockList = document.getElementById("stockList");
  stockList.innerHTML = "";

  const snapshot = await getDocs(collection(db, "stock"));
  snapshot.forEach(doc => {
    const data = doc.data();
    stockList.innerHTML += `<li>${data.item} - ${data.quantity}</li>`;
  });
}

loadStock();
