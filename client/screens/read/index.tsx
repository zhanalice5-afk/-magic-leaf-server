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
  PanResponder,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { createStyles } from './styles';
import { Spacing } from '@/constants/theme';
import { getApiBaseUrl } from '@/src/config/api';

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

// Cross-platform audio recorder - 录制 ASR 支持的格式 (WAV/M4A)
class CrossPlatformAudioRecorder {
  private recording: Audio.Recording | null = null;
  private mediaRecorder: any = null;
  private audioChunks: any[] = [];
  private isWeb: boolean;
  private audioContext: any = null;
  private mediaStream: any = null;
  private scriptProcessor: any = null;
  private pcmData: Float32Array[] = [];
  private sampleRate: number = 16000;

  constructor() {
    this.isWeb = Platform.OS === 'web';
  }

  async start(): Promise<void> {
    if (this.isWeb) {
      // Web 使用 Web Audio API 录制 PCM，转换为 WAV
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
          }
        });
        
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 16000
        });
        
        const source = this.audioContext.createMediaStreamSource(this.mediaStream);
        this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
        
        this.pcmData = [];
        
        this.scriptProcessor.onaudioprocess = (e: any) => {
          const inputData = e.inputBuffer.getChannelData(0);
          this.pcmData.push(new Float32Array(inputData));
        };
        
        source.connect(this.scriptProcessor);
        this.scriptProcessor.connect(this.audioContext.destination);
        
      } catch (e) {
        console.error('Failed to start web recording:', e);
        throw e;
      }
    } else {
      // Mobile 使用 expo-av
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission denied');
      }
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      this.recording = recording;
    }
  }

  // 将 PCM 数据转换为 WAV 格式
  private encodeWAV(samples: Float32Array, sampleRate: number): ArrayBuffer {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);
    
    // PCM samples
    floatTo16BitPCM(view, 44, samples);
    
    return buffer;
  }

  async stop(): Promise<{ base64: string; mimeType: string } | null> {
    if (this.isWeb) {
      return new Promise((resolve) => {
        if (!this.audioContext) {
          resolve(null);
          return;
        }
        
        // 停止录制
        this.scriptProcessor?.disconnect();
        this.audioContext.close();
        this.mediaStream?.getTracks().forEach((track: any) => track.stop());
        
        // 合并 PCM 数据
        const totalLength = this.pcmData.reduce((acc, arr) => acc + arr.length, 0);
        if (totalLength === 0) {
          resolve(null);
          return;
        }
        
        const samples = new Float32Array(totalLength);
        let offset = 0;
        for (const arr of this.pcmData) {
          samples.set(arr, offset);
          offset += arr.length;
        }
        
        // 转换为 WAV
        const wavBuffer = this.encodeWAV(samples, this.sampleRate);
        
        // 转换为 base64
        const bytes = new Uint8Array(wavBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        
        resolve({ base64, mimeType: 'audio/wav' });
      });
    } else {
      if (!this.recording) return null;
      
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;
      
      if (uri) {
        try {
          const content = await (FileSystem as any).readAsStringAsync(uri, {
            encoding: 'base64',
          });
          return { base64: content, mimeType: 'audio/m4a' };
        } catch (e) {
          console.error('Failed to read audio file:', e);
          return null;
        }
      }
      return null;
    }
  }
}

// PCM 转换辅助函数
function floatTo16BitPCM(view: DataView, offset: number, input: Float32Array) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
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
  question?: {
    question_en: string;
    question_zh: string;
    hint?: string;
  };
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
  // Question audio state - 问题朗读状态
  const [questionAudioState, setQuestionAudioState] = useState<{ en: AudioState; zh: AudioState }>({ en: 'idle', zh: 'idle' });
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingResult, setRecordingResult] = useState<string | null>(null);
  const [isProcessingRecording, setIsProcessingRecording] = useState(false);
  
  const audioPlayerRef = useRef<CrossPlatformAudio | null>(null);
  const audioRecorderRef = useRef<CrossPlatformAudioRecorder | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // 使用 ref 存储最新值，避免 PanResponder 闭包问题
  const bookRef = useRef(book);
  const currentPageRef = useRef(currentPage);
  useEffect(() => {
    bookRef.current = book;
    currentPageRef.current = currentPage;
  }, [book, currentPage]);
  
  // 滑动手势状态 - 使用更激进的手势捕获策略
  const translateX = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      // 在手势开始时就尝试捕获，确保水平滑动不被 ScrollView 拦截
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: (_, gestureState) => {
        // 水平滑动时捕获
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 5;
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        // 限制滑动范围
        const newValue = Math.max(-width/3, Math.min(width/3, gestureState.dx));
        translateX.setValue(newValue);
      },
      onPanResponderRelease: async (_, gestureState) => {
        const { dx, vx } = gestureState;
        const threshold = width * 0.2; // 滑动超过 20% 宽度触发翻页
        const velocityThreshold = 0.5; // 速度阈值
        
        // 使用 ref 获取最新值
        const currentBook = bookRef.current;
        const currentPg = currentPageRef.current;
        
        // 左滑（下一页）
        if ((dx < -threshold || vx < -velocityThreshold) && currentBook && currentPg < currentBook.content.length - 1) {
          Animated.timing(translateX, {
            toValue: -width,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setCurrentPage(currentPg + 1);
            translateX.setValue(width);
            Animated.timing(translateX, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start();
          });
        }
        // 右滑（上一页）
        else if ((dx > threshold || vx > velocityThreshold) && currentPg > 0) {
          Animated.timing(translateX, {
            toValue: width,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setCurrentPage(currentPg - 1);
            translateX.setValue(-width);
            Animated.timing(translateX, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start();
          });
        }
        // 回弹
        else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 10,
          }).start();
        }
      },
    })
  ).current;

  // Initialize audio player
  useEffect(() => {
    audioPlayerRef.current = new CrossPlatformAudio();
    audioRecorderRef.current = new CrossPlatformAudioRecorder();
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
    setQuestionAudioState({ en: 'idle', zh: 'idle' });
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
          `${getApiBaseUrl()}/api/v1/books/${bookId}`
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
      const response = await fetch(`${getApiBaseUrl()}/api/v1/books/tts`, {
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
      const response = await fetch(`${getApiBaseUrl()}/api/v1/books/tts`, {
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

  // Play question audio - 朗读互动问题
  const handlePlayQuestion = useCallback(async (language: 'en' | 'zh') => {
    if (!book) return;
    
    const pageData = book.content[currentPage];
    if (!pageData.question) return;
    
    const text = language === 'en' ? pageData.question.question_en : pageData.question.question_zh;

    // 如果正在播放同一种语言，停止播放
    if (questionAudioState[language] === 'playing') {
      await stopAllAudio();
      setQuestionAudioState(prev => ({ ...prev, [language]: 'idle' }));
      return;
    }

    // 停止当前播放
    await stopAllAudio();
    setQuestionAudioState({ en: language === 'en' ? 'loading' : 'idle', zh: language === 'zh' ? 'loading' : 'idle' });

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/books/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      });

      const data = await response.json();

      if (data.audioUri) {
        await audioPlayerRef.current?.play(data.audioUri, () => {
          setQuestionAudioState({ en: 'idle', zh: 'idle' });
        });
        setQuestionAudioState(prev => ({ ...prev, [language]: 'playing' }));
      } else {
        setQuestionAudioState({ en: 'idle', zh: 'idle' });
      }
    } catch (err) {
      console.error('Failed to play question audio:', err);
      setQuestionAudioState({ en: 'idle', zh: 'idle' });
    }
  }, [book, currentPage, questionAudioState]);

  // Recording functions
  const startRecording = async () => {
    try {
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

      await audioRecorderRef.current?.start();
    } catch (err) {
      console.error('Failed to start recording:', err);
      setIsRecording(false);
      scaleAnim.stopAnimation();
      scaleAnim.setValue(1);
      Alert.alert('提示', '无法启动录音，请检查麦克风权限');
    }
  };

  const stopRecording = async () => {
    if (!audioRecorderRef.current) return;

    setIsRecording(false);
    scaleAnim.stopAnimation();
    scaleAnim.setValue(1);
    setIsProcessingRecording(true);

    try {
      const result = await audioRecorderRef.current.stop();
      
      if (result && result.base64) {
        // 调用 ASR 接口进行语音识别
        const response = await fetch(`${getApiBaseUrl()}/api/v1/asr`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: result.base64,
            mimeType: result.mimeType,
          }),
        });

        const data = await response.json();
        
        if (data.text) {
          // 简单的反馈逻辑
          const recognizedText = data.text;
          setRecordingResult(`太棒了！你说了："${recognizedText}"`);
          
          // 可以根据识别结果给出更智能的反馈
          const pageData = book?.content[currentPage];
          if (pageData?.question) {
            // 检查回答是否包含关键词
            const keywords = pageData.question.hint?.split(/[,，、]/) || [];
            const hasKeyword = keywords.some(kw => recognizedText.includes(kw.trim()));
            if (hasKeyword) {
              setRecordingResult(`非常正确！你说的是："${recognizedText}"，回答得太好了！🎉`);
            }
          }
        } else {
          setRecordingResult('没有听清楚，请再试一次～');
        }
      }
    } catch (err) {
      console.error('Failed to process recording:', err);
      setRecordingResult('处理失败，请重试～');
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
              fetch(`${getApiBaseUrl()}/api/v1/books/${bookId}`)
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

      {/* Main Content with swipe gesture */}
      <Animated.View 
        style={{ flex: 1, transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
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

          {/* Question Section - 互动问题区 */}
          {currentPageData.question && (
            <View style={styles.questionSection}>
              <View style={styles.questionHeader}>
                <Text style={styles.questionIcon}>❓</Text>
                <Text style={styles.questionLabel}>互动时刻</Text>
              </View>
              <View style={styles.questionCard}>
                {/* English Question with Audio Button */}
                <View style={styles.questionTextRow}>
                  <Text style={styles.questionTextEn}>{currentPageData.question.question_en}</Text>
                  <TouchableOpacity
                    style={[
                      styles.questionSpeakButton,
                      questionAudioState.en === 'playing' && styles.questionSpeakButtonActive,
                    ]}
                    onPress={() => handlePlayQuestion('en')}
                    disabled={questionAudioState.en === 'loading'}
                  >
                    <Text style={styles.questionSpeakIcon}>
                      {questionAudioState.en === 'loading' ? '⏳' : questionAudioState.en === 'playing' ? '⏸' : '🔊'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {/* Chinese Question with Audio Button */}
                <View style={styles.questionTextRow}>
                  <Text style={styles.questionTextZh}>{currentPageData.question.question_zh}</Text>
                  <TouchableOpacity
                    style={[
                      styles.questionSpeakButton,
                      questionAudioState.zh === 'playing' && styles.questionSpeakButtonActive,
                    ]}
                    onPress={() => handlePlayQuestion('zh')}
                    disabled={questionAudioState.zh === 'loading'}
                  >
                    <Text style={styles.questionSpeakIcon}>
                      {questionAudioState.zh === 'loading' ? '⏳' : questionAudioState.zh === 'playing' ? '⏸' : '🔊'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {currentPageData.question.hint && (
                  <View style={styles.questionHintBox}>
                    <Text style={styles.questionHintIcon}>💡</Text>
                    <Text style={styles.questionHintText}>家长提示: {currentPageData.question.hint}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity 
                style={styles.answerButton}
                onPress={handleMicPress}
              >
                <Text style={styles.answerButtonIcon}>{isRecording ? '⏹' : '🎤'}</Text>
                <Text style={styles.answerButtonText}>
                  {isRecording ? '点击停止录音' : isProcessingRecording ? '处理中...' : '点我来回答'}
                </Text>
              </TouchableOpacity>
              
              {/* 显示录音结果 */}
              {recordingResult && (
                <View style={styles.resultBox}>
                  <Text style={styles.resultText}>{recordingResult}</Text>
                </View>
              )}
            </View>
          )}

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

            {recordingResult && !currentPageData.question && (
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
      </Animated.View>

      {/* Swipe hint */}
      <View style={[styles.swipeHint, { bottom: insets.bottom + 120 }]}>
        <Text style={styles.swipeHintText}>← 左右滑动翻页 →</Text>
      </View>

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
