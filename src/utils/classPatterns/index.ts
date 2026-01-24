/**
 * Class patterns barrel export
 * Re-exports all class pattern utilities from organized modules
 */

// Re-export everything from the main classPatterns file
export * from '../classPatterns'

// Re-export AutoProxy-specific variants (excluding duplicates that exist in main classPatterns)
export {
  emptyStateCardVariants,
  formInputVariants,
  gradientIconBadgeVariants,
  gradientSectionVariants,
  matchTypeBadgeGradients,
  matchTypeBadgeVariants,
  modalContentVariants,
  proxyTypeIconVariants,
  ruleCountBadgeVariants,
  ruleListItemVariants,
  sectionInnerContentVariants,
  selectionCardGradients,
  selectionCardVariants,
  warningBadgeVariants,
  // Note: modalBackdropVariants and settingsCardVariants are intentionally excluded
  // as they exist in the main classPatterns file. AutoProxy components import directly
  // from './autoProxy' when they need the AutoProxy-specific versions.
} from './autoProxy'
