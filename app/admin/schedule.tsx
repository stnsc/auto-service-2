import React from "react"
import { StyleSheet, View, ScrollView } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { Ionicons } from "@expo/vector-icons"
import { NText } from "../../components/replacements/NText"
import { fonts } from "../../theme"
import { useTranslation } from "react-i18next"
import "../../i18n"

export default function ScheduleScreen() {
    const { t } = useTranslation()
    const DAYS = t("schedule.days", { returnObjects: true }) as string[]
    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
        >
            <NText style={[styles.sectionTitle, { fontFamily: fonts.medium }]}>
                {t("schedule.operatingHours")}
            </NText>
            <NText style={styles.subtitle}>
                {t("schedule.operatingHoursDesc")}
            </NText>

            <View style={styles.cardWrapper}>
                <LinearGradient
                    colors={[
                        "rgba(255,255,255,0.15)",
                        "rgba(255,255,255,0.05)",
                    ]}
                    style={styles.cardGradient}
                >
                    <BlurView
                        intensity={20}
                        tint="dark"
                        style={styles.cardInner}
                    >
                        {DAYS.map((day, index) => (
                            <React.Fragment key={day}>
                                <View style={styles.scheduleRow}>
                                    <NText
                                        style={[
                                            styles.dayName,
                                            { fontFamily: fonts.medium },
                                        ]}
                                    >
                                        {day}
                                    </NText>
                                    <View style={styles.hoursSection}>
                                        <NText
                                            style={[
                                                styles.notSet,
                                                { fontFamily: fonts.light },
                                            ]}
                                        >
                                            {t("schedule.notConfigured")}
                                        </NText>
                                    </View>
                                    <Ionicons
                                        name="create-outline"
                                        size={18}
                                        color="rgba(255,255,255,0.3)"
                                        style={styles.editIcon}
                                    />
                                </View>
                                {index < DAYS.length - 1 && (
                                    <View style={styles.separator} />
                                )}
                            </React.Fragment>
                        ))}
                    </BlurView>
                </LinearGradient>
            </View>

            <NText
                style={[
                    styles.sectionTitle,
                    { fontFamily: fonts.medium, marginTop: 32 },
                ]}
            >
                {t("schedule.slotConfiguration")}
            </NText>
            <NText style={styles.subtitle}>
                {t("schedule.slotConfigurationDesc")}
            </NText>

            <View style={styles.cardWrapper}>
                <LinearGradient
                    colors={[
                        "rgba(255,255,255,0.15)",
                        "rgba(255,255,255,0.05)",
                    ]}
                    style={styles.cardGradient}
                >
                    <BlurView
                        intensity={20}
                        tint="dark"
                        style={styles.cardInner}
                    >
                        <View style={styles.configRow}>
                            <View>
                                <NText
                                    style={[
                                        styles.configLabel,
                                        { fontFamily: fonts.medium },
                                    ]}
                                >
                                    {t("schedule.slotDuration")}
                                </NText>
                                <NText style={styles.configDesc}>
                                    {t("schedule.slotDurationDesc")}
                                </NText>
                            </View>
                            <View style={styles.configValue}>
                                <NText
                                    style={[
                                        styles.configValueText,
                                        { fontFamily: fonts.medium },
                                    ]}
                                >
                                    30 min
                                </NText>
                            </View>
                        </View>
                        <View style={styles.separator} />
                        <View style={styles.configRow}>
                            <View>
                                <NText
                                    style={[
                                        styles.configLabel,
                                        { fontFamily: fonts.medium },
                                    ]}
                                >
                                    {t("schedule.bookingWindow")}
                                </NText>
                                <NText style={styles.configDesc}>
                                    {t("schedule.bookingWindowDesc")}
                                </NText>
                            </View>
                            <View style={styles.configValue}>
                                <NText
                                    style={[
                                        styles.configValueText,
                                        { fontFamily: fonts.medium },
                                    ]}
                                >
                                    8 weeks
                                </NText>
                            </View>
                        </View>
                    </BlurView>
                </LinearGradient>
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingBottom: 40,
    },
    sectionTitle: {
        color: "#ffffff",
        fontSize: 18,
        marginBottom: 4,
    },
    subtitle: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 14,
        marginBottom: 16,
    },
    cardWrapper: {
        borderRadius: 20,
        overflow: "hidden",
    },
    cardGradient: {
        padding: 1.5,
        borderRadius: 20,
    },
    cardInner: {
        borderRadius: 18,
        overflow: "hidden",
        padding: 8,
    },
    scheduleRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 12,
    },
    dayName: {
        color: "#ffffff",
        fontSize: 15,
        width: 110,
    },
    hoursSection: {
        flex: 1,
    },
    notSet: {
        color: "rgba(255,255,255,0.3)",
        fontSize: 14,
    },
    editIcon: {
        marginLeft: 12,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: "rgba(255,255,255,0.12)",
        marginHorizontal: 12,
    },
    configRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        paddingHorizontal: 12,
    },
    configLabel: {
        color: "#ffffff",
        fontSize: 15,
    },
    configDesc: {
        color: "rgba(255,255,255,0.45)",
        fontSize: 13,
        marginTop: 2,
    },
    configValue: {
        backgroundColor: "rgba(255,255,255,0.1)",
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 12,
    },
    configValueText: {
        color: "#ffffff",
        fontSize: 14,
    },
})
