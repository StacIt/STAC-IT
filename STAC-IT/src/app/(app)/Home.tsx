import { useNavigation } from "@react-navigation/native";
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
    getFirestore,
} from "@react-native-firebase/firestore";
import { getAuth } from "@react-native-firebase/auth";
import type React from "react";
import { useCallback, useRef, useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    Share,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import {
    Appbar,
    Button,
    Card,
    Divider,
    FAB,
    IconButton,
    Text,
} from "react-native-paper";

//import { InputForm } from "../components/InputForm";
import { Stac } from "@/types";
import { StacList } from "@/components/StacCard";

import { useAuth } from "@/contexts";
import { useStyles, StyleProps } from "@/theme/theming";

const styling = ({ theme, insets }: StyleProps) => {
    return StyleSheet.create({
        container: {
            flex: 1,
        },
    });
};
