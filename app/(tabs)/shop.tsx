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
import { useChatContext } from "../../context/ChatContext"
import { fonts } from "../../theme"
import { Ionicons } from "@expo/vector-icons"
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

const AUTO_KEYWORDS = [
    // English
    "car",
    "auto",
    "vehicle",
    "motor",
    "engine",
    "brake",
    "tire",
    "tyre",
    "wheel",
    "oil",
    "filter",
    "spark",
    "plug",
    "clutch",
    "transmission",
    "battery",
    "exhaust",
    "radiator",
    "suspension",
    "steering",
    "alternator",
    "starter",
    "coolant",
    "fuse",
    "belt",
    "hose",
    "gasket",
    "piston",
    "caliper",
    "rotor",
    "pad",
    "muffler",
    "catalytic",
    "intake",
    "injector",
    "pump",
    "sensor",
    "axle",
    "bearing",
    "seal",
    "bulb",
    "wiper",
    "headlight",
    "taillight",
    "mirror",
    "bumper",
    "hood",
    "trunk",
    "part",
    "parts",
    "repair",
    "fluid",
    "shock",
    "strut",
    "cv",
    "timing",
    // Romanian
    "masina",
    "mașin",
    "masin",
    "motor",
    "frân",
    "frana",
    "roat",
    "roata",
    "ulei",
    "filtru",
    "baterie",
    "transmisie",
    "ambreiaj",
    "curea",
    "furtun",
    "piesa",
    "piesă",
    "reparati",
    "service",
    "senzor",
    "pompa",
    "pompă",
]

function isAutoRelated(query: string): boolean {
    const lower = query.toLowerCase()
    return AUTO_KEYWORDS.some((kw) => lower.includes(kw))
}

export default function ShopScreen() {
    const { t } = useTranslation()
    const { partQuery, partPriceLimit } = useChatContext()
    const { theme } = useTheme()

    const [searchQuery, setSearchQuery] = useState("")
    const [priceCap, setPriceCap] = useState("")
    const [results, setResults] = useState<ShopResult[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [sortMode, setSortMode] = useState<SortMode>("price_asc")
    const [hasSearched, setHasSearched] = useState(false)
    const lastAutoQuery = useRef("")

    const performSearch = useCallback(async (query: string) => {
        const trimmed = query.trim()
        if (!trimmed) return
        if (!isAutoRelated(trimmed)) {
            setError(t("shop.notCarRelated"))
            setResults([])
            setHasSearched(true)
            return
        }
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

    // Auto-fill price cap from chat context
    useEffect(() => {
        if (partPriceLimit !== null) {
            setPriceCap(String(partPriceLimit))
        }
    }, [partPriceLimit])

    const sortedResults = useMemo(() => {
        const cap = parseFloat(priceCap)
        const filtered = isNaN(cap)
            ? results
            : results.filter((r) => r.price <= cap)
        return [...filtered].sort((a, b) => {
            switch (sortMode) {
                case "price_asc":
                    return a.price - b.price
                case "price_desc":
                    return b.price - a.price
                case "rating": {
                    // Score = rating * log(reviews + 1) so popular highly-rated items rank first
                    const scoreA =
                        (a.rating ?? 0) * Math.log((a.reviews ?? 0) + 1)
                    const scoreB =
                        (b.rating ?? 0) * Math.log((b.reviews ?? 0) + 1)
                    return scoreB - scoreA
                }
                default:
                    return 0
            }
        })
    }, [results, sortMode, priceCap])

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
                        {t("shop.resultsFound", {
                            count: sortedResults.length,
                        })}
                        {sortedResults.length < results.length &&
                            ` ${t("shop.priceCapFiltered", { total: results.length })}`}
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

            {/* Bottom search bar */}
            <View style={styles.bottomBar}>
                {/* Price Cap Row */}
                <View style={styles.priceCapRow}>
                    <NInput
                        containerStyle={styles.priceCapInput}
                        placeholder="Maximum"
                        value={priceCap}
                        onChangeText={(v) =>
                            setPriceCap(v.replace(/[^0-9.]/g, ""))
                        }
                        keyboardType="numeric"
                    />
                    {priceCap.length > 0 && (
                        <NButton
                            color="rgba(255,255,255,0.08)"
                            onPress={() => setPriceCap("")}
                            style={{ marginBottom: 24 }}
                        >
                            <Ionicons
                                name="close"
                                size={14}
                                color={theme.textSubtle}
                            />
                        </NButton>
                    )}
                    <Ionicons
                        name="pricetag-outline"
                        size={14}
                        color={theme.textSubtle}
                    />
                    <NText style={styles.priceCapLabel}>
                        {t("shop.priceCapLabel")}
                    </NText>
                </View>

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
                        color={theme.accent}
                        onPress={() => performSearch(searchQuery)}
                    >
                        <Ionicons name="search" size={20} color={theme.icon} />
                    </NButton>
                </View>
            </View>

        </View>
    )
}

const styles= StyleSheet.create({
    root: {
        flex: 1,
        marginTop: "10%",
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        flexGrow: 1,
        padding: 20,
        paddingBottom: 20,
    },
    heading: {
        fontSize: 22,
        fontFamily: fonts.bold,
        marginBottom: 20,
        marginTop: 20,
    },

    // Bottom bar
    bottomBar: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 80,
        gap: 6,
    },

    // Search
    searchRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
    },

    // Price cap
    priceCapRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 4,
    },
    priceCapLabel: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: "rgba(255,255,255,0.45)",
        flex: 1,
    },
    priceCapInput: {
        width: 110,
        minWidth: 0,
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
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
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
