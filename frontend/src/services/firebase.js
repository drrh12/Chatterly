import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';

// Initialize Firebase Functions
const firebaseFunctions = functions();

// Se estiver usando emulador local, descomente as linhas abaixo:
// if (__DEV__) {
//   firebaseFunctions.useEmulator('localhost', 5001);
//   firestore().useEmulator('localhost', 8080);
//   auth().useEmulator('http://localhost:9099');
// }

// Auth functions
export const signInWithEmail = (email, password) => {
  return auth().signInWithEmailAndPassword(email, password);
};

export const signUpWithEmail = (email, password) => {
  return auth().createUserWithEmailAndPassword(email, password);
};

export const signOut = () => {
  return auth().signOut();
};

export const getCurrentUser = () => {
  return auth().currentUser;
};

// Cloud Functions
export const createUserProfile =
  firebaseFunctions.httpsCallable('createUserProfile');
export const updateUserProfile =
  firebaseFunctions.httpsCallable('updateUserProfile');
export const createChat = firebaseFunctions.httpsCallable('createChat');
export const sendMessage = firebaseFunctions.httpsCallable('sendMessage');
export const blockUser = firebaseFunctions.httpsCallable('blockUser');

// Firestore functions
export const getUserProfile = uid => {
  return firestore().collection('users').doc(uid).get();
};

export const updateUserProfileData = (uid, data) => {
  return firestore().collection('users').doc(uid).update(data);
};

export const getUsers = () => {
  return firestore()
    .collection('users')
    .where('profileSetupComplete', '==', true);
};

export const getUserChats = uid => {
  return firestore()
    .collection('chats')
    .where('users', 'array-contains', uid)
    .orderBy('lastMessageTimestamp', 'desc');
};

export const getChatMessages = chatId => {
  return firestore()
    .collection('chats')
    .doc(chatId)
    .collection('messages')
    .orderBy('timestamp', 'asc');
};

export const listenToAuthChanges = callback => {
  return auth().onAuthStateChanged(callback);
};

export {auth, firestore, functions};
