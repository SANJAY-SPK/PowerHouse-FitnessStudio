import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Guideline sizes are based on standard ~5" screen mobile device (e.g. iPhone X/11/12/13/14 baseline of 375x812)
const GUIDELINE_BASE_WIDTH = 375;
const GUIDELINE_BASE_HEIGHT = 812;

/**
 * Scales a size based on the device screen width relative to the guideline base width.
 * Useful for horizontal dimensions: widths, margins, padding, icon sizes, etc.
 */
export const scale = (size: number): number => {
  return (width / GUIDELINE_BASE_WIDTH) * size;
};

/**
 * Scales a size based on the device screen height relative to the guideline base height.
 * Useful for vertical dimensions: heights, vertical margins, vertical padding, etc.
 */
export const verticalScale = (size: number): number => {
  return (height / GUIDELINE_BASE_HEIGHT) * size;
};

/**
 * Scales a size using a scaling factor to prevent overly extreme scaling on very large or small screens.
 * Useful for font sizes, border radiuses, and spacing that should stay relatively uniform.
 * @param size The size to scale
 * @param factor The scaling factor (0.5 means it scales up/down at 50% speed)
 */
export const moderateScale = (size: number, factor = 0.5): number => {
  return size + (scale(size) - size) * factor;
};
