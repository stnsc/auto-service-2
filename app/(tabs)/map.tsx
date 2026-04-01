import { StyleSheet, View } from "react-native"
import Map from "../../components/Map.web"
import { CAR_SERVICES } from "../../data/carServicesMock"

export default function MapScreen() {
    const handleServicePress = (service: any) => {
        //
    }

    return (
        <View style={styles.container}>
            <Map
                latitude={45.6427}
                longitude={25.5887}
                zoom={14}
                carServices={CAR_SERVICES}
                onServicePress={handleServicePress}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1 },
})
