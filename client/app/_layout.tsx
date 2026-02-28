import { useEffect, useState, useCallback } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox, AppState, AppStateStatus } from 'react-native';
import Toast from 'react-native-toast-message';
import { AuthProvider } from "@/contexts/AuthContext";
import { ColorSchemeProvider } from '@/hooks/useColorScheme';
import { timeLimitService } from '@/src/services/timeLimitService';
import { TimeLimitModal } from '@/src/components/TimeLimitModal';
import { TimeLimitTimer } from '@/src/components/TimeLimitTimer';

LogBox.ignoreLogs([
  "TurboModuleRegistry.getEnabling(...): 'RNMapsAirModule' could not be found",
]);

export default function RootLayout() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [showExceeded, setShowExceeded] = useState(false);
  const [remainingTime, setRemainingTime] = useState(20 * 60 * 1000);

  // 初始化限时服务
  useEffect(() => {
    const init = async () => {
      await timeLimitService.initialize();
      setIsInitialized(true);
      
      // 设置当前剩余时间
      setRemainingTime(timeLimitService.getRemainingTime());
      
      // 如果已经超时，直接显示超时弹窗
      if (timeLimitService.isTimeExceeded()) {
        setShowExceeded(true);
      }
    };
    
    init();
    
    // 设置警告回调
    timeLimitService.setWarningCallback(() => {
      setShowWarning(true);
    });
    
    // 设置超时回调
    timeLimitService.setExceededCallback(() => {
      setShowExceeded(true);
    });
    
    // 监听时间变化
    const unsubscribe = timeLimitService.addListener((remaining) => {
      setRemainingTime(remaining);
    });
    
    // 监听应用状态
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // 应用回到前台，更新活跃时间
        timeLimitService.updateActivity();
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      unsubscribe();
      subscription.remove();
      timeLimitService.stopPeriodicCheck();
    };
  }, []);

  // 处理延长使用
  const handleExtendTime = useCallback(() => {
    timeLimitService.extendTime(10); // 延长 10 分钟
    setShowWarning(false);
    setShowExceeded(false);
  }, []);

  // 处理关闭弹窗
  const handleCloseModal = useCallback(() => {
    setShowWarning(false);
    // 允许关闭弹窗，但显示半透明遮罩提示用户
    setShowExceeded(false);
  }, []);

  // 计时器点击事件
  const handleTimerPress = useCallback(() => {
    if (timeLimitService.isTimeExceeded()) {
      setShowExceeded(true);
    } else if (timeLimitService.getRemainingTime() <= 5 * 60 * 1000) {
      setShowWarning(true);
    }
  }, []);

  return (
    <AuthProvider>
      <ColorSchemeProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar style="dark"></StatusBar>
          
          {isInitialized && (
            <>
              <Stack screenOptions={{
                animation: 'slide_from_right',
                gestureEnabled: true,
                gestureDirection: 'horizontal',
                headerShown: false
              }}>
                <Stack.Screen name="index" options={{ title: "" }} />
                <Stack.Screen name="read" options={{ title: "阅读绘本" }} />
              </Stack>
              
              {/* 限时计时器 */}
              <TimeLimitTimer onPress={handleTimerPress} />
              
              {/* 警告弹窗 */}
              <TimeLimitModal
                visible={showWarning && !showExceeded}
                type="warning"
                remainingTime={remainingTime}
                onClose={handleCloseModal}
                onExtend={handleExtendTime}
              />
              
              {/* 超时弹窗 */}
              <TimeLimitModal
                visible={showExceeded}
                type="exceeded"
                remainingTime={0}
                onClose={handleCloseModal}
                onExtend={handleExtendTime}
              />
            </>
          )}
          
          <Toast />
        </GestureHandlerRootView>
      </ColorSchemeProvider>
    </AuthProvider>
  );
}
