/**
 * 经典绘本馆 - 收藏和管理的绘本
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { createStyles } from './styles';
import { Spacing } from '@/constants/theme';
import { getApiBaseUrl } from '@/src/config/api';

// 筛选选项
const FILTER_OPTIONS = [
  { id: 'all', label: '全部', icon: '📚' },
  { id: 'favorite', label: '已收藏', icon: '❤️' },
  { id: 'level1', label: '启蒙版', icon: '🌱' },
  { id: 'level2', label: '成长版', icon: '🌿' },
  { id: 'level3', label: '飞跃版', icon: '🌳' },
];

// 排序选项
const SORT_OPTIONS = [
  { id: 'newest', label: '最新' },
  { id: 'oldest', label: '最早' },
  { id: 'level', label: '等级' },
];

interface Book {
  id: string;
  title: string;
  theme: string;
  level: number;
  interest_tag: string | null;
  cover_image_url: string | null;
  is_favorite: boolean;
  created_at: string;
}

type TabType = 'all' | 'generated' | 'uploaded';

export default function LibraryScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();

  // State
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeSort, setActiveSort] = useState('newest');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [stats, setStats] = useState({ total: 0, favorites: 0, generated: 0, uploaded: 0 });

  // 获取绘本列表
  const fetchBooks = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (activeFilter !== 'all') {
        if (activeFilter === 'favorite') params.append('favorite', 'true');
        else if (activeFilter.startsWith('level')) {
          params.append('level', activeFilter.replace('level', ''));
        }
      }
      if (activeSort) params.append('sort', activeSort);
      if (activeTab !== 'all') params.append('source', activeTab);

      const response = await fetch(`${getApiBaseUrl()}/api/v1/books/library?${params.toString()}`);
      const data = await response.json();
      
      setBooks(data.books || []);
      setStats(data.stats || { total: 0, favorites: 0, generated: 0, uploaded: 0 });
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, activeFilter, activeSort, activeTab]);

  // 页面聚焦时刷新
  useFocusEffect(
    useCallback(() => {
      fetchBooks();
    }, [fetchBooks])
  );

  // 切换收藏状态
  const toggleFavorite = async (bookId: string, currentStatus: boolean) => {
    try {
      await fetch(`${getApiBaseUrl()}/api/v1/books/${bookId}/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_favorite: !currentStatus }),
      });
      
      // 更新本地状态
      setBooks(prevBooks => 
        prevBooks.map(book => 
          book.id === bookId ? { ...book, is_favorite: !currentStatus } : book
        )
      );
      
      // 更新统计
      setStats(prev => ({
        ...prev,
        favorites: currentStatus ? prev.favorites - 1 : prev.favorites + 1,
      }));
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  // 阅读绘本
  const handleReadBook = (bookId: string) => {
    router.push('/read', { bookId });
  };

  // 返回
  const handleBack = () => {
    router.back();
  };

  // 清空搜索
  const clearSearch = () => {
    setSearchQuery('');
  };

  // 获取等级名称
  const getLevelName = (level: number) => {
    switch (level) {
      case 1: return '启蒙版';
      case 2: return '成长版';
      case 3: return '飞跃版';
      default: return `Level ${level}`;
    }
  };

  // 获取等级图标
  const getLevelIcon = (level: number) => {
    switch (level) {
      case 1: return '🌱';
      case 2: return '🌿';
      case 3: return '🌳';
      default: return '📖';
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  // 渲染绘本卡片
  const renderBookCard = ({ item }: { item: Book }) => (
    <TouchableOpacity 
      style={styles.bookCard} 
      onPress={() => handleReadBook(item.id)}
      activeOpacity={0.8}
    >
      {/* 收藏按钮 */}
      <TouchableOpacity 
        style={styles.favoriteButton}
        onPress={() => toggleFavorite(item.id, item.is_favorite)}
      >
        <Text style={styles.favoriteIcon}>
          {item.is_favorite ? '❤️' : '🤍'}
        </Text>
      </TouchableOpacity>

      {/* 图标 */}
      <View style={styles.bookIconContainer}>
        <Text style={styles.bookIcon}>{getLevelIcon(item.level)}</Text>
      </View>

      {/* 标题 */}
      <Text style={styles.bookTitle} numberOfLines={1}>
        {item.theme}
      </Text>
      
      {/* 主题 */}
      {item.interest_tag && (
        <Text style={styles.bookTheme} numberOfLines={1}>
          {item.interest_tag}
        </Text>
      )}

      {/* 标签 */}
      <View style={styles.bookTags}>
        <View style={styles.levelTag}>
          <Text style={styles.levelTagText}>{getLevelName(item.level)}</Text>
        </View>
        <View style={styles.dateTag}>
          <Text style={styles.dateTagText}>{formatDate(item.created_at)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // 渲染空状态
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📚</Text>
      <Text style={styles.emptyTitle}>暂无绘本</Text>
      <Text style={styles.emptyText}>
        {searchQuery ? '没有找到匹配的绘本' : '快去生成或上传绘本吧！'}
      </Text>
    </View>
  );

  return (
    <Screen backgroundColor="#FFF8E7" statusBarStyle="light" safeAreaEdges={['left', 'right', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📚 经典绘本馆</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="搜索绘本主题、标签..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={fetchBooks}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab Section */}
      <View style={styles.tabSection}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            全部 ({stats.total})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'generated' && styles.tabActive]}
          onPress={() => setActiveTab('generated')}
        >
          <Text style={[styles.tabText, activeTab === 'generated' && styles.tabTextActive]}>
            生成的 ({stats.generated})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'uploaded' && styles.tabActive]}
          onPress={() => setActiveTab('uploaded')}
        >
          <Text style={[styles.tabText, activeTab === 'uploaded' && styles.tabTextActive]}>
            上传的 ({stats.uploaded})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Section */}
      <View style={styles.filterSection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {FILTER_OPTIONS.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[styles.filterChip, activeFilter === filter.id && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter.id)}
            >
              <Text style={[styles.filterChipText, activeFilter === filter.id && styles.filterChipTextActive]}>
                {filter.icon} {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>全部绘本</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.favorites}</Text>
          <Text style={styles.statLabel}>已收藏</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.generated}</Text>
          <Text style={styles.statLabel}>生成的</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.uploaded}</Text>
          <Text style={styles.statLabel}>上传的</Text>
        </View>
      </View>

      {/* Books Grid */}
      <View style={styles.booksSection}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A7C59" />
          </View>
        ) : (
          <FlatList
            data={books}
            renderItem={renderBookCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            contentContainerStyle={{ paddingBottom: insets.bottom + Spacing['2xl'] }}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Screen>
  );
}
