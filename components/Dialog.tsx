import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, Platform, Modal } from 'react-native';
import { IconSymbol } from './IconSymbol';

interface DialogButton {
  text: string;
  onPress: () => void;
  style?: 'default' | 'destructive' | 'cancel';
}

interface DialogProps {
  visible?: boolean;
  title?: string;
  message?: string;
  buttons?: DialogButton[];
  onHide?: () => void;
  currentColors?: any;
}

export default function Dialog({
  visible = false,
  title = '',
  message = '',
  buttons = [],
  onHide = () => {},
  currentColors = {},
}: DialogProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, fadeAnim]);

  const getButtonColor = (style?: string) => {
    switch (style) {
      case 'destructive':
        return '#E26F5B';
      case 'cancel':
        return '#888888';
      default:
        return '#FFFFFF';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
            backgroundColor: `rgba(0, 0, 0, ${0.5 * (fadeAnim as any)._value})`,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.dialogContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={[styles.dialog, { backgroundColor: '#2A2A2A' }]}>
            {title && (
              <Text style={[styles.title, { color: '#FFFFFF' }]}>
                {title}
              </Text>
            )}

            {message && (
              <Text style={[styles.message, { color: '#AAAAAA' }]}>
                {message}
              </Text>
            )}

            <View style={styles.buttonContainer}>
              {buttons.map((button, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.button,
                    index !== buttons.length - 1 && styles.buttonBorder,
                    { borderBottomColor: currentColors.background },
                  ]}
                  onPress={() => {
                    button.onPress();
                    onHide();
                  }}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      {
                        color: getButtonColor(button.style),
                        fontWeight: button.style === 'destructive' ? '600' : '500',
                      },
                    ]}
                  >
                    {button.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    width: '85%',
    maxWidth: 400,
  },
  dialog: {
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.12)',
    elevation: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 24,
    paddingTop: 24,
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  buttonContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    overflow: 'hidden',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  buttonText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
