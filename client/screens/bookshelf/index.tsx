/**
 * 我的书架页面
 * 显示已缓存的绘本，支持离线阅读
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { FontAwesome6 } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { createStyles } from './styles';
import { cacheService, CachedBookMeta } from '@/src/services/cacheService';

export default function BookshelfScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();

  const [cachedBooks, setCachedBooks] = useState<CachedBookMeta[]>([]);
  const [cacheSize, setCacheSize] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // 加载缓存数据
  useEffect(() => {
    loadCachedData();
  }, []);

  const loadCachedData = async () => {
    setIsLoading(true);
    try {
      const books = await cacheService.getCachedBooksList();
      const size = await cacheService.getCacheSize();
      setCachedBooks(books);
      setCacheSize(size);
    } catch (error) {
      console.error('Failed to load cached data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 格式化缓存大小
  const formatCacheSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 跳转到阅读页面
  const handleOpenBook = (bookId: string) => {
    router.push('/read', { bookId });
  };

  // 删除绘本缓存
  const handleDeleteBook = (book: CachedBookMeta) => {
    Alert.alert(
      '删除缓存',
      `确定要删除《${book.title}》的缓存吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            await cacheService.deleteCachedBook(book.id);
            loadCachedData();
          },
        },
      ]
    );
  };

  // 清除所有缓存
  const handleClearAll = () => {
    Alert.alert(
      '清除所有缓存',
      `确定要清除所有 ${cachedBooks.length} 本绘本的缓存吗？此操作不可恢复。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清除',
          style: 'destructive',
          onPress: async () => {
            await cacheService.clearAllCache();
            loadCachedData();
          },
        },
      ]
    );
  };

  // 等级标签颜色
  const getLevelColor = (level: number): string => {
    const colors = ['#10B981', '#3B82F6', '#8B5CF6'];
    return colors[level - 1] || colors[0];
  };

  if (isLoading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 100 }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <ThemedText variant="h2" color={theme.textPrimary}>
            📚 我的书架
          </ThemedText>
          <ThemedText variant="smallMedium" color={theme.textSecondary}>
            已下载的绘本可离线阅读
          </ThemedText>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{cachedBooks.length}</Text>
            <Text style={styles.statLabel}>已缓存绘本</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCacheSize(cacheSize)}</Text>
            <Text style={styles.statLabel}>占用空间</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {cachedBooks.filter(b => b.isFullyCached).length}
            </Text>
            <Text style={styles.statLabel}>完全缓存</Text>
          </View>
        </View>

        {/* Book List */}
        <View style={styles.scrollContent}>
          {cachedBooks.length === 0 ? (
            // Empty State
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📭</Text>
              <ThemedText variant="h3" color={theme.textPrimary} style={styles.emptyTitle}>
                书架空空如也
              </ThemedText>
              <ThemedText variant="smallMedium" color={theme.textSecondary} style={styles.emptySubtitle}>
                在阅读绘本时点击「下载」按钮，即可将绘本保存到书架
              </ThemedText>
            </View>
          ) : (
            <>
              {/* Section Header */}
              <View style={styles.sectionHeader}>
                <ThemedText variant="bodyMedium" color={theme.textPrimary}>
                  已缓存绘本
                </ThemedText>
                <TouchableOpacity style={styles.clearAllButton} onPress={handleClearAll}>
                  <Text style={styles.clearAllText}>清除全部</Text>
                </TouchableOpacity>
              </View>

              {/* Book Grid */}
              <View style={styles.bookGrid}>
                {cachedBooks.map((book) => (
                  <TouchableOpacity
                    key={book.id}
                    style={styles.bookCard}
                    onPress={() => handleOpenBook(book.id)}
                    activeOpacity={0.8}
                  >
                    {/* Cover */}
                    {book.coverImage ? (
                      <Image
                        source={{ uri: book.coverImage }}
                        style={styles.bookCover}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={styles.bookCoverPlaceholder}>
                        <Text style={styles.bookCoverPlaceholderText}>📖</Text>
                      </View>
                    )}

                    {/* Info */}
                    <View style={styles.bookInfo}>
                      <ThemedText
                        variant="smallMedium"
                        color={theme.textPrimary}
                        style={styles.bookTitle}
                        numberOfLines={1}
                      >
                        {book.title}
                      </ThemedText>
                      <ThemedText variant="caption" color={theme.textSecondary}>
                        Level {book.level} · {book.theme}
                      </ThemedText>

                      {/* Meta */}
                      <View style={styles.bookMeta}>
                        {/* Cached Badge */}
                        {book.isFullyCached ? (
                          <View style={styles.cachedBadge}>
                            <FontAwesome6 name="circle-check" size={10} color={theme.success} />
                            <Text style={styles.cachedBadgeText}>已缓存</Text>
                          </View>
                        ) : (
                          <View style={[styles.cachedBadge, { backgroundColor: 'rgba(234, 88, 12, 0.1)' }]}>
                            <FontAwesome6 name="clock" size={10} color="#EA580C" />
                            <Text style={[styles.cachedBadgeText, { color: '#EA580C' }]}>
                              {book.downloadedPages}/{book.totalPages}
                            </Text>
                          </View>
                        )}

                        {/* Delete Button */}
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteBook(book)}
                        >
                          <FontAwesome6 name="trash" size={14} color={theme.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
