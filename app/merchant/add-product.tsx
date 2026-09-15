import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, TextInput, Alert, Pressable, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Button } from "@/components/Button";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useCreateProduct } from "@/features/merchant/api/useAddProduct";
import { ProductCategorySelector } from "@/features/merchant/components/ProductCategorySelector";
import { ProductPricingSection } from "@/features/merchant/components/ProductPricingSection";
import { ProductStockSection } from "@/features/merchant/components/ProductStockSection";
import { ProductAttributesSection, AttributeItem } from "@/features/merchant/components/ProductAttributesSection";
import { ProductMediaUploadSection } from "@/features/merchant/components/ProductMediaUploadSection";
import { AIScanProductModal } from "@/features/merchant/components/AIScanProductModal";
import { ScannedProductData } from "@/features/merchant/services/aiProductScanner";
import { uploadProductImages } from "@/features/merchant/services/imageUpload";
import { PackagePlus, Wand2, Sparkles } from "lucide-react-native";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function AddProductContent() {
  const router = useRouter();
  const { colors } = useThemeColor();

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("3");
  const [weight, setWeight] = useState("");
  const [description, setDescription] = useState("");
  const [customAttrs, setCustomAttrs] = useState<AttributeItem[]>([]);
  const [tags, setTags] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAiScanOpen, setIsAiScanOpen] = useState(false);

  const addMutation = useCreateProduct();
  const requiredFieldsComplete = [name.trim(), categoryId, price, stock].filter(Boolean).length;

  const handleApplyAiScan = (data: ScannedProductData, photoUri?: string) => {
    if (data.name) setName(data.name);
    if (data.suggested_sku) setSku(data.suggested_sku);
    if (data.mrp) {
      setComparePrice(data.mrp.toString());
      setPrice(data.mrp.toString());
    }
    if (data.estimated_cost) setCostPrice(data.estimated_cost.toString());
    if (data.weight) setWeight(data.weight.toString());
    if (data.description) setDescription(data.description);

    // Merge product tags + visual fingerprint keywords for future image-search matching
    const baseTags = data.tags || [];
    const visualTags = data.visual_keywords || [];
    const visualCodeTag = data.visual_code ? [`vc:${data.visual_code}`] : [];
    const allTags = [...new Set([...baseTags, ...visualTags, ...visualCodeTag])];
    if (allTags.length) setTags(allTags.join(", "));

    if (data.attributes && Object.keys(data.attributes).length > 0) {
      const newAttrs: AttributeItem[] = Object.entries(data.attributes).map(([key, value]) => ({
        id: Math.random().toString(),
        key,
        value,
      }));
      // Also store visual_code as an attribute for direct lookup
      if (data.visual_code) {
        newAttrs.push({ id: Math.random().toString(), key: "visual_code", value: data.visual_code });
      }
      setCustomAttrs(newAttrs);
    } else if (data.visual_code) {
      setCustomAttrs([{ id: Math.random().toString(), key: "visual_code", value: data.visual_code }]);
    }

    if (photoUri && !images.includes(photoUri)) {
      setImages((prev) => [...prev, photoUri].slice(0, 4));
    }

    Alert.alert(
      "AI Autofill Complete ✨",
      `Details for "${data.name}" filled. Visual Code: ${data.visual_code || "Auto"} — saved for image search!`
    );
  };

  const handleAutoSKU = () => {
    const prefix = name ? name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() : "SKU";
    setSku(`${prefix}-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const handleSave = async () => {
    if (!name.trim() || name.trim().length < 2) return Alert.alert("Required", "Product name must be at least 2 characters.");
    if (!categoryId) return Alert.alert("Required", "Please select a category.");
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) return Alert.alert("Required", "Please enter a valid selling price.");
    const numStock = parseInt(stock, 10);
    if (isNaN(numStock) || numStock < 0) return Alert.alert("Required", "Please enter valid initial stock.");

    const finalSKU = sku.trim() || `${name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const attrMap: Record<string, string> = {};
    customAttrs.forEach((a) => {
      if (a.key.trim() && a.value.trim()) attrMap[a.key.trim()] = a.value.trim();
    });
    const tagsArr = tags.split(",").map((t) => t.trim()).filter(Boolean);

    try {
      setIsUploading(true);
      let finalImages: string[] = [];
      if (images.length > 0) {
        finalImages = await uploadProductImages(images);
      }

      addMutation.mutate(
        {
          name: name.trim(),
          sku: finalSKU,
          category_id: categoryId,
          price: numPrice,
          stock_quantity: numStock,
          cost_price: parseFloat(costPrice) || undefined,
          compare_price: parseFloat(comparePrice) || undefined,
          min_stock: parseInt(minStock, 10) || 1,
          weight: parseFloat(weight) || undefined,
          description: description.trim() || undefined,
          images: finalImages.length > 0 ? finalImages : undefined,
          attributes: Object.keys(attrMap).length > 0 ? attrMap : undefined,
          tags: tagsArr.length > 0 ? tagsArr : undefined,
        },
        {
          onSuccess: () => Alert.alert("Success", `${name} added to catalog with photos!`, [{ text: "OK", onPress: () => router.back() }]),
          onError: (err: any) => Alert.alert("Error", err?.response?.data?.message || "Could not add product."),
        }
      );
    } catch (uploadErr: any) {
      Alert.alert("Photo Upload Failed", uploadErr.message || "Could not upload product images to Cloudflare R2.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ScreenWrapper style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>CATALOG SETUP</Text>
            <Text style={[styles.title, { color: colors.text }]}>Add product</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>Create a sell-ready catalog item.</Text>
          </View>
          <View style={[styles.progressPill, { backgroundColor: colors.primaryLight }]}>
            <PackagePlus size={15} color={colors.primary} />
            <Text style={[styles.progressText, { color: colors.primary }]}>{requiredFieldsComplete}/4</Text>
          </View>
        </View>

        {/* 📸 AI Superpower: 1-Tap Packet Scanner */}
        <Pressable
          onPress={() => setIsAiScanOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Scan product package with AI"
          style={({ pressed }) => [styles.aiScanBanner, pressed && styles.pressed]}
        >
          <View style={styles.aiSparkleIcon}>
            <Sparkles size={20} color="#ffffff" />
          </View>
          <View style={styles.aiScanTextCol}>
            <Text style={styles.aiScanTitle}>📸 1-Tap AI Packet Auto-Scan</Text>
            <Text style={styles.aiScanSub}>
              Snap packet photo to autofill MRP, brand, weight & title instantly
            </Text>
          </View>
        </Pressable>

        <Text style={[styles.formSectionLabel, { color: colors.text }]}>Basic product details</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.text }]}
          placeholder="Product Name (e.g. Tata Salt 1kg) *"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />

        <View style={styles.skuRow}>
          <TextInput
            style={[styles.input, { flex: 1, backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.text }]}
            placeholder="Barcode / SKU *"
            placeholderTextColor={colors.textMuted}
            value={sku}
            onChangeText={setSku}
          />
          <Pressable accessibilityRole="button" onPress={handleAutoSKU} style={[styles.autoBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Wand2 size={14} color={colors.primary} />
            <Text style={[styles.autoText, { color: colors.primary }]}>Auto</Text>
          </Pressable>
        </View>

        <ProductCategorySelector selectedCategoryId={categoryId} onSelectCategory={setCategoryId} />
        <ProductPricingSection price={price} setPrice={setPrice} costPrice={costPrice} setCostPrice={setCostPrice} comparePrice={comparePrice} setComparePrice={setComparePrice} />
        <ProductStockSection stock={stock} setStock={setStock} minStock={minStock} setMinStock={setMinStock} weight={weight} setWeight={setWeight} images={images} setImages={setImages} />
        <ProductAttributesSection attributes={customAttrs} setAttributes={setCustomAttrs} tags={tags} setTags={setTags} />

        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.text }]}
          placeholder="Product Description (optional)"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={2}
          value={description}
          onChangeText={setDescription}
        />

      </ScrollView>

      <View style={[styles.saveBar, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <View style={styles.saveHintBlock}>
          <Text style={[styles.saveHint, { color: colors.textMuted }]}>Required fields</Text>
          <Text style={[styles.saveProgress, { color: colors.text }]}>{requiredFieldsComplete}/4 complete</Text>
        </View>
        <Button
          title={isUploading ? "Uploading..." : "Save product"}
          variant="primary"
          size="md"
          isLoading={addMutation.isPending || isUploading}
          disabled={addMutation.isPending || isUploading}
          onPress={handleSave}
          style={styles.submitBtn}
        />
      </View>

      <AIScanProductModal
        visible={isAiScanOpen}
        onClose={() => setIsAiScanOpen(false)}
        onApply={handleApplyAiScan}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  scroll: { paddingTop: 14, paddingBottom: 126, gap: 8 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  headerCopy: { flex: 1 },
  eyebrow: { fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  title: { fontSize: 24, fontWeight: "900", marginTop: 2 },
  subtitle: { fontSize: 11, marginTop: 2 },
  progressPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 10 },
  progressText: { fontSize: 11, fontWeight: "900" },
  formSectionLabel: { fontSize: 15, fontWeight: "800", marginTop: 4, marginBottom: 1 },
  pressed: { opacity: 0.84, transform: [{ scale: 0.985 }] },
  aiScanBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#7c3aed",
    padding: 12,
    borderRadius: 14,
    marginBottom: 4,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  aiSparkleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  aiScanTextCol: { flex: 1 },
  aiScanTitle: { color: "#ffffff", fontSize: 13, fontWeight: "800" },
  aiScanSub: { color: "rgba(255, 255, 255, 0.85)", fontSize: 11, marginTop: 1 },
  input: { height: 42, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 13 },
  skuRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  autoBtn: { flexDirection: "row", alignItems: "center", gap: 4, height: 42, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },
  autoText: { fontSize: 12, fontWeight: "700" },
  textArea: { height: 60, textAlignVertical: "top", paddingTop: 8 },
  saveBar: { flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingTop: 10, paddingBottom: 8, marginBottom: Platform.OS === "ios" ? 76 : 72, shadowColor: "#0f172a", shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 6, zIndex: 5 },
  saveHintBlock: { minWidth: 82 },
  saveHint: { fontSize: 9, fontWeight: "700" },
  saveProgress: { fontSize: 12, fontWeight: "900", marginTop: 2 },
  submitBtn: { flex: 1 },
});
export default function AddProductScreen() {
  return (
    <ErrorBoundary fallbackTitle="Unable to load Add Product">
      <AddProductContent />
    </ErrorBoundary>
  );
}
