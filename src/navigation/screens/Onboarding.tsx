import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAppState } from "../../store/AppContext";
import { useTheme } from "../../hooks/useTheme";
import { Icon } from "../../components/common/Icon";
import { CURRENCIES } from "../../utils/currency";
import { FONTS } from "../../constants/fonts";

export function OnboardingScreen() {
  const { completeOnboarding } = useAppState();
  const { theme, accent } = useTheme();
  const [step, setStep] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState("INR");

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]}>
      {step === 0 ? (
        <WelcomeStep theme={theme} accent={accent} onNext={() => setStep(1)} />
      ) : (
        <CurrencyStep
          theme={theme}
          accent={accent}
          selected={selectedCurrency}
          onSelect={setSelectedCurrency}
          onFinish={() => completeOnboarding(selectedCurrency)}
        />
      )}
    </SafeAreaView>
  );
}

function WelcomeStep({
  theme,
  accent,
  onNext,
}: {
  theme: any;
  accent: any;
  onNext: () => void;
}) {
  const features = [
    {
      icon: "lock" as const,
      title: "Private by default",
      desc: "Stored only on your device",
    },
    {
      icon: "wallet" as const,
      title: "7 asset categories",
      desc: "A complete picture of your wealth",
    },
    {
      icon: "history" as const,
      title: "Track growth",
      desc: "Every update saved to your history",
    },
  ];

  return (
    <View style={styles.stepWrap}>
      <View style={styles.heroArea}>
        {/* Brand mark — shadow on wrapper, gradient on inner (Android needs separation) */}
        <View style={[styles.brandMarkWrap, { shadowColor: accent.solid, elevation: 14 }]}>
          <LinearGradient
            colors={[accent.from, accent.to]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.brandMark}
          >
            <Icon name="trending" size={38} color="#fff" strokeWidth={2.4} />
          </LinearGradient>
        </View>

        <Text style={[styles.appName, { color: theme.text }]}>
          WealthMonitor
        </Text>
        <Text style={[styles.tagline, { color: theme.sub }]}>
          Your entire net worth in one private place. Track cash, stocks,
          property, crypto and more — updated manually, by you.
        </Text>

        <View style={styles.features}>
          {features.map((f) => (
            <View key={f.title} style={styles.featureRow}>
              <View
                style={[
                  styles.featureIcon,
                  { backgroundColor: accent.solid + "20" },
                ]}
              >
                <Icon
                  name={f.icon}
                  size={20}
                  color={accent.solid}
                  strokeWidth={2}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.featureTitle, { color: theme.text }]}>
                  {f.title}
                </Text>
                <Text style={[styles.featureDesc, { color: theme.sub }]}>
                  {f.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity
        onPress={onNext}
        style={[styles.primaryBtn, { backgroundColor: accent.solid }]}
        accessibilityRole="button"
      >
        <Text style={styles.primaryBtnText}>Get started</Text>
      </TouchableOpacity>
    </View>
  );
}

function CurrencyStep({
  theme,
  accent,
  selected,
  onSelect,
  onFinish,
}: {
  theme: any;
  accent: any;
  selected: string;
  onSelect: (code: string) => void;
  onFinish: () => void;
}) {
  return (
    <View style={styles.stepWrap}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.stepTitle, { color: theme.text }]}>
          Choose your currency
        </Text>
        <Text style={[styles.stepDesc, { color: theme.sub }]}>
          Everything will be shown in this currency. You can change it later in
          Settings.
        </Text>

        <ScrollView
          style={{ flex: 1, marginTop: 22 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 8 }}
        >
          {CURRENCIES.map((c) => {
            const on = c.code === selected;
            return (
              <TouchableOpacity
                key={c.code}
                onPress={() => onSelect(c.code)}
                style={[
                  styles.currencyRow,
                  {
                    borderColor: on ? accent.solid : theme.line,
                    backgroundColor: on ? accent.solid + "14" : theme.cardBg,
                  },
                ]}
                accessibilityRole="button"
              >
                <View
                  style={[styles.symbolBox, { backgroundColor: theme.chipBg }]}
                >
                  <Text style={[styles.symbolText, { color: theme.text }]}>
                    {c.symbol}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.currencyCode, { color: theme.text }]}>
                    {c.code}
                  </Text>
                  <Text style={[styles.currencyName, { color: theme.sub }]}>
                    {c.name}
                  </Text>
                </View>
                {on && (
                  <Icon
                    name="check"
                    size={22}
                    color={accent.solid}
                    strokeWidth={2.6}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <TouchableOpacity
        onPress={onFinish}
        style={[styles.primaryBtn, { backgroundColor: accent.solid }]}
        accessibilityRole="button"
      >
        <Text style={styles.primaryBtnText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  stepWrap: {
    flex: 1,
    paddingHorizontal: 26,
    paddingBottom: 34,
  },
  heroArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
  },
  brandMarkWrap: {
    width: 76,
    height: 76,
    borderRadius: 76 * 0.28,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
  },
  brandMark: {
    width: 76,
    height: 76,
    borderRadius: 76 * 0.28,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  appName: {
    fontSize: 30,
    letterSpacing: -0.8,
    marginTop: 24,
    textAlign: "center",
    fontFamily: FONTS.jakartaExtraBold,
  },
  tagline: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginTop: 10,
    maxWidth: 280,
    fontFamily: FONTS.jakarta,
  },
  features: { gap: 14, marginTop: 30, alignSelf: "stretch" },
  featureRow: { flexDirection: "row", gap: 13, alignItems: "center" },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureTitle: {
    fontSize: 15,
    fontFamily: FONTS.jakartaBold,
  },
  featureDesc: { fontSize: 13, marginTop: 1, fontFamily: FONTS.jakarta },

  primaryBtn: {
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  primaryBtnText: {
    fontSize: 16,
    color: "#fff",
    fontFamily: FONTS.jakartaBold,
  },

  stepTitle: {
    fontSize: 26,
    letterSpacing: -0.6,
    marginTop: 8,
    fontFamily: FONTS.jakartaExtraBold,
  },
  stepDesc: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    fontFamily: FONTS.jakarta,
  },

  currencyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  symbolBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  symbolText: {
    fontSize: 20,
    fontFamily: FONTS.groteskBold,
  },
  currencyCode: {
    fontSize: 16,
    fontFamily: FONTS.groteskBold,
  },
  currencyName: { fontSize: 13, marginTop: 1, fontFamily: FONTS.jakarta },
});
