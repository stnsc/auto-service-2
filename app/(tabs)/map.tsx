import { StyleSheet, View } from "react-native"
import Map from "../../components/Map.web"

export default function MapScreen() {
    return (
        <View style={styles.container}>
            <Map latitude={45.6427} longitude={25.5887} zoom={14} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1 },
})
