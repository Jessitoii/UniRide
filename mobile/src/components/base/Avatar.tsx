import React, { useMemo } from 'react';
import { Image, StyleSheet, View, ImageStyle, StyleProp, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { getAvatarSource, UserPhotoData } from '@/utils/fetchProfilePhoto';

interface AvatarProps {
    user?: UserPhotoData | null;
    size?: number;
    style?: StyleProp<ImageStyle>;
    containerStyle?: StyleProp<ViewStyle>;
    showEditIcon?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
    user,
    size = 40,
    style,
    containerStyle,
    showEditIcon = false
}) => {
    const { theme } = useTheme();

    const source = useMemo(() => getAvatarSource(user), [user]);

    const borderRadius = size / 2;

    const baseContainerStyle: ViewStyle = {
        borderRadius,
        overflow: 'hidden',
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    };

    return (
        <View style={[baseContainerStyle, containerStyle, { width: size, height: size }]}>
            <Image
                source={source}
                style={[{ width: size, height: size, borderRadius }, style]}
                resizeMode="cover"
            />

            {showEditIcon && (
                <View style={[styles.editIconContainer, { backgroundColor: theme.colors.primary }]}>
                    <MaterialIcons name="camera-alt" size={size * 0.25} color="white" />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        padding: 4,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'white',
        zIndex: 10,
    },
});
