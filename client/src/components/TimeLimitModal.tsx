/**
 * 限时保护弹窗组件
 * 用于提醒小朋友休息和保护眼睛
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { timeLimitService } from '@/src/services/timeLimitService';
import { Spacing, BorderRadius } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface TimeLimitModalProps {
  visible: boolean;
  type: 'warning' | 'exceeded';
  remainingTime: number;
  onClose: () => void;
  onExtend: () => void;
}

export function TimeLimitModal({
  visible,
  type,
  remainingTime,
  onClose,
  onExtend,
}: TimeLimitModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [showParentVerify, setShowParentVerify] = useState(false);
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyError, setVerifyError] = useState('');
  
  // 简单的数学验证题（家长验证）
  const [mathProblem] = useState(() => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    return { a, b, answer: a + b };
  });

  const styles = useMemo(() => createModalStyles(theme), [theme]);

  const handleVerify = () => {
    const inputNum = parseInt(verifyInput, 10);
    if (inputNum === mathProblem.answer) {
      // 验证通过
      setVerifyInput('');
      setVerifyError('');
      setShowParentVerify(false);
      onExtend();
    } else {
      setVerifyError('答案不正确，请重试');
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}分${seconds}秒`;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { paddingBottom: insets.bottom + Spacing.lg }]}>
          {/* 图标 */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>
              {type === 'warning' ? '⏰' : '😴'}
            </Text>
          </View>

          {/* 标题 */}
          <Text style={styles.title}>
            {type === 'warning' ? '休息提醒' : '时间到啦'}
          </Text>

          {/* 内容 */}
          <Text style={styles.message}>
            {type === 'warning' 
              ? `还剩 ${formatTime(remainingTime)} 就要休息啦\n\n小朋友，让眼睛休息一下吧~`
              : '你已经使用了 20 分钟啦！\n\n眼睛需要休息一下，去看看远处吧~'
            }
          </Text>

          {/* 进度条 */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.max(0, (remainingTime / (20 * 60 * 1000)) * 100)}%`,
                    backgroundColor: type === 'warning' ? '#FFA500' : '#FF6B6B',
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {type === 'warning' ? `剩余: ${formatTime(remainingTime)}` : '时间已用完'}
            </Text>
          </View>

          {/* 按钮区域 */}
          {!showParentVerify ? (
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton]} 
                onPress={onClose}
              >
                <Text style={styles.primaryButtonText}>
                  {type === 'warning' ? '我知道了' : '去休息'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton]} 
                onPress={() => setShowParentVerify(true)}
              >
                <Text style={styles.secondaryButtonText}>
                  家长延长使用
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.verifyContainer}>
              <Text style={styles.verifyTitle}>家长验证</Text>
              <Text style={styles.verifyQuestion}>
                请回答: {mathProblem.a} + {mathProblem.b} = ?
              </Text>
              
              <TextInput
                style={styles.verifyInput}
                value={verifyInput}
                onChangeText={(text) => {
                  setVerifyInput(text);
                  setVerifyError('');
                }}
                placeholder="输入答案"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                maxLength={3}
              />
              
              {verifyError ? (
                <Text style={styles.verifyError}>{verifyError}</Text>
              ) : null}
              
              <View style={styles.verifyButtonContainer}>
                <TouchableOpacity 
                  style={[styles.button, styles.secondaryButton]} 
                  onPress={() => {
                    setShowParentVerify(false);
                    setVerifyInput('');
                    setVerifyError('');
                  }}
                >
                  <Text style={styles.secondaryButtonText}>取消</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, styles.primaryButton]} 
                  onPress={handleVerify}
                >
                  <Text style={styles.primaryButtonText}>确认</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 护眼小贴士 */}
          <View style={styles.tipContainer}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>
              小贴士：每 20 分钟看 20 英尺外的物体 20 秒，可以保护眼睛哦！
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createModalStyles(theme: any) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.lg,
    },
    container: {
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      width: '100%',
      maxWidth: 400,
      alignItems: 'center',
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#FFF8E7',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    icon: {
      fontSize: 40,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: '#2D4A35',
      marginBottom: Spacing.md,
    },
    message: {
      fontSize: 16,
      color: '#5A6B5C',
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: Spacing.lg,
    },
    progressContainer: {
      width: '100%',
      marginBottom: Spacing.lg,
    },
    progressBar: {
      height: 12,
      backgroundColor: '#E8E8E8',
      borderRadius: 6,
      overflow: 'hidden',
      marginBottom: Spacing.sm,
    },
    progressFill: {
      height: '100%',
      borderRadius: 6,
    },
    progressText: {
      fontSize: 14,
      color: '#6B7B6D',
      textAlign: 'center',
      fontWeight: '500',
    },
    buttonContainer: {
      width: '100%',
      gap: Spacing.sm,
    },
    button: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      minWidth: 120,
    },
    primaryButton: {
      backgroundColor: '#4A7C59',
      flex: 1,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButton: {
      backgroundColor: '#F0F7F2',
      flex: 1,
    },
    secondaryButtonText: {
      color: '#4A7C59',
      fontSize: 16,
      fontWeight: '600',
    },
    verifyContainer: {
      width: '100%',
      alignItems: 'center',
    },
    verifyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#2D4A35',
      marginBottom: Spacing.md,
    },
    verifyQuestion: {
      fontSize: 20,
      fontWeight: '700',
      color: '#4A7C59',
      marginBottom: Spacing.md,
    },
    verifyInput: {
      width: '100%',
      height: 50,
      borderWidth: 2,
      borderColor: '#E8E8E8',
      borderRadius: BorderRadius.lg,
      fontSize: 20,
      textAlign: 'center',
      color: '#2D4A35',
      marginBottom: Spacing.sm,
    },
    verifyError: {
      color: '#FF6B6B',
      fontSize: 14,
      marginBottom: Spacing.sm,
    },
    verifyButtonContainer: {
      flexDirection: 'row',
      width: '100%',
      gap: Spacing.sm,
      marginTop: Spacing.sm,
    },
    tipContainer: {
      flexDirection: 'row',
      backgroundColor: '#FFF9E6',
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginTop: Spacing.lg,
      alignItems: 'flex-start',
    },
    tipIcon: {
      fontSize: 16,
      marginRight: Spacing.sm,
    },
    tipText: {
      flex: 1,
      fontSize: 12,
      color: '#8B6914',
      lineHeight: 18,
    },
  });
}
