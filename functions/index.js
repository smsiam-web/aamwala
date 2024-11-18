const functions = require('firebase-functions');
const cors = require('cors')({ origin: true }); // Import and configure CORS

exports.initializeCounter = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        // Your function logic here
        res.set('Access-Control-Allow-Origin', '*'); // Allow all origins or replace '*' with 'http://localhost:3000' for specific origins
        res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        
        // Send your response, e.g.,
        res.status(200).send({ message: 'Counter initialized' });
    });
});
const admin = require('firebase-admin');
admin.initializeApp();

// Number of shards for the counter
const NUM_SHARDS = 20;

// Cloud Function to initialize shards (run once)
exports.initializeCounter = functions.https.onRequest(async (req, res) => {
  const db = admin.firestore();
  const counterRef = db.collection("counters");

  // Create shards with initial value of 0
  const batch = db.batch();
  for (let i = 0; i < NUM_SHARDS; i++) {
    const shardRef = counterRef.doc(`shard${i}`);
    batch.set(shardRef, { value: 0 });
  }

  await batch.commit();
  res.send("Counter initialized with shards.");
});

// Cloud Function to increment counter
exports.incrementCounter = functions.https.onCall(async (data, context) => {
  const db = admin.firestore();
  
  // Select a random shard
  const shardId = Math.floor(Math.random() * NUM_SHARDS);
  const shardRef = db.collection("counters").doc(`shard${shardId}`);
  
  // Atomically increment the value of the chosen shard
  await shardRef.update({
    value: admin.firestore.FieldValue.increment(1)
  });
  
  return { message: "Counter incremented successfully" };
});

// Cloud Function to get total counter value
exports.getCounterTotal = functions.https.onCall(async (data, context) => {
  const db = admin.firestore();
  const counterSnapshots = await db.collection("counters").get();

  let total = 0;
  counterSnapshots.forEach(doc => {
    total += doc.data().value;
  });

  return { total };
});

