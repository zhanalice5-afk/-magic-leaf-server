/**
 * 限时保护计时器组件
 * 显示在界面顶部，方便查看剩余时间
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { timeLimitService } from '@/src/services/timeLimitService';
import { Spacing, BorderRadius } from '@/constants/theme';

interface TimeLimitTimerProps {
  onPress?: () => void;
}

export function TimeLimitTimer({ onPress }: TimeLimitTimerProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [remainingTime, setRemainingTime] = useState(timeLimitService.getRemainingTime());
  const [isExceeded, setIsExceeded] = useState(timeLimitService.isTimeExceeded());

  useEffect(() => {
    const unsubscribe = timeLimitService.addListener((remaining, exceeded) => {
      setRemainingTime(remaining);
      setIsExceeded(exceeded);
    });

    return () => unsubscribe();
  }, []);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const totalTime = 20 * 60 * 1000; // 20 分钟
    return Math.max(0, (remainingTime / totalTime) * 100);
  };

  const getStatusColor = () => {
    if (isExceeded) return '#FF6B6B';
    if (remainingTime <= 5 * 60 * 1000) return '#FFA500'; // 5 分钟内
    return '#4A7C59';
  };

  const statusColor = getStatusColor();

  return (
    <TouchableOpacity 
      style={[styles.container, { top: insets.top + 8 }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>⏱️</Text>
      </View>
      
      <View style={styles.timeContainer}>
        <Text style={[styles.timeText, { color: statusColor }]}>
          {isExceeded ? '时间到' : formatTime(remainingTime)}
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${getProgressPercentage()}%`,
                backgroundColor: statusColor,
              }
            ]} 
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 100,
  },
  iconContainer: {
    marginRight: Spacing.xs,
  },
  icon: {
    fontSize: 16,
  },
  timeContainer: {
    minWidth: 70,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  progressBar: {
    height: 3,
    backgroundColor: '#E8E8E8',
    borderRadius: 1.5,
    marginTop: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
});
