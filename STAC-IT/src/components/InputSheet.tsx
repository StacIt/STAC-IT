import {
    BottomSheetHandle,
    BottomSheetHandleProps,
    BottomSheetModal,
    BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import axios from "axios";
import * as React from "react";
import { RefObject, useImperativeHandle, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Button, IconButton } from "react-native-paper";

import { FormData, InputForm } from "@/components/InputForm";
import { useStyles } from "@/styling";
import { StacResponse } from "@/types";

interface HeaderProps extends BottomSheetHandleProps {
    onSubmit: () => void;
    onDismiss: () => void;
}

function Header({ onSubmit, onDismiss, ...props }: HeaderProps) {
    const { styles } = useStyles(styling);

    return (
        <View style={styles.header}>
            <View style={styles.header_left}>
                <IconButton
                    style={{ marginLeft: 0 }}
                    icon="close"
                    onPress={onDismiss}
                />
            </View>
            <View style={styles.header_center}>
                <BottomSheetHandle {...props} />
            </View>
            <View style={styles.header_right}>
                <Button mode="contained" onPress={onSubmit}>
                    Save
                </Button>
            </View>
        </View>
    );
}

async function callBackend(data: FormData): Promise<StacResponse> {
    const { title, ...msg } = data;
    try {
        const response = axios.post<StacResponse>(
            "https://stac-1061792458880.us-east1.run.app/chatbot_api",
            msg,
            { headers: { "Content-Type": "application/json" } },
        );
        return response.then((v) => v.data);
    } catch (error) {
        console.error(error);
        Alert.alert("Error", "Model call failed");
        throw error;
    }
}

export interface InputSheetProps {
    ref?: RefObject<InputSheet | null>;
}

export interface InputSheetMethods extends BottomSheetModal, InputForm {}

export type InputSheet = InputSheetMethods;

// eslint-disable-next-line
export function InputSheet({ ref }: InputSheetProps) {
    const { styles, insets } = useStyles(styling);

    const sheet = useRef<BottomSheetModal>(null);
    const form = useRef<InputForm>(null);

    const [canSubmit, setCanSubmit] = useState(false);
    const [loading, setLoading] = useState(false);

    // const handleSubmit = async () => {
    // const data = await form.current?.submit().then(callBackend);
    // };

    // passthrough methods
    useImperativeHandle(
        ref,
        () => ({
            ...sheet.current!,
            ...form.current!,
        }),
        [],
    );

    const onSubmit = () => {
        return;
    };

    const onDismiss = () => {
        sheet.current?.collapse();
    };

    const renderHeader = (p: BottomSheetHandleProps) => (
        <Header onSubmit={onSubmit} onDismiss={onDismiss} {...p} />
    );

    return (
        <View style={styles.container}>
            <BottomSheetModal
                handleComponent={renderHeader}
                topInset={insets.top}
                ref={sheet}
                enableDynamicSizing={true}
                snapPoints={["10%", "100%"]}
                index={1}
                enablePanDownToClose={false}
            >
                <BottomSheetScrollView style={styles.contentContainer}>
                    <InputForm />
                </BottomSheetScrollView>
            </BottomSheetModal>
        </View>
    );
}

const styling = () => {
    return StyleSheet.create({
        container: {},
        contentContainer: {
            paddingHorizontal: 12,
            flexDirection: "column",
            paddingBottom: 16,
            gap: 4,
        },
        footer: {
            alignSelf: "flex-end",
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginHorizontal: 10,
        },
        header_left: {
            flex: 1,
            flexDirection: "row",
            justifyContent: "flex-start",
        },
        header_center: {
            flex: 1,
            flexDirection: "row",
            justifyContent: "center",
            alignSelf: "flex-start",
        },
        header_right: {
            flexDirection: "row",
            flex: 1,
            justifyContent: "flex-end",
        },
    });
};
