import React from "react";
import { MD3Theme, useTheme } from "react-native-paper";
import { EdgeInsets, useSafeAreaInsets } from "react-native-safe-area-context";

export interface StyleProps {
    theme: MD3Theme;
    insets: EdgeInsets;
}

type StyleFn<T> = ({ theme, insets }: StyleProps) => T;

export function useStyles<T>(factory: StyleFn<T>): {
    styles: T;
    theme: MD3Theme;
    insets: EdgeInsets;
} {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    const styles = React.useMemo(() => {
        return factory({ theme, insets });
    }, [theme, insets, factory]);

    return { styles, theme, insets };
}
