// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// 🔴 REPLACE WITH YOUR REAL FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MSG_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ================= LOGIN =================
window.login = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Enter email and password");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Login Successful");

    document.getElementById("loginBox").style.display = "none";
    document.getElementById("dashboard").style.display = "block";

    loadStock();

  } catch (error) {
    alert(error.message);
  }
};

// ================= LOGOUT =================
window.logout = async function () {
  await signOut(auth);
  location.reload();
};

// ================= ADD STOCK =================
window.addStock = async function () {
  const item = document.getElementById("itemName").value;
  const qty = document.getElementById("itemQty").value;

  if (!item || !qty) {
    alert("Enter item and quantity");
    return;
  }

  try {
    await addDoc(collection(db, "stock"), {
      item: item,
      quantity: Number(qty),
      createdAt: new Date()
    });

    alert("Stock Added");

    document.getElementById("itemName").value = "";
    document.getElementById("itemQty").value = "";

    loadStock();

  } catch (error) {
    alert(error.message);
  }
};

// ================= LOAD STOCK =================
async function loadStock() {
  const stockList = document.getElementById("stockList");
  stockList.innerHTML = "";

  const snapshot = await getDocs(collection(db, "stock"));

  snapshot.forEach((doc) => {
    const data = doc.data();
    stockList.innerHTML += `<li>${data.item} - ${data.quantity}</li>`;
  });
}
