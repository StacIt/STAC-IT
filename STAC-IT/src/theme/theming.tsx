import React from 'react'
import { StyleSheet } from 'react-native'
import { useTheme, MD3Theme } from 'react-native-paper'
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context'

export function useStyles(factory: (theme: MD3Theme, insets: EdgeInsets) => any) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  const styles = React.useMemo(() => {
    return StyleSheet.create(factory(theme, insets))
  }, [theme, insets])

  return { styles, theme, insets }
}
