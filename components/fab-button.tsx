import { Pressable, StyleSheet } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface FabButtonProps {
  onPress: () => void;
}

export function FabButton({ onPress }: FabButtonProps) {
  const colorScheme = useColorScheme();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.fab, { backgroundColor: Colors[colorScheme].accent }]}
    >
      <IconSymbol name="slider.horizontal.3" size={24} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
