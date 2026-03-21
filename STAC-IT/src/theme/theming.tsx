import React from 'react'
import { StyleSheet } from 'react-native'
import { useTheme, MD3Theme } from 'react-native-paper'
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context'

export type StyleFn<T> = (arg0: MD3Theme, arg1: EdgeInsets) => T;

export function useStyles<T>(factory: StyleFn<T>): [T, MD3Theme, EdgeInsets] {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  const styles = React.useMemo(() => {
    return factory(theme, insets)
  }, [theme, insets])

  return [ styles, theme, insets ]
}
