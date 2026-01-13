import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/AppContext';
import { BlurView } from 'expo-blur';

export interface TabBarItem {
  name: string;
  route: string;
  icon: string;
  label: string;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
  containerWidth?: number;
  borderRadius?: number;
  bottomMargin?: number;
}

export default function FloatingTabBar({
  tabs,
  containerWidth = 350,
  borderRadius = 0,
  bottomMargin = 0,
}: FloatingTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { cart, currentColors } = useApp();

  const handleTabPress = (route: string) => {
    console.log('Tab pressed:', route);
    router.push(route as any);
  };

  const isActive = (route: string) => {
    if (route === '/(tabs)/(home)/') {
      return pathname === '/' || pathname.startsWith('/(tabs)/(home)');
    }
    return pathname.includes(route.split('/').pop() || '');
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const cartItemCount = getCartItemCount();

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.tabBarWrapper}>
        {/* Texture overlay */}
        <View style={styles.textureOverlay} />
        
        <BlurView
          intensity={90}
          tint="light"
          style={styles.blurContainer}
        >
          <View
            style={styles.tabBar}
          >
            {tabs.map((tab) => {
              const active = isActive(tab.route);
              const isCartTab = tab.name === 'cart';
              
              return (
                <TouchableOpacity
                  key={tab.name}
                  style={styles.tab}
                  onPress={() => handleTabPress(tab.route)}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconContainer}>
                    <IconSymbol
                      name={tab.icon as any}
                      size={24}
                      color={active ? '#FFFFFF' : '#888888'}
                    />
                    {isCartTab && cartItemCount > 0 && (
                      <View
                        style={styles.badge}
                      >
                        <Text style={[styles.badgeText, { color: '#FFFFFF' }]}>
                          {cartItemCount > 99 ? '99+' : cartItemCount}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.label,
                      { color: active ? '#FFFFFF' : '#888888' },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </BlurView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2A2A2A',
  },
  tabBarWrapper: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
    borderTopWidth: 0.2,
    borderTopColor: '#00BC7D',
  },
  textureOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    opacity: 0.02,
    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,.02) 2px, rgba(0,0,0,.02) 4px)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  blurContainer: {
    overflow: 'hidden',
  },
  tabBar: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 0,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    boxShadow: '0px -2px 8px rgba(0, 0, 0, 0.3)',
    elevation: 4,
    backgroundColor: '#2A2A2A',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    position: 'relative',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -12,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    boxShadow: '0px 2px 8px rgba(226, 111, 91, 0.4)',
    elevation: 4,
    backgroundColor: '#E26F5B',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
});