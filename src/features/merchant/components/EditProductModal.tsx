import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Switch,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Button } from "@/components/Button";
import { resolveImageUrl } from "@/components/AppImage";
import { useUpdateProduct } from "../api/useAddProduct";
import { uploadProductImages } from "../services/imageUpload";
import { LowStockItem } from "../types";
import {
  Pencil,
  X,
  Check,
  Images,
  Plus,
  Camera,
  Trash2,
} from "lucide-react-native";

export interface CustomAttributeItem {
  key: string;
  value: string;
}

interface EditProductModalProps {
  visible: boolean;
  item: LowStockItem | any | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  visible,
  item,
  onClose,
  onSuccess,
}) => {
  const { colors, isDark } = useThemeColor();

  // Basic Info
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [customAttributes, setCustomAttributes] = useState<CustomAttributeItem[]>([]);

  // Pricing & Bargain
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [floorPrice, setFloorPrice] = useState("");
  const [allowBargain, setAllowBargain] = useState(true);

  // Stock & Weight
  const [stock, setStock] = useState("");
  const [threshold, setThreshold] = useState("");
  const [weight, setWeight] = useState("");

  // Status & Promotion
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Media
  const [images, setImages] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const updateMutation = useUpdateProduct();

  useEffect(() => {
    if (item) {
      setName(item.product_name || item.name || "");
      setSku(item.sku || "");
      setDescription(item.description || "");

      const attrs = (item as any).attributes || {};
      const customAttrList: CustomAttributeItem[] = Object.entries(attrs)
        .filter(([k]) => k !== "variants" && k !== "sizes")
        .map(([k, v]) => ({
          key: k,
          value: String(v || ""),
        }));
      setCustomAttributes(customAttrList);

      setPrice(item.price !== undefined && item.price !== null ? String(item.price) : "0");
      setCostPrice(item.cost_price ? String(item.cost_price) : "");
      setComparePrice(item.compare_price ? String(item.compare_price) : "");
      setFloorPrice(item.floor_price ? String(item.floor_price) : "");
      setAllowBargain(item.allow_bargain !== false);

      setStock(
        item.current_stock !== undefined && item.current_stock !== null
          ? String(item.current_stock)
          : item.stock_quantity !== undefined && item.stock_quantity !== null
          ? String(item.stock_quantity)
          : "0"
      );
      setThreshold(
        item.low_stock_threshold !== undefined && item.low_stock_threshold !== null
          ? String(item.low_stock_threshold)
          : item.min_stock !== undefined && item.min_stock !== null
          ? String(item.min_stock)
          : "5"
      );
      setWeight(item.weight ? String(item.weight) : "");

      setIsActive(item.is_active !== false);
      setIsFeatured(item.is_featured === true);

      // Extract existing photos array (Max 4)
      const existingImages: string[] =
        Array.isArray(item.images) && item.images.length > 0
          ? item.images
          : item.image_url
          ? [item.image_url]
          : [];
      setImages(existingImages.filter(Boolean).slice(0, 4));
    }
  }, [item, visible]);

  if (!visible || !item) return null;

  // 📸 Multi-Selection Gallery Picker
  const handlePickMultiGallery = async () => {
    const remainingSlots = 4 - images.length;
    if (remainingSlots <= 0) {
      return Alert.alert("Maximum 4 Photos", "You can upload a maximum of 4 product photos.");
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        return Alert.alert("Permission Required", "Gallery permission is required to choose photos.");
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
        quality: 0.75,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newUris = result.assets.map((a) => a.uri).filter(Boolean);
        setImages((prev) => [...prev, ...newUris].slice(0, 4));
      }
    } catch (err: any) {
      Alert.alert("Gallery Error", err?.message || "Unable to pick images.");
    }
  };

  // 📷 Camera Capture
  const handleTakePhoto = async () => {
    if (images.length >= 4) {
      return Alert.alert("Maximum 4 Photos", "You can upload a maximum of 4 product photos.");
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        return Alert.alert("Permission Required", "Camera permission is required to take photos.");
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.75,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setImages((prev) => [...prev, result.assets[0].uri].slice(0, 4));
      }
    } catch (err: any) {
      Alert.alert("Camera Error", err?.message || "Unable to capture photo.");
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddCustomAttr = () => {
    setCustomAttributes((prev) => [...prev, { key: "", value: "" }]);
  };

  const handleUpdateCustomAttr = (index: number, field: "key" | "value", text: string) => {
    setCustomAttributes((prev) => {
      const next = [...prev];
      next[index][field] = text;
      return next;
    });
  };

  const handleRemoveCustomAttr = (index: number) => {
    setCustomAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (isUploadingImages || updateMutation.isPending) return;

    if (!name.trim()) return Alert.alert("Required", "Product Name is required.");

    const numericFields = [
      { label: "selling price", value: price, required: true },
      { label: "cost price", value: costPrice },
      { label: "original MRP", value: comparePrice },
      { label: "floor price", value: floorPrice },
      { label: "stock quantity", value: stock, required: true },
      { label: "alert threshold", value: threshold, required: true },
      { label: "weight", value: weight },
    ];

    for (const field of numericFields) {
      if (!field.value.trim() && !field.required) continue;
      const parsedValue = Number(field.value);
      if (!Number.isFinite(parsedValue) || parsedValue < 0) {
        return Alert.alert("Invalid value", `Enter a valid non-negative ${field.label}.`);
      }
    }

    const activeProductId = item?.product_id || item?.id || "";
    if (!activeProductId) return Alert.alert("Error", "Product ID is missing.");

    setIsUploadingImages(true);
    let finalUploadedImages: string[] = [];

    try {
      const existingServerUrls = images.filter(
        (img) => img.startsWith("http://") || img.startsWith("https://") || img.startsWith("/images/")
      );
      const newLocalUris = images.filter(
        (img) => !img.startsWith("http://") && !img.startsWith("https://") && !img.startsWith("/images/")
      );

      if (newLocalUris.length > 0) {
        const newUploadedUrls = await uploadProductImages(newLocalUris);
        finalUploadedImages = [...existingServerUrls, ...newUploadedUrls];
      } else {
        finalUploadedImages = existingServerUrls;
      }
    } catch (uploadErr: any) {
      setIsUploadingImages(false);
      return Alert.alert(
        "Photo Upload Failed",
        uploadErr?.message || "Failed to upload new product photos. Check connection."
      );
    } finally {
      setIsUploadingImages(false);
    }

    const customAttrsObject: Record<string, string> = {};
    customAttributes.forEach((attr) => {
      if (attr.key.trim() && attr.value.trim()) {
        customAttrsObject[attr.key.trim()] = attr.value.trim();
      }
    });

    updateMutation.mutate(
      {
        id: activeProductId,
        payload: {
          name: name.trim(),
          sku: sku.trim() || undefined,
          description: description.trim() || undefined,

          price: Number(price),
          cost_price: costPrice ? Number(costPrice) : undefined,
          compare_price: comparePrice ? Number(comparePrice) : undefined,
          floor_price: floorPrice ? Number(floorPrice) : undefined,
          allow_bargain: allowBargain,

          stock_quantity: Number(stock) >= 0 ? Number(stock) : 0,
          min_stock: Number(threshold) >= 0 ? Number(threshold) : 5,
          weight: weight ? Number(weight) : undefined,

          is_active: isActive,
          is_featured: isFeatured,

          attributes: customAttrsObject,
          images: finalUploadedImages,
        },
      },
      {
        onSuccess: () => {
          Alert.alert("Product Saved 📝", `"${name}" updated successfully!`);
          onSuccess?.();
          onClose();
        },
        onError: (err: any) => {
          Alert.alert("Update Failed", err?.message || "Could not save product changes.");
        },
      }
    );
  };

  const isSaving = updateMutation.isPending || isUploadingImages;
  const handleClose = () => {
    if (!isSaving) onClose();
  };

  const sellingPriceValue = Number(price);
  const costPriceValue = Number(costPrice);
  const comparePriceValue = Number(comparePrice);
  const floorPriceValue = Number(floorPrice);
  const hasValidSellingPrice = Number.isFinite(sellingPriceValue) && sellingPriceValue > 0;
  const marginPercentage =
    hasValidSellingPrice && costPriceValue >= 0
      ? ((sellingPriceValue - costPriceValue) / sellingPriceValue) * 100
      : null;
  const discountPercentage =
    hasValidSellingPrice && comparePriceValue > sellingPriceValue
      ? ((comparePriceValue - sellingPriceValue) / comparePriceValue) * 100
      : null;
  const pricingWarning =
    costPriceValue > sellingPriceValue && hasValidSellingPrice
      ? "Selling below cost"
      : floorPriceValue > sellingPriceValue && hasValidSellingPrice
      ? "Floor price exceeds selling price"
      : null;
  const stockValue = Number(stock);
  const thresholdValue = Number(threshold);
  const hasValidStock = Number.isFinite(stockValue) && stockValue >= 0;
  const stockStatus =
    !hasValidStock || stockValue === 0
      ? { label: "Out of stock", color: "#dc2626", background: "#fee2e2" }
      : stockValue <= thresholdValue
      ? { label: "Low stock", color: "#b45309", background: "#fef3c7" }
      : { label: "Healthy stock", color: "#15803d", background: "#dcfce7" };
  const profitPerUnit =
    hasValidSellingPrice && Number.isFinite(costPriceValue) && costPriceValue >= 0
      ? sellingPriceValue - costPriceValue
      : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: "rgba(124, 58, 237, 0.12)" }]}>
                <Pencil size={18} color="#7c3aed" />
              </View>
              <View style={styles.titleBlock}>
                <Text style={[styles.title, { color: colors.text }]}>Edit product</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
                  Update details, pricing and stock
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityLabel="Close edit product dialog"
              accessibilityRole="button"
              disabled={isSaving}
              onPress={handleClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            contentContainerStyle={styles.scroll}
          >
            {/* 📸 Photos Gallery Picker */}
            <View style={styles.gallerySection}>
              <View style={styles.galleryHeader}>
                <Text style={[styles.label, { color: colors.textMuted }]}>
                  PRODUCT PHOTOS ({images.length}/4)
                </Text>

                <View style={styles.uploadBtnRow}>
                  <Pressable accessibilityLabel="Take product photo" accessibilityRole="button" onPress={handleTakePhoto} style={[styles.miniPickBtn, { backgroundColor: "rgba(37, 99, 235, 0.12)" }]}>
                    <Camera size={13} color="#2563eb" />
                    <Text style={[styles.miniPickText, { color: "#2563eb" }]}>Camera</Text>
                  </Pressable>

                  <Pressable accessibilityLabel="Choose product photos from gallery" accessibilityRole="button" onPress={handlePickMultiGallery} style={[styles.miniPickBtn, { backgroundColor: "rgba(124, 58, 237, 0.12)" }]}>
                    <Images size={13} color="#7c3aed" />
                    <Text style={[styles.miniPickText, { color: "#7c3aed" }]}>Gallery</Text>
                  </Pressable>
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
                {images.length === 0 && (
                  <View style={[styles.emptyMediaState, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
                    <Images size={18} color={colors.textMuted} />
                    <Text style={[styles.emptyMediaText, { color: colors.textMuted }]}>Add up to 4 product photos</Text>
                  </View>
                )}
                {images.map((imgUri, idx) => (
                  <View key={idx} style={styles.thumbWrapper}>
                    <Image source={{ uri: resolveImageUrl(imgUri) }} style={styles.thumbImage} contentFit="cover" />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove product photo ${idx + 1}`}
                      onPress={() => handleRemoveImage(idx)}
                      style={styles.removeIconBtn}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <X size={12} color="#fff" />
                    </Pressable>
                  </View>
                ))}

                {images.length < 4 && (
                  <Pressable
                    accessibilityLabel="Add product photo"
                    accessibilityRole="button"
                    onPress={handlePickMultiGallery}
                    style={[styles.addThumbBtn, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}
                  >
                    <Plus size={20} color="#7c3aed" />
                    <Text style={styles.addThumbText}>+ Photo</Text>
                  </Pressable>
                )}
              </ScrollView>
            </View>

            {/* 📝 Section 1: Basic Details */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionHeader}>BASIC PRODUCT INFO</Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>PRODUCT TITLE *</Text>
                <TextInput
                  accessibilityLabel="Product title"
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Aashirvaad Chakki Atta 5kg"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>SKU / BARCODE CODE</Text>
                <TextInput
                  accessibilityLabel="SKU or barcode"
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
                  value={sku}
                  onChangeText={setSku}
                  placeholder="SKU or Barcode Number"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>PRODUCT DESCRIPTION</Text>
                <TextInput
                  accessibilityLabel="Product description"
                  style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  placeholder="Details, ingredients, usage notes..."
                  placeholderTextColor={colors.textMuted}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* ⚙️ Custom Attributes (JSONB Key-Value Builder) */}
            <View style={styles.sectionBox}>
              <View style={styles.galleryHeader}>
                <Text style={styles.sectionHeader}>CUSTOM SPECIFICATIONS (JSONB KEY-VALUE)</Text>
                <Pressable onPress={handleAddCustomAttr} style={[styles.miniPickBtn, { backgroundColor: "rgba(37, 99, 235, 0.12)" }]}>
                  <Plus size={13} color="#2563eb" />
                  <Text style={[styles.miniPickText, { color: "#2563eb" }]}>+ Add Field</Text>
                </Pressable>
              </View>

              <Text style={[styles.subHint, { color: colors.textMuted }]}>
                Add custom specs like Fabric: Cotton, Sleeve: Full, Warranty: 1 Year, etc.
              </Text>

              {customAttributes.map((attr, idx) => (
                <View key={idx} style={[styles.variantRow, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: colors.textMuted }]}>KEY (e.g. Fabric)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.text }]}
                      value={attr.key}
                      onChangeText={(txt) => handleUpdateCustomAttr(idx, "key", txt)}
                      placeholder="Key name"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <View style={{ flex: 1.5 }}>
                    <Text style={[styles.label, { color: colors.textMuted }]}>VALUE (e.g. Cotton)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.text }]}
                      value={attr.value}
                      onChangeText={(txt) => handleUpdateCustomAttr(idx, "value", txt)}
                      placeholder="Value"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <Pressable onPress={() => handleRemoveCustomAttr(idx)} style={styles.removeVariantBtn}>
                    <Trash2 size={13} color="#ef4444" />
                  </Pressable>
                </View>
              ))}
            </View>

            {/* 💰 Section 2: Pricing, MRP & Discounts */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionHeader}>PRICING & BARGAINING</Text>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>SELLING PRICE (₹) *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                    placeholder="Selling Price"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>ORIGINAL MRP (₹)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
                    value={comparePrice}
                    onChangeText={setComparePrice}
                    keyboardType="numeric"
                    placeholder="MRP (for % OFF)"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>WHOLESALE COST (₹)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
                    value={costPrice}
                    onChangeText={setCostPrice}
                    keyboardType="numeric"
                    placeholder="Cost Price"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>FLOOR PRICE (₹)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
                    value={floorPrice}
                    onChangeText={setFloorPrice}
                    keyboardType="numeric"
                    placeholder="Lowest Bargain Price"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              {(marginPercentage !== null || discountPercentage !== null || pricingWarning) && (
                <View style={[styles.pricingInsight, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>LIVE PRICING INSIGHT</Text>
                  <View style={styles.insightRow}>
                    {profitPerUnit !== null && (
                      <View style={styles.insightMetric}>
                        <Text style={[styles.insightValue, { color: profitPerUnit < 0 ? "#dc2626" : "#16a34a" }]}>₹{profitPerUnit.toFixed(2)}</Text>
                        <Text style={[styles.insightLabel, { color: colors.textMuted }]}>profit / unit</Text>
                      </View>
                    )}
                    {marginPercentage !== null && (
                      <View style={styles.insightMetric}>
                        <Text style={[styles.insightValue, { color: marginPercentage < 0 ? "#dc2626" : "#16a34a" }]}>
                          {marginPercentage.toFixed(1)}%
                        </Text>
                        <Text style={[styles.insightLabel, { color: colors.textMuted }]}>gross margin</Text>
                      </View>
                    )}
                    {discountPercentage !== null && (
                      <View style={styles.insightMetric}>
                        <Text style={[styles.insightValue, { color: "#2563eb" }]}>
                          {discountPercentage.toFixed(0)}% OFF
                        </Text>
                        <Text style={[styles.insightLabel, { color: colors.textMuted }]}>customer discount</Text>
                      </View>
                    )}
                  </View>
                  {pricingWarning && <Text style={styles.pricingWarning}>{pricingWarning}</Text>}
                </View>
              )}

              {/* Allow Bargain Switch */}
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.switchLabel, { color: colors.text }]}>Allow Bhav-Taav Bargaining</Text>
                  <Text style={[styles.switchSub, { color: colors.textMuted }]}>Let customers make price offers</Text>
                </View>
                <Switch
                  value={allowBargain}
                  onValueChange={setAllowBargain}
                  trackColor={{ false: "#d1d5db", true: "#c7d2fe" }}
                  thumbColor={allowBargain ? "#4f46e5" : "#f3f4f6"}
                />
              </View>
            </View>

            {/* 📦 Section 3: Inventory & Weight */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionHeader}>INVENTORY & WEIGHT</Text>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>EXACT STOCK QTY *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
                    value={stock}
                    onChangeText={setStock}
                    keyboardType="numeric"
                    placeholder="Current Stock"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>ALERT THRESHOLD</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
                    value={threshold}
                    onChangeText={setThreshold}
                    keyboardType="numeric"
                    placeholder="Alert limit"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>WEIGHT (KG)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  placeholder="e.g. 1.5 or 0.250"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={[styles.stockInsight, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
                <View style={styles.stockInsightHeader}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>STOCK HEALTH</Text>
                  <View style={[styles.stockBadge, { backgroundColor: stockStatus.background }]}>
                    <Text style={[styles.stockBadgeText, { color: stockStatus.color }]}>{stockStatus.label}</Text>
                  </View>
                </View>
                <Text style={[styles.insightLabel, { color: colors.textMuted }]}>
                  {hasValidStock ? `${stockValue} units available, alert at ${thresholdValue || 0}` : "Enter a valid stock quantity"}
                </Text>
              </View>
            </View>

            {/* 👁️ Section 4: Visibility & Promotion */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionHeader}>VISIBILITY & PROMOTION</Text>

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.switchLabel, { color: colors.text }]}>Active Product Status</Text>
                  <Text style={[styles.switchSub, { color: colors.textMuted }]}>Visible to shoppers in storefront</Text>
                </View>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: "#d1d5db", true: "#bbf7d0" }}
                  thumbColor={isActive ? "#16a34a" : "#f3f4f6"}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.switchLabel, { color: colors.text }]}>Featured Product Badge</Text>
                  <Text style={[styles.switchSub, { color: colors.textMuted }]}>Highlight on top shop banner</Text>
                </View>
                <Switch
                  value={isFeatured}
                  onValueChange={setIsFeatured}
                  trackColor={{ false: "#d1d5db", true: "#fef08a" }}
                  thumbColor={isFeatured ? "#eab308" : "#f3f4f6"}
                />
              </View>
            </View>

            <Button
              title={isSaving ? "Saving All Changes..." : "Save Product Details ✨"}
              variant="primary"
              size="md"
              isLoading={isSaving}
              disabled={isSaving}
              onPress={handleSave}
              leftIcon={<Check size={16} color="#fff" />}
              style={{ marginTop: 8, marginBottom: 12 }}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 16 },
  backdrop: { ...StyleSheet.absoluteFill },
  card: { width: "100%", maxWidth: 390, borderRadius: 20, borderWidth: 1, padding: 16, gap: 10, maxHeight: "88%", zIndex: 10 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconCircle: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  titleBlock: { flex: 1, gap: 1 },
  title: { fontSize: 16, fontWeight: "800" },
  subtitle: { fontSize: 10, fontWeight: "600" },
  closeBtn: { padding: 4 },
  scroll: { gap: 12 },
  sectionBox: { gap: 8, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: "rgba(0,0,0,0.06)" },
  sectionHeader: { fontSize: 10, fontWeight: "900", color: "#7c3aed", letterSpacing: 0.8 },
  gallerySection: { gap: 6 },
  galleryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  uploadBtnRow: { flexDirection: "row", gap: 6 },
  miniPickBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  miniPickText: { fontSize: 11, fontWeight: "700" },
  galleryRow: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  emptyMediaState: { height: 64, minWidth: 190, borderRadius: 12, borderWidth: 1, borderStyle: "dashed", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 12 },
  emptyMediaText: { fontSize: 10, fontWeight: "700" },
  thumbWrapper: { position: "relative" },
  thumbImage: { width: 64, height: 64, borderRadius: 12 },
  removeIconBtn: { position: "absolute", top: -4, right: -4, backgroundColor: "#ef4444", width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  addThumbBtn: { width: 64, height: 64, borderRadius: 12, borderWidth: 1.5, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 2 },
  addThumbText: { color: "#7c3aed", fontSize: 9, fontWeight: "800" },
  inputGroup: { gap: 4 },
  label: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  input: { height: 40, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 13, fontWeight: "600" },
  textArea: { minHeight: 60, borderRadius: 10, borderWidth: 1, padding: 10, fontSize: 12, fontWeight: "600" },
  row: { flexDirection: "row", gap: 10 },
  pricingInsight: { gap: 6, padding: 10, borderRadius: 10, borderWidth: 1 },
  insightTitle: { fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  insightRow: { flexDirection: "row", gap: 20 },
  insightMetric: { gap: 1 },
  insightValue: { fontSize: 14, fontWeight: "900" },
  insightLabel: { fontSize: 10 },
  pricingWarning: { color: "#dc2626", fontSize: 11, fontWeight: "800" },
  stockInsight: { gap: 5, padding: 10, borderRadius: 10, borderWidth: 1 },
  stockInsightHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stockBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  stockBadgeText: { fontSize: 10, fontWeight: "800" },
  variantRow: { flexDirection: "row", alignItems: "flex-end", gap: 6, padding: 8, borderRadius: 10, borderWidth: 1 },
  removeVariantBtn: { width: 32, height: 40, borderRadius: 8, backgroundColor: "rgba(239, 68, 68, 0.12)", alignItems: "center", justifyContent: "center", marginBottom: 1 },
  subHint: { fontSize: 11, marginBottom: 2 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 },
  switchLabel: { fontSize: 12, fontWeight: "700" },
  switchSub: { fontSize: 10, marginTop: 1 },
});
