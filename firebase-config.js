import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { 
    getAuth, signInWithPopup, signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, signOut, GoogleAuthProvider, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
    getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, 
    doc, query, orderBy, onSnapshot 
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
const db = getFirestore(app); // dùng getFirestore 

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

// try-catch để bắt lỗi listener
function subscribeIssues(onData, onError) {
    const ref = getUserIssuesRef();
    if (!ref) {
        onData([]);
        return () => {};
    }
    try {
        const q = query(ref, orderBy('id', 'desc'));
        return onSnapshot(q, snapshot => {
            const data = snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));
            onData(data);
        }, err => {
            console.warn('Firestore listener error:', err);
            if (onError) onError(err);
        });
    } catch (err) {
        console.error('Failed to subscribe:', err);
        if (onError) onError(err);
        return () => {};
    }
}

async function firestoreAddIssue(issue) {
    const ref = getUserIssuesRef();
    if (!ref) return null;
    try {
        return await addDoc(ref, issue);
    } catch (err) {
        console.error('Add issue error:', err);
        throw err;
    }
}

async function firestoreUpdateIssue(docId, data) {
    const ref = getUserIssuesRef();
    if (!ref) return;
    try {
        await updateDoc(doc(ref, docId), data);
    } catch (err) {
        console.error('Update issue error:', err);
        throw err;
    }
}

async function firestoreDeleteIssue(docId) {
    const ref = getUserIssuesRef();
    if (!ref) return;
    try {
        await deleteDoc(doc(ref, docId));
    } catch (err) {
        console.error('Delete issue error:', err);
        throw err;
    }
}

async function firestoreClearAll() {
    const data = await firestoreGetData();
    const ref = getUserIssuesRef();
    if (!ref) return;
    const deletes = data.map(item => deleteDoc(doc(ref, item.docId)));
    await Promise.all(deletes);
}

export {
    loginWithGoogle, loginWithEmail, registerWithEmail, logout, 
    onAuthChange, getCurrentUser,
    firestoreGetData, subscribeIssues, firestoreAddIssue, 
    firestoreUpdateIssue, firestoreDeleteIssue, firestoreClearAll
};