/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onCall } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

admin.initializeApp();

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// Criar perfil do usuário (chamado pelo frontend após o registro)
exports.createUserProfile = onCall(async (request) => {
  const uid = request.auth.uid;
  const user = request.auth.token;
  const db = admin.firestore();

  try {
    // Verificar se o perfil já existe
    const userDoc = await db.collection("users").doc(uid).get();
    if (userDoc.exists) {
      return { success: true, message: "Perfil já existe" };
    }

    await db
      .collection("users")
      .doc(uid)
      .set({
        uid: uid,
        email: user.email,
        displayName: user.name || null,
        photoURL: user.picture || null,
        nativeLanguage: null, // Será atualizado quando o usuário completar o perfil
        targetLanguage: null, // Será atualizado quando o usuário completar o perfil
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        blockedUsers: [],
        profileSetupComplete: false,
      });

    logger.info("Perfil do usuário criado com sucesso", { uid: uid });
    return { success: true, message: "Perfil criado com sucesso" };
  } catch (error) {
    logger.error("Erro ao criar perfil do usuário", { error, uid: uid });
    throw new Error("Erro ao criar perfil do usuário");
  }
});

// Atualizar perfil do usuário (idiomas)
exports.updateUserProfile = onCall(async (request) => {
  const { nativeLanguage, targetLanguage } = request.data;
  const uid = request.auth.uid;

  if (!nativeLanguage || !targetLanguage) {
    throw new Error("Idiomas nativo e alvo são obrigatórios");
  }

  const db = admin.firestore();
  try {
    await db.collection("users").doc(uid).update({
      nativeLanguage,
      targetLanguage,
      profileSetupComplete: true,
    });

    return { success: true };
  } catch (error) {
    logger.error("Erro ao atualizar perfil", { error, uid });
    throw new Error("Erro ao atualizar perfil");
  }
});

// Criar chat entre dois usuários
exports.createChat = onCall(async (request) => {
  const { otherUserId } = request.data;
  const currentUserId = request.auth.uid;

  if (!otherUserId) {
    throw new Error("ID do outro usuário é obrigatório");
  }

  const db = admin.firestore();
  const batch = db.batch();

  try {
    // Verificar se já existe um chat entre os usuários
    const existingChat = await db
      .collection("chats")
      .where("users", "array-contains", currentUserId)
      .get();

    for (const doc of existingChat.docs) {
      const chat = doc.data();
      if (chat.users.includes(otherUserId)) {
        return { chatId: doc.id, isNew: false };
      }
    }

    // Criar novo chat
    const chatRef = db.collection("chats").doc();
    const chatId = chatRef.id;

    batch.set(chatRef, {
      users: [currentUserId, otherUserId],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastMessage: null,
      lastMessageTimestamp: null,
      lastMessageSenderId: null,
    });

    await batch.commit();
    return { chatId, isNew: true };
  } catch (error) {
    logger.error("Erro ao criar chat", { error, currentUserId, otherUserId });
    throw new Error("Erro ao criar chat");
  }
});

// Enviar mensagem
exports.sendMessage = onCall(async (request) => {
  const { chatId, textContent } = request.data;
  const senderId = request.auth.uid;

  if (!chatId || !textContent) {
    throw new Error("ID do chat e conteúdo da mensagem são obrigatórios");
  }

  const db = admin.firestore();
  const batch = db.batch();

  try {
    // Verificar se o usuário é participante do chat
    const chatRef = db.collection("chats").doc(chatId);
    const chatDoc = await chatRef.get();

    if (!chatDoc.exists) {
      throw new Error("Chat não encontrado");
    }

    const chat = chatDoc.data();
    if (!chat.users.includes(senderId)) {
      throw new Error("Usuário não é participante deste chat");
    }

    // Criar mensagem
    const messageRef = chatRef.collection("messages").doc();
    batch.set(messageRef, {
      senderId,
      textContent,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Atualizar último status do chat
    batch.update(chatRef, {
      lastMessage: textContent,
      lastMessageTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      lastMessageSenderId: senderId,
    });

    await batch.commit();
    return { success: true, messageId: messageRef.id };
  } catch (error) {
    logger.error("Erro ao enviar mensagem", { error, chatId, senderId });
    throw new Error("Erro ao enviar mensagem");
  }
});

// Bloquear usuário
exports.blockUser = onCall(async (request) => {
  const { userIdToBlock } = request.data;
  const currentUserId = request.auth.uid;

  if (!userIdToBlock) {
    throw new Error("ID do usuário a ser bloqueado é obrigatório");
  }

  const db = admin.firestore();
  try {
    await db
      .collection("users")
      .doc(currentUserId)
      .update({
        blockedUsers: admin.firestore.FieldValue.arrayUnion(userIdToBlock),
      });

    return { success: true };
  } catch (error) {
    logger.error("Erro ao bloquear usuário", {
      error,
      currentUserId,
      userIdToBlock,
    });
    throw new Error("Erro ao bloquear usuário");
  }
});
