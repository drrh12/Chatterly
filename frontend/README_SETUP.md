# ChatLive - Frontend React Native

Um app de troca de idiomas estilo HelloTalk construído com React Native e Firebase.

## 🚀 Configuração Inicial

### 1. Configurar Firebase

1. **Criar projeto no Firebase Console:**

   - Vá para [Firebase Console](https://console.firebase.google.com)
   - Crie um novo projeto
   - Ative Authentication, Firestore e Cloud Functions

2. **Configurar arquivo do Firebase:**

   - Baixe o `google-services.json` do Firebase Console
   - Substitua o arquivo placeholder em `android/app/google-services.json`
   - Para iOS, baixe o `GoogleService-Info.plist` e adicione ao projeto iOS

3. **Configurar emuladores locais:**
   - No arquivo `src/services/firebase.js`, descomente as linhas dos emuladores:
   ```javascript
   if (__DEV__) {
     firebaseFunctions.useEmulator('localhost', 5001);
     firestore().useEmulator('localhost', 8080);
     auth().useEmulator('http://localhost:9099');
   }
   ```

### 2. Instalar Dependências

```bash
# Na pasta frontend
npm install

# Para iOS (macOS apenas)
cd ios && pod install && cd ..
```

### 3. Configurar React Native Firebase

#### Android

- O arquivo `google-services.json` já está configurado
- Verifique se o `android/build.gradle` tem a linha:
  ```gradle
  classpath 'com.google.gms:google-services:4.3.15'
  ```

#### iOS

- Adicione o `GoogleService-Info.plist` ao projeto iOS no Xcode
- Configure as dependências do CocoaPods

### 4. Configurar Ícones

Para Android, execute:

```bash
npx react-native link react-native-vector-icons
```

## 🏃‍♂️ Executar o App

### 1. Iniciar o Backend (Firebase Emulators)

Na pasta raiz do projeto:

```bash
firebase emulators:start
```

### 2. Executar o App React Native

**Android:**

```bash
npx react-native run-android
```

**iOS:**

```bash
npx react-native run-ios
```

## 📱 Funcionalidades

### ✅ Implementadas

- **Autenticação:** Login/registro com email e senha
- **Configuração de Perfil:** Escolha de idiomas nativo e alvo
- **Descoberta:** Lista de usuários para conversar baseada nos idiomas
- **Chat:** Mensagens em tempo real
- **Bloqueio:** Bloquear usuários indesejados

### 🔗 Conexões com Backend

O app se conecta com as Cloud Functions:

- `createUserProfile` - Criar perfil do usuário
- `updateUserProfile` - Atualizar idiomas
- `createChat` - Criar conversa
- `sendMessage` - Enviar mensagem
- `blockUser` - Bloquear usuário

## 🏗️ Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   └── MessageBubble.js # Bolha de mensagem
├── context/            # Context API para estado global
│   └── AuthContext.js  # Contexto de autenticação
├── navigation/         # Configuração de navegação
│   └── AppNavigator.js # Navegador principal
├── screens/           # Telas do app
│   ├── LoginScreen.js
│   ├── RegisterScreen.js
│   ├── ProfileSetupScreen.js
│   ├── DiscoveryScreen.js
│   ├── ChatListScreen.js
│   ├── ChatScreen.js
│   └── LoadingScreen.js
└── services/          # Serviços externos
    └── firebase.js    # Configuração e funções do Firebase
```

## 🛠️ Principais Tecnologias

- **React Native** - Framework mobile
- **Firebase Auth** - Autenticação
- **Firestore** - Banco de dados em tempo real
- **Cloud Functions** - Lógica do backend
- **React Navigation** - Navegação entre telas
- **React Native Vector Icons** - Ícones

## 🔧 Solução de Problemas

### Erro: "Could not find firebase config"

- Verifique se o `google-services.json` está na pasta correta
- Certifique-se de que o arquivo não é o placeholder

### Erro: "Metro bundler failed"

- Execute `npx react-native start --reset-cache`

### Erro de ícones no Android

- Execute `npx react-native link react-native-vector-icons`
- Recompile o app

### Problemas com emuladores

- Certifique-se de que os emuladores Firebase estão rodando
- Verifique se as portas estão corretas no `firebase.js`

## 📝 Próximos Passos

Para produção:

1. Configurar o Firebase para produção (remover emuladores)
2. Adicionar autenticação com Google/Apple
3. Implementar notificações push
4. Adicionar upload de imagens
5. Melhorar a interface e animações

## 🤝 Como Testar

1. **Registro:** Crie uma conta com email/senha
2. **Perfil:** Configure idiomas (ex: Português → Inglês)
3. **Descoberta:** Crie outro usuário com idiomas inversos (Inglês → Português)
4. **Chat:** Inicie uma conversa e teste as mensagens em tempo real
5. **Bloqueio:** Teste a funcionalidade de bloquear usuários
