import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFF8E7',
    },
    header: {
      backgroundColor: '#4A7C59',
      paddingTop: Spacing['2xl'],
      paddingBottom: Spacing.xl,
      paddingHorizontal: Spacing.lg,
      borderBottomLeftRadius: BorderRadius['2xl'],
      borderBottomRightRadius: BorderRadius['2xl'],
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: '#FFFFFF',
      flex: 1,
      marginLeft: Spacing.sm,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    backButtonText: {
      fontSize: 20,
      color: '#FFFFFF',
    },
    headerIcon: {
      fontSize: 28,
    },
    
    // Search Section
    searchSection: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.xl,
      paddingHorizontal: Spacing.md,
      height: 48,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    searchIcon: {
      fontSize: 18,
      marginRight: Spacing.sm,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: '#333',
      height: '100%',
    },
    clearButton: {
      padding: Spacing.xs,
    },
    clearButtonText: {
      fontSize: 16,
      color: '#999',
    },
    
    // Filter Section
    filterSection: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    filterScroll: {
      flexDirection: 'row',
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      backgroundColor: '#FFFFFF',
      marginRight: Spacing.sm,
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
    filterChipActive: {
      backgroundColor: '#4A7C59',
      borderColor: '#4A7C59',
    },
    filterChipText: {
      fontSize: 14,
      color: '#666',
    },
    filterChipTextActive: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    filterChipIcon: {
      fontSize: 12,
      marginLeft: Spacing.xs,
    },
    
    // Stats Section
    statsSection: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 24,
      fontWeight: '700',
      color: '#4A7C59',
    },
    statLabel: {
      fontSize: 12,
      color: '#999',
      marginTop: Spacing.xs,
    },
    
    // Books Grid
    booksSection: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      flex: 1,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#4A7C59',
      marginBottom: Spacing.md,
    },
    booksGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
    },
    bookCard: {
      width: '47%',
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.xl,
      padding: Spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    bookIconContainer: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.lg,
      backgroundColor: 'rgba(74, 124, 89, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    bookIcon: {
      fontSize: 24,
    },
    bookTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#2D4A35',
      marginBottom: Spacing.xs,
    },
    bookTheme: {
      fontSize: 12,
      color: '#666',
      marginBottom: Spacing.sm,
    },
    bookTags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
    },
    levelTag: {
      backgroundColor: 'rgba(74, 124, 89, 0.15)',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
    },
    levelTagText: {
      fontSize: 11,
      color: '#4A7C59',
      fontWeight: '600',
    },
    dateTag: {
      backgroundColor: '#F5F5F5',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
    },
    dateTagText: {
      fontSize: 11,
      color: '#999',
    },
    favoriteButton: {
      position: 'absolute',
      top: Spacing.sm,
      right: Spacing.sm,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    favoriteIcon: {
      fontSize: 16,
    },
    
    // Empty State
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing['4xl'],
    },
    emptyIcon: {
      fontSize: 64,
      marginBottom: Spacing.lg,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#666',
      marginBottom: Spacing.sm,
    },
    emptyText: {
      fontSize: 14,
      color: '#999',
      textAlign: 'center',
    },
    
    // Loading
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing['3xl'],
    },
    
    // Tab Section
    tabSection: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
    },
    tab: {
      flex: 1,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: {
      borderBottomColor: '#4A7C59',
    },
    tabText: {
      fontSize: 15,
      color: '#999',
      fontWeight: '500',
    },
    tabTextActive: {
      color: '#4A7C59',
      fontWeight: '600',
    },
  });
};
