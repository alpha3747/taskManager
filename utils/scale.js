import {Dimensions} from 'react-native';
const {width, height} = Dimensions.get('window');

// Standard screen size you designed for
const guidelineBaseWidth = 360;
const guidelineBaseHeight = 690;

export const scale = size => (width / guidelineBaseWidth) * size;
export const verticalScale = size => (height / guidelineBaseHeight) * size;
export const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;
