import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import { ApiResponse } from "@/types/api";
import {
  Reservation,
  CreateReservationRequest,
  ReservationPaginationResponse,
} from "@/features/reservations/types";

export const useUserReservations = () => {
  return useQuery({
    queryKey: ["userReservations"],
    queryFn: async () => {
      const response = await apiClient.get<
        ApiResponse<ReservationPaginationResponse | Reservation[]>
      >(Endpoints.RESERVATIONS.USER_LIST);

      const raw = response.data.data;
      if (Array.isArray(raw)) {
        return raw;
      }
      return raw?.reservations || [];
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateReservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateReservationRequest) => {
      const response = await apiClient.post<ApiResponse<Reservation>>(
        Endpoints.RESERVATIONS.CREATE,
        request
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userReservations"] });
    },
  });
};

export const useCancelReservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reservationId: string) => {
      const response = await apiClient.post<ApiResponse<void>>(
        Endpoints.RESERVATIONS.CANCEL(reservationId)
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userReservations"] });
    },
  });
};
