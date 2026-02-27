import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFF8E7', // 温暖的奶油色背景
    },
    headerGradient: {
      paddingTop: Spacing["6xl"],
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing["3xl"],
      backgroundColor: '#4A7C59', // 森林绿
      borderBottomLeftRadius: BorderRadius["3xl"],
      borderBottomRightRadius: BorderRadius["3xl"],
    },
    headerTitle: {
      fontSize: 36,
      fontWeight: '800',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    headerSubtitle: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
      lineHeight: 24,
    },
    leafIcon: {
      fontSize: 48,
      textAlign: 'center',
      marginBottom: Spacing.md,
    },
    content: {
      flex: 1,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xl,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#4A7C59',
      marginBottom: Spacing.lg,
      marginTop: Spacing.lg,
    },
    levelContainer: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginBottom: Spacing.xl,
    },
    levelCard: {
      flex: 1,
      padding: Spacing.lg,
      borderRadius: BorderRadius.xl,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 140,
      shadowColor: '#4A7C59',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    levelCardSelected: {
      transform: [{ scale: 1.02 }],
    },
    level1Card: {
      backgroundColor: '#FFE4B5', // 温暖橙
    },
    level2Card: {
      backgroundColor: '#E6F3D9', // 淡绿
    },
    level3Card: {
      backgroundColor: '#E8D5F2', // 淡紫
    },
    levelEmoji: {
      fontSize: 36,
      marginBottom: Spacing.sm,
    },
    levelName: {
      fontSize: 16,
      fontWeight: '700',
      color: '#2D4A35',
      marginBottom: Spacing.xs,
    },
    levelDesc: {
      fontSize: 11,
      color: '#5A6B5D',
      textAlign: 'center',
      lineHeight: 16,
    },
    themeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
      marginBottom: Spacing.xl,
    },
    themeCard: {
      width: '47%',
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    themeCardSelected: {
      borderColor: '#4A7C59',
      backgroundColor: '#F0F7F2',
    },
    themeEmoji: {
      fontSize: 28,
      marginBottom: Spacing.sm,
    },
    themeName: {
      fontSize: 14,
      fontWeight: '600',
      color: '#2D4A35',
    },
    inputSection: {
      marginBottom: Spacing.xl,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: '#4A7C59',
      marginBottom: Spacing.sm,
    },
    input: {
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      fontSize: 16,
      color: '#2D4A35',
      borderWidth: 2,
      borderColor: '#E8E8E8',
    },
    inputFocused: {
      borderColor: '#4A7C59',
    },
    generateButton: {
      backgroundColor: '#4A7C59',
      paddingVertical: Spacing.xl,
      borderRadius: BorderRadius.xl,
      alignItems: 'center',
      marginBottom: Spacing["2xl"],
      shadowColor: '#4A7C59',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    generateButtonDisabled: {
      backgroundColor: '#B8C9BC',
      shadowOpacity: 0,
    },
    generateButtonText: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    booksSection: {
      marginTop: Spacing.lg,
    },
    bookCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    bookCover: {
      width: 60,
      height: 80,
      borderRadius: BorderRadius.md,
      backgroundColor: '#F5F5F5',
      marginRight: Spacing.lg,
    },
    bookInfo: {
      flex: 1,
    },
    bookTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#2D4A35',
      marginBottom: Spacing.xs,
    },
    bookMeta: {
      fontSize: 12,
      color: '#6B7B6D',
      marginBottom: Spacing.xs,
    },
    bookLevel: {
      fontSize: 11,
      color: '#FFFFFF',
      backgroundColor: '#4A7C59',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
      alignSelf: 'flex-start',
      fontWeight: '600',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: Spacing["4xl"],
    },
    emptyEmoji: {
      fontSize: 48,
      marginBottom: Spacing.lg,
    },
    emptyText: {
      fontSize: 16,
      color: '#8B9A8D',
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFF8E7',
    },
    loadingText: {
      fontSize: 18,
      color: '#4A7C59',
      marginTop: Spacing.lg,
    },
  });
};
