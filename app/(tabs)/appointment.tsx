import { View, Text, StyleSheet } from "react-native"

export default function AppointmentScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Appointments</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center" },
    text: { color: "white", fontSize: 24 },
})
