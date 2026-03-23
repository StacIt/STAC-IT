import type React from "react";
import { useState, useRef } from "react";
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

import {
    Button,
    Divider,
    Text,
    Icon,
    IconButton,
    TextInput,
    useTheme,
    ActivityIndicator,
} from "react-native-paper";

interface ActivityInputProps {
    activities: string[];
    setActivities: (arg0: string[]) => void;
}

const ActivityInput: React.FC<ActivityInputProps> = ({
    activities,
    setActivities,
}) => {
    const theme = useTheme();

    const filled_acts = activities.slice(0, -1);

    const acts = filled_acts.map((val, i) => (
        <TextInput
            style={{ flex: 1 }}
            mode="outlined"
            label={`Activity ${i + 1}`}
            value={val}
            onChangeText={(text) =>
                setActivities(activities.toSpliced(i, 1, text))
            }
            right=<TextInput.Icon
                icon="close"
                onPress={() => setActivities(activities.toSpliced(i, 1))}
            />
        />
    ));

    acts.push(
        <TextInput
            style={{ flex: 1 }}
            mode="outlined"
            label={`Activity ${activities.length}`}
            value={activities.at(-1)}
            onChangeText={(text) =>
                setActivities(activities.toSpliced(-1, 0, text))
            }
        />,
    );
    return <View>{acts}</View>;
};

export { ActivityInput };
