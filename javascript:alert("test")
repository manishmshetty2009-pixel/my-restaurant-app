// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// 🔴 PASTE YOUR REAL FIREBASE CONFIG HERE
const firebaseConfig = {
  apiKey: "AIzaSyCQBOmA3OktohJKYCzbJxEORsshtsh-Zno",
  authDomain: "my-restaurant-7badd.firebaseapp.com",
  projectId: "my-restaurant-7badd",
  storageBucket: "my-restaurant-7badd.appspot.com",
  messagingSenderId: "588063103672",
  appId: "1:588063103672:web:ace926af186843cb56724d"
};

alert("JS FILE LOADED");

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// LOGIN
window.login = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);

    document.getElementById("loginBox").style.display = "none";
    document.getElementById("dashboard").style.display = "block";

    loadStock();
  } catch (error) {
    alert(error.message);
  }
};

// LOGOUT
window.logout = async function () {
  await signOut(auth);
  location.reload();
};

// ADD STOCK
window.addStock = async function () {
  const item = document.getElementById("itemName").value;
  const qty = document.getElementById("itemQty").value;

  if (!item || !qty) {
    alert("Enter item and quantity");
    return;
  }

  await addDoc(collection(db, "stock"), {
    item: item,
    quantity: Number(qty),
    createdAt: new Date()
  });

  document.getElementById("itemName").value = "";
  document.getElementById("itemQty").value = "";

  loadStock();
};

// LOAD STOCK
async function loadStock() {
  const stockList = document.getElementById("stockList");
  stockList.innerHTML = "";

  const snapshot = await getDocs(collection(db, "stock"));

  snapshot.forEach(doc => {
    const data = doc.data();
    stockList.innerHTML += `<li>${data.item} - ${data.quantity}</li>`;
  });
}
