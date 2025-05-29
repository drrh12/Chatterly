import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import {updateUserProfile} from '../services/firebase';
import {useAuth} from '../context/AuthContext';

const LANGUAGES = [
  {code: 'pt', name: 'Português'},
  {code: 'en', name: 'English'},
  {code: 'es', name: 'Español'},
  {code: 'fr', name: 'Français'},
  {code: 'de', name: 'Deutsch'},
  {code: 'it', name: 'Italiano'},
  {code: 'ja', name: '日本語'},
  {code: 'ko', name: '한국어'},
  {code: 'zh', name: '中文'},
  {code: 'ar', name: 'العربية'},
];

export default function ProfileSetupScreen() {
  const [nativeLanguage, setNativeLanguage] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [loading, setLoading] = useState(false);
  const {updateProfile} = useAuth();

  const handleSave = async () => {
    if (!nativeLanguage || !targetLanguage) {
      Alert.alert('Erro', 'Por favor, selecione ambos os idiomas');
      return;
    }

    if (nativeLanguage === targetLanguage) {
      Alert.alert('Erro', 'Os idiomas devem ser diferentes');
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile({
        nativeLanguage,
        targetLanguage,
      });

      // Atualizar o contexto local
      updateProfile({
        nativeLanguage,
        targetLanguage,
        profileSetupComplete: true,
      });

      Alert.alert('Sucesso', 'Perfil configurado com sucesso!');
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Erro ao salvar perfil');
    } finally {
      setLoading(false);
    }
  };

  const LanguageSelector = ({title, selectedLanguage, onSelect}) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView
        style={styles.languageList}
        showsVerticalScrollIndicator={false}>
        {LANGUAGES.map(language => (
          <TouchableOpacity
            key={language.code}
            style={[
              styles.languageItem,
              selectedLanguage === language.code && styles.selectedLanguage,
            ]}
            onPress={() => onSelect(language.code)}>
            <Text
              style={[
                styles.languageText,
                selectedLanguage === language.code &&
                  styles.selectedLanguageText,
              ]}>
              {language.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Configure seu Perfil</Text>
        <Text style={styles.subtitle}>
          Escolha seu idioma nativo e o idioma que deseja aprender
        </Text>
      </View>

      <View style={styles.content}>
        <LanguageSelector
          title="Meu idioma nativo"
          selectedLanguage={nativeLanguage}
          onSelect={setNativeLanguage}
        />

        <LanguageSelector
          title="Quero aprender"
          selectedLanguage={targetLanguage}
          onSelect={setTargetLanguage}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, loading && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={loading}>
        <Text style={styles.saveButtonText}>
          {loading ? 'Salvando...' : 'Salvar'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#007AFF',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    gap: 20,
  },
  section: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  languageList: {
    maxHeight: 400,
  },
  languageItem: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  selectedLanguage: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  languageText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  selectedLanguageText: {
    color: '#fff',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginVertical: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
