import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAuth} from '../context/AuthContext';
import {getUsers, createChat, blockUser} from '../services/firebase';
import {useNavigation} from '@react-navigation/native';

export default function DiscoveryScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const {userProfile, user} = useAuth();
  const navigation = useNavigation();

  const loadUsers = async () => {
    try {
      const usersQuery = getUsers();
      const snapshot = await usersQuery.get();

      const usersList = snapshot.docs
        .map(doc => doc.data())
        .filter(otherUser => {
          // Excluir o próprio usuário
          if (otherUser.uid === user.uid) return false;

          // Excluir usuários bloqueados
          if (userProfile?.blockedUsers?.includes(otherUser.uid)) return false;

          // Mostrar apenas usuários que falam o idioma que quero aprender
          // e que querem aprender meu idioma nativo
          return (
            otherUser.nativeLanguage === userProfile?.targetLanguage &&
            otherUser.targetLanguage === userProfile?.nativeLanguage
          );
        });

      setUsers(usersList);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      Alert.alert('Erro', 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userProfile?.profileSetupComplete) {
      loadUsers();
    }
  }, [userProfile]);

  const handleStartChat = async otherUser => {
    try {
      const result = await createChat({otherUserId: otherUser.uid});

      navigation.navigate('Chat', {
        chatId: result.data.chatId,
        otherUser: otherUser,
      });
    } catch (error) {
      console.error('Erro ao criar chat:', error);
      Alert.alert('Erro', 'Erro ao iniciar conversa');
    }
  };

  const handleBlockUser = async otherUser => {
    Alert.alert(
      'Bloquear Usuário',
      `Tem certeza que deseja bloquear ${
        otherUser.displayName || otherUser.email
      }?`,
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser({userIdToBlock: otherUser.uid});

              // Remover da lista local
              setUsers(prev => prev.filter(u => u.uid !== otherUser.uid));

              Alert.alert('Sucesso', 'Usuário bloqueado');
            } catch (error) {
              console.error('Erro ao bloquear usuário:', error);
              Alert.alert('Erro', 'Erro ao bloquear usuário');
            }
          },
        },
      ],
    );
  };

  const renderUser = ({item}) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          <Text style={styles.avatarText}>
            {(item.displayName || item.email)[0].toUpperCase()}
          </Text>
        </View>

        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.displayName || item.email}</Text>
          <Text style={styles.userLanguages}>
            🗣️ {item.nativeLanguage} → 📚 {item.targetLanguage}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => handleStartChat(item)}>
          <Icon name="chat" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.blockButton}
          onPress={() => handleBlockUser(item)}>
          <Icon name="block" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Procurando pessoas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Descobrir</Text>
        <Text style={styles.subtitle}>
          Pessoas que falam {userProfile?.targetLanguage} e querem aprender{' '}
          {userProfile?.nativeLanguage}
        </Text>
      </View>

      {users.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="search" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Nenhuma pessoa encontrada</Text>
          <Text style={styles.emptySubtext}>
            Tente novamente mais tarde ou ajuste seus idiomas
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={item => item.uid}
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
    lineHeight: 20,
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
    padding: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userLanguages: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  chatButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
  },
  blockButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
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
