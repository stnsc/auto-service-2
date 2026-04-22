import React from "react"
import { StyleSheet, Text, TextProps } from "react-native"
import { fonts } from "../../theme"

export const NText = React.memo(({ style, ...props }: TextProps) => (
    <Text style={style ? [styles.base, style] : styles.base} {...props} />
))

const styles = StyleSheet.create({
    base: {
        fontFamily: fonts.regular,
    },
})
