import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  View,
  Text,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Audio } from 'expo-av';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { createStyles } from './styles';
import { Spacing } from '@/constants/theme';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 600;

// 跨平台音频播放器封装
class CrossPlatformAudio {
  private sound: any = null;
  private htmlAudio: any = null;
  private isWeb: boolean;

  constructor() {
    this.isWeb = Platform.OS === 'web';
  }

  async play(uri: string, onEnd?: () => void): Promise<void> {
    await this.stop();

    if (this.isWeb) {
      // Web 端使用 HTML5 Audio
      return new Promise((resolve, reject) => {
        try {
          this.htmlAudio = new window.Audio(uri);
          this.htmlAudio.onended = () => {
            onEnd?.();
            resolve();
          };
          this.htmlAudio.onerror = (e: any) => {
            console.error('HTML Audio error:', e);
            reject(e);
          };
          this.htmlAudio.play().then(resolve).catch(reject);
        } catch (e) {
          reject(e);
        }
      });
    } else {
      // 移动端使用 expo-av
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, isLooping: false },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            onEnd?.();
          }
        }
      );
      this.sound = sound;
    }
  }

  async stop(): Promise<void> {
    if (this.isWeb) {
      if (this.htmlAudio) {
        this.htmlAudio.pause();
        this.htmlAudio = null;
      }
    } else {
      if (this.sound) {
        try {
          await this.sound.stopAsync();
          await this.sound.unloadAsync();
        } catch (e) {
          // ignore
        }
        this.sound = null;
      }
    }
  }
}

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
  image_url?: string;
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
  function_tag: string;
  content: BookPage[];
  interaction: BookInteraction;
  created_at: string;
}

type AudioState = 'idle' | 'loading' | 'playing';

// 单词发音缓存
const audioCache: Record<string, string> = {};

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
  
  // Audio states
  const [sentenceAudioState, setSentenceAudioState] = useState<{ en: AudioState; zh: AudioState }>({ en: 'idle', zh: 'idle' });
  const [wordAudioState, setWordAudioState] = useState<string | null>(null);
  const [activeWord, setActiveWord] = useState<string | null>(null);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingResult, setRecordingResult] = useState<string | null>(null);
  const [isProcessingRecording, setIsProcessingRecording] = useState(false);
  
  const audioPlayerRef = useRef<CrossPlatformAudio | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Initialize audio player
  useEffect(() => {
    audioPlayerRef.current = new CrossPlatformAudio();
    return () => {
      audioPlayerRef.current?.stop();
    };
  }, []);

  // Stop audio when page changes
  useEffect(() => {
    stopAllAudio();
    setSentenceAudioState({ en: 'idle', zh: 'idle' });
    setWordAudioState(null);
    setActiveWord(null);
    setRecordingResult(null);
  }, [currentPage]);

  const stopAllAudio = async () => {
    await audioPlayerRef.current?.stop();
  };

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

  // Play sentence audio
  const handlePlaySentence = useCallback(async (language: 'en' | 'zh') => {
    if (!book) return;
    
    const pageData = book.content[currentPage];
    const text = language === 'en' ? pageData.text_en : pageData.text_zh;

    // 如果正在播放同一种语言，停止播放
    if (sentenceAudioState[language] === 'playing') {
      await stopAllAudio();
      setSentenceAudioState(prev => ({ ...prev, [language]: 'idle' }));
      return;
    }

    // 停止当前播放
    await stopAllAudio();
    setSentenceAudioState({ en: 'loading', zh: 'idle' });
    if (language === 'zh') {
      setSentenceAudioState({ en: 'idle', zh: 'loading' });
    }

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/books/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      });

      const data = await response.json();

      if (data.audioUri) {
        await audioPlayerRef.current?.play(data.audioUri, () => {
          setSentenceAudioState({ en: 'idle', zh: 'idle' });
        });
        setSentenceAudioState(prev => ({ ...prev, [language]: 'playing' }));
      } else {
        setSentenceAudioState({ en: 'idle', zh: 'idle' });
      }
    } catch (err) {
      console.error('Failed to play sentence audio:', err);
      setSentenceAudioState({ en: 'idle', zh: 'idle' });
    }
  }, [book, currentPage, sentenceAudioState]);

  // Play word audio
  const handlePlayWord = useCallback(async (word: string) => {
    // 如果正在播放同一个单词，停止播放
    if (wordAudioState === word) {
      await stopAllAudio();
      setWordAudioState(null);
      setActiveWord(null);
      return;
    }

    await stopAllAudio();
    setWordAudioState(word);
    setActiveWord(word);

    try {
      // 使用后端 TTS 接口发音单词
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/books/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: word, language: 'en' }),
      });

      const data = await response.json();

      if (data.audioUri) {
        await audioPlayerRef.current?.play(data.audioUri, () => {
          setWordAudioState(null);
        });
      } else {
        setWordAudioState(null);
      }
    } catch (err) {
      console.error('Failed to play word audio:', err);
      setWordAudioState(null);
    }
  }, [wordAudioState]);

  // Recording functions
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('需要麦克风权限才能录音');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingResult(null);

      // 动画效果
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    setIsRecording(false);
    scaleAnim.stopAnimation();
    scaleAnim.setValue(1);
    setIsProcessingRecording(true);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (uri) {
        // 这里可以调用 ASR 接口进行语音识别
        // 目前模拟一个简单的反馈
        const pageData = book?.content[currentPage];
        if (pageData) {
          // 模拟语音识别结果
          setRecordingResult(`你说得很棒！继续保持～`);
        }
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
    } finally {
      setIsProcessingRecording(false);
    }
  };

  const handleMicPress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Navigation
  const handlePrevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (book && currentPage < book.content.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  }, [book, currentPage]);

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  // Loading state
  if (isLoading) {
    return (
      <Screen backgroundColor="#FFF8E7" statusBarStyle="dark">
        <View style={styles.loadingContainer}>
          <Text style={{ fontSize: 48 }}>📖</Text>
          <ThemedText style={styles.loadingText}>正在打开魔法绘本...</ThemedText>
        </View>
      </Screen>
    );
  }

  // Error state
  if (error || !book) {
    return (
      <Screen backgroundColor="#FFF8E7" statusBarStyle="dark">
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>😢</Text>
          <ThemedText style={styles.errorText}>{error || '绘本加载失败'}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={() => {
            setIsLoading(true);
            setError(null);
            if (bookId) {
              fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/books/${bookId}`)
                .then(res => res.json())
                .then(data => {
                  if (data.book) setBook(data.book);
                  else setError('绘本不存在');
                })
                .catch(() => setError('加载失败，请重试'))
                .finally(() => setIsLoading(false));
            }
          }}>
            <ThemedText style={styles.retryButtonText}>重新加载</ThemedText>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  const currentPageData = book.content[currentPage];
  const totalPages = book.content.length;
  const imageUrl = currentPageData.image_url;

  return (
    <Screen backgroundColor="#FFF8E7" statusBarStyle="dark">
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{book.theme}</Text>
        <Text style={styles.pageIndicator}>{currentPage + 1} / {totalPages}</Text>
      </View>

      {/* Main Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Illustration - 圆形窗户风格 */}
        <View style={styles.illustrationSection}>
          <View style={styles.illustrationFrame}>
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.illustrationImage}
                contentFit="cover"
                transition={300}
              />
            ) : (
              <View style={[styles.illustrationImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0E6D3' }]}>
                <Text style={{ fontSize: 48 }}>🎨</Text>
                <Text style={{ color: '#8B6914', marginTop: 8 }}>插画生成中...</Text>
              </View>
            )}
          </View>
        </View>

        {/* Vocabulary - 单词词汇区 */}
        {currentPageData.spotlight && currentPageData.spotlight.length > 0 && (
          <View style={styles.vocabularySection}>
            {currentPageData.spotlight.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.vocabularyItem,
                  activeWord === item.object && styles.vocabularyItemActive,
                ]}
                onPress={() => handlePlayWord(item.object)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.vocabularyWord,
                  activeWord === item.object && styles.vocabularyWordActive,
                ]}>
                  {item.object}
                </Text>
                <Text style={styles.vocabularySpeaker}>
                  {wordAudioState === item.object ? '🔊' : '🔈'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Text Section - 双语文本区 */}
        <View style={styles.textSection}>
          {/* English */}
          <View style={styles.textRow}>
            <Text style={styles.languageLabel}>ENGLISH</Text>
            <View style={styles.sentenceRow}>
              <Text style={styles.sentenceText}>{currentPageData.text_en}</Text>
              <TouchableOpacity
                style={[
                  styles.speakButton,
                  sentenceAudioState.en === 'playing' && styles.speakButtonActive,
                ]}
                onPress={() => handlePlaySentence('en')}
                disabled={sentenceAudioState.en === 'loading'}
              >
                <Text style={styles.speakButtonIcon}>
                  {sentenceAudioState.en === 'loading' ? '⏳' : sentenceAudioState.en === 'playing' ? '⏸' : '🔊'}
                </Text>
                <Text style={[
                  styles.speakButtonText,
                  sentenceAudioState.en === 'playing' && styles.speakButtonTextActive,
                ]}>
                  EN 朗读
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Chinese */}
          <View style={styles.textRow}>
            <Text style={styles.languageLabel}>中文</Text>
            <View style={styles.sentenceRow}>
              <Text style={[styles.sentenceText, styles.sentenceTextZh]}>
                {currentPageData.text_zh}
              </Text>
              <TouchableOpacity
                style={[
                  styles.speakButton,
                  sentenceAudioState.zh === 'playing' && styles.speakButtonActive,
                ]}
                onPress={() => handlePlaySentence('zh')}
                disabled={sentenceAudioState.zh === 'loading'}
              >
                <Text style={styles.speakButtonIcon}>
                  {sentenceAudioState.zh === 'loading' ? '⏳' : sentenceAudioState.zh === 'playing' ? '⏸' : '🔊'}
                </Text>
                <Text style={[
                  styles.speakButtonText,
                  sentenceAudioState.zh === 'playing' && styles.speakButtonTextActive,
                ]}>
                  ZH 朗读
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {currentPageData.audio_hint && (
            <Text style={styles.hint}>💡 {currentPageData.audio_hint}</Text>
          )}
        </View>

        {/* Interaction Section - Magic Buddy (only on last page) */}
        {currentPage === totalPages - 1 && book.interaction && (
          <View style={styles.interactionSection}>
            <View style={styles.buddyHeader}>
              <Text style={styles.buddyStar}>⭐</Text>
              <Text style={styles.buddyTitle}>Magic Buddy</Text>
            </View>
            <View style={styles.buddyQuestion}>
              {book.interaction.character_dialogue.split('\n').map((line, i) => (
                <Text key={i} style={i % 2 === 0 ? styles.buddyQuestionEn : styles.buddyQuestionZh}>
                  {line}
                </Text>
              ))}
            </View>
            <TouchableOpacity style={styles.saveButton}>
              <Text style={styles.saveButtonText}>★ 保存这本绘本到馆</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Practice Section - 口语练习 */}
        <View style={styles.practiceSection}>
          <View style={styles.practiceHeader}>
            <Text style={styles.practiceMicIcon}>🎤</Text>
            <Text style={styles.practiceTitle}>Practice Time</Text>
          </View>
          
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              style={[styles.micButton, isRecording && styles.micButtonActive]}
              onPress={handleMicPress}
              activeOpacity={0.8}
            >
              <Text style={styles.micIcon}>{isRecording ? '⏹' : '🎤'}</Text>
            </TouchableOpacity>
          </Animated.View>
          
          <Text style={styles.practiceHint}>
            {isProcessingRecording ? '处理中...' : isRecording ? '正在录音，点击停止' : 'Hold to practice speaking'}
          </Text>

          {recordingResult && (
            <View style={styles.practiceResult}>
              <Text style={styles.practiceResultText}>{recordingResult}</Text>
            </View>
          )}

          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressLabel}>
              <Text style={styles.progressLabelText}>YOUR PROGRESS</Text>
              <Text style={styles.progressLabelText}>LEVEL {book.level}</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${((currentPage + 1) / totalPages) * 100}%` }]} />
            </View>
            <Text style={styles.progressPage}>Page {currentPage + 1} of {totalPages}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={[styles.navigation, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity
          style={[styles.navButton, currentPage === 0 && styles.navButtonDisabled]}
          onPress={handlePrevPage}
          disabled={currentPage === 0}
        >
          <Text style={[styles.navButtonText, currentPage > 0 && { color: '#4A7C59' }]}>
            ← 上一页
          </Text>
        </TouchableOpacity>

        <View style={styles.pageDots}>
          {book.content.map((_, index) => (
            <View key={index} style={[styles.pageDot, currentPage === index && styles.pageDotActive]} />
          ))}
        </View>

        <TouchableOpacity
          style={styles.navButton}
          onPress={handleNextPage}
          disabled={currentPage === totalPages - 1}
        >
          <Text style={styles.navButtonText}>
            {currentPage === totalPages - 1 ? '完成 ✓' : '下一页 →'}
          </Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}
