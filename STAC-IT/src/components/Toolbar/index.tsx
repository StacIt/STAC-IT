export { Toolbar } from "./Toolbar";

export interface ToolbarProps {
    visible: boolean;
}

export interface ToolbarHomeProps {
    onPress: () => void;
}

export interface ToolbarStacViewProps {
    onRefresh: () => Promise<void>;
    onShare: () => Promise<void>;
    onDelete: () => Promise<void>;
    canRefresh: boolean;
    canSave: boolean;
    onSave: () => Promise<void>;
    refreshing: boolean;
}
