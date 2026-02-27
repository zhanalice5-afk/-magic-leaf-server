import { StyleSheet, Dimensions } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFF8E7',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFF8E7',
    },
    loadingAnimation: {
      width: 120,
      height: 120,
      marginBottom: Spacing.xl,
    },
    loadingText: {
      fontSize: 20,
      color: '#4A7C59',
      fontWeight: '600',
      textAlign: 'center',
    },
    loadingSubtext: {
      fontSize: 14,
      color: '#8B9A8D',
      marginTop: Spacing.sm,
      textAlign: 'center',
    },
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
    pageContainer: {
      flex: 1,
    },
    pageScroll: {
      flex: 1,
    },
    pageContent: {
      flexGrow: 1,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.xl,
    },
    imageContainer: {
      width: width - Spacing.lg * 2,
      height: (width - Spacing.lg * 2) * 0.75,
      borderRadius: BorderRadius.xl,
      overflow: 'hidden',
      backgroundColor: '#F5F5F5',
      marginBottom: Spacing.xl,
      shadowColor: '#4A7C59',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    pageImage: {
      width: '100%',
      height: '100%',
    },
    textContainer: {
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      marginBottom: Spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    englishText: {
      fontSize: 22,
      fontWeight: '600',
      color: '#2D4A35',
      lineHeight: 32,
      marginBottom: Spacing.md,
      textAlign: 'center',
    },
    chineseText: {
      fontSize: 18,
      color: '#6B7B6D',
      lineHeight: 28,
      textAlign: 'center',
    },
    audioHint: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F0F7F2',
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.lg,
    },
    audioHintIcon: {
      fontSize: 20,
      marginRight: Spacing.sm,
    },
    audioHintText: {
      flex: 1,
      fontSize: 13,
      color: '#4A7C59',
      lineHeight: 18,
    },
    spotlightSection: {
      marginBottom: Spacing.xl,
    },
    spotlightTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: '#4A7C59',
      marginBottom: Spacing.md,
    },
    spotlightGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    spotlightCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      minWidth: 100,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
      borderWidth: 2,
      borderColor: '#E8E8E8',
    },
    spotlightCardActive: {
      borderColor: '#4A7C59',
      backgroundColor: '#F0F7F2',
    },
    spotlightEmoji: {
      fontSize: 24,
      marginBottom: Spacing.xs,
    },
    spotlightWord: {
      fontSize: 16,
      fontWeight: '700',
      color: '#2D4A35',
      marginBottom: 2,
    },
    spotlightPhonics: {
      fontSize: 11,
      color: '#8B9A8D',
    },
    interactionSection: {
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      marginBottom: Spacing.lg,
      borderLeftWidth: 4,
      borderLeftColor: '#F9A825',
    },
    buddyAvatar: {
      fontSize: 32,
      marginBottom: Spacing.sm,
    },
    buddyDialogue: {
      fontSize: 16,
      color: '#2D4A35',
      lineHeight: 24,
      fontStyle: 'italic',
    },
    branchingContainer: {
      marginTop: Spacing.lg,
      gap: Spacing.md,
    },
    branchButton: {
      backgroundColor: '#F0F7F2',
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: 2,
      borderColor: '#4A7C59',
    },
    branchButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#4A7C59',
      textAlign: 'center',
    },
    navigationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: '#E8E8E8',
    },
    navButton: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      borderRadius: BorderRadius.lg,
      minWidth: 80,
      alignItems: 'center',
    },
    prevButton: {
      backgroundColor: '#F5F5F5',
    },
    nextButton: {
      backgroundColor: '#4A7C59',
    },
    navButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#6B7B6D',
    },
    navButtonTextActive: {
      color: '#FFFFFF',
    },
    pageDots: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    pageDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#E8E8E8',
    },
    pageDotActive: {
      backgroundColor: '#4A7C59',
      width: 24,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    errorEmoji: {
      fontSize: 48,
      marginBottom: Spacing.lg,
    },
    errorText: {
      fontSize: 16,
      color: '#6B7B6D',
      textAlign: 'center',
      marginBottom: Spacing.xl,
    },
    retryButton: {
      backgroundColor: '#4A7C59',
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.xl,
      borderRadius: BorderRadius.lg,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });
};
