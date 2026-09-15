import React from "react";
import { StyleSheet, View } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react-native";

import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import {
  forgotPasswordSchema,
  ForgotPasswordFormData,
} from "@/features/auth/schemas";
import { useThemeColor } from "@/hooks/useThemeColor";

interface ForgotPasswordFormProps {
  onSubmit: (data: ForgotPasswordFormData) => void;
  isLoading: boolean;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSubmit,
  isLoading,
}) => {
  const { colors } = useThemeColor();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Email Address"
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
            leftIcon={<Mail size={20} color={colors.textMuted} />}
          />
        )}
      />

      {/* 💡 TWEAK HERE: Button label or style */}
      <Button
        title="Send Reset Instructions"
        size="lg"
        isLoading={isLoading}
        onPress={handleSubmit(onSubmit)}
        style={styles.submitButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  form: {
    width: "100%",
  },
  submitButton: {
    marginTop: 8,
  },
});
