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

let html5QrCode;

function startScanner() {
  html5QrCode = new Html5Qrcode("reader");

  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    qrCodeMessage => {
      handleAttendance(qrCodeMessage);
      stopScanner();
    }
  );
}

function stopScanner() {
  if (html5QrCode) {
    html5QrCode.stop();
  }
}

function handleAttendance(staffId) {

  const today = new Date().toISOString().split("T")[0];

  db.collection("attendance")
    .where("staffId", "==", staffId)
    .where("date", "==", today)
    .get()
    .then(snapshot => {

      if (snapshot.empty) {

        // First check-in of day
        db.collection("attendance").add({
          staffId: staffId,
          date: today,
          sessions: [{
            in: new Date(),
            out: null
          }],
          totalHours: 0,
          salaryEligible: false
        });

        result.innerText = "Check-IN Successful";

      } else {

        const doc = snapshot.docs[0];
        const data = doc.data();
        const sessions = data.sessions;
        const lastSession = sessions[sessions.length - 1];

        if (lastSession.out === null) {

          // Close session
          lastSession.out = new Date();

          const totalHours = calculateTotalHours(sessions);

          db.collection("attendance").doc(doc.id).update({
            sessions: sessions,
            totalHours: totalHours,
            salaryEligible: totalHours >= 4
          });

          result.innerText = "Check-OUT Recorded";

        } else {

          // Resume work
          sessions.push({
            in: new Date(),
            out: null
          });

          db.collection("attendance").doc(doc.id).update({
            sessions: sessions
          });

          result.innerText = "Work Resumed";
        }
      }

    });
}

function calculateTotalHours(sessions) {

  let totalMs = 0;

  sessions.forEach(s => {
    if (s.out) {
      const inTime = s.in.toDate ? s.in.toDate() : s.in;
      const outTime = s.out.toDate ? s.out.toDate() : s.out;
      totalMs += (outTime - inTime);
    }
  });

  return totalMs / (1000 * 60 * 60);
    }
