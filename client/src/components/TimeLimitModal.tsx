/**
 * 限时保护弹窗组件
 * 用于提醒小朋友休息和保护眼睛
 * 支持儿童/成人模式切换
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
import { timeLimitService, AppMode } from '@/src/services/timeLimitService';
import { Spacing, BorderRadius } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface TimeLimitModalProps {
  visible: boolean;
  type: 'warning' | 'exceeded' | 'settings';
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
  const [appMode, setAppMode] = useState<AppMode>(timeLimitService.getMode());
  
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

  const handleModeSwitch = (mode: AppMode) => {
    timeLimitService.setMode(mode);
    setAppMode(mode);
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
          {/* 模式切换 */}
          <View style={styles.modeSwitchContainer}>
            <Text style={styles.modeLabel}>使用模式</Text>
            <View style={styles.modeSwitch}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  appMode === 'child' && styles.modeButtonActive,
                ]}
                onPress={() => handleModeSwitch('child')}
              >
                <Text style={styles.modeIcon}>🧒</Text>
                <Text style={[
                  styles.modeButtonText,
                  appMode === 'child' && styles.modeButtonTextActive,
                ]}>
                  儿童模式
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  appMode === 'adult' && styles.modeButtonActive,
                ]}
                onPress={() => handleModeSwitch('adult')}
              >
                <Text style={styles.modeIcon}>👤</Text>
                <Text style={[
                  styles.modeButtonText,
                  appMode === 'adult' && styles.modeButtonTextActive,
                ]}>
                  成人模式
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modeHint}>
              {appMode === 'child' 
                ? '儿童模式：每次限制 20 分钟' 
                : '成人模式：无时间限制'}
            </Text>
          </View>

          {/* 图标 */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>
              {type === 'warning' ? '⏰' : type === 'exceeded' ? '😴' : '⚙️'}
            </Text>
          </View>

          {/* 标题 */}
          <Text style={styles.title}>
            {type === 'warning' ? '休息提醒' : type === 'exceeded' ? '时间到啦' : '时间设置'}
          </Text>

          {/* 内容 */}
          {appMode === 'adult' ? (
            <Text style={styles.message}>
              当前为成人模式，无时间限制{'\n\n'}可以自由使用绘本功能
            </Text>
          ) : (
            <Text style={styles.message}>
              {type === 'warning' 
                ? `还剩 ${formatTime(remainingTime)} 就要休息啦\n\n小朋友，让眼睛休息一下吧~`
                : '你已经使用了 20 分钟啦！\n\n眼睛需要休息一下，去看看远处吧~'
              }
            </Text>
          )}

          {/* 进度条 - 仅儿童模式显示 */}
          {appMode === 'child' && (
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
          )}

          {/* 按钮区域 */}
          {!showParentVerify ? (
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton]} 
                onPress={onClose}
              >
                <Text style={styles.primaryButtonText}>
                  {appMode === 'adult' ? '确定' : type === 'warning' ? '我知道了' : '去休息'}
                </Text>
              </TouchableOpacity>
              
              {appMode === 'child' && (
                <TouchableOpacity 
                  style={[styles.button, styles.secondaryButton]} 
                  onPress={() => setShowParentVerify(true)}
                >
                  <Text style={styles.secondaryButtonText}>
                    家长延长使用
                  </Text>
                </TouchableOpacity>
              )}
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

const createModalStyles = (theme: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      width: width * 0.85,
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      alignItems: 'center',
    },
    modeSwitchContainer: {
      width: '100%',
      marginBottom: Spacing.lg,
    },
    modeLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: '#666',
      marginBottom: Spacing.sm,
      textAlign: 'center',
    },
    modeSwitch: {
      flexDirection: 'row',
      backgroundColor: '#F5F5F5',
      borderRadius: BorderRadius.lg,
      padding: 4,
    },
    modeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
    },
    modeButtonActive: {
      backgroundColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    modeIcon: {
      fontSize: 16,
      marginRight: 6,
    },
    modeButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#666',
    },
    modeButtonTextActive: {
      color: '#4A7C59',
      fontWeight: '600',
    },
    modeHint: {
      fontSize: 12,
      color: '#999',
      textAlign: 'center',
      marginTop: Spacing.xs,
    },
    iconContainer: {
      marginBottom: Spacing.md,
    },
    icon: {
      fontSize: 48,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: '#333',
      marginBottom: Spacing.md,
    },
    message: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: Spacing.lg,
    },
    progressContainer: {
      width: '100%',
      marginBottom: Spacing.lg,
    },
    progressBar: {
      height: 8,
      backgroundColor: '#E8E8E8',
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    progressText: {
      fontSize: 12,
      color: '#999',
      textAlign: 'center',
      marginTop: Spacing.xs,
    },
    buttonContainer: {
      width: '100%',
      gap: Spacing.sm,
    },
    button: {
      width: '100%',
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
    },
    primaryButton: {
      backgroundColor: '#4A7C59',
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButton: {
      backgroundColor: '#F5F5F5',
    },
    secondaryButtonText: {
      color: '#666',
      fontSize: 16,
      fontWeight: '500',
    },
    verifyContainer: {
      width: '100%',
      alignItems: 'center',
    },
    verifyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#333',
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
      backgroundColor: '#F5F5F5',
      borderRadius: BorderRadius.lg,
      textAlign: 'center',
      fontSize: 24,
      fontWeight: '600',
      color: '#333',
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
      color: '#996600',
      lineHeight: 18,
    },
  });
