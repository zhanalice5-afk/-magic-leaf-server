/**
 * 下载按钮组件
 * 显示下载状态和进度，支持下载和删除缓存
 */

import React, { useState, useEffect } from 'react';
import { TouchableOpacity, View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { cacheService, CachedBookMeta } from '@/src/services/cacheService';
import { getApiBaseUrl } from '@/src/config/api';

interface DownloadButtonProps {
  bookId: string;
  book: any;
  onDownloadStart?: () => void;
  onDownloadComplete?: () => void;
  onDownloadError?: (error: Error) => void;
  size?: 'small' | 'medium' | 'large';
}

export function DownloadButton({
  bookId,
  book,
  onDownloadStart,
  onDownloadComplete,
  onDownloadError,
  size = 'medium',
}: DownloadButtonProps) {
  const { theme } = useTheme();
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cachedMeta, setCachedMeta] = useState<CachedBookMeta | null>(null);

  // 检查缓存状态
  useEffect(() => {
    checkCacheStatus();
  }, [bookId]);

  const checkCacheStatus = async () => {
    const meta = await cacheService.getCachedBookMeta(bookId);
    setCachedMeta(meta);
  };

  const handleDownload = async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    setProgress(0);
    onDownloadStart?.();

    try {
      // 先缓存绘本元数据
      await cacheService.cacheBook(book);
      
      // 获取 API 基础 URL
      const apiBaseUrl = getApiBaseUrl();
      
      // 下载所有资源（包括音频）
      await cacheService.downloadBookAssetsWithAudio(
        bookId, 
        book, 
        (p) => {
          setProgress(Math.round(p * 100));
        },
        true, // 包含音频
        apiBaseUrl
      );

      // 刷新状态
      await checkCacheStatus();
      onDownloadComplete?.();
      
      Alert.alert('下载完成', '绘本已缓存到本地，可以离线阅读了！');
    } catch (error) {
      console.error('Download failed:', error);
      onDownloadError?.(error as Error);
      Alert.alert('下载失败', '请检查网络连接后重试');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      '删除缓存',
      '确定要删除这本绘本的缓存吗？删除后需要重新下载才能离线阅读。',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '删除', 
          style: 'destructive',
          onPress: async () => {
            await cacheService.deleteCachedBook(bookId);
            setCachedMeta(null);
          }
        }
      ]
    );
  };

  const iconSize = size === 'small' ? 16 : size === 'medium' ? 20 : 24;
  const textSize = size === 'small' ? 'caption' : size === 'medium' ? 'smallMedium' : 'bodyMedium';

  // 下载中状态
  if (isDownloading) {
    return (
      <View style={[styles.container, styles.downloading]}>
        <ActivityIndicator size="small" color={theme.primary} />
        <ThemedText variant={textSize} color={theme.textSecondary} style={styles.text}>
          {progress}%
        </ThemedText>
      </View>
    );
  }

  // 已缓存状态
  if (cachedMeta?.isFullyCached) {
    return (
      <TouchableOpacity style={[styles.container, styles.cached]} onPress={handleDelete}>
        <FontAwesome6 name="circle-check" size={iconSize} color={theme.success} />
        <ThemedText variant={textSize} color={theme.success} style={styles.text}>
          已缓存(离线可用)
        </ThemedText>
      </TouchableOpacity>
    );
  }

  // 部分缓存状态
  if (cachedMeta && !cachedMeta.isFullyCached) {
    return (
      <TouchableOpacity style={[styles.container, styles.partial]} onPress={handleDownload}>
        <FontAwesome6 name="cloud-arrow-down" size={iconSize} color={theme.primary} />
        <ThemedText variant={textSize} color={theme.primary} style={styles.text}>
          继续下载
        </ThemedText>
      </TouchableOpacity>
    );
  }

  // 未缓存状态
  return (
    <TouchableOpacity style={[styles.container, styles.notCached]} onPress={handleDownload}>
      <FontAwesome6 name="cloud-arrow-down" size={iconSize} color={theme.textSecondary} />
      <ThemedText variant={textSize} color={theme.textSecondary} style={styles.text}>
        下载离线包
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  downloading: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  cached: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
  },
  partial: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  notCached: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  text: {
    fontWeight: '500',
  },
});
