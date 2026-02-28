import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  View,
  Image,
  Text,
  Animated,
  Modal,
  FlatList,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Audio } from 'expo-av';
import Toast from 'react-native-toast-message';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { createStyles } from './styles';
import { Spacing } from '@/constants/theme';
import { createFormDataFile } from '@/utils';
import { getApiBaseUrl } from '@/src/config/api';

// Level configurations
const LEVELS = [
  { level: 1, name: '启蒙版', emoji: '🌱', description: '词汇启蒙\n简单短语' },
  { level: 2, name: '成长版', emoji: '🌿', description: '简单句式\n重复表达' },
  { level: 3, name: '飞跃版', emoji: '🌳', description: '完整故事\n逻辑叙事' },
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

interface Book {
  id: string;
  title: string;
  level: number;
  theme: string;
  interest_tag: string;
  created_at: string;
}

interface OnlineBook {
  title: string;
  description: string;
  sourceUrl?: string;
  sourceSite?: string;
  isFree?: boolean;
}

interface FreeBookSource {
  name: string;
  site: string;
  description: string;
  url: string;
  isFree: boolean;
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();

  // State
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [interestTag, setInterestTag] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);
  
  // Voice input state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const recorderRef = useRef<CrossPlatformAudioRecorder | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Search modal state
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OnlineBook[]>([]);
  const [freeSources, setFreeSources] = useState<FreeBookSource[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchRecentBooks();
    recorderRef.current = new CrossPlatformAudioRecorder();
  }, []);

  const fetchRecentBooks = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/books?limit=5`);
      const data = await response.json();
      setRecentBooks(data.books || []);
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setIsLoadingBooks(false);
    }
  };

  const themes = THEME_SUGGESTIONS[selectedLevel] || THEME_SUGGESTIONS[1];

  // Voice input handler
  const handleVoiceInput = async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      scaleAnim.stopAnimation();
      scaleAnim.setValue(1);
      setIsProcessingVoice(true);
      
      try {
        const audioData = await recorderRef.current?.stop();
        
        if (audioData?.base64) {
          // Send to ASR API using base64
          const response = await fetch(`${getApiBaseUrl()}/api/v1/books/asr`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioBase64: audioData.base64 }),
          });
          
          const data = await response.json();
          if (data.text) {
            setInterestTag(data.text);
          }
        }
      } catch (error) {
        console.error('Voice input error:', error);
        Alert.alert('语音识别失败', '请检查麦克风权限后重试');
      } finally {
        setIsProcessingVoice(false);
        recorderRef.current = new CrossPlatformAudioRecorder();
      }
    } else {
      // Start recording
      try {
        await recorderRef.current?.start();
        setIsRecording(true);
        
        // Pulse animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          ])
        ).start();
      } catch (error) {
        console.error('Failed to start recording:', error);
        Alert.alert('录音失败', '请检查麦克风权限后重试');
      }
    }
  };

  // Search online books
  const handleSearchBooks = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      /**
       * 服务端文件：server/src/routes/books.ts
       * 接口：POST /api/v1/books/search
       * Body 参数：query: string, language?: "zh"|"en"|"all", count?: number
       */
      const response = await fetch(`${getApiBaseUrl()}/api/v1/books/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, count: 10 }),
      });
      
      const data = await response.json();
      setSearchResults(data.books || []);
      setFreeSources(data.sources || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Upload eBook
  const handleUploadBook = async () => {
    try {
      // 请求相册权限
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('提示', '需要相册权限才能上传绘本');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets[0]) {
        setIsUploading(true);
        
        const asset = result.assets[0];
        const formData = new FormData();
        
        // 使用 createFormDataFile 创建跨平台兼容的文件对象
        const file = await createFormDataFile(asset.uri, 'book-image.jpg', 'image/jpeg');
        formData.append('file', file as any);
        
        const uploadResponse = await fetch(`${getApiBaseUrl()}/api/v1/books/upload-to-book`, {
          method: 'POST',
          body: formData,
        });
        
        const data = await uploadResponse.json();
        if (data.book) {
          router.push('/read', { bookId: data.book.id });
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateBook = useCallback(async () => {
    if (!selectedTheme) return;

    setIsLoading(true);
    
    // 显示生成提示（飞跃版需要更长时间）
    if (selectedLevel === 3) {
      Toast.show({
        type: 'info',
        text1: '🚀 飞跃版生成中...',
        text2: '完整故事需要约 1-2 分钟，请耐心等待',
        visibilityTime: 3000,
      });
    }
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/books/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: selectedLevel,
          theme: selectedTheme,
          interestTag: interestTag || selectedTheme,
        }),
      });

      const data = await response.json();
      if (data.book) {
        router.push('/read', { bookId: data.book.id });
      }
    } catch (error) {
      console.error('Failed to generate book:', error);
      Toast.show({
        type: 'error',
        text1: '生成失败',
        text2: '请稍后重试',
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedLevel, selectedTheme, interestTag, router]);

  const handleReadBook = useCallback((bookId: string) => {
    router.push('/read', { bookId });
  }, [router]);

  const isGenerateEnabled = selectedTheme !== '';

  return (
    <Screen backgroundColor="#FFF8E7" statusBarStyle="light" safeAreaEdges={['left', 'right', 'bottom']}>
      {/* Header */}
      <View style={[styles.headerGradient, { paddingTop: insets.top + Spacing.lg }]}>
        <Text style={styles.leafIcon}>🍃</Text>
        <Text style={styles.headerTitle}>Magic Leaf</Text>
        <Text style={styles.headerSubtitle}>双语互动绘本 · 开启奇妙故事之旅</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom + Spacing['2xl'] }} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => router.push('/library')}>
            <Text style={styles.quickActionIcon}>📚</Text>
            <Text style={styles.quickActionText}>绘本馆</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => setSearchModalVisible(true)}>
            <Text style={styles.quickActionIcon}>🔍</Text>
            <Text style={styles.quickActionText}>搜索绘本</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={handleUploadBook} disabled={isUploading}>
            <Text style={styles.quickActionIcon}>📤</Text>
            <Text style={styles.quickActionText}>{isUploading ? '上传中...' : '上传绘本'}</Text>
          </TouchableOpacity>
        </View>

        {/* Level Selection */}
        <Text style={styles.sectionTitle}>选择学习等级</Text>
        <View style={styles.levelContainer}>
          {LEVELS.map((level) => (
            <TouchableOpacity
              key={level.level}
              style={[styles.levelCard, selectedLevel === level.level && styles.levelCardSelected]}
              onPress={() => { setSelectedLevel(level.level); setSelectedTheme(''); }}
              activeOpacity={0.8}
            >
              <Text style={styles.levelEmoji}>{level.emoji}</Text>
              <Text style={styles.levelName}>{level.name}</Text>
              <Text style={styles.levelDesc}>{level.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Theme Selection */}
        <Text style={styles.sectionTitle}>选择故事主题</Text>
        <View style={styles.themeGrid}>
          {themes.map((themeItem) => (
            <TouchableOpacity
              key={themeItem.name}
              style={[styles.themeCard, selectedTheme === themeItem.name && styles.themeCardSelected]}
              onPress={() => setSelectedTheme(themeItem.name)}
              activeOpacity={0.7}
            >
              <Text style={styles.themeEmoji}>{themeItem.emoji}</Text>
              <Text style={styles.themeName}>{themeItem.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Interest Tag Input with Voice */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>宝贝的兴趣标签（可选）</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="例如：恐龙、公主、机器人..."
              placeholderTextColor="#B8C9BC"
              value={interestTag}
              onChangeText={setInterestTag}
            />
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
                style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
                onPress={handleVoiceInput}
                disabled={isProcessingVoice}
              >
                <Text style={styles.voiceButtonIcon}>
                  {isProcessingVoice ? '⏳' : isRecording ? '⏹️' : '🎤'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
          {isRecording && <Text style={styles.recordingHint}>正在录音，点击停止...</Text>}
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateButton, !isGenerateEnabled && styles.generateButtonDisabled]}
          onPress={handleGenerateBook}
          disabled={!isGenerateEnabled || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <View style={styles.buttonLoadingContainer}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.buttonLoadingText}>
                {selectedLevel === 3 ? '正在创作完整故事...' : '正在生成绘本...'}
              </Text>
            </View>
          ) : (
            <Text style={styles.generateButtonText}>✨ 生成魔法绘本</Text>
          )}
        </TouchableOpacity>
        
        {/* 生成时间提示 */}
        {isLoading && selectedLevel === 3 && (
          <Text style={styles.waitHint}>
            💡 飞跃版需要更长时间创作，请耐心等待约 1-2 分钟
          </Text>
        )}

        {/* Recent Books */}
        <View style={styles.booksSection}>
          <Text style={styles.sectionTitle}>最近绘本</Text>
          {isLoadingBooks ? (
            <ActivityIndicator color="#4A7C59" size="large" />
          ) : recentBooks.length > 0 ? (
            recentBooks.map((book) => (
              <TouchableOpacity key={book.id} style={styles.bookCard} onPress={() => handleReadBook(book.id)} activeOpacity={0.7}>
                <Image source={{ uri: `https://picsum.photos/120/160?random=${book.id}` }} style={styles.bookCover} />
                <View style={styles.bookInfo}>
                  <Text style={styles.bookTitle} numberOfLines={1}>{book.theme} - Level {book.level}</Text>
                  <Text style={styles.bookMeta}>{book.interest_tag} · {new Date(book.created_at).toLocaleDateString()}</Text>
                  <Text style={styles.bookLevel}>{LEVELS.find(l => l.level === book.level)?.name || 'Level ' + book.level}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📚</Text>
              <Text style={styles.emptyText}>还没有绘本哦{'\n'}选择主题开始创作吧！</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Search Modal */}
      <Modal visible={searchModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔍 搜索在线绘本</Text>
              <TouchableOpacity onPress={() => setSearchModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchInputRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="输入关键词搜索绘本..."
                placeholderTextColor="#B8C9BC"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearchBooks}
              />
              <TouchableOpacity style={styles.searchButton} onPress={handleSearchBooks}>
                <Text style={styles.searchButtonText}>搜索</Text>
              </TouchableOpacity>
            </View>

            {isSearching ? (
              <ActivityIndicator color="#4A7C59" size="large" style={styles.searchLoading} />
            ) : (
              <ScrollView style={styles.searchResultsList}>
                {/* 推荐免费资源站点 */}
                {freeSources.length > 0 && (
                  <View style={styles.sourcesSection}>
                    <Text style={styles.sourcesTitle}>📚 推荐免费绘本资源</Text>
                    {freeSources.map((source, index) => (
                      <TouchableOpacity 
                        key={index} 
                        style={styles.sourceItem}
                        onPress={() => {
                          if (Platform.OS === 'web') {
                            window.open(source.url, '_blank');
                          }
                        }}
                      >
                        <Text style={styles.sourceName}>{source.name}</Text>
                        <Text style={styles.sourceDesc}>{source.description}</Text>
                        <Text style={styles.sourceUrl}>{source.url}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                
                {/* 搜索结果 */}
                {searchResults.length > 0 && (
                  <View style={styles.resultsSection}>
                    <Text style={styles.resultsTitle}>🔍 搜索结果</Text>
                    {searchResults.map((item, index) => (
                      <TouchableOpacity 
                        key={index} 
                        style={styles.searchResultItem}
                        onPress={() => {
                          if (Platform.OS === 'web' && item.sourceUrl) {
                            window.open(item.sourceUrl, '_blank');
                          }
                        }}
                      >
                        <Text style={styles.searchResultTitle} numberOfLines={2}>{item.title}</Text>
                        <Text style={styles.searchResultDesc} numberOfLines={2}>{item.description}</Text>
                        <View style={styles.searchResultFooter}>
                          {item.sourceSite && <Text style={styles.searchResultSource}>来源: {item.sourceSite}</Text>}
                          {item.isFree && <Text style={styles.freeTag}>免费</Text>}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                
                {searchResults.length === 0 && freeSources.length === 0 && (
                  <View style={styles.searchEmpty}>
                    <Text style={styles.searchEmptyText}>输入关键词搜索在线绘本资源</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
