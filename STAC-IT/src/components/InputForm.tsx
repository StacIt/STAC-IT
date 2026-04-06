import type React from "react";
import { useState, useRef, useEffect, useImperativeHandle } from "react";
import {
    View,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    Alert,
    Keyboard,
    TouchableWithoutFeedback,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import axios from "axios";
import type { NavigationProp } from "@react-navigation/native";
import { TimePickerModal, DatePickerModal } from "react-native-paper-dates";
import * as Location from "expo-location";
import BottomSheet, {
    BottomSheetModal,
    BottomSheetView,
    BottomSheetModalProvider,
} from "@gorhom/bottom-sheet";
import {
    Button,
    Divider,
    Text,
    Icon,
    IconButton,
    TextInput,
    Portal,
    SegmentedButtons,
    ActivityIndicator,
} from "react-native-paper";

import {
    Period,
    StrPeriod,
    StacRequest,
    StacResponse,
    Place,
    Activity,
    ActivityOptions,
    NewActivityOptions,
    activityOptionsConv,
    Itinerary,
} from "../types";

import { useStyles, StyleProps } from "../theme/theming";

import { ActivityInput } from "./ActivityInput";

import { StacOptions, StacActivityOption, StacActivity } from "./StacOptions";

export interface FormData extends StacRequest {
    title: string;
}

export interface InputFormMethods extends BottomSheet {
    submit: (data: FormData) => void;
}

export type InputForm = InputFormMethods;

export interface InputFormProps {
    onSubmit: (v: FormData) => void;
    onResponse: (v: StacResponse) => void;
    ref?: React.RefObject<InputForm | null>;
}

function getDefaultPeriod(): Period {
    let begin = new Date();

    begin.setHours(begin.getHours() + 1, 0, 0, 0);

    const end = new Date(begin);
    end.setHours(end.getHours() + 1);

    return { begin, end };
}

async function callBackend(msg: StacRequest) {
    try {
        const response = await axios.post<StacResponse>(
            "https://stac-1061792458880.us-east1.run.app/chatbot_api",
            msg,
            { headers: { "Content-Type": "application/json" } },
        );
        return response.data;
    } catch (error) {
        console.error(error);
        Alert.alert("Error", "Model call failed");
        throw error;
    }
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, ref }) => {
    const { styles, theme } = useStyles(styling);

    const [title, setTitle] = useState("");

    const defaultPeriod = getDefaultPeriod();
    const [startTime, setStartTime] = useState(defaultPeriod.begin);
    const [endTime, setEndTime] = useState(defaultPeriod.end);

    const [numberOfPeople, setNumberOfPeople] = useState("1");
    const [budget, setBudget] = useState("1");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [activities, setActivities] = useState([""]);

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

    const sheetRef = useRef<BottomSheet>(null);

    function getLocation() {
        async function getPermission() {
            const enabled = await Location.hasServicesEnabledAsync();

            if (!enabled) {
                return false;
            }

            const { granted, canAskAgain } =
                await Location.getForegroundPermissionsAsync();

            if (!granted && canAskAgain) {
                const request =
                    await Location.requestForegroundPermissionsAsync();
                return request.granted;
            } else {
                return granted;
            }
        }

        async function pollDevice() {
            try {
                const permit = await getPermission();

                if (cancel || !permit) {
                    return;
                }

                const pos = await Location.getCurrentPositionAsync();
                const addrs = await Location.reverseGeocodeAsync(pos.coords);

                const addr = addrs[0];

                if (addr && !cancel) {
                    setCity(addr.city ?? "");
                    setState(addr.region ?? "");
                }
            } catch (e) {
                // fail silently
            }
        }

        let cancel = false;

        pollDevice();

        return () => {
            cancel = true;
        };
    }

    useEffect(getLocation, []);

    function handleSubmit() {}

    function handleResponse() {}

    useImperativeHandle(ref, () => ({
        submit: handleSubmit,
        ...sheetRef.current!,
    }));

    return (
        <BottomSheet ref={sheetRef} style={styles.container}>
            <BottomSheetView style={styles.contentContainer}>
                <TextInput
                    label="Title"
                    style={styles.titleInput}
                    mode="outlined"
                    value={title}
                    onChangeText={setTitle}
                />

                <BottomSheetView style={styles.rowContainer}>
                    <Button
                        icon="calendar"
                        mode="outlined"
                        onPress={() => setShowDatePicker(true)}
                    >
                        {startTime.toDateString()}
                    </Button>
                </BottomSheetView>
                <BottomSheetView style={styles.timeContainer}>
                    <Button
                        mode="contained-tonal"
                        onPress={() => setShowStartTimePicker(true)}
                        style={styles.timeButton}
                    >
                        {startTime.toLocaleTimeString([], {
                            timeStyle: "short",
                        })}
                    </Button>
                    <Button
                        mode="contained-tonal"
                        onPress={() => setShowEndTimePicker(true)}
                        style={styles.timeButton}
                    >
                        {endTime.toLocaleTimeString([], {
                            timeStyle: "short",
                        })}
                    </Button>
                </BottomSheetView>

                <DatePickerModal
                    locale="en"
                    label="Select date"
                    mode="single"
                    presentationStyle="pageSheet"
                    visible={showDatePicker}
                    date={startTime}
                    onDismiss={() => setShowDatePicker(false)}
                    onConfirm={({ date }) => {
                        if (date) {
                            setStartTime(
                                new Date(
                                    date.getFullYear(),
                                    date.getMonth(),
                                    date.getDate(),
                                    startTime.getHours(),
                                    startTime.getMinutes(),
                                ),
                            );
                            setEndTime(
                                new Date(
                                    date.getFullYear(),
                                    date.getMonth(),
                                    date.getDate(),
                                    endTime.getHours(),
                                    endTime.getMinutes(),
                                ),
                            );
                        }
                        setShowDatePicker(false);
                    }}
                />
                <TimePickerModal
                    locale="en"
                    visible={showStartTimePicker}
                    onDismiss={() => setShowStartTimePicker(false)}
                    onConfirm={({ hours, minutes }) => {
                        setStartTime(
                            new Date(
                                startTime.getFullYear(),
                                startTime.getMonth(),
                                startTime.getDate(),
                                hours,
                                minutes,
                            ),
                        );
                        setShowStartTimePicker(false);
                    }}
                />
                <TimePickerModal
                    locale="en"
                    visible={showEndTimePicker}
                    onDismiss={() => setShowEndTimePicker(false)}
                    onConfirm={({ hours, minutes }) => {
                        setEndTime(
                            new Date(
                                endTime.getFullYear(),
                                endTime.getMonth(),
                                endTime.getDate(),
                                hours,
                                minutes,
                            ),
                        );
                        setShowEndTimePicker(false);
                    }}
                />
                <BottomSheetView style={styles.rowContainer}>
                    <TextInput
                        style={styles.cityInput}
                        label="City"
                        mode="outlined"
                        value={city}
                        onChangeText={setCity}
                    />
                    <TextInput
                        style={styles.stateInput}
                        label="State"
                        mode="outlined"
                        value={state}
                        onChangeText={setState}
                        maxLength={2}
                    />
                </BottomSheetView>
                <Divider style={styles.divider} />
                <ActivityInput
                    activities={activities}
                    setActivities={setActivities}
                />
                <Divider style={styles.divider} />
                <Text style={styles.radioButtonLabel}>Number of People</Text>
                <SegmentedButtons
                    style={styles.radioButton}
                    value={numberOfPeople}
                    onValueChange={setNumberOfPeople}
                    buttons={[
                        { value: "1", icon: "account" },
                        {
                            value: "2",
                            icon: "account-multiple",
                        },
                        {
                            value: "3",
                            icon: "account-group",
                        },
                    ]}
                />

                <Text style={styles.radioButtonLabel}>Budget</Text>
                <SegmentedButtons
                    style={styles.radioButton}
                    value={budget}
                    onValueChange={setBudget}
                    buttons={[
                        { value: "1", label: "$" },
                        { value: "2", label: "$$" },
                        { value: "3", label: "$$$" },
                    ]}
                />
            </BottomSheetView>
        </BottomSheet>
    );
};

export default InputForm;

const styling = ({ theme, insets }: StyleProps) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            flexDirection: "column",
        },
        contentContainer: {
            flex: 1,
            padding: 12,
            alignItems: "center",
        },
        rowContainer: {
            flex: 1,
            flexDirection: "row",
        },
        footer: {
            flexDirection: "row",
        },
        divider: {
            margin: 4,
        },
        timeContainer: {
            gap: 4,
            flexDirection: "row",
            justifyContent: "center",
        },
        titleInput: {
            ...theme.fonts.headlineMedium,
        },
        timeButton: {
            flex: 1,
        },
        cityInput: {
            flex: 3,
        },
        stateInput: {
            flex: 1,
        },
        radioButton: {},
        radioButtonLabel: {
            color: theme.colors.onSurface,
        },
    });
};
