// components/NText.tsx
import { Text, TextProps } from "react-native"
import { fonts } from "../theme"

export const NText = ({ style, ...props }: TextProps) => (
    <Text style={[{ fontFamily: fonts.regular }, style]} {...props} />
)
