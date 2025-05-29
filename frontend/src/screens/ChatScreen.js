import React, {useState, useEffect, useLayoutEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAuth} from '../context/AuthContext';
import {getChatMessages, sendMessage, blockUser} from '../services/firebase';
import MessageBubble from '../components/MessageBubble';

export default function ChatScreen({route, navigation}) {
  const {chatId, otherUser} = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const {user} = useAuth();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: otherUser?.displayName || otherUser?.email || 'Conversa',
      headerRight: () => (
        <TouchableOpacity style={styles.headerButton} onPress={handleBlockUser}>
          <Icon name="block" size={24} color="#FF3B30" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, otherUser]);

  useEffect(() => {
    const messagesQuery = getChatMessages(chatId);
    const unsubscribe = messagesQuery.onSnapshot(snapshot => {
      const messagesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(messagesList);
    });

    return unsubscribe;
  }, [chatId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setLoading(true);

    try {
      await sendMessage({
        chatId,
        textContent: messageText,
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      Alert.alert('Erro', 'Erro ao enviar mensagem');
      setNewMessage(messageText); // Restaurar a mensagem em caso de erro
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = () => {
    Alert.alert(
      'Bloquear Usuário',
      `Tem certeza que deseja bloquear ${
        otherUser?.displayName || otherUser?.email
      }?`,
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser({userIdToBlock: otherUser.uid});
              Alert.alert('Sucesso', 'Usuário bloqueado', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error) {
              console.error('Erro ao bloquear usuário:', error);
              Alert.alert('Erro', 'Erro ao bloquear usuário');
            }
          },
        },
      ],
    );
  };

  const renderMessage = ({item}) => (
    <MessageBubble message={item} isOwn={item.senderId === user.uid} />
  );

  const renderHeader = () => (
    <View style={styles.chatHeader}>
      <Text style={styles.headerText}>
        Conversa com {otherUser?.displayName || otherUser?.email}
      </Text>
      <Text style={styles.headerSubtext}>
        🗣️ {otherUser?.nativeLanguage} → 📚 {otherUser?.targetLanguage}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        inverted={messages.length > 0}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Digite sua mensagem..."
          multiline
          maxLength={500}
          editable={!loading}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newMessage.trim() || loading) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || loading}>
          <Icon
            name="send"
            size={24}
            color={!newMessage.trim() || loading ? '#ccc' : '#007AFF'}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  chatHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    marginBottom: 16,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  headerSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  sendButton: {
    padding: 12,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
