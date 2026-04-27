import {
    View,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Image,
} from "react-native"
import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { NInput } from "../../components/replacements/NInput"
import { NButton } from "../../components/replacements/NButton"
import { NText } from "../../components/replacements/NText"
import { NModal } from "../../components/replacements/NModal"
import { useChatContext } from "../../context/ChatContext"
import { fonts } from "../../theme"
import { Ionicons } from "@expo/vector-icons"
import { useAlphaNotice } from "../../hooks/useAlphaNotice"
import { useInfoNotice } from "../../context/InfoNoticeContext"
import { useTranslation } from "react-i18next"
import { useTheme } from "../../context/ThemeContext"
import "../../i18n"

interface ShopResult {
    title: string
    price: number
    currency: string
    seller: string
    rating: number | null
    reviews: number | null
    url: string
    image: string | null
    source: string
}

type SortMode = "price_asc" | "price_desc" | "rating"

export default function ShopScreen() {
    const { t } = useTranslation()
    const { partQuery } = useChatContext()
    const shopNotice = useAlphaNotice("shop-alpha")
    const { register } = useInfoNotice()

    useEffect(() => {
        register(shopNotice.show)
        return () => register(null)
    }, [])
    const { theme } = useTheme()

    const [searchQuery, setSearchQuery] = useState("")
    const [results, setResults] = useState<ShopResult[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [sortMode, setSortMode] = useState<SortMode>("price_asc")
    const [hasSearched, setHasSearched] = useState(false)
    const lastAutoQuery = useRef("")

    const performSearch = useCallback(async (query: string) => {
        const trimmed = query.trim()
        if (!trimmed) return
        setLoading(true)
        setError(null)
        setHasSearched(true)

        try {
            const res = await fetch("/api/shop", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: trimmed }),
            })
            const data = await res.json()
            setResults(data.results || [])
            if (data.error) setError(data.error)
        } catch (err) {
            console.error("Shop search error:", err)
            setError(t("shop.searchFailed"))
        } finally {
            setLoading(false)
        }
    }, [])

    // Auto-populate and search when partQuery changes from chat context
    useEffect(() => {
        if (
            partQuery &&
            partQuery.trim().length > 0 &&
            partQuery !== lastAutoQuery.current
        ) {
            lastAutoQuery.current = partQuery
            setSearchQuery(partQuery)
            performSearch(partQuery)
        }
    }, [partQuery, performSearch])

    const sortedResults = useMemo(() => {
        return [...results].sort((a, b) => {
            switch (sortMode) {
                case "price_asc":
                    return a.price - b.price
                case "price_desc":
                    return b.price - a.price
                case "rating":
                    return (b.rating ?? 0) - (a.rating ?? 0)
                default:
                    return 0
            }
        })
    }, [results, sortMode])

    const openUrl = (url: string) => {
        if (typeof window !== "undefined") {
            window.open(url, "_blank")
        }
    }

    return (
        <View style={styles.root}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
            >
                <NText style={styles.heading}>{t("shop.title")}</NText>

                {/* Search Row */}
                <View style={styles.searchRow}>
                    <View style={{ flex: 1 }}>
                        <NInput
                            placeholder={t("shop.searchPlaceholder")}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={() => performSearch(searchQuery)}
                        />
                    </View>
                    <NButton
                        color="rgba(33, 168, 112, 0.51)"
                        onPress={() => performSearch(searchQuery)}
                        style={styles.searchButton}
                    >
                        <Ionicons name="search" size={22} color={theme.icon} />
                    </NButton>
                </View>

                {/* Sort Controls */}
                {results.length > 0 && (
                    <View style={styles.sortRow}>
                        {[
                            {
                                key: "price_asc" as SortMode,
                                label: t("shop.sortPriceLow"),
                            },
                            {
                                key: "price_desc" as SortMode,
                                label: t("shop.sortPriceHigh"),
                            },
                            {
                                key: "rating" as SortMode,
                                label: t("shop.sortRating"),
                            },
                        ].map((opt) => (
                            <NButton
                                key={opt.key}
                                color={
                                    sortMode === opt.key
                                        ? "rgba(30, 212, 157, 0.35)"
                                        : "rgba(0, 0, 0, 0.4)"
                                }
                                onPress={() => setSortMode(opt.key)}
                                style={styles.sortPill}
                            >
                                <NText
                                    style={[
                                        styles.sortText,
                                        sortMode === opt.key &&
                                            styles.sortTextActive,
                                    ]}
                                >
                                    {opt.label}
                                </NText>
                            </NButton>
                        ))}
                    </View>
                )}

                {/* Results Count */}
                {hasSearched && !loading && results.length > 0 && (
                    <NText style={styles.resultCount}>
                        {t("shop.resultsFound", { count: results.length })}
                    </NText>
                )}

                {/* Loading */}
                {loading && (
                    <View style={styles.centerBox}>
                        <ActivityIndicator size="large" color={theme.text} />
                        <NText style={styles.loadingText}>
                            {t("shop.searching")}
                        </NText>
                    </View>
                )}

                {/* Error */}
                {error && !loading && (
                    <NText style={styles.errorText}>{error}</NText>
                )}

                {/* Empty state */}
                {!loading && hasSearched && results.length === 0 && !error && (
                    <NText style={styles.emptyText}>
                        {t("shop.noResults")}
                    </NText>
                )}

                {/* Initial state */}
                {!hasSearched && !loading && (
                    <View style={styles.centerBox}>
                        <Ionicons
                            name="cart-outline"
                            size={48}
                            color={theme.textSubtle}
                        />
                        <NText style={styles.emptyText}>
                            {t("shop.initialHint")}
                        </NText>
                    </View>
                )}

                {/* Results List */}
                {!loading &&
                    sortedResults.map((item, index) => (
                        <NButton
                            key={`${item.source}-${index}`}
                            color="rgba(0, 0, 0, 0.4)"
                            onPress={() => openUrl(item.url)}
                            style={styles.resultCard}
                        >
                            <View style={styles.cardContent}>
                                {item.image && (
                                    <Image
                                        source={{ uri: item.image }}
                                        style={styles.cardImage}
                                    />
                                )}
                                <View style={styles.cardInfo}>
                                    <NText
                                        style={styles.cardTitle}
                                        numberOfLines={2}
                                    >
                                        {item.title}
                                    </NText>
                                    <View style={styles.cardPriceRow}>
                                        <NText style={styles.priceText}>
                                            {item.price.toFixed(2)}{" "}
                                            {item.currency}
                                        </NText>
                                        <View style={styles.sourceBadge}>
                                            <NText style={styles.sourceText}>
                                                {item.seller}
                                            </NText>
                                        </View>
                                    </View>
                                    <View style={styles.cardMetaRow}>
                                        {item.rating !== null && (
                                            <NText style={styles.ratingText}>
                                                <Ionicons
                                                    name="star"
                                                    size={12}
                                                    color="rgb(245, 158, 11)"
                                                />{" "}
                                                {item.rating.toFixed(1)}
                                                {item.reviews
                                                    ? ` (${item.reviews})`
                                                    : ""}
                                            </NText>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </NButton>
                    ))}
            </ScrollView>

            <NModal
                visible={shopNotice.visible}
                onDismiss={shopNotice.dismiss}
                title={t("shop.modalTitle")}
            >
                <NText style={styles.noticeText}>{t("shop.modalLine1")}</NText>
                <NText style={styles.noticeText}>{t("shop.modalLine2")}</NText>
                <NText style={styles.noticeText}>{t("shop.modalLine3")}</NText>
            </NModal>
        </View>
    )
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        marginTop: "10%",
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 120,
    },
    heading: {
        fontSize: 22,
        fontFamily: fonts.bold,
        marginBottom: 20,
        marginTop: 20,
    },

    // Search
    searchRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        marginBottom: 15,
    },
    searchButton: {
        marginTop: 2,
    },

    // Sort
    sortRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 16,
    },
    sortPill: {
        flex: 1,
    },
    sortText: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: "rgba(255,255,255,0.7)",
    },
    sortTextActive: {
        fontFamily: fonts.bold,
    },

    // Results
    resultCount: {
        fontFamily: fonts.light,
        fontSize: 13,
        marginBottom: 12,
    },
    resultCard: {
        marginBottom: 10,
        width: "100%",
    },
    cardContent: {
        flexDirection: "row",
        width: "100%",
        gap: 12,
    },
    cardImage: {
        width: 60,
        height: 60,
        borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.1)",
    },
    cardInfo: {
        flex: 1,
    },
    cardTitle: {
        fontFamily: fonts.bold,
        fontSize: 14,
        marginBottom: 4,
    },
    cardPriceRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    priceText: {
        fontFamily: fonts.bold,
        color: "rgb(30, 212, 157)",
        fontSize: 18,
    },
    sourceBadge: {
        backgroundColor: "rgba(255,255,255,0.1)",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    sourceText: {
        fontFamily: fonts.regular,
        fontSize: 11,
    },
    cardMetaRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    sellerText: {
        fontFamily: fonts.light,
        color: "rgba(255,255,255,0.5)",
        fontSize: 12,
    },
    ratingText: {
        fontFamily: fonts.regular,
        color: "rgb(245, 158, 11)",
        fontSize: 12,
    },

    // States
    centerBox: {
        alignItems: "center",
        paddingVertical: 40,
        gap: 12,
    },
    loadingText: {
        fontFamily: fonts.regular,
        fontSize: 14,
        marginTop: 8,
    },
    emptyText: {
        fontFamily: fonts.regular,
        fontSize: 14,
        textAlign: "center",
        marginTop: 8,
        paddingHorizontal: 20,
    },
    errorText: {
        fontFamily: fonts.regular,
        marginTop: 10,
        textAlign: "center",
    },
    noticeText: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 10,
    },
})
