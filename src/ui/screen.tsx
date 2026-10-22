import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type Theme } from './theme';
import { useStyles } from './theme-context';

/** Scrollable page with a readable max width on large screens and a floating footer */
export function Screen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  const styles = useStyles(makeStyles);
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.column}>{children}</View>
      </ScrollView>
      {footer ? (
        <SafeAreaView edges={['bottom']} style={styles.footerWrap}>
          <View style={[styles.column, styles.footer]}>{footer}</View>
        </SafeAreaView>
      ) : null}
    </SafeAreaView>
  );
}

const makeStyles = (C: Theme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    scroll: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32 },
    column: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: 16 },
    footerWrap: { backgroundColor: C.bg, paddingHorizontal: 16 },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 10,
    },
  });
