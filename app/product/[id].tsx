import React, { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/Button";
import { LoadingState } from "@/components/LoadingState";
import { ReserveModal } from "@/features/reservations/components/ReserveModal";
import { BargainModal } from "@/features/products/components/BargainModal";
import { StockAlertModal } from "@/features/products/components/StockAlertModal";
import { ReportModal } from "@/features/catalog/components/ReportModal";
import { EditProductModal } from "@/features/merchant/components/EditProductModal";
import { ProductDetailTopBar } from "@/features/products/components/ProductDetailTopBar";
import { ProductDetailBody } from "@/features/products/components/ProductDetailBody";
import { ProductActionFooter } from "@/features/products/components/ProductActionFooter";
import { useProductDetail } from "@/features/catalog/api/useProductDetail";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useThemeColor();
  const { data: product, isLoading, error } = useProductDetail(id);

  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [isBargainModalOpen, setIsBargainModalOpen] = useState(false);
  const [isStockAlertModalOpen, setIsStockAlertModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [reservedSuccess, setReservedSuccess] = useState(false);

  if (isLoading) {
    return <LoadingState fullScreen message="Loading product details..." />;
  }

  if (error || !product) {
    return (
      <ScreenWrapper style={styles.centerContainer}>
        <Text style={[styles.errorTitle, { color: colors.text }]}>Product Not Found</Text>
        <Button title="Back to Catalog" onPress={() => router.back()} />
      </ScreenWrapper>
    );
  }

  return (
    <ErrorBoundary fallbackTitle="Unable to load Product">
      <ScreenWrapper>
        <ProductDetailTopBar
          title={product.name}
          onReportPress={() => setIsReportOpen(true)}
        />

        <ProductDetailBody product={product} />

        <ProductActionFooter
          product={product}
          reservedSuccess={reservedSuccess}
          onReserve={() => setIsReserveModalOpen(true)}
          onBargain={() => setIsBargainModalOpen(true)}
          onNotifyMe={() => setIsStockAlertModalOpen(true)}
          onEditProduct={() => setIsEditModalOpen(true)}
        />

        {isReserveModalOpen && (
          <ReserveModal
            product={product}
            visible={isReserveModalOpen}
            onClose={() => setIsReserveModalOpen(false)}
            onSuccess={() => setReservedSuccess(true)}
          />
        )}

        {isBargainModalOpen && (
          <BargainModal
            product={product}
            visible={isBargainModalOpen}
            onClose={() => setIsBargainModalOpen(false)}
          />
        )}

        {isStockAlertModalOpen && (
          <StockAlertModal
            product={product}
            visible={isStockAlertModalOpen}
            onClose={() => setIsStockAlertModalOpen(false)}
          />
        )}

        <EditProductModal
          visible={isEditModalOpen}
          item={product}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["product", id] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["merchant", "products"] });
          }}
        />

        <ReportModal
          visible={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          targetType="product"
          targetId={product.id}
          targetName={product.name}
        />
      </ScreenWrapper>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
});
