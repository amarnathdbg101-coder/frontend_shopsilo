import React from "react";
import { StyleSheet, View } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock } from "lucide-react-native";

import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { loginSchema, LoginFormData } from "@/features/auth/schemas";
import { useThemeColor } from "@/hooks/useThemeColor";

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => void;
  isLoading: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, isLoading }) => {
  const { colors } = useThemeColor();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
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
            autoComplete="email"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
            leftIcon={<Mail size={20} color={colors.textMuted} />}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
            leftIcon={<Lock size={20} color={colors.textMuted} />}
          />
        )}
      />

      <Button
        title="Sign In"
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

