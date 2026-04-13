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
import { useCallback, useEffect, useRef, useState } from "react";
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
import { StacSheet } from "@/components/StacView";

import { useAuth } from "@/contexts";
import { useStyles, StyleProps } from "@/styling";

export default function Home() {
    const { styles } = useStyles(styling);
    const inputRef = useRef<InputSheet>(null);
    const viewRef = useRef<StacSheet>(null);

    const auth = useAuth();
    const db = getFirestore();

    const [selection, setSelection] = useState<NewStac | null>(null);

    useEffect(() => {
        viewRef.current!.open();
    }, [selection]);

    return (
        <View style={styles.container}>
            <View style={styles.listContainer}>
                <StacLiveList onPress={(e) => setSelection(e)} />
            </View>
            <StacSheet ref={viewRef} data={selection} />
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
