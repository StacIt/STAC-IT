import React from "react";
import { StyleSheet } from "react-native";
import { useTheme, MD3Theme } from "react-native-paper";
import { useSafeAreaInsets, EdgeInsets } from "react-native-safe-area-context";

export interface StyleProps {
    theme: MD3Theme;
    insets: EdgeInsets;
}

type StyleFn<T> = ({ theme, insets }: StyleProps) => T;

export function useStyles<T>(factory: StyleFn<T>): T {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    const styles = React.useMemo(() => {
        return factory({ theme, insets });
    }, [theme, insets]);

    return styles;
}
