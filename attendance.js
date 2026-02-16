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

let currentStaff = null;
let currentDocId = null;

// ================= QR SCANNER =================

const scanner = new Html5Qrcode("reader");

scanner.start(
  { facingMode: "environment" },
  { fps: 10, qrbox: 250 },
  (decodedText) => {
    handleScan(decodedText);
  }
);

function handleScan(staffId) {

  currentStaff = staffId;
  const today = new Date().toISOString().split("T")[0];

  db.collection("attendance")
    .where("staffId", "==", staffId)
    .where("date", "==", today)
    .get()
    .then(snapshot => {

      if (snapshot.empty) {
        // First check-in
        db.collection("attendance").add({
          staffId: staffId,
          date: today,
          sessions: [{ in: new Date(), out: null }],
          totalHours: 0,
          salaryEarned: 0
        });

        status.innerText = "Check-IN successful";
      } else {
        const doc = snapshot.docs[0];
        currentDocId = doc.id;
        const data = doc.data();
        const sessions = data.sessions;

        const lastSession = sessions[sessions.length - 1];

        if (lastSession.out === null) {
          // Need Break or Checkout
          document.getElementById("actionButtons").style.display = "block";
          status.innerText = "Select Break or Final Checkout";
        } else {
          // Resume from break
          sessions.push({ in: new Date(), out: null });

          db.collection("attendance").doc(doc.id).update({
            sessions: sessions
          });

          status.innerText = "Resumed Work";
        }
      }

    });
}

// ================= BREAK =================

function markBreak() {
  closeSession(false);
}

// ================= FINAL CHECKOUT =================

function markCheckout() {
  closeSession(true);
}

function closeSession(final) {

  db.collection("attendance").doc(currentDocId).get()
    .then(doc => {

      const data = doc.data();
      const sessions = data.sessions;
      const lastSession = sessions[sessions.length - 1];

      lastSession.out = new Date();

      let totalMs = 0;

      sessions.forEach(s => {
        if (s.out) {
          totalMs += (s.out.toDate ? s.out.toDate() : s.out) - 
                     (s.in.toDate ? s.in.toDate() : s.in);
        }
      });

      const totalHours = totalMs / (1000 * 60 * 60);

      let salary = 0;

      if (final && totalHours >= 4) {
        // Fetch staff wage
        db.collection("staff").doc(currentStaff).get()
          .then(staffDoc => {

            if (staffDoc.exists) {
              salary = staffDoc.data().dailyWage;
            }

            db.collection("attendance").doc(currentDocId).update({
              sessions: sessions,
              totalHours: totalHours,
              salaryEarned: salary
            });

            status.innerText = "Final Checkout Completed";
          });
      } else {
        db.collection("attendance").doc(currentDocId).update({
          sessions: sessions
        });

        status.innerText = "Break Started";
      }

      document.getElementById("actionButtons").style.display = "none";
    });
}
