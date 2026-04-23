import { View, StyleSheet } from "react-native"
import { useRouter } from "expo-router"
import { NButton } from "../../components/replacements/NButton"
import { NText } from "../../components/replacements/NText"
import { fonts } from "../../theme"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import "../../i18n"

export default function PendingScreen() {
    const { t } = useTranslation()
    const router = useRouter()

    return (
        <View style={styles.container}>
            <Ionicons
                name="hourglass"
                size={48}
                color="rgba(33, 168, 112, 0.8)"
                style={styles.icon}
            />
            <NText style={styles.title}>{t("pending.title")}</NText>
            <NText style={styles.subtitle}>{t("pending.subtitle")}</NText>

            <NButton style={{ marginBottom: 16 }}>
                <NText style={styles.message}>{t("pending.message1")}</NText>
                <NText style={styles.message}>{t("pending.message2")}</NText>
            </NButton>

            <NButton
                color="rgba(255, 255, 255, 0.15)"
                onPress={() => router.replace("/(auth)/login")}
            >
                <View style={styles.backRow}>
                    <Ionicons name="arrow-back" size={18} color="white" />
                    <NText style={styles.buttonText}>
                        {t("pending.backToLogin")}
                    </NText>
                </View>
            </NButton>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 8,
    },
    icon: {
        alignSelf: "center",
        marginBottom: 12,
    },
    title: {
        fontFamily: fonts.bold,
        fontSize: 28,
        color: "#fff",
        textAlign: "center",
    },
    subtitle: {
        fontFamily: fonts.regular,
        fontSize: 16,
        color: "rgba(255,255,255,0.6)",
        textAlign: "center",
        marginBottom: 24,
    },
    message: {
        fontFamily: fonts.regular,
        fontSize: 15,
        color: "rgba(255,255,255,0.8)",
        textAlign: "center",
        lineHeight: 22,
    },
    backRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    buttonText: {
        fontFamily: fonts.bold,
        color: "#fff",
        fontSize: 16,
    },
})
