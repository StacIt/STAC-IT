import * as React from "react";

import { TextInput } from "react-native-paper";

interface ActivityInputProps {
    activities: string[];
    setActivities: (arg0: string[]) => void;
}

export default function ActivityInput({
    activities,
    setActivities,
}: ActivityInputProps) {
    const acts = activities.map((val, i) => (
        <TextInput
            key={`activity${i + 1}`}
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
            key={`activity${activities.length + 1}`}
            mode="outlined"
            label={`Activity ${activities.length + 1}`}
            value=""
            onChangeText={(text) => setActivities([...activities, text])}
        />,
    );
    return <>{acts}</>;
}
