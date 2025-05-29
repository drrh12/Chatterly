const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

/**
 * Creates a user profile in Firestore after a new user signs up via Firebase Authentication.
 * Triggered by Firebase Auth `onCreate` event.
 */
exports.createUserProfile = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName, photoURL } = user;

  // Data provided during client-side registration needs to be passed somehow.
  // This function is triggered *after* auth creation.
  // The client should call a callable function to set initial profile data like native/target languages.
  // For now, we create a basic profile.

  const userProfile = {
    uid,
    email,
    displayName: displayName || "Anonymous User", // Use display name from provider or default
    photoURL: photoURL || null,
    nativeLanguage: "", // To be set by a callable function or client post-registration
    targetLanguage: "", // To be set by a callable function or client post-registration
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    blockedUsers: [],
  };

  try {
    await db.collection("users").doc(uid).set(userProfile);
    console.log(`User profile created for UID: ${uid}`);
    return null;
  } catch (error) {
    console.error("Error creating user profile:", error);
    // Optionally, you could throw an error to signal failure, or handle it specifically.
    // For instance, if this fails, you might want to alert admins or retry.
    return null; // Or throw new functions.https.HttpsError('internal', 'Could not create user profile.');
  }
});

/**
 * Callable function to allow a user to set their initial profile details after registration.
 */
exports.setInitialProfileDetails = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const uid = context.auth.uid;
  const { displayName, nativeLanguage, targetLanguage, photoURL } = data;

  if (!displayName || !nativeLanguage || !targetLanguage) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required fields: displayName, nativeLanguage, targetLanguage."
    );
  }

  try {
    const userRef = db.collection("users").doc(uid);
    await userRef.update({
      displayName: displayName,
      nativeLanguage: nativeLanguage,
      targetLanguage: targetLanguage,
      photoURL: photoURL || null, // Optionally update photoURL if provided
      profileSetupComplete: true, // A flag to indicate initial setup is done
    });
    console.log(`Initial profile details set for UID: ${uid}`);
    return { success: true, message: "Profile details updated successfully." };
  } catch (error) {
    console.error("Error setting initial profile details:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to update profile details."
    );
  }
});

/**
 * Creates a new chat document between two users if one doesn't already exist.
 * This is a callable function.
 */
exports.createChat = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const currentUserUid = context.auth.uid;
  const otherUserUid = data.otherUserUid;

  if (!otherUserUid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The otherUserUid must be provided."
    );
  }

  if (currentUserUid === otherUserUid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Cannot create a chat with yourself."
    );
  }

  const users = [currentUserUid, otherUserUid].sort(); // Sort to ensure consistent chatId
  const chatId = users.join("_"); // Create a deterministic chat ID

  const chatRef = db.collection("chats").doc(chatId);

  try {
    const chatDoc = await chatRef.get();

    if (chatDoc.exists) {
      console.log(`Chat already exists between ${currentUserUid} and ${otherUserUid}: ${chatId}`);
      return { chatId: chatId, created: false };
    }

    // Check if either user has blocked the other
    const currentUserDoc = await db.collection("users").doc(currentUserUid).get();
    const otherUserDoc = await db.collection("users").doc(otherUserUid).get();

    if (!currentUserDoc.exists || !otherUserDoc.exists) {
        throw new functions.https.HttpsError("not-found", "One or both users not found.");
    }

    const currentUserData = currentUserDoc.data();
    const otherUserData = otherUserDoc.data();

    if (currentUserData.blockedUsers && currentUserData.blockedUsers.includes(otherUserUid)) {
        throw new functions.https.HttpsError("permission-denied", "You have blocked this user.");
    }
    if (otherUserData.blockedUsers && otherUserData.blockedUsers.includes(currentUserUid)) {
        throw new functions.https.HttpsError("permission-denied", "This user has blocked you.");
    }

    const newChat = {
      users: users,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastMessage: null, // Can be updated by another function or client
      lastMessageTimestamp: null,
    };

    await chatRef.set(newChat);
    console.log(`Chat created between ${currentUserUid} and ${otherUserUid}: ${chatId}`);
    return { chatId: chatId, created: true };

  } catch (error) {
    console.error("Error creating chat:", error);
    if (error instanceof functions.https.HttpsError) throw error; // Re-throw HttpsError
    throw new functions.https.HttpsError("internal", "Could not create chat.");
  }
});

/**
 * Sends a message in a chat.
 * This is a callable function.
 */
exports.sendMessage = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const senderId = context.auth.uid;
  const { chatId, textContent } = data;

  if (!chatId || !textContent) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "chatId and textContent must be provided."
    );
  }

  if (textContent.trim() === "") {
     throw new functions.https.HttpsError(
      "invalid-argument",
      "Message text cannot be empty."
    );
  }

  const chatRef = db.collection("chats").doc(chatId);
  const messagesRef = chatRef.collection("messages");

  try {
    // Verify the user is part of the chat (Security rules also enforce this)
    const chatDoc = await chatRef.get();
    if (!chatDoc.exists || !chatDoc.data().users.includes(senderId)) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You are not a member of this chat or chat does not exist."
      );
    }

    // Check if sender is blocked by the recipient
    const chatData = chatDoc.data();
    const recipientId = chatData.users.find(uid => uid !== senderId);
    if (recipientId) {
        const recipientDoc = await db.collection("users").doc(recipientId).get();
        if (recipientDoc.exists && recipientDoc.data().blockedUsers && recipientDoc.data().blockedUsers.includes(senderId)) {
            throw new functions.https.HttpsError("permission-denied", "You cannot send messages to this user as they have blocked you.");
        }
    }

    const newMessage = {
      senderId: senderId,
      textContent: textContent,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    await messagesRef.add(newMessage);
    console.log(`Message sent by ${senderId} in chat ${chatId}`);

    // Update the last message in the chat document for easier display/sorting
    await chatRef.update({
        lastMessage: textContent, // Or a snippet
        lastMessageTimestamp: newMessage.timestamp,
        lastMessageSenderId: senderId
    });

    return { success: true, messageId: (await messagesRef.add(newMessage)).id };
  } catch (error) {
    console.error("Error sending message:", error);
     if (error instanceof functions.https.HttpsError) throw error; // Re-throw HttpsError
    throw new functions.https.HttpsError("internal", "Could not send message.");
  }
});

/**
 * Blocks a user.
 * This is a callable function.
 */
exports.blockUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const currentUserUid = context.auth.uid;
  const userToBlockUid = data.userToBlockUid;

  if (!userToBlockUid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The userToBlockUid must be provided."
    );
  }

  if (currentUserUid === userToBlockUid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "You cannot block yourself."
    );
  }

  const currentUserRef = db.collection("users").doc(currentUserUid);

  try {
    // Atomically add the userToBlockUid to the currentUser's blockedUsers array
    await currentUserRef.update({
      blockedUsers: admin.firestore.FieldValue.arrayUnion(userToBlockUid),
    });

    console.log(`User ${currentUserUid} blocked user ${userToBlockUid}`);

    // Optional: Remove any existing chat between these users or mark it as inactive.
    // For simplicity, MVP will rely on client-side filtering and security rules.
    // If you want to delete chats, you'd find the chat ID and delete it and its subcollections.

    return { success: true, message: "User blocked successfully." };
  } catch (error) {
    console.error("Error blocking user:", error);
    throw new functions.https.HttpsError("internal", "Could not block user.");
  }
});

/**
 * Unblocks a user.
 * This is a callable function.
 */
exports.unblockUser = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "The function must be called while authenticated."
        );
    }

    const currentUserUid = context.auth.uid;
    const userToUnblockUid = data.userToUnblockUid;

    if (!userToUnblockUid) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "The userToUnblockUid must be provided."
        );
    }

    const currentUserRef = db.collection("users").doc(currentUserUid);

    try {
        await currentUserRef.update({
            blockedUsers: admin.firestore.FieldValue.arrayRemove(userToUnblockUid),
        });
        console.log(`User ${currentUserUid} unblocked user ${userToUnblockUid}`);
        return { success: true, message: "User unblocked successfully." };
    } catch (error) {
        console.error("Error unblocking user:", error);
        throw new functions.https.HttpsError("internal", "Could not unblock user.");
    }
});

// Note: For the discovery feature (listing users):
// This will primarily be a client-side query to Firestore.
// The client will query the 'users' collection:
// - Where 'nativeLanguage' is the current user's 'targetLanguage'
// - And 'targetLanguage' is the current user's 'nativeLanguage'
// - And 'uid' is not in the current user's 'blockedUsers' array (requires client-side filtering or more complex queries/denormalization)
// - And 'uid' is not the current user's uid.
// Firebase queries for "not in" on an array can be tricky. Often, you fetch a broader set and filter client-side, or denormalize.
// For MVP, client-side filtering of blocked users from the initial result set is acceptable. 