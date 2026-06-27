import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'ai-studio-48d53b9b-b28e-4377-ab9e-cbf65d48a57e'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function removeDuplicates() {
  const inventoryRef = collection(db, 'inventory');
  const snapshot = await getDocs(inventoryRef);
  
  const seen = new Set();
  let duplicateCount = 0;
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const key = `${data.size}-${data.gsm}`;
    
    if (seen.has(key)) {
      console.log(`Deleting duplicate: ${key} (ID: ${docSnap.id})`);
      await deleteDoc(doc(db, 'inventory', docSnap.id));
      duplicateCount++;
    } else {
      seen.add(key);
    }
  }
  
  console.log(`Finished removing duplicates. Removed ${duplicateCount} duplicates.`);
}

removeDuplicates().catch(console.error);
