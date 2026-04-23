import React from "react"
import { StyleSheet, Text, TextProps } from "react-native"
import { fonts } from "../../theme"
import { useTheme } from "../../context/ThemeContext"

export const NText = React.memo(({ style, ...props }: TextProps) => {
    const { theme } = useTheme()
    return (
        <Text
            style={
                style
                    ? [styles.base, { color: theme.text }, style]
                    : [styles.base, { color: theme.text }]
            }
            {...props}
        />
    )
})

const styles = StyleSheet.create({
    base: {
        fontFamily: fonts.regular,
    },
})
