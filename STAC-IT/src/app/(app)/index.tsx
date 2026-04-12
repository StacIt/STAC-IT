import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
    getFirestore,
} from "@react-native-firebase/firestore";
import * as React from "react";
import { useCallback, useRef, useState } from "react";
import { ScrollView, Share, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
    Appbar,
    Button,
    Card,
    Divider,
    FAB,
    IconButton,
    Text,
} from "react-native-paper";

import { InputSheet } from "@/components/InputSheet";
import { NewStac, NewStacDb, newStacConverter } from "@/types";
import { StacLiveList } from "@/components/StacList";

import { useAuth } from "@/contexts";
import { useStyles, StyleProps } from "@/styling";

export default function Home() {
    const { styles } = useStyles(styling);
    const inputRef = useRef<InputSheet>(null);

    const auth = useAuth();
    const db = getFirestore();

    const [futureStacs, setFutureStacs] = useState<NewStac[]>([]);
    const [pastStacs, setPastStacs] = useState<NewStac[]>([]);

    return (
        <View style={styles.container}>
            <View style={styles.container}>
                <StacLiveList />
            </View>
            <InputSheet ref={inputRef} />
            <FAB
                icon="pencil-outline"
                style={styles.fab}
                onPress={() => inputRef.current?.open()}
            />
        </View>
    );
}

const styling = ({ theme, insets }: StyleProps) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        fab: {
            position: "absolute",
            margin: 16,
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
