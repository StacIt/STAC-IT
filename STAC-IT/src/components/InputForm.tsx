import * as Location from "expo-location";
import * as React from "react";
import {
    useReducer,
    useEffect,
    useImperativeHandle,
    useState,
    Fragment,
} from "react";
import { StyleSheet, View } from "react-native";
import {
    Button,
    Divider,
    SegmentedButtons,
    Text,
    TextInput,
} from "react-native-paper";
import { DatePickerModal, TimePickerModal } from "react-native-paper-dates";

import validate from "validator";

import { Period, StacRequest } from "@/types";

import { StyleProps, useStyles } from "@/styling";

import ActivityInput from "@/components/ActivityInput";

export interface FormData extends StacRequest {
    title: string;
}

export interface InputFormMethods {
    submit: () => Promise<FormData>;
}

export type InputForm = InputFormMethods;

export interface InputFormProps {
    onDirty: () => void;
    onValidate: (isValid: boolean) => void;
    ref?: React.RefObject<InputForm | null>;
}

function getDefaultPeriod(): Period {
    let begin = new Date();

    begin.setHours(begin.getHours() + 1, 0, 0, 0);

    const end = new Date(begin);
    end.setHours(end.getHours() + 1);

    return { begin, end };
}

function getInitialState(): FormData {
    return {
        title: "",
        city: "",
        state: "",
        activities: [],
        budget: "1",
        period: getDefaultPeriod(),
        numberOfPeople: "1",
        keepOptions: "",
    };
}

export type FormAction =
    | ({ type: "update" } & Partial<FormData>)
    | { type: "set_date"; value: Date }
    | { type: "set_start" | "set_end"; hours: number; minutes: number };

function formHandler(state: FormData, action: FormAction) {
    switch (action.type) {
        case "update": {
            const { type: _ignore, ...rest } = action;
            return { ...state, ...rest };
        }
        case "set_start": {
            const begin = new Date(state.period.begin);
            begin.setHours(action.hours, action.minutes);
            return { ...state, period: { ...state.period, begin } };
        }
        case "set_end": {
            const end = new Date(state.period.end);
            end.setHours(action.hours, action.minutes);
            return { ...state, period: { ...state.period, end } };
        }
        case "set_date": {
            const begin = new Date(state.period.begin);
            const end = new Date(state.period.end);
            begin.setFullYear(
                action.value.getFullYear(),
                action.value.getMonth(),
                action.value.getDate(),
            );
            end.setFullYear(
                action.value.getFullYear(),
                action.value.getMonth(),
                action.value.getDate(),
            );
            return { ...state, period: { begin, end } };
        }
    }
}

// function KBTextInput({ ...props }: ComponentProps<typeof PaperTextInput>) {
// return (
// <PaperTextInput {...props} render={(p) => <SheetTextInput {...p} />} />
// );
// }

function formValidate(data: FormData): boolean {
    let valid = true;

    valid &&= !validate.isEmpty(data.title, { ignore_whitespace: true });

    valid &&= !validate.isEmpty(data.city, { ignore_whitespace: true });
    valid &&= !validate.isEmpty(data.state, { ignore_whitespace: true });

    valid &&= data.activities.length > 0;
    valid &&= data.activities.every((e) => !validate.isEmpty(e));

    return valid;
}

function useDefaultLocation(set: (arg0: FormAction) => void) {
    useEffect(() => {
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
                    set({
                        type: "update",
                        city: addr.city ?? undefined,
                        state: addr.region ?? undefined,
                    });
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
    }, [set]);
}

// eslint-disable-next-line
export function InputForm({ ref, onDirty, onValidate }: InputFormProps) {
    const { styles } = useStyles(styling);

    const [state, raw_dispatch] = useReducer(
        formHandler,
        null,
        getInitialState,
    );
    const { begin, end } = state.period;

    useEffect(() => onValidate(formValidate(state)), [state, onValidate]);

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

    useDefaultLocation(raw_dispatch);

    const dispatch = (...a: Parameters<typeof raw_dispatch>) => {
        raw_dispatch(...a);
        onDirty();
    };

    useImperativeHandle(ref, () => {
        return {
            async submit() {
                return state;
            },
        };
    }, [state]);

    return (
        <>
            <View style={styles.titleContainer}>
                <TextInput
                    label="Title"
                    style={styles.titleInput}
                    mode="outlined"
                    value={state.title}
                    onChangeText={(title) =>
                        dispatch({ type: "update", title })
                    }
                />
            </View>

            <View style={styles.rowContainer}>
                <Button
                    icon="calendar"
                    mode="outlined"
                    onPress={() => setShowDatePicker(true)}
                >
                    {begin.toDateString()}
                </Button>
            </View>
            <View style={styles.timeContainer}>
                <Button
                    mode="contained-tonal"
                    onPress={() => setShowStartTimePicker(true)}
                    style={styles.timeButton}
                >
                    {begin.toLocaleTimeString([], {
                        timeStyle: "short",
                    })}
                </Button>
                <Button
                    mode="contained-tonal"
                    onPress={() => setShowEndTimePicker(true)}
                    style={styles.timeButton}
                >
                    {end.toLocaleTimeString([], {
                        timeStyle: "short",
                    })}
                </Button>
            </View>

            <DatePickerModal
                locale="en"
                label="Select date"
                mode="single"
                presentationStyle="pageSheet"
                visible={showDatePicker}
                date={begin}
                onDismiss={() => setShowDatePicker(false)}
                onConfirm={({ date }) => {
                    if (date) {
                        dispatch({ type: "set_date", value: date });
                    }
                    setShowDatePicker(false);
                }}
            />
            <TimePickerModal
                locale="en"
                visible={showStartTimePicker}
                onDismiss={() => setShowStartTimePicker(false)}
                onConfirm={(value) => {
                    dispatch({ type: "set_start", ...value });
                    setShowStartTimePicker(false);
                }}
            />
            <TimePickerModal
                locale="en"
                visible={showEndTimePicker}
                onDismiss={() => setShowEndTimePicker(false)}
                onConfirm={(value) => {
                    dispatch({ type: "set_end", ...value });
                    setShowEndTimePicker(false);
                }}
            />
            <View style={styles.rowContainer}>
                <TextInput
                    style={styles.cityInput}
                    label="City"
                    mode="outlined"
                    value={state.city}
                    onChangeText={(city) => dispatch({ type: "update", city })}
                />
                <TextInput
                    style={styles.stateInput}
                    label="State"
                    mode="outlined"
                    value={state.state}
                    onChangeText={(state) =>
                        dispatch({ type: "update", state })
                    }
                    maxLength={2}
                />
            </View>
            <Divider style={styles.divider} />
            <ActivityInput
                activities={state.activities}
                setActivities={(activities) =>
                    dispatch({ type: "update", activities })
                }
            />
            <Divider style={styles.divider} />
            <Text style={styles.radioButtonLabel}>Number of People</Text>
            <SegmentedButtons
                style={styles.radioButton}
                value={state.numberOfPeople}
                onValueChange={(numberOfPeople) =>
                    dispatch({ type: "update", numberOfPeople })
                }
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
                value={state.budget}
                onValueChange={(budget) => dispatch({ type: "update", budget })}
                buttons={[
                    { value: "1", label: "$" },
                    { value: "2", label: "$$" },
                    { value: "3", label: "$$$" },
                ]}
            />
        </>
    );
}

const styling = ({ theme }: StyleProps) => {
    return StyleSheet.create({
        contentContainer: {
            paddingHorizontal: 12,
            flexDirection: "column",
            paddingBottom: 16,
            gap: 4,
        },
        rowContainer: {
            //flex: 1,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
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
        titleContainer: {},
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
