import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function MessageBubble({message, isOwn}) {
  const formatTime = timestamp => {
    if (!timestamp) return '';

    const date = timestamp.toDate();
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View
      style={[
        styles.container,
        isOwn ? styles.ownMessage : styles.otherMessage,
      ]}>
      <View
        style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        <Text
          style={[
            styles.messageText,
            isOwn ? styles.ownText : styles.otherText,
          ]}>
          {message.textContent}
        </Text>

        <Text
          style={[
            styles.timeText,
            isOwn ? styles.ownTimeText : styles.otherTimeText,
          ]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    paddingHorizontal: 16,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ownBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#E5E5EA',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownText: {
    color: '#fff',
  },
  otherText: {
    color: '#000',
  },
  timeText: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  ownTimeText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimeText: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
});
