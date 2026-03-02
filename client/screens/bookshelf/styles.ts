import { StyleSheet, Dimensions } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

const { width } = Dimensions.get('window');
const cardWidth = (width - Spacing.lg * 3) / 2;

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundRoot,
    },

    // Header
    header: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing['2xl'],
      paddingBottom: Spacing.lg,
      backgroundColor: theme.backgroundDefault,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: Spacing.sm,
    },
    headerSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
    },

    // Stats
    statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: theme.backgroundDefault,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.primary,
    },
    statLabel: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 2,
    },

    // Content
    scrollContent: {
      padding: Spacing.lg,
      paddingBottom: Spacing['5xl'],
    },

    // Empty State
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 100,
    },
    emptyIcon: {
      fontSize: 64,
      marginBottom: Spacing.lg,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: Spacing.sm,
    },
    emptySubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      maxWidth: 280,
    },

    // Book Grid
    bookGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.lg,
    },
    bookCard: {
      width: cardWidth,
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    bookCover: {
      width: '100%',
      aspectRatio: 0.75,
      backgroundColor: theme.backgroundTertiary,
    },
    bookCoverPlaceholder: {
      width: '100%',
      aspectRatio: 0.75,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    bookCoverPlaceholderText: {
      fontSize: 40,
    },
    bookInfo: {
      padding: Spacing.md,
    },
    bookTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: 4,
    },
    bookLevel: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    bookMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: Spacing.sm,
    },
    cachedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(5, 150, 105, 0.1)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    cachedBadgeText: {
      fontSize: 10,
      color: theme.success,
      fontWeight: '600',
    },

    // Actions
    actionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: Spacing.sm,
    },
    deleteButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },

    // Section Header
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
      marginTop: Spacing.lg,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    clearAllButton: {
      paddingVertical: 4,
      paddingHorizontal: 12,
    },
    clearAllText: {
      fontSize: 14,
      color: theme.error,
    },
  });
};
