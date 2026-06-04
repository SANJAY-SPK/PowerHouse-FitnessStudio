import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getInitials, getAvatarColor } from '@/utils/helper';

interface Props {
  name: string;
  id: string;
  size?: number;
}

export default function AvatarCircle({ name, id, size = 40 }: Props) {
  const { bg, text } = getAvatarColor(id);
  const fontSize = size * 0.36;
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.initials, { fontSize, color: text }]}>{getInitials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});