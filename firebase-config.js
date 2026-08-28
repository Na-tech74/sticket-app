import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAuth, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
    initializeFirestore, persistentLocalCache, persistentSingleTabManager,
    collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBShVj62lFy1b529gv9a-zQ5IWFpCY1oxo",
    authDomain: "sticket-app.firebaseapp.com",
    projectId: "sticket-app",
    storageBucket: "sticket-app.firebasestorage.app",
    messagingSenderId: "736594434040",
    appId: "1:736594434040:web:0aea92e060c6bf0c89a80d",
    measurementId: "G-DQEPKE50W2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Bật cache cục bộ (IndexedDB) cho Firestore: lần vào sau sẽ đọc từ cache
// trên máy trước (rất nhanh), giảm cảm giác "chờ lâu" mỗi lần mở app.
const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() })
});

const googleProvider = new GoogleAuthProvider();

// ======================== AUTH ========================
function loginWithGoogle() {
    return signInWithPopup(auth, googleProvider);
}

function loginWithEmail(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
}

function registerWithEmail(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
}

function logout() {
    return signOut(auth);
}

function onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
}

function getCurrentUser() {
    return auth.currentUser;
}

// ======================== FIRESTORE CRUD ========================
function getUserIssuesRef() {
    const user = getCurrentUser();
    if (!user) return null;
    return collection(db, 'users', user.uid, 'issues');
}

async function firestoreGetData() {
    const ref = getUserIssuesRef();
    if (!ref) return [];
    const q = query(ref, orderBy('id', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));
}

async function firestoreAddIssue(issue) {
    const ref = getUserIssuesRef();
    if (!ref) return;
    await addDoc(ref, issue);
}

async function firestoreUpdateIssue(docId, data) {
    const ref = getUserIssuesRef();
    if (!ref) return;
    await updateDoc(doc(ref, docId), data);
}

async function firestoreDeleteIssue(docId) {
    const ref = getUserIssuesRef();
    if (!ref) return;
    await deleteDoc(doc(ref, docId));
}

async function firestoreClearAll() {
    const data = await firestoreGetData();
    const ref = getUserIssuesRef();
    if (!ref) return;
    const deletes = data.map(item => deleteDoc(doc(ref, item.docId)));
    await Promise.all(deletes);
}

export {
    loginWithGoogle, loginWithEmail, registerWithEmail, logout, onAuthChange, getCurrentUser,
    firestoreGetData, firestoreAddIssue, firestoreUpdateIssue, firestoreDeleteIssue, firestoreClearAll
};
