import * as React from "react";

import {
    RefObject,
    useImperativeHandle,
    ComponentPropsWithRef,
    useRef,
    createRef,
    useEffect,
} from "react";

import { BottomSheetTextInput as SheetTextInput } from "@gorhom/bottom-sheet";
import { TextInput as PaperTextInput } from "react-native-paper";
import { TextInput } from "react-native";

interface ActivityInputProps {
    activities: string[];
    setActivities: (arg0: string[]) => void;
    ref: RefObject<any>;
}

function KbTextInput({
    ...props
}: ComponentPropsWithRef<typeof PaperTextInput>) {
    return (
        <PaperTextInput {...props} render={(p) => <SheetTextInput {...p} />} />
    );
}

export default function ActivityInput({
    ref,
    activities,
    setActivities,
}: ActivityInputProps) {
    const inputRefs = useRef<TextInput[]>([]);

    useImperativeHandle(ref, () => {
        return {
            focus: () => inputRefs.current[0].focus(),
        };
    });

    const acts = activities.map((val, i) => (
        <KbTextInput
            ref={(e: any) => (inputRefs.current[i] = e)}
            submitBehavior="submit"
            onSubmitEditing={() => inputRefs.current[i + 1].focus()}
            selectTextOnFocus={true}
            enterKeyHint="next"
            key={`activity${i + 1}`}
            mode="outlined"
            label={`Activity ${i + 1}`}
            value={val}
            onChangeText={(text) =>
                setActivities(activities.toSpliced(i, 1, text))
            }
            right=<PaperTextInput.Icon
                icon="close"
                onPress={() => setActivities(activities.toSpliced(i, 1))}
            />
        />
    ));

    acts.push(
        <KbTextInput
            ref={(e: any) => (inputRefs.current[activities.length] = e)}
            key={`activity${activities.length + 1}`}
            mode="outlined"
            label={`Activity ${activities.length + 1}`}
            value=""
            onChangeText={(text) => setActivities([...activities, text])}
        />,
    );
    return <>{acts}</>;
}
