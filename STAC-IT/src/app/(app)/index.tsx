import { getFirestore } from "@react-native-firebase/firestore";
import { useRouter } from "expo-router";
import * as React from "react";
import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { FAB, Portal } from "react-native-paper";

import { InputSheet } from "@/components/InputSheet";
import { StacLiveList } from "@/components/StacList";

import { useAuth } from "@/contexts";
import { StyleProps, useStyles } from "@/styling";

export default function Home() {
    const { styles } = useStyles(styling);
    const inputRef = useRef<InputSheet>(null);

    const auth = useAuth();
    const db = getFirestore();
    const router = useRouter();

    const [fab, setFab] = useState(false);

    return (
        <View style={styles.container}>
            <View style={styles.listContainer}>
                <StacLiveList
                    onPress={(stacid, title) =>
                        router.navigate({
                            pathname: "/stacs/[stacid]",
                            params: { stacid, title },
                        })
                    }
                />
            </View>
            <InputSheet ref={inputRef} onStateChange={(v) => setFab(!v)} />
            <Portal>
                <FAB
                    icon="pencil-outline"
                    style={styles.fab}
                    visible={fab}
                    onPress={() => {
                        setFab(false);
                        inputRef.current?.open();
                    }}
                />
            </Portal>
        </View>
    );
}

const styling = ({ theme, insets }: StyleProps) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        listContainer: {
            flex: 1,
        },
        fab: {
            position: "absolute",
            margin: 8 * 3,
            right: 0,
            bottom: 0,
        },
        scrollView: {
            flex: 1,
        },
        scrollViewContent: {
            padding: 20,
            paddingBottom: 100,
        },
    });
};
