import { StyleSheet, Dimensions } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 600;

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFF8E7',
    },
    
    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#E8E8E8',
    },
    backButton: {
      padding: Spacing.sm,
    },
    backButtonText: {
      fontSize: 24,
      color: '#4A7C59',
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#2D4A35',
    },
    pageIndicator: {
      fontSize: 14,
      color: '#6B7B6D',
      fontWeight: '500',
    },
    
    // Loading
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFF8E7',
    },
    loadingText: {
      fontSize: 18,
      color: '#4A7C59',
      fontWeight: '600',
      marginTop: Spacing.lg,
    },
    
    // Error
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    errorEmoji: {
      fontSize: 48,
      marginBottom: Spacing.md,
    },
    errorText: {
      fontSize: 16,
      color: '#6B7B6D',
      textAlign: 'center',
      marginBottom: Spacing.lg,
    },
    retryButton: {
      backgroundColor: '#4A7C59',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    
    // Main Content
    scrollContent: {
      flexGrow: 1,
      padding: Spacing.lg,
    },
    
    // Illustration Container - 圆形窗户风格
    illustrationSection: {
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    illustrationFrame: {
      width: isSmallScreen ? width - Spacing.lg * 2 : 320,
      height: isSmallScreen ? (width - Spacing.lg * 2) * 0.8 : 256,
      borderRadius: BorderRadius.xl,
      overflow: 'hidden',
      backgroundColor: '#F0E6D3',
      borderWidth: 4,
      borderColor: '#8B6914',
      shadowColor: '#8B6914',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    illustrationImage: {
      width: '100%',
      height: '100%',
    },
    
    // Vocabulary Section - 单词词汇区
    vocabularySection: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
      paddingHorizontal: Spacing.sm,
    },
    vocabularyItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.full,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderWidth: 2,
      borderColor: '#E8E8E8',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    vocabularyItemActive: {
      backgroundColor: '#4A7C59',
      borderColor: '#4A7C59',
    },
    vocabularyWord: {
      fontSize: 16,
      fontWeight: '600',
      color: '#2D4A35',
      marginRight: Spacing.xs,
    },
    vocabularyWordActive: {
      color: '#FFFFFF',
    },
    vocabularySpeaker: {
      fontSize: 16,
    },
    
    // Text Section - 双语文本区
    textSection: {
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
      shadowColor: '#4A7C59',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    textRow: {
      marginBottom: Spacing.md,
    },
    languageLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: '#4A7C59',
      letterSpacing: 1,
      marginBottom: Spacing.xs,
    },
    sentenceRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    sentenceText: {
      flex: 1,
      fontSize: 18,
      fontWeight: '500',
      color: '#2D4A35',
      lineHeight: 26,
    },
    sentenceTextZh: {
      fontSize: 16,
      color: '#5A6B5C',
      lineHeight: 24,
    },
    speakButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F0F7F2',
      borderRadius: BorderRadius.full,
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      marginLeft: Spacing.sm,
      borderWidth: 1,
      borderColor: '#4A7C59',
    },
    speakButtonActive: {
      backgroundColor: '#4A7C59',
    },
    speakButtonIcon: {
      fontSize: 14,
      marginRight: 2,
    },
    speakButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#4A7C59',
    },
    speakButtonTextActive: {
      color: '#FFFFFF',
    },
    divider: {
      height: 1,
      backgroundColor: '#E8E8E8',
      marginVertical: Spacing.md,
    },
    hint: {
      fontSize: 13,
      color: '#8B9A8D',
      fontStyle: 'italic',
      marginTop: Spacing.xs,
    },
    
    // Interaction Section - Magic Buddy
    interactionSection: {
      backgroundColor: '#4A7C59',
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    buddyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    buddyStar: {
      fontSize: 20,
      marginRight: Spacing.sm,
    },
    buddyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    buddyQuestion: {
      marginBottom: Spacing.md,
    },
    buddyQuestionEn: {
      fontSize: 15,
      fontWeight: '500',
      color: '#FFFFFF',
      lineHeight: 22,
      marginBottom: Spacing.xs,
    },
    buddyQuestionZh: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.8)',
      lineHeight: 20,
    },
    saveButton: {
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      marginTop: Spacing.sm,
    },
    saveButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#4A7C59',
    },
    
    // Practice Section - 口语练习
    practiceSection: {
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    practiceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    practiceMicIcon: {
      fontSize: 20,
      marginRight: Spacing.sm,
    },
    practiceTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#2D4A35',
    },
    micButton: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#4A7C59',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.sm,
      shadowColor: '#4A7C59',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    micButtonActive: {
      backgroundColor: '#D9534F',
      transform: [{ scale: 1.1 }],
    },
    micIcon: {
      fontSize: 32,
      color: '#FFFFFF',
    },
    practiceHint: {
      fontSize: 13,
      color: '#6B7B6D',
      textAlign: 'center',
    },
    practiceResult: {
      marginTop: Spacing.md,
      padding: Spacing.md,
      backgroundColor: '#F0F7F2',
      borderRadius: BorderRadius.lg,
      width: '100%',
    },
    practiceResultText: {
      fontSize: 14,
      color: '#2D4A35',
      textAlign: 'center',
    },
    
    // Progress Section
    progressSection: {
      marginTop: Spacing.md,
      alignItems: 'center',
      width: '100%',
    },
    progressLabel: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginBottom: Spacing.xs,
    },
    progressLabelText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#6B7B6D',
      letterSpacing: 1,
    },
    progressBar: {
      height: 8,
      backgroundColor: '#E8E8E8',
      borderRadius: 4,
      width: '100%',
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#4A7C59',
      borderRadius: 4,
    },
    progressPage: {
      fontSize: 12,
      color: '#6B7B6D',
      marginTop: Spacing.xs,
    },
    
    // Navigation
    navigation: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.lg,
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: '#E8E8E8',
    },
    navButton: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.lg,
    },
    navButtonDisabled: {
      opacity: 0.4,
    },
    navButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#4A7C59',
    },
    pageDots: {
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    pageDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#E8E8E8',
    },
    pageDotActive: {
      backgroundColor: '#4A7C59',
      width: 20,
    },
    
    // Question Section - 互动问题
    questionSection: {
      backgroundColor: '#FFF9E6',
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
      borderWidth: 2,
      borderColor: '#FFD700',
      shadowColor: '#FFD700',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
    questionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    questionIcon: {
      fontSize: 24,
      marginRight: Spacing.sm,
    },
    questionLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: '#B8860B',
    },
    questionCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    questionTextEn: {
      fontSize: 17,
      fontWeight: '600',
      color: '#2D4A35',
      marginBottom: Spacing.xs,
      lineHeight: 24,
    },
    questionTextZh: {
      fontSize: 15,
      color: '#5A6B5C',
      lineHeight: 22,
    },
    questionHintBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: Spacing.sm,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: '#E8E8E8',
    },
    questionHintIcon: {
      fontSize: 14,
      marginRight: Spacing.xs,
    },
    questionHintText: {
      flex: 1,
      fontSize: 12,
      color: '#8B7355',
      fontStyle: 'italic',
    },
    answerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#4A7C59',
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
      shadowColor: '#4A7C59',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    answerButtonIcon: {
      fontSize: 20,
      marginRight: Spacing.sm,
    },
    answerButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    
    // Result Box - 录音结果展示
    resultBox: {
      marginTop: Spacing.md,
      padding: Spacing.md,
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: '#4A7C59',
    },
    resultText: {
      fontSize: 15,
      color: '#2D4A35',
      textAlign: 'center',
      lineHeight: 22,
    },
    
    // Swipe Hint - 滑动提示
    swipeHint: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
      opacity: 0.6,
    },
    swipeHintText: {
      fontSize: 13,
      color: '#6B7B6D',
      fontWeight: '500',
    },
  });
};
