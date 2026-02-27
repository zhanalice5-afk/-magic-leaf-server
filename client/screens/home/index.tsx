import React, { useState, useCallback, useMemo } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  View,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { createStyles } from './styles';

// Level configurations
const LEVELS = [
  {
    level: 1,
    name: '启蒙版',
    emoji: '🌱',
    description: '词汇启蒙\n简单短语',
  },
  {
    level: 2,
    name: '成长版',
    emoji: '🌿',
    description: '简单句式\n重复表达',
  },
  {
    level: 3,
    name: '飞跃版',
    emoji: '🌳',
    description: '完整故事\n逻辑叙事',
  },
];

// Theme suggestions based on level
const THEME_SUGGESTIONS: Record<number, { emoji: string; name: string }[]> = {
  1: [
    { emoji: '🐱', name: '动物' },
    { emoji: '🌈', name: '颜色' },
    { emoji: '🔢', name: '数字' },
    { emoji: '🍎', name: '水果' },
    { emoji: '🚗', name: '交通' },
    { emoji: '🎈', name: '玩具' },
  ],
  2: [
    { emoji: '👨‍👩‍👧', name: '家庭' },
    { emoji: '🏫', name: '学校' },
    { emoji: '😊', name: '情绪' },
    { emoji: '🌅', name: '季节' },
    { emoji: '🎮', name: '游戏' },
    { emoji: '🍳', name: '食物' },
  ],
  3: [
    { emoji: '🔬', name: '科学' },
    { emoji: '🧚', name: '传说' },
    { emoji: '🗺️', name: '冒险' },
    { emoji: '🌟', name: '自然' },
    { emoji: '🎭', name: '成长' },
    { emoji: '🤝', name: '友谊' },
  ],
};

interface Book {
  id: string;
  title: string;
  level: number;
  theme: string;
  interest_tag: string;
  created_at: string;
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();

  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [interestTag, setInterestTag] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);

  // Fetch recent books on mount
  React.useEffect(() => {
    fetchRecentBooks();
  }, []);

  const fetchRecentBooks = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/books?limit=5`);
      const data = await response.json();
      setRecentBooks(data.books || []);
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setIsLoadingBooks(false);
    }
  };

  const themes = THEME_SUGGESTIONS[selectedLevel] || THEME_SUGGESTIONS[1];

  const handleGenerateBook = useCallback(async () => {
    if (!selectedTheme) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/books/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level: selectedLevel,
          theme: selectedTheme,
          interestTag: interestTag || selectedTheme,
        }),
      });

      const data = await response.json();

      if (data.book) {
        // Navigate to reading page
        router.push('/read', { bookId: data.book.id });
      }
    } catch (error) {
      console.error('Failed to generate book:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedLevel, selectedTheme, interestTag, router]);

  const handleReadBook = useCallback((bookId: string) => {
    router.push('/read', { bookId });
  }, [router]);

  const isGenerateEnabled = selectedTheme !== '';

  return (
    <Screen
      backgroundColor="#FFF8E7"
      statusBarStyle="light"
      safeAreaEdges={['left', 'right', 'bottom']}
    >
      {/* Header with gradient */}
      <View style={[styles.headerGradient, { paddingTop: insets.top + Spacing.lg }]}>
        <ThemedText style={styles.leafIcon}>🍃</ThemedText>
        <ThemedText style={styles.headerTitle}>Magic Leaf</ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          双语互动绘本 · 开启奇妙故事之旅
        </ThemedText>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing['2xl'] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Level Selection */}
        <ThemedText style={styles.sectionTitle}>选择学习等级</ThemedText>
        <View style={styles.levelContainer}>
          {LEVELS.map((level) => (
            <TouchableOpacity
              key={level.level}
              style={[
                styles.levelCard,
                selectedLevel === level.level && styles.levelCardSelected,
                level.level === 1 && styles.level1Card,
                level.level === 2 && styles.level2Card,
                level.level === 3 && styles.level3Card,
              ]}
              onPress={() => {
                setSelectedLevel(level.level);
                setSelectedTheme(''); // Reset theme when level changes
              }}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.levelEmoji}>{level.emoji}</ThemedText>
              <ThemedText style={styles.levelName}>{level.name}</ThemedText>
              <ThemedText style={styles.levelDesc}>{level.description}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Theme Selection */}
        <ThemedText style={styles.sectionTitle}>选择故事主题</ThemedText>
        <View style={styles.themeGrid}>
          {themes.map((themeItem) => (
            <TouchableOpacity
              key={themeItem.name}
              style={[
                styles.themeCard,
                selectedTheme === themeItem.name && styles.themeCardSelected,
              ]}
              onPress={() => setSelectedTheme(themeItem.name)}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.themeEmoji}>{themeItem.emoji}</ThemedText>
              <ThemedText style={styles.themeName}>{themeItem.name}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Interest Tag Input */}
        <View style={styles.inputSection}>
          <ThemedText style={styles.inputLabel}>宝贝的兴趣标签（可选）</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="例如：恐龙、公主、机器人..."
            placeholderTextColor="#B8C9BC"
            value={interestTag}
            onChangeText={setInterestTag}
          />
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[
            styles.generateButton,
            !isGenerateEnabled && styles.generateButtonDisabled,
          ]}
          onPress={handleGenerateBook}
          disabled={!isGenerateEnabled || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <ThemedText style={styles.generateButtonText}>
              ✨ 生成魔法绘本
            </ThemedText>
          )}
        </TouchableOpacity>

        {/* Recent Books */}
        <View style={styles.booksSection}>
          <ThemedText style={styles.sectionTitle}>最近绘本</ThemedText>
          {isLoadingBooks ? (
            <ActivityIndicator color="#4A7C59" size="large" />
          ) : recentBooks.length > 0 ? (
            recentBooks.map((book) => (
              <TouchableOpacity
                key={book.id}
                style={styles.bookCard}
                onPress={() => handleReadBook(book.id)}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: `https://picsum.photos/120/160?random=${book.id}` }}
                  style={styles.bookCover}
                />
                <View style={styles.bookInfo}>
                  <ThemedText style={styles.bookTitle} numberOfLines={1}>
                    {book.theme} - Level {book.level}
                  </ThemedText>
                  <ThemedText style={styles.bookMeta}>
                    {book.interest_tag} · {new Date(book.created_at).toLocaleDateString()}
                  </ThemedText>
                  <ThemedText style={styles.bookLevel}>
                    {LEVELS.find(l => l.level === book.level)?.name || 'Level ' + book.level}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyEmoji}>📚</ThemedText>
              <ThemedText style={styles.emptyText}>
                还没有绘本哦\n选择主题开始创作吧！
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

// Import Spacing for header padding
import { Spacing } from '@/constants/theme';
