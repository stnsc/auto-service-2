import React from "react"
import { View, Text, StyleSheet, Image } from "react-native"
import { NContextMenu } from "../NContextMenu"
import { Ionicons } from "@expo/vector-icons"
import { NText } from "../NText"
import { fonts } from "../../theme"

export const Suggestions = () => {
    return (
        <View>
            <NText
                style={{
                    color: "#fff",
                    fontSize: 18,
                    fontFamily: fonts.regular,
                }}
            >
                No suggestions available yet.
            </NText>
        </View>
    )
}
