import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { ApiResponse } from "@/types/api";

export interface CreateProductInput {
  name: string;
  sku: string;
  price: number;
  category_id: string;
  stock_quantity: number;
  cost_price?: number;
  compare_price?: number;
  floor_price?: number;
  allow_bargain?: boolean;
  min_stock?: number;
  low_stock_threshold?: number;
  description?: string;
  images?: string[];
  weight?: number;
  is_active?: boolean;
  is_featured?: boolean;
  tags?: string[];
  attributes?: Record<string, unknown>;
}

export interface CreatedProductResponse {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  cost_price?: number;
  compare_price?: number;
  category_id: string;
  images: string[];
  stock_quantity: number;
}

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateProductInput) => {
      const res = await apiClient.post<ApiResponse<CreatedProductResponse>>(
        "/products",
        payload
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["merchant", "products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["shop", "me", "digest"] });
    },
  });
};

export const useUpdateProduct = (defaultProductId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id?: string;
      payload: Partial<CreateProductInput>;
    }) => {
      const targetId = id || defaultProductId;
      if (!targetId) throw new Error("Product ID is required for update.");
      const res = await apiClient.put<ApiResponse<CreatedProductResponse>>(
        `/products/${targetId}`,
        payload
      );
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      const targetId = variables.id || defaultProductId;
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["merchant", "products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "low-stock"] });
      if (targetId) {
        queryClient.invalidateQueries({ queryKey: ["product", targetId] });
      }
      queryClient.invalidateQueries({ queryKey: ["shop", "me", "digest"] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const res = await apiClient.delete<ApiResponse<null>>(`/products/${productId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["merchant", "products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["shop", "me", "digest"] });
    },
  });
};

export interface BulkImportItem {
  name: string;
  sku?: string;
  price: number;
  cost_price?: number;
  stock_quantity?: number;
  min_stock?: number;
  description?: string;
}

export interface BulkImportResponse {
  total_rows: number;
  imported_count: number;
  skipped_count: number;
  errors: string[];
}

export const useBulkImportProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: BulkImportItem[]) => {
      const res = await apiClient.post<ApiResponse<BulkImportResponse>>(
        "/shops/me/products/bulk-import",
        items
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["merchant", "products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["shop", "me", "digest"] });
    },
  });
};
