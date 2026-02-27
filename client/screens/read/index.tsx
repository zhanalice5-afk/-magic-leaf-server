import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { createStyles } from './styles';

interface Spotlight {
  object: string;
  phonics: string;
  animation_effect?: string;
}

interface BookPage {
  page_num: number;
  text_en: string;
  text_zh: string;
  audio_hint: string;
  image_prompt?: string;
  spotlight: Spotlight[];
}

interface BookInteraction {
  branching_options?: { label: string; leads_to: string }[];
  character_dialogue: string;
}

interface Book {
  id: string;
  title: string;
  level: number;
  theme: string;
  interest_tag: string;
  content: BookPage[];
  interaction: BookInteraction;
  created_at: string;
}

export default function ReadScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ bookId: string }>();
  const bookId = params.bookId;

  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeSpotlight, setActiveSpotlight] = useState<string | null>(null);

  // Fetch book data
  useEffect(() => {
    if (!bookId) {
      setError('绘本ID不存在');
      setIsLoading(false);
      return;
    }

    const fetchBook = async () => {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/books/${bookId}`
        );
        const data = await response.json();

        if (data.book) {
          setBook(data.book);
        } else {
          setError('绘本不存在');
        }
      } catch (err) {
        console.error('Failed to fetch book:', err);
        setError('加载失败，请重试');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBook();
  }, [bookId]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      setActiveSpotlight(null);
    }
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (book && currentPage < book.content.length - 1) {
      setCurrentPage(currentPage + 1);
      setActiveSpotlight(null);
    }
  }, [book, currentPage]);

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setError(null);
    // Re-trigger the effect
    if (bookId) {
      fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/books/${bookId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.book) {
            setBook(data.book);
          } else {
            setError('绘本不存在');
          }
        })
        .catch((err) => {
          console.error('Failed to fetch book:', err);
          setError('加载失败，请重试');
        })
        .finally(() => setIsLoading(false));
    }
  }, [bookId]);

  // Loading state
  if (isLoading) {
    return (
      <Screen backgroundColor="#FFF8E7" statusBarStyle="dark">
        <View style={styles.loadingContainer}>
          <View style={styles.loadingAnimation}>
            <Image
              source={{ uri: 'https://media.giphy.com/media/3oKIPnAiaMCshq0Cac/giphy.gif' }}
              style={{ width: 120, height: 120 }}
              contentFit="contain"
            />
          </View>
          <ThemedText style={styles.loadingText}>正在打开魔法绘本...</ThemedText>
          <ThemedText style={styles.loadingSubtext}>
            魔法叶子正在施展神奇咒语 ✨
          </ThemedText>
        </View>
      </Screen>
    );
  }

  // Error state
  if (error || !book) {
    return (
      <Screen backgroundColor="#FFF8E7" statusBarStyle="dark">
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorEmoji}>😢</ThemedText>
          <ThemedText style={styles.errorText}>
            {error || '绘本加载失败'}
          </ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <ThemedText style={styles.retryButtonText}>重新加载</ThemedText>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  const currentPageData = book.content[currentPage];
  const totalPages = book.content.length;

  return (
    <Screen backgroundColor="#FFF8E7" statusBarStyle="dark">
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <ThemedText style={styles.backButtonText}>←</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} numberOfLines={1}>
          {book.theme}
        </ThemedText>
        <ThemedText style={styles.pageIndicator}>
          {currentPage + 1} / {totalPages}
        </ThemedText>
      </View>

      {/* Page Content */}
      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={[
          styles.pageContent,
          { paddingBottom: insets.bottom + Spacing['6xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Illustration */}
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: `https://picsum.photos/800/600?random=${book.id}-${currentPage}`,
            }}
            style={styles.pageImage}
            contentFit="cover"
            transition={300}
          />
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <ThemedText style={styles.englishText}>{currentPageData.text_en}</ThemedText>
          <ThemedText style={styles.chineseText}>{currentPageData.text_zh}</ThemedText>
        </View>

        {/* Audio Hint */}
        {currentPageData.audio_hint && (
          <View style={styles.audioHint}>
            <ThemedText style={styles.audioHintIcon}>💡</ThemedText>
            <ThemedText style={styles.audioHintText}>
              {currentPageData.audio_hint}
            </ThemedText>
          </View>
        )}

        {/* Spotlight Words */}
        {currentPageData.spotlight && currentPageData.spotlight.length > 0 && (
          <View style={styles.spotlightSection}>
            <ThemedText style={styles.spotlightTitle}>✨ 聚光灯词汇</ThemedText>
            <View style={styles.spotlightGrid}>
              {currentPageData.spotlight.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.spotlightCard,
                    activeSpotlight === item.object && styles.spotlightCardActive,
                  ]}
                  onPress={() =>
                    setActiveSpotlight(
                      activeSpotlight === item.object ? null : item.object
                    )
                  }
                  activeOpacity={0.7}
                >
                  <ThemedText style={styles.spotlightEmoji}>
                    {getEmojiForWord(item.object)}
                  </ThemedText>
                  <ThemedText style={styles.spotlightWord}>{item.object}</ThemedText>
                  <ThemedText style={styles.spotlightPhonics}>
                    {item.phonics}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Interaction Section (on last page) */}
        {currentPage === totalPages - 1 && book.interaction && (
          <View style={styles.interactionSection}>
            <ThemedText style={styles.buddyAvatar}>🧚</ThemedText>
            <ThemedText style={styles.buddyDialogue}>
              {book.interaction.character_dialogue}
            </ThemedText>

            {/* Branching Options for Level 3 */}
            {book.interaction.branching_options &&
              book.interaction.branching_options.length > 0 && (
                <View style={styles.branchingContainer}>
                  {book.interaction.branching_options.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.branchButton}
                      activeOpacity={0.7}
                    >
                      <ThemedText style={styles.branchButtonText}>
                        {option.label}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
          </View>
        )}
      </ScrollView>

      {/* Navigation */}
      <View style={[styles.navigationContainer, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity
          style={[styles.navButton, styles.prevButton]}
          onPress={handlePrevPage}
          disabled={currentPage === 0}
        >
          <ThemedText
            style={[
              styles.navButtonText,
              currentPage > 0 && styles.navButtonTextActive,
            ]}
          >
            ← 上一页
          </ThemedText>
        </TouchableOpacity>

        {/* Page Dots */}
        <View style={styles.pageDots}>
          {book.content.map((_, index) => (
            <View
              key={index}
              style={[
                styles.pageDot,
                currentPage === index && styles.pageDotActive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={handleNextPage}
          disabled={currentPage === totalPages - 1}
        >
          <ThemedText style={[styles.navButtonText, styles.navButtonTextActive]}>
            {currentPage === totalPages - 1 ? '完成 ✓' : '下一页 →'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

// Helper function to get emoji for spotlight words
function getEmojiForWord(word: string): string {
  const emojiMap: Record<string, string> = {
    cat: '🐱',
    dog: '🐕',
    bird: '🐦',
    sun: '☀️',
    moon: '🌙',
    star: '⭐',
    tree: '🌳',
    flower: '🌸',
    apple: '🍎',
    banana: '🍌',
    house: '🏠',
    car: '🚗',
    book: '📖',
    ball: '⚽',
    happy: '😊',
    sad: '😢',
    love: '❤️',
    big: '🐘',
    small: '🐭',
    red: '🔴',
    blue: '🔵',
    green: '🟢',
    yellow: '🟡',
    one: '1️⃣',
    two: '2️⃣',
    three: '3️⃣',
    family: '👨‍👩‍👧',
    mother: '👩',
    father: '👨',
    baby: '👶',
    friend: '🤝',
    school: '🏫',
    home: '🏡',
    food: '🍽️',
    water: '💧',
    sky: '🌤️',
    cloud: '☁️',
    rain: '🌧️',
    snow: '❄️',
    magic: '✨',
    dream: '💫',
    adventure: '🗺️',
    hero: '🦸',
    dragon: '🐉',
    fairy: '🧚',
    castle: '🏰',
    forest: '🌲',
    ocean: '🌊',
    mountain: '⛰️',
  };

  const lowerWord = word.toLowerCase();
  return emojiMap[lowerWord] || '📝';
}

// Import Spacing
import { Spacing } from '@/constants/theme';
