
import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { IconSymbol } from './IconSymbol';
import { BlurView } from 'expo-blur';

interface ToastProps {
  visible?: boolean;
  message?: string;
  duration?: number;
  onHide?: () => void;
  type?: 'success' | 'error' | 'info';
  currentColors?: any;
}

export default function Toast({ 
  visible = false, 
  message = '', 
  duration = 2000, 
  onHide = () => {}, 
  type = 'success',
  currentColors = {}
}: ToastProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;

  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'checkmark.circle.fill';
      case 'error':
        return 'error';
      case 'info':
        return 'info';
      default:
        return 'checkmark.circle.fill';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return '#00AA00';
      case 'error':
        return '#E26F5B';
      case 'info':
        return '#000000';
      default:
        return '#00AA00';
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#2A2A2A';
      case 'error':
        return '#2A2A2A';
      case 'info':
        return '#2A2A2A';
      default:
        return '#2A2A2A';
    }
  };

  const hideToast = useCallback(() => {
    console.log('Toast hiding');
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  }, [fadeAnim, translateY, onHide]);

  useEffect(() => {
    if (visible) {
      console.log('Toast showing:', message);
      // Fade in and slide down
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, message, duration, fadeAnim, translateY, hideToast]);

  if (!visible && (fadeAnim as any)._value === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
      pointerEvents="none"
    >
      <View style={[
        styles.content, 
        { 
          backgroundColor: getBackgroundColor(),
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.3)',
        }
      ]}>
        <IconSymbol name={getIconName()} size={24} color={getIconColor()} />
        <Text style={[styles.message, { color: '#FFFFFF' }]} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 20,
    right: 20,
    zIndex: 9999,
    elevation: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderRadius: 16,
    elevation: 8,
  },
  message: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    color: '#FFFFFF',
  },
});
