import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAuth} from '../context/AuthContext';
import {getUserChats, getUserProfile, signOut} from '../services/firebase';
import {useNavigation, useFocusEffect} from '@react-navigation/native';

export default function ChatListScreen() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const {user, userProfile} = useAuth();
  const navigation = useNavigation();

  const loadChats = async () => {
    try {
      const chatsQuery = getUserChats(user.uid);
      const unsubscribe = chatsQuery.onSnapshot(async snapshot => {
        const chatsList = [];

        for (const doc of snapshot.docs) {
          const chatData = doc.data();
          const chatId = doc.id;

          // Encontrar o outro usuário no chat
          const otherUserId = chatData.users.find(uid => uid !== user.uid);

          if (otherUserId) {
            try {
              const otherUserDoc = await getUserProfile(otherUserId);
              const otherUserData = otherUserDoc.exists
                ? otherUserDoc.data()
                : null;

              chatsList.push({
                id: chatId,
                ...chatData,
                otherUser: otherUserData,
              });
            } catch (error) {
              console.error('Erro ao buscar dados do usuário:', error);
            }
          }
        }

        setChats(chatsList);
        setLoading(false);
        setRefreshing(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Erro ao carregar chats:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      let unsubscribe;

      const setupListener = async () => {
        unsubscribe = await loadChats();
      };

      setupListener();

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }, [user.uid]),
  );

  const handleChatPress = chat => {
    navigation.navigate('Chat', {
      chatId: chat.id,
      otherUser: chat.otherUser,
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const formatTime = timestamp => {
    if (!timestamp) return '';

    const date = timestamp.toDate();
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffDays <= 7) {
      return date.toLocaleDateString('pt-BR', {weekday: 'short'});
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      });
    }
  };

  const renderChat = ({item}) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => handleChatPress(item)}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(item.otherUser?.displayName ||
            item.otherUser?.email ||
            'U')[0].toUpperCase()}
        </Text>
      </View>

      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>
            {item.otherUser?.displayName || item.otherUser?.email || 'Usuário'}
          </Text>
          <Text style={styles.chatTime}>
            {formatTime(item.lastMessageTimestamp)}
          </Text>
        </View>

        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage || 'Conversa iniciada'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando conversas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Conversas</Text>
          <Text style={styles.subtitle}>
            Olá, {userProfile?.displayName || user?.email || 'Usuário'}!
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <Icon name="logout" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="chat" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Nenhuma conversa ainda</Text>
          <Text style={styles.emptySubtext}>
            Vá para a aba Descobrir para encontrar pessoas para conversar
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChat}
          keyExtractor={item => item.id}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  list: {
    paddingVertical: 8,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
    color: '#999',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
